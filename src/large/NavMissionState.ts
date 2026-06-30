export const RUNTIME_NAV_MISSION_STATE_SCHEMA_VERSION = 1;

export type RuntimeNavMissionStatus = "inactive" | "active" | "completed" | "failed";
export type RuntimeNavMissionDataValue = string | number | boolean | null;
export type RuntimeNavMissionData = Record<string, RuntimeNavMissionDataValue>;

export interface RuntimeNavMissionDraft {
  id: string;
  status?: RuntimeNavMissionStatus;
  progress?: number;
  data?: RuntimeNavMissionData;
}

export interface RuntimeNavMissionPatch {
  status?: RuntimeNavMissionStatus;
  progress?: number;
  data?: RuntimeNavMissionData;
}

export interface RuntimeNavMissionRecord {
  id: string;
  status: RuntimeNavMissionStatus;
  progress: number;
  data: RuntimeNavMissionData;
  updatedAt: number;
  completedAt: number | null;
  failedAt: number | null;
}

export interface RuntimeNavMissionStateSnapshot {
  schemaVersion: typeof RUNTIME_NAV_MISSION_STATE_SCHEMA_VERSION;
  count: number;
  inactive: number;
  active: number;
  completed: number;
  failed: number;
  missions: RuntimeNavMissionRecord[];
}

export interface RuntimeNavMissionSaveData {
  schemaVersion: typeof RUNTIME_NAV_MISSION_STATE_SCHEMA_VERSION;
  savedAt: number;
  missions: RuntimeNavMissionRecord[];
}

export interface RuntimeNavMissionRestoreOptions {
  merge?: boolean;
}

export class RuntimeNavMissionState {
  private readonly missions = new Map<string, RuntimeNavMissionRecord>();

  createMission(draft: RuntimeNavMissionDraft): RuntimeNavMissionRecord {
    const id = normalizeMissionId(draft.id);
    if (this.missions.has(id)) throw new Error(`Runtime nav mission already exists: ${id}`);
    const mission = createRecord({ ...draft, id }, Date.now());
    this.missions.set(id, mission);
    return cloneMission(mission);
  }

  upsertMission(draft: RuntimeNavMissionDraft): RuntimeNavMissionRecord {
    const id = normalizeMissionId(draft.id);
    const current = this.missions.get(id);
    if (!current) return this.createMission({ ...draft, id });
    return this.updateMission(id, {
      status: draft.status,
      progress: draft.progress,
      data: draft.data,
    });
  }

  getMission(id: string): RuntimeNavMissionRecord | null {
    const mission = this.missions.get(normalizeMissionId(id));
    return mission ? cloneMission(mission) : null;
  }

  updateMission(id: string, patch: RuntimeNavMissionPatch): RuntimeNavMissionRecord {
    const mission = this.requireMission(id);
    const now = Date.now();
    const status = patch.status ?? mission.status;
    const next: RuntimeNavMissionRecord = {
      ...mission,
      status,
      progress: patch.progress === undefined ? mission.progress : normalizeProgress(patch.progress),
      data: patch.data === undefined ? cloneData(mission.data) : cloneData(patch.data),
      updatedAt: now,
      completedAt: status === "completed" ? mission.completedAt ?? now : null,
      failedAt: status === "failed" ? mission.failedAt ?? now : null,
    };
    this.missions.set(mission.id, next);
    return cloneMission(next);
  }

  activateMission(id: string, data?: RuntimeNavMissionData): RuntimeNavMissionRecord {
    return this.updateMission(id, {
      status: "active",
      data: data ?? this.requireMission(id).data,
    });
  }

  completeMission(id: string, data?: RuntimeNavMissionData): RuntimeNavMissionRecord {
    return this.updateMission(id, {
      status: "completed",
      progress: 1,
      data: data ?? this.requireMission(id).data,
    });
  }

  failMission(id: string, data?: RuntimeNavMissionData): RuntimeNavMissionRecord {
    return this.updateMission(id, {
      status: "failed",
      data: data ?? this.requireMission(id).data,
    });
  }

  resetMission(id: string): RuntimeNavMissionRecord {
    const mission = this.requireMission(id);
    const next: RuntimeNavMissionRecord = {
      ...mission,
      status: "inactive",
      progress: 0,
      updatedAt: Date.now(),
      completedAt: null,
      failedAt: null,
    };
    this.missions.set(mission.id, next);
    return cloneMission(next);
  }

  setMissionData(id: string, key: string, value: RuntimeNavMissionDataValue): RuntimeNavMissionRecord {
    const mission = this.requireMission(id);
    return this.updateMission(id, {
      data: {
        ...mission.data,
        [key]: value,
      },
    });
  }

