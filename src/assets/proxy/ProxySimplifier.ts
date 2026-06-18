import type {
  ProxyProgress,
  ProxyTaskInput,
  ProxyTaskOutput,
  ProxyTaskStats,
} from "./ProxyProtocol";

interface MeshData {
  vertices: Float64Array;
  indices: Uint32Array;
}

interface EdgeRecord {
  a: number;
  b: number;
  count: number;
}

interface CollapseCandidate {
  a: number;
  b: number;
  x: number;
  y: number;
  z: number;
  cost: number;
}

interface QuadricBuild {
  quadrics: Float64Array;
  edges: EdgeRecord[];
  boundary: Uint8Array;
  diagonalSquared: number;
}

export type ProxyProgressCallback = (progress: ProxyProgress) => void;
export type ProxyCancelCheck = () => boolean;

const MAX_PROXY_TRIANGLES = 100_000;
const MAX_CONVEX_POINTS = 20_000;
const QEM_WORKING_TRIANGLES = 120_000;
const MIN_TRIANGLES = 4;
const EPSILON = 1e-12;

export class ProxyCancelledError extends Error {
  constructor() {
    super("Proxy generation was cancelled.");
    this.name = "ProxyCancelledError";
  }
}

export async function simplifyProxy(
  input: ProxyTaskInput,
  onProgress: ProxyProgressCallback = () => undefined,
  isCancelled: ProxyCancelCheck = () => false,
  worker = false,
): Promise<ProxyTaskOutput> {
  const startedAt = performance.now();
  validateInput(input);
  const originalVertices = input.vertices.length / 3;
  const originalTriangles = input.indices.length / 3;
  const detail = clamp(input.detail, 0.02, 1);
  let preclustered = false;

  report(onProgress, isCancelled, 0.03, "验证代理几何");
  await yieldControl();

  if (input.mode === "convex") {
    report(onProgress, isCancelled, 0.16, "聚类 Convex Hull 点集");
    const targetPoints = Math.max(
      4,
      Math.min(MAX_CONVEX_POINTS, Math.round(originalVertices * detail)),
    );
    const points = clusterPoints(input.vertices, targetPoints, isCancelled);
    const centered = centerVertices(points);
    report(onProgress, isCancelled, 1, "Convex Hull 点集完成");
    return {
      vertices: toFloat32(centered),
      indices: new Uint32Array(),
      stats: createStats(
        input.algorithm,
        originalVertices,
        originalTriangles,
        centered.length / 3,
        0,
        startedAt,
        worker,
        input.algorithm === "qem",
      ),
    };
  }

  let mesh = cleanMesh({
    vertices: toFloat64(input.vertices),
    indices: input.indices.slice(),
  });
  const targetTriangles = Math.max(
    MIN_TRIANGLES,
    Math.min(MAX_PROXY_TRIANGLES, Math.round(originalTriangles * detail)),
  );

  if (mesh.indices.length / 3 > targetTriangles) {
    if (input.algorithm === "cluster") {
      report(onProgress, isCancelled, 0.18, "执行顶点聚类简化");
      mesh = clusterMeshToTarget(mesh, targetTriangles, isCancelled);
    } else {
      if (mesh.indices.length / 3 > QEM_WORKING_TRIANGLES) {
        const preTarget = Math.min(
          QEM_WORKING_TRIANGLES,
          Math.max(targetTriangles + 1_000, Math.round(targetTriangles * 1.35)),
        );
        report(onProgress, isCancelled, 0.12, "QEM 预聚类");
        mesh = clusterMeshToTarget(mesh, preTarget, isCancelled);
        preclustered = true;
        await yieldControl();
      }
      report(onProgress, isCancelled, 0.2, "构建 QEM 二次误差");
      mesh = await simplifyQem(mesh, targetTriangles, onProgress, isCancelled);
    }
  }

  if (mesh.indices.length / 3 > MAX_PROXY_TRIANGLES) {
    mesh = limitTriangles(mesh, MAX_PROXY_TRIANGLES);
  }
  const centered = centerVertices(mesh.vertices);
  report(onProgress, isCancelled, 1, "碰撞代理完成");
  return {
    vertices: toFloat32(centered),
    indices: mesh.indices,
    stats: createStats(
      input.algorithm,
      originalVertices,
      originalTriangles,
      centered.length / 3,
      mesh.indices.length / 3,
      startedAt,
      worker,
      preclustered,
    ),
  };
}

