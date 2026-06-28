import * as THREE from "three";
import type { Vec3Tuple } from "../types/world.js";
import type { BoundsData } from "./LargeWorldTypes.js";
import type { RuntimeNavMeshLink, RuntimeNavMeshManifest, RuntimeNavMeshTile } from "./NavMeshTypes.js";

export interface RuntimeNavMeshPathOptions {
  snapToNearestTile?: boolean;
}

export interface RuntimeNavMeshPathResult {
  status: "ok" | "missing-start" | "missing-goal" | "unreachable";
  startTileId?: string;
  goalTileId?: string;
  tileIds: string[];
  waypoints: Vec3Tuple[];
  distance: number;
}

interface GraphEdge {
  to: string;
  link: RuntimeNavMeshLink;
  cost: number;
}

export class RuntimeNavMeshQuery {
  private readonly tiles = new Map<string, RuntimeNavMeshTile>();
  private readonly graph = new Map<string, GraphEdge[]>();

  constructor(private readonly manifest: RuntimeNavMeshManifest) {
    for (const tile of manifest.tiles) {
      if (!tile.walkable) continue;
      this.tiles.set(tile.tileId, tile);
      this.graph.set(tile.tileId, []);
    }
    for (const link of manifest.links ?? []) {
      const from = this.tiles.get(link.fromTileId);
      const to = this.tiles.get(link.toTileId);
      if (!from || !to) continue;
      this.addEdge(from, to, link);
      if (link.bidirectional !== false) this.addEdge(to, from, reverseLink(link));
    }
  }

  findPath(
    start: THREE.Vector3 | Vec3Tuple,
    goal: THREE.Vector3 | Vec3Tuple,
    options: RuntimeNavMeshPathOptions = {},
  ): RuntimeNavMeshPathResult {
    const startPoint = toVec3(start);
    const goalPoint = toVec3(goal);
    const snap = options.snapToNearestTile ?? true;
    const startTile = this.findTileForPoint(startPoint, snap);
    const goalTile = this.findTileForPoint(goalPoint, snap);

    if (!startTile) return emptyResult("missing-start");
    if (!goalTile) return emptyResult("missing-goal", startTile.tileId);
    if (startTile.tileId === goalTile.tileId) {
      return {
        status: "ok",
        startTileId: startTile.tileId,
        goalTileId: goalTile.tileId,
        tileIds: [startTile.tileId],
        waypoints: [fromVec3(startPoint), fromVec3(goalPoint)],
        distance: startPoint.distanceTo(goalPoint),
      };
    }

    const tileIds = this.findTilePath(startTile.tileId, goalTile.tileId);
    if (!tileIds.length) {
      return emptyResult("unreachable", startTile.tileId, goalTile.tileId);
    }

    const waypoints = [fromVec3(startPoint)];
    for (let index = 0; index < tileIds.length - 1; index += 1) {
      const link = this.findLink(tileIds[index] ?? "", tileIds[index + 1] ?? "");
      if (link?.portalBounds) {
        waypoints.push(fromVec3(centerOf(link.portalBounds)));
      } else {
        const nextTile = this.tiles.get(tileIds[index + 1] ?? "");
        if (nextTile) waypoints.push(fromVec3(centerOf(nextTile.bounds)));
      }
    }
    waypoints.push(fromVec3(goalPoint));

    return {
      status: "ok",
      startTileId: startTile.tileId,
      goalTileId: goalTile.tileId,
      tileIds,
      waypoints: simplifyWaypoints(waypoints),
      distance: pathDistance(waypoints),
    };
  }

  get walkableTileCount(): number {
    return this.tiles.size;
  }

  private addEdge(from: RuntimeNavMeshTile, to: RuntimeNavMeshTile, link: RuntimeNavMeshLink): void {
    const cost = centerOf(from.bounds).distanceTo(centerOf(to.bounds));
    this.graph.get(from.tileId)?.push({ to: to.tileId, link, cost });
  }

