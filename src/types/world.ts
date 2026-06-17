export type Vec3Tuple = [number, number, number];

export interface TransformData {
  position?: Vec3Tuple;
  rotationDeg?: Vec3Tuple;
  scale?: number;
}

export interface SplatAsset extends TransformData {
  id: string;
  url: string;
  lod?: boolean;
  paged?: boolean;
}

export interface ColliderBaseData extends TransformData {
  id: string;
  debugVisible?: boolean;
}

export interface BoxColliderData extends ColliderBaseData {
  type: "box";
  size: Vec3Tuple;
}

export interface CapsuleColliderData extends ColliderBaseData {
  type: "capsule";
  /** Radius of each hemispherical cap in world-space meters. */
  radius: number;
  /** Half the length of the cylindrical section in world-space meters. */
  halfHeight: number;
}

export type ColliderData = BoxColliderData | CapsuleColliderData;
export type ColliderType = ColliderData["type"];

export interface SpawnPoint {
  /** Feet position in world-space meters. */
  position: Vec3Tuple;
  yawDeg?: number;
}

export interface WorldManifest {
  format: "splat-world";
  version: 1;
  name: string;
  spawn: SpawnPoint;
  splats: SplatAsset[];
  colliders: ColliderData[];
  environment?: {
    background?: string;
    fogNear?: number;
    fogFar?: number;
  };
}

export function assertWorldManifest(value: unknown): asserts value is WorldManifest {
  if (!value || typeof value !== "object") {
    throw new Error("World manifest must be an object.");
  }

  const manifest = value as Partial<WorldManifest>;
  if (manifest.format !== "splat-world" || manifest.version !== 1) {
    throw new Error("Unsupported world manifest format/version.");
  }
  if (typeof manifest.name !== "string" || !manifest.name.trim()) {
    throw new Error("World manifest is missing a name.");
  }
  if (!manifest.spawn || !isVec3(manifest.spawn.position)) {
    throw new Error("World manifest has an invalid spawn point.");
  }
  if (!Array.isArray(manifest.splats) || !Array.isArray(manifest.colliders)) {
    throw new Error("World manifest must contain splats and colliders arrays.");
  }

  const ids = new Set<string>();
  for (const asset of manifest.splats) {
    if (!asset || typeof asset.id !== "string" || typeof asset.url !== "string") {
      throw new Error("Invalid splat asset in world manifest.");
    }
    if (ids.has(asset.id)) throw new Error(`Duplicate world object id: ${asset.id}`);
    ids.add(asset.id);
  }

  for (const collider of manifest.colliders) {
    assertColliderData(collider);
    if (ids.has(collider.id)) throw new Error(`Duplicate world object id: ${collider.id}`);
    ids.add(collider.id);
  }
}

export function assertColliderData(value: unknown): asserts value is ColliderData {
  if (!value || typeof value !== "object") {
    throw new Error("Collider must be an object.");
  }

  const collider = value as Partial<ColliderData>;
  if (typeof collider.id !== "string" || !collider.id.trim()) {
    throw new Error("Collider is missing an id.");
  }
  if (collider.position !== undefined && !isVec3(collider.position)) {
    throw new Error(`Collider ${collider.id} has an invalid position.`);
  }
  if (collider.rotationDeg !== undefined && !isVec3(collider.rotationDeg)) {
    throw new Error(`Collider ${collider.id} has an invalid rotation.`);
  }

  if (collider.type === "box") {
    if (!isVec3(collider.size) || collider.size.some((value) => value <= 0)) {
      throw new Error(`Box collider ${collider.id} has an invalid size.`);
    }
    return;
  }

  if (collider.type === "capsule") {
    if (!isPositiveNumber(collider.radius) || !isPositiveNumber(collider.halfHeight)) {
      throw new Error(`Capsule collider ${collider.id} has invalid dimensions.`);
    }
    return;
  }

  throw new Error(`Collider ${collider.id} has an unsupported type.`);
}

function isVec3(value: unknown): value is Vec3Tuple {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((item) => typeof item === "number" && Number.isFinite(item))
  );
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}
