export type ProxyMode = "trimesh" | "convex";
export type ProxySimplifierAlgorithm = "qem" | "cluster";

export interface ProxyTaskInput {
  mode: ProxyMode;
  algorithm: ProxySimplifierAlgorithm;
  detail: number;
  vertices: Float32Array;
  indices: Uint32Array;
}

export interface ProxyTaskStats {
  algorithm: ProxySimplifierAlgorithm;
  originalVertices: number;
  originalTriangles: number;
  outputVertices: number;
  outputTriangles: number;
  elapsedMs: number;
  worker: boolean;
  preclustered: boolean;
}

export interface ProxyTaskOutput {
  vertices: Float32Array;
  indices: Uint32Array;
  stats: ProxyTaskStats;
}

export interface ProxyProgress {
  progress: number;
  stage: string;
}

export interface ProxyWorkerSimplifyMessage {
  kind: "simplify";
  id: string;
  mode: ProxyMode;
  algorithm: ProxySimplifierAlgorithm;
  detail: number;
  vertices: ArrayBuffer;
  indices: ArrayBuffer;
}

export interface ProxyWorkerCancelMessage {
  kind: "cancel";
  id: string;
}

export type ProxyWorkerRequest = ProxyWorkerSimplifyMessage | ProxyWorkerCancelMessage;

export interface ProxyWorkerProgressMessage {
  kind: "progress";
  id: string;
  progress: number;
  stage: string;
}

export interface ProxyWorkerResultMessage {
  kind: "result";
  id: string;
  vertices: ArrayBuffer;
  indices: ArrayBuffer;
  stats: ProxyTaskStats;
}

export interface ProxyWorkerErrorMessage {
  kind: "error";
  id: string;
  message: string;
}

export type ProxyWorkerResponse =
  | ProxyWorkerProgressMessage
  | ProxyWorkerResultMessage
  | ProxyWorkerErrorMessage;
