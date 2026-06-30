import * as THREE from "three";
import type { Vec3Tuple } from "../types/world.js";
import type { BoundsData } from "./LargeWorldTypes.js";
import type { RuntimeNavAgent, RuntimeNavAgentOptions } from "./NavAgentController.js";
import {
  RuntimeNavAgentRegistry,
  type RuntimeNavAgentRegistryEvent,
  type RuntimeNavAgentRegistryListener,
  type RuntimeNavAgentRegistrySnapshot,
} from "./NavAgentRegistry.js";
import {
  RuntimeNavMissionGraph,
  type RuntimeNavMissionGraphDefinition,
  type RuntimeNavMissionGraphRestoreOptions,
  type RuntimeNavMissionGraphSnapshot,
  type RuntimeNavMissionObjectiveDraft,
  type RuntimeNavMissionObjectivePatch,
  type RuntimeNavMissionObjectiveRecord,
} from "./NavMissionGraph.js";
import {
  RuntimeNavMissionHooks,
  type RuntimeNavMissionHook,
  type RuntimeNavMissionHookSnapshot,
} from "./NavMissionHooks.js";
import {
  RuntimeNavMissionState,
  type RuntimeNavMissionData,
  type RuntimeNavMissionDataValue,
  type RuntimeNavMissionDraft,
  type RuntimeNavMissionPatch,
  type RuntimeNavMissionRecord,
  type RuntimeNavMissionRestoreOptions,
  type RuntimeNavMissionSaveData,
  type RuntimeNavMissionStateSnapshot,
} from "./NavMissionState.js";
import { RuntimeNavMeshQuery, type NavRouteResult } from "./NavMeshQuery.js";
import type { RuntimeNavMeshManifest, RuntimeNavMeshTile } from "./NavMeshTypes.js";

export type RuntimeNavPoint = THREE.Vector3 | Vec3Tuple;

export interface RuntimeNavTileHit {
  tileId: string;
  walkable: boolean;
  layer: string | null;
  bounds: BoundsData;
}

export interface RuntimeNavGameplayApi {
  readonly ready: true;
  readonly walkableTileCount: number;
  readonly agents: RuntimeNavAgentRegistry;
  readonly missions: RuntimeNavMissionHooks;
  readonly missionState: RuntimeNavMissionState;
  readonly missionGraph: RuntimeNavMissionGraph;
  findTileContaining: (point: RuntimeNavPoint) => RuntimeNavTileHit | null;
  findNearestTile: (point: RuntimeNavPoint) => RuntimeNavTileHit | null;
  findRoute: (start: RuntimeNavPoint, goal: RuntimeNavPoint) => NavRouteResult;
  createAgent: (options?: RuntimeNavAgentOptions) => RuntimeNavAgent;
  getAgent: (id: string) => RuntimeNavAgent | null;
  removeAgent: (id: string) => boolean;
  updateAgents: (deltaSeconds: number) => RuntimeNavAgentRegistrySnapshot;
  snapshotAgents: () => RuntimeNavAgentRegistrySnapshot;
  subscribeAgentEvents: (listener: RuntimeNavAgentRegistryListener) => () => void;
  peekAgentEvents: () => RuntimeNavAgentRegistryEvent[];
  drainAgentEvents: () => RuntimeNavAgentRegistryEvent[];
  clearAgentEvents: () => void;
  setAgentEventLimit: (maxEvents: number) => void;
  addMissionHook: (hook: RuntimeNavMissionHook) => () => boolean;
  removeMissionHook: (id: string) => boolean;
  clearMissionHooks: () => void;
  snapshotMissionHooks: () => RuntimeNavMissionHookSnapshot;
  createMission: (draft: RuntimeNavMissionDraft) => RuntimeNavMissionRecord;
  upsertMission: (draft: RuntimeNavMissionDraft) => RuntimeNavMissionRecord;
  getMission: (id: string) => RuntimeNavMissionRecord | null;
  updateMission: (id: string, patch: RuntimeNavMissionPatch) => RuntimeNavMissionRecord;
  activateMission: (id: string, data?: RuntimeNavMissionData) => RuntimeNavMissionRecord;
  completeMission: (id: string, data?: RuntimeNavMissionData) => RuntimeNavMissionRecord;
  failMission: (id: string, data?: RuntimeNavMissionData) => RuntimeNavMissionRecord;
  resetMission: (id: string) => RuntimeNavMissionRecord;
  setMissionData: (id: string, key: string, value: RuntimeNavMissionDataValue) => RuntimeNavMissionRecord;
  removeMission: (id: string) => boolean;
  clearMissions: () => void;
  snapshotMissionState: () => RuntimeNavMissionStateSnapshot;
  exportMissionState: () => RuntimeNavMissionSaveData;
  restoreMissionState: (input: RuntimeNavMissionSaveData | string, options?: RuntimeNavMissionRestoreOptions) => RuntimeNavMissionStateSnapshot;
  createObjective: (draft: RuntimeNavMissionObjectiveDraft) => RuntimeNavMissionObjectiveRecord;
  upsertObjective: (draft: RuntimeNavMissionObjectiveDraft) => RuntimeNavMissionObjectiveRecord;
  getObjective: (id: string) => RuntimeNavMissionObjectiveRecord | null;
  updateObjective: (id: string, patch: RuntimeNavMissionObjectivePatch) => RuntimeNavMissionObjectiveRecord;
  activateObjective: (id: string, data?: RuntimeNavMissionData) => RuntimeNavMissionObjectiveRecord;
  completeObjective: (id: string, data?: RuntimeNavMissionData) => RuntimeNavMissionObjectiveRecord;
  failObjective: (id: string, data?: RuntimeNavMissionData) => RuntimeNavMissionObjectiveRecord;
  resetObjective: (id: string) => RuntimeNavMissionObjectiveRecord;
  setObjectiveData: (id: string, key: string, value: RuntimeNavMissionDataValue) => RuntimeNavMissionObjectiveRecord;
  removeObjective: (id: string) => boolean;
  clearObjectives: () => void;
  snapshotMissionGraph: () => RuntimeNavMissionGraphSnapshot;
  exportMissionGraph: () => RuntimeNavMissionGraphDefinition;
  restoreMissionGraph: (input: RuntimeNavMissionGraphDefinition | string, options?: RuntimeNavMissionGraphRestoreOptions) => RuntimeNavMissionGraphSnapshot;
}

