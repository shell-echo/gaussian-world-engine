import { assertRuntimeNavMissionDiagnosticsManifestAuthoringInput } from "./NavMissionDiagnosticsManifestAuthoringValidation.js";
import type { RuntimeNavMissionDiagnosticsSeverityPolicy } from "./NavMissionPackageLoader.js";

export interface RuntimeNavMissionDiagnosticsManifestAuthoringInput {
  sourceManifestText: string;
  packageIndex: number;
  policy: RuntimeNavMissionDiagnosticsSeverityPolicy | null;
}

export interface RuntimeNavMissionDiagnosticsManifestAuthoringArtifact {
  filename: string;
  target: string;
  operation: "add" | "replace" | "remove" | "noop";
  jsonPatch: RuntimeNavMissionDiagnosticsManifestJsonPatchOperation[];
  manifestText: string;
}

export type RuntimeNavMissionDiagnosticsManifestJsonPatchOperation =
  | {
      op: "add" | "replace";
      path: string;
      value: RuntimeNavMissionDiagnosticsSeverityPolicy;
    }
  | {
      op: "remove";
      path: string;
    };

export function createRuntimeNavMissionDiagnosticsManifestAuthoringArtifact(
  input: RuntimeNavMissionDiagnosticsManifestAuthoringInput,
): RuntimeNavMissionDiagnosticsManifestAuthoringArtifact {
  assertRuntimeNavMissionDiagnosticsManifestAuthoringInput(input);
  const sourceManifest = readManifestAuthoringRecord(input.sourceManifestText);
  const beforePolicy = readDiagnosticsPolicyTarget(sourceManifest, input.packageIndex);
  const path = createDiagnosticsPolicyJsonPointerPath(input.packageIndex);
  const operation = input.policy ? (beforePolicy === undefined ? "add" : "replace") : beforePolicy === undefined ? "noop" : "remove";
  const manifest = applyDiagnosticsPolicyToManifest(sourceManifest, input.packageIndex, input.policy);
  return {
    filename: createDiagnosticsPolicyManifestAuthoringFilename(sourceManifest, input.packageIndex),
    target: formatDiagnosticsPolicyManifestAuthoringTarget(input.packageIndex),
    operation,
    jsonPatch: createDiagnosticsPolicyJsonPatch(path, operation, input.policy),
    manifestText: `${JSON.stringify(manifest, null, 2)}\n`,
  };
}

