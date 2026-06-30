import type { RuntimeNavMissionData, RuntimeNavMissionDataValue, RuntimeNavMissionState, RuntimeNavMissionStatus } from "./NavMissionState.js";

export const RUNTIME_NAV_MISSION_GRAPH_SCHEMA_VERSION = 1;

export type RuntimeNavMissionObjectiveStatus = "locked" | "active" | "completed" | "failed";

export type RuntimeNavMissionObjectiveDependency =
  | {
      kind: "objective";
      id: string;
      status?: RuntimeNavMissionObjectiveStatus;
    }
  | {
      kind: "mission";
      id: string;
      status?: RuntimeNavMissionStatus;
    };

export interface RuntimeNavMissionObjectiveDraft {
  id: string;
  missionId?: string;
  title?: string;
  description?: string;
  status?: RuntimeNavMissionObjectiveStatus;
  autoActivate?: boolean;
  dependsOn?: string[];
  requiredMissions?: string[];
  conditions?: RuntimeNavMissionObjectiveDependency[];
  data?: RuntimeNavMissionData;
}

export interface RuntimeNavMissionObjectivePatch {
  missionId?: string | null;
  title?: string | null;
  description?: string | null;
  status?: RuntimeNavMissionObjectiveStatus;
  autoActivate?: boolean;
  dependsOn?: string[];
  requiredMissions?: string[];
  conditions?: RuntimeNavMissionObjectiveDependency[];
  data?: RuntimeNavMissionData;
}

export interface RuntimeNavMissionObjectiveRecord {
  id: string;
  missionId: string | null;
  title: string | null;
  description: string | null;
  status: RuntimeNavMissionObjectiveStatus;
  autoActivate: boolean;
  dependsOn: string[];
  requiredMissions: string[];
  conditions: RuntimeNavMissionObjectiveDependency[];
  data: RuntimeNavMissionData;
  updatedAt: number;
  completedAt: number | null;
  failedAt: number | null;
}

export interface RuntimeNavMissionObjectiveSnapshot extends RuntimeNavMissionObjectiveRecord {
  resolvedStatus: RuntimeNavMissionObjectiveStatus;
  dependenciesSatisfied: boolean;
  blockedBy: string[];
}

export interface RuntimeNavMissionGraphSnapshot {
  schemaVersion: typeof RUNTIME_NAV_MISSION_GRAPH_SCHEMA_VERSION;
  count: number;
  locked: number;
  active: number;
  completed: number;
  failed: number;
  readyObjectiveIds: string[];
  objectives: RuntimeNavMissionObjectiveSnapshot[];
}

export interface RuntimeNavMissionGraphDefinition {
  schemaVersion: typeof RUNTIME_NAV_MISSION_GRAPH_SCHEMA_VERSION;
  savedAt: number;
  objectives: RuntimeNavMissionObjectiveRecord[];
}

export interface RuntimeNavMissionGraphRestoreOptions {
  merge?: boolean;
}

export class RuntimeNavMissionGraph {
  private readonly objectives = new Map<string, RuntimeNavMissionObjectiveRecord>();

  createObjective(draft: RuntimeNavMissionObjectiveDraft): RuntimeNavMissionObjectiveRecord {
    const id = normalizeId(draft.id, "Runtime nav mission objective requires a non-empty id.");
    if (this.objectives.has(id)) throw new Error(`Runtime nav mission objective already exists: ${id}`);
    const objective = createRecord({ ...draft, id }, Date.now());
    this.objectives.set(id, objective);
    return cloneRecord(objective);
  }

  upsertObjective(draft: RuntimeNavMissionObjectiveDraft): RuntimeNavMissionObjectiveRecord {
    const id = normalizeId(draft.id, "Runtime nav mission objective requires a non-empty id.");
    if (!this.objectives.has(id)) return this.createObjective({ ...draft, id });
    return this.updateObjective(id, {
      missionId: draft.missionId,
      title: draft.title,
      description: draft.description,
      status: draft.status,
      autoActivate: draft.autoActivate,
      dependsOn: draft.dependsOn,
      requiredMissions: draft.requiredMissions,
      conditions: draft.conditions,
      data: draft.data,
    });
  }

  getObjective(id: string): RuntimeNavMissionObjectiveRecord | null {
    const objective = this.objectives.get(normalizeObjectiveId(id));
    return objective ? cloneRecord(objective) : null;
  }