async function simplifyQem(
  initial: MeshData,
  targetTriangles: number,
  onProgress: ProxyProgressCallback,
  isCancelled: ProxyCancelCheck,
): Promise<MeshData> {
  let mesh = initial;
  const startingTriangles = mesh.indices.length / 3;
  const reductionTarget = Math.max(1, startingTriangles - targetTriangles);

  for (let iteration = 0; iteration < 32; iteration += 1) {
    const triangleCount = mesh.indices.length / 3;
    if (triangleCount <= targetTriangles) break;
    ensureNotCancelled(isCancelled);

    const reduced = startingTriangles - triangleCount;
    const progress = 0.22 + 0.7 * clamp(reduced / reductionTarget, 0, 1);
    report(
      onProgress,
      isCancelled,
      progress,
      `QEM 边折叠 ${triangleCount.toLocaleString()} → ${targetTriangles.toLocaleString()}`,
    );

    const build = buildQuadrics(mesh, isCancelled);
    const candidates = buildCandidates(mesh, build, isCancelled);
    if (candidates.length === 0) break;
    candidates.sort((left, right) => left.cost - right.cost);

    const desiredReduction = triangleCount - targetTriangles;
    const pairLimit = Math.max(
      1,
      Math.min(
        20_000,
        Math.ceil(desiredReduction / 2),
        Math.floor(mesh.vertices.length / 3 * 0.12),
      ),
    );
    const selected = selectIndependentCandidates(
      candidates,
      mesh.vertices.length / 3,
      pairLimit,
    );
    if (selected.length === 0) break;

    const next = collapseCandidates(mesh, selected, isCancelled);
    if (next.indices.length >= mesh.indices.length) break;
    mesh = next;
    await yieldControl();
  }

  if (mesh.indices.length / 3 > targetTriangles) {
    report(onProgress, isCancelled, 0.94, "QEM 收尾聚类");
    mesh = clusterMeshToTarget(mesh, targetTriangles, isCancelled);
  }
  return mesh;
}

function buildQuadrics(mesh: MeshData, isCancelled: ProxyCancelCheck): QuadricBuild {
  const vertexCount = mesh.vertices.length / 3;
  const quadrics = new Float64Array(vertexCount * 10);
  const edges = new Map<string, EdgeRecord>();
  const bounds = computeBounds(mesh.vertices);
  const dx = bounds.maxX - bounds.minX;
  const dy = bounds.maxY - bounds.minY;
  const dz = bounds.maxZ - bounds.minZ;
  const diagonalSquared = Math.max(dx * dx + dy * dy + dz * dz, 1);

  for (let offset = 0; offset + 2 < mesh.indices.length; offset += 3) {
    if ((offset & 0x3ffff) === 0) ensureNotCancelled(isCancelled);
    const ia = valueAt(mesh.indices, offset);
    const ib = valueAt(mesh.indices, offset + 1);
    const ic = valueAt(mesh.indices, offset + 2);
    addEdge(edges, ia, ib);
    addEdge(edges, ib, ic);
    addEdge(edges, ic, ia);

    const ax = vertexAt(mesh.vertices, ia, 0);
    const ay = vertexAt(mesh.vertices, ia, 1);
    const az = vertexAt(mesh.vertices, ia, 2);
    const bx = vertexAt(mesh.vertices, ib, 0);
    const by = vertexAt(mesh.vertices, ib, 1);
    const bz = vertexAt(mesh.vertices, ib, 2);
    const cx = vertexAt(mesh.vertices, ic, 0);
    const cy = vertexAt(mesh.vertices, ic, 1);
    const cz = vertexAt(mesh.vertices, ic, 2);

    const abx = bx - ax;
    const aby = by - ay;
    const abz = bz - az;
    const acx = cx - ax;
    const acy = cy - ay;
    const acz = cz - az;
    let nx = aby * acz - abz * acy;
    let ny = abz * acx - abx * acz;
    let nz = abx * acy - aby * acx;
    const length = Math.hypot(nx, ny, nz);
    if (length <= EPSILON) continue;
    nx /= length;
    ny /= length;
    nz /= length;
    const d = -(nx * ax + ny * ay + nz * az);
    addPlaneQuadric(quadrics, ia, nx, ny, nz, d);
    addPlaneQuadric(quadrics, ib, nx, ny, nz, d);
    addPlaneQuadric(quadrics, ic, nx, ny, nz, d);
  }

  const boundary = new Uint8Array(vertexCount);
  for (const edge of edges.values()) {
    if (edge.count === 1) {
      boundary[edge.a] = 1;
      boundary[edge.b] = 1;
    }
  }
  return { quadrics, edges: Array.from(edges.values()), boundary, diagonalSquared };
}