  removeMission(id: string): boolean {
    return this.missions.delete(normalizeMissionId(id));
  }

  clearMissions(): void {
    this.missions.clear();
  }

  snapshot(): RuntimeNavMissionStateSnapshot {
    const missions = Array.from(this.missions.values(), cloneMission);
    return {
      schemaVersion: RUNTIME_NAV_MISSION_STATE_SCHEMA_VERSION,
      count: missions.length,
      inactive: missions.filter((mission) => mission.status === "inactive").length,
      active: missions.filter((mission) => mission.status === "active").length,
      completed: missions.filter((mission) => mission.status === "completed").length,
      failed: missions.filter((mission) => mission.status === "failed").length,
      missions,
    };
  }

  exportState(): RuntimeNavMissionSaveData {
    return {
      schemaVersion: RUNTIME_NAV_MISSION_STATE_SCHEMA_VERSION,
      savedAt: Date.now(),
      missions: Array.from(this.missions.values(), cloneMission),
    };
  }

  restoreState(input: RuntimeNavMissionSaveData | string, options: RuntimeNavMissionRestoreOptions = {}): RuntimeNavMissionStateSnapshot {
    const saveData = parseSaveData(input);
    if (!options.merge) this.missions.clear();
    for (const mission of saveData.missions) this.missions.set(mission.id, cloneMission(mission));
    return this.snapshot();
  }

  private requireMission(id: string): RuntimeNavMissionRecord {
    const normalizedId = normalizeMissionId(id);
    const mission = this.missions.get(normalizedId);
    if (!mission) throw new Error(`Runtime nav mission not found: ${normalizedId}`);
    return mission;
  }
}

function createRecord(draft: RuntimeNavMissionDraft, timestamp: number): RuntimeNavMissionRecord {
  const status = draft.status ?? "inactive";
  return {
    id: normalizeMissionId(draft.id),
    status,
    progress: normalizeProgress(draft.progress ?? 0),
    data: cloneData(draft.data ?? {}),
    updatedAt: timestamp,
    completedAt: status === "completed" ? timestamp : null,
    failedAt: status === "failed" ? timestamp : null,
  };
}

function normalizeMissionId(id: string): string {
  const value = id.trim();
  if (!value) throw new Error("Runtime nav mission requires a non-empty id.");
  return value;
}

function normalizeProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function cloneMission(mission: RuntimeNavMissionRecord): RuntimeNavMissionRecord {
  return {
    ...mission,
    data: cloneData(mission.data),
  };
}

function cloneData(data: RuntimeNavMissionData): RuntimeNavMissionData {
  return { ...data };
}

function parseSaveData(input: RuntimeNavMissionSaveData | string): RuntimeNavMissionSaveData {
  const value = typeof input === "string" ? parseJson(input) : input;
  if (!isObject(value)) throw new Error("Runtime nav mission save data must be an object.");
  if (value.schemaVersion !== RUNTIME_NAV_MISSION_STATE_SCHEMA_VERSION) {
    throw new Error(`Unsupported runtime nav mission save version: ${String(value.schemaVersion)}`);
  }
  const missionsValue = value.missions;
  if (!Array.isArray(missionsValue)) throw new Error("Runtime nav mission save data requires a missions array.");
  return {
    schemaVersion: RUNTIME_NAV_MISSION_STATE_SCHEMA_VERSION,
    savedAt: readTimestamp(value.savedAt),
    missions: missionsValue.map(readMissionRecord),
  };
}

function parseJson(input: string): unknown {
  try {
    return JSON.parse(input) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid runtime nav mission save JSON: ${message}`);
  }
}

function readMissionRecord(value: unknown): RuntimeNavMissionRecord {
  if (!isObject(value)) throw new Error("Runtime nav mission record must be an object.");
  const id = typeof value.id === "string" ? normalizeMissionId(value.id) : "";
  if (!id) throw new Error("Runtime nav mission record requires an id.");
  const status = readStatus(value.status);
  return {
    id,
    status,
    progress: typeof value.progress === "number" ? normalizeProgress(value.progress) : 0,
    data: readData(value.data),
    updatedAt: readTimestamp(value.updatedAt),
    completedAt: status === "completed" ? readNullableTimestamp(value.completedAt) : null,
    failedAt: status === "failed" ? readNullableTimestamp(value.failedAt) : null,
  };
}

function readStatus(value: unknown): RuntimeNavMissionStatus {
  return value === "inactive" || value === "active" || value === "completed" || value === "failed" ? value : "inactive";
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
