import type { BoundsData, LargeSplatTile, LargeSplatTileLod } from "../large/LargeWorldTypes.js";

export interface SeamTileInput {
  tileId: string;
  chunkId: string;
  bounds: BoundsData;
  splatDirectory: string;
  lods: LargeSplatTileLod[];
  neighbors: string[];
}

export interface SeamPairInput {
  id: string;
  tileA: string;
  tileB: string;
  overlapBounds?: BoundsData;
  weight: number;
}

export interface SeamOptimizationJob {
  format: "splat-seam-optimization-job";
  version: 1;
  session: string;
  largeWorldManifest: string;
  trainingJobIndex: string;
  inputs: {
    tiles: SeamTileInput[];
    pairs: SeamPairInput[];
  };
  options: {
    exposureMatching: boolean;
    seamNormalization: boolean;
    overlapSampleCount: number;
    protectHighConfidenceTiles: boolean;
  };
  output: {
    exposurePlan: string;
    seamReport: string;
    adjustedManifest: string;
  };
}

export interface TileExposureAdjustment {
  tileId: string;
  exposureStops: number;
  gain: [number, number, number];
  bias: [number, number, number];
}

export interface ExposurePlan {
  format: "splat-exposure-plan";
  version: 1;
  session: string;
  adjustments: TileExposureAdjustment[];
}

export interface SeamOptimizationReport {
  format: "splat-seam-report";
  version: 1;
  session: string;
  status: "pending" | "running" | "completed" | "failed";
  tileCount: number;
  pairCount: number;
  message: string;
}

export function createSeamOptimizationJob(
  sessionPath: string,
  largeWorldManifest: string,
  trainingJobIndex: string,
  tiles: readonly LargeSplatTile[],
): SeamOptimizationJob {
  return {
    format: "splat-seam-optimization-job",
    version: 1,
    session: sessionPath,
    largeWorldManifest,
    trainingJobIndex,
    inputs: {
      tiles: tiles.map((tile) => ({
        tileId: tile.id,
        chunkId: tile.id.replace(/^tile_/, "chunk_"),
        bounds: tile.bounds,
        splatDirectory: `large-world/splats/${tile.id}`,
        lods: tile.lods,
        neighbors: tile.neighbors ?? [],
      })),
      pairs: createPairs(tiles),
    },
    options: {
      exposureMatching: true,
      seamNormalization: true,
      overlapSampleCount: 4096,
      protectHighConfidenceTiles: true,
    },
    output: {
      exposurePlan: "seams/exposure-plan.json",
      seamReport: "seams/seam-report.json",
      adjustedManifest: "large-world/world.adjusted.json",
    },
  };
}

export function createPlaceholderExposurePlan(job: SeamOptimizationJob): ExposurePlan {
  return {
    format: "splat-exposure-plan",
    version: 1,
    session: job.session,
    adjustments: job.inputs.tiles.map((tile) => ({
      tileId: tile.tileId,
      exposureStops: 0,
      gain: [1, 1, 1],
      bias: [0, 0, 0],
    })),
  };
}

export function createPlaceholderSeamReport(job: SeamOptimizationJob): SeamOptimizationReport {
  return {
    format: "splat-seam-report",
    version: 1,
    session: job.session,
    status: "pending",
    tileCount: job.inputs.tiles.length,
    pairCount: job.inputs.pairs.length,
    message: "Generated placeholder. Run a seam/exposure optimizer to fill exposure-plan.json and world.adjusted.json.",
  };
}

function createPairs(tiles: readonly LargeSplatTile[]): SeamPairInput[] {
  const byId = new Map(tiles.map((tile) => [tile.id, tile] as const));
  const seen = new Set<string>();
  const pairs: SeamPairInput[] = [];

  for (const tile of tiles) {
    for (const neighborId of tile.neighbors ?? []) {
      const neighbor = byId.get(neighborId);
      if (!neighbor) continue;
      const id = pairId(tile.id, neighbor.id);
      if (seen.has(id)) continue;
      seen.add(id);
      pairs.push({
        id,
        tileA: tile.id,
        tileB: neighbor.id,
        overlapBounds: intersectBounds(tile.bounds, neighbor.bounds),
        weight: 1,
      });
    }
  }

  return pairs;
}

function pairId(a: string, b: string): string {
  return [a, b].sort().join("__");
}

function intersectBounds(a: BoundsData, b: BoundsData): BoundsData | undefined {
  const min: BoundsData["min"] = [
    Math.max(a.min[0], b.min[0]),
    Math.max(a.min[1], b.min[1]),
    Math.max(a.min[2], b.min[2]),
  ];
  const max: BoundsData["max"] = [
    Math.min(a.max[0], b.max[0]),
    Math.min(a.max[1], b.max[1]),
    Math.min(a.max[2], b.max[2]),
  ];
  if (max[0] <= min[0] || max[1] <= min[1] || max[2] <= min[2]) return undefined;
  return { min, max };
}
