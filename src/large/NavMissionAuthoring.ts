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
    metadata: normalizeMetadata(draft.metadata),
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
  if (!Array.isArray(value.missions)) throw new Error("Runtime nav mission authoring document requires a missions array.");
  if (!Array.isArray(value.objectives)) throw new Error("Runtime nav mission authoring document requires an objectives array.");
  if (!Array.isArray(value.runnerRules)) throw new Error("Runtime nav mission authoring document requires a runnerRules array.");
  return {
    schemaVersion: RUNTIME_NAV_MISSION_AUTHORING_SCHEMA_VERSION,
    savedAt: readTimestamp(value.savedAt),
    metadata: normalizeMetadata(value.metadata),
    missions: value.missions.map(normalizeMissionDraft),
    objectives: value.objectives.map(normalizeObjectiveDraft),
    runnerRules: value.runnerRules.map(normalizeRunnerRule),
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

function normalizeMissionDraft(input: unknown): RuntimeNavMissionDraft {
  const value = requireObject(input, "Runtime nav mission authoring mission must be an object.");
  const mission: RuntimeNavMissionDraft = {
    id: readRequiredString(value.id, "Runtime nav mission authoring mission requires an id."),
  };
  const status = readMissionStatus(value.status);
  if (status) mission.status = status;
  if (typeof value.progress === "number") mission.progress = normalizeProgress(value.progress);
  if (isObject(value.data)) mission.data = readData(value.data);
  return mission;
}

function normalizeObjectiveDraft(input: unknown): RuntimeNavMissionObjectiveDraft {
  const value = requireObject(input, "Runtime nav mission authoring objective must be an object.");
  const objective: RuntimeNavMissionObjectiveDraft = {
    id: readRequiredString(value.id, "Runtime nav mission authoring objective requires an id."),
  };
  const missionId = readOptionalString(value.missionId);
  const title = readOptionalText(value.title);
  const description = readOptionalText(value.description);
  const status = readObjectiveStatus(value.status);
  const dependsOn = readStringList(value.dependsOn);
  const requiredMissions = readStringList(value.requiredMissions);
  const conditions = readObjectiveDependencies(value.conditions);
  if (missionId) objective.missionId = missionId;
  if (title) objective.title = title;
  if (description) objective.description = description;
  if (status) objective.status = status;
  if (typeof value.autoActivate === "boolean") objective.autoActivate = value.autoActivate;
  if (dependsOn.length > 0) objective.dependsOn = dependsOn;
  if (requiredMissions.length > 0) objective.requiredMissions = requiredMissions;
  if (conditions.length > 0) objective.conditions = conditions;
  if (isObject(value.data)) objective.data = readData(value.data);
  return objective;
}

function normalizeRunnerRule(input: unknown): RuntimeNavMissionRunnerRule {
  const value = requireObject(input, "Runtime nav mission authoring runner rule must be an object.");
  return {
    id: readRequiredString(value.id, "Runtime nav mission authoring runner rule requires an id."),
    event: readRunnerEventFilter(value.event),
    action: readRunnerAction(value.action),
    once: typeof value.once === "boolean" ? value.once : false,
    enabled: typeof value.enabled === "boolean" ? value.enabled : true,
  };
}

function readRunnerEventFilter(input: unknown): RuntimeNavMissionRunnerEventFilter {
  const value = isObject(input) ? input : {};
  const filter: RuntimeNavMissionRunnerEventFilter = {
    source: readRunnerEventSource(value.source),
    type: readRunnerEventType(value.type),
  };
  const agentId = readOptionalString(value.agentId);
  const sourceId = readOptionalString(value.sourceId);
  const event = readOptionalString(value.event);
  const status = readAgentStatus(value.status);
  const previousStatus = readAgentStatus(value.previousStatus);
  const kind = readGameplayKind(value.kind);
  if (agentId) filter.agentId = agentId;
  if (status) filter.status = status;
  if (previousStatus) filter.previousStatus = previousStatus;
  if (sourceId) filter.sourceId = sourceId;
  if (kind) filter.kind = kind;
  if (event) filter.event = event;
  return filter;
}

function readRunnerAction(input: unknown): RuntimeNavMissionRunnerRule["action"] {
  const value = requireObject(input, "Runtime nav mission authoring runner rule requires an action object.");
  const id = readRequiredString(value.id, "Runtime nav mission authoring runner action requires an id.");
  if (value.kind === "mission") {
    return {
      kind: "mission",
      id,
      status: readMissionStatus(value.status) ?? "inactive",
      data: readData(value.data),
    };
  }
  if (value.kind === "objective") {
    return {
      kind: "objective",
      id,
      status: readObjectiveStatus(value.status) ?? "locked",
      data: readData(value.data),
    };
  }
  throw new Error("Runtime nav mission authoring runner action kind must be mission or objective.");
}

function readObjectiveDependencies(input: unknown): RuntimeNavMissionObjectiveDependency[] {
  if (!Array.isArray(input)) return [];
  return input.flatMap((item) => {
    if (!isObject(item)) return [];
    const id = readOptionalString(item.id);
    if (!id) return [];
    if (item.kind === "mission") {
      const dependency: RuntimeNavMissionObjectiveDependency = { kind: "mission", id };
      const status = readMissionStatus(item.status);
      if (status) dependency.status = status;
      return [dependency];
    }
    if (item.kind === "objective") {
      const dependency: RuntimeNavMissionObjectiveDependency = { kind: "objective", id };
      const status = readObjectiveStatus(item.status);
      if (status) dependency.status = status;
      return [dependency];
    }
    return [];
  });
}

function normalizeMetadata(input: unknown): RuntimeNavMissionAuthoringMetadata {
  const value = isObject(input) ? input : {};
  const metadata: RuntimeNavMissionAuthoringMetadata = {};
  const id = readOptionalString(value.id);
  const title = readOptionalText(value.title);
  const description = readOptionalText(value.description);
  const version = readOptionalText(value.version);
  const tags = readTextList(value.tags);
  if (id) metadata.id = id;
  if (title) metadata.title = title;
  if (description) metadata.description = description;
  if (version) metadata.version = version;
  if (tags.length > 0) metadata.tags = tags;
  return metadata;
}

function cloneMetadata(metadata: RuntimeNavMissionAuthoringMetadata): RuntimeNavMissionAuthoringMetadata {
  const clone: RuntimeNavMissionAuthoringMetadata = { ...metadata };
  if (metadata.tags) clone.tags = [...metadata.tags];
  return clone;
}

function readMissionStatus(value: unknown): RuntimeNavMissionStatus | null {
  return value === "inactive" || value === "active" || value === "completed" || value === "failed" ? value : null;
}

function readObjectiveStatus(value: unknown): RuntimeNavMissionObjectiveStatus | null {
  return value === "locked" || value === "active" || value === "completed" || value === "failed" ? value : null;
}

function readRunnerEventSource(value: unknown): RuntimeNavMissionRunnerEventFilter["source"] {
  return value === "agent" || value === "gameplay" || value === "any" ? value : "any";
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

function readAgentStatus(value: unknown): RuntimeNavMissionRunnerEventFilter["status"] | null {
  return value === "idle" || value === "moving" || value === "arrived" || value === "blocked" ? value : null;
}

function readGameplayKind(value: unknown): RuntimeNavMissionRunnerEventFilter["kind"] | null {
  return value === "trigger" || value === "interaction" ? value : null;
}

function readData(input: unknown): RuntimeNavMissionData {
  if (!isObject(input)) return {};
  const data: RuntimeNavMissionData = {};
  for (const [key, value] of Object.entries(input)) {
    if (isDataValue(value)) data[key] = value;
  }
  return data;
}

function readStringList(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return Array.from(new Set(input.flatMap((value) => (typeof value === "string" ? [normalizeString(value)] : [])).filter(Boolean)));
}

function readTextList(input: unknown): string[] {
  return readStringList(input);
}

function readRequiredString(value: unknown, message: string): string {
  if (typeof value !== "string") throw new Error(message);
  const text = normalizeString(value);
  if (!text) throw new Error(message);
  return text;
}

function readOptionalString(value: unknown): string | null {
  return typeof value === "string" ? normalizeString(value) || null : null;
}

function readOptionalText(value: unknown): string | null {
  return readOptionalString(value);
}

function normalizeString(value: string): string {
  return value.trim();
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

function requireObject(value: unknown, message: string): Record<string, unknown> {
  if (!isObject(value)) throw new Error(message);
  return value;
}

function isDataValue(value: unknown): value is RuntimeNavMissionData[keyof RuntimeNavMissionData] {
  return value === null || typeof value === "string" || (typeof value === "number" && Number.isFinite(value)) || typeof value === "boolean";
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
