import { Engine } from "../core/Engine";
import {
  assertLargeWorldManifest,
  largeWorldToBootstrapManifest,
  type LargeWorldManifest,
} from "./LargeWorldTypes";
import {
  formatLargeBytes,
  LargeSplatTileManager,
  type LargeTileStreamingStats,
} from "./LargeSplatTileManager";

const statusElement = optionalElement<HTMLElement>("status");
const toastElement = optionalElement<HTMLElement>("toast");
const worldNameElement = optionalElement<HTMLElement>("world-name");

const nativeFetch = window.fetch.bind(window);
const pageUrl = new URL(window.location.href);
const bundleKey = pageUrl.searchParams.get("bundle");
const manifestUrl = new URL(pageUrl.searchParams.get("world") ?? "/worlds/demo/world.json", pageUrl).href;

let largeManifest: LargeWorldManifest | null = null;
let tileManager: LargeSplatTileManager | null = null;
let loopHandle = 0;
let lastTime = performance.now();
let toastTimer = 0;

if (!bundleKey) {
  try {
    const response = await nativeFetch(manifestUrl, { cache: "no-cache" });
    const value: unknown = await response.clone().json();
    if (isLargeWorldCandidate(value)) {
      assertLargeWorldManifest(value);
      largeManifest = resolveLargeManifestUrls(value, manifestUrl);
      window.fetch = interceptLargeManifest;
      installEngineHook();
      statusElement && (statusElement.textContent = "大场景 Tile Streaming 已启用");
    }
  } catch (error) {
    console.warn("Large world bootstrap skipped.", error);
  }
}

window.addEventListener("beforeunload", () => {
  if (loopHandle) cancelAnimationFrame(loopHandle);
  tileManager?.dispose();
});

function installEngineHook(): void {
  const manifest = largeManifest;
  if (!manifest) return;
  const originalCreate = Engine.create.bind(Engine);
  Object.defineProperty(Engine, "create", {
    configurable: true,
    value: async (...args: Parameters<typeof Engine.create>): Promise<Engine> => {
      const instance = await originalCreate(...args);
      tileManager?.dispose();
      tileManager = new LargeSplatTileManager(instance.gaussianWorld, manifest, {
        onStatus: (message) => {
          statusElement && (statusElement.textContent = message);
        },
        onProgress: ({ id, loaded, total }) => {
          const value = total ? `${Math.round((loaded / total) * 100)}%` : formatLargeBytes(loaded);
          statusElement && (statusElement.textContent = `加载 ${id} · ${value}`);
        },
        onStats: updateStats,
      });
      instance.scene.add(tileManager.debugGroup);
      worldNameElement && (worldNameElement.textContent = manifest.name);
      startTileLoop(instance);
      window.setTimeout(() => {
        showToast(`Large Tile Streaming 已就绪 · ${manifest.tiles.length} tiles`, 5200);
      }, 120);
      return instance;
    },
  });
}

function startTileLoop(engine: Engine): void {
  if (loopHandle) cancelAnimationFrame(loopHandle);
  lastTime = performance.now();
  const frame = (now: number): void => {
    const delta = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    tileManager?.update(engine.camera, delta);
    loopHandle = requestAnimationFrame(frame);
  };
  loopHandle = requestAnimationFrame(frame);
}

function updateStats(stats: LargeTileStreamingStats): void {
  if (!statusElement) return;
  statusElement.textContent =
    `Tiles ${stats.loadedTiles}/${stats.visibleTiles}` +
    ` · cand ${stats.indexCandidates}` +
    ` · loading ${stats.loadingTiles}` +
    ` · ${formatLargeBytes(stats.residentBytes)} / ${formatLargeBytes(stats.budgetBytes)}`;
}

function interceptLargeManifest(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const requestUrl = resolveRequestUrl(input);
  if (largeManifest && requestUrl === manifestUrl) {
    return Promise.resolve(
      new Response(`${JSON.stringify(largeWorldToBootstrapManifest(largeManifest), null, 2)}\n`, {
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

function resolveLargeManifestUrls(
  manifest: LargeWorldManifest,
  sourceUrl: string,
): LargeWorldManifest {
  const base = new URL(sourceUrl);
  const copy = structuredClone(manifest);
  for (const tile of copy.tiles) {
    for (const lod of tile.lods) {
      lod.url = new URL(lod.url, base).href;
    }
  }
  return copy;
}

function resolveRequestUrl(input: RequestInfo | URL): string {
  if (input instanceof Request) return input.url;
  return new URL(String(input), window.location.href).href;
}

function isLargeWorldCandidate(value: unknown): value is { format: string } {
  return Boolean(value && typeof value === "object" && (value as { format?: unknown }).format === "splatworld-large");
}

function showToast(message: string, duration = 3200): void {
  if (!toastElement) return;
  window.clearTimeout(toastTimer);
  toastElement.textContent = message;
  toastElement.classList.add("visible");
  toastTimer = window.setTimeout(() => toastElement.classList.remove("visible"), duration);
}

function optionalElement<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}
