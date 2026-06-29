import * as THREE from "three";
import type { Vec3Tuple } from "../types/world.js";
import type { BoundsData } from "./LargeWorldTypes.js";
import { RuntimeNavAgent, type RuntimeNavAgentOptions } from "./NavAgentController.js";
import { RuntimeNavMeshQuery, type NavRouteResult } from "./NavMeshQuery.js";
import type { RuntimeNavMeshManifest, RuntimeNavMeshTile } from "./NavMeshTypes.js";

export type RuntimeNavPoint = THREE.Vector3 | Vec3Tuple;

export interface RuntimeNavTileHit {
  tileId: string;
  walkable: boolean;
  layer: string | null;
  bounds: BoundsData;
}

export interface RuntimeNavGameplayApi {
  readonly ready: true;
  readonly walkableTileCount: number;
  findTileContaining: (point: RuntimeNavPoint) => RuntimeNavTileHit | null;
  findNearestTile: (point: RuntimeNavPoint) => RuntimeNavTileHit | null;
  findRoute: (start: RuntimeNavPoint, goal: RuntimeNavPoint) => NavRouteResult;
  createAgent: (options?: RuntimeNavAgentOptions) => RuntimeNavAgent;
}

export function createRuntimeNavGameplayApi(manifest: RuntimeNavMeshManifest): RuntimeNavGameplayApi {
  const query = new RuntimeNavMeshQuery(manifest);
  const walkableTileCount = manifest.tiles.filter((tile) => tile.walkable).length;
  const api: RuntimeNavGameplayApi = {
    ready: true,
    walkableTileCount,
    findTileContaining: (point) => summarizeTile(query.findTileContaining(toVector3(point))),
    findNearestTile: (point) => summarizeTile(query.findNearestTile(toVector3(point))),
    findRoute: (start, goal) => query.findRoute(toVector3(start), toVector3(goal)),
    createAgent: (options) => new RuntimeNavAgent(api, options),
  };
  return api;
}

function summarizeTile(tile: RuntimeNavMeshTile | null): RuntimeNavTileHit | null {
  if (!tile) return null;
  return {
    tileId: tile.tileId,
    walkable: tile.walkable,
    layer: tile.layer ?? null,
    bounds: cloneBounds(tile.bounds),
  };
}

function cloneBounds(bounds: BoundsData): BoundsData {
  return {
    min: [bounds.min[0], bounds.min[1], bounds.min[2]],
    max: [bounds.max[0], bounds.max[1], bounds.max[2]],
  };
}

function toVector3(point: RuntimeNavPoint): THREE.Vector3 {
  return point instanceof THREE.Vector3 ? point.clone() : new THREE.Vector3(point[0], point[1], point[2]);
}
