import * as THREE from "three";
import type { PhysicsWorld } from "../physics/PhysicsWorld";
import type { ColliderData } from "../types/world";
import {
  assertCollisionTileFile,
  collisionFileToColliders,
  fallbackBox,
  type CollisionTileFile,
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
  reusedColliderFiles: number;
  colliderFileHits: number;
  colliderFileMisses: number;
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

export class LargeCollisionTileManager {
  private readonly tiles = new Map<string, CollisionRuntime>();
  private readonly colliderFiles = new Map<string, CollisionTileFile>();
  private readonly pendingColliderFiles = new Map<string, Promise<CollisionTileFile>>();
  private readonly cameraPosition = new THREE.Vector3();
  private statsElapsed = 0;
  private disposed = false;
  private colliderFileHits = 0;
  private colliderFileMisses = 0;

  constructor(
    private readonly physics: PhysicsWorld,
    plan: RuntimeCollisionPlan,
    private readonly config: LargeWorldRuntimeConfig,
    private readonly events: LargeCollisionTileManagerEvents = {},
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
      reusedColliderFiles: this.colliderFiles.size,
      colliderFileHits: this.colliderFileHits,
      colliderFileMisses: this.colliderFileMisses,
    };
  }

  dispose(): void {
    this.disposed = true;
    for (const runtime of this.tiles.values()) {
      if (runtime.state === "active" || runtime.state === "failed") this.deactivate(runtime);
    }
    this.tiles.clear();
    this.colliderFiles.clear();
    this.pendingColliderFiles.clear();
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
    const file = await this.loadColliderFile(plan);
    return collisionFileToColliders(file, plan);
  }

  private async loadColliderFile(plan: RuntimeCollisionTilePlan): Promise<CollisionTileFile> {
    const cached = this.colliderFiles.get(plan.output);
    if (cached) {
      this.colliderFileHits += 1;
      this.touchColliderFile(plan.output, cached);
      return cached;
    }

    const pending = this.pendingColliderFiles.get(plan.output);
    if (pending) {
      this.colliderFileHits += 1;
      return pending;
    }

    this.colliderFileMisses += 1;
    const request = this.fetchColliderFile(plan);
    this.pendingColliderFiles.set(plan.output, request);
    try {
      const file = await request;
      this.storeColliderFile(plan.output, file);
      return file;
    } finally {
      this.pendingColliderFiles.delete(plan.output);
    }
  }

  private async fetchColliderFile(plan: RuntimeCollisionTilePlan): Promise<CollisionTileFile> {
    const response = await fetch(plan.output, { cache: "no-cache" });
    if (!response.ok) throw new Error(`Failed to load collider file ${plan.output}: ${response.status}`);
    const value: unknown = await response.json();
    assertCollisionTileFile(value);
    if (value.tileId !== plan.tileId) {
      throw new Error(`Collider file tileId mismatch: expected ${plan.tileId}, got ${value.tileId}.`);
    }
    return value;
  }

  private storeColliderFile(key: string, file: CollisionTileFile): void {
    if (this.config.colliderReuseEntries <= 0) return;
    this.colliderFiles.delete(key);
    this.colliderFiles.set(key, file);
    while (this.colliderFiles.size > this.config.colliderReuseEntries) {
      const oldest = this.colliderFiles.keys().next().value;
      if (typeof oldest !== "string") return;
      this.colliderFiles.delete(oldest);
    }
  }

  private touchColliderFile(key: string, file: CollisionTileFile): void {
    if (this.config.colliderReuseEntries <= 0) return;
    this.colliderFiles.delete(key);
    this.colliderFiles.set(key, file);
  }

  private addColliders(runtime: CollisionRuntime, colliders: readonly ColliderData[]): void {
    for (const collider of colliders) {
      this.physics.addCollider(collider);
      runtime.colliderIds.push(collider.id);
    }
  }
}
