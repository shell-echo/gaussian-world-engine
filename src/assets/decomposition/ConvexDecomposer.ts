import type {
  DecompositionOptions,
  DecompositionProgress,
  DecompositionResult,
  DecompositionStats,
} from "./DecompositionProtocol";

interface TriangleCluster {
  triangles: number[];
}

interface Bounds {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
}

export type DecompositionProgressCallback = (progress: DecompositionProgress) => void;
export type DecompositionCancelCheck = () => boolean;

const MIN_HULLS = 1;
const MAX_HULLS = 32;
const MIN_VERTICES_PER_HULL = 8;
const MAX_VERTICES_PER_HULL = 256;
const MIN_TRIANGLES_TO_SPLIT = 6;
const EPSILON = 1e-10;

export class DecompositionCancelledError extends Error {
  constructor() {
    super("Convex decomposition was cancelled.");
    this.name = "DecompositionCancelledError";
  }
}

export async function decomposeConvexParts(
  vertices: Float32Array,
  indices: Uint32Array,
  options: DecompositionOptions,
  onProgress: DecompositionProgressCallback = () => undefined,
  isCancelled: DecompositionCancelCheck = () => false,
  worker = false,
): Promise<DecompositionResult> {
  validateGeometry(vertices, indices);
  const startedAt = performance.now();
  const maxHulls = clampInteger(options.maxHulls, MIN_HULLS, MAX_HULLS);
  const maxVerticesPerHull = clampInteger(
    options.maxVerticesPerHull,
    MIN_VERTICES_PER_HULL,
    MAX_VERTICES_PER_HULL,
  );
  const triangleCount = indices.length / 3;
  const clusters: TriangleCluster[] = [
    { triangles: Array.from({ length: triangleCount }, (_, index) => index) },
  ];

  report(onProgress, isCancelled, 0.04, "分析凹形网格");
  await yieldControl();

  while (clusters.length < maxHulls) {
    ensureNotCancelled(isCancelled);
    let bestIndex = -1;
    let bestScore = Number.NEGATIVE_INFINITY;
    for (let index = 0; index < clusters.length; index += 1) {
      const cluster = clusters[index];
      if (!cluster || cluster.triangles.length < MIN_TRIANGLES_TO_SPLIT) continue;
      const score = clusterScore(vertices, indices, cluster);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    }
    if (bestIndex < 0) break;

    const source = clusters[bestIndex];
    if (!source) break;
    const split = splitCluster(vertices, indices, source);
    if (!split) break;
    clusters.splice(bestIndex, 1, split[0], split[1]);
    report(
      onProgress,
      isCancelled,
      0.08 + 0.56 * (clusters.length / maxHulls),
      `递归分割 · ${clusters.length}/${maxHulls} Hulls`,
    );
    await yieldControl();
  }

  const parts: Float32Array[] = [];
  let outputPoints = 0;
  for (let index = 0; index < clusters.length; index += 1) {
    ensureNotCancelled(isCancelled);
    const cluster = clusters[index];
    if (!cluster) continue;
    const points = pointsForCluster(
      vertices,
      indices,
      cluster,
      maxVerticesPerHull,
    );
    if (points.length < 12 || !hasVolume(points)) continue;
    parts.push(points);
    outputPoints += points.length / 3;
    report(
      onProgress,
      isCancelled,
      0.66 + 0.3 * ((index + 1) / Math.max(clusters.length, 1)),
      `构建 Convex Hull ${index + 1}/${clusters.length}`,
    );
    await yieldControl();
  }

  if (parts.length === 0) {
    const fallback = clusterPoints(vertices, maxVerticesPerHull);
    if (fallback.length < 12 || !hasVolume(fallback)) {
      throw new Error("Unable to produce a volumetric convex hull from this mesh.");
    }
    parts.push(fallback);
    outputPoints = fallback.length / 3;
  }

  const offsets = new Uint32Array(parts.length + 1);
  const flattened = new Float32Array(outputPoints * 3);
  let vertexOffset = 0;
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    if (!part) continue;
    offsets[index] = vertexOffset;
    flattened.set(part, vertexOffset * 3);
    vertexOffset += part.length / 3;
  }
  offsets[parts.length] = vertexOffset;

  const stats: DecompositionStats = {
    inputVertices: vertices.length / 3,
    inputTriangles: triangleCount,
    outputHulls: parts.length,
    outputPoints,
    elapsedMs: Math.max(0, performance.now() - startedAt),
    worker,
  };
  report(onProgress, isCancelled, 1, `Convex Decomposition 完成 · ${parts.length} Hulls`);
  return { vertices: flattened, offsets, stats };
}

