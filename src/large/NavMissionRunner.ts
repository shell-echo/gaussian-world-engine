import type { RuntimeNavAgentRegistryEvent } from "./NavAgentRegistry.js";
import type {
  RuntimeNavMissionGraph,
  RuntimeNavMissionObjectiveRecord,
  RuntimeNavMissionObjectiveStatus,
} from "./NavMissionGraph.js";
import type {
  RuntimeNavMissionData,
  RuntimeNavMissionRecord,
  RuntimeNavMissionState,
  RuntimeNavMissionStatus,
} from "./NavMissionState.js";

export type RuntimeNavMissionRunnerEventType = RuntimeNavAgentRegistryEvent["type"] | "any";
export type RuntimeNavMissionRunnerMissionActionStatus = Extract<RuntimeNavMissionStatus, "inactive" | "active" | "completed" | "failed">;
export type RuntimeNavMissionRunnerObjectiveActionStatus = RuntimeNavMissionObjectiveStatus;

export interface RuntimeNavMissionRunnerEventFilter {
  type?: RuntimeNavMissionRunnerEventType;
  agentId?: string;
  status?: RuntimeNavAgentRegistryEvent["status"];
  previousStatus?: RuntimeNavAgentRegistryEvent["previousStatus"];
}

export type RuntimeNavMissionRunnerAction =
  | {
      kind: "mission";
      id: string;
      status: RuntimeNavMissionRunnerMissionActionStatus;
      data?: RuntimeNavMissionData;
    }
  | {
      kind: "objective";
      id: string;
      status: RuntimeNavMissionRunnerObjectiveActionStatus;
      data?: RuntimeNavMissionData;
    };

export interface RuntimeNavMissionRunnerRule {
  id: string;
  event?: RuntimeNavMissionRunnerEventFilter;
  action: RuntimeNavMissionRunnerAction;
  once?: boolean;
  enabled?: boolean;
}

export interface RuntimeNavMissionRunnerRuleSnapshot {
  id: string;
  event: RuntimeNavMissionRunnerEventFilter;
  action: RuntimeNavMissionRunnerAction;
  once: boolean;
  enabled: boolean;
}

export interface RuntimeNavMissionRunnerSnapshot {
  ruleCount: number;
  enabledRules: number;
  handledEvents: number;
  firedRules: number;
  autoActivatedObjectives: number;
  rules: RuntimeNavMissionRunnerRuleSnapshot[];
}

export interface RuntimeNavMissionRunnerResult {
  event: RuntimeNavAgentRegistryEvent | null;
  firedRuleIds: string[];
  missionIds: string[];
  objectiveIds: string[];
  readyObjectiveIds: string[];
  autoActivatedObjectiveIds: string[];
  errors: string[];
}

export interface RuntimeNavMissionRunnerOptions {
  missionState: RuntimeNavMissionState;
  missionGraph: RuntimeNavMissionGraph;
}

export class RuntimeNavMissionRunner {
  private readonly rules = new Map<string, RuntimeNavMissionRunnerRule>();
  private handledEventsValue = 0;
  private firedRulesValue = 0;
  private autoActivatedObjectivesValue = 0;

  constructor(private readonly options: RuntimeNavMissionRunnerOptions) {}

  addRule(rule: RuntimeNavMissionRunnerRule): () => boolean {
    const id = normalizeId(rule.id, "Runtime nav mission runner rule requires a non-empty id.");
    if (this.rules.has(id)) throw new Error(`Runtime nav mission runner rule already exists: ${id}`);
    this.rules.set(id, normalizeRule({ ...rule, id }));
    return () => this.removeRule(id);
  }

  upsertRule(rule: RuntimeNavMissionRunnerRule): () => boolean {
    const id = normalizeId(rule.id, "Runtime nav mission runner rule requires a non-empty id.");
    this.rules.set(id, normalizeRule({ ...rule, id }));
    return () => this.removeRule(id);
  }

  removeRule(id: string): boolean {
    return this.rules.delete(normalizeId(id, "Runtime nav mission runner rule requires a non-empty id."));
  }

  clearRules(): void {
    this.rules.clear();
  }

  handleAgentEvent(event: RuntimeNavAgentRegistryEvent): RuntimeNavMissionRunnerResult {
    this.handledEventsValue += 1;
    const result = createResult(event);
    const matchingRules = Array.from(this.rules.values()).filter((rule) => rule.enabled !== false && matchesRule(rule, event));
    for (const rule of matchingRules) {
      if (rule.once) this.rules.delete(rule.id);
      const applied = this.applyRule(rule);
      mergeResult(result, applied);
    }
    this.firedRulesValue += result.firedRuleIds.length;
    const activated = this.activateReadyObjectives();
    mergeResult(result, activated);
    return result;
  }

  run(): RuntimeNavMissionRunnerResult {
    return this.activateReadyObjectives();
  }

  snapshot(): RuntimeNavMissionRunnerSnapshot {
    const rules = Array.from(this.rules.values(), snapshotRule);
    return {
      ruleCount: rules.length,
      enabledRules: rules.filter((rule) => rule.enabled).length,
      handledEvents: this.handledEventsValue,
      firedRules: this.firedRulesValue,
      autoActivatedObjectives: this.autoActivatedObjectivesValue,
      rules,
    };
  }

