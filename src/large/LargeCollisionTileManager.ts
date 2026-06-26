import * as THREE from "three";
import type { PhysicsWorld } from "../physics/PhysicsWorld";
import type { ColliderData } from "../types/world";
import {
  assertCollisionTileFile,
  collisionFileToColliders,
  fallbackBox,
} from "./CollisionTileArtifactTypes";
import type { LargeWorldRuntimeConfig } from "./LargeWorldTypes";
import {
  distanceToBounds,
  type RuntimeCollisionPlan,
  type RuntimeCollisionTilePlan,
} from "./CollisionPlanTypes";

export interface CollisionTileStreamingStats {
  activeColliders: number;
  loadingColliders: number;
  totalColliders: number;
  cachedColliderFiles: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface LargeCollisionTileManagerEvents {
  onStatus?: (message: string) => void;
  onStats?: (stats: CollisionTileStreamingStats) => void;
}

interface CollisionRuntime {
  plan: RuntimeCollisionTilePlan;
  state: "inactive" | "loading" | "active" | "failed";
  distance: number;
  colliderIds: string[];
}

interface CachedColliderFile {
  colliders: ColliderData[];
  lastUsedFrame: number;
}

const DEFAULT_MAX_CACHED_COLLIDER_FILES = 24;

export class LargeCollisionTileManager {
  private readonly tiles = new Map<string, CollisionRuntime>();
  private readonly cache = new Map<string, CachedColliderFile>();
  private readonly cameraPosition = new THREE.Vector3();
  private frame = 0;
  private statsElapsed = 0;
  private cacheHits = 0;
  private cacheMisses = 0;
  private disposed = false;

  constructor(
    private readonly physics: PhysicsWorld,
    plan: RuntimeCollisionPlan,
    private readonly config: LargeWorldRuntimeConfig,
    private readonly events: LargeCollisionTileManagerEvents = {},
    private readonly maxCachedColliderFiles = DEFAULT_MAX_CACHED_COLLIDER_FILES,
  ) {
    for (const tile of plan.tiles) {
      this.tiles.set(tile.tileId, {
        plan: tile,
        state: "inactive",
        distance: Number.POSITIVE_INFINITY,
        colliderIds: [],
      });
    }
  }

  update(camera: THREE.Camera, deltaSeconds: number): void {
    if (this.disposed) return;
    this.frame += 1;
    this.statsElapsed += deltaSeconds;
    this.cameraPosition.copy(camera.position);

    for (const runtime of this.tiles.values()) {
      runtime.distance = distanceToBounds(runtime.plan.bounds, this.cameraPosition);
      if (runtime.state === "inactive" && runtime.distance <= this.config.loadRadius) {
        void this.activate(runtime);
      } else if ((runtime.state === "active" || runtime.state === "failed") && runtime.distance > this.config.unloadRadius) {
        this.deactivate(runtime);
      }
    }

    if (this.statsElapsed >= 0.75) {
      this.statsElapsed = 0;
      this.events.onStats?.(this.getStats());
    }
  }

  getStats(): CollisionTileStreamingStats {
    let activeColliders = 0;
    let loadingColliders = 0;
    for (const runtime of this.tiles.values()) {
      if (runtime.state === "active" || runtime.state === "failed") activeColliders += runtime.colliderIds.length;
      if (runtime.state === "loading") loadingColliders += 1;
    }
    return {
      activeColliders,
      loadingColliders,
      totalColliders: this.tiles.size,
      cachedColliderFiles: this.cache.size,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
    };
  }

  dispose(): void {
    this.disposed = true;
    for (const runtime of this.tiles.values()) {
      if (runtime.state === "active" || runtime.state === "failed") this.deactivate(runtime);
    }
    this.tiles.clear();
    this.cache.clear();
  }

  private async activate(runtime: CollisionRuntime): Promise<void> {
    runtime.state = "loading";
    try {
      const colliders = await this.loadColliders(runtime.plan);
      if (this.disposed || runtime.distance > this.config.unloadRadius) {
        runtime.state = "inactive";
        return;
      }
      this.addColliders(runtime, colliders);
      runtime.state = "active";
      this.events.onStatus?.(`Collision ${runtime.plan.tileId} enabled`);
    } catch (error) {
      console.warn(`Failed to load collision tile ${runtime.plan.tileId}; using bounds box.`, error);
      this.addColliders(runtime, [fallbackBox(runtime.plan)]);
      runtime.state = "failed";
      this.events.onStatus?.(`Collision ${runtime.plan.tileId} fallback enabled`);
    }
  }

  private deactivate(runtime: CollisionRuntime): void {
    for (const id of runtime.colliderIds) this.physics.removeCollider(id);
    runtime.colliderIds = [];
    runtime.state = "inactive";
    this.events.onStatus?.(`Collision ${runtime.plan.tileId} disabled`);
  }

  private async loadColliders(plan: RuntimeCollisionTilePlan): Promise<ColliderData[]> {
    if (plan.type === "box") return [fallbackBox(plan)];
    const cached = this.cache.get(plan.output);
    if (cached) {
      cached.lastUsedFrame = this.frame;
      this.cacheHits += 1;
      return cloneColliders(cached.colliders);
    }

    this.cacheMisses += 1;
    const response = await fetch(plan.output, { cache: "no-cache" });
    if (!response.ok) throw new Error(`Failed to load collider file ${plan.output}: ${response.status}`);
    const value: unknown = await response.json();
    assertCollisionTileFile(value);
    if (value.tileId !== plan.tileId) {
      throw new Error(`Collider file tileId mismatch: expected ${plan.tileId}, got ${value.tileId}.`);
    }
    const colliders = collisionFileToColliders(value, plan);
    this.cache.set(plan.output, {
      colliders: cloneColliders(colliders),
      lastUsedFrame: this.frame,
    });
    this.evictCacheIfNeeded();
    return colliders;
  }

  private evictCacheIfNeeded(): void {
    const budget = Math.max(0, Math.floor(this.maxCachedColliderFiles));
    while (this.cache.size > budget) {
      let oldestKey: string | null = null;
      let oldestFrame = Number.POSITIVE_INFINITY;
      for (const [key, value] of this.cache) {
        if (value.lastUsedFrame < oldestFrame) {
          oldestKey = key;
          oldestFrame = value.lastUsedFrame;
        }
      }
      if (!oldestKey) return;
      this.cache.delete(oldestKey);
    }
  }

  private addColliders(runtime: CollisionRuntime, colliders: readonly ColliderData[]): void {
    for (const collider of colliders) {
      this.physics.addCollider(collider);
      runtime.colliderIds.push(collider.id);
    }
  }
}

function cloneColliders(colliders: readonly ColliderData[]): ColliderData[] {
  return colliders.map((collider) => structuredClone(collider));
}
