import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import type {
  DecompositionProgress,
  DecompositionStats,
} from "./decomposition/DecompositionProtocol";
import { decompositionWorkerClient } from "./decomposition/DecompositionWorkerClient";
import type {
  ProxyProgress,
  ProxySimplifierAlgorithm,
  ProxyTaskStats,
} from "./proxy/ProxyProtocol";
import { proxyWorkerClient } from "./proxy/ProxyWorkerClient";
import type {
  CompoundColliderData,
  ConvexColliderData,
  ConvexPartData,
  MeshColliderData,
  Vec3Tuple,
} from "../types/world";

export type GLBColliderMode = "trimesh" | "convex" | "decomposition";

export interface GLBImportOptions {
  mode: GLBColliderMode;
  detail: number;
  algorithm?: ProxySimplifierAlgorithm;
  maxHulls?: number;
  maxVerticesPerHull?: number;
  signal?: AbortSignal;
  onProgress?: (progress: ProxyProgress | DecompositionProgress) => void;
  onComplete?: (stats: ProxyTaskStats) => void;
  onDecompositionComplete?: (stats: DecompositionStats) => void;
}

interface GeometryData {
  vertices: Float32Array;
  indices: Uint32Array;
}

const MAX_SOURCE_TRIANGLES = 500_000;
const MAX_EMBEDDED_FILE_BYTES = 25 * 1024 * 1024;

