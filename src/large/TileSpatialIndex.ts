import * as THREE from "three";
import type { LargeSplatTile } from "./LargeWorldTypes";

export interface TileSpatialIndexEntry<T> {
  id: string;
  value: T;
  bounds: THREE.Box3;
  sphere: THREE.Sphere;
}

interface GridCell {
  x: number;
  y: number;
  z: number;
}

export class TileSpatialIndex<T> {
  private readonly cells = new Map<string, TileSpatialIndexEntry<T>[]>();
  private readonly entries = new Map<string, TileSpatialIndexEntry<T>>();
  private readonly inverseCellSize: number;

  constructor(
    tiles: readonly LargeSplatTile[],
    valueForTile: (tile: LargeSplatTile) => T,
    cellSize: number,
  ) {
    this.inverseCellSize = 1 / Math.max(cellSize, 1e-6);
    for (const tile of tiles) {
      const bounds = boundsFromTile(tile);
      const sphere = new THREE.Sphere();
      bounds.getBoundingSphere(sphere);
      const entry: TileSpatialIndexEntry<T> = {
        id: tile.id,
        value: valueForTile(tile),
        bounds,
        sphere,
      };
      this.entries.set(tile.id, entry);
      this.insert(entry);
    }
  }

  querySphere(center: THREE.Vector3, radius: number): TileSpatialIndexEntry<T>[] {
    const queryBounds = new THREE.Box3(
      new THREE.Vector3(center.x - radius, center.y - radius, center.z - radius),
      new THREE.Vector3(center.x + radius, center.y + radius, center.z + radius),
    );
    const seen = new Set<string>();
    const output: TileSpatialIndexEntry<T>[] = [];
    const min = this.cellForPoint(queryBounds.min);
    const max = this.cellForPoint(queryBounds.max);

    for (let x = min.x; x <= max.x; x += 1) {
      for (let y = min.y; y <= max.y; y += 1) {
        for (let z = min.z; z <= max.z; z += 1) {
          const bucket = this.cells.get(cellKey(x, y, z));
          if (!bucket) continue;
          for (const entry of bucket) {
            if (seen.has(entry.id)) continue;
            seen.add(entry.id);
            if (entry.bounds.distanceToPoint(center) <= radius) output.push(entry);
          }
        }
      }
    }
    return output;
  }

  get(id: string): TileSpatialIndexEntry<T> | undefined {
    return this.entries.get(id);
  }

  get size(): number {
    return this.entries.size;
  }

  private insert(entry: TileSpatialIndexEntry<T>): void {
    const min = this.cellForPoint(entry.bounds.min);
    const max = this.cellForPoint(entry.bounds.max);
    for (let x = min.x; x <= max.x; x += 1) {
      for (let y = min.y; y <= max.y; y += 1) {
        for (let z = min.z; z <= max.z; z += 1) {
          const key = cellKey(x, y, z);
          const bucket = this.cells.get(key);
          if (bucket) bucket.push(entry);
          else this.cells.set(key, [entry]);
        }
      }
    }
  }

  private cellForPoint(point: THREE.Vector3): GridCell {
    return {
      x: Math.floor(point.x * this.inverseCellSize),
      y: Math.floor(point.y * this.inverseCellSize),
      z: Math.floor(point.z * this.inverseCellSize),
    };
  }
}

export function estimateTileIndexCellSize(tiles: readonly LargeSplatTile[]): number {
  if (tiles.length === 0) return 64;
  const sizes = tiles.map((tile) => {
    const bounds = boundsFromTile(tile);
    const size = bounds.getSize(new THREE.Vector3());
    return Math.max(size.x, size.y, size.z, 1);
  });
  sizes.sort((left, right) => left - right);
  return sizes[Math.floor(sizes.length / 2)] ?? 64;
}

function boundsFromTile(tile: LargeSplatTile): THREE.Box3 {
  return new THREE.Box3(
    new THREE.Vector3(tile.bounds.min[0], tile.bounds.min[1], tile.bounds.min[2]),
    new THREE.Vector3(tile.bounds.max[0], tile.bounds.max[1], tile.bounds.max[2]),
  );
}

function cellKey(x: number, y: number, z: number): string {
  return `${x}:${y}:${z}`;
}
