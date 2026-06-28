import * as THREE from "three";
import { Engine } from "../core/Engine";
import type { Vec3Tuple } from "../types/world";
import { assertRuntimeCollisionPlan, type RuntimeCollisionPlan } from "./CollisionPlanTypes";
import { assertExposurePlan, type ExposurePlan } from "./ExposurePlanTypes";
import {
  assertLargeWorldManifest,
  largeWorldToBootstrapManifest,
  resolveLargeWorldConfig,
  type LargeWorldManifest,
} from "./LargeWorldTypes";
import {
  LargeCollisionTileManager,
  type CollisionTileStreamingStats,
} from "./LargeCollisionTileManager";
import {
  formatLargeBytes,
  LargeSplatTileManager,
  type LargeTileStreamingStats,
} from "./LargeSplatTileManager";
import {
  createNavMeshPathDebugGroup,
  RuntimeNavMeshQuery,
  type RuntimeNavMeshPathOptions,
  type RuntimeNavMeshPathResult,
} from "./NavMeshQuery";
import {
  assertRuntimeNavMeshManifest,
  createNavMeshDebugGroup,
  type RuntimeNavMeshManifest,
} from "./NavMeshTypes";

interface RuntimeNavMeshWindowApi {
  queryPath: (
    start: Vec3Tuple,
    goal: Vec3Tuple,
    options?: RuntimeNavMeshPathOptions,
  ) => RuntimeNavMeshPathResult;
  clearPathDebug: () => void;
}

const statusElement = optionalElement<HTMLElement>("status");
const toastElement = optionalElement<HTMLElement>("toast");
const worldNameElement = optionalElement<HTMLElement>("world-name");

const nativeFetch = window.fetch.bind(window);
const pageUrl = new URL(window.location.href);
const bundleKey = pageUrl.searchParams.get("bundle");
const manifestUrl = new URL(pageUrl.searchParams.get("world") ?? "/worlds/demo/world.json", pageUrl).href;

let largeManifest: LargeWorldManifest | null = null;
let exposurePlan: ExposurePlan | null = null;
let navMesh: RuntimeNavMeshManifest | null = null;
let collisionPlan: RuntimeCollisionPlan | null = null;
let navMeshDebugGroup: THREE.Group | null = null;
let navMeshPathDebugGroup: THREE.Group | null = null;
let navMeshQuery: RuntimeNavMeshQuery | null = null;
let tileManager: LargeSplatTileManager | null = null;
let collisionManager: LargeCollisionTileManager | null = null;
let collisionStats: CollisionTileStreamingStats | null = null;
let loopHandle = 0;
let lastTime = performance.now();
let toastTimer = 0;

if (!bundleKey) {
  try {
    const response = await nativeFetch(manifestUrl, { cache: "no-cache" });
    const value: unknown = await response.clone().json();
    if (isLargeWorldCandidate(value)) {
      assertLargeWorldManifest(value);
      const resolvedManifest = resolveLargeManifestUrls(value, manifestUrl);
      largeManifest = resolvedManifest;
      exposurePlan = await loadExposurePlan(resolvedManifest).catch((error) => {
        console.warn("Large world exposure plan skipped.", error);
        return null;
      });
      navMesh = await loadNavMesh(resolvedManifest).catch((error) => {
        console.warn("Large world navigation skipped.", error);
        return null;
      });
      collisionPlan = await loadCollisionPlan(resolvedManifest).catch((error) => {
        console.warn("Large world collision plan skipped.", error);
        return null;
      });
      window.fetch = interceptLargeManifest;
      installEngineHook();
      statusElement && (statusElement.textContent = runtimeStatusLabel());
    }
  } catch (error) {
    console.warn("Large world bootstrap skipped.", error);
  }
}

