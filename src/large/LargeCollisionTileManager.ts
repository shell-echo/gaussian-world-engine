import * as THREE from "three";
import type { PhysicsWorld } from "../physics/PhysicsWorld";
import type { BoxColliderData } from "../types/world";
import type { LargeWorldRuntimeConfig } from "./LargeWorldTypes";
import {
  boundsCenter,
  boundsSize,
  distanceToBounds,
  type RuntimeCollisionPlan,
  type RuntimeCollisionTilePlan,
} from "./CollisionPlanTypes";

export interface CollisionTileStreamingStats {
  activeColliders: number;
  totalColliders: number;
}

export interface LargeCollisionTileManagerEvents {
  onStatus?: (message: string) => void;
  onStats?: (stats: CollisionTileStreamingStats) => void;
}

interface CollisionRuntime {
  plan: RuntimeCollisionTilePlan;
  active: boolean;
  distance: number;
}

export class LargeCollisionTileManager {
  private readonly tiles = new Map<string, CollisionRuntime>();
  private readonly cameraPosition = new THREE.Vector3();
  private elapsed = 0;
  private statsElapsed = 0;
  private disposed = false;

  constructor(
    private readonly physics: PhysicsWorld,
    plan: RuntimeCollisionPlan,
    private readonly config: LargeWorldRuntimeConfig,
    private readonly events: LargeCollisionTileManagerEvents = {},
  ) {
    for (const tile of plan.tiles) {
      this.tiles.set(tile.tileId, {
        plan: tile,
        active: false,
        distance: Number.POSITIVE_INFINITY,
      });
    }
  }

  update(camera: THREE.Camera, deltaSeconds: number): void {
    if (this.disposed) return;
    this.elapsed += deltaSeconds;
    this.statsElapsed += deltaSeconds;
    this.cameraPosition.copy(camera.position);

    for (const runtime of this.tiles.values()) {
      runtime.distance = distanceToBounds(runtime.plan.bounds, this.cameraPosition);
      if (!runtime.active && runtime.distance <= this.config.loadRadius) {
        this.activate(runtime);
      } else if (runtime.active && runtime.distance > this.config.unloadRadius) {
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
    for (const runtime of this.tiles.values()) {
      if (runtime.active) activeColliders += 1;
    }
    return {
      activeColliders,
      totalColliders: this.tiles.size,
    };
  }

  dispose(): void {
    this.disposed = true;
    for (const runtime of this.tiles.values()) {
      if (runtime.active) this.deactivate(runtime);
    }
    this.tiles.clear();
  }

  private activate(runtime: CollisionRuntime): void {
    const collider = collisionTileToBox(runtime.plan);
    this.physics.addCollider(collider);
    runtime.active = true;
    this.events.onStatus?.(`Collision ${runtime.plan.tileId} enabled`);
  }

  private deactivate(runtime: CollisionRuntime): void {
    this.physics.removeCollider(runtime.plan.colliderId);
    runtime.active = false;
    this.events.onStatus?.(`Collision ${runtime.plan.tileId} disabled`);
  }
}

function collisionTileToBox(plan: RuntimeCollisionTilePlan): BoxColliderData {
  const center = boundsCenter(plan.bounds);
  return {
    id: plan.colliderId,
    type: "box",
    position: [center.x, center.y, center.z],
    size: boundsSize(plan.bounds),
    behavior: { mode: "solid" },
    body: { mode: "fixed" },
  };
}
