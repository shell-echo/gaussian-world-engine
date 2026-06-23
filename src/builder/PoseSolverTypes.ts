import type { Vec3Tuple } from "../types/world.js";

export interface PoseFrameInput {
  sourceId: string;
  frameGlob: string;
  cameraModel: string;
  width: number;
  height: number;
  fps: number;
}

export interface PoseSolverJob {
  format: "splat-pose-solver-job";
  version: 1;
  session: string;
  method: "colmap" | "slam" | "hybrid";
  coordinateSystem: "y-up";
  inputs: {
    frames: PoseFrameInput[];
    gpsTrack?: string;
    imuTrack?: string;
  };
  options: {
    loopClosure: boolean;
    gpsPrior: boolean;
    imuPrior: boolean;
    rollingShutterCompensation: boolean;
  };
  output: {
    poses: string;
    sparsePoints: string;
    report: string;
  };
}

export interface CameraPoseSample {
  frame: string;
  sourceId: string;
  t?: number;
  position: Vec3Tuple;
  rotation: [number, number, number, number];
  quality?: {
    reprojectionError?: number;
    trackedPoints?: number;
    isKeyframe?: boolean;
  };
}

export interface SparsePointSample {
  position: Vec3Tuple;
  color?: [number, number, number];
  trackLength?: number;
}

export interface PoseSolverResult {
  format: "splat-pose-result";
  version: 1;
  session: string;
  method: PoseSolverJob["method"];
  coordinateSystem: "y-up";
  scale: "metric" | "relative";
  poses: CameraPoseSample[];
  sparsePoints?: SparsePointSample[];
  diagnostics?: {
    loopClosureApplied?: boolean;
    gpsAligned?: boolean;
    imuAligned?: boolean;
    meanReprojectionError?: number;
    warnings?: string[];
  };
}

export function createEmptyPoseResult(job: PoseSolverJob): PoseSolverResult {
  return {
    format: "splat-pose-result",
    version: 1,
    session: job.session,
    method: job.method,
    coordinateSystem: job.coordinateSystem,
    scale: job.options.gpsPrior ? "metric" : "relative",
    poses: [],
    sparsePoints: [],
    diagnostics: {
      loopClosureApplied: false,
      gpsAligned: false,
      imuAligned: false,
      warnings: ["Generated placeholder. Fill this file with a real pose solver output."],
    },
  };
}
