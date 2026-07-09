export type RuntimeNavMissionDiagnosticCodeCategory =
  | "package"
  | "mission"
  | "objective"
  | "runner_rule"
  | "gameplay_source";

export type RuntimeNavMissionKnownDiagnosticSeverity = "info" | "warning" | "error";

export interface RuntimeNavMissionKnownDiagnosticCodeEntry {
  code: RuntimeNavMissionKnownDiagnosticCode;
  category: RuntimeNavMissionDiagnosticCodeCategory;
  defaultSeverity: RuntimeNavMissionKnownDiagnosticSeverity;
  description: string;
}

export const RUNTIME_NAV_MISSION_KNOWN_DIAGNOSTIC_CODE_ENTRIES = [
  {
    code: "package.empty",
    category: "package",
    defaultSeverity: "warning",
    description: "Mission package does not contain missions, objectives or runner rules.",
  },
  {
    code: "package.summary",
    category: "package",
    defaultSeverity: "info",
    description: "Mission package summary counts.",
  },
  {
    code: "package.load_failed",
    category: "package",
    defaultSeverity: "error",
    description: "Mission package could not be fetched or parsed.",
  },
  {
    code: "mission.duplicate_id",
    category: "mission",
    defaultSeverity: "error",
    description: "Mission package contains duplicate mission ids.",
  },
  {
    code: "objective.duplicate_id",
    category: "objective",
    defaultSeverity: "error",
    description: "Mission package contains duplicate objective ids.",
  },
  {
    code: "objective.missing_mission",
    category: "objective",
    defaultSeverity: "warning",
    description: "Objective references a mission id that does not exist in the package.",
  },
  {
    code: "objective.missing_dependency",
    category: "objective",
    defaultSeverity: "warning",
    description: "Objective depends on another objective id that does not exist in the package.",
  },
  {
    code: "objective.missing_required_mission",
    category: "objective",
    defaultSeverity: "warning",
    description: "Objective requires a mission id that does not exist in the package.",
  },
  {
    code: "objective.condition_missing_mission",
    category: "objective",
    defaultSeverity: "warning",
    description: "Objective condition references a mission id that does not exist in the package.",
  },
  {
    code: "objective.condition_missing_objective",
    category: "objective",
    defaultSeverity: "warning",
    description: "Objective condition references an objective id that does not exist in the package.",
  },
  {
    code: "runner_rule.duplicate_id",
    category: "runner_rule",
    defaultSeverity: "error",
    description: "Mission package contains duplicate runner rule ids.",
  },
  {
    code: "runner_rule.broad_event",
    category: "runner_rule",
    defaultSeverity: "warning",
    description: "Runner rule has a broad event filter.",
  },
  {
    code: "runner_rule.disabled",
    category: "runner_rule",
    defaultSeverity: "info",
    description: "Runner rule is disabled.",
  },
  {
    code: "runner_rule.missing_mission_action_target",
    category: "runner_rule",
    defaultSeverity: "error",
    description: "Runner rule action targets a mission id that does not exist in the package.",
  },
  {
    code: "runner_rule.missing_objective_action_target",
    category: "runner_rule",
    defaultSeverity: "error",
    description: "Runner rule action targets an objective id that does not exist in the package.",
  },
  {
    code: "gameplay_source.missing_trigger",
    category: "gameplay_source",
    defaultSeverity: "warning",
    description: "Runner rule references a trigger sourceId that does not exist in world gameplay sources.",
  },
  {
    code: "gameplay_source.missing_interaction",
    category: "gameplay_source",
    defaultSeverity: "warning",
    description: "Runner rule references an interaction sourceId that does not exist in world gameplay sources.",
  },
  {
    code: "gameplay_source.missing_source_id",
    category: "gameplay_source",
    defaultSeverity: "warning",
    description: "Runner rule references a gameplay sourceId that does not exist in world gameplay sources.",
  },
  {
    code: "gameplay_source.trigger_event_mismatch",
    category: "gameplay_source",
    defaultSeverity: "warning",
    description: "Runner rule trigger event name does not match the world trigger event.",
  },
  {
    code: "gameplay_source.interaction_event_mismatch",
    category: "gameplay_source",
    defaultSeverity: "warning",
    description: "Runner rule interaction event name does not match the world interaction event.",
  },
] as const;

export type RuntimeNavMissionKnownDiagnosticCode =
  (typeof RUNTIME_NAV_MISSION_KNOWN_DIAGNOSTIC_CODE_ENTRIES)[number]["code"];

export const RUNTIME_NAV_MISSION_KNOWN_DIAGNOSTIC_CODES = RUNTIME_NAV_MISSION_KNOWN_DIAGNOSTIC_CODE_ENTRIES.map(
  (entry) => entry.code,
);

const KNOWN_DIAGNOSTIC_CODE_SET = new Set<string>(RUNTIME_NAV_MISSION_KNOWN_DIAGNOSTIC_CODES);

export function isRuntimeNavMissionKnownDiagnosticCode(code: string): code is RuntimeNavMissionKnownDiagnosticCode {
  return KNOWN_DIAGNOSTIC_CODE_SET.has(code);
}

export function getRuntimeNavMissionKnownDiagnosticCodeEntry(
  code: string,
): RuntimeNavMissionKnownDiagnosticCodeEntry | null {
  return RUNTIME_NAV_MISSION_KNOWN_DIAGNOSTIC_CODE_ENTRIES.find((entry) => entry.code === code) ?? null;
}
