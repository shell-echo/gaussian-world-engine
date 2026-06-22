import type { BoundsData, LargeWorldManifest } from "../large/LargeWorldTypes.js";
import type { Vec3Tuple } from "../types/world.js";

export interface CaptureCameraProfile {
  model: string;
  lens: "wide" | "linear" | "narrow" | "unknown";
  width: number;
  height: number;
  fps: number;
  stabilization?: "off" | "standard" | "horizon" | "unknown";
  rollingShutter?: boolean;
  intrinsics?: {
    fx: number;
    fy: number;
    cx: number;
    cy: number;
    distortion?: number[];
  };
}

export interface CaptureGpsSample {
  t: number;
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
}

export interface CaptureImuSample {
  t: number;
  gyro?: Vec3Tuple;
  accel?: Vec3Tuple;
}

export interface CaptureVideoSource {
  id: string;
  url: string;
  startTime?: string;
  durationSeconds?: number;
  camera: CaptureCameraProfile;
  gpsTrack?: string;
  imuTrack?: string;
}

export interface FrameSelectionPolicy {
  targetFps: number;
  minDistanceMeters?: number;
  minYawDegrees?: number;
  blurThreshold?: number;
  duplicateThreshold?: number;
}

export interface PoseSolvePolicy {
  method: "colmap" | "slam" | "hybrid";
  loopClosure: boolean;
  gpsPrior: boolean;
  imuPrior: boolean;
  rollingShutterCompensation?: boolean;
}

export interface ChunkingPolicy {
  strategy: "distance" | "frames" | "spatial-cluster";
  chunkMeters?: number;
  maxFrames?: number;
  overlapRatio: number;
}

export interface GaussianTrainingPolicy {
  trainer: "external-3dgs" | "nerfstudio" | "custom";
  maxIterations?: number;
  targetSplats?: number;
  appearanceNormalization?: boolean;
}

export interface TileExportPolicy {
  lodLevels: number;
  highMaxDistance: number;
  mediumMaxDistance: number;
  lowMaxDistance?: number;
  gpuBudgetBytes: number;
  outputFormat: "spz" | "ply" | "splat";
}

export interface CaptureBuilderPolicy {
  frames: FrameSelectionPolicy;
  poses: PoseSolvePolicy;
  chunks: ChunkingPolicy;
  training: GaussianTrainingPolicy;
  export: TileExportPolicy;
}

export interface CaptureRouteCheckpoint {
  id: string;
  label: string;
  t?: number;
  gps?: [number, number];
  positionHint?: Vec3Tuple;
}

export interface CaptureChunkPlan {
  id: string;
  bounds?: BoundsData;
  frameRange: [number, number];
  overlapWith?: string[];
  expectedTileId: string;
}

export interface CaptureSessionManifest {
  format: "splat-capture-session";
  version: 1;
  name: string;
  createdAt: string;
  coordinateSystem: "y-up";
  route: {
    kind: "loop" | "out-and-back" | "open-path";
    description?: string;
    checkpoints?: CaptureRouteCheckpoint[];
  };
  sources: CaptureVideoSource[];
  policy: CaptureBuilderPolicy;
  chunkPlan?: CaptureChunkPlan[];
  expectedOutput: {
    largeWorldManifest: string;
    assetRoot: string;
  };
}

export interface CaptureBuildStage {
  id:
    | "ingest"
    | "frame-selection"
    | "pose-solving"
    | "chunking"
    | "tile-training"
    | "lod-export"
    | "seam-normalization"
    | "manifest-export";
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  message?: string;
}

export interface CaptureBuildReport {
  format: "splat-capture-build-report";
  version: 1;
  session: string;
  stages: CaptureBuildStage[];
  output?: LargeWorldManifest;
}

export function assertCaptureSessionManifest(
  value: unknown,
): asserts value is CaptureSessionManifest {
  if (!value || typeof value !== "object") throw new Error("Capture session must be an object.");
  const manifest = value as Partial<CaptureSessionManifest>;
  if (manifest.format !== "splat-capture-session" || manifest.version !== 1) {
    throw new Error("Unsupported capture session format/version.");
  }
  if (!isNonEmptyString(manifest.name)) throw new Error("Capture session is missing a name.");
  if (!isNonEmptyString(manifest.createdAt)) throw new Error("Capture session is missing createdAt.");
  if (manifest.coordinateSystem !== "y-up") throw new Error("Capture session must use y-up coordinates.");
  if (!manifest.route || !isRouteKind(manifest.route.kind)) {
    throw new Error("Capture session has an invalid route kind.");
  }
  if (!Array.isArray(manifest.sources) || manifest.sources.length < 1) {
    throw new Error("Capture session needs at least one video source.");
  }
  for (const source of manifest.sources) assertVideoSource(source);
  assertPolicy(manifest.policy);
  if (!manifest.expectedOutput || !isNonEmptyString(manifest.expectedOutput.largeWorldManifest)) {
    throw new Error("Capture session is missing expected output manifest path.");
  }
  if (!isNonEmptyString(manifest.expectedOutput.assetRoot)) {
    throw new Error("Capture session is missing expected asset root.");
  }
}

function assertVideoSource(source: CaptureVideoSource): void {
  if (!source || !isNonEmptyString(source.id) || !isNonEmptyString(source.url)) {
    throw new Error("Capture source needs id and url.");
  }
  const camera = source.camera;
  if (!camera || !isNonEmptyString(camera.model)) throw new Error(`Capture source ${source.id} needs camera model.`);
  if (!isPositive(camera.width) || !isPositive(camera.height) || !isPositive(camera.fps)) {
    throw new Error(`Capture source ${source.id} has invalid camera dimensions or fps.`);
  }
}

function assertPolicy(policy: CaptureBuilderPolicy | undefined): void {
  if (!policy) throw new Error("Capture session is missing builder policy.");
  if (!isPositive(policy.frames?.targetFps)) throw new Error("Frame selection targetFps must be positive.");
  if (!policy.poses || !["colmap", "slam", "hybrid"].includes(policy.poses.method)) {
    throw new Error("Pose solve policy has invalid method.");
  }
  if (!policy.chunks || !["distance", "frames", "spatial-cluster"].includes(policy.chunks.strategy)) {
    throw new Error("Chunking policy has invalid strategy.");
  }
  if (typeof policy.chunks.overlapRatio !== "number" || policy.chunks.overlapRatio < 0 || policy.chunks.overlapRatio >= 0.5) {
    throw new Error("Chunking overlapRatio must be in [0, 0.5). ");
  }
  if (!policy.training || !["external-3dgs", "nerfstudio", "custom"].includes(policy.training.trainer)) {
    throw new Error("Training policy has invalid trainer.");
  }
  if (!policy.export || !isPositive(policy.export.lodLevels) || !isPositive(policy.export.gpuBudgetBytes)) {
    throw new Error("Export policy has invalid LOD or budget settings.");
  }
}

function isRouteKind(value: unknown): value is CaptureSessionManifest["route"]["kind"] {
  return value === "loop" || value === "out-and-back" || value === "open-path";
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isPositive(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}