function buildCandidates(
  mesh: MeshData,
  build: QuadricBuild,
  isCancelled: ProxyCancelCheck,
): CollapseCandidate[] {
  const candidates: CollapseCandidate[] = [];
  const q = new Float64Array(10);

  for (let edgeIndex = 0; edgeIndex < build.edges.length; edgeIndex += 1) {
    if ((edgeIndex & 0x1ffff) === 0) ensureNotCancelled(isCancelled);
    const edge = build.edges[edgeIndex];
    if (!edge) continue;
    const qa = edge.a * 10;
    const qb = edge.b * 10;
    for (let component = 0; component < 10; component += 1) {
      q[component] = valueAt(build.quadrics, qa + component) + valueAt(build.quadrics, qb + component);
    }

    const point = optimalPoint(mesh.vertices, edge.a, edge.b, q);
    let cost = evaluateQuadric(q, point[0], point[1], point[2]);
    const boundaryA = build.boundary[edge.a] === 1;
    const boundaryB = build.boundary[edge.b] === 1;
    if (boundaryA !== boundaryB) {
      cost += build.diagonalSquared * 1e8;
    } else if (boundaryA && boundaryB && edge.count !== 1) {
      cost += build.diagonalSquared * 1e6;
    } else if (edge.count === 1) {
      cost += build.diagonalSquared * 1e-5;
    }
    if (!Number.isFinite(cost)) continue;
    candidates.push({
      a: edge.a,
      b: edge.b,
      x: point[0],
      y: point[1],
      z: point[2],
      cost,
    });
  }
  return candidates;
}

function optimalPoint(
  vertices: Float64Array,
  a: number,
  b: number,
  q: Float64Array,
): [number, number, number] {
  const a00 = valueAt(q, 0);
  const a01 = valueAt(q, 1);
  const a02 = valueAt(q, 2);
  const a11 = valueAt(q, 4);
  const a12 = valueAt(q, 5);
  const a22 = valueAt(q, 7);
  const b0 = -valueAt(q, 3);
  const b1 = -valueAt(q, 6);
  const b2 = -valueAt(q, 8);

  const c00 = a11 * a22 - a12 * a12;
  const c01 = a02 * a12 - a01 * a22;
  const c02 = a01 * a12 - a02 * a11;
  const c11 = a00 * a22 - a02 * a02;
  const c12 = a01 * a02 - a00 * a12;
  const c22 = a00 * a11 - a01 * a01;
  const determinant = a00 * c00 + a01 * c01 + a02 * c02;

  if (Math.abs(determinant) > EPSILON) {
    const x = (c00 * b0 + c01 * b1 + c02 * b2) / determinant;
    const y = (c01 * b0 + c11 * b1 + c12 * b2) / determinant;
    const z = (c02 * b0 + c12 * b1 + c22 * b2) / determinant;
    if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) return [x, y, z];
  }

  const ax = vertexAt(vertices, a, 0);
  const ay = vertexAt(vertices, a, 1);
  const az = vertexAt(vertices, a, 2);
  const bx = vertexAt(vertices, b, 0);
  const by = vertexAt(vertices, b, 1);
  const bz = vertexAt(vertices, b, 2);
  const candidates: Array<[number, number, number]> = [
    [ax, ay, az],
    [bx, by, bz],
    [(ax + bx) / 2, (ay + by) / 2, (az + bz) / 2],
  ];
  let best = candidates[0] ?? [0, 0, 0];
  let bestCost = evaluateQuadric(q, best[0], best[1], best[2]);
  for (let index = 1; index < candidates.length; index += 1) {
    const candidate = candidates[index];
    if (!candidate) continue;
    const cost = evaluateQuadric(q, candidate[0], candidate[1], candidate[2]);
    if (cost < bestCost) {
      best = candidate;
      bestCost = cost;
    }
  }
  return best;
}

