import { ProxyCancelledError, simplifyProxy } from "./ProxySimplifier";
import type {
  ProxyWorkerRequest,
  ProxyWorkerResponse,
  ProxyWorkerResultMessage,
} from "./ProxyProtocol";

interface WorkerScope {
  onmessage: ((event: MessageEvent<ProxyWorkerRequest>) => void) | null;
  postMessage(message: ProxyWorkerResponse, transfer?: Transferable[]): void;
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
  message: Extract<ProxyWorkerRequest, { kind: "simplify" }>,
): Promise<void> {
  cancelledJobs.delete(message.id);
  try {
    const result = await simplifyProxy(
      {
        mode: message.mode,
        algorithm: message.algorithm,
        detail: message.detail,
        vertices: new Float32Array(message.vertices),
        indices: new Uint32Array(message.indices),
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

    if (cancelledJobs.has(message.id)) throw new ProxyCancelledError();
    const vertices = result.vertices.buffer as ArrayBuffer;
    const indices = result.indices.buffer as ArrayBuffer;
    const response: ProxyWorkerResultMessage = {
      kind: "result",
      id: message.id,
      vertices,
      indices,
      stats: result.stats,
    };
    scope.postMessage(response, [vertices, indices]);
  } catch (error) {
    const messageText =
      error instanceof ProxyCancelledError
        ? "Proxy generation was cancelled."
        : error instanceof Error
          ? error.message
          : String(error);
    scope.postMessage({
      kind: "error",
      id: message.id,
      message: messageText,
    });
  } finally {
    cancelledJobs.delete(message.id);
  }
}