  private applyRule(rule: RuntimeNavMissionRunnerRule): RuntimeNavMissionRunnerResult {
    const result = createResult(null);
    result.firedRuleIds.push(rule.id);
    try {
      if (rule.action.kind === "mission") {
        const mission = applyMissionAction(this.options.missionState, rule.action);
        result.missionIds.push(mission.id);
        return result;
      }
      const objective = applyObjectiveAction(this.options.missionGraph, rule.action);
      result.objectiveIds.push(objective.id);
      return result;
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error));
      return result;
    }
  }

  private activateReadyObjectives(): RuntimeNavMissionRunnerResult {
    const result = createResult(null);
    const snapshot = this.options.missionGraph.snapshot(this.options.missionState);
    result.readyObjectiveIds.push(...snapshot.readyObjectiveIds);
    for (const objectiveId of snapshot.readyObjectiveIds) {
      try {
        const objective = this.options.missionGraph.activateObjective(objectiveId);
        result.objectiveIds.push(objective.id);
        result.autoActivatedObjectiveIds.push(objective.id);
      } catch (error) {
        result.errors.push(error instanceof Error ? error.message : String(error));
      }
    }
    this.autoActivatedObjectivesValue += result.autoActivatedObjectiveIds.length;
    return result;
  }
}

function applyMissionAction(
  missionState: RuntimeNavMissionState,
  action: Extract<RuntimeNavMissionRunnerAction, { kind: "mission" }>,
): RuntimeNavMissionRecord {
  if (action.status === "inactive") return missionState.resetMission(action.id);
  if (action.status === "active") return missionState.activateMission(action.id, action.data);
  if (action.status === "completed") return missionState.completeMission(action.id, action.data);
  return missionState.failMission(action.id, action.data);
}

function applyObjectiveAction(
  missionGraph: RuntimeNavMissionGraph,
  action: Extract<RuntimeNavMissionRunnerAction, { kind: "objective" }>,
): RuntimeNavMissionObjectiveRecord {
  if (action.status === "locked") return missionGraph.resetObjective(action.id);
  if (action.status === "active") return missionGraph.activateObjective(action.id, action.data);
  if (action.status === "completed") return missionGraph.completeObjective(action.id, action.data);
  return missionGraph.failObjective(action.id, action.data);
}

function normalizeRule(rule: RuntimeNavMissionRunnerRule): RuntimeNavMissionRunnerRule {
  return {
    id: normalizeId(rule.id, "Runtime nav mission runner rule requires a non-empty id."),
    event: normalizeEventFilter(rule.event),
    action: normalizeAction(rule.action),
    once: rule.once ?? false,
    enabled: rule.enabled ?? true,
  };
}

function normalizeEventFilter(filter: RuntimeNavMissionRunnerEventFilter | undefined): RuntimeNavMissionRunnerEventFilter {
  return {
    type: filter?.type ?? "any",
    agentId: filter?.agentId ? normalizeId(filter.agentId, "Runtime nav mission runner event agentId cannot be empty.") : undefined,
    status: filter?.status,
    previousStatus: filter?.previousStatus,
  };
}

function normalizeAction(action: RuntimeNavMissionRunnerAction): RuntimeNavMissionRunnerAction {
  if (action.kind === "mission") {
    return {
      kind: "mission",
      id: normalizeId(action.id, "Runtime nav mission runner action requires a non-empty mission id."),
      status: action.status,
      data: action.data ? cloneData(action.data) : undefined,
    };
  }
  return {
    kind: "objective",
    id: normalizeId(action.id, "Runtime nav mission runner action requires a non-empty objective id."),
    status: action.status,
    data: action.data ? cloneData(action.data) : undefined,
  };
}

function matchesRule(rule: RuntimeNavMissionRunnerRule, event: RuntimeNavAgentRegistryEvent): boolean {
  const filter = rule.event ?? { type: "any" };
  const type = filter.type ?? "any";
  if (type !== "any" && type !== event.type) return false;
  if (filter.agentId && filter.agentId !== event.agentId) return false;
  if (filter.status && filter.status !== event.status) return false;
  if (filter.previousStatus && filter.previousStatus !== event.previousStatus) return false;
  return true;
}

function snapshotRule(rule: RuntimeNavMissionRunnerRule): RuntimeNavMissionRunnerRuleSnapshot {
  return {
    id: rule.id,
    event: { ...(rule.event ?? { type: "any" }) },
    action: cloneAction(rule.action),
    once: rule.once ?? false,
    enabled: rule.enabled ?? true,
  };
}

function cloneAction(action: RuntimeNavMissionRunnerAction): RuntimeNavMissionRunnerAction {
  if (action.kind === "mission") {
    return {
      ...action,
      data: action.data ? cloneData(action.data) : undefined,
    };
  }
  return {
    ...action,
    data: action.data ? cloneData(action.data) : undefined,
  };
}

function createResult(event: RuntimeNavAgentRegistryEvent | null): RuntimeNavMissionRunnerResult {
  return {
    event,
    firedRuleIds: [],
    missionIds: [],
    objectiveIds: [],
    readyObjectiveIds: [],
    autoActivatedObjectiveIds: [],
    errors: [],
  };
}

function mergeResult(target: RuntimeNavMissionRunnerResult, source: RuntimeNavMissionRunnerResult): void {
  target.firedRuleIds.push(...source.firedRuleIds);
  target.missionIds.push(...source.missionIds);
  target.objectiveIds.push(...source.objectiveIds);
  target.readyObjectiveIds.push(...source.readyObjectiveIds);
  target.autoActivatedObjectiveIds.push(...source.autoActivatedObjectiveIds);
  target.errors.push(...source.errors);
}

function normalizeId(id: string, message: string): string {
  const value = id.trim();
  if (!value) throw new Error(message);
  return value;
}

function cloneData(data: RuntimeNavMissionData): RuntimeNavMissionData {
  return { ...data };
}