function selectIndependentCandidates(
  candidates: readonly CollapseCandidate[],
  vertexCount: number,
  limit: number,
): CollapseCandidate[] {
  const used = new Uint8Array(vertexCount);
  const selected: CollapseCandidate[] = [];
  for (const candidate of candidates) {
    if (used[candidate.a] === 1 || used[candidate.b] === 1) continue;
    used[candidate.a] = 1;
    used[candidate.b] = 1;
    selected.push(candidate);
    if (selected.length >= limit) break;
  }
  return selected;
}

function collapseCandidates(
  mesh: MeshData,
  candidates: readonly CollapseCandidate[],
  isCancelled: ProxyCancelCheck,
): MeshData {
  const vertexCount = mesh.vertices.length / 3;
  const replacement = new Int32Array(vertexCount);
  replacement.fill(-1);
  const vertices = mesh.vertices.slice();

  for (const candidate of candidates) {
    replacement[candidate.b] = candidate.a;
    const offset = candidate.a * 3;
    vertices[offset] = candidate.x;
    vertices[offset + 1] = candidate.y;
    vertices[offset + 2] = candidate.z;
  }

  const indices: number[] = [];
  const seen = new Set<string>();
  for (let offset = 0; offset + 2 < mesh.indices.length; offset += 3) {
    if ((offset & 0x3ffff) === 0) ensureNotCancelled(isCancelled);
    const a = resolveReplacement(replacement, valueAt(mesh.indices, offset));
    const b = resolveReplacement(replacement, valueAt(mesh.indices, offset + 1));
    const c = resolveReplacement(replacement, valueAt(mesh.indices, offset + 2));
    appendTriangle(indices, seen, vertices, a, b, c);
  }
  return compactMesh({ vertices, indices: new Uint32Array(indices) });
}

function clusterMeshToTarget(
  source: MeshData,
  targetTriangles: number,
  isCancelled: ProxyCancelCheck,
): MeshData {
  let mesh = source;
  for (let attempt = 0; attempt < 6 && mesh.indices.length / 3 > targetTriangles; attempt += 1) {
    ensureNotCancelled(isCancelled);
    const triangleRatio = targetTriangles / Math.max(mesh.indices.length / 3, 1);
    const vertexCount = mesh.vertices.length / 3;
    const targetVertices = Math.max(
      16,
      Math.floor(vertexCount * clamp(triangleRatio * (1.08 - attempt * 0.08), 0.02, 0.92)),
    );
    const clustered = clusterMesh(mesh, targetVertices, isCancelled);
    if (clustered.indices.length >= mesh.indices.length) break;
    mesh = clustered;
  }
  return mesh.indices.length / 3 > targetTriangles
    ? limitTriangles(mesh, targetTriangles)
    : mesh;
}

