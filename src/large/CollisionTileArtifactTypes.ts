import type {
  BoxColliderData,
  ColliderData,
  CompoundColliderData,
  ConvexColliderData,
  MeshColliderData,
  Vec3Tuple,
} from "../types/world.js";
import { boundsCenter, boundsSize, type RuntimeCollisionTilePlan } from "./CollisionPlanTypes.js";
import type { BoundsData } from "./LargeWorldTypes.js";

export interface BoxCollisionTileFile {
  format: "splat-collider-tile";
  version: 1;
  tileId: string;
  kind: "box";
  bounds: BoundsData;
  colliders?: BoxColliderData[];
}

export interface MeshCollisionTileFile {
  format: "splat-collider-tile";
  version: 1;
  tileId: string;
  kind: "mesh";
  bounds: BoundsData;
  colliders: MeshColliderData[];
}

export interface HeightfieldCollisionTileFile {
  format: "splat-collider-tile";
  version: 1;
  tileId: string;
  kind: "heightfield";
  bounds: BoundsData;
  heightfield: {
    width: number;
    depth: number;
    min: Vec3Tuple;
    max: Vec3Tuple;
    heights: number[];
  };
}

export interface CompoundCollisionTileFile {
  format: "splat-collider-tile";
  version: 1;
  tileId: string;
  kind: "compound";
  bounds: BoundsData;
  colliders: ColliderData[];
}

export type CollisionTileFile =
  | BoxCollisionTileFile
  | MeshCollisionTileFile
  | HeightfieldCollisionTileFile
  | CompoundCollisionTileFile;

interface UnknownCollisionTileFile {
  format?: unknown;
  version?: unknown;
  tileId?: unknown;
  kind?: unknown;
  bounds?: unknown;
  colliders?: unknown;
  heightfield?: unknown;
}

export function assertCollisionTileFile(value: unknown): asserts value is CollisionTileFile {
  if (!value || typeof value !== "object") throw new Error("Collision tile file must be an object.");
  const file = value as UnknownCollisionTileFile;
  if (file.format !== "splat-collider-tile" || file.version !== 1) {
    throw new Error("Unsupported collision tile file format/version.");
  }
  if (typeof file.tileId !== "string" || !file.tileId.trim()) throw new Error("Collision tile file is missing tileId.");
  assertBounds(file.tileId, file.bounds);
  if (file.kind === "box") {
    if (file.colliders !== undefined && (!Array.isArray(file.colliders) || !file.colliders.every(isBoxCollider))) {
      throw new Error(`Collision tile ${file.tileId} has invalid box colliders.`);
    }
    return;
  }
  if (file.kind === "mesh") {
    if (!Array.isArray(file.colliders) || !file.colliders.every(isMeshCollider)) {
      throw new Error(`Collision tile ${file.tileId} has invalid mesh colliders.`);
    }
    return;
  }
  if (file.kind === "heightfield") {
    assertHeightfield(file.tileId, file.heightfield);
    return;
  }
  if (file.kind === "compound") {
    if (!Array.isArray(file.colliders) || !file.colliders.every(isColliderData)) {
      throw new Error(`Collision tile ${file.tileId} has invalid compound colliders.`);
    }
    return;
  }
  throw new Error(`Unsupported collision tile kind: ${String(file.kind)}`);
}

export function collisionFileToColliders(file: CollisionTileFile, plan: RuntimeCollisionTilePlan): ColliderData[] {
  if (file.kind === "box") {
    return file.colliders?.length ? withPlanIds(file.colliders, plan) : [fallbackBox(plan, file.bounds)];
  }
  if (file.kind === "mesh") return withPlanIds(file.colliders, plan);
  if (file.kind === "compound") return withPlanIds(file.colliders, plan);
  return [heightfieldToFallbackMesh(file, plan)];
}

export function fallbackBox(plan: RuntimeCollisionTilePlan, bounds = plan.bounds): BoxColliderData {
  const center = boundsCenter(bounds);
  return {
    id: plan.colliderId,
    type: "box",
    position: [center.x, center.y, center.z],
    size: boundsSize(bounds),
    behavior: { mode: "solid" },
    body: { mode: "fixed" },
  };
}

