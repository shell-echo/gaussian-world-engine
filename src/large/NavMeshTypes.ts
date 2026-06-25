import * as THREE from "three";
import type { BoundsData } from "./LargeWorldTypes.js";
import type { Vec3Tuple } from "../types/world.js";

export interface RuntimeNavMeshTile {
  tileId: string;
  bounds: BoundsData;
  walkable: boolean;
  layer?: string;
}

export interface RuntimeNavMeshLink {
  fromTileId: string;
  toTileId: string;
  portalBounds?: BoundsData;
  bidirectional?: boolean;
}

export interface RuntimeNavMeshManifest {
  format: "splat-navmesh";
  version: 1;
  name?: string;
  tiles: RuntimeNavMeshTile[];
  links?: RuntimeNavMeshLink[];
}

export function assertRuntimeNavMeshManifest(value: unknown): asserts value is RuntimeNavMeshManifest {
  if (!value || typeof value !== "object") throw new Error("NavMesh manifest must be an object.");
  const manifest = value as Partial<RuntimeNavMeshManifest>;
  if (manifest.format !== "splat-navmesh" || manifest.version !== 1) {
    throw new Error("Unsupported NavMesh manifest format/version.");
  }
  if (!Array.isArray(manifest.tiles)) throw new Error("NavMesh manifest must include tiles.");
  const ids = new Set<string>();
  for (const tile of manifest.tiles) {
    if (!tile || typeof tile.tileId !== "string" || !tile.tileId.trim()) {
      throw new Error("NavMesh tile is missing tileId.");
    }
    if (ids.has(tile.tileId)) throw new Error(`Duplicate NavMesh tile id: ${tile.tileId}`);
    ids.add(tile.tileId);
    assertBounds(tile.tileId, tile.bounds);
    if (typeof tile.walkable !== "boolean") throw new Error(`NavMesh tile ${tile.tileId} has invalid walkable flag.`);
  }
  if (manifest.links !== undefined) {
    if (!Array.isArray(manifest.links)) throw new Error("NavMesh links must be an array.");
    for (const link of manifest.links) {
      if (!link || typeof link.fromTileId !== "string" || typeof link.toTileId !== "string") {
        throw new Error("NavMesh link has invalid tile ids.");
      }
      if (!ids.has(link.fromTileId) || !ids.has(link.toTileId)) {
        throw new Error(`NavMesh link references missing tiles: ${link.fromTileId} -> ${link.toTileId}`);
      }
      if (link.portalBounds !== undefined) assertBounds(`${link.fromTileId}->${link.toTileId}`, link.portalBounds);
    }
  }
}

export function createNavMeshDebugGroup(manifest: RuntimeNavMeshManifest): THREE.Group {
  const group = new THREE.Group();
  group.name = `Runtime NavMesh: ${manifest.name ?? "unnamed"}`;
  for (const tile of manifest.tiles) {
    group.add(createBoundsLines(tile.bounds, tile.walkable ? 0x66ff99 : 0xff6677, `NavMesh tile: ${tile.tileId}`));
  }
  for (const link of manifest.links ?? []) {
    const from = manifest.tiles.find((tile) => tile.tileId === link.fromTileId);
    const to = manifest.tiles.find((tile) => tile.tileId === link.toTileId);
    if (!from || !to) continue;
    group.add(createLinkLine(centerOf(from.bounds), centerOf(to.bounds), 0x8fd3ff, `NavMesh link: ${link.fromTileId} -> ${link.toTileId}`));
    if (link.portalBounds) group.add(createBoundsLines(link.portalBounds, 0xffd166, `NavMesh portal: ${link.fromTileId} -> ${link.toTileId}`));
  }
  return group;
}

function createBoundsLines(bounds: BoundsData, color: number, name: string): THREE.LineSegments {
  const geometry = new THREE.BufferGeometry().setFromPoints(boundsLinePoints(bounds));
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.5 });
  const lines = new THREE.LineSegments(geometry, material);
  lines.name = name;
  return lines;
}

function createLinkLine(from: THREE.Vector3, to: THREE.Vector3, color: number, name: string): THREE.LineSegments {
  const geometry = new THREE.BufferGeometry().setFromPoints([from, to]);
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.75 });
  const lines = new THREE.LineSegments(geometry, material);
  lines.name = name;
  return lines;
}

function boundsLinePoints(bounds: BoundsData): THREE.Vector3[] {
  const min = bounds.min;
  const max = bounds.max;
  const vertices = [
    new THREE.Vector3(min[0], min[1], min[2]),
    new THREE.Vector3(max[0], min[1], min[2]),
    new THREE.Vector3(max[0], max[1], min[2]),
    new THREE.Vector3(min[0], max[1], min[2]),
    new THREE.Vector3(min[0], min[1], max[2]),
    new THREE.Vector3(max[0], min[1], max[2]),
    new THREE.Vector3(max[0], max[1], max[2]),
    new THREE.Vector3(min[0], max[1], max[2]),
  ];
  const edges = [0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7];
  return edges.map((index) => vertices[index]?.clone() ?? new THREE.Vector3());
}

function centerOf(bounds: BoundsData): THREE.Vector3 {
  return new THREE.Vector3(
    (bounds.min[0] + bounds.max[0]) / 2,
    (bounds.min[1] + bounds.max[1]) / 2,
    (bounds.min[2] + bounds.max[2]) / 2,
  );
}

function assertBounds(label: string, bounds: unknown): asserts bounds is BoundsData {
  if (!bounds || typeof bounds !== "object") throw new Error(`NavMesh ${label} has invalid bounds.`);
  const candidate = bounds as Partial<BoundsData>;
  if (!isVec3(candidate.min) || !isVec3(candidate.max)) throw new Error(`NavMesh ${label} has invalid bounds vectors.`);
  if (candidate.max[0] <= candidate.min[0] || candidate.max[1] <= candidate.min[1] || candidate.max[2] <= candidate.min[2]) {
    throw new Error(`NavMesh ${label} has empty bounds.`);
  }
}

function isVec3(value: unknown): value is Vec3Tuple {
  return Array.isArray(value) && value.length === 3 && value.every((item) => typeof item === "number" && Number.isFinite(item));
}