function splitCluster(
  vertices: Float32Array,
  indices: Uint32Array,
  cluster: TriangleCluster,
): [TriangleCluster, TriangleCluster] | null {
  const centroids = cluster.triangles.map((triangle) => ({
    triangle,
    x: triangleCentroid(vertices, indices, triangle, 0),
    y: triangleCentroid(vertices, indices, triangle, 1),
    z: triangleCentroid(vertices, indices, triangle, 2),
  }));
  if (centroids.length < MIN_TRIANGLES_TO_SPLIT) return null;

  const bounds = boundsForCentroids(centroids);
  const extents = [
    bounds.maxX - bounds.minX,
    bounds.maxY - bounds.minY,
    bounds.maxZ - bounds.minZ,
  ];
  const axes = [0, 1, 2].sort(
    (left, right) => (extents[right] ?? 0) - (extents[left] ?? 0),
  );

  for (const axis of axes) {
    const sorted = [...centroids].sort((left, right) => component(left, axis) - component(right, axis));
    const middle = Math.floor(sorted.length / 2);
    const leftTriangles = sorted.slice(0, middle).map((entry) => entry.triangle);
    const rightTriangles = sorted.slice(middle).map((entry) => entry.triangle);
    if (leftTriangles.length < 2 || rightTriangles.length < 2) continue;
    if (
      uniqueVertexCount(indices, leftTriangles) < 4 ||
      uniqueVertexCount(indices, rightTriangles) < 4
    ) {
      continue;
    }
    return [
      { triangles: leftTriangles },
      { triangles: rightTriangles },
    ];
  }
  return null;
}

function clusterScore(
  vertices: Float32Array,
  indices: Uint32Array,
  cluster: TriangleCluster,
): number {
  const bounds = emptyBounds();
  for (const triangle of cluster.triangles) {
    for (let corner = 0; corner < 3; corner += 1) {
      const vertex = indexAt(indices, triangle * 3 + corner);
      expandBounds(bounds, vertexAt(vertices, vertex, 0), vertexAt(vertices, vertex, 1), vertexAt(vertices, vertex, 2));
    }
  }
  const dx = bounds.maxX - bounds.minX;
  const dy = bounds.maxY - bounds.minY;
  const dz = bounds.maxZ - bounds.minZ;
  return cluster.triangles.length * Math.max(dx * dy + dy * dz + dz * dx, EPSILON);
}

function pointsForCluster(
  vertices: Float32Array,
  indices: Uint32Array,
  cluster: TriangleCluster,
  maximum: number,
): Float32Array {
  const unique = new Set<number>();
  for (const triangle of cluster.triangles) {
    unique.add(indexAt(indices, triangle * 3));
    unique.add(indexAt(indices, triangle * 3 + 1));
    unique.add(indexAt(indices, triangle * 3 + 2));
  }
  const points = new Float32Array(unique.size * 3);
  let output = 0;
  for (const vertex of unique) {
    points[output] = vertexAt(vertices, vertex, 0);
    points[output + 1] = vertexAt(vertices, vertex, 1);
    points[output + 2] = vertexAt(vertices, vertex, 2);
    output += 3;
  }
  return points.length / 3 > maximum ? clusterPoints(points, maximum) : deduplicatePoints(points);
}

function clusterPoints(source: Float32Array, target: number): Float32Array {
  const bounds = boundsForVertices(source);
  const resolution = Math.max(2, Math.ceil(Math.cbrt(target)));
  const extentX = Math.max(bounds.maxX - bounds.minX, 1e-9);
  const extentY = Math.max(bounds.maxY - bounds.minY, 1e-9);
  const extentZ = Math.max(bounds.maxZ - bounds.minZ, 1e-9);
  const cells = new Map<string, { x: number; y: number; z: number; count: number }>();

  for (let index = 0; index < source.length; index += 3) {
    const x = valueAt(source, index);
    const y = valueAt(source, index + 1);
    const z = valueAt(source, index + 2);
    const gx = Math.min(resolution - 1, Math.max(0, Math.floor(((x - bounds.minX) / extentX) * resolution)));
    const gy = Math.min(resolution - 1, Math.max(0, Math.floor(((y - bounds.minY) / extentY) * resolution)));
    const gz = Math.min(resolution - 1, Math.max(0, Math.floor(((z - bounds.minZ) / extentZ) * resolution)));
    const key = `${gx}:${gy}:${gz}`;
    const cell = cells.get(key);
    if (cell) {
      cell.x += x;
      cell.y += y;
      cell.z += z;
      cell.count += 1;
    } else {
      cells.set(key, { x, y, z, count: 1 });
    }
  }

  const values = Array.from(cells.values());
  const stride = Math.max(1, Math.ceil(values.length / target));
  const selected = values.filter((_, index) => index % stride === 0).slice(0, target);
  const output = new Float32Array(selected.length * 3);
  selected.forEach((cell, index) => {
    output[index * 3] = cell.x / cell.count;
    output[index * 3 + 1] = cell.y / cell.count;
    output[index * 3 + 2] = cell.z / cell.count;
  });
  return deduplicatePoints(output);
}

