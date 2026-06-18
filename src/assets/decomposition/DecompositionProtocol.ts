export interface DecompositionOptions {
  maxHulls: number;
  maxVerticesPerHull: number;
}

export interface DecompositionProgress {
  progress: number;
  stage: string;
}

export interface DecompositionStats {
  inputVertices: number;
  inputTriangles: number;
  outputHulls: number;
  outputPoints: number;
  elapsedMs: number;
  worker: boolean;
}

export interface DecompositionResult {
  vertices: Float32Array;
  offsets: Uint32Array;
  stats: DecompositionStats;
}

export interface DecompositionRequest {
  kind: "decompose";
  id: string;
  vertices: ArrayBuffer;
  indices: ArrayBuffer;
  maxHulls: number;
  maxVerticesPerHull: number;
}

export interface DecompositionCancelRequest {
  kind: "cancel";
  id: string;
}

export type DecompositionWorkerRequest = DecompositionRequest | DecompositionCancelRequest;

export interface DecompositionProgressMessage {
  kind: "progress";
  id: string;
  progress: number;
  stage: string;
}

export interface DecompositionResultMessage {
  kind: "result";
  id: string;
  vertices: ArrayBuffer;
  offsets: ArrayBuffer;
  stats: DecompositionStats;
}

export interface DecompositionErrorMessage {
  kind: "error";
  id: string;
  message: string;
}

export type DecompositionWorkerResponse =
  | DecompositionProgressMessage
  | DecompositionResultMessage
  | DecompositionErrorMessage;
