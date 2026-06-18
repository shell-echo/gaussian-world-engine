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
  const message = event.data;
  if (message.kind === "cancel") {
    cancelledJobs.add(message.id);
    return;
  }
  void runTask(message);
};

async function runTask(
  message: Extract<DecompositionWorkerRequest, { kind: "decompose" }>,
): Promise<void> {
  cancelledJobs.delete(message.id);
  try {
    const result = await decomposeConvexParts(
      new Float32Array(message.vertices),
      new Uint32Array(message.indices),
      {
        maxHulls: message.maxHulls,
        maxVerticesPerHull: message.maxVerticesPerHull,
      },
      (progress) => {
        scope.postMessage({
          kind: "progress",
          id: message.id,
          progress: progress.progress,
          stage: progress.stage,
        });
      },
      () => cancelledJobs.has(message.id),
      true,
    );
    if (cancelledJobs.has(message.id)) throw new DecompositionCancelledError();

    const vertices = result.vertices.buffer as ArrayBuffer;
    const offsets = result.offsets.buffer as ArrayBuffer;
    const response: DecompositionResultMessage = {
      kind: "result",
      id: message.id,
      vertices,
      offsets,
      stats: result.stats,
    };
    scope.postMessage(response, [vertices, offsets]);
  } catch (error) {
    const message =
      error instanceof DecompositionCancelledError
        ? "Convex decomposition was cancelled."
        : error instanceof Error
          ? error.message
          : String(error);
    scope.postMessage({ kind: "error", id: messageId(message), message });
  } finally {
    cancelledJobs.delete(message.id);
  }
}

function messageId(value: unknown): string {
  void value;
  return "unknown";
}