function clusterMesh(
  source: MeshData,
  targetVertices: number,
  isCancelled: ProxyCancelCheck,
): MeshData {
  const bounds = computeBounds(source.vertices);
  const resolution = Math.max(2, Math.round(Math.cbrt(targetVertices)));
  const extentX = Math.max(bounds.maxX - bounds.minX, 1e-9);
  const extentY = Math.max(bounds.maxY - bounds.minY, 1e-9);
  const extentZ = Math.max(bounds.maxZ - bounds.minZ, 1e-9);
  const cells = new Map<string, number>();
  const sumsX: number[] = [];
  const sumsY: number[] = [];
  const sumsZ: number[] = [];
  const counts: number[] = [];
  const vertexCount = source.vertices.length / 3;
  const remap = new Uint32Array(vertexCount);

  for (let vertex = 0; vertex < vertexCount; vertex += 1) {
    if ((vertex & 0x1ffff) === 0) ensureNotCancelled(isCancelled);
    const x = vertexAt(source.vertices, vertex, 0);
    const y = vertexAt(source.vertices, vertex, 1);
    const z = vertexAt(source.vertices, vertex, 2);
    const key = gridKey(
      x,
      y,
      z,
      bounds.minX,
      bounds.minY,
      bounds.minZ,
      extentX,
      extentY,
      extentZ,
      resolution,
    );
    let cell = cells.get(key);
    if (cell === undefined) {
      cell = cells.size;
      cells.set(key, cell);
      sumsX.push(0);
      sumsY.push(0);
      sumsZ.push(0);
      counts.push(0);
    }
    sumsX[cell] = (sumsX[cell] ?? 0) + x;
    sumsY[cell] = (sumsY[cell] ?? 0) + y;
    sumsZ[cell] = (sumsZ[cell] ?? 0) + z;
    counts[cell] = (counts[cell] ?? 0) + 1;
    remap[vertex] = cell;
  }

  const vertices = new Float64Array(cells.size * 3);
  for (let cell = 0; cell < cells.size; cell += 1) {
    const count = Math.max(counts[cell] ?? 1, 1);
    vertices[cell * 3] = (sumsX[cell] ?? 0) / count;
    vertices[cell * 3 + 1] = (sumsY[cell] ?? 0) / count;
    vertices[cell * 3 + 2] = (sumsZ[cell] ?? 0) / count;
  }

  const indices: number[] = [];
  const seen = new Set<string>();
  for (let offset = 0; offset + 2 < source.indices.length; offset += 3) {
    if ((offset & 0x3ffff) === 0) ensureNotCancelled(isCancelled);
    const a = valueAt(remap, valueAt(source.indices, offset));
    const b = valueAt(remap, valueAt(source.indices, offset + 1));
    const c = valueAt(remap, valueAt(source.indices, offset + 2));
    appendTriangle(indices, seen, vertices, a, b, c);
  }
  return compactMesh({ vertices, indices: new Uint32Array(indices) });
}

