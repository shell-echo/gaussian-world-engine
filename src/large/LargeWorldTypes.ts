import type { Vec3Tuple, WorldManifest } from "../types/world.js";

export interface BoundsData {
  min: Vec3Tuple;
  max: Vec3Tuple;
}

export interface LargeSplatTileLod {
  level: number;
  url: string;
  maxDistance: number;
  bytes?: number;
  splatCount?: number;
  lod?: boolean;
  paged?: boolean;
}

export interface LargeSplatTile {
  id: string;
  bounds: BoundsData;
  lods: LargeSplatTileLod[];
  priority?: number;
  neighbors?: string[];
}

export interface LargeWorldManifest {
  format: "splatworld-large";
  version: 1;
  name: string;
  spawn: {
    position: Vec3Tuple;
    yawDeg?: number;
  };
  tiles: LargeSplatTile[];
  exposurePlan?: string;
  navigation?: string;
  collisionPlan?: string;
  colliders?: WorldManifest["colliders"];
  environment?: WorldManifest["environment"];
  streaming?: {
    loadRadius?: number;
    unloadRadius?: number;
    preloadRadius?: number;
    gpuBudgetBytes?: number;
    maxConcurrentLoads?: number;
    debugBounds?: boolean;
    tileIndexCellSize?: number;
    lodHysteresisRatio?: number;
    minLodDwellSeconds?: number;
    lodCrossFadeSeconds?: number;
    lodRetainSeconds?: number;
    colliderReuseEntries?: number;
  };
}

export interface LargeWorldRuntimeConfig {
  loadRadius: number;
  unloadRadius: number;
  preloadRadius: number;
  gpuBudgetBytes: number;
  maxConcurrentLoads: number;
  debugBounds: boolean;
  tileIndexCellSize?: number;
  lodHysteresisRatio: number;
  minLodDwellSeconds: number;
  lodCrossFadeSeconds: number;
  lodRetainSeconds: number;
  colliderReuseEntries: number;
}

const DEFAULT_CONFIG: LargeWorldRuntimeConfig = {
  loadRadius: 90,
  unloadRadius: 130,
  preloadRadius: 150,
  gpuBudgetBytes: 384 * 1024 * 1024,
  maxConcurrentLoads: 2,
  debugBounds: true,
  lodHysteresisRatio: 0.12,
  minLodDwellSeconds: 1,
  lodCrossFadeSeconds: 0.28,
  lodRetainSeconds: 0.34,
  colliderReuseEntries: 24,
};

export function assertLargeWorldManifest(value: unknown): asserts value is LargeWorldManifest {
  if (!value || typeof value !== "object") {
    throw new Error("Large world manifest must be an object.");
  }
  const manifest = value as Partial<LargeWorldManifest>;
  if (manifest.format !== "splatworld-large" || manifest.version !== 1) {
    throw new Error("Unsupported large world manifest format/version.");
  }
  if (typeof manifest.name !== "string" || !manifest.name.trim()) {
    throw new Error("Large world manifest is missing a name.");
  }
  if (!manifest.spawn || !isVec3(manifest.spawn.position)) {
    throw new Error("Large world manifest has an invalid spawn point.");
  }
  if (!Array.isArray(manifest.tiles) || manifest.tiles.length === 0) {
    throw new Error("Large world manifest needs at least one tile.");
  }
  if (manifest.exposurePlan !== undefined && (typeof manifest.exposurePlan !== "string" || !manifest.exposurePlan.trim())) {
    throw new Error("Large world manifest has an invalid exposurePlan path.");
  }
  if (manifest.navigation !== undefined && (typeof manifest.navigation !== "string" || !manifest.navigation.trim())) {
    throw new Error("Large world manifest has an invalid navigation path.");
  }
  if (manifest.collisionPlan !== undefined && (typeof manifest.collisionPlan !== "string" || !manifest.collisionPlan.trim())) {
    throw new Error("Large world manifest has an invalid collisionPlan path.");
  }

  const ids = new Set<string>();
  for (const tile of manifest.tiles) {
    assertTile(tile);
    if (ids.has(tile.id)) throw new Error(`Duplicate large tile id: ${tile.id}`);
    ids.add(tile.id);
  }
}

export function largeWorldToBootstrapManifest(manifest: LargeWorldManifest): WorldManifest {
  return {
    format: "splat-world",
    version: 1,
    name: manifest.name,
    spawn: manifest.spawn,
    splats: [],
    colliders: manifest.colliders ?? [],
    environment: manifest.environment,
  };
}

