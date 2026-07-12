import type { RuntimeNavMissionDiagnosticsManifestAuthoringInput } from "./NavMissionDiagnosticsManifestAuthoring.js";

export type RuntimeNavMissionDiagnosticsManifestAuthoringValidationSeverity = "warning" | "error";

export interface RuntimeNavMissionDiagnosticsManifestAuthoringValidationIssue {
  severity: RuntimeNavMissionDiagnosticsManifestAuthoringValidationSeverity;
  code: string;
  path: string;
  message: string;
}

export interface RuntimeNavMissionDiagnosticsManifestAuthoringValidationResult {
  valid: boolean;
  errors: number;
  warnings: number;
  issues: RuntimeNavMissionDiagnosticsManifestAuthoringValidationIssue[];
}

const DIAGNOSTIC_SEVERITIES = new Set(["info", "warning", "error"]);
const POLICY_FIELDS = new Set(["codes", "warningAsError", "hideInfo"]);

export function validateRuntimeNavMissionDiagnosticsManifestAuthoringInput(
  input: RuntimeNavMissionDiagnosticsManifestAuthoringInput,
): RuntimeNavMissionDiagnosticsManifestAuthoringValidationResult {
  const issues: RuntimeNavMissionDiagnosticsManifestAuthoringValidationIssue[] = [];
  const packageIndexValid = Number.isInteger(input.packageIndex) && input.packageIndex >= -1;
  if (!packageIndexValid) {
    addIssue(issues, "error", "target.invalid_index", "$.packageIndex", "packageIndex must be an integer greater than or equal to -1.");
  }

  const sourceManifest = parseSourceManifest(input.sourceManifestText, issues);
  if (sourceManifest && packageIndexValid) validateSourceTarget(sourceManifest, input.packageIndex, issues);
  validateSeverityPolicy(input.policy, "$.policy", issues);

  const errors = issues.filter((issue) => issue.severity === "error").length;
  const warnings = issues.length - errors;
  return {
    valid: errors === 0,
    errors,
    warnings,
    issues,
  };
}

export function assertRuntimeNavMissionDiagnosticsManifestAuthoringInput(
  input: RuntimeNavMissionDiagnosticsManifestAuthoringInput,
): RuntimeNavMissionDiagnosticsManifestAuthoringValidationResult {
  const validation = validateRuntimeNavMissionDiagnosticsManifestAuthoringInput(input);
  if (!validation.valid) throw new Error(formatRuntimeNavMissionDiagnosticsManifestAuthoringValidation(validation));
  return validation;
}

export function formatRuntimeNavMissionDiagnosticsManifestAuthoringValidation(
  validation: RuntimeNavMissionDiagnosticsManifestAuthoringValidationResult,
): string {
  if (validation.valid) {
    return validation.warnings === 0
      ? "Validation passed"
      : `Validation passed · ${validation.warnings} warning${validation.warnings === 1 ? "" : "s"}`;
  }
  const firstError = validation.issues.find((issue) => issue.severity === "error");
  const errorLabel = `${validation.errors} error${validation.errors === 1 ? "" : "s"}`;
  return firstError
    ? `Validation failed · ${errorLabel} · ${firstError.code}: ${firstError.message}`
    : `Validation failed · ${errorLabel}`;
}

function parseSourceManifest(
  sourceText: string,
  issues: RuntimeNavMissionDiagnosticsManifestAuthoringValidationIssue[],
): Record<string, unknown> | null {
  if (!sourceText.trim()) return { missionPackages: [{ url: "./mission-package.json", merge: true }] };
  let parsed: unknown;
  try {
    parsed = JSON.parse(sourceText);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    addIssue(issues, "error", "source_manifest.invalid_json", "$", `Source manifest is not valid JSON: ${message}`);
    return null;
  }
  if (!isRecord(parsed)) {
    addIssue(issues, "error", "source_manifest.root_not_object", "$", "Source manifest root must be a JSON object.");
    return null;
  }
  return parsed;
}

