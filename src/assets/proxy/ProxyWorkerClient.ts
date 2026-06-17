import { simplifyProxy } from "./ProxySimplifier";
import type {
  ProxyProgress,
  ProxyTaskInput,
  ProxyTaskOutput,
  ProxyWorkerRequest,
  ProxyWorkerResponse,
} from "./ProxyProtocol";

interface PendingJob {
  resolve: (value: ProxyTaskOutput) => void;
  reject: (reason: unknown) => void;
  onProgress?: (progress: ProxyProgress) => void;
  signal?: AbortSignal;
  abortHandler?: () => void;
}

export class ProxyWorkerClient {
  private worker: Worker | null = null;
  private readonly jobs = new Map<string, PendingJob>();
  private nextId = 1;

  async simplify(
    input: ProxyTaskInput,
    onProgress?: (progress: ProxyProgress) => void,
    signal?: AbortSignal,
  ): Promise<ProxyTaskOutput> {
    if (signal?.aborted) throw abortError();
    if (typeof Worker === "undefined") {
      return simplifyProxy(
        input,
        (progress) => onProgress?.(progress),
        () => signal?.aborted ?? false,
        false,
      );
    }

    const worker = this.getWorker();
    const id = `proxy-${this.nextId}`;
    this.nextId += 1;
    const vertices = input.vertices.slice();
    const indices = input.indices.slice();

    return new Promise<ProxyTaskOutput>((resolve, reject) => {
      const job: PendingJob = { resolve, reject, onProgress, signal };
      if (signal) {
        job.abortHandler = () => {
          const request: ProxyWorkerRequest = { kind: "cancel", id };
          worker.postMessage(request);
          this.finishJob(id, () => reject(abortError()));
        };
        signal.addEventListener("abort", job.abortHandler, { once: true });
      }
      this.jobs.set(id, job);

      const verticesBuffer = vertices.buffer as ArrayBuffer;
      const indicesBuffer = indices.buffer as ArrayBuffer;
      const request: ProxyWorkerRequest = {
        kind: "simplify",
        id,
        mode: input.mode,
        algorithm: input.algorithm,
        detail: input.detail,
        vertices: verticesBuffer,
        indices: indicesBuffer,
      };
      worker.postMessage(request, [verticesBuffer, indicesBuffer]);
    });
  }

  dispose(): void {
    for (const [id, job] of this.jobs) {
      this.removeAbortHandler(job);
      job.reject(new Error("Proxy worker was disposed."));
      this.jobs.delete(id);
    }
    this.worker?.terminate();
    this.worker = null;
  }

  private getWorker(): Worker {
    if (this.worker) return this.worker;
    const worker = new Worker(new URL("./ProxyWorker.ts", import.meta.url), {
      type: "module",
      name: "splat-proxy-generator",
    });
    worker.addEventListener("message", this.onMessage);
    worker.addEventListener("error", this.onWorkerError);
    this.worker = worker;
    return worker;
  }

  private readonly onMessage = (event: MessageEvent<ProxyWorkerResponse>): void => {
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
        indices: new Uint32Array(response.indices),
        stats: response.stats,
      });
    });
  };

  private readonly onWorkerError = (event: ErrorEvent): void => {
    const error = new Error(event.message || "Proxy worker failed.");
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

export const proxyWorkerClient = new ProxyWorkerClient();

function abortError(): DOMException {
  return new DOMException("Proxy generation was cancelled.", "AbortError");
}
