import { Engine } from "../core/Engine";
import {
  consumeStagedWorldBundle,
  exportWorldBundle,
  stageWorldBundle,
  type LoadedWorldBundle,
} from "./WorldBundle";

const openButton = requiredElement<HTMLButtonElement>("open-world-bundle");
const fileInput = requiredElement<HTMLInputElement>("world-bundle-file");
const exportButton = requiredElement<HTMLButtonElement>("export-world-bundle");
const statusElement = requiredElement<HTMLElement>("status");
const toastElement = requiredElement<HTMLElement>("toast");

let activeEngine: Engine | null = null;
let loadedBundle: LoadedWorldBundle | null = null;
let bundleLoadError: string | null = null;
let toastTimer = 0;

const nativeFetch = window.fetch.bind(window);
const pageUrl = new URL(window.location.href);
const bundleKey = pageUrl.searchParams.get("bundle");
const expectedManifestUrl = new URL(
  pageUrl.searchParams.get("world") ?? "/worlds/demo/world.json",
  pageUrl,
).href;

if (bundleKey) {
  try {
    statusElement.textContent = "读取 .splatworld 世界包";
    loadedBundle = await consumeStagedWorldBundle(bundleKey);
    window.fetch = interceptManifestFetch;
  } catch (error) {
    bundleLoadError = error instanceof Error ? error.message : String(error);
    removeBundleQuery();
  }
}

const originalCreate = Engine.create.bind(Engine);
Object.defineProperty(Engine, "create", {
  configurable: true,
  value: async (...args: Parameters<typeof Engine.create>): Promise<Engine> => {
    const instance = await originalCreate(...args);
    activeEngine = instance;
    exportButton.disabled = false;
    if (bundleKey && loadedBundle) removeBundleQuery();
    window.setTimeout(announceRuntime, 0);
    return instance;
  },
});

openButton.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", onBundleSelected);
exportButton.addEventListener("click", onExportBundle);
window.addEventListener("beforeunload", () => loadedBundle?.dispose(), { once: true });

await import("../main");

async function onBundleSelected(): Promise<void> {
  const file = fileInput.files?.[0];
  if (!file) return;
  openButton.disabled = true;
  exportButton.disabled = true;
  statusElement.textContent = `暂存 ${file.name}`;
  try {
    const key = await stageWorldBundle(file);
    const target = new URL(window.location.href);
    target.searchParams.delete("world");
    target.searchParams.set("bundle", key);
    window.location.assign(target);
  } catch (error) {
    showError("打开世界包失败", error);
    openButton.disabled = false;
    exportButton.disabled = activeEngine === null;
    fileInput.value = "";
  }
}

async function onExportBundle(): Promise<void> {
  if (!activeEngine) {
    showToast("Runtime 尚未完成初始化", 2600);
    return;
  }
  exportButton.disabled = true;
  openButton.disabled = true;
  try {
    const result = await exportWorldBundle(
      activeEngine.exportWorldManifest(),
      (message) => {
        statusElement.textContent = message;
      },
    );
    downloadBlob(result.blob, result.fileName);
    const externalCount = result.metadata.externalAssets.length;
    showToast(
      externalCount === 0
        ? `已导出 ${result.fileName} · ${result.metadata.assets.length} 个内置资产`
        : `已导出 ${result.fileName} · ${externalCount} 个外部资产因 CORS 保留为 URL`,
      5200,
    );
    statusElement.textContent = "世界包导出完成";
  } catch (error) {
    showError("导出世界包失败", error);
  } finally {
    exportButton.disabled = false;
    openButton.disabled = false;
  }
}

function interceptManifestFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const requestUrl = resolveRequestUrl(input);
  if (loadedBundle && requestUrl === expectedManifestUrl) {
    return Promise.resolve(
      new Response(`${JSON.stringify(loadedBundle.manifest, null, 2)}\n`, {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store",
        },
      }),
    );
  }
  return nativeFetch(input, init);
}

function resolveRequestUrl(input: RequestInfo | URL): string {
  if (input instanceof Request) return input.url;
  return new URL(String(input), window.location.href).href;
}

function announceRuntime(): void {
  if (loadedBundle) {
    const assetCount = loadedBundle.metadata.assets.length;
    const externalCount = loadedBundle.metadata.externalAssets.length;
    statusElement.textContent = `世界包已就绪 · ${assetCount} 个内置资产`;
    showToast(
      `已打开 ${loadedBundle.sourceName} · ${assetCount} 个内置资产${
        externalCount > 0 ? ` · ${externalCount} 个外部 URL` : ""
      }`,
      5200,
    );
    return;
  }
  if (bundleLoadError) {
    showToast(`世界包加载失败，已回退到默认世界：${bundleLoadError}`, 7000);
    return;
  }
  showToast("Runtime 0.8 已就绪：支持 .splatworld 世界包导入与导出。", 4800);
}

function removeBundleQuery(): void {
  const cleanUrl = new URL(window.location.href);
  cleanUrl.searchParams.delete("bundle");
  window.history.replaceState(null, "", cleanUrl);
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function showError(prefix: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  statusElement.textContent = prefix;
  showToast(`${prefix}：${message}`, 7000);
  console.error(error);
}

function showToast(message: string, duration = 3200): void {
  window.clearTimeout(toastTimer);
  toastElement.textContent = message;
  toastElement.classList.add("visible");
  toastTimer = window.setTimeout(() => toastElement.classList.remove("visible"), duration);
}

function requiredElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing DOM element #${id}`);
  return element as T;
}
