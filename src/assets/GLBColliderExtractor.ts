import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import type {
  ConvexColliderData,
  MeshColliderData,
  Vec3Tuple,
} from "../types/world";

export type GLBColliderMode = "trimesh" | "convex";

export interface GLBImportOptions {
  mode: GLBColliderMode;
  detail: number;
}

interface GeometryData {
  vertices: Vec3Tuple[];
  indices: number[];
}

const MAX_SOURCE_TRIANGLES = 500_000;
const MAX_PROXY_TRIANGLES = 100_000;
const MAX_EMBEDDED_FILE_BYTES = 25 * 1024 * 1024;

export async function extractWorldObjectFromGLB(
  file: File,
  id: string,
  position: Vec3Tuple,
  options: GLBImportOptions,
): Promise<MeshColliderData | ConvexColliderData> {
  if (file.size > MAX_EMBEDDED_FILE_BYTES) {
    throw new Error("GLB exceeds the 25 MB embedded-asset limit.");
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(objectUrl);
    const source = collectGeometry(gltf.scene);
    const detail = THREE.MathUtils.clamp(options.detail, 0.05, 1);
    const visualUrl = await readFileAsDataUrl(file);

    if (options.mode === "convex") {
      const clustered = clusterPoints(source.vertices, detail);
      const centered = centerVertices(clustered);
      if (centered.vertices.length < 4) {
        throw new Error("GLB does not contain enough distinct vertices for a convex hull.");
      }
      const collider: ConvexColliderData = {
        id,
        type: "convex",
        position,
        rotationDeg: [0, 0, 0],
        scale3: [1, 1, 1],
        vertices: centered.vertices,
        sourceName: file.name,
        behavior: { mode: "solid" },
        body: { mode: "fixed" },
        visual: {
          url: visualUrl,
          sourceName: file.name,
          visible: true,
        },
      };
      return collider;
    }

    const simplified = simplifyTriMesh(source, detail);
    const centered = centerGeometry(simplified);
    const collider: MeshColliderData = {
      id,
      type: "mesh",
      position,
      rotationDeg: [0, 0, 0],
      scale3: [1, 1, 1],
      vertices: centered.vertices,
      indices: centered.indices,
      sourceName: file.name,
      behavior: { mode: "solid" },
      body: { mode: "fixed" },
      visual: {
        url: visualUrl,
        sourceName: file.name,
        visible: true,
      },
    };
    return collider;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function collectGeometry(root: THREE.Object3D): GeometryData {
  root.updateMatrixWorld(true);
  const rootInverse = root.matrixWorld.clone().invert();
  const vertices: Vec3Tuple[] = [];
  const indices: number[] = [];
  const transformed = new THREE.Vector3();
  let triangleCount = 0;

  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const geometry = object.geometry as THREE.BufferGeometry;
    const attribute = geometry.getAttribute("position");
    if (!attribute) return;

    object.updateWorldMatrix(true, false);
    const matrix = rootInverse.clone().multiply(object.matrixWorld);
    const baseIndex = vertices.length;

    for (let index = 0; index < attribute.count; index += 1) {
      transformed
        .set(attribute.getX(index), attribute.getY(index), attribute.getZ(index))
        .applyMatrix4(matrix);
      vertices.push([transformed.x, transformed.y, transformed.z]);
    }

    if (geometry.index) {
      for (let index = 0; index + 2 < geometry.index.count; index += 3) {
        indices.push(
          baseIndex + geometry.index.getX(index),
          baseIndex + geometry.index.getX(index + 1),
          baseIndex + geometry.index.getX(index + 2),
        );
        triangleCount += 1;
      }
    } else {
      for (let index = 0; index + 2 < attribute.count; index += 3) {
        indices.push(baseIndex + index, baseIndex + index + 1, baseIndex + index + 2);
        triangleCount += 1;
      }
    }

    if (triangleCount > MAX_SOURCE_TRIANGLES) {
      throw new Error(
        `GLB contains more than ${MAX_SOURCE_TRIANGLES.toLocaleString()} triangles. Simplify it before import.`,
      );
    }
  });

  if (vertices.length < 3 || indices.length < 3) {
    throw new Error("GLB does not contain triangle mesh geometry.");
  }
  return { vertices, indices };
}

function simplifyTriMesh(source: GeometryData, detail: number): GeometryData {
  if (detail >= 0.999 && source.indices.length / 3 <= MAX_PROXY_TRIANGLES) {
    return source;
  }

  const clustered = clusterGeometry(source, detail);
  if (clustered.vertices.length < 3 || clustered.indices.length < 3) {
    return limitTriangles(source, MAX_PROXY_TRIANGLES);
  }
  return limitTriangles(clustered, MAX_PROXY_TRIANGLES);
}

