import type {
  RuntimeNavMissionData,
  RuntimeNavMissionDraft,
  RuntimeNavMissionRecord,
  RuntimeNavMissionStatus,
} from "./NavMissionState.js";
import type {
  RuntimeNavMissionObjectiveDependency,
  RuntimeNavMissionObjectiveDraft,
  RuntimeNavMissionObjectiveRecord,
  RuntimeNavMissionObjectiveStatus,
} from "./NavMissionGraph.js";
import type {
  RuntimeNavMissionRunnerEventFilter,
  RuntimeNavMissionRunnerRule,
  RuntimeNavMissionRunnerRuleSnapshot,
} from "./NavMissionRunner.js";

export const RUNTIME_NAV_MISSION_AUTHORING_SCHEMA_VERSION = 1;

export interface RuntimeNavMissionAuthoringMetadata {
  id?: string;
  title?: string;
  description?: string;
  version?: string;
  tags?: string[];
}

export interface RuntimeNavMissionAuthoringDocument {
  schemaVersion: typeof RUNTIME_NAV_MISSION_AUTHORING_SCHEMA_VERSION;
  savedAt: number;
  metadata: RuntimeNavMissionAuthoringMetadata;
  missions: RuntimeNavMissionDraft[];
  objectives: RuntimeNavMissionObjectiveDraft[];
  runnerRules: RuntimeNavMissionRunnerRule[];
}

export interface RuntimeNavMissionAuthoringDraft {
  metadata?: RuntimeNavMissionAuthoringMetadata;
  missions?: RuntimeNavMissionDraft[];
  objectives?: RuntimeNavMissionObjectiveDraft[];
  runnerRules?: RuntimeNavMissionRunnerRule[];
}

export interface RuntimeNavMissionAuthoringExportSource {
  snapshotMissionState: () => { missions: RuntimeNavMissionRecord[] };
  exportMissionGraph: () => { objectives: RuntimeNavMissionObjectiveRecord[] };
  snapshotMissionRunner: () => { rules: RuntimeNavMissionRunnerRuleSnapshot[] };
}

export interface RuntimeNavMissionAuthoringApplyTarget {
  upsertMission: (draft: RuntimeNavMissionDraft) => unknown;
  upsertObjective: (draft: RuntimeNavMissionObjectiveDraft) => unknown;
  upsertMissionRunnerRule: (rule: RuntimeNavMissionRunnerRule) => unknown;
  clearMissions?: () => void;
  clearObjectives?: () => void;
  clearMissionRunnerRules?: () => void;
}

export interface RuntimeNavMissionAuthoringApplyOptions {
  merge?: boolean;
}

export interface RuntimeNavMissionAuthoringApplyResult {
  schemaVersion: typeof RUNTIME_NAV_MISSION_AUTHORING_SCHEMA_VERSION;
  metadata: RuntimeNavMissionAuthoringMetadata;
  missions: number;
  objectives: number;
  runnerRules: number;
}

export function createRuntimeNavMissionAuthoringDocument(
  draft: RuntimeNavMissionAuthoringDraft = {},
): RuntimeNavMissionAuthoringDocument {
  return {
    schemaVersion: RUNTIME_NAV_MISSION_AUTHORING_SCHEMA_VERSION,
    savedAt: Date.now(),
    metadata: normalizeMetadata(draft.metadata ?? {}),
    missions: (draft.missions ?? []).map(normalizeMissionDraft),
    objectives: (draft.objectives ?? []).map(normalizeObjectiveDraft),
    runnerRules: (draft.runnerRules ?? []).map(normalizeRunnerRule),
  };
}

export function exportRuntimeNavMissionAuthoringDocument(
  source: RuntimeNavMissionAuthoringExportSource,
  metadata: RuntimeNavMissionAuthoringMetadata = {},
): RuntimeNavMissionAuthoringDocument {
  return createRuntimeNavMissionAuthoringDocument({
    metadata,
    missions: source.snapshotMissionState().missions.map(missionRecordToDraft),
    objectives: source.exportMissionGraph().objectives.map(objectiveRecordToDraft),
    runnerRules: source.snapshotMissionRunner().rules.map(runnerRuleSnapshotToRule),
  });
}