export function downloadRuntimeNavMissionDiagnosticsManifestArtifact(
  artifact: RuntimeNavMissionDiagnosticsManifestAuthoringArtifact,
): void {
  const blob = new Blob([artifact.manifestText], { type: "application/json" });
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

function readManifestAuthoringRecord(sourceText: string): Record<string, unknown> {
  if (!sourceText.trim()) return { missionPackages: [{ url: "./mission-package.json", merge: true }] };
  const parsed: unknown = JSON.parse(sourceText);
  return isRecord(parsed) ? cloneRecord(parsed) : { missionPackages: [{ url: "./mission-package.json", merge: true }] };
}

function applyDiagnosticsPolicyToManifest(
  sourceManifest: Record<string, unknown>,
  packageIndex: number,
  policy: RuntimeNavMissionDiagnosticsSeverityPolicy | null,
): Record<string, unknown> {
  const manifest = cloneRecord(sourceManifest);
  if (packageIndex < 0) {
    if (policy) {
      manifest["severityPolicy"] = cloneValue(policy);
    } else {
      delete manifest["severityPolicy"];
    }
    return manifest;
  }

  const missionPackages = Array.isArray(manifest["missionPackages"]) ? [...manifest["missionPackages"]] : [];
  while (missionPackages.length <= packageIndex) missionPackages.push({ url: "./mission-package.json", merge: true });
  const targetPackage = isRecord(missionPackages[packageIndex]) ? cloneRecord(missionPackages[packageIndex]) : {};
  if (typeof targetPackage["url"] !== "string" || !targetPackage["url"].trim()) targetPackage["url"] = "./mission-package.json";
  if (typeof targetPackage["merge"] !== "boolean") targetPackage["merge"] = true;
  if (policy) {
    targetPackage["severityPolicy"] = cloneValue(policy);
  } else {
    delete targetPackage["severityPolicy"];
  }
  missionPackages[packageIndex] = targetPackage;
  manifest["missionPackages"] = missionPackages;
  return manifest;
}

function readDiagnosticsPolicyTarget(
  sourceManifest: Record<string, unknown>,
  packageIndex: number,
): RuntimeNavMissionDiagnosticsSeverityPolicy | null | undefined {
  if (packageIndex < 0) return readDiagnosticsSeverityPolicy(sourceManifest["severityPolicy"]);
  const missionPackages = sourceManifest["missionPackages"];
  if (!Array.isArray(missionPackages)) return undefined;
  const targetPackage = missionPackages[packageIndex];
  if (!isRecord(targetPackage)) return undefined;
  const policy = readDiagnosticsSeverityPolicy(targetPackage["severityPolicy"]);
  return policy === undefined ? null : policy;
}

function readDiagnosticsSeverityPolicy(value: unknown): RuntimeNavMissionDiagnosticsSeverityPolicy | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (!isRecord(value)) return undefined;
  const policy: RuntimeNavMissionDiagnosticsSeverityPolicy = {};
  const codesValue = value["codes"];
  if (isRecord(codesValue)) {
    const codes: Record<string, "info" | "warning" | "error"> = {};
    for (const [code, severity] of Object.entries(codesValue)) {
      if (severity === "info" || severity === "warning" || severity === "error") codes[code] = severity;
    }
    if (Object.keys(codes).length > 0) policy.codes = codes;
  }
  const warningAsError = value["warningAsError"];
  if (typeof warningAsError === "boolean") policy.warningAsError = warningAsError;
  const hideInfo = value["hideInfo"];
  if (typeof hideInfo === "boolean") policy.hideInfo = hideInfo;
  const hasCodes = policy.codes ? Object.keys(policy.codes).length > 0 : false;
  return hasCodes || policy.warningAsError !== undefined || policy.hideInfo !== undefined ? policy : null;
}

function createDiagnosticsPolicyJsonPatch(
  path: string,
  operation: RuntimeNavMissionDiagnosticsManifestAuthoringArtifact["operation"],
  policy: RuntimeNavMissionDiagnosticsSeverityPolicy | null,
): RuntimeNavMissionDiagnosticsManifestJsonPatchOperation[] {
  if (operation === "noop") return [];
  if (operation === "remove") return [{ op: "remove", path }];
  if (!policy) return [];
  return [{ op: operation, path, value: cloneValue(policy) }];
}

function createDiagnosticsPolicyJsonPointerPath(packageIndex: number): string {
  return packageIndex < 0 ? "/severityPolicy" : `/missionPackages/${packageIndex}/severityPolicy`;
}

function createDiagnosticsPolicyManifestAuthoringFilename(sourceManifest: Record<string, unknown>, packageIndex: number): string {
  const sourceName = packageIndex < 0 ? "large-world-manifest" : readManifestPackageUrl(sourceManifest, packageIndex) ?? "mission-package";
  const basename = sourceName.split(/[\\/]/).pop()?.replace(/\.json$/i, "") || "mission-package";
  return `${sanitizeFilename(basename)}.diagnostics-policy.manifest.json`;
}

function readManifestPackageUrl(sourceManifest: Record<string, unknown>, packageIndex: number): string | null {
  const missionPackages = sourceManifest["missionPackages"];
  if (!Array.isArray(missionPackages)) return null;
  const targetPackage = missionPackages[packageIndex];
  if (!isRecord(targetPackage)) return null;
  const url = targetPackage["url"];
  return typeof url === "string" && url.trim() ? url : null;
}

function formatDiagnosticsPolicyManifestAuthoringTarget(packageIndex: number): string {
  return packageIndex < 0 ? "top-level severityPolicy" : `missionPackages[${packageIndex}]`;
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "mission-package";
}

function cloneRecord(value: Record<string, unknown>): Record<string, unknown> {
  return cloneValue(value);
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