function clusterGeometry(source: GeometryData, detail: number): GeometryData {
  const bounds = boundsFor(source.vertices);
  const targetVertices = Math.max(32, Math.round(source.vertices.length * detail));
  const resolution = Math.max(2, Math.round(Math.cbrt(targetVertices)));
  const extent = bounds.max.clone().sub(bounds.min);
  const cells = new Map<string, { index: number; sum: THREE.Vector3; count: number }>();
  const remap = new Uint32Array(source.vertices.length);

  source.vertices.forEach((vertex, sourceIndex) => {
    const key = gridKey(vertex, bounds.min, extent, resolution);
    let cell = cells.get(key);
    if (!cell) {
      cell = { index: cells.size, sum: new THREE.Vector3(), count: 0 };
      cells.set(key, cell);
    }
    cell.sum.add(new THREE.Vector3(vertex[0], vertex[1], vertex[2]));
    cell.count += 1;
    remap[sourceIndex] = cell.index;
  });

  const vertices: Vec3Tuple[] = Array.from(cells.values(), (cell) => {
    cell.sum.multiplyScalar(1 / cell.count);
    return [cell.sum.x, cell.sum.y, cell.sum.z];
  });
  const indices: number[] = [];
  const seen = new Set<string>();

  for (let index = 0; index + 2 < source.indices.length; index += 3) {
    const a = remap[source.indices[index] ?? 0] ?? 0;
    const b = remap[source.indices[index + 1] ?? 0] ?? 0;
    const c = remap[source.indices[index + 2] ?? 0] ?? 0;
    if (a === b || b === c || c === a) continue;
    const key = [a, b, c].sort((left, right) => left - right).join(":");
    if (seen.has(key)) continue;
    seen.add(key);
    indices.push(a, b, c);
  }

  return { vertices, indices };
}

function clusterPoints(vertices: readonly Vec3Tuple[], detail: number): Vec3Tuple[] {
  if (detail >= 0.999 && vertices.length <= 20_000) {
    return deduplicatePoints(vertices);
  }
  const bounds = boundsFor(vertices);
  const targetVertices = Math.max(32, Math.min(20_000, Math.round(vertices.length * detail)));
  const resolution = Math.max(2, Math.round(Math.cbrt(targetVertices)));
  const extent = bounds.max.clone().sub(bounds.min);
  const cells = new Map<string, { sum: THREE.Vector3; count: number }>();

  for (const vertex of vertices) {
    const key = gridKey(vertex, bounds.min, extent, resolution);
    let cell = cells.get(key);
    if (!cell) {
      cell = { sum: new THREE.Vector3(), count: 0 };
      cells.set(key, cell);
    }
    cell.sum.add(new THREE.Vector3(vertex[0], vertex[1], vertex[2]));
    cell.count += 1;
  }

  return Array.from(cells.values(), (cell) => {
    cell.sum.multiplyScalar(1 / cell.count);
    return [cell.sum.x, cell.sum.y, cell.sum.z];
  });
}

function deduplicatePoints(vertices: readonly Vec3Tuple[]): Vec3Tuple[] {
  const seen = new Set<string>();
  const result: Vec3Tuple[] = [];
  for (const vertex of vertices) {
    const key = vertex.map((value) => value.toFixed(6)).join(":");
    if (seen.has(key)) continue;
    seen.add(key);
    result.push([vertex[0], vertex[1], vertex[2]]);
    if (result.length >= 20_000) break;
  }
  return result;
}

function limitTriangles(source: GeometryData, maximum: number): GeometryData {
  const triangleCount = source.indices.length / 3;
  if (triangleCount <= maximum) return source;
  const stride = Math.ceil(triangleCount / maximum);
  const indices: number[] = [];
  for (let triangle = 0; triangle < triangleCount; triangle += stride) {
    const offset = triangle * 3;
    indices.push(
      source.indices[offset] ?? 0,
      source.indices[offset + 1] ?? 0,
      source.indices[offset + 2] ?? 0,
    );
  }
  return { vertices: source.vertices, indices };
}

function centerGeometry(source: GeometryData): GeometryData {
  const centered = centerVertices(source.vertices);
  return { vertices: centered.vertices, indices: source.indices };
}

function centerVertices(vertices: readonly Vec3Tuple[]): {
  vertices: Vec3Tuple[];
  center: Vec3Tuple;
} {
  const bounds = boundsFor(vertices);
  const center = bounds.getCenter(new THREE.Vector3());
  return {
    vertices: vertices.map(
      (vertex): Vec3Tuple => [
        vertex[0] - center.x,
        vertex[1] - center.y,
        vertex[2] - center.z,
      ],
    ),
    center: [center.x, center.y, center.z],
  };
}

function boundsFor(vertices: readonly Vec3Tuple[]): THREE.Box3 {
  const bounds = new THREE.Box3();
  for (const vertex of vertices) {
    bounds.expandByPoint(new THREE.Vector3(vertex[0], vertex[1], vertex[2]));
  }
  return bounds;
}

function gridKey(
  vertex: Vec3Tuple,
  minimum: THREE.Vector3,
  extent: THREE.Vector3,
  resolution: number,
): string {
  const x = Math.min(
    resolution - 1,
    Math.floor(((vertex[0] - minimum.x) / Math.max(extent.x, 1e-6)) * resolution),
  );
  const y = Math.min(
    resolution - 1,
    Math.floor(((vertex[1] - minimum.y) / Math.max(extent.y, 1e-6)) * resolution),
  );
  const z = Math.min(
    resolution - 1,
    Math.floor(((vertex[2] - minimum.z) / Math.max(extent.z, 1e-6)) * resolution),
  );
  return `${x}:${y}:${z}`;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Unable to embed GLB visual asset."));
    });
    reader.addEventListener("error", () => reject(reader.error ?? new Error("Unable to read GLB.")));
    reader.readAsDataURL(file);
  });
}