export function parseRuntimeNavMissionAuthoringDocument(
  input: RuntimeNavMissionAuthoringDocument | string,
): RuntimeNavMissionAuthoringDocument {
  const value = typeof input === "string" ? parseJson(input) : input;
  if (!isObject(value)) throw new Error("Runtime nav mission authoring document must be an object.");
  if (value.schemaVersion !== RUNTIME_NAV_MISSION_AUTHORING_SCHEMA_VERSION) {
    throw new Error(`Unsupported runtime nav mission authoring version: ${String(value.schemaVersion)}`);
  }
  const missions = value.missions;
  const objectives = value.objectives;
  const runnerRules = value.runnerRules;
  if (!Array.isArray(missions)) throw new Error("Runtime nav mission authoring document requires a missions array.");
  if (!Array.isArray(objectives)) throw new Error("Runtime nav mission authoring document requires an objectives array.");
  if (!Array.isArray(runnerRules)) throw new Error("Runtime nav mission authoring document requires a runnerRules array.");
  return {
    schemaVersion: RUNTIME_NAV_MISSION_AUTHORING_SCHEMA_VERSION,
    savedAt: readTimestamp(value.savedAt),
    metadata: normalizeMetadata(readObject(value.metadata)),
    missions: missions.map(readMissionDraft),
    objectives: objectives.map(readObjectiveDraft),
    runnerRules: runnerRules.map(readRunnerRule),
  };
}

export function applyRuntimeNavMissionAuthoringDocument(
  target: RuntimeNavMissionAuthoringApplyTarget,
  input: RuntimeNavMissionAuthoringDocument | string,
  options: RuntimeNavMissionAuthoringApplyOptions = {},
): RuntimeNavMissionAuthoringApplyResult {
  const document = parseRuntimeNavMissionAuthoringDocument(input);
  if (!options.merge) {
    target.clearMissionRunnerRules?.();
    target.clearObjectives?.();
    target.clearMissions?.();
  }
  for (const mission of document.missions) target.upsertMission(mission);
  for (const objective of document.objectives) target.upsertObjective(objective);
  for (const rule of document.runnerRules) target.upsertMissionRunnerRule(rule);
  return {
    schemaVersion: RUNTIME_NAV_MISSION_AUTHORING_SCHEMA_VERSION,
    metadata: cloneMetadata(document.metadata),
    missions: document.missions.length,
    objectives: document.objectives.length,
    runnerRules: document.runnerRules.length,
  };
}

function missionRecordToDraft(record: RuntimeNavMissionRecord): RuntimeNavMissionDraft {
  return normalizeMissionDraft({
    id: record.id,
    status: record.status,
    progress: record.progress,
    data: record.data,
  });
}

function objectiveRecordToDraft(record: RuntimeNavMissionObjectiveRecord): RuntimeNavMissionObjectiveDraft {
  return normalizeObjectiveDraft({
    id: record.id,
    missionId: record.missionId ?? undefined,
    title: record.title ?? undefined,
    description: record.description ?? undefined,
    status: record.status,
    autoActivate: record.autoActivate,
    dependsOn: record.dependsOn,
    requiredMissions: record.requiredMissions,
    conditions: record.conditions,
    data: record.data,
  });
}

function runnerRuleSnapshotToRule(snapshot: RuntimeNavMissionRunnerRuleSnapshot): RuntimeNavMissionRunnerRule {
  return normalizeRunnerRule({
    id: snapshot.id,
    event: snapshot.event,
    action: snapshot.action,
    once: snapshot.once,
    enabled: snapshot.enabled,
  });
}

function readMissionDraft(value: unknown): RuntimeNavMissionDraft {
  if (!isObject(value)) throw new Error("Runtime nav mission authoring mission must be an object.");
  return normalizeMissionDraft({
    id: readRequiredId(value.id, "Runtime nav mission authoring mission requires an id."),
    status: readMissionStatus(value.status),
    progress: typeof value.progress === "number" ? normalizeProgress(value.progress) : undefined,
    data: readData(value.data),
  });
}

function normalizeMissionDraft(draft: RuntimeNavMissionDraft): RuntimeNavMissionDraft {
  const mission: RuntimeNavMissionDraft = {
    id: normalizeId(draft.id, "Runtime nav mission authoring mission requires an id."),
  };
  if (draft.status) mission.status = readMissionStatus(draft.status);
  if (draft.progress !== undefined) mission.progress = normalizeProgress(draft.progress);
  if (draft.data) mission.data = cloneData(draft.data);
  return mission;
}

