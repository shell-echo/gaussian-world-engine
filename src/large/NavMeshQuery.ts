import * as THREE from "three";
import type { BoundsData } from "./LargeWorldTypes.js";
import type {
  RuntimeNavMeshLink,
  RuntimeNavMeshManifest,
  RuntimeNavMeshTile,
} from "./NavMeshTypes.js";
import type { Vec3Tuple } from "../types/world.js";

export type NavRouteStatus = "success" | "missing-start" | "missing-goal" | "unreachable";

export interface NavRouteResult {
  status: NavRouteStatus;
  startTileId?: string;
  goalTileId?: string;
  tileIds: string[];
  points: Vec3Tuple[];
  distance: number;
}

interface NavEdge {
  to: string;
  link: RuntimeNavMeshLink;
  cost: number;
}

interface SearchNode {
  tileId: string;
  cost: number;
  previous?: string;
}

export class RuntimeNavMeshQuery {
  private readonly tiles = new Map<string, RuntimeNavMeshTile>();
  private readonly edges = new Map<string, NavEdge[]>();

  constructor(private readonly manifest: RuntimeNavMeshManifest) {
    for (const tile of manifest.tiles) {
      this.tiles.set(tile.tileId, tile);
      this.edges.set(tile.tileId, []);
    }
    for (const link of manifest.links ?? []) {
      this.addEdge(link.fromTileId, link.toTileId, link);
      if (link.bidirectional ?? true) this.addEdge(link.toTileId, link.fromTileId, link);
    }
  }

  findTileContaining(point: THREE.Vector3): RuntimeNavMeshTile | null {
    for (const tile of this.tiles.values()) {
      if (tile.walkable && containsPoint(tile.bounds, point)) return tile;
    }
    return null;
  }

  findNearestTile(point: THREE.Vector3): RuntimeNavMeshTile | null {
    const containing = this.findTileContaining(point);
    if (containing) return containing;

    let best: RuntimeNavMeshTile | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const tile of this.tiles.values()) {
      if (!tile.walkable) continue;
      const distance = distanceToBounds(tile.bounds, point);
      if (distance < bestDistance) {
        best = tile;
        bestDistance = distance;
      }
    }
    return best;
  }

  findRoute(start: THREE.Vector3, goal: THREE.Vector3): NavRouteResult {
    const startTile = this.findNearestTile(start);
    if (!startTile) return emptyRoute("missing-start");
    const goalTile = this.findNearestTile(goal);
    if (!goalTile) return emptyRoute("missing-goal", startTile.tileId);

    if (startTile.tileId === goalTile.tileId) {
      return {
        status: "success",
        startTileId: startTile.tileId,
        goalTileId: goalTile.tileId,
        tileIds: [startTile.tileId],
        points: [toVec3Tuple(start), toVec3Tuple(goal)],
        distance: start.distanceTo(goal),
      };
    }

    const tileIds = this.searchTiles(startTile.tileId, goalTile.tileId);
    if (!tileIds.length) return emptyRoute("unreachable", startTile.tileId, goalTile.tileId);
    const points = this.routePoints(tileIds, start, goal);
    return {
      status: "success",
      startTileId: startTile.tileId,
      goalTileId: goalTile.tileId,
      tileIds,
      points,
      distance: polylineDistance(points),
    };
  }

  private addEdge(from: string, to: string, link: RuntimeNavMeshLink): void {
    const fromTile = this.tiles.get(from);
    const toTile = this.tiles.get(to);
    if (!fromTile || !toTile || !fromTile.walkable || !toTile.walkable) return;
    const cost = centerOf(fromTile.bounds).distanceTo(centerOf(toTile.bounds));
    this.edges.get(from)?.push({ to, link, cost });
  }

  private searchTiles(startTileId: string, goalTileId: string): string[] {
    const open = new Map<string, SearchNode>([[startTileId, { tileId: startTileId, cost: 0 }]]);
    const closed = new Map<string, SearchNode>();

    while (open.size > 0) {
      const current = popLowestCost(open);
      if (!current) break;
      closed.set(current.tileId, current);
      if (current.tileId === goalTileId) return reconstruct(closed, current);

      for (const edge of this.edges.get(current.tileId) ?? []) {
        if (closed.has(edge.to)) continue;
        const nextCost = current.cost + edge.cost;
        const existing = open.get(edge.to);
        if (!existing || nextCost < existing.cost) {
          open.set(edge.to, { tileId: edge.to, cost: nextCost, previous: current.tileId });
        }
      }
    }

    return [];
  }

  private routePoints(tileIds: readonly string[], start: THREE.Vector3, goal: THREE.Vector3): Vec3Tuple[] {
    const points: Vec3Tuple[] = [toVec3Tuple(start)];
    for (let index = 0; index < tileIds.length - 1; index += 1) {
      const from = tileIds[index];
      const to = tileIds[index + 1];
      if (!from || !to) continue;
      const edge = (this.edges.get(from) ?? []).find((candidate) => candidate.to === to);
      if (edge?.link.portalBounds) {
        points.push(toVec3Tuple(centerOf(edge.link.portalBounds)));
      } else {
        const tile = this.tiles.get(to);
        if (tile) points.push(toVec3Tuple(centerOf(tile.bounds)));
      }
    }
    points.push(toVec3Tuple(goal));
    return collapseDuplicatePoints(points);
  }
}