function heightfieldToFallbackMesh(file: HeightfieldCollisionTileFile, plan: RuntimeCollisionTilePlan): MeshColliderData {
  const { width, depth, min, max, heights } = file.heightfield;
  const vertices: Vec3Tuple[] = [];
  for (let z = 0; z < depth; z += 1) {
    for (let x = 0; x < width; x += 1) {
      const u = width <= 1 ? 0 : x / (width - 1);
      const v = depth <= 1 ? 0 : z / (depth - 1);
      const y = heights[z * width + x] ?? min[1];
      vertices.push([
        min[0] + (max[0] - min[0]) * u,
        y,
        min[2] + (max[2] - min[2]) * v,
      ]);
    }
  }
  const indices: number[] = [];
  for (let z = 0; z < depth - 1; z += 1) {
    for (let x = 0; x < width - 1; x += 1) {
      const a = z * width + x;
      const b = a + 1;
      const c = a + width;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  return {
    id: plan.colliderId,
    type: "mesh",
    vertices,
    indices,
    behavior: { mode: "solid" },
    body: { mode: "fixed" },
    sourceName: `${file.tileId}:heightfield`,
  };
}

function withPlanIds(colliders: readonly ColliderData[], plan: RuntimeCollisionTilePlan): ColliderData[] {
  return colliders.map((collider, index) => withPlanId(collider, index === 0 ? plan.colliderId : `${plan.colliderId}:${index}`));
}

function withPlanId(collider: ColliderData, id: string): ColliderData {
  if (collider.type === "box") {
    return { ...collider, id, behavior: collider.behavior ?? { mode: "solid" }, body: collider.body ?? { mode: "fixed" } };
  }
  if (collider.type === "capsule") {
    return { ...collider, id, behavior: collider.behavior ?? { mode: "solid" }, body: collider.body ?? { mode: "fixed" } };
  }
  if (collider.type === "mesh") {
    return { ...collider, id, behavior: { mode: "solid" }, body: { mode: "fixed" } };
  }
  if (collider.type === "convex") {
    return { ...collider, id, behavior: collider.behavior ?? { mode: "solid" }, body: collider.body ?? { mode: "fixed" } };
  }
  return { ...collider, id, behavior: collider.behavior ?? { mode: "solid" }, body: collider.body ?? { mode: "fixed" } };
}

function assertHeightfield(tileId: string, value: unknown): asserts value is HeightfieldCollisionTileFile["heightfield"] {
  if (!value || typeof value !== "object") throw new Error(`Collision tile ${tileId} has invalid heightfield.`);
  const field = value as Partial<HeightfieldCollisionTileFile["heightfield"]>;
  if (!Number.isInteger(field.width) || field.width < 2 || !Number.isInteger(field.depth) || field.depth < 2) {
    throw new Error(`Collision tile ${tileId} has invalid heightfield dimensions.`);
  }
  if (!isVec3(field.min) || !isVec3(field.max)) throw new Error(`Collision tile ${tileId} has invalid heightfield bounds.`);
  if (!Array.isArray(field.heights) || field.heights.length !== field.width * field.depth || !field.heights.every(isFiniteNumber)) {
    throw new Error(`Collision tile ${tileId} has invalid height samples.`);
  }
}

function assertBounds(label: string, bounds: unknown): asserts bounds is BoundsData {
  if (!bounds || typeof bounds !== "object") throw new Error(`Collision tile ${label} has invalid bounds.`);
  const candidate = bounds as Partial<BoundsData>;
  if (!isVec3(candidate.min) || !isVec3(candidate.max)) throw new Error(`Collision tile ${label} has invalid bounds vectors.`);
  if (candidate.max[0] <= candidate.min[0] || candidate.max[1] <= candidate.min[1] || candidate.max[2] <= candidate.min[2]) {
    throw new Error(`Collision tile ${label} has empty bounds.`);
  }
}

function isColliderData(value: unknown): value is ColliderData {
  return isBoxCollider(value) || isCapsuleCollider(value) || isMeshCollider(value) || isConvexCollider(value) || isCompoundCollider(value);
}

function isBoxCollider(value: unknown): value is BoxColliderData {
  return Boolean(value && typeof value === "object" && (value as { type?: unknown }).type === "box");
}

function isCapsuleCollider(value: unknown): value is ColliderData {
  return Boolean(value && typeof value === "object" && (value as { type?: unknown }).type === "capsule");
}

function isMeshCollider(value: unknown): value is MeshColliderData {
  const collider = value as Partial<MeshColliderData> | null;
  return Boolean(
    collider &&
    typeof collider === "object" &&
    collider.type === "mesh" &&
    Array.isArray(collider.vertices) &&
    Array.isArray(collider.indices),
  );
}

function isConvexCollider(value: unknown): value is ConvexColliderData {
  return Boolean(value && typeof value === "object" && (value as { type?: unknown }).type === "convex");
}

function isCompoundCollider(value: unknown): value is CompoundColliderData {
  return Boolean(value && typeof value === "object" && (value as { type?: unknown }).type === "compound");
}

function isVec3(value: unknown): value is Vec3Tuple {
  return Array.isArray(value) && value.length === 3 && value.every(isFiniteNumber);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
