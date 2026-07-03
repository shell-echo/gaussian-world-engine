import type { GameplayEvent } from "../gameplay/GameplaySystem.js";
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

export interface RuntimeNavMissionRunnerGameplayEvent extends GameplayEvent {
  source: "gameplay";
  type: "gameplay";
}

export type RuntimeNavMissionRunnerEvent = RuntimeNavAgentRegistryEvent | RuntimeNavMissionRunnerGameplayEvent;
export type RuntimeNavMissionRunnerEventSource = "agent" | "gameplay" | "any";
export type RuntimeNavMissionRunnerEventType = RuntimeNavAgentRegistryEvent["type"] | GameplayEvent["kind"] | "gameplay" | "any";
export type RuntimeNavMissionRunnerMissionActionStatus = Extract<RuntimeNavMissionStatus, "inactive" | "active" | "completed" | "failed">;
export type RuntimeNavMissionRunnerObjectiveActionStatus = RuntimeNavMissionObjectiveStatus;

export interface RuntimeNavMissionRunnerEventFilter {
  source?: RuntimeNavMissionRunnerEventSource;
  type?: RuntimeNavMissionRunnerEventType;
  agentId?: string;
  status?: RuntimeNavAgentRegistryEvent["status"];
  previousStatus?: RuntimeNavAgentRegistryEvent["previousStatus"];
  sourceId?: string;
  kind?: GameplayEvent["kind"];
  event?: string;
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
  handledAgentEvents: number;
  handledGameplayEvents: number;
  firedRules: number;
  autoActivatedObjectives: number;
  rules: RuntimeNavMissionRunnerRuleSnapshot[];
}

export interface RuntimeNavMissionRunnerResult {
  event: RuntimeNavMissionRunnerEvent | null;
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
  private handledAgentEventsValue = 0;
  private handledGameplayEventsValue = 0;
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
    return this.handleEvent(event);
  }

  handleGameplayEvent(event: GameplayEvent): RuntimeNavMissionRunnerResult {
    return this.handleEvent(toGameplayRunnerEvent(event));
  }

  handleEvent(event: RuntimeNavMissionRunnerEvent): RuntimeNavMissionRunnerResult {
    this.handledEventsValue += 1;
    if (isGameplayEvent(event)) {
      this.handledGameplayEventsValue += 1;
    } else {
      this.handledAgentEventsValue += 1;
    }
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
      handledAgentEvents: this.handledAgentEventsValue,
      handledGameplayEvents: this.handledGameplayEventsValue,
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
    source: filter?.source ?? "any",
    type: filter?.type ?? "any",
    agentId: filter?.agentId ? normalizeId(filter.agentId, "Runtime nav mission runner event agentId cannot be empty.") : undefined,
    status: filter?.status,
    previousStatus: filter?.previousStatus,
    sourceId: filter?.sourceId ? normalizeId(filter.sourceId, "Runtime nav mission runner event sourceId cannot be empty.") : undefined,
    kind: filter?.kind,
    event: filter?.event ? normalizeId(filter.event, "Runtime nav mission runner gameplay event name cannot be empty.") : undefined,
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

function matchesRule(rule: RuntimeNavMissionRunnerRule, event: RuntimeNavMissionRunnerEvent): boolean {
  const filter = rule.event ?? { source: "any", type: "any" };
  if (filter.source && filter.source !== "any") {
    if (filter.source === "gameplay" && !isGameplayEvent(event)) return false;
    if (filter.source === "agent" && isGameplayEvent(event)) return false;
  }
  const type = filter.type ?? "any";
  if (type !== "any" && !matchesType(type, event)) return false;
  if (filter.agentId) {
    if (isGameplayEvent(event) || filter.agentId !== event.agentId) return false;
  }
  if (filter.status) {
    if (isGameplayEvent(event) || filter.status !== event.status) return false;
  }
  if (filter.previousStatus) {
    if (isGameplayEvent(event) || filter.previousStatus !== event.previousStatus) return false;
  }
  if (filter.sourceId) {
    if (!isGameplayEvent(event) || filter.sourceId !== event.sourceId) return false;
  }
  if (filter.kind) {
    if (!isGameplayEvent(event) || filter.kind !== event.kind) return false;
  }
  if (filter.event) {
    if (!isGameplayEvent(event) || filter.event !== event.event) return false;
  }
  return true;
}

function matchesType(type: RuntimeNavMissionRunnerEventType, event: RuntimeNavMissionRunnerEvent): boolean {
  if (isGameplayEvent(event)) return type === "gameplay" || type === event.kind;
  return type === event.type;
}

function snapshotRule(rule: RuntimeNavMissionRunnerRule): RuntimeNavMissionRunnerRuleSnapshot {
  return {
    id: rule.id,
    event: { ...(rule.event ?? { source: "any", type: "any" }) },
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

function createResult(event: RuntimeNavMissionRunnerEvent | null): RuntimeNavMissionRunnerResult {
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

function toGameplayRunnerEvent(event: GameplayEvent): RuntimeNavMissionRunnerGameplayEvent {
  return {
    ...event,
    source: "gameplay",
    type: "gameplay",
  };
}

function isGameplayEvent(event: RuntimeNavMissionRunnerEvent): event is RuntimeNavMissionRunnerGameplayEvent {
  return "source" in event && event.source === "gameplay";
}

function normalizeId(id: string, message: string): string {
  const value = id.trim();
  if (!value) throw new Error(message);
  return value;
}

function cloneData(data: RuntimeNavMissionData): RuntimeNavMissionData {
  return { ...data };
}