window.addEventListener("beforeunload", () => {
  if (loopHandle) cancelAnimationFrame(loopHandle);
  tileManager?.dispose();
  collisionManager?.dispose();
  disposeGroup(navMeshDebugGroup);
  disposeGroup(navMeshPathDebugGroup);
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
      collisionManager?.dispose();
      disposeGroup(navMeshDebugGroup);
      disposeGroup(navMeshPathDebugGroup);
      navMeshPathDebugGroup = null;
      tileManager = new LargeSplatTileManager(instance.gaussianWorld, manifest, {
        onStatus: (message) => {
          statusElement && (statusElement.textContent = message);
        },
        onProgress: ({ id, loaded, total }) => {
          const value = total ? `${Math.round((loaded / total) * 100)}%` : formatLargeBytes(loaded);
          statusElement && (statusElement.textContent = `Load ${id} · ${value}`);
        },
        onStats: updateStats,
      }, exposurePlan ?? undefined);
      instance.scene.add(tileManager.debugGroup);
      if (collisionPlan) {
        collisionManager = new LargeCollisionTileManager(instance.physics, collisionPlan, resolveLargeWorldConfig(manifest), {
          onStatus: (message) => {
            statusElement && (statusElement.textContent = message);
          },
          onStats: (stats) => {
            collisionStats = stats;
          },
        });
      } else {
        collisionManager = null;
        collisionStats = null;
      }
      if (navMesh) {
        navMeshQuery = new RuntimeNavMeshQuery(navMesh);
        navMeshDebugGroup = createNavMeshDebugGroup(navMesh);
        instance.scene.add(navMeshDebugGroup);
        installNavMeshQueryApi(instance.scene, navMeshQuery);
      } else {
        navMeshQuery = null;
        clearNavMeshQueryApi();
      }
      worldNameElement && (worldNameElement.textContent = manifest.name);
      startTileLoop(instance);
      window.setTimeout(() => {
        showToast(runtimeReadyLabel(manifest), 5200);
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
    collisionManager?.update(engine.camera, delta);
    loopHandle = requestAnimationFrame(frame);
  };
  loopHandle = requestAnimationFrame(frame);
}

function updateStats(stats: LargeTileStreamingStats): void {
  if (!statusElement) return;
  const nav = navMesh
    ? ` · nav ${navMesh.tiles.length}/${navMesh.links?.length ?? 0}` + (navMeshQuery ? ` · q ${navMeshQuery.walkableTileCount}` : "")
    : "";
  const collision = collisionStats
    ? ` · col ${collisionStats.activeColliders}/${collisionStats.totalColliders}` +
      ` · cf ${collisionStats.reusedColliderFiles} h${collisionStats.colliderFileHits}/m${collisionStats.colliderFileMisses}`
    : "";
  statusElement.textContent =
    `Tiles ${stats.loadedTiles}/${stats.visibleTiles}` +
    ` · cand ${stats.indexCandidates}` +
    ` · loading ${stats.loadingTiles}` +
    ` · ${formatLargeBytes(stats.residentBytes)} / ${formatLargeBytes(stats.budgetBytes)}` +
    nav +
    collision;
}

function installNavMeshQueryApi(scene: THREE.Scene, query: RuntimeNavMeshQuery): void {
  setRuntimeNavMeshApi({
    queryPath: (start, goal, options) => {
      const result = query.findPath(start, goal, options);
      disposeGroup(navMeshPathDebugGroup);
      navMeshPathDebugGroup = createNavMeshPathDebugGroup(result);
      scene.add(navMeshPathDebugGroup);
      showToast(`Nav path ${result.status} · ${result.tileIds.length} tiles`, 2600);
      return result;
    },
    clearPathDebug: () => {
      disposeGroup(navMeshPathDebugGroup);
      navMeshPathDebugGroup = null;
    },
  });
}

function clearNavMeshQueryApi(): void {
  setRuntimeNavMeshApi(undefined);
}

function setRuntimeNavMeshApi(value: RuntimeNavMeshWindowApi | undefined): void {
  (window as unknown as { splatNavMesh?: RuntimeNavMeshWindowApi }).splatNavMesh = value;
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

function resolveLargeManifestUrls(manifest: LargeWorldManifest, sourceUrl: string): LargeWorldManifest {
  const base = new URL(sourceUrl);
  const copy = structuredClone(manifest);
  if (copy.exposurePlan) copy.exposurePlan = new URL(copy.exposurePlan, base).href;
  if (copy.navigation) copy.navigation = new URL(copy.navigation, base).href;
  if (copy.collisionPlan) copy.collisionPlan = new URL(copy.collisionPlan, base).href;
  for (const tile of copy.tiles) {
    for (const lod of tile.lods) {
      lod.url = new URL(lod.url, base).href;
    }
  }
  return copy;
}

async function loadExposurePlan(manifest: LargeWorldManifest): Promise<ExposurePlan | null> {
  if (!manifest.exposurePlan) return null;
  const response = await nativeFetch(manifest.exposurePlan, { cache: "no-cache" });
  if (!response.ok) throw new Error(`Failed to load exposure plan: ${response.status}`);
  const value: unknown = await response.json();
  assertExposurePlan(value);
  return value;
}

async function loadNavMesh(manifest: LargeWorldManifest): Promise<RuntimeNavMeshManifest | null> {
  if (!manifest.navigation) return null;
  const response = await nativeFetch(manifest.navigation, { cache: "no-cache" });
  if (!response.ok) throw new Error(`Failed to load navigation manifest: ${response.status}`);
  const value: unknown = await response.json();
  assertRuntimeNavMeshManifest(value);
  return value;
}

async function loadCollisionPlan(manifest: LargeWorldManifest): Promise<RuntimeCollisionPlan | null> {
  if (!manifest.collisionPlan) return null;
  const response = await nativeFetch(manifest.collisionPlan, { cache: "no-cache" });
  if (!response.ok) throw new Error(`Failed to load collision plan: ${response.status}`);
  const value: unknown = await response.json();
  assertRuntimeCollisionPlan(value);
  return resolveCollisionPlanUrls(value, manifest.collisionPlan);
}

function resolveCollisionPlanUrls(plan: RuntimeCollisionPlan, sourceUrl: string): RuntimeCollisionPlan {
  const base = new URL(sourceUrl);
  return {
    ...plan,
    tiles: plan.tiles.map((tile) => ({
      ...tile,
      output: new URL(tile.output, base).href,
    })),
  };
}

function runtimeStatusLabel(): string {
  const features = ["Large Tile Streaming"];
  if (exposurePlan) features.push("Exposure Plan");
  if (navMesh) features.push("NavMesh Debug");
  if (navMesh) features.push("Path Query");
  if (collisionPlan) features.push("Collision Streaming");
  return `${features.join(" + ")} enabled`;
}

function runtimeReadyLabel(manifest: LargeWorldManifest): string {
  const suffix = [
    exposurePlan ? "exposure" : "",
    navMesh ? `${navMesh.tiles.length} nav tiles` : "",
    navMesh ? "path query" : "",
    collisionPlan ? `${collisionPlan.tiles.length} collision tiles` : "",
  ].filter(Boolean).join(" · ");
  return suffix
    ? `Large Tile Streaming ready · ${manifest.tiles.length} tiles · ${suffix}`
    : `Large Tile Streaming ready · ${manifest.tiles.length} tiles`;
}

function disposeGroup(group: THREE.Group | null): void {
  if (!group) return;
  group.parent?.remove(group);
  for (const child of group.children) {
    if (child instanceof THREE.LineSegments) {
      child.geometry.dispose();
      if (Array.isArray(child.material)) {
        child.material.forEach((material) => material.dispose());
      } else {
        child.material.dispose();
      }
    }
  }
  group.clear();
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