export function createNavRouteDebugLine(result: NavRouteResult): THREE.Line | null {
  if (result.status !== "success" || result.points.length < 2) return null;
  const geometry = new THREE.BufferGeometry().setFromPoints(
    result.points.map((point) => new THREE.Vector3(point[0], point[1] + 0.18, point[2])),
  );
  const material = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
  const line = new THREE.Line(geometry, material);
  line.name = `Nav route: ${result.tileIds.join(" -> ")}`;
  return line;
}

export function parseNavRoutePoint(value: string | null): THREE.Vector3 | null {
  if (!value) return null;
  const parts = value.split(",").map((item) => Number(item.trim()));
  if (parts.length !== 3 || parts.some((item) => !Number.isFinite(item))) return null;
  return new THREE.Vector3(parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0);
}

function emptyRoute(status: NavRouteStatus, startTileId?: string, goalTileId?: string): NavRouteResult {
  return { status, startTileId, goalTileId, tileIds: [], points: [], distance: 0 };
}

function popLowestCost(open: Map<string, SearchNode>): SearchNode | null {
  let bestKey: string | null = null;
  let best: SearchNode | null = null;
  for (const [key, node] of open) {
    if (!best || node.cost < best.cost) {
      bestKey = key;
      best = node;
    }
  }
  if (bestKey) open.delete(bestKey);
  return best;
}

function reconstruct(closed: ReadonlyMap<string, SearchNode>, node: SearchNode): string[] {
  const route: string[] = [node.tileId];
  let current: SearchNode | undefined = node;
  while (current?.previous) {
    const previous = closed.get(current.previous);
    if (!previous) break;
    route.push(previous.tileId);
    current = previous;
  }
  return route.reverse();
}

function centerOf(bounds: BoundsData): THREE.Vector3 {
  return new THREE.Vector3(
    (bounds.min[0] + bounds.max[0]) / 2,
    (bounds.min[1] + bounds.max[1]) / 2,
    (bounds.min[2] + bounds.max[2]) / 2,
  );
}

function containsPoint(bounds: BoundsData, point: THREE.Vector3): boolean {
  return (
    point.x >= bounds.min[0] && point.x <= bounds.max[0] &&
    point.y >= bounds.min[1] && point.y <= bounds.max[1] &&
    point.z >= bounds.min[2] && point.z <= bounds.max[2]
  );
}

function distanceToBounds(bounds: BoundsData, point: THREE.Vector3): number {
  const box = new THREE.Box3(
    new THREE.Vector3(bounds.min[0], bounds.min[1], bounds.min[2]),
    new THREE.Vector3(bounds.max[0], bounds.max[1], bounds.max[2]),
  );
  return box.distanceToPoint(point);
}

function toVec3Tuple(point: THREE.Vector3): Vec3Tuple {
  return [point.x, point.y, point.z];
}

function polylineDistance(points: readonly Vec3Tuple[]): number {
  let distance = 0;
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    if (!previous || !current) continue;
    distance += new THREE.Vector3(...previous).distanceTo(new THREE.Vector3(...current));
  }
  return distance;
}

function collapseDuplicatePoints(points: readonly Vec3Tuple[]): Vec3Tuple[] {
  const collapsed: Vec3Tuple[] = [];
  for (const point of points) {
    const previous = collapsed.at(-1);
    if (!previous || previous[0] !== point[0] || previous[1] !== point[1] || previous[2] !== point[2]) {
      collapsed.push(point);
    }
  }
  return collapsed;
}
