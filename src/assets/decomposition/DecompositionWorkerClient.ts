import { decomposeConvexParts } from "./ConvexDecomposer";
import type {
  DecompositionOptions,
  DecompositionProgress,
  DecompositionResult,
  DecompositionWorkerRequest,
  DecompositionWorkerResponse,
} from "./DecompositionProtocol";

interface PendingJob {
  resolve: (value: DecompositionResult) => void;
  reject: (reason: unknown) => void;
  onProgress?: (progress: DecompositionProgress) => void;
  signal?: AbortSignal;
  abortHandler?: () => void;
}

export class DecompositionWorkerClient {
  private worker: Worker | null = null;
  private readonly jobs = new Map<string, PendingJob>();
  private nextId = 1;

  async decompose(
    vertices: Float32Array,
    indices: Uint32Array,
    options: DecompositionOptions,
    onProgress?: (progress: DecompositionProgress) => void,
    signal?: AbortSignal,
  ): Promise<DecompositionResult> {
    if (signal?.aborted) throw abortError();
    if (typeof Worker === "undefined") {
      return decomposeConvexParts(
        vertices,
        indices,
        options,
        (progress) => onProgress?.(progress),
        () => signal?.aborted ?? false,
        false,
      );
    }

    const worker = this.getWorker();
    const id = `decomposition-${this.nextId}`;
    this.nextId += 1;
    const verticesCopy = vertices.slice();
    const indicesCopy = indices.slice();

    return new Promise<DecompositionResult>((resolve, reject) => {
      const job: PendingJob = { resolve, reject, onProgress, signal };
      if (signal) {
        job.abortHandler = () => {
          const request: DecompositionWorkerRequest = { kind: "cancel", id };
          worker.postMessage(request);
          this.finishJob(id, () => reject(abortError()));
        };
        signal.addEventListener("abort", job.abortHandler, { once: true });
      }
      this.jobs.set(id, job);

      const verticesBuffer = verticesCopy.buffer as ArrayBuffer;
      const indicesBuffer = indicesCopy.buffer as ArrayBuffer;
      const request: DecompositionWorkerRequest = {
        kind: "decompose",
        id,
        vertices: verticesBuffer,
        indices: indicesBuffer,
        maxHulls: options.maxHulls,
        maxVerticesPerHull: options.maxVerticesPerHull,
      };
      worker.postMessage(request, [verticesBuffer, indicesBuffer]);
    });
  }

  dispose(): void {
    for (const [id, job] of this.jobs) {
      this.removeAbortHandler(job);
      job.reject(new Error("Decomposition worker was disposed."));
      this.jobs.delete(id);
    }
    this.worker?.terminate();
    this.worker = null;
  }

  private getWorker(): Worker {
    if (this.worker) return this.worker;
    const worker = new Worker(new URL("./DecompositionWorker.ts", import.meta.url), {
      type: "module",
      name: "splat-convex-decomposer",
    });
    worker.addEventListener("message", this.onMessage);
    worker.addEventListener("error", this.onWorkerError);
    this.worker = worker;
    return worker;
  }

  private readonly onMessage = (event: MessageEvent<DecompositionWorkerResponse>): void => {
    const response = event.data;
    const job = this.jobs.get(response.id);
    if (!job) return;

    if (response.kind === "progress") {
      job.onProgress?.({ progress: response.progress, stage: response.stage });
      return;
    }
    if (response.kind === "error") {
      this.finishJob(response.id, () => job.reject(new Error(response.message)));
      return;
    }

    this.finishJob(response.id, () => {
      job.resolve({
        vertices: new Float32Array(response.vertices),
        offsets: new Uint32Array(response.offsets),
        stats: response.stats,
      });
    });
  };

  private readonly onWorkerError = (event: ErrorEvent): void => {
    const error = new Error(event.message || "Decomposition worker failed.");
    for (const [id, job] of this.jobs) {
      this.removeAbortHandler(job);
      job.reject(error);
      this.jobs.delete(id);
    }
    this.worker?.terminate();
    this.worker = null;
  };

  private finishJob(id: string, finish: () => void): void {
    const job = this.jobs.get(id);
    if (!job) return;
    this.removeAbortHandler(job);
    this.jobs.delete(id);
    finish();
  }

  private removeAbortHandler(job: PendingJob): void {
    if (job.signal && job.abortHandler) {
      job.signal.removeEventListener("abort", job.abortHandler);
    }
  }
}

export const decompositionWorkerClient = new DecompositionWorkerClient();

function abortError(): DOMException {
  return new DOMException("Convex decomposition was cancelled.", "AbortError");
}
