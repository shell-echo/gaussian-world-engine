import "./proxy-task.css";
import type { GLBImportOptions } from "../GLBColliderExtractor";
import type { DecompositionStats } from "../decomposition/DecompositionProtocol";
import type {
  ProxyProgress,
  ProxySimplifierAlgorithm,
  ProxyTaskStats,
} from "./ProxyProtocol";
import { Engine } from "../../core/Engine";
import type { ColliderData } from "../../types/world";

const modeSelect = requiredElement<HTMLSelectElement>("glb-mode");
const algorithmSelect = requiredElement<HTMLSelectElement>("glb-algorithm");
const detailSelect = requiredElement<HTMLSelectElement>("glb-detail");
const hullSelect = requiredElement<HTMLSelectElement>("glb-hulls");
const importButton = requiredElement<HTMLButtonElement>("import-glb");
const taskPanel = requiredElement<HTMLElement>("proxy-task");
const taskStage = requiredElement<HTMLElement>("proxy-task-stage");
const taskPercent = requiredElement<HTMLElement>("proxy-task-percent");
const taskDetail = requiredElement<HTMLElement>("proxy-task-detail");
const progressBar = requiredElement<HTMLElement>("proxy-progress-bar");
const cancelButton = requiredElement<HTMLButtonElement>("cancel-proxy-task");
const statusElement = requiredElement<HTMLElement>("status");
const toastElement = requiredElement<HTMLElement>("toast");

let activeController: AbortController | null = null;
let hideTimer = 0;
let toastTimer = 0;
let lastTriMeshAlgorithm: ProxySimplifierAlgorithm = "qem";

installEngineCreateNotice();
installImportWrapper();
modeSelect.addEventListener("change", syncModeControls);
algorithmSelect.addEventListener("change", () => {
  if (modeSelect.value !== "convex") {
    lastTriMeshAlgorithm = algorithmSelect.value as ProxySimplifierAlgorithm;
  }
});
cancelButton.addEventListener("click", () => activeController?.abort());
syncModeControls();

function installImportWrapper(): void {
  const original = Engine.prototype.importGLBWorldObject;
  Object.defineProperty(Engine.prototype, "importGLBWorldObject", {
    configurable: true,
    value: async function importWithBackgroundProxy(
      this: Engine,
      file: File,
      options: GLBImportOptions,
    ): Promise<ColliderData | null> {
      activeController?.abort();
      const controller = new AbortController();
      activeController = controller;
      const externalSignal = options.signal;
      const abortFromExternal = (): void => controller.abort();
      externalSignal?.addEventListener("abort", abortFromExternal, { once: true });
      let proxyStats: ProxyTaskStats | null = null;
      let decompositionStats: DecompositionStats | null = null;

      setBusy(true, file.name);
      try {
        const algorithm =
          options.mode === "convex"
            ? "cluster"
            : (algorithmSelect.value as ProxySimplifierAlgorithm);
        const enhancedOptions: GLBImportOptions = {
          ...options,
          algorithm,
          maxHulls: Number(hullSelect.value),
          maxVerticesPerHull: 64,
          signal: controller.signal,
          onProgress: (progress) => {
            options.onProgress?.(progress as ProxyProgress);
            updateProgress(progress);
          },
          onComplete: (value) => {
            proxyStats = value;
            options.onComplete?.(value);
          },
          onDecompositionComplete: (value) => {
            decompositionStats = value;
            options.onDecompositionComplete?.(value);
          },
        };
        const collider = await original.call(this, file, enhancedOptions);
        if (collider && proxyStats) showCompletedStats(proxyStats, decompositionStats);
        return collider;
      } catch (error) {
        if (isAbortError(error)) {
          showCancelled();
          return null;
        }
        taskStage.textContent = "代理生成失败";
        taskDetail.textContent = error instanceof Error ? error.message : String(error);
        progressBar.style.width = "100%";
        taskPercent.textContent = "!";
        throw error;
      } finally {
        externalSignal?.removeEventListener("abort", abortFromExternal);
        if (activeController === controller) {
          activeController = null;
          setControlsDisabled(false);
          document.body.classList.remove("proxy-busy");
          syncModeControls();
        }
      }
    },
  });
}

function installEngineCreateNotice(): void {
  const original = Engine.create.bind(Engine);
  Object.defineProperty(Engine, "create", {
    configurable: true,
    value: async (...args: Parameters<typeof Engine.create>): Promise<Engine> => {
      const instance = await original(...args);
      window.setTimeout(() => {
        showToast("Runtime 0.10 已就绪：Compound Convex Decomposition 已启用。", 4800);
      }, 80);
      return instance;
    },
  });
}

