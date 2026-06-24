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
  opacity?: number;
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

export interface RigidBodyData {
  mode: "fixed" | "dynamic";
  gravityScale?: number;
  linearDamping?: number;
  angularDamping?: number;
}

export interface AudioSourceData {
  url: string;
  loop?: boolean;
  autoplay?: boolean;
  volume?: number;
  refDistance?: number;
}

export interface VisualModelData {
  url: string;
  sourceName?: string;
  visible?: boolean;
}

export interface ColliderBaseData {
  id: string;
  position?: Vec3Tuple;
  rotationDeg?: Vec3Tuple;
  debugVisible?: boolean;
  behavior?: ColliderBehavior;
  interactable?: InteractableData;
  body?: RigidBodyData;
  audio?: AudioSourceData;
  visual?: VisualModelData;
}

export interface BoxColliderData extends ColliderBaseData {
  type: "box";
  size: Vec3Tuple;
}

export interface CapsuleColliderData extends ColliderBaseData {
  type: "capsule";
  radius: number;
  halfHeight: number;
}

export interface MeshColliderData extends ColliderBaseData {
  type: "mesh";
  vertices: Vec3Tuple[];
  indices: number[];
  scale3?: Vec3Tuple;
  sourceName?: string;
}

export interface ConvexColliderData extends ColliderBaseData {
  type: "convex";
  vertices: Vec3Tuple[];
  scale3?: Vec3Tuple;
  sourceName?: string;
}

export interface ConvexPartData {
  vertices: Vec3Tuple[];
}

export interface CompoundColliderData extends ColliderBaseData {
  type: "compound";
  parts: ConvexPartData[];
  scale3?: Vec3Tuple;
  sourceName?: string;
}

export type ColliderData =
  | BoxColliderData
  | CapsuleColliderData
  | MeshColliderData
  | ConvexColliderData
  | CompoundColliderData;
export type ColliderType = ColliderData["type"];

export interface SpawnPoint {
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
  assertBody(collider.id, collider.body);
  assertAudio(collider.id, collider.audio);
  assertVisual(collider.id, collider.visual);

  if (collider.type === "box") {
    if (!isPositiveVec3(collider.size)) {
      throw new Error(`Box collider ${collider.id} has an invalid size.`);
    }
    assertBodyCompatibility(collider.id, collider.type, collider.behavior, collider.body);
    return;
  }

  if (collider.type === "capsule") {
    if (!isPositiveNumber(collider.radius) || !isPositiveNumber(collider.halfHeight)) {
      throw new Error(`Capsule collider ${collider.id} has invalid dimensions.`);
    }
    assertBodyCompatibility(collider.id, collider.type, collider.behavior, collider.body);
    return;
  }

  if (collider.type === "mesh") {
    if (collider.behavior?.mode === "trigger") {
      throw new Error(`Mesh collider ${collider.id} cannot be used as a trigger.`);
    }
    if (collider.body?.mode === "dynamic") {
      throw new Error(`Mesh collider ${collider.id} cannot be dynamic.`);
    }
    assertTriangleGeometry(collider.id, collider.vertices, collider.indices);
    if (collider.scale3 !== undefined && !isPositiveVec3(collider.scale3)) {
      throw new Error(`Mesh collider ${collider.id} has an invalid scale.`);
    }
    assertSourceName(collider.id, collider.sourceName);
    return;
  }

  if (collider.type === "convex") {
    if (!Array.isArray(collider.vertices) || collider.vertices.length < 4 || !collider.vertices.every(isVec3)) {
      throw new Error(`Convex collider ${collider.id} needs at least four vertices.`);
    }
    if (collider.behavior?.mode === "trigger") {
      throw new Error(`Convex collider ${collider.id} cannot be used as a trigger.`);
    }
    assertBodyCompatibility(collider.id, collider.type, collider.behavior, collider.body);
    assertSourceName(collider.id, collider.sourceName);
    return;
  }

  if (collider.type === "compound") {
    if (!Array.isArray(collider.parts) || collider.parts.length === 0) {
      throw new Error(`Compound collider ${collider.id} needs at least one part.`);
    }
    for (const part of collider.parts) {
      if (!Array.isArray(part.vertices) || part.vertices.length < 4 || !part.vertices.every(isVec3)) {
        throw new Error(`Compound collider ${collider.id} contains an invalid convex part.`);
      }
    }
    if (collider.behavior?.mode === "trigger") {
      throw new Error(`Compound collider ${collider.id} cannot be used as a trigger.`);
    }
    assertBodyCompatibility(collider.id, collider.type, collider.behavior, collider.body);
    assertSourceName(collider.id, collider.sourceName);
    return;
  }

  throw new Error(`Unsupported collider type: ${(collider as { type?: string }).type}`);
}

function assertBehavior(id: string, behavior: ColliderBehavior | undefined): void {
  if (!behavior) return;
  if (behavior.mode !== "solid" && behavior.mode !== "trigger") {
    throw new Error(`Collider ${id} has invalid behavior mode.`);
  }
}

function assertInteractable(id: string, interactable: InteractableData | undefined): void {
  if (!interactable) return;
  if (typeof interactable.prompt !== "string" || typeof interactable.event !== "string" || typeof interactable.message !== "string") {
    throw new Error(`Collider ${id} has an invalid interactable config.`);
  }
}

function assertBody(id: string, body: RigidBodyData | undefined): void {
  if (!body) return;
  if (body.mode !== "fixed" && body.mode !== "dynamic") {
    throw new Error(`Collider ${id} has invalid rigid body mode.`);
  }
}

function assertAudio(id: string, audio: AudioSourceData | undefined): void {
  if (!audio) return;
  if (typeof audio.url !== "string" || !audio.url.trim()) {
    throw new Error(`Collider ${id} has an invalid audio source.`);
  }
}

function assertVisual(id: string, visual: VisualModelData | undefined): void {
  if (!visual) return;
  if (typeof visual.url !== "string" || !visual.url.trim()) {
    throw new Error(`Collider ${id} has an invalid visual model.`);
  }
}

function assertBodyCompatibility(
  id: string,
  type: ColliderType,
  behavior: ColliderBehavior | undefined,
  body: RigidBodyData | undefined,
): void {
  if (behavior?.mode === "trigger" && body?.mode === "dynamic") {
    throw new Error(`Trigger collider ${id} cannot be dynamic.`);
  }
  if (type === "mesh" && body?.mode === "dynamic") {
    throw new Error(`Mesh collider ${id} cannot be dynamic.`);
  }
}

function assertTriangleGeometry(id: string, vertices: Vec3Tuple[] | undefined, indices: number[] | undefined): void {
  if (!Array.isArray(vertices) || vertices.length < 3 || !vertices.every(isVec3)) {
    throw new Error(`Mesh collider ${id} has invalid vertices.`);
  }
  if (!Array.isArray(indices) || indices.length < 3 || indices.length % 3 !== 0) {
    throw new Error(`Mesh collider ${id} has invalid triangle indices.`);
  }
  for (const index of indices) {
    if (!Number.isInteger(index) || index < 0 || index >= vertices.length) {
      throw new Error(`Mesh collider ${id} has an out-of-range vertex index.`);
    }
  }
}

function assertSourceName(id: string, sourceName: string | undefined): void {
  if (sourceName !== undefined && !sourceName.trim()) {
    throw new Error(`Collider ${id} has an invalid sourceName.`);
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
