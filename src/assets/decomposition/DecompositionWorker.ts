import {
  DecompositionCancelledError,
  decomposeConvexParts,
} from "./ConvexDecomposer";
import type {
  DecompositionWorkerRequest,
  DecompositionWorkerResponse,
  DecompositionResultMessage,
} from "./DecompositionProtocol";

interface WorkerScope {
  onmessage: ((event: MessageEvent<DecompositionWorkerRequest>) => void) | null;
  postMessage(message: DecompositionWorkerResponse, transfer?: Transferable[]): void;
}

const scope = globalThis as unknown as WorkerScope;
const cancelledJobs = new Set<string>();

scope.onmessage = (event): void => {
  const request = event.data;
  if (request.kind === "cancel") {
    cancelledJobs.add(request.id);
    return;
  }
  void runTask(request);
};

async function runTask(
  request: Extract<DecompositionWorkerRequest, { kind: "decompose" }>,
): Promise<void> {
  cancelledJobs.delete(request.id);
  try {
    const result = await decomposeConvexParts(
      new Float32Array(request.vertices),
      new Uint32Array(request.indices),
      {
        maxHulls: request.maxHulls,
        maxVerticesPerHull: request.maxVerticesPerHull,
      },
      (progress) => {
        scope.postMessage({
          kind: "progress",
          id: request.id,
          progress: progress.progress,
          stage: progress.stage,
        });
      },
      () => cancelledJobs.has(request.id),
      true,
    );
    if (cancelledJobs.has(request.id)) throw new DecompositionCancelledError();

    const vertices = result.vertices.buffer as ArrayBuffer;
    const offsets = result.offsets.buffer as ArrayBuffer;
    const response: DecompositionResultMessage = {
      kind: "result",
      id: request.id,
      vertices,
      offsets,
      stats: result.stats,
    };
    scope.postMessage(response, [vertices, offsets]);
  } catch (error) {
    const errorMessage =
      error instanceof DecompositionCancelledError
        ? "Convex decomposition was cancelled."
        : error instanceof Error
          ? error.message
          : String(error);
    scope.postMessage({ kind: "error", id: request.id, message: errorMessage });
  } finally {
    cancelledJobs.delete(request.id);
  }
}