  updateObjective(id: string, patch: RuntimeNavMissionObjectivePatch): RuntimeNavMissionObjectiveRecord {
    const objective = this.requireObjective(id);
    const status = patch.status ?? objective.status;
    const next: RuntimeNavMissionObjectiveRecord = {
      ...objective,
      missionId: patch.missionId === undefined ? objective.missionId : normalizeNullableId(patch.missionId),
      title: patch.title === undefined ? objective.title : normalizeNullableText(patch.title),
      description: patch.description === undefined ? objective.description : normalizeNullableText(patch.description),
      status,
      autoActivate: patch.autoActivate ?? objective.autoActivate,
      dependsOn: patch.dependsOn === undefined ? [...objective.dependsOn] : normalizeIdList(patch.dependsOn),
      requiredMissions:
        patch.requiredMissions === undefined ? [...objective.requiredMissions] : normalizeIdList(patch.requiredMissions),
      conditions: patch.conditions === undefined ? cloneConditions(objective.conditions) : normalizeConditions(patch.conditions),
      data: patch.data === undefined ? cloneData(objective.data) : cloneData(patch.data),
      updatedAt: Date.now(),
      completedAt: status === "completed" ? objective.completedAt ?? Date.now() : null,
      failedAt: status === "failed" ? objective.failedAt ?? Date.now() : null,
    };
    this.objectives.set(objective.id, next);
    return cloneRecord(next);
  }

  activateObjective(id: string, data?: RuntimeNavMissionData): RuntimeNavMissionObjectiveRecord {
    return this.updateObjective(id, { status: "active", data: data ?? this.requireObjective(id).data });
  }

  completeObjective(id: string, data?: RuntimeNavMissionData): RuntimeNavMissionObjectiveRecord {
    return this.updateObjective(id, { status: "completed", data: data ?? this.requireObjective(id).data });
  }

  failObjective(id: string, data?: RuntimeNavMissionData): RuntimeNavMissionObjectiveRecord {
    return this.updateObjective(id, { status: "failed", data: data ?? this.requireObjective(id).data });
  }

  resetObjective(id: string): RuntimeNavMissionObjectiveRecord {
    return this.updateObjective(id, { status: "locked" });
  }

  setObjectiveData(id: string, key: string, value: RuntimeNavMissionDataValue): RuntimeNavMissionObjectiveRecord {
    const objective = this.requireObjective(id);
    return this.updateObjective(id, { data: { ...objective.data, [key]: value } });
  }

  removeObjective(id: string): boolean {
    return this.objectives.delete(normalizeObjectiveId(id));
  }

  clearObjectives(): void {
    this.objectives.clear();
  }

  snapshot(missionState?: RuntimeNavMissionState): RuntimeNavMissionGraphSnapshot {
    const records = new Map(this.objectives);
    const objectives = Array.from(records.values(), (objective) => resolveObjective(objective, records, missionState, new Set<string>()));
    return {
      schemaVersion: RUNTIME_NAV_MISSION_GRAPH_SCHEMA_VERSION,
      count: objectives.length,
      locked: objectives.filter((objective) => objective.resolvedStatus === "locked").length,
      active: objectives.filter((objective) => objective.resolvedStatus === "active").length,
      completed: objectives.filter((objective) => objective.resolvedStatus === "completed").length,
      failed: objectives.filter((objective) => objective.resolvedStatus === "failed").length,
      readyObjectiveIds: objectives
        .filter((objective) => objective.status === "locked" && objective.resolvedStatus === "active")
        .map((objective) => objective.id),
      objectives,
    };
  }

  exportGraph(): RuntimeNavMissionGraphDefinition {
    return {
      schemaVersion: RUNTIME_NAV_MISSION_GRAPH_SCHEMA_VERSION,
      savedAt: Date.now(),
      objectives: Array.from(this.objectives.values(), cloneRecord),
    };
  }

  restoreGraph(input: RuntimeNavMissionGraphDefinition | string, options: RuntimeNavMissionGraphRestoreOptions = {}): RuntimeNavMissionGraphSnapshot {
    const definition = parseGraphDefinition(input);
    if (!options.merge) this.objectives.clear();
    for (const objective of definition.objectives) this.objectives.set(objective.id, cloneRecord(objective));
    return this.snapshot();
  }

  private requireObjective(id: string): RuntimeNavMissionObjectiveRecord {
    const objectiveId = normalizeObjectiveId(id);
    const objective = this.objectives.get(objectiveId);
    if (!objective) throw new Error(`Runtime nav mission objective not found: ${objectiveId}`);
    return objective;
  }
}