function deduplicatePoints(source: Float32Array): Float32Array {
  const seen = new Set<string>();
  const values: number[] = [];
  for (let index = 0; index < source.length; index += 3) {
    const x = valueAt(source, index);
    const y = valueAt(source, index + 1);
    const z = valueAt(source, index + 2);
    const key = `${x.toFixed(6)}:${y.toFixed(6)}:${z.toFixed(6)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    values.push(x, y, z);
  }
  return new Float32Array(values);
}

function hasVolume(points: Float32Array): boolean {
  const count = points.length / 3;
  if (count < 4) return false;
  const ax = vertexAt(points, 0, 0);
  const ay = vertexAt(points, 0, 1);
  const az = vertexAt(points, 0, 2);
  for (let b = 1; b < count - 2; b += 1) {
    const abx = vertexAt(points, b, 0) - ax;
    const aby = vertexAt(points, b, 1) - ay;
    const abz = vertexAt(points, b, 2) - az;
    for (let c = b + 1; c < count - 1; c += 1) {
      const acx = vertexAt(points, c, 0) - ax;
      const acy = vertexAt(points, c, 1) - ay;
      const acz = vertexAt(points, c, 2) - az;
      const nx = aby * acz - abz * acy;
      const ny = abz * acx - abx * acz;
      const nz = abx * acy - aby * acx;
      for (let d = c + 1; d < count; d += 1) {
        const adx = vertexAt(points, d, 0) - ax;
        const ady = vertexAt(points, d, 1) - ay;
        const adz = vertexAt(points, d, 2) - az;
        const volume6 = Math.abs(nx * adx + ny * ady + nz * adz);
        if (volume6 > EPSILON) return true;
      }
    }
  }
  return false;
}

function triangleCentroid(
  vertices: Float32Array,
  indices: Uint32Array,
  triangle: number,
  componentIndex: 0 | 1 | 2,
): number {
  const offset = triangle * 3;
  return (
    vertexAt(vertices, indexAt(indices, offset), componentIndex) +
    vertexAt(vertices, indexAt(indices, offset + 1), componentIndex) +
    vertexAt(vertices, indexAt(indices, offset + 2), componentIndex)
  ) / 3;
}

function uniqueVertexCount(indices: Uint32Array, triangles: readonly number[]): number {
  const vertices = new Set<number>();
  for (const triangle of triangles) {
    vertices.add(indexAt(indices, triangle * 3));
    vertices.add(indexAt(indices, triangle * 3 + 1));
    vertices.add(indexAt(indices, triangle * 3 + 2));
  }
  return vertices.size;
}

function boundsForCentroids(values: readonly { x: number; y: number; z: number }[]): Bounds {
  const bounds = emptyBounds();
  for (const value of values) expandBounds(bounds, value.x, value.y, value.z);
  return bounds;
}

function boundsForVertices(vertices: Float32Array): Bounds {
  const bounds = emptyBounds();
  for (let index = 0; index < vertices.length; index += 3) {
    expandBounds(bounds, valueAt(vertices, index), valueAt(vertices, index + 1), valueAt(vertices, index + 2));
  }
  return bounds;
}

function emptyBounds(): Bounds {
  return {
    minX: Number.POSITIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    minZ: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
    maxZ: Number.NEGATIVE_INFINITY,
  };
}

function expandBounds(bounds: Bounds, x: number, y: number, z: number): void {
  bounds.minX = Math.min(bounds.minX, x);
  bounds.minY = Math.min(bounds.minY, y);
  bounds.minZ = Math.min(bounds.minZ, z);
  bounds.maxX = Math.max(bounds.maxX, x);
  bounds.maxY = Math.max(bounds.maxY, y);
  bounds.maxZ = Math.max(bounds.maxZ, z);
}

function component(value: { x: number; y: number; z: number }, axis: number): number {
  return axis === 0 ? value.x : axis === 1 ? value.y : value.z;
}

function validateGeometry(vertices: Float32Array, indices: Uint32Array): void {
  if (vertices.length < 12 || vertices.length % 3 !== 0) {
    throw new Error("Decomposition source has invalid vertices.");
  }
  if (indices.length < 3 || indices.length % 3 !== 0) {
    throw new Error("Decomposition source has invalid triangle indices.");
  }
  const vertexCount = vertices.length / 3;
  for (let index = 0; index < indices.length; index += 1) {
    if (indexAt(indices, index) >= vertexCount) {
      throw new Error("Decomposition source contains an out-of-range index.");
    }
  }
}

function report(
  callback: DecompositionProgressCallback,
  isCancelled: DecompositionCancelCheck,
  progress: number,
  stage: string,
): void {
  ensureNotCancelled(isCancelled);
  callback({ progress: Math.min(Math.max(progress, 0), 1), stage });
}

function ensureNotCancelled(isCancelled: DecompositionCancelCheck): void {
  if (isCancelled()) throw new DecompositionCancelledError();
}

function valueAt(values: ArrayLike<number>, index: number): number {
  return values[index] ?? 0;
}

function indexAt(values: Uint32Array, index: number): number {
  return values[index] ?? 0;
}

function vertexAt(
  vertices: ArrayLike<number>,
  vertex: number,
  componentIndex: 0 | 1 | 2,
): number {
  return valueAt(vertices, vertex * 3 + componentIndex);
}

function clampInteger(value: number, minimum: number, maximum: number): number {
  return Math.round(Math.min(Math.max(Number.isFinite(value) ? value : minimum, minimum), maximum));
}

function yieldControl(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
