import type { BoundsData, LargeSplatTile } from "../large/LargeWorldTypes.js";
import type { Vec3Tuple } from "../types/world.js";

export interface NavMeshTilePlan {
  tileId: string;
  bounds: BoundsData;
  source: "tile-bounds" | "heightfield" | "mesh";
  agent: {
    radius: number;
    height: number;
    maxSlopeDeg: number;
    stepHeight: number;
  };
  output: string;
}

export interface NavMeshLinkPlan {
  fromTileId: string;
  toTileId: string;
  portalBounds?: BoundsData;
  bidirectional: boolean;
}

export interface NavMeshPlan {
  format: "splat-navmesh-plan";
  version: 1;
  session: string;
  largeWorldManifest: string;
  tiles: NavMeshTilePlan[];
  links: NavMeshLinkPlan[];
  output: {
    navmesh: string;
    report: string;
  };
}

export interface CollisionTilePlan {
  tileId: string;
  colliderId: string;
  bounds: BoundsData;
  type: "box" | "heightfield" | "mesh" | "compound";
  output: string;
}

export interface CollisionPlan {
  format: "splat-collision-plan";
  version: 1;
  session: string;
  largeWorldManifest: string;
  tiles: CollisionTilePlan[];
  output: {
    colliders: string;
    report: string;
  };
}

export interface NavigationReport {
  format: "splat-navigation-report";
  version: 1;
  session: string;
  status: "pending" | "running" | "completed" | "failed";
  navTiles: number;
  collisionTiles: number;
  links: number;
  message: string;
}

export function createNavMeshPlan(
  session: string,
  largeWorldManifest: string,
  tiles: readonly LargeSplatTile[],
): NavMeshPlan {
  return {
    format: "splat-navmesh-plan",
    version: 1,
    session,
    largeWorldManifest,
    tiles: tiles.map((tile) => ({
      tileId: tile.id,
      bounds: tile.bounds,
      source: "tile-bounds",
      agent: {
        radius: 0.35,
        height: 1.7,
        maxSlopeDeg: 42,
        stepHeight: 0.35,
      },
      output: `navigation/navmesh/${tile.id}.navtile.json`,
    })),
    links: createLinks(tiles),
    output: {
      navmesh: "navigation/navmesh.json",
      report: "navigation/navigation-report.json",
    },
  };
}

export function createCollisionPlan(
  session: string,
  largeWorldManifest: string,
  tiles: readonly LargeSplatTile[],
): CollisionPlan {
  return {
    format: "splat-collision-plan",
    version: 1,
    session,
    largeWorldManifest,
    tiles: tiles.map((tile) => ({
      tileId: tile.id,
      colliderId: `collision:${tile.id}`,
      bounds: tile.bounds,
      type: "box",
      output: `navigation/colliders/${tile.id}.collider.json`,
    })),
    output: {
      colliders: "navigation/colliders.json",
      report: "navigation/navigation-report.json",
    },
  };
}

export function createPlaceholderNavigationReport(
  navmesh: NavMeshPlan,
  collision: CollisionPlan,
): NavigationReport {
  return {
    format: "splat-navigation-report",
    version: 1,
    session: navmesh.session,
    status: "pending",
    navTiles: navmesh.tiles.length,
    collisionTiles: collision.tiles.length,
    links: navmesh.links.length,
    message: "Generated placeholder. Run a navmesh/collision builder to fill navmesh and collider outputs.",
  };
}

function createLinks(tiles: readonly LargeSplatTile[]): NavMeshLinkPlan[] {
  const byId = new Map(tiles.map((tile) => [tile.id, tile] as const));
  const seen = new Set<string>();
  const links: NavMeshLinkPlan[] = [];
  for (const tile of tiles) {
    for (const neighborId of tile.neighbors ?? []) {
      const neighbor = byId.get(neighborId);
      if (!neighbor) continue;
      const id = pairId(tile.id, neighbor.id);
      if (seen.has(id)) continue;
      seen.add(id);
      links.push({
        fromTileId: tile.id,
        toTileId: neighbor.id,
        portalBounds: intersectBounds(tile.bounds, neighbor.bounds),
        bidirectional: true,
      });
    }
  }
  return links;
}

function pairId(a: string, b: string): string {
  return [a, b].sort().join("__");
}

function intersectBounds(a: BoundsData, b: BoundsData): BoundsData | undefined {
  const min: Vec3Tuple = [
    Math.max(a.min[0], b.min[0]),
    Math.max(a.min[1], b.min[1]),
    Math.max(a.min[2], b.min[2]),
  ];
  const max: Vec3Tuple = [
    Math.min(a.max[0], b.max[0]),
    Math.min(a.max[1], b.max[1]),
    Math.min(a.max[2], b.max[2]),
  ];
  if (max[0] <= min[0] || max[1] <= min[1] || max[2] <= min[2]) return undefined;
  return { min, max };
}