function readObjectiveDraft(value: unknown): RuntimeNavMissionObjectiveDraft {
  if (!isObject(value)) throw new Error("Runtime nav mission authoring objective must be an object.");
  return normalizeObjectiveDraft({
    id: readRequiredId(value.id, "Runtime nav mission authoring objective requires an id."),
    missionId: readOptionalId(value.missionId),
    title: readOptionalText(value.title),
    description: readOptionalText(value.description),
    status: readObjectiveStatus(value.status),
    autoActivate: typeof value.autoActivate === "boolean" ? value.autoActivate : undefined,
    dependsOn: readIdList(value.dependsOn),
    requiredMissions: readIdList(value.requiredMissions),
    conditions: readObjectiveDependencies(value.conditions),
    data: readData(value.data),
  });
}

function normalizeObjectiveDraft(draft: RuntimeNavMissionObjectiveDraft): RuntimeNavMissionObjectiveDraft {
  const objective: RuntimeNavMissionObjectiveDraft = {
    id: normalizeId(draft.id, "Runtime nav mission authoring objective requires an id."),
  };
  const missionId = readOptionalId(draft.missionId);
  const title = readOptionalText(draft.title);
  const description = readOptionalText(draft.description);
  if (missionId) objective.missionId = missionId;
  if (title) objective.title = title;
  if (description) objective.description = description;
  if (draft.status) objective.status = readObjectiveStatus(draft.status);
  if (draft.autoActivate !== undefined) objective.autoActivate = Boolean(draft.autoActivate);
  if (draft.dependsOn) objective.dependsOn = readIdList(draft.dependsOn);
  if (draft.requiredMissions) objective.requiredMissions = readIdList(draft.requiredMissions);
  if (draft.conditions) objective.conditions = readObjectiveDependencies(draft.conditions);
  if (draft.data) objective.data = cloneData(draft.data);
  return objective;
}

function readRunnerRule(value: unknown): RuntimeNavMissionRunnerRule {
  if (!isObject(value)) throw new Error("Runtime nav mission authoring runner rule must be an object.");
  return normalizeRunnerRule({
    id: readRequiredId(value.id, "Runtime nav mission authoring runner rule requires an id."),
    event: readRunnerEventFilter(value.event),
    action: readRunnerAction(value.action),
    once: typeof value.once === "boolean" ? value.once : undefined,
    enabled: typeof value.enabled === "boolean" ? value.enabled : undefined,
  });
}

function normalizeRunnerRule(rule: RuntimeNavMissionRunnerRule): RuntimeNavMissionRunnerRule {
  return {
    id: normalizeId(rule.id, "Runtime nav mission authoring runner rule requires an id."),
    event: readRunnerEventFilter(rule.event),
    action: readRunnerAction(rule.action),
    once: rule.once ?? false,
    enabled: rule.enabled ?? true,
  };
}

function readRunnerEventFilter(value: unknown): RuntimeNavMissionRunnerEventFilter {
  if (!isObject(value)) return { source: "any", type: "any" };
  const filter: RuntimeNavMissionRunnerEventFilter = {
    source: value.source === "agent" || value.source === "gameplay" || value.source === "any" ? value.source : "any",
    type: readRunnerEventType(value.type),
  };
  const agentId = readOptionalId(value.agentId);
  const sourceId = readOptionalId(value.sourceId);
  const event = readOptionalId(value.event);
  if (agentId) filter.agentId = agentId;
  if (value.status === "idle" || value.status === "moving" || value.status === "arrived" || value.status === "blocked") filter.status = value.status;
  if (value.previousStatus === "idle" || value.previousStatus === "moving" || value.previousStatus === "arrived" || value.previousStatus === "blocked") {
    filter.previousStatus = value.previousStatus;
  }
  if (sourceId) filter.sourceId = sourceId;
  if (value.kind === "trigger" || value.kind === "interaction") filter.kind = value.kind;
  if (event) filter.event = event;
  return filter;
}

function readRunnerAction(value: unknown): RuntimeNavMissionRunnerRule["action"] {
  if (!isObject(value)) throw new Error("Runtime nav mission authoring runner rule requires an action object.");
  const id = readRequiredId(value.id, "Runtime nav mission authoring runner action requires an id.");
  if (value.kind === "mission") {
    return {
      kind: "mission",
      id,
      status: readMissionActionStatus(value.status),
      data: readData(value.data),
    };
  }
  if (value.kind === "objective") {
    return {
      kind: "objective",
      id,
      status: readObjectiveStatus(value.status),
      data: readData(value.data),
    };
  }
  throw new Error("Runtime nav mission authoring runner action kind must be mission or objective.");
}

