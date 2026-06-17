import * as THREE from "three";
import type { TransformData, Vec3Tuple } from "../types/world";

const DEG_TO_RAD = Math.PI / 180;

export function applyTransform(object: THREE.Object3D, transform: TransformData): void {
  const position = transform.position ?? [0, 0, 0];
  const rotation = transform.rotationDeg ?? [0, 0, 0];
  const scale = transform.scale ?? 1;

  object.position.fromArray(position);
  object.rotation.set(
    rotation[0] * DEG_TO_RAD,
    rotation[1] * DEG_TO_RAD,
    rotation[2] * DEG_TO_RAD,
  );
  object.scale.setScalar(scale);
}

export function quaternionFromDegrees(rotation: Vec3Tuple = [0, 0, 0]): THREE.Quaternion {
  return new THREE.Quaternion().setFromEuler(
    new THREE.Euler(
      rotation[0] * DEG_TO_RAD,
      rotation[1] * DEG_TO_RAD,
      rotation[2] * DEG_TO_RAD,
      "XYZ",
    ),
  );
}