  private findTileForPoint(point: THREE.Vector3, snapToNearest: boolean): RuntimeNavMeshTile | null {
    for (const tile of this.tiles.values()) {
      if (containsPoint(tile.bounds, point)) return tile;
    }
    if (!snapToNearest) return null;
    let nearest: RuntimeNavMeshTile | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const tile of this.tiles.values()) {
      const distance = distanceToBounds(tile.bounds, point);
      if (distance < nearestDistance) {
        nearest = tile;
        nearestDistance = distance;
      }
    }
    return nearest;
  }

  private findTilePath(startTileId: string, goalTileId: string): string[] {
    const distances = new Map<string, number>();
    const previous = new Map<string, string>();
    const pending = new Set(this.tiles.keys());
    for (const id of pending) distances.set(id, Number.POSITIVE_INFINITY);
    distances.set(startTileId, 0);

    while (pending.size) {
      const current = pickNearest(pending, distances);
      if (!current) break;
      pending.delete(current);
      if (current === goalTileId) return reconstructPath(previous, goalTileId);
      const currentDistance = distances.get(current) ?? Number.POSITIVE_INFINITY;
      for (const edge of this.graph.get(current) ?? []) {
        if (!pending.has(edge.to)) continue;
        const nextDistance = currentDistance + edge.cost;
        if (nextDistance < (distances.get(edge.to) ?? Number.POSITIVE_INFINITY)) {
          distances.set(edge.to, nextDistance);
          previous.set(edge.to, current);
        }
      }
    }
    return [];
  }

  private findLink(fromTileId: string, toTileId: string): RuntimeNavMeshLink | null {
    return this.graph.get(fromTileId)?.find((edge) => edge.to === toTileId)?.link ?? null;
  }
}

export function createNavMeshPathDebugGroup(result: RuntimeNavMeshPathResult): THREE.Group {
  const group = new THREE.Group();
  group.name = `Runtime NavMesh Path: ${result.status}`;
  if (result.waypoints.length < 2) return group;
  const points: THREE.Vector3[] = [];
  for (let index = 0; index < result.waypoints.length - 1; index += 1) {
    points.push(toVec3(result.waypoints[index] ?? [0, 0, 0]));
    points.push(toVec3(result.waypoints[index + 1] ?? [0, 0, 0]));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
  group.add(new THREE.LineSegments(geometry, material));
  return group;
}

function emptyResult(
  status: RuntimeNavMeshPathResult["status"],
  startTileId?: string,
  goalTileId?: string,
): RuntimeNavMeshPathResult {
  return {
    status,
    startTileId,
    goalTileId,
    tileIds: [],
    waypoints: [],
    distance: Number.POSITIVE_INFINITY,
  };
}

function reverseLink(link: RuntimeNavMeshLink): RuntimeNavMeshLink {
  return {
    ...link,
    fromTileId: link.toTileId,
    toTileId: link.fromTileId,
  };
}

function pickNearest(pending: ReadonlySet<string>, distances: ReadonlyMap<string, number>): string | null {
  let best: string | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const id of pending) {
    const distance = distances.get(id) ?? Number.POSITIVE_INFINITY;
    if (distance < bestDistance) {
      best = id;
      bestDistance = distance;
    }
  }
  return best;
}

function reconstructPath(previous: ReadonlyMap<string, string>, goal: string): string[] {
  const path = [goal];
  let current = goal;
  while (previous.has(current)) {
    current = previous.get(current) ?? current;
    path.unshift(current);
  }
  return path;
}

function simplifyWaypoints(waypoints: readonly Vec3Tuple[]): Vec3Tuple[] {
  const result: Vec3Tuple[] = [];
  for (const waypoint of waypoints) {
    const last = result[result.length - 1];
    if (!last || !samePoint(last, waypoint)) result.push(waypoint);
  }
  return result;
}

function pathDistance(waypoints: readonly Vec3Tuple[]): number {
  let distance = 0;
  for (let index = 0; index < waypoints.length - 1; index += 1) {
    distance += toVec3(waypoints[index] ?? [0, 0, 0]).distanceTo(toVec3(waypoints[index + 1] ?? [0, 0, 0]));
  }
  return distance;
}

function samePoint(a: Vec3Tuple, b: Vec3Tuple): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

function containsPoint(bounds: BoundsData, point: THREE.Vector3): boolean {
  return (
    point.x >= bounds.min[0] &&
    point.x <= bounds.max[0] &&
    point.y >= bounds.min[1] &&
    point.y <= bounds.max[1] &&
    point.z >= bounds.min[2] &&
    point.z <= bounds.max[2]
  );
}

function distanceToBounds(bounds: BoundsData, point: THREE.Vector3): number {
  const box = new THREE.Box3(
    new THREE.Vector3(bounds.min[0], bounds.min[1], bounds.min[2]),
    new THREE.Vector3(bounds.max[0], bounds.max[1], bounds.max[2]),
  );
  return box.distanceToPoint(point);
}

function centerOf(bounds: BoundsData): THREE.Vector3 {
  return new THREE.Vector3(
    (bounds.min[0] + bounds.max[0]) / 2,
    (bounds.min[1] + bounds.max[1]) / 2,
    (bounds.min[2] + bounds.max[2]) / 2,
  );
}

function toVec3(value: THREE.Vector3 | Vec3Tuple): THREE.Vector3 {
  return value instanceof THREE.Vector3 ? value.clone() : new THREE.Vector3(value[0], value[1], value[2]);
}

function fromVec3(value: THREE.Vector3): Vec3Tuple {
  return [value.x, value.y, value.z];
}
