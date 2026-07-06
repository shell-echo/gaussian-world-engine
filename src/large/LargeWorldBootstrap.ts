import * as THREE from "three";
import { Engine, type EngineEvents } from "../core/Engine";
import type { GameplayEvent } from "../gameplay/GameplaySystem";
import { assertRuntimeCollisionPlan, type RuntimeCollisionPlan } from "./CollisionPlanTypes";
import { assertExposurePlan, type ExposurePlan } from "./ExposurePlanTypes";
import {
  assertLargeWorldManifest,
  largeWorldToBootstrapManifest,
  resolveLargeWorldConfig,
  type LargeWorldManifest,
  type LargeWorldMissionPackage,
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
  RuntimeNavAgentDebugDemo,
  type RuntimeNavAgentDebugDemoOptions,
} from "./NavAgentDebugDemo";
import type { RuntimeNavAgentSnapshot } from "./NavAgentController";
import type { RuntimeNavAgentRegistrySnapshot } from "./NavAgentRegistry";
import { RuntimeNavMissionDebugPanel } from "./NavMissionDebugPanel";
import {
  loadRuntimeNavMissionPackages,
  normalizeRuntimeNavMissionPackageReferences,
  type RuntimeNavMissionPackageDiagnosticsReport,
  type RuntimeNavMissionPackageReference,
} from "./NavMissionPackageLoader";
import {
  createRuntimeNavGameplayApi,
  type RuntimeNavGameplayApi,
} from "./NavGameplayApi";
import {
  createNavRouteDebugLine,
  parseNavRoutePoint,
  RuntimeNavMeshQuery,
  type NavRouteResult,
} from "./NavMeshQuery";
import {
  assertRuntimeNavMeshManifest,
  createNavMeshDebugGroup,
  type RuntimeNavMeshManifest,
} from "./NavMeshTypes";

interface RuntimeWorldWindowApi {
  navMesh?: RuntimeNavGameplayApi;
  missionPackages?: RuntimeNavMissionPackageDiagnosticsReport;
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
let navGameplayApi: RuntimeNavGameplayApi | null = null;
let navAgentDemo: RuntimeNavAgentDebugDemo | null = null;
let navAgentSnapshot: RuntimeNavAgentSnapshot | null = null;
let navAgentRegistrySnapshot: RuntimeNavAgentRegistrySnapshot | null = null;
let navRouteResult: NavRouteResult | null = null;
let collisionPlan: RuntimeCollisionPlan | null = null;
let navMeshDebugGroup: THREE.Group | null = null;
let navRouteDebugLine: THREE.Line | null = null;
let missionDebugPanel: RuntimeNavMissionDebugPanel | null = null;
let missionPackageReport: RuntimeNavMissionPackageDiagnosticsReport | null = null;
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
  navAgentDemo?.dispose();
  missionDebugPanel?.dispose();
  navGameplayApi?.agents.clear();
  disposeGroup(navMeshDebugGroup);
  disposeLine(navRouteDebugLine);
  installRuntimeWorldApi(null);
});

