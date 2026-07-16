import type {
  RuntimeNavMissionDiagnosticsManifestAuthoringValidationIssue,
  RuntimeNavMissionDiagnosticsManifestAuthoringValidationResult,
} from "./NavMissionDiagnosticsManifestAuthoringValidation.js";

export const RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_JSON_REPORT_SCHEMA =
  "splat-world-engine/mission-diagnostics-policy-manifest-validation";
export const RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_JSON_REPORT_SCHEMA_VERSION = 1 as const;

const DEFAULT_VALIDATION_JSON_REPORT_FILENAME = "mission-diagnostics-policy-manifest.validation-report.json";

export interface RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportTarget {
  scope: "manifest" | "mission-package" | "invalid";
  packageIndex: number | null;
  requestedPackageIndex: number | string;
  path: string;
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportDocument {
  schema: typeof RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_JSON_REPORT_SCHEMA;
  schemaVersion: typeof RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_JSON_REPORT_SCHEMA_VERSION;
  target: RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportTarget;
  valid: boolean;
  summary: {
    issueCount: number;
    errors: number;
    warnings: number;
  };
  issues: RuntimeNavMissionDiagnosticsManifestAuthoringValidationIssue[];
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportArtifact {
  filename: string;
  mimeType: "application/json;charset=utf-8";
  document: RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportDocument;
  text: string;
  bytes: number;
  issueCount: number;
  errors: number;
  warnings: number;
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportButtonOptions {
  onArtifact?: (artifact: RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportArtifact) => void;
  onStatus?: (message: string) => void;
  filename?: string;
}

export function createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportFilename(packageIndex: number): string {
  if (packageIndex === -1) return "large-world-manifest.diagnostics-policy.validation-report.json";
  if (Number.isInteger(packageIndex) && packageIndex >= 0) {
    return `mission-package-${packageIndex}.diagnostics-policy.validation-report.json`;
  }
  return "mission-diagnostics-policy-manifest.invalid-target.validation-report.json";
}

export function createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportTarget(
  packageIndex: number,
): RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportTarget {
  const requestedPackageIndex = Number.isFinite(packageIndex) ? packageIndex : String(packageIndex);
  if (packageIndex === -1) {
    return {
      scope: "manifest",
      packageIndex: null,
      requestedPackageIndex,
      path: "$.severityPolicy",
    };
  }
  if (Number.isInteger(packageIndex) && packageIndex >= 0) {
    return {
      scope: "mission-package",
      packageIndex,
      requestedPackageIndex,
      path: `$.missionPackages[${packageIndex}].severityPolicy`,
    };
  }
  return {
    scope: "invalid",
    packageIndex: null,
    requestedPackageIndex,
    path: "$.packageIndex",
  };
}

export function createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportDocument(
  validation: RuntimeNavMissionDiagnosticsManifestAuthoringValidationResult,
  packageIndex: number,
): RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportDocument {
  const issues = selectOrderedValidationIssues(validation.issues).map((issue) => ({ ...issue }));
  return {
    schema: RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_JSON_REPORT_SCHEMA,
    schemaVersion: RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_JSON_REPORT_SCHEMA_VERSION,
    target: createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportTarget(packageIndex),
    valid: validation.valid,
    summary: {
      issueCount: issues.length,
      errors: validation.errors,
      warnings: validation.warnings,
    },
    issues,
  };
}

export function createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportArtifact(
  validation: RuntimeNavMissionDiagnosticsManifestAuthoringValidationResult,
  packageIndex: number,
  filename = createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportFilename(packageIndex),
): RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportArtifact {
  const document = createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportDocument(validation, packageIndex);
  const text = `${JSON.stringify(document, null, 2)}\n`;
  return {
    filename: normalizeValidationJsonReportFilename(filename),
    mimeType: "application/json;charset=utf-8",
    document,
    text,
    bytes: new TextEncoder().encode(text).byteLength,
    issueCount: document.summary.issueCount,
    errors: document.summary.errors,
    warnings: document.summary.warnings,
  };
}

export function downloadRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportArtifact(
  artifact: RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportArtifact,
): void {
  const blob = new Blob([artifact.text], { type: artifact.mimeType });
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = artifact.filename;
    anchor.rel = "noopener";
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportButton(
  validation: RuntimeNavMissionDiagnosticsManifestAuthoringValidationResult,
  packageIndex: number,
  options: RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportButtonOptions = {},
): HTMLButtonElement {
  const artifact = createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportArtifact(
    validation,
    packageIndex,
    options.filename,
  );
  const button = document.createElement("button");
  button.type = "button";
  button.style.display = "grid";
  button.style.flex = "1 0 100%";
  button.style.gap = "2px";
  button.style.maxWidth = "100%";
  button.style.textAlign = "left";

  const label = document.createElement("span");
  label.textContent = "Download validation JSON";

  const preview = document.createElement("small");
  preview.style.display = "block";
  preview.style.maxWidth = "100%";
  preview.style.fontSize = "9px";
  preview.style.fontWeight = "500";
  preview.style.lineHeight = "1.25";
  preview.style.opacity = "0.66";
  preview.style.overflowWrap = "anywhere";
  preview.textContent = `${artifact.filename} · schema v${artifact.document.schemaVersion} · ${formatIssueCount(artifact.issueCount)} · ${formatByteSize(artifact.bytes)}`;

  button.title = preview.textContent;
  button.setAttribute("aria-label", `${label.textContent}. ${preview.textContent}`);
  button.append(label, preview);
  button.addEventListener("click", () => {
    try {
      downloadRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportArtifact(artifact);
      options.onArtifact?.(artifact);
      options.onStatus?.(`Downloaded ${artifact.filename} with ${formatIssueCount(artifact.issueCount)}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn("Mission diagnostics manifest validation JSON report download failed.", error);
      options.onStatus?.(`Validation JSON report download failed: ${message}`);
    }
  });
  return button;
}

function selectOrderedValidationIssues(
  issues: RuntimeNavMissionDiagnosticsManifestAuthoringValidationIssue[],
): RuntimeNavMissionDiagnosticsManifestAuthoringValidationIssue[] {
  return [
    ...issues.filter((issue) => issue.severity === "error"),
    ...issues.filter((issue) => issue.severity === "warning"),
  ];
}

function normalizeValidationJsonReportFilename(filename: string): string {
  const normalized = filename.trim().replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  if (!normalized) return DEFAULT_VALIDATION_JSON_REPORT_FILENAME;
  return normalized.toLowerCase().endsWith(".json") ? normalized : `${normalized}.json`;
}

function formatIssueCount(count: number): string {
  return count === 0 ? "no validation issues" : `${count} validation issue${count === 1 ? "" : "s"}`;
}

function formatByteSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kilobytes = bytes / 1024;
  return `${kilobytes >= 10 ? kilobytes.toFixed(0) : kilobytes.toFixed(1)} KB`;
}