export function resolveLargeWorldConfig(manifest: LargeWorldManifest): LargeWorldRuntimeConfig {
  const streaming = manifest.streaming;
  return {
    loadRadius: positiveOr(streaming?.loadRadius, DEFAULT_CONFIG.loadRadius),
    unloadRadius: positiveOr(streaming?.unloadRadius, DEFAULT_CONFIG.unloadRadius),
    preloadRadius: positiveOr(streaming?.preloadRadius, DEFAULT_CONFIG.preloadRadius),
    gpuBudgetBytes: positiveOr(streaming?.gpuBudgetBytes, DEFAULT_CONFIG.gpuBudgetBytes),
    maxConcurrentLoads: Math.max(
      1,
      Math.min(Math.round(positiveOr(streaming?.maxConcurrentLoads, DEFAULT_CONFIG.maxConcurrentLoads)), 8),
    ),
    debugBounds: streaming?.debugBounds ?? DEFAULT_CONFIG.debugBounds,
    tileIndexCellSize: isPositive(streaming?.tileIndexCellSize)
      ? streaming.tileIndexCellSize
      : undefined,
    lodHysteresisRatio: Math.min(
      Math.max(nonNegativeOr(streaming?.lodHysteresisRatio, DEFAULT_CONFIG.lodHysteresisRatio), 0),
      0.45,
    ),
    minLodDwellSeconds: Math.min(
      Math.max(nonNegativeOr(streaming?.minLodDwellSeconds, DEFAULT_CONFIG.minLodDwellSeconds), 0),
      10,
    ),
    lodCrossFadeSeconds: Math.min(
      Math.max(nonNegativeOr(streaming?.lodCrossFadeSeconds, DEFAULT_CONFIG.lodCrossFadeSeconds), 0),
      5,
    ),
    lodRetainSeconds: Math.min(
      Math.max(nonNegativeOr(streaming?.lodRetainSeconds, DEFAULT_CONFIG.lodRetainSeconds), 0),
      10,
    ),
    colliderReuseEntries: Math.min(
      Math.max(Math.round(nonNegativeOr(streaming?.colliderReuseEntries, DEFAULT_CONFIG.colliderReuseEntries)), 0),
      256,
    ),
  };
}

function assertTile(value: unknown): asserts value is LargeSplatTile {
  if (!value || typeof value !== "object") throw new Error("Invalid large tile.");
  const tile = value as Partial<LargeSplatTile>;
  if (typeof tile.id !== "string" || !tile.id.trim()) {
    throw new Error("Large tile is missing an id.");
  }
  if (!tile.bounds || !isVec3(tile.bounds.min) || !isVec3(tile.bounds.max)) {
    throw new Error(`Large tile ${tile.id} has invalid bounds.`);
  }
  if (
    tile.bounds.max[0] <= tile.bounds.min[0] ||
    tile.bounds.max[1] <= tile.bounds.min[1] ||
    tile.bounds.max[2] <= tile.bounds.min[2]
  ) {
    throw new Error(`Large tile ${tile.id} bounds are empty.`);
  }
  if (!Array.isArray(tile.lods) || tile.lods.length === 0) {
    throw new Error(`Large tile ${tile.id} needs at least one LOD.`);
  }
  const levels = new Set<number>();
  for (const lod of tile.lods) {
    if (
      !lod ||
      !Number.isInteger(lod.level) ||
      lod.level < 0 ||
      typeof lod.url !== "string" ||
      !lod.url.trim() ||
      !isPositive(lod.maxDistance) ||
      (lod.bytes !== undefined && !isPositive(lod.bytes)) ||
      (lod.splatCount !== undefined && !isPositive(lod.splatCount))
    ) {
      throw new Error(`Large tile ${tile.id} has an invalid LOD.`);
    }
    if (levels.has(lod.level)) throw new Error(`Large tile ${tile.id} has duplicate LOD ${lod.level}.`);
    levels.add(lod.level);
  }
}

function isVec3(value: unknown): value is Vec3Tuple {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((item) => typeof item === "number" && Number.isFinite(item))
  );
}

function isPositive(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isNonNegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function positiveOr(value: unknown, fallback: number): number {
  return isPositive(value) ? value : fallback;
}

function nonNegativeOr(value: unknown, fallback: number): number {
  return isNonNegative(value) ? value : fallback;
}
