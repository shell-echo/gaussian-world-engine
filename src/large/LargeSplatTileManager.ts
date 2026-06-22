import * as THREE from "three";
import type { GaussianWorld, LoadProgress } from "../render/GaussianWorld";
import type { SplatAsset } from "../types/world";
import type {
  LargeSplatTile,
  LargeSplatTileLod,
  LargeWorldManifest,
  LargeWorldRuntimeConfig,
} from "./LargeWorldTypes";
import { resolveLargeWorldConfig } from "./LargeWorldTypes";
import { estimateTileIndexCellSize, TileSpatialIndex } from "./TileSpatialIndex";

export interface LargeTileManagerEvents {
  onStatus?: (message: string) => void;
  onProgress?: (progress: LoadProgress) => void;
  onStats?: (stats: LargeTileStreamingStats) => void;
}

export interface LargeTileStreamingStats {
  loadedTiles: number;
  loadingTiles: number;
  visibleTiles: number;
  residentBytes: number;
  budgetBytes: number;
  indexCandidates: number;
}

interface TileRuntime {
  tile: LargeSplatTile;
  bounds: THREE.Box3;
  sphere: THREE.Sphere;
  lods: LargeSplatTileLod[];
  state: "unloaded" | "loading" | "loaded" | "failed";
  activeLod: LargeSplatTileLod | null;
  targetLod: LargeSplatTileLod | null;
  assetId: string | null;
  lastTouchedFrame: number;
  lastLodChangeSeconds: number;
  distance: number;
  visible: boolean;
  bytes: number;
  error?: string;
  debug?: THREE.LineSegments<THREE.BufferGeometry, THREE.LineBasicMaterial>;
}

export class LargeSplatTileManager {
  readonly debugGroup = new THREE.Group();

  private readonly config: LargeWorldRuntimeConfig;
  private readonly tiles = new Map<string, TileRuntime>();
  private readonly index: TileSpatialIndex<TileRuntime>;
  private readonly frustum = new THREE.Frustum();
  private readonly projectionView = new THREE.Matrix4();
  private readonly cameraPosition = new THREE.Vector3();
  private frame = 0;
  private loadingCount = 0;
  private disposed = false;
  private statsElapsed = 0;
  private elapsedSeconds = 0;
  private lastCandidateCount = 0;

  constructor(
    private readonly gaussianWorld: GaussianWorld,
    manifest: LargeWorldManifest,
    private readonly events: LargeTileManagerEvents = {},
  ) {
    this.config = resolveLargeWorldConfig(manifest);
    this.debugGroup.name = "Large Splat Tile Bounds";
    this.debugGroup.visible = this.config.debugBounds;

    for (const tile of manifest.tiles) {
      const runtime = createTileRuntime(tile);
      this.tiles.set(tile.id, runtime);
      if (this.config.debugBounds) {
        runtime.debug = createBoundsDebug(runtime.bounds, tile.id);
        this.debugGroup.add(runtime.debug);
      }
    }

    this.index = new TileSpatialIndex(
      manifest.tiles,
      (tile) => requiredTile(this.tiles, tile.id),
      this.config.tileIndexCellSize ?? estimateTileIndexCellSize(manifest.tiles),
    );
  }

  update(camera: THREE.PerspectiveCamera, deltaSeconds: number): void {
    if (this.disposed) return;
    this.frame += 1;
    this.elapsedSeconds += deltaSeconds;
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();
    this.cameraPosition.copy(camera.position);
    this.projectionView.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.projectionView);

    const desired = this.selectDesiredTiles();
    this.scheduleLoads(desired);
    this.evictTiles(desired);
    this.updateDebugMaterials(desired);