function validateSourceTarget(
  sourceManifest: Record<string, unknown>,
  packageIndex: number,
  issues: RuntimeNavMissionDiagnosticsManifestAuthoringValidationIssue[],
): void {
  if (packageIndex === -1) {
    if (hasOwn(sourceManifest, "severityPolicy")) {
      validateSeverityPolicy(sourceManifest["severityPolicy"], "$.severityPolicy", issues);
    }
    return;
  }

  if (!hasOwn(sourceManifest, "missionPackages")) {
    addIssue(
      issues,
      "warning",
      "mission_packages.missing",
      "$.missionPackages",
      "missionPackages is missing and will be created during authoring.",
    );
    return;
  }

  const missionPackages = sourceManifest["missionPackages"];
  if (!Array.isArray(missionPackages)) {
    addIssue(issues, "error", "mission_packages.not_array", "$.missionPackages", "missionPackages must be an array.");
    return;
  }

  if (packageIndex >= missionPackages.length || missionPackages[packageIndex] === undefined) {
    addIssue(
      issues,
      "warning",
      "mission_package.missing_target",
      `$.missionPackages[${packageIndex}]`,
      "Selected mission package entry is missing and will be created during authoring.",
    );
    return;
  }

  const target = missionPackages[packageIndex];
  if (target === null) {
    addIssue(
      issues,
      "warning",
      "mission_package.null_target",
      `$.missionPackages[${packageIndex}]`,
      "Selected mission package entry is null and will be replaced with an object.",
    );
    return;
  }
  if (!isRecord(target)) {
    addIssue(
      issues,
      "error",
      "mission_package.not_object",
      `$.missionPackages[${packageIndex}]`,
      "Selected mission package entry must be a JSON object.",
    );
    return;
  }

  validateMissionPackageMetadata(target, packageIndex, issues);
  if (hasOwn(target, "severityPolicy")) {
    validateSeverityPolicy(target["severityPolicy"], `$.missionPackages[${packageIndex}].severityPolicy`, issues);
  }
}

function validateMissionPackageMetadata(
  target: Record<string, unknown>,
  packageIndex: number,
  issues: RuntimeNavMissionDiagnosticsManifestAuthoringValidationIssue[],
): void {
  const path = `$.missionPackages[${packageIndex}]`;
  if (!hasOwn(target, "url")) {
    addIssue(issues, "warning", "mission_package.url_missing", `${path}.url`, "url is missing and will default to ./mission-package.json.");
  } else if (typeof target["url"] !== "string" || !target["url"].trim()) {
    addIssue(issues, "warning", "mission_package.url_invalid", `${path}.url`, "url must be a non-empty string and will be replaced with the default URL.");
  }

  if (!hasOwn(target, "merge")) {
    addIssue(issues, "warning", "mission_package.merge_missing", `${path}.merge`, "merge is missing and will default to true.");
  } else if (typeof target["merge"] !== "boolean") {
    addIssue(issues, "warning", "mission_package.merge_invalid", `${path}.merge`, "merge must be a boolean and will be replaced with true.");
  }
}

function validateSeverityPolicy(
  value: unknown,
  path: string,
  issues: RuntimeNavMissionDiagnosticsManifestAuthoringValidationIssue[],
): void {
  if (value === null) return;
  if (!isRecord(value)) {
    addIssue(issues, "error", "severity_policy.not_object", path, "severityPolicy must be an object or null.");
    return;
  }

  for (const field of Object.keys(value)) {
    if (!POLICY_FIELDS.has(field)) {
      addIssue(issues, "error", "severity_policy.unknown_field", `${path}.${field}`, `Unknown severityPolicy field: ${field}.`);
    }
  }

  let hasConfiguredField = false;
  if (hasOwn(value, "codes")) {
    hasConfiguredField = true;
    const codes = value["codes"];
    if (!isRecord(codes)) {
      addIssue(issues, "error", "severity_policy.codes_not_object", `${path}.codes`, "severityPolicy.codes must be an object.");
    } else {
      for (const [code, severity] of Object.entries(codes)) {
        if (!code.trim()) {
          addIssue(issues, "error", "severity_policy.empty_code", `${path}.codes`, "Diagnostic code keys must not be empty.");
        }
        if (!DIAGNOSTIC_SEVERITIES.has(String(severity))) {
          addIssue(
            issues,
            "error",
            "severity_policy.invalid_severity",
            `${path}.codes.${code || "<empty>"}`,
            `Diagnostic severity must be info, warning, or error; received ${String(severity)}.`,
          );
        }
      }
    }
  }

  for (const field of ["warningAsError", "hideInfo"] as const) {
    if (!hasOwn(value, field)) continue;
    hasConfiguredField = true;
    if (typeof value[field] !== "boolean") {
      addIssue(issues, "error", `severity_policy.${field}_not_boolean`, `${path}.${field}`, `${field} must be a boolean.`);
    }
  }

  if (!hasConfiguredField) {
    addIssue(issues, "error", "severity_policy.empty", path, "Use null for built-in defaults; an empty severityPolicy object is not authorable.");
  }
}

function addIssue(
  issues: RuntimeNavMissionDiagnosticsManifestAuthoringValidationIssue[],
  severity: RuntimeNavMissionDiagnosticsManifestAuthoringValidationSeverity,
  code: string,
  path: string,
  message: string,
): void {
  issues.push({ severity, code, path, message });
}

function hasOwn(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
