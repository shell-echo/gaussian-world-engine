import type {
  CameraPoseSample,
  PoseSolverJob,
  PoseSolverResult,
  SparsePointSample,
} from "./PoseSolverTypes.js";

interface ParsedColmapImage {
  id: number;
  qw: number;
  qx: number;
  qy: number;
  qz: number;
  tx: number;
  ty: number;
  tz: number;
  name: string;
}

interface ParsedColmapPoint {
  position: [number, number, number];
  color: [number, number, number];
  trackLength: number;
}

export interface ColmapTextModelConversion {
  poseResult: PoseSolverResult;
  sparsePoints: SparsePointSample[];
  report: {
    format: "splat-pose-report";
    version: 1;
    session: string;
    source: "colmap-text-model";
    images: number;
    sparsePoints: number;
    warnings: string[];
  };
}

export function convertColmapTextModel(
  job: PoseSolverJob,
  imagesText: string,
  points3DText: string,
): ColmapTextModelConversion {
  const images = parseImagesText(imagesText);
  const points = parsePoints3DText(points3DText);
  const warnings: string[] = [];

  if (images.length === 0) warnings.push("No registered images found in COLMAP images.txt.");
  if (points.length === 0) warnings.push("No sparse points found in COLMAP points3D.txt.");

  const defaultSource = job.inputs.frames[0]?.sourceId ?? "colmap";
  const poseResult: PoseSolverResult = {
    format: "splat-pose-result",
    version: 1,
    session: job.session,
    method: job.method,
    coordinateSystem: job.coordinateSystem,
    scale: job.options.gpsPrior ? "metric" : "relative",
    poses: images.map((image) => colmapImageToPose(image, defaultSource)),
    diagnostics: {
      loopClosureApplied: job.options.loopClosure,
      gpsAligned: false,
      imuAligned: false,
      warnings,
    },
  };

  const sparsePoints = points.map<SparsePointSample>((point) => ({
    position: point.position,
    color: point.color,
    trackLength: point.trackLength,
  }));

  return {
    poseResult,
    sparsePoints,
    report: {
      format: "splat-pose-report",
      version: 1,
      session: job.session,
      source: "colmap-text-model",
      images: images.length,
      sparsePoints: sparsePoints.length,
      warnings,
    },
  };
}

function parseImagesText(content: string): ParsedColmapImage[] {
  const lines = nonCommentLines(content);
  const images: ParsedColmapImage[] = [];
  for (let index = 0; index < lines.length; index += 2) {
    const line = lines[index];
    if (!line) continue;
    const parts = line.trim().split(/\s+/);
    if (parts.length < 10) continue;

    const id = readNumber(parts, 0);
    const qw = readNumber(parts, 1);
    const qx = readNumber(parts, 2);
    const qy = readNumber(parts, 3);
    const qz = readNumber(parts, 4);
    const tx = readNumber(parts, 5);
    const ty = readNumber(parts, 6);
    const tz = readNumber(parts, 7);
    const name = parts.slice(9).join(" ");
    if (!name) continue;
    if (!allFinite(id, qw, qx, qy, qz, tx, ty, tz)) continue;
    images.push({ id, qw, qx, qy, qz, tx, ty, tz, name });
  }
  return images.sort((left, right) => left.id - right.id);
}

function parsePoints3DText(content: string): ParsedColmapPoint[] {
  const points: ParsedColmapPoint[] = [];
  for (const line of nonCommentLines(content)) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 8) continue;
    const x = readNumber(parts, 1);
    const y = readNumber(parts, 2);
    const z = readNumber(parts, 3);
    const r = readNumber(parts, 4);
    const g = readNumber(parts, 5);
    const b = readNumber(parts, 6);
    if (!allFinite(x, y, z, r, g, b)) continue;
    points.push({
      position: [x, y, z],
      color: [clampByte(r), clampByte(g), clampByte(b)],
      trackLength: Math.max(0, parts.length - 8) / 2,
    });
  }
  return points;
}

function colmapImageToPose(image: ParsedColmapImage, sourceId: string): CameraPoseSample {
  const rotation = invertQuaternion([image.qx, image.qy, image.qz, image.qw]);
  return {
    frame: image.name,
    sourceId,
    position: cameraCenterFromWorldToCamera(image),
    rotation,
    quality: {
      isKeyframe: true,
    },
  };
}

function cameraCenterFromWorldToCamera(image: ParsedColmapImage): [number, number, number] {
  const matrix = quaternionToRotationMatrix([image.qx, image.qy, image.qz, image.qw]);
  const t: [number, number, number] = [image.tx, image.ty, image.tz];
  return [
    -(matrix[0][0] * t[0] + matrix[1][0] * t[1] + matrix[2][0] * t[2]),
    -(matrix[0][1] * t[0] + matrix[1][1] * t[1] + matrix[2][1] * t[2]),
    -(matrix[0][2] * t[0] + matrix[1][2] * t[1] + matrix[2][2] * t[2]),
  ];
}

function quaternionToRotationMatrix(
  quaternion: [number, number, number, number],
): [[number, number, number], [number, number, number], [number, number, number]] {
  const [x, y, z, w] = normalizeQuaternion(quaternion);
  const xx = x * x;
  const yy = y * y;
  const zz = z * z;
  const xy = x * y;
  const xz = x * z;
  const yz = y * z;
  const wx = w * x;
  const wy = w * y;
  const wz = w * z;
  return [
    [1 - 2 * (yy + zz), 2 * (xy - wz), 2 * (xz + wy)],
    [2 * (xy + wz), 1 - 2 * (xx + zz), 2 * (yz - wx)],
    [2 * (xz - wy), 2 * (yz + wx), 1 - 2 * (xx + yy)],
  ];
}

function invertQuaternion(
  quaternion: [number, number, number, number],
): [number, number, number, number] {
  const [x, y, z, w] = normalizeQuaternion(quaternion);
  return [-x, -y, -z, w];
}

function normalizeQuaternion(
  quaternion: [number, number, number, number],
): [number, number, number, number] {
  const [x, y, z, w] = quaternion;
  const length = Math.hypot(x, y, z, w) || 1;
  return [x / length, y / length, z / length, w / length];
}

function nonCommentLines(content: string): string[] {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

function readNumber(parts: readonly string[], index: number): number {
  const raw = parts[index];
  return raw === undefined ? Number.NaN : Number(raw);
}

function allFinite(...values: readonly number[]): boolean {
  return values.every(Number.isFinite);
}

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}