    this.statsElapsed += deltaSeconds;
    if (this.statsElapsed >= 0.5) {
      this.statsElapsed = 0;
      this.events.onStats?.(this.getStats(desired.size));
    }
  }

  setDebugVisible(visible: boolean): void {
    this.debugGroup.visible = visible;
  }

  getStats(visibleTiles = 0): LargeTileStreamingStats {
    let loadedTiles = 0;
    let loadingTiles = 0;
    let residentBytes = 0;
    for (const tile of this.tiles.values()) {
      if (tile.state === "loaded") {
        loadedTiles += 1;
        residentBytes += tile.bytes;
      } else if (tile.state === "loading") {
        loadingTiles += 1;
      }
    }
    return {
      loadedTiles,
      loadingTiles,
      visibleTiles,
      residentBytes,
      budgetBytes: this.config.gpuBudgetBytes,
      indexCandidates: this.lastCandidateCount,
    };
  }

  dispose(): void {
    this.disposed = true;
    for (const runtime of this.tiles.values()) {
      if (runtime.assetId) this.gaussianWorld.removeAsset(runtime.assetId);
      runtime.debug?.geometry.dispose();
      runtime.debug?.material.dispose();
    }
    this.debugGroup.clear();
    this.tiles.clear();
  }

  private selectDesiredTiles(): Map<string, LargeSplatTileLod> {
    const desired = new Map<string, LargeSplatTileLod>();
    const candidates = this.index.querySphere(this.cameraPosition, this.config.preloadRadius);
    this.lastCandidateCount = candidates.length;

    for (const candidate of candidates) {
      const runtime = candidate.value;
      runtime.distance = runtime.bounds.distanceToPoint(this.cameraPosition);
      runtime.visible = this.frustum.intersectsSphere(runtime.sphere);
      const lod = this.selectLod(runtime);
      if (!lod) continue;
      desired.set(runtime.tile.id, lod);
      runtime.targetLod = lod;
      runtime.lastTouchedFrame = this.frame;
    }
    return desired;
  }

  private selectLod(runtime: TileRuntime): LargeSplatTileLod | null {
    if (runtime.distance > this.config.preloadRadius && runtime.distance > maxLodDistance(runtime.lods)) {
      return null;
    }
    if (!runtime.visible && runtime.distance > this.config.loadRadius) return null;

    const ideal = idealLodForDistance(runtime.lods, runtime.distance);
    const active = runtime.activeLod;
    if (!ideal || !active || active.level === ideal.level) return ideal;

    const dwell = this.elapsedSeconds - runtime.lastLodChangeSeconds;
    if (dwell < this.config.minLodDwellSeconds) return active;

    const activeIndex = runtime.lods.findIndex((lod) => lod.level === active.level);
    const idealIndex = runtime.lods.findIndex((lod) => lod.level === ideal.level);
    const hysteresis = this.config.lodHysteresisRatio;

    if (idealIndex < activeIndex) {
      return runtime.distance <= ideal.maxDistance * (1 - hysteresis) ? ideal : active;
    }
    if (idealIndex > activeIndex) {
      return runtime.distance >= active.maxDistance * (1 + hysteresis) ? ideal : active;
    }
    return ideal;
  }

  private scheduleLoads(desired: ReadonlyMap<string, LargeSplatTileLod>): void {
    const entries = Array.from(desired.entries())
      .map(([id, lod]) => ({ runtime: this.tiles.get(id), lod }))
      .filter((entry): entry is { runtime: TileRuntime; lod: LargeSplatTileLod } => Boolean(entry.runtime))
      .sort((left, right) => left.runtime.distance - right.runtime.distance);

    for (const { runtime, lod } of entries) {
      if (this.loadingCount >= this.config.maxConcurrentLoads) return;
      if (runtime.state === "loading") continue;
      if (runtime.activeLod?.level === lod.level && runtime.state === "loaded") continue;
      void this.loadTile(runtime, lod);
    }
  }

  private async loadTile(runtime: TileRuntime, lod: LargeSplatTileLod): Promise<void> {
    if (this.disposed) return;
    runtime.state = "loading";
    this.loadingCount += 1;
    const assetId = tileAssetId(runtime.tile.id, lod.level);
    this.events.onStatus?.(`加载 Tile ${runtime.tile.id} · LOD ${lod.level}`);
    try {
      const previousAssetId = runtime.assetId;
      const asset: SplatAsset = {
        id: assetId,
        url: lod.url,
        lod: lod.lod ?? true,
        paged: lod.paged ?? false,
      };
      await this.gaussianWorld.addAsset(asset, this.events.onProgress);
      if (this.disposed) {
        this.gaussianWorld.removeAsset(assetId);
        return;
      }
      if (previousAssetId && previousAssetId !== assetId) {
        this.gaussianWorld.removeAsset(previousAssetId);
      }
      runtime.assetId = assetId;
      runtime.activeLod = lod;
      runtime.lastLodChangeSeconds = this.elapsedSeconds;
      runtime.state = "loaded";
      runtime.bytes = lod.bytes ?? estimateLodBytes(lod);
      runtime.error = undefined;
      this.events.onStatus?.(`Tile ${runtime.tile.id} 已加载 · LOD ${lod.level}`);
      this.enforceBudget();
    } catch (error) {
      runtime.state = "failed";
      runtime.error = error instanceof Error ? error.message : String(error);
      this.events.onStatus?.(`Tile ${runtime.tile.id} 加载失败`);
      console.warn(`Failed to load tile ${runtime.tile.id}.`, error);
    } finally {
      this.loadingCount = Math.max(0, this.loadingCount - 1);
    }
  }

  private evictTiles(desired: ReadonlyMap<string, LargeSplatTileLod>): void {
    for (const runtime of this.tiles.values()) {
      if (runtime.state !== "loaded" || !runtime.assetId) continue;
      if (desired.has(runtime.tile.id)) continue;
      if (runtime.distance <= this.config.unloadRadius) continue;
      this.unload(runtime);
    }
  }

  private enforceBudget(): void {
    let stats = this.getStats();
    if (stats.residentBytes <= this.config.gpuBudgetBytes) return;
    const loaded = Array.from(this.tiles.values())
      .filter((runtime) => runtime.state === "loaded" && runtime.assetId)
      .sort((left, right) => right.distance - left.distance || left.lastTouchedFrame - right.lastTouchedFrame);
    for (const runtime of loaded) {
      if (stats.residentBytes <= this.config.gpuBudgetBytes) break;
      this.unload(runtime);
      stats = this.getStats();
    }
  }

  private unload(runtime: TileRuntime): void {
    if (!runtime.assetId) return;
    this.gaussianWorld.removeAsset(runtime.assetId);
    runtime.assetId = null;
    runtime.activeLod = null;
    runtime.state = "unloaded";
    runtime.bytes = 0;
  }

  private updateDebugMaterials(desired: ReadonlyMap<string, LargeSplatTileLod>): void {
    for (const runtime of this.tiles.values()) {
      if (!runtime.debug) continue;
      const color = runtime.state === "loaded"
        ? 0x6fffb0
        : runtime.state === "loading"
          ? 0xffc857
          : desired.has(runtime.tile.id)
            ? 0x6bd4ff
            : 0x666c7a;
      runtime.debug.material.color.setHex(color);
      runtime.debug.material.opacity = desired.has(runtime.tile.id) ? 0.55 : 0.22;
    }
  }
}

