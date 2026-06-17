import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import type { MeshColliderData, Vec3Tuple } from "../types/world";

const MAX_TRIANGLES = 100_000;

export async function extractMeshColliderFromGLB(
  file: File,
  id: string,
  position: Vec3Tuple,
): Promise<MeshColliderData> {
  const url = URL.createObjectURL(file);
  try {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(url);
    gltf.scene.updateMatrixWorld(true);

    const rootInverse = gltf.scene.matrixWorld.clone().invert();
    const vertices: Vec3Tuple[] = [];
    const indices: number[] = [];
    const transformed = new THREE.Vector3();
    let triangleCount = 0;

    gltf.scene.traverse((object) => {
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
        for (let index = 0; index < geometry.index.count; index += 3) {
          if (index + 2 >= geometry.index.count) break;
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

      if (triangleCount > MAX_TRIANGLES) {
        throw new Error(
          `GLB contains more than ${MAX_TRIANGLES.toLocaleString()} triangles. Simplify the proxy mesh first.`,
        );
      }
    });

    if (vertices.length < 3 || indices.length < 3) {
      throw new Error("GLB does not contain triangle mesh geometry.");
    }

    const bounds = new THREE.Box3();
    for (const vertex of vertices) {
      bounds.expandByPoint(new THREE.Vector3(vertex[0], vertex[1], vertex[2]));
    }
    const center = bounds.getCenter(new THREE.Vector3());
    const centeredVertices = vertices.map(
      (vertex): Vec3Tuple => [
        vertex[0] - center.x,
        vertex[1] - center.y,
        vertex[2] - center.z,
      ],
    );

    return {
      id,
      type: "mesh",
      position,
      rotationDeg: [0, 0, 0],
      scale3: [1, 1, 1],
      vertices: centeredVertices,
      indices,
      sourceName: file.name,
      behavior: { mode: "solid" },
      body: { mode: "fixed" },
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}
