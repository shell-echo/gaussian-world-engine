import type {
  RuntimeNavMissionDiagnosticsSeverityPolicy,
  RuntimeNavMissionPackageDiagnosticSeverity,
} from "./NavMissionPackageLoader.js";

export const RUNTIME_NAV_MISSION_DIAGNOSTIC_SEVERITIES = ["info", "warning", "error"] as const;

export interface RuntimeNavMissionDiagnosticsSeverityPolicySchema {
  codes?: Partial<Record<string, RuntimeNavMissionPackageDiagnosticSeverity>>;
  warningAsError?: boolean;
  hideInfo?: boolean;
}

export function parseRuntimeNavMissionDiagnosticsSeverityPolicy(
  input: unknown,
): RuntimeNavMissionDiagnosticsSeverityPolicy | null {
  if (input === null || input === undefined) return null;
  if (!isObject(input)) throw new Error("Mission diagnostics severity policy must be an object.");
  const policy: RuntimeNavMissionDiagnosticsSeverityPolicy = {};
  if (input.codes !== undefined) {
    if (!isObject(input.codes)) throw new Error("Mission diagnostics severity policy codes must be an object.");
    const codes: Partial<Record<string, RuntimeNavMissionPackageDiagnosticSeverity>> = {};
    for (const [code, severity] of Object.entries(input.codes)) {
      const normalizedCode = code.trim();
      if (!normalizedCode) throw new Error("Mission diagnostics severity policy code must not be empty.");
      if (!isRuntimeNavMissionPackageDiagnosticSeverity(severity)) {
        throw new Error(`Mission diagnostics severity policy code ${normalizedCode} has invalid severity.`);
      }
      codes[normalizedCode] = severity;
    }
    if (Object.keys(codes).length > 0) policy.codes = codes;
  }
  if (input.warningAsError !== undefined) {
    if (typeof input.warningAsError !== "boolean") throw new Error("Mission diagnostics severity policy warningAsError must be boolean.");
    policy.warningAsError = input.warningAsError;
  }
  if (input.hideInfo !== undefined) {
    if (typeof input.hideInfo !== "boolean") throw new Error("Mission diagnostics severity policy hideInfo must be boolean.");
    policy.hideInfo = input.hideInfo;
  }
  return policy.codes || policy.warningAsError !== undefined || policy.hideInfo !== undefined ? policy : null;
}

export function assertRuntimeNavMissionDiagnosticsSeverityPolicy(
  input: unknown,
): asserts input is RuntimeNavMissionDiagnosticsSeverityPolicySchema {
  parseRuntimeNavMissionDiagnosticsSeverityPolicy(input);
}

export function parseRuntimeNavMissionDiagnosticSeverityOverride(
  input: string,
): [string, RuntimeNavMissionPackageDiagnosticSeverity] | null {
  const [code, severity] = input.split(":");
  const normalizedCode = code?.trim();
  if (!normalizedCode || !isRuntimeNavMissionPackageDiagnosticSeverity(severity)) return null;
  return [normalizedCode, severity];
}

export function isRuntimeNavMissionPackageDiagnosticSeverity(
  value: unknown,
): value is RuntimeNavMissionPackageDiagnosticSeverity {
  return value === "info" || value === "warning" || value === "error";
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
