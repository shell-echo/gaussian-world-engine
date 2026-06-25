import * as THREE from "three";
import type { BoundsData } from "./LargeWorldTypes.js";

export interface RuntimeCollisionTilePlan {
  tileId: string;
  colliderId: string;
  bounds: BoundsData;
  type: "box" | "heightfield" | "mesh" | "compound";
  output: string;
}

export interface RuntimeCollisionPlan {
  format: "splat-collision-plan";
  version: 1;
  session: string;
  largeWorldManifest: string;
  tiles: RuntimeCollisionTilePlan[];
  output?: {
    colliders?: string;
    report?: string;
  };
}

export function assertRuntimeCollisionPlan(value: unknown): asserts value is RuntimeCollisionPlan {
  if (!value || typeof value !== "object") throw new Error("Collision plan must be an object.");
  const plan = value as Partial<RuntimeCollisionPlan>;
  if (plan.format !== "splat-collision-plan" || plan.version !== 1) {
    throw new Error("Unsupported collision plan format/version.");
  }
  if (typeof plan.session !== "string" || !plan.session.trim()) throw new Error("Collision plan is missing session.");
  if (typeof plan.largeWorldManifest !== "string" || !plan.largeWorldManifest.trim()) {
    throw new Error("Collision plan is missing largeWorldManifest.");
  }
  if (!Array.isArray(plan.tiles)) throw new Error("Collision plan must contain tiles.");
  const ids = new Set<string>();
  for (const tile of plan.tiles) {
    if (!tile || typeof tile !== "object") throw new Error("Invalid collision tile plan.");
    if (typeof tile.tileId !== "string" || !tile.tileId.trim()) throw new Error("Collision tile is missing tileId.");
    if (typeof tile.colliderId !== "string" || !tile.colliderId.trim()) throw new Error(`Collision tile ${tile.tileId} is missing colliderId.`);
    if (ids.has(tile.colliderId)) throw new Error(`Duplicate collision colliderId: ${tile.colliderId}`);
    ids.add(tile.colliderId);
    assertBounds(tile.tileId, tile.bounds);
    if (!isCollisionType(tile.type)) throw new Error(`Collision tile ${tile.tileId} has unsupported type.`);
    if (typeof tile.output !== "string" || !tile.output.trim()) throw new Error(`Collision tile ${tile.tileId} is missing output.`);
  }
}

export function boundsCenter(bounds: BoundsData): THREE.Vector3 {
  return new THREE.Vector3(
    (bounds.min[0] + bounds.max[0]) / 2,
    (bounds.min[1] + bounds.max[1]) / 2,
    (bounds.min[2] + bounds.max[2]) / 2,
  );
}

export function boundsSize(bounds: BoundsData): [number, number, number] {
  return [
    bounds.max[0] - bounds.min[0],
    bounds.max[1] - bounds.min[1],
    bounds.max[2] - bounds.min[2],
  ];
}

export function distanceToBounds(bounds: BoundsData, point: THREE.Vector3): number {
  const box = new THREE.Box3(
    new THREE.Vector3(bounds.min[0], bounds.min[1], bounds.min[2]),
    new THREE.Vector3(bounds.max[0], bounds.max[1], bounds.max[2]),
  );
  return box.distanceToPoint(point);
}

function assertBounds(label: string, bounds: unknown): asserts bounds is BoundsData {
  if (!bounds || typeof bounds !== "object") throw new Error(`Collision tile ${label} has invalid bounds.`);
  const candidate = bounds as Partial<BoundsData>;
  if (!isVec3(candidate.min) || !isVec3(candidate.max)) throw new Error(`Collision tile ${label} has invalid bounds vectors.`);
  if (candidate.max[0] <= candidate.min[0] || candidate.max[1] <= candidate.min[1] || candidate.max[2] <= candidate.min[2]) {
    throw new Error(`Collision tile ${label} has empty bounds.`);
  }
}

function isVec3(value: unknown): value is [number, number, number] {
  return Array.isArray(value) && value.length === 3 && value.every((item) => typeof item === "number" && Number.isFinite(item));
}

function isCollisionType(value: unknown): value is RuntimeCollisionTilePlan["type"] {
  return value === "box" || value === "heightfield" || value === "mesh" || value === "compound";
}