function syncModeControls(): void {
  if (modeSelect.value === "convex") {
    if (algorithmSelect.value !== "cluster") {
      lastTriMeshAlgorithm = algorithmSelect.value as ProxySimplifierAlgorithm;
    }
    algorithmSelect.value = "cluster";
    algorithmSelect.disabled = true;
    algorithmSelect.title = "单 Convex Hull 使用空间点聚类";
  } else {
    algorithmSelect.disabled = activeController !== null;
    algorithmSelect.value = lastTriMeshAlgorithm;
    algorithmSelect.title = "TriMesh simplifier before proxy creation";
  }
  hullSelect.disabled = activeController !== null || modeSelect.value !== "decomposition";
  hullSelect.title =
    modeSelect.value === "decomposition"
      ? "Maximum convex hull count"
      : "仅 Compound 分解模式使用";
}

function setBusy(busy: boolean, fileName: string): void {
  window.clearTimeout(hideTimer);
  taskPanel.classList.toggle("hidden", !busy);
  if (!busy) return;
  document.body.classList.add("proxy-busy");
  setControlsDisabled(true);
  taskStage.textContent = "准备后台代理任务";
  taskPercent.textContent = "0%";
  taskDetail.textContent = `${fileName} · TypedArray Transferable`;
  progressBar.style.width = "0%";
  statusElement.textContent = `准备代理生成 ${fileName}`;
}

function setControlsDisabled(disabled: boolean): void {
  importButton.disabled = disabled;
  modeSelect.disabled = disabled;
  detailSelect.disabled = disabled;
  algorithmSelect.disabled = disabled || modeSelect.value === "convex";
  hullSelect.disabled = disabled || modeSelect.value !== "decomposition";
  cancelButton.disabled = !disabled;
}

function updateProgress(progress: { progress: number; stage: string }): void {
  const percent = Math.round(progress.progress * 100);
  taskStage.textContent = progress.stage;
  taskPercent.textContent = `${percent}%`;
  progressBar.style.width = `${percent}%`;
  statusElement.textContent = `${progress.stage} · ${percent}%`;
}

function showCompletedStats(
  stats: ProxyTaskStats,
  decomposition: DecompositionStats | null,
): void {
  const proxyElapsed = formatDuration(stats.elapsedMs);
  const execution = stats.worker ? "Worker" : "主线程回退";
  const precluster = stats.preclustered ? " · 预聚类" : "";
  const geometry = stats.outputTriangles > 0
    ? `${stats.originalTriangles.toLocaleString()} → ${stats.outputTriangles.toLocaleString()} triangles`
    : `${stats.originalVertices.toLocaleString()} → ${stats.outputVertices.toLocaleString()} points`;

  taskStage.textContent = decomposition
    ? `Compound Collider 完成 · ${decomposition.outputHulls} Hulls`
    : "后台代理任务完成";
  taskPercent.textContent = "100%";
  progressBar.style.width = "100%";
  taskDetail.textContent = decomposition
    ? `${stats.algorithm.toUpperCase()} · ${geometry} · ${decomposition.outputHulls} hulls / ${decomposition.outputPoints} points · ${proxyElapsed} + ${formatDuration(decomposition.elapsedMs)} · ${execution}${precluster}`
    : `${stats.algorithm.toUpperCase()} · ${geometry} · ${proxyElapsed} · ${execution}${precluster}`;
  hideTimer = window.setTimeout(() => taskPanel.classList.add("hidden"), 6200);
}

function showCancelled(): void {
  taskStage.textContent = "代理任务已取消";
  taskPercent.textContent = "—";
  taskDetail.textContent = "未创建世界对象，编辑历史保持不变";
  statusElement.textContent = "GLB 代理生成已取消";
  showToast("已取消 GLB 代理生成", 2600);
  hideTimer = window.setTimeout(() => taskPanel.classList.add("hidden"), 2200);
}

function showToast(message: string, duration: number): void {
  window.clearTimeout(toastTimer);
  toastElement.textContent = message;
  toastElement.classList.add("visible");
  toastTimer = window.setTimeout(() => toastElement.classList.remove("visible"), duration);
}

function formatDuration(milliseconds: number): string {
  return milliseconds >= 1000
    ? `${(milliseconds / 1000).toFixed(2)}s`
    : `${Math.round(milliseconds)}ms`;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function requiredElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing DOM element #${id}`);
  return element as T;
}
