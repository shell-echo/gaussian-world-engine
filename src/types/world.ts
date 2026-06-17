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

export interface SolidBehavior {
  mode: "solid";
}

export interface TriggerBehavior {
  mode: "trigger";
  event: string;
  message: string;
  once?: boolean;
}

export type ColliderBehavior = SolidBehavior | TriggerBehavior;

export interface InteractableData {
  prompt: string;
  event: string;
  message: string;
  maxDistance?: number;
}

export interface ColliderBaseData {
  id: string;
  position?: Vec3Tuple;
  rotationDeg?: Vec3Tuple;
  debugVisible?: boolean;
  behavior?: ColliderBehavior;
  interactable?: InteractableData;
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

export interface MeshColliderData extends ColliderBaseData {
  type: "mesh";
  vertices: Vec3Tuple[];
  indices: number[];
  scale3?: Vec3Tuple;
}

export type ColliderData = BoxColliderData | CapsuleColliderData | MeshColliderData;
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

  assertBehavior(collider.id, collider.behavior);
  assertInteractable(collider.id, collider.interactable);

  if (collider.type === "box") {
    if (!isPositiveVec3(collider.size)) {
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

  if (collider.type === "mesh") {
    if (collider.behavior?.mode === "trigger") {
      throw new Error(`Mesh collider ${collider.id} cannot be used as a trigger.`);
    }
    if (!Array.isArray(collider.vertices) || collider.vertices.length < 3) {
      throw new Error(`Mesh collider ${collider.id} needs at least three vertices.`);
    }
    const vertices = collider.vertices;
    if (!vertices.every(isVec3)) {
      throw new Error(`Mesh collider ${collider.id} has invalid vertices.`);
    }
    if (!Array.isArray(collider.indices)) {
      throw new Error(`Mesh collider ${collider.id} has invalid triangle indices.`);
    }
    const indices = collider.indices;
    if (
      indices.length < 3 ||
      indices.length % 3 !== 0 ||
      !indices.every(
        (index) => Number.isInteger(index) && index >= 0 && index < vertices.length,
      )
    ) {
      throw new Error(`Mesh collider ${collider.id} has invalid triangle indices.`);
    }
    if (collider.scale3 !== undefined && !isPositiveVec3(collider.scale3)) {
      throw new Error(`Mesh collider ${collider.id} has an invalid scale.`);
    }
    return;
  }

  throw new Error(`Collider ${collider.id} has an unsupported type.`);
}

function assertBehavior(id: string, behavior: ColliderBehavior | undefined): void {
  if (!behavior) return;
  if (behavior.mode === "solid") return;
  if (
    behavior.mode !== "trigger" ||
    !isNonEmptyString(behavior.event) ||
    !isNonEmptyString(behavior.message) ||
    (behavior.once !== undefined && typeof behavior.once !== "boolean")
  ) {
    throw new Error(`Collider ${id} has an invalid behavior.`);
  }
}

function assertInteractable(id: string, interactable: InteractableData | undefined): void {
  if (!interactable) return;
  if (
    !isNonEmptyString(interactable.prompt) ||
    !isNonEmptyString(interactable.event) ||
    !isNonEmptyString(interactable.message) ||
    (interactable.maxDistance !== undefined && !isPositiveNumber(interactable.maxDistance))
  ) {
    throw new Error(`Collider ${id} has an invalid interactable component.`);
  }
}

function isVec3(value: unknown): value is Vec3Tuple {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((item) => typeof item === "number" && Number.isFinite(item))
  );
}

function isPositiveVec3(value: unknown): value is Vec3Tuple {
  return isVec3(value) && value.every((item) => item > 0);
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