function createRecord(draft: RuntimeNavMissionObjectiveDraft, timestamp: number): RuntimeNavMissionObjectiveRecord {
  const status = draft.status ?? "locked";
  return {
    id: normalizeObjectiveId(draft.id),
    missionId: draft.missionId ? normalizeMissionId(draft.missionId) : null,
    title: normalizeNullableText(draft.title),
    description: normalizeNullableText(draft.description),
    status,
    autoActivate: draft.autoActivate ?? true,
    dependsOn: normalizeIdList(draft.dependsOn ?? []),
    requiredMissions: normalizeIdList(draft.requiredMissions ?? []),
    conditions: normalizeConditions(draft.conditions ?? []),
    data: cloneData(draft.data ?? {}),
    updatedAt: timestamp,
    completedAt: status === "completed" ? timestamp : null,
    failedAt: status === "failed" ? timestamp : null,
  };
}

function resolveObjective(
  objective: RuntimeNavMissionObjectiveRecord,
  records: Map<string, RuntimeNavMissionObjectiveRecord>,
  missionState: RuntimeNavMissionState | undefined,
  visited: Set<string>,
): RuntimeNavMissionObjectiveSnapshot {
  const record = cloneRecord(objective);
  if (record.status === "completed" || record.status === "failed") {
    return { ...record, resolvedStatus: record.status, dependenciesSatisfied: true, blockedBy: [] };
  }
  const blockedBy = findBlockingDependencies(record, records, missionState, visited);
  const dependenciesSatisfied = blockedBy.length === 0;
  const resolvedStatus = dependenciesSatisfied && record.status === "locked" && record.autoActivate ? "active" : dependenciesSatisfied ? record.status : "locked";
  return { ...record, resolvedStatus, dependenciesSatisfied, blockedBy };
}

function findBlockingDependencies(
  objective: RuntimeNavMissionObjectiveRecord,
  records: Map<string, RuntimeNavMissionObjectiveRecord>,
  missionState: RuntimeNavMissionState | undefined,
  visited: Set<string>,
): string[] {
  if (visited.has(objective.id)) return [`cycle:${objective.id}`];
  const nextVisited = new Set(visited);
  nextVisited.add(objective.id);
  const blockedBy: string[] = [];
  for (const dependencyId of objective.dependsOn) {
    const dependency = records.get(dependencyId);
    if (!dependency) {
      blockedBy.push(`objective:${dependencyId}`);
      continue;
    }
    const resolved = resolveObjective(dependency, records, missionState, nextVisited);
    if (resolved.resolvedStatus !== "completed") blockedBy.push(`objective:${dependencyId}`);
  }
  for (const missionId of objective.requiredMissions) {
    const mission = missionState?.getMission(missionId);
    if (mission?.status !== "completed") blockedBy.push(`mission:${missionId}`);
  }
  for (const condition of objective.conditions) {
    if (condition.kind === "objective") {
      const dependency = records.get(condition.id);
      const status = condition.status ?? "completed";
      if (!dependency || resolveObjective(dependency, records, missionState, nextVisited).resolvedStatus !== status) {
        blockedBy.push(`objective:${condition.id}:${status}`);
      }
      continue;
    }
    const missionStatus = condition.status ?? "completed";
    const mission = missionState?.getMission(condition.id);
    if (mission?.status !== missionStatus) blockedBy.push(`mission:${condition.id}:${missionStatus}`);
  }
  return blockedBy;
}

function normalizeObjectiveId(id: string): string {
  return normalizeId(id, "Runtime nav mission objective requires a non-empty id.");
}

function normalizeMissionId(id: string): string {
  return normalizeId(id, "Runtime nav mission dependency requires a non-empty mission id.");
}

function normalizeId(id: string, message: string): string {
  const value = id.trim();
  if (!value) throw new Error(message);
  return value;
}

function normalizeNullableId(id: string | null): string | null {
  return id === null ? null : normalizeMissionId(id);
}

function normalizeNullableText(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const text = value.trim();
  return text ? text : null;
}

function normalizeIdList(ids: string[]): string[] {
  return Array.from(new Set(ids.map((id) => normalizeId(id, "Runtime nav mission dependency id cannot be empty."))));
}

function normalizeConditions(conditions: RuntimeNavMissionObjectiveDependency[]): RuntimeNavMissionObjectiveDependency[] {
  return conditions.map((condition) => {
    if (condition.kind === "objective") {
      return {
        kind: "objective",
        id: normalizeObjectiveId(condition.id),
        status: condition.status ?? "completed",
      };
    }
    return {
      kind: "mission",
      id: normalizeMissionId(condition.id),
      status: condition.status ?? "completed",
    };
  });
}

function cloneRecord(objective: RuntimeNavMissionObjectiveRecord): RuntimeNavMissionObjectiveRecord {
  return {
    ...objective,
    dependsOn: [...objective.dependsOn],
    requiredMissions: [...objective.requiredMissions],
    conditions: cloneConditions(objective.conditions),
    data: cloneData(objective.data),
  };
}