export function createRuntimeNavGameplayApi(manifest: RuntimeNavMeshManifest): RuntimeNavGameplayApi {
  const query = new RuntimeNavMeshQuery(manifest);
  const walkableTileCount = manifest.tiles.filter((tile) => tile.walkable).length;
  const registry = new RuntimeNavAgentRegistry({
    findRoute: (start, goal) => query.findRoute(toVector3(start), toVector3(goal)),
  });
  const missions = new RuntimeNavMissionHooks();
  const missionState = new RuntimeNavMissionState();
  const missionGraph = new RuntimeNavMissionGraph();
  registry.subscribe((event) => missions.handleEvent(event));
  const api: RuntimeNavGameplayApi = {
    ready: true,
    walkableTileCount,
    agents: registry,
    missions,
    missionState,
    missionGraph,
    findTileContaining: (point) => summarizeTile(query.findTileContaining(toVector3(point))),
    findNearestTile: (point) => summarizeTile(query.findNearestTile(toVector3(point))),
    findRoute: (start, goal) => query.findRoute(toVector3(start), toVector3(goal)),
    createAgent: (options) => registry.createAgent(options),
    getAgent: (id) => registry.getAgent(id),
    removeAgent: (id) => registry.removeAgent(id),
    updateAgents: (deltaSeconds) => registry.update(deltaSeconds),
    snapshotAgents: () => registry.snapshot(),
    subscribeAgentEvents: (listener) => registry.subscribe(listener),
    peekAgentEvents: () => registry.peekEvents(),
    drainAgentEvents: () => registry.drainEvents(),
    clearAgentEvents: () => registry.clearEvents(),
    setAgentEventLimit: (maxEvents) => registry.setMaxEvents(maxEvents),
    addMissionHook: (hook) => missions.addHook(hook),
    removeMissionHook: (id) => missions.removeHook(id),
    clearMissionHooks: () => missions.clearHooks(),
    snapshotMissionHooks: () => missions.snapshot(),
    createMission: (draft) => missionState.createMission(draft),
    upsertMission: (draft) => missionState.upsertMission(draft),
    getMission: (id) => missionState.getMission(id),
    updateMission: (id, patch) => missionState.updateMission(id, patch),
    activateMission: (id, data) => missionState.activateMission(id, data),
    completeMission: (id, data) => missionState.completeMission(id, data),
    failMission: (id, data) => missionState.failMission(id, data),
    resetMission: (id) => missionState.resetMission(id),
    setMissionData: (id, key, value) => missionState.setMissionData(id, key, value),
    removeMission: (id) => missionState.removeMission(id),
    clearMissions: () => missionState.clearMissions(),
    snapshotMissionState: () => missionState.snapshot(),
    exportMissionState: () => missionState.exportState(),
    restoreMissionState: (input, options) => missionState.restoreState(input, options),
    createObjective: (draft) => missionGraph.createObjective(draft),
    upsertObjective: (draft) => missionGraph.upsertObjective(draft),
    getObjective: (id) => missionGraph.getObjective(id),
    updateObjective: (id, patch) => missionGraph.updateObjective(id, patch),
    activateObjective: (id, data) => missionGraph.activateObjective(id, data),
    completeObjective: (id, data) => missionGraph.completeObjective(id, data),
    failObjective: (id, data) => missionGraph.failObjective(id, data),
    resetObjective: (id) => missionGraph.resetObjective(id),
    setObjectiveData: (id, key, value) => missionGraph.setObjectiveData(id, key, value),
    removeObjective: (id) => missionGraph.removeObjective(id),
    clearObjectives: () => missionGraph.clearObjectives(),
    snapshotMissionGraph: () => missionGraph.snapshot(missionState),
    exportMissionGraph: () => missionGraph.exportGraph(),
    restoreMissionGraph: (input, options) => missionGraph.restoreGraph(input, options),
  };
  return api;
}

function summarizeTile(tile: RuntimeNavMeshTile | null): RuntimeNavTileHit | null {
  if (!tile) return null;
  return {
    tileId: tile.tileId,
    walkable: tile.walkable,
    layer: tile.layer ?? null,
    bounds: cloneBounds(tile.bounds),
  };
}

function cloneBounds(bounds: BoundsData): BoundsData {
  return {
    min: [bounds.min[0], bounds.min[1], bounds.min[2]],
    max: [bounds.max[0], bounds.max[1], bounds.max[2]],
  };
}

function toVector3(point: RuntimeNavPoint): THREE.Vector3 {
  return point instanceof THREE.Vector3 ? point.clone() : new THREE.Vector3(point[0], point[1], point[2]);
}
