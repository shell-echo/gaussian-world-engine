import type { RuntimeNavMissionDiagnosticsSeverityPolicy } from "./NavMissionPackageLoader.js";

export type RuntimeNavMissionDiagnosticsPolicyPresetId =
  | "default"
  | "quiet"
  | "strict"
  | "gameplay-strict"
  | "authoring-strict";

export interface RuntimeNavMissionDiagnosticsPolicyPreset {
  id: RuntimeNavMissionDiagnosticsPolicyPresetId;
  label: string;
  description: string;
  policy: RuntimeNavMissionDiagnosticsSeverityPolicy | null;
}

export const RUNTIME_NAV_MISSION_DIAGNOSTICS_POLICY_PRESETS: readonly RuntimeNavMissionDiagnosticsPolicyPreset[] = [
  {
    id: "default",
    label: "Default",
    description: "Use built-in diagnostic severities and include info summaries.",
    policy: null,
  },
  {
    id: "quiet",
    label: "Quiet",
    description: "Hide info diagnostics while keeping warnings and errors unchanged.",
    policy: {
      hideInfo: true,
    },
  },
  {
    id: "strict",
    label: "Strict",
    description: "Treat all warnings as errors so invalid packages are not applied.",
    policy: {
      warningAsError: true,
    },
  },
  {
    id: "gameplay-strict",
    label: "Gameplay Strict",
    description: "Promote gameplay source validation warnings to errors.",
    policy: {
      codes: {
        "gameplay_source.missing_trigger": "error",
        "gameplay_source.missing_interaction": "error",
        "gameplay_source.missing_source_id": "error",
        "gameplay_source.trigger_event_mismatch": "error",
        "gameplay_source.interaction_event_mismatch": "error",
      },
    },
  },
  {
    id: "authoring-strict",
    label: "Authoring Strict",
    description: "Promote package authoring reference warnings to errors while hiding info diagnostics.",
    policy: {
      codes: {
        "objective.missing_mission": "error",
        "objective.missing_dependency": "error",
        "objective.missing_required_mission": "error",
        "objective.condition_missing_mission": "error",
        "objective.condition_missing_objective": "error",
        "runner_rule.broad_event": "error",
      },
      hideInfo: true,
    },
  },
];

export const RUNTIME_NAV_MISSION_DIAGNOSTICS_POLICY_PRESET_IDS = RUNTIME_NAV_MISSION_DIAGNOSTICS_POLICY_PRESETS.map(
  (preset) => preset.id,
);

const RUNTIME_NAV_MISSION_DIAGNOSTICS_POLICY_PRESET_BY_ID = new Map(
  RUNTIME_NAV_MISSION_DIAGNOSTICS_POLICY_PRESETS.map((preset) => [preset.id, preset]),
);

export function isRuntimeNavMissionDiagnosticsPolicyPresetId(
  value: string,
): value is RuntimeNavMissionDiagnosticsPolicyPresetId {
  return RUNTIME_NAV_MISSION_DIAGNOSTICS_POLICY_PRESET_BY_ID.has(value as RuntimeNavMissionDiagnosticsPolicyPresetId);
}

export function getRuntimeNavMissionDiagnosticsPolicyPreset(
  id: string,
): RuntimeNavMissionDiagnosticsPolicyPreset | null {
  return RUNTIME_NAV_MISSION_DIAGNOSTICS_POLICY_PRESET_BY_ID.get(id as RuntimeNavMissionDiagnosticsPolicyPresetId) ?? null;
}

export function createRuntimeNavMissionDiagnosticsPolicyFromPreset(
  id: string | null | undefined,
): RuntimeNavMissionDiagnosticsSeverityPolicy | null {
  if (!id) return null;
  const preset = getRuntimeNavMissionDiagnosticsPolicyPreset(id);
  return cloneRuntimeNavMissionDiagnosticsSeverityPolicy(preset?.policy ?? null);
}

export function cloneRuntimeNavMissionDiagnosticsSeverityPolicy(
  policy: RuntimeNavMissionDiagnosticsSeverityPolicy | null | undefined,
): RuntimeNavMissionDiagnosticsSeverityPolicy | null {
  if (!policy) return null;
  const clone: RuntimeNavMissionDiagnosticsSeverityPolicy = {};
  if (policy.codes) clone.codes = { ...policy.codes };
  if (policy.warningAsError !== undefined) clone.warningAsError = policy.warningAsError;
  if (policy.hideInfo !== undefined) clone.hideInfo = policy.hideInfo;
  return clone.codes || clone.warningAsError !== undefined || clone.hideInfo !== undefined ? clone : null;
}