function cloneConditions(conditions: RuntimeNavMissionObjectiveDependency[]): RuntimeNavMissionObjectiveDependency[] {
  return conditions.map((condition) => ({ ...condition }));
}

function cloneData(data: RuntimeNavMissionData): RuntimeNavMissionData {
  return { ...data };
}

function parseGraphDefinition(input: RuntimeNavMissionGraphDefinition | string): RuntimeNavMissionGraphDefinition {
  const value = typeof input === "string" ? parseJson(input) : input;
  if (!isObject(value)) throw new Error("Runtime nav mission graph definition must be an object.");
  if (value.schemaVersion !== RUNTIME_NAV_MISSION_GRAPH_SCHEMA_VERSION) {
    throw new Error(`Unsupported runtime nav mission graph version: ${String(value.schemaVersion)}`);
  }
  const objectivesValue = value.objectives;
  if (!Array.isArray(objectivesValue)) throw new Error("Runtime nav mission graph definition requires an objectives array.");
  return {
    schemaVersion: RUNTIME_NAV_MISSION_GRAPH_SCHEMA_VERSION,
    savedAt: readTimestamp(value.savedAt),
    objectives: objectivesValue.map(readObjectiveRecord),
  };
}

function parseJson(input: string): unknown {
  try {
    return JSON.parse(input) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid runtime nav mission graph JSON: ${message}`);
  }
}

function readObjectiveRecord(value: unknown): RuntimeNavMissionObjectiveRecord {
  if (!isObject(value)) throw new Error("Runtime nav mission objective record must be an object.");
  const id = typeof value.id === "string" ? normalizeObjectiveId(value.id) : "";
  if (!id) throw new Error("Runtime nav mission objective record requires an id.");
  const status = readObjectiveStatus(value.status);
  return {
    id,
    missionId: typeof value.missionId === "string" ? normalizeMissionId(value.missionId) : null,
    title: typeof value.title === "string" ? normalizeNullableText(value.title) : null,
    description: typeof value.description === "string" ? normalizeNullableText(value.description) : null,
    status,
    autoActivate: typeof value.autoActivate === "boolean" ? value.autoActivate : true,
    dependsOn: Array.isArray(value.dependsOn) ? normalizeIdList(value.dependsOn.filter((item): item is string => typeof item === "string")) : [],
    requiredMissions: Array.isArray(value.requiredMissions)
      ? normalizeIdList(value.requiredMissions.filter((item): item is string => typeof item === "string"))
      : [],
    conditions: Array.isArray(value.conditions) ? readConditions(value.conditions) : [],
    data: readData(value.data),
    updatedAt: readTimestamp(value.updatedAt),
    completedAt: status === "completed" ? readNullableTimestamp(value.completedAt) : null,
    failedAt: status === "failed" ? readNullableTimestamp(value.failedAt) : null,
  };
}

function readConditions(values: unknown[]): RuntimeNavMissionObjectiveDependency[] {
  const conditions: RuntimeNavMissionObjectiveDependency[] = [];
  for (const value of values) {
    if (!isObject(value) || typeof value.id !== "string") continue;
    if (value.kind === "objective") {
      conditions.push({ kind: "objective", id: normalizeObjectiveId(value.id), status: readObjectiveStatus(value.status) });
    }
    if (value.kind === "mission") {
      conditions.push({ kind: "mission", id: normalizeMissionId(value.id), status: readMissionStatus(value.status) });
    }
  }
  return conditions;
}

function readObjectiveStatus(value: unknown): RuntimeNavMissionObjectiveStatus {
  return value === "locked" || value === "active" || value === "completed" || value === "failed" ? value : "locked";
}

function readMissionStatus(value: unknown): RuntimeNavMissionStatus {
  return value === "inactive" || value === "active" || value === "completed" || value === "failed" ? value : "completed";
}

function readData(value: unknown): RuntimeNavMissionData {
  if (!isObject(value)) return {};
  const data: RuntimeNavMissionData = {};
  for (const [key, item] of Object.entries(value)) {
    if (isMissionDataValue(item)) data[key] = item;
  }
  return data;
}

function isMissionDataValue(value: unknown): value is RuntimeNavMissionDataValue {
  return value === null || typeof value === "string" || (typeof value === "number" && Number.isFinite(value)) || typeof value === "boolean";
}

function readTimestamp(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : Date.now();
}

function readNullableTimestamp(value: unknown): number | null {
  return value === null || value === undefined ? null : readTimestamp(value);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