function createTileRuntime(tile: LargeSplatTile): TileRuntime {
  const bounds = new THREE.Box3(
    new THREE.Vector3(tile.bounds.min[0], tile.bounds.min[1], tile.bounds.min[2]),
    new THREE.Vector3(tile.bounds.max[0], tile.bounds.max[1], tile.bounds.max[2]),
  );
  const sphere = new THREE.Sphere();
  bounds.getBoundingSphere(sphere);
  return {
    tile,
    bounds,
    sphere,
    lods: [...tile.lods].sort((left, right) => left.level - right.level),
    state: "unloaded",
    activeLod: null,
    targetLod: null,
    assetId: null,
    lastTouchedFrame: 0,
    lastLodChangeSeconds: Number.NEGATIVE_INFINITY,
    distance: Number.POSITIVE_INFINITY,
    visible: false,
    bytes: 0,
  };
}

function createBoundsDebug(
  bounds: THREE.Box3,
  name: string,
): THREE.LineSegments<THREE.BufferGeometry, THREE.LineBasicMaterial> {
  const geometry = new THREE.BufferGeometry();
  const points = boundsLinePoints(bounds);
  geometry.setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: 0x666c7a,
    transparent: true,
    opacity: 0.22,
  });
  const lines = new THREE.LineSegments(geometry, material);
  lines.name = `Tile bounds: ${name}`;
  return lines;
}

function boundsLinePoints(bounds: THREE.Box3): THREE.Vector3[] {
  const min = bounds.min;
  const max = bounds.max;
  const vertices = [
    new THREE.Vector3(min.x, min.y, min.z),
    new THREE.Vector3(max.x, min.y, min.z),
    new THREE.Vector3(max.x, max.y, min.z),
    new THREE.Vector3(min.x, max.y, min.z),
    new THREE.Vector3(min.x, min.y, max.z),
    new THREE.Vector3(max.x, min.y, max.z),
    new THREE.Vector3(max.x, max.y, max.z),
    new THREE.Vector3(min.x, max.y, max.z),
  ];
  const edges = [
    0, 1, 1, 2, 2, 3, 3, 0,
    4, 5, 5, 6, 6, 7, 7, 4,
    0, 4, 1, 5, 2, 6, 3, 7,
  ];
  return edges.map((index) => vertices[index]?.clone() ?? new THREE.Vector3());
}

function idealLodForDistance(
  lods: readonly LargeSplatTileLod[],
  distance: number,
): LargeSplatTileLod | null {
  for (const lod of lods) {
    if (distance <= lod.maxDistance) return lod;
  }
  return lods[lods.length - 1] ?? null;
}

function tileAssetId(tileId: string, level: number): string {
  return `large:${tileId}:lod${level}`;
}

function maxLodDistance(lods: readonly LargeSplatTileLod[]): number {
  return lods.reduce((value, lod) => Math.max(value, lod.maxDistance), 0);
}

function estimateLodBytes(lod: LargeSplatTileLod): number {
  if (lod.splatCount) return lod.splatCount * 32;
  return 32 * 1024 * 1024;
}

function requiredTile(tiles: ReadonlyMap<string, TileRuntime>, id: string): TileRuntime {
  const tile = tiles.get(id);
  if (!tile) throw new Error(`Missing runtime tile ${id}.`);
  return tile;
}

export function formatLargeBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 ** 3) return `${(value / 1024 ** 2).toFixed(1)} MB`;
  return `${(value / 1024 ** 3).toFixed(2)} GB`;
}