function readObjectiveDependencies(value: unknown): RuntimeNavMissionObjectiveDependency[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!isObject(item)) return [];
    const id = readOptionalId(item.id);
    if (!id) return [];
    if (item.kind === "mission") return [{ kind: "mission", id, status: readMissionStatus(item.status) }];
    if (item.kind === "objective") return [{ kind: "objective", id, status: readObjectiveStatus(item.status) }];
    return [];
  });
}

function normalizeMetadata(metadata: RuntimeNavMissionAuthoringMetadata): RuntimeNavMissionAuthoringMetadata {
  const result: RuntimeNavMissionAuthoringMetadata = {};
  const id = readOptionalId(metadata.id);
  const title = readOptionalText(metadata.title);
  const description = readOptionalText(metadata.description);
  const version = readOptionalText(metadata.version);
  if (id) result.id = id;
  if (title) result.title = title;
  if (description) result.description = description;
  if (version) result.version = version;
  if (Array.isArray(metadata.tags)) result.tags = readTextList(metadata.tags);
  return result;
}

function cloneMetadata(metadata: RuntimeNavMissionAuthoringMetadata): RuntimeNavMissionAuthoringMetadata {
  return {
    ...metadata,
    tags: metadata.tags ? [...metadata.tags] : undefined,
  };
}

function readMissionStatus(value: unknown): RuntimeNavMissionStatus | undefined {
  if (value === "inactive" || value === "active" || value === "completed" || value === "failed") return value;
  return undefined;
}

function readMissionActionStatus(value: unknown): Exclude<RuntimeNavMissionStatus, never> {
  return readMissionStatus(value) ?? "inactive";
}

function readObjectiveStatus(value: unknown): RuntimeNavMissionObjectiveStatus | undefined {
  if (value === "locked" || value === "active" || value === "completed" || value === "failed") return value;
  return undefined;
}

function readRunnerEventType(value: unknown): RuntimeNavMissionRunnerEventFilter["type"] {
  if (
    value === "created" ||
    value === "removed" ||
    value === "status-change" ||
    value === "arrived" ||
    value === "blocked" ||
    value === "trigger" ||
    value === "interaction" ||
    value === "gameplay" ||
    value === "any"
  ) return value;
  return "any";
}

function readIdList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.flatMap((item) => (typeof item === "string" ? [normalizeId(item, "Runtime nav mission authoring id cannot be empty.")] : []))));
}

function readTextList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.flatMap((item) => (typeof item === "string" ? [item.trim()].filter(Boolean) : []))));
}

function readData(value: unknown): RuntimeNavMissionData {
  if (!isObject(value)) return {};
  const data: RuntimeNavMissionData = {};
  for (const [key, item] of Object.entries(value)) {
    if (isDataValue(item)) data[key] = item;
  }
  return data;
}

function cloneData(value: RuntimeNavMissionData): RuntimeNavMissionData {
  return readData(value);
}

function readObject(value: unknown): RuntimeNavMissionAuthoringMetadata {
  return isObject(value) ? value : {};
}

function readRequiredId(value: unknown, message: string): string {
  if (typeof value !== "string") throw new Error(message);
  return normalizeId(value, message);
}

function readOptionalId(value: unknown): string | undefined {
  return typeof value === "string" ? normalizeId(value, "Runtime nav mission authoring id cannot be empty.") : undefined;
}

function readOptionalText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const text = value.trim();
  return text || undefined;
}

function normalizeId(id: string, message: string): string {
  const value = id.trim();
  if (!value) throw new Error(message);
  return value;
}

function normalizeProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function readTimestamp(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : Date.now();
}

function parseJson(input: string): unknown {
  try {
    return JSON.parse(input) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid runtime nav mission authoring JSON: ${message}`);
  }
}

function isDataValue(value: unknown): value is RuntimeNavMissionData[keyof RuntimeNavMissionData] {
  return value === null || typeof value === "string" || (typeof value === "number" && Number.isFinite(value)) || typeof value === "boolean";
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