function installEngineHook(): void {
  const manifest = largeManifest;
  if (!manifest) return;
  const originalCreate = Engine.create.bind(Engine);
  Object.defineProperty(Engine, "create", {
    configurable: true,
    value: async (...args: Parameters<typeof Engine.create>): Promise<Engine> => {
      const [canvas, bootstrapManifest, events] = args;
      const instance = await originalCreate(canvas, bootstrapManifest, withGameplayEventBridge(events ?? {}));
      tileManager?.dispose();
      collisionManager?.dispose();
      navAgentDemo?.dispose();
      missionDebugPanel?.dispose();
      navGameplayApi?.agents.clear();
      disposeGroup(navMeshDebugGroup);
      disposeLine(navRouteDebugLine);
      navGameplayApi = null;
      navAgentDemo = null;
      missionDebugPanel = null;
      missionPackageReport = null;
      navAgentSnapshot = null;
      navAgentRegistrySnapshot = null;
      navRouteResult = null;
      installRuntimeWorldApi(null);
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
        navMeshDebugGroup = createNavMeshDebugGroup(navMesh);
        instance.scene.add(navMeshDebugGroup);
        navGameplayApi = createRuntimeNavGameplayApi(navMesh);
        navAgentRegistrySnapshot = navGameplayApi.snapshotAgents();
        installRuntimeWorldApi(navGameplayApi);
        installNavRouteDebug(instance.scene, navMesh);
        await installMissionPackages(navGameplayApi, manifest);
        installRuntimeWorldApi(navGameplayApi);
        installNavAgentDemo(instance, navGameplayApi, manifest);
        installMissionDebugPanel(navGameplayApi);
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

function withGameplayEventBridge(events: EngineEvents): EngineEvents {
  return {
    ...events,
    onGameplayEvent: (event) => {
      events.onGameplayEvent?.(event);
      bridgeGameplayEventToMissionRunner(event);
    },
  };
}

function bridgeGameplayEventToMissionRunner(event: GameplayEvent): void {
  const result = navGameplayApi?.handleMissionRunnerGameplayEvent(event);
  missionDebugPanel?.recordGameplayEvent(event);
  if (!result) return;
  const changed =
    result.firedRuleIds.length > 0 ||
    result.missionIds.length > 0 ||
    result.objectiveIds.length > 0 ||
    result.autoActivatedObjectiveIds.length > 0 ||
    result.errors.length > 0;
  if (changed && statusElement) {
    statusElement.textContent = `Gameplay ${event.kind}:${event.event} → mission runner ${result.firedRuleIds.length} rule(s)`;
  }
}

function startTileLoop(engine: Engine): void {
  if (loopHandle) cancelAnimationFrame(loopHandle);
  lastTime = performance.now();
  const frame = (now: number): void => {
    const delta = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    tileManager?.update(engine.camera, delta);
    collisionManager?.update(engine.camera, delta);
    navAgentRegistrySnapshot = navGameplayApi?.updateAgents(delta) ?? null;
    navAgentSnapshot = navAgentDemo?.update() ?? null;
    loopHandle = requestAnimationFrame(frame);
  };
  loopHandle = requestAnimationFrame(frame);
}

function updateStats(stats: LargeTileStreamingStats): void {
  if (!statusElement) return;
  const nav = navMesh ? ` · nav ${navMesh.tiles.length}/${navMesh.links?.length ?? 0}` : "";
  const navApi = navGameplayApi ? ` · nav-api ${navGameplayApi.walkableTileCount}` : "";
  const route = navRouteResult?.status === "success"
    ? ` · route ${navRouteResult.tileIds.length}t/${navRouteResult.distance.toFixed(1)}m`
    : navRouteResult
      ? ` · route ${navRouteResult.status}`
      : "";
  const registry = navAgentRegistrySnapshot
    ? ` · agents ${navAgentRegistrySnapshot.count} m${navAgentRegistrySnapshot.moving}/b${navAgentRegistrySnapshot.blocked}/e${navAgentRegistrySnapshot.pendingEvents}`
    : navGameplayApi
      ? " · agents 0"
      : "";
  const demoAgent = navAgentSnapshot
    ? ` · agent ${navAgentSnapshot.status}${navAgentSnapshot.status === "moving" ? ` ${navAgentSnapshot.remainingDistance.toFixed(1)}m` : ""}`
    : navAgentDemo
      ? " · agent ready"
      : "";
  const mission = missionDebugPanel ? " · mission hud" : "";
  const missionPackages = missionPackageReport ? ` · mission pkg ${missionPackageReport.loadedPackages}/${missionPackageReport.packageCount} w${missionPackageReport.warnings}/e${missionPackageReport.errors}` : "";
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
    navApi +
    route +
    registry +
    demoAgent +
    mission +
    missionPackages +
    collision;
}

function installNavRouteDebug(scene: THREE.Scene, manifest: RuntimeNavMeshManifest): void {
  if (!shouldShowNavRoute()) return;
  const from = parseNavRoutePoint(pageUrl.searchParams.get("navFrom")) ?? new THREE.Vector3(-10, 0, 0);
  const to = parseNavRoutePoint(pageUrl.searchParams.get("navTo")) ?? new THREE.Vector3(130, 0, 0);
  const query = new RuntimeNavMeshQuery(manifest);
  navRouteResult = query.findRoute(from, to);
  navRouteDebugLine = createNavRouteDebugLine(navRouteResult);
  if (navRouteDebugLine) scene.add(navRouteDebugLine);
  showToast(
    navRouteResult.status === "success"
      ? `Nav route ready · ${navRouteResult.tileIds.join(" → ")}`
      : `Nav route failed · ${navRouteResult.status}`,
    5200,
  );
}

async function installMissionPackages(navApi: RuntimeNavGameplayApi, manifest: LargeWorldManifest): Promise<void> {
  const packages = collectMissionPackages(manifest);
  if (packages.length === 0) return;
  try {
    missionPackageReport = await loadRuntimeNavMissionPackages({
      nav: navApi,
      packages,
      fetcher: nativeFetch,
      onStatus: (message) => {
        statusElement && (statusElement.textContent = message);
      },
    });
    console.info("Mission package diagnostics", missionPackageReport);
    showToast(
      missionPackageReport.errors > 0
        ? `Mission package diagnostics · ${missionPackageReport.loadedPackages}/${missionPackageReport.packageCount} loaded · ${missionPackageReport.errors} error(s)`
        : `Mission package loaded · ${missionPackageReport.loadedPackages}/${missionPackageReport.packageCount} · ${missionPackageReport.warnings} warning(s)`,
      missionPackageReport.errors > 0 ? 5200 : 3600,
    );
  } catch (error) {
    missionPackageReport = null;
    console.warn("Mission package diagnostics failed.", error);
    const message = error instanceof Error ? error.message : String(error);
    showToast(`Mission package diagnostics failed · ${message}`, 5200);
  }
}

function installNavAgentDemo(engine: Engine, navApi: RuntimeNavGameplayApi, manifest: LargeWorldManifest): void {
  if (!shouldShowNavAgentDemo()) return;
  const destination = parseNavRoutePoint(pageUrl.searchParams.get("agentTo"));
  const options: RuntimeNavAgentDebugDemoOptions = {
    scene: engine.scene,
    camera: engine.camera,
    domElement: engine.renderer.domElement,
    nav: navApi,
    initialPosition: parseNavRoutePoint(pageUrl.searchParams.get("agentFrom")) ?? manifest.spawn.position,
    onStatus: (message) => {
      statusElement && (statusElement.textContent = message);
      showToast(message, 2800);
    },
  };
  if (destination) options.initialDestination = destination;
  navAgentDemo = new RuntimeNavAgentDebugDemo(options);
  navAgentRegistrySnapshot = navApi.snapshotAgents();
  navAgentSnapshot = navAgentDemo.snapshot();
}

function installMissionDebugPanel(navApi: RuntimeNavGameplayApi): void {
  if (!shouldShowMissionDebugPanel()) return;
  missionDebugPanel = new RuntimeNavMissionDebugPanel({
    nav: navApi,
    initiallyVisible: !pageUrl.searchParams.has("missionDebugCollapsed"),
    maxEvents: Number(pageUrl.searchParams.get("missionDebugEvents") ?? 8),
  });
}

function shouldShowNavRoute(): boolean {
  return pageUrl.searchParams.has("navRoute") || pageUrl.searchParams.has("navFrom") || pageUrl.searchParams.has("navTo");
}

function shouldShowNavAgentDemo(): boolean {
  return pageUrl.searchParams.has("clickToMove") || pageUrl.searchParams.has("navAgentDemo") || pageUrl.searchParams.has("agentFrom") || pageUrl.searchParams.has("agentTo");
}

function shouldShowMissionDebugPanel(): boolean {
  return pageUrl.searchParams.has("missionDebug") || pageUrl.searchParams.has("missionPanel") || pageUrl.searchParams.has("missionHud");
}

function installRuntimeWorldApi(navApi: RuntimeNavGameplayApi | null): void {
  const target = window as unknown as { splatWorld?: RuntimeWorldWindowApi };
  if (navApi) {
    target.splatWorld = { ...(target.splatWorld ?? {}), navMesh: navApi, missionPackages: missionPackageReport ?? undefined };
    return;
  }
  if (!target.splatWorld) return;
  delete target.splatWorld.navMesh;
  delete target.splatWorld.missionPackages;
  if (!target.splatWorld.navMesh && !target.splatWorld.missionPackages) delete target.splatWorld;
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
  if (copy.missionPackage) copy.missionPackage = new URL(copy.missionPackage, base).href;
  if (copy.missionPackages) copy.missionPackages = copy.missionPackages.map((item) => resolveMissionPackageRef(item, base.href));
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

function collectMissionPackages(manifest: LargeWorldManifest): RuntimeNavMissionPackageReference[] {
  const references: Array<string | LargeWorldMissionPackage> = [];
  if (manifest.missionPackage) references.push(manifest.missionPackage);
  if (manifest.missionPackages) references.push(...manifest.missionPackages);
  for (const value of pageUrl.searchParams.getAll("mission")) references.push(value);
  for (const value of pageUrl.searchParams.getAll("missionPackage")) references.push(value);
  return normalizeRuntimeNavMissionPackageReferences(references, manifestUrl);
}

function resolveMissionPackageRef(item: string | LargeWorldMissionPackage, baseUrl: string): string | LargeWorldMissionPackage {
  if (typeof item === "string") return new URL(item, baseUrl).href;
  return {
    ...item,
    url: new URL(item.url, baseUrl).href,
  };
}

function runtimeStatusLabel(): string {
  const features = ["Large Tile Streaming"];
  if (exposurePlan) features.push("Exposure Plan");
  if (navMesh) features.push("NavMesh Debug");
  if (navGameplayApi) features.push("Nav Gameplay API");
  if (navAgentDemo) features.push("Click-to-Move Agent");
  if (missionDebugPanel) features.push("Mission HUD");
  if (missionPackageReport) features.push("Mission Package Diagnostics");
  if (collisionPlan) features.push("Collision Streaming");
  return `${features.join(" + ")} enabled`;
}

function runtimeReadyLabel(manifest: LargeWorldManifest): string {
  const suffix = [
    exposurePlan ? "exposure" : "",
    navMesh ? `${navMesh.tiles.length} nav tiles` : "",
    navGameplayApi ? "nav gameplay api" : "",
    navAgentDemo ? "click-to-move" : "",
    missionDebugPanel ? "mission hud" : "",
    missionPackageReport ? `${missionPackageReport.loadedPackages}/${missionPackageReport.packageCount} mission package(s) · w${missionPackageReport.warnings}/e${missionPackageReport.errors}` : "",
    navRouteResult?.status === "success" ? `${navRouteResult.tileIds.length} route tiles` : "",
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

function disposeLine(line: THREE.Line | null): void {
  if (!line) return;
  line.parent?.remove(line);
  line.geometry.dispose();
  if (Array.isArray(line.material)) {
    line.material.forEach((material) => material.dispose());
  } else {
    line.material.dispose();
  }
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