export async function extractWorldObjectFromGLB(
  file: File,
  id: string,
  position: Vec3Tuple,
  options: GLBImportOptions,
): Promise<MeshColliderData | ConvexColliderData | CompoundColliderData> {
  if (file.size > MAX_EMBEDDED_FILE_BYTES) {
    throw new Error("GLB exceeds the 25 MB embedded-asset limit.");
  }
  throwIfAborted(options.signal);
  options.onProgress?.({ progress: 0.03, stage: "读取 GLB" });

  const objectUrl = URL.createObjectURL(file);
  try {
    const loader = new GLTFLoader();
    const [gltf, visualUrl] = await Promise.all([
      loader.loadAsync(objectUrl),
      readFileAsDataUrl(file, options.signal),
    ]);
    throwIfAborted(options.signal);
    options.onProgress?.({ progress: 0.1, stage: "合并 GLB 节点变换" });
    const source = collectGeometry(gltf.scene, options.signal);
    const detail = THREE.MathUtils.clamp(options.detail, 0.02, 1);
    const algorithm = options.mode === "convex" ? "cluster" : options.algorithm ?? "qem";
    const simplifyMode = options.mode === "convex" ? "convex" : "trimesh";

    const simplified = await proxyWorkerClient.simplify(
      {
        mode: simplifyMode,
        algorithm,
        detail,
        vertices: source.vertices,
        indices: source.indices,
      },
      (progress) => {
        const end = options.mode === "decomposition" ? 0.55 : 0.92;
        options.onProgress?.({
          progress: 0.14 + progress.progress * (end - 0.14),
          stage: progress.stage,
        });
      },
      options.signal,
    );
    throwIfAborted(options.signal);
    options.onComplete?.(simplified.stats);

    if (options.mode === "decomposition") {
      const decomposition = await decompositionWorkerClient.decompose(
        simplified.vertices,
        simplified.indices,
        {
          maxHulls: options.maxHulls ?? 8,
          maxVerticesPerHull: options.maxVerticesPerHull ?? 64,
        },
        (progress) => {
          options.onProgress?.({
            progress: 0.58 + progress.progress * 0.38,
            stage: progress.stage,
          });
        },
        options.signal,
      );
      throwIfAborted(options.signal);
      options.onDecompositionComplete?.(decomposition.stats);
      const parts = partsFromDecomposition(decomposition.vertices, decomposition.offsets);
      if (parts.length === 0) {
        throw new Error("GLB decomposition did not produce a valid convex part.");
      }
      const collider: CompoundColliderData = {
        id,
        type: "compound",
        position,
        rotationDeg: [0, 0, 0],
        scale3: [1, 1, 1],
        parts,
        sourceName: file.name,
        behavior: { mode: "solid" },
        body: { mode: "fixed" },
        visual: {
          url: visualUrl,
          sourceName: file.name,
          visible: true,
        },
      };
      options.onProgress?.({ progress: 1, stage: `Compound Collider 已完成 · ${parts.length} Hulls` });
      return collider;
    }

    options.onProgress?.({ progress: 0.97, stage: "创建世界对象" });
    if (options.mode === "convex") {
      const vertices = tuplesFromVertices(simplified.vertices);
      if (vertices.length < 4) {
        throw new Error("GLB does not contain enough distinct vertices for a convex hull.");
      }
      const collider: ConvexColliderData = {
        id,
        type: "convex",
        position,
        rotationDeg: [0, 0, 0],
        scale3: [1, 1, 1],
        vertices,
        sourceName: file.name,
        behavior: { mode: "solid" },
        body: { mode: "fixed" },
        visual: {
          url: visualUrl,
          sourceName: file.name,
          visible: true,
        },
      };
      options.onProgress?.({ progress: 1, stage: "Convex Hull 已完成" });
      return collider;
    }

    const collider: MeshColliderData = {
      id,
      type: "mesh",
      position,
      rotationDeg: [0, 0, 0],
      scale3: [1, 1, 1],
      vertices: tuplesFromVertices(simplified.vertices),
      indices: Array.from(simplified.indices),
      sourceName: file.name,
      behavior: { mode: "solid" },
      body: { mode: "fixed" },
      visual: {
        url: visualUrl,
        sourceName: file.name,
        visible: true,
      },
    };
    options.onProgress?.({ progress: 1, stage: "TriMesh 已完成" });
    return collider;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function collectGeometry(root: THREE.Object3D, signal?: AbortSignal): GeometryData {
  root.updateMatrixWorld(true);
  const rootInverse = root.matrixWorld.clone().invert();
  const vertices: number[] = [];
  const indices: number[] = [];
  const transformed = new THREE.Vector3();
  let triangleCount = 0;

  root.traverse((object) => {
    throwIfAborted(signal);
    if (!(object instanceof THREE.Mesh)) return;
    const geometry = object.geometry as THREE.BufferGeometry;
    const attribute = geometry.getAttribute("position");
    if (!attribute) return;

    object.updateWorldMatrix(true, false);
    const matrix = rootInverse.clone().multiply(object.matrixWorld);
    const baseIndex = vertices.length / 3;

    for (let index = 0; index < attribute.count; index += 1) {
      transformed
        .set(attribute.getX(index), attribute.getY(index), attribute.getZ(index))
        .applyMatrix4(matrix);
      vertices.push(transformed.x, transformed.y, transformed.z);
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

  if (vertices.length < 9 || indices.length < 3) {
    throw new Error("GLB does not contain triangle mesh geometry.");
  }
  return {
    vertices: new Float32Array(vertices),
    indices: new Uint32Array(indices),
  };
}

function partsFromDecomposition(
  vertices: Float32Array,
  offsets: Uint32Array,
): ConvexPartData[] {
  const parts: ConvexPartData[] = [];
  for (let index = 0; index + 1 < offsets.length; index += 1) {
    const start = (offsets[index] ?? 0) * 3;
    const end = (offsets[index + 1] ?? 0) * 3;
    if (end <= start) continue;
    const part = tuplesFromVertices(vertices.subarray(start, end));
    if (part.length >= 4) parts.push({ vertices: part });
  }
  return parts;
}

function tuplesFromVertices(vertices: Float32Array): Vec3Tuple[] {
  const output: Vec3Tuple[] = [];
  for (let index = 0; index + 2 < vertices.length; index += 3) {
    output.push([
      vertices[index] ?? 0,
      vertices[index + 1] ?? 0,
      vertices[index + 2] ?? 0,
    ]);
  }
  return output;
}

function readFileAsDataUrl(file: File, signal?: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const abort = (): void => reader.abort();
    signal?.addEventListener("abort", abort, { once: true });
    reader.addEventListener("load", () => {
      signal?.removeEventListener("abort", abort);
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Unable to embed GLB visual asset."));
    });
    reader.addEventListener("abort", () => {
      signal?.removeEventListener("abort", abort);
      reject(abortError());
    });
    reader.addEventListener("error", () => {
      signal?.removeEventListener("abort", abort);
      reject(reader.error ?? new Error("Unable to read GLB."));
    });
    reader.readAsDataURL(file);
  });
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw abortError();
}

function abortError(): DOMException {
  return new DOMException("Proxy generation was cancelled.", "AbortError");
}
