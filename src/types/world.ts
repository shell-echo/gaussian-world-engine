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

export interface BoxColliderData extends TransformData {
  id: string;
  type: "box";
  size: Vec3Tuple;
  debugVisible?: boolean;
}

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
  colliders: BoxColliderData[];
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

  for (const asset of manifest.splats) {
    if (!asset || typeof asset.id !== "string" || typeof asset.url !== "string") {
      throw new Error("Invalid splat asset in world manifest.");
    }
  }

  for (const collider of manifest.colliders) {
    if (
      !collider ||
      collider.type !== "box" ||
      typeof collider.id !== "string" ||
      !isVec3(collider.size)
    ) {
      throw new Error("Invalid box collider in world manifest.");
    }
  }
}

function isVec3(value: unknown): value is Vec3Tuple {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((item) => typeof item === "number" && Number.isFinite(item))
  );
}