function clusterPoints(
  source: Float32Array,
  targetPoints: number,
  isCancelled: ProxyCancelCheck,
): Float64Array {
  const vertexCount = source.length / 3;
  const bounds = computeBounds(source);
  const resolution = Math.max(2, Math.round(Math.cbrt(targetPoints)));
  const extentX = Math.max(bounds.maxX - bounds.minX, 1e-9);
  const extentY = Math.max(bounds.maxY - bounds.minY, 1e-9);
  const extentZ = Math.max(bounds.maxZ - bounds.minZ, 1e-9);
  const cells = new Map<string, { x: number; y: number; z: number; count: number }>();

  for (let vertex = 0; vertex < vertexCount; vertex += 1) {
    if ((vertex & 0x1ffff) === 0) ensureNotCancelled(isCancelled);
    const x = vertexAt(source, vertex, 0);
    const y = vertexAt(source, vertex, 1);
    const z = vertexAt(source, vertex, 2);
    const key = gridKey(
      x,
      y,
      z,
      bounds.minX,
      bounds.minY,
      bounds.minZ,
      extentX,
      extentY,
      extentZ,
      resolution,
    );
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

  const points = Array.from(cells.values());
  const count = Math.min(points.length, MAX_CONVEX_POINTS);
  const output = new Float64Array(count * 3);
  const stride = Math.max(1, Math.ceil(points.length / count));
  let outputIndex = 0;
  for (let index = 0; index < points.length && outputIndex < count; index += stride) {
    const point = points[index];
    if (!point) continue;
    output[outputIndex * 3] = point.x / point.count;
    output[outputIndex * 3 + 1] = point.y / point.count;
    output[outputIndex * 3 + 2] = point.z / point.count;
    outputIndex += 1;
  }
  return outputIndex === count ? output : output.slice(0, outputIndex * 3);
}

function cleanMesh(source: MeshData): MeshData {
  const indices: number[] = [];
  const seen = new Set<string>();
  for (let offset = 0; offset + 2 < source.indices.length; offset += 3) {
    appendTriangle(
      indices,
      seen,
      source.vertices,
      valueAt(source.indices, offset),
      valueAt(source.indices, offset + 1),
      valueAt(source.indices, offset + 2),
    );
  }
  return compactMesh({ vertices: source.vertices, indices: new Uint32Array(indices) });
}

function compactMesh(source: MeshData): MeshData {
  const vertexCount = source.vertices.length / 3;
  const remap = new Int32Array(vertexCount);
  remap.fill(-1);
  const vertices: number[] = [];
  const indices = new Uint32Array(source.indices.length);

  for (let index = 0; index < source.indices.length; index += 1) {
    const oldIndex = valueAt(source.indices, index);
    let newIndex = remap[oldIndex] ?? -1;
    if (newIndex < 0) {
      newIndex = vertices.length / 3;
      remap[oldIndex] = newIndex;
      vertices.push(
        vertexAt(source.vertices, oldIndex, 0),
        vertexAt(source.vertices, oldIndex, 1),
        vertexAt(source.vertices, oldIndex, 2),
      );
    }
    indices[index] = newIndex;
  }
  return { vertices: new Float64Array(vertices), indices };
}

function limitTriangles(source: MeshData, maximum: number): MeshData {
  const triangleCount = source.indices.length / 3;
  if (triangleCount <= maximum) return source;
  const stride = Math.ceil(triangleCount / maximum);
  const indices: number[] = [];
  for (let triangle = 0; triangle < triangleCount; triangle += stride) {
    const offset = triangle * 3;
    indices.push(
      valueAt(source.indices, offset),
      valueAt(source.indices, offset + 1),
      valueAt(source.indices, offset + 2),
    );
  }
  return compactMesh({ vertices: source.vertices, indices: new Uint32Array(indices) });
}

function appendTriangle(
  output: number[],
  seen: Set<string>,
  vertices: Float64Array,
  a: number,
  b: number,
  c: number,
): void {
  if (a === b || b === c || c === a) return;
  if (triangleAreaSquared(vertices, a, b, c) <= EPSILON) return;
  const sorted = [a, b, c].sort((left, right) => left - right);
  const key = `${sorted[0] ?? 0}:${sorted[1] ?? 0}:${sorted[2] ?? 0}`;
  if (seen.has(key)) return;
  seen.add(key);
  output.push(a, b, c);
}

function triangleAreaSquared(vertices: Float64Array, a: number, b: number, c: number): number {
  const abx = vertexAt(vertices, b, 0) - vertexAt(vertices, a, 0);
  const aby = vertexAt(vertices, b, 1) - vertexAt(vertices, a, 1);
  const abz = vertexAt(vertices, b, 2) - vertexAt(vertices, a, 2);
  const acx = vertexAt(vertices, c, 0) - vertexAt(vertices, a, 0);
  const acy = vertexAt(vertices, c, 1) - vertexAt(vertices, a, 1);
  const acz = vertexAt(vertices, c, 2) - vertexAt(vertices, a, 2);
  const nx = aby * acz - abz * acy;
  const ny = abz * acx - abx * acz;
  const nz = abx * acy - aby * acx;
  return nx * nx + ny * ny + nz * nz;
}

function addPlaneQuadric(
  quadrics: Float64Array,
  vertex: number,
  a: number,
  b: number,
  c: number,
  d: number,
): void {
  const offset = vertex * 10;
  quadrics[offset] = valueAt(quadrics, offset) + a * a;
  quadrics[offset + 1] = valueAt(quadrics, offset + 1) + a * b;
  quadrics[offset + 2] = valueAt(quadrics, offset + 2) + a * c;
  quadrics[offset + 3] = valueAt(quadrics, offset + 3) + a * d;
  quadrics[offset + 4] = valueAt(quadrics, offset + 4) + b * b;
  quadrics[offset + 5] = valueAt(quadrics, offset + 5) + b * c;
  quadrics[offset + 6] = valueAt(quadrics, offset + 6) + b * d;
  quadrics[offset + 7] = valueAt(quadrics, offset + 7) + c * c;
  quadrics[offset + 8] = valueAt(quadrics, offset + 8) + c * d;
  quadrics[offset + 9] = valueAt(quadrics, offset + 9) + d * d;
}

function evaluateQuadric(q: Float64Array, x: number, y: number, z: number): number {
  return (
    valueAt(q, 0) * x * x +
    2 * valueAt(q, 1) * x * y +
    2 * valueAt(q, 2) * x * z +
    2 * valueAt(q, 3) * x +
    valueAt(q, 4) * y * y +
    2 * valueAt(q, 5) * y * z +
    2 * valueAt(q, 6) * y +
    valueAt(q, 7) * z * z +
    2 * valueAt(q, 8) * z +
    valueAt(q, 9)
  );
}

function addEdge(edges: Map<string, EdgeRecord>, first: number, second: number): void {
  const a = Math.min(first, second);
  const b = Math.max(first, second);
  const key = `${a}:${b}`;
  const edge = edges.get(key);
  if (edge) edge.count += 1;
  else edges.set(key, { a, b, count: 1 });
}

function resolveReplacement(replacement: Int32Array, vertex: number): number {
  const target = replacement[vertex] ?? -1;
  return target >= 0 ? target : vertex;
}

function centerVertices(vertices: Float64Array): Float64Array {
  if (vertices.length === 0) return vertices;
  const bounds = computeBounds(vertices);
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  const centerZ = (bounds.minZ + bounds.maxZ) / 2;
  const output = vertices.slice();
  for (let index = 0; index < output.length; index += 3) {
    output[index] = valueAt(output, index) - centerX;
    output[index + 1] = valueAt(output, index + 1) - centerY;
    output[index + 2] = valueAt(output, index + 2) - centerZ;
  }
  return output;
}

function computeBounds(vertices: ArrayLike<number>): {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
} {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let minZ = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;
  for (let index = 0; index < vertices.length; index += 3) {
    const x = valueAt(vertices, index);
    const y = valueAt(vertices, index + 1);
    const z = valueAt(vertices, index + 2);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    minZ = Math.min(minZ, z);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    maxZ = Math.max(maxZ, z);
  }
  return { minX, minY, minZ, maxX, maxY, maxZ };
}

function gridKey(
  x: number,
  y: number,
  z: number,
  minX: number,
  minY: number,
  minZ: number,
  extentX: number,
  extentY: number,
  extentZ: number,
  resolution: number,
): string {
  const gx = Math.min(resolution - 1, Math.max(0, Math.floor(((x - minX) / extentX) * resolution)));
  const gy = Math.min(resolution - 1, Math.max(0, Math.floor(((y - minY) / extentY) * resolution)));
  const gz = Math.min(resolution - 1, Math.max(0, Math.floor(((z - minZ) / extentZ) * resolution)));
  return `${gx}:${gy}:${gz}`;
}

function validateInput(input: ProxyTaskInput): void {
  if (input.vertices.length < 9 || input.vertices.length % 3 !== 0) {
    throw new Error("Proxy source has invalid vertices.");
  }
  if (input.indices.length < 3 || input.indices.length % 3 !== 0) {
    throw new Error("Proxy source has invalid triangle indices.");
  }
  const vertexCount = input.vertices.length / 3;
  for (let index = 0; index < input.indices.length; index += 1) {
    if (valueAt(input.indices, index) >= vertexCount) {
      throw new Error("Proxy source contains an out-of-range triangle index.");
    }
  }
}

function createStats(
  algorithm: ProxyTaskStats["algorithm"],
  originalVertices: number,
  originalTriangles: number,
  outputVertices: number,
  outputTriangles: number,
  startedAt: number,
  worker: boolean,
  preclustered: boolean,
): ProxyTaskStats {
  return {
    algorithm,
    originalVertices,
    originalTriangles,
    outputVertices,
    outputTriangles,
    elapsedMs: Math.max(0, performance.now() - startedAt),
    worker,
    preclustered,
  };
}

function report(
  callback: ProxyProgressCallback,
  isCancelled: ProxyCancelCheck,
  progress: number,
  stage: string,
): void {
  ensureNotCancelled(isCancelled);
  callback({ progress: clamp(progress, 0, 1), stage });
}

function ensureNotCancelled(isCancelled: ProxyCancelCheck): void {
  if (isCancelled()) throw new ProxyCancelledError();
}

function valueAt(values: ArrayLike<number>, index: number): number {
  return values[index] ?? 0;
}

function vertexAt(vertices: ArrayLike<number>, vertex: number, component: 0 | 1 | 2): number {
  return valueAt(vertices, vertex * 3 + component);
}

function toFloat64(values: Float32Array): Float64Array {
  return Float64Array.from(values);
}

function toFloat32(values: Float64Array): Float32Array {
  return Float32Array.from(values);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function yieldControl(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
