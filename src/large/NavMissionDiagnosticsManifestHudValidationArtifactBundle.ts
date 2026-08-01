import type {
  RuntimeNavMissionDiagnosticsManifestAuthoringValidationResult,
} from "./NavMissionDiagnosticsManifestAuthoringValidation.js";
import {
  createRuntimeNavMissionDiagnosticsManifestHudValidationReportArtifact,
} from "./NavMissionDiagnosticsManifestHudValidationDetails.js";
import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationReportArtifact,
} from "./NavMissionDiagnosticsManifestHudValidationDetails.js";
import {
  createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportArtifact,
} from "./NavMissionDiagnosticsManifestHudValidationJsonReport.js";
import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportArtifact,
  RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportTarget,
} from "./NavMissionDiagnosticsManifestHudValidationJsonReport.js";
import {
  createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumArtifact,
  RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_JSON_REPORT_CHECKSUM_ALGORITHM,
} from "./NavMissionDiagnosticsManifestHudValidationJsonReportChecksum.js";
import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumArtifact,
} from "./NavMissionDiagnosticsManifestHudValidationJsonReportChecksum.js";

export const RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_SCHEMA =
  "splat-world-engine/mission-diagnostics-policy-manifest-validation-artifact-bundle";
export const RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_SCHEMA_VERSION = 1 as const;

const DEFAULT_VALIDATION_ARTIFACT_BUNDLE_FILENAME =
  "mission-diagnostics-policy-manifest.validation-artifacts.bundle.json";

export type RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleStatus =
  | "passed"
  | "warnings-only"
  | "blocking-error"
  | "invalid-target";

export type RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleEntryKind =
  | "validation-report-text"
  | "validation-report-json"
  | "validation-report-json-sha256";

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleChecksum {
  algorithm: typeof RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_JSON_REPORT_CHECKSUM_ALGORITHM;
  input: "artifact-text-utf8";
  hex: string;
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleReference {
  relation: "checksum-for";
  filename: string;
  bytes: number;
  checksum: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleChecksum;
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleEntry {
  kind: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleEntryKind;
  filename: string;
  mimeType: string;
  bytes: number;
  checksum: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleChecksum;
  verifies?: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleReference;
  text: string;
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleDocument {
  schema: typeof RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_SCHEMA;
  schemaVersion: typeof RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_SCHEMA_VERSION;
  target: RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportTarget;
  status: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleStatus;
  valid: boolean;
  summary: {
    issueCount: number;
    errors: number;
    warnings: number;
    artifactCount: number;
  };
  artifactOrder: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleEntryKind[];
  artifacts: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleEntry[];
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleArtifact {
  filename: string;
  mimeType: "application/json;charset=utf-8";
  document: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleDocument;
  text: string;
  bytes: number;
  textReport: RuntimeNavMissionDiagnosticsManifestHudValidationReportArtifact;
  jsonReport: RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportArtifact;
  jsonChecksum: RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumArtifact;
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleOptions {
  textReportFilename?: string;
  jsonReportFilename?: string;
  checksumFilename?: string;
  bundleFilename?: string;
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleButtonOptions
  extends RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleOptions {
  onDownload?: (artifact: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleArtifact) => void;
  onStatus?: (message: string) => void;
}

export function createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleFilename(
  packageIndex: number,
): string {
  if (packageIndex === -1) return "large-world-manifest.diagnostics-policy.validation-artifacts.bundle.json";
  if (Number.isInteger(packageIndex) && packageIndex >= 0) {
    return `mission-package-${packageIndex}.diagnostics-policy.validation-artifacts.bundle.json`;
  }
  return "mission-diagnostics-policy-manifest.invalid-target.validation-artifacts.bundle.json";
}

export async function createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleArtifact(
  validation: RuntimeNavMissionDiagnosticsManifestAuthoringValidationResult,
  packageIndex: number,
  options: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleOptions = {},
): Promise<RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleArtifact> {
  const textReport = createRuntimeNavMissionDiagnosticsManifestHudValidationReportArtifact(
    validation,
    options.textReportFilename ?? createValidationTextReportFilename(packageIndex),
  );
  const jsonReport = createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportArtifact(
    validation,
    packageIndex,
    options.jsonReportFilename,
  );
  const jsonChecksum = await createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumArtifact(
    jsonReport,
    options.checksumFilename,
  );

  const textReportChecksum = await createArtifactTextChecksum(textReport.text);
  const jsonChecksumChecksum = await createArtifactTextChecksum(jsonChecksum.text);
  const artifacts: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleEntry[] = [
    {
      kind: "validation-report-text",
      filename: textReport.filename,
      mimeType: textReport.mimeType,
      bytes: textReport.bytes,
      checksum: textReportChecksum,
      text: textReport.text,
    },
    {
      kind: "validation-report-json",
      filename: jsonReport.filename,
      mimeType: jsonReport.mimeType,
      bytes: jsonReport.bytes,
      checksum: {
        algorithm: jsonChecksum.algorithm,
        input: "artifact-text-utf8",
        hex: jsonChecksum.hex,
      },
      text: jsonReport.text,
    },
    {
      kind: "validation-report-json-sha256",
      filename: jsonChecksum.filename,
      mimeType: jsonChecksum.mimeType,
      bytes: jsonChecksum.bytes,
      checksum: jsonChecksumChecksum,
      verifies: {
        relation: "checksum-for",
        filename: jsonReport.filename,
        bytes: jsonReport.bytes,
        checksum: {
          algorithm: jsonChecksum.algorithm,
          input: "artifact-text-utf8",
          hex: jsonChecksum.hex,
        },
      },
      text: jsonChecksum.text,
    },
  ];

  const document: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleDocument = {
    schema: RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_SCHEMA,
    schemaVersion: RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_SCHEMA_VERSION,
    target: jsonReport.document.target,
    status: createBundleStatus(validation, jsonReport.document.target),
    valid: validation.valid,
    summary: {
      issueCount: validation.issues.length,
      errors: validation.errors,
      warnings: validation.warnings,
      artifactCount: artifacts.length,
    },
    artifactOrder: artifacts.map((artifact) => artifact.kind),
    artifacts,
  };
  const text = `${JSON.stringify(document, null, 2)}\n`;

  return {
    filename: normalizeValidationArtifactBundleFilename(
      options.bundleFilename ??
        createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleFilename(packageIndex),
    ),
    mimeType: "application/json;charset=utf-8",
    document,
    text,
    bytes: new TextEncoder().encode(text).byteLength,
    textReport,
    jsonReport,
    jsonChecksum,
  };
}

export function downloadRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleArtifact(
  artifact: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleArtifact,
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

export function createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleButton(
  validation: RuntimeNavMissionDiagnosticsManifestAuthoringValidationResult,
  packageIndex: number,
  options: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleButtonOptions = {},
): HTMLButtonElement {
  const filename = normalizeValidationArtifactBundleFilename(
    options.bundleFilename ??
      createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleFilename(packageIndex),
  );
  const status = createBundleStatus(
    validation,
    createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportArtifact(
      validation,
      packageIndex,
      options.jsonReportFilename,
    ).document.target,
  );
  const button = document.createElement("button");
  button.type = "button";
  button.style.display = "grid";
  button.style.flex = "1 0 100%";
  button.style.gap = "2px";
  button.style.maxWidth = "100%";
  button.style.textAlign = "left";

  const label = document.createElement("span");
  label.textContent = "Download validation artifact bundle";

  const preview = document.createElement("small");
  preview.style.display = "block";
  preview.style.maxWidth = "100%";
  preview.style.fontSize = "9px";
  preview.style.fontWeight = "500";
  preview.style.lineHeight = "1.25";
  preview.style.opacity = "0.66";
  preview.style.overflowWrap = "anywhere";
  preview.textContent = `${filename} · schema v${RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_SCHEMA_VERSION} · 3 artifacts · ${status}`;

  button.title = preview.textContent;
  button.setAttribute("aria-label", `${label.textContent}. ${preview.textContent}`);
  button.append(label, preview);
  button.addEventListener("click", () => {
    void downloadValidationArtifactBundle(validation, packageIndex, button, label, preview, options);
  });
  return button;
}

async function downloadValidationArtifactBundle(
  validation: RuntimeNavMissionDiagnosticsManifestAuthoringValidationResult,
  packageIndex: number,
  button: HTMLButtonElement,
  label: HTMLSpanElement,
  preview: HTMLElement,
  options: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleButtonOptions,
): Promise<void> {
  button.disabled = true;
  label.textContent = "Building validation artifact bundle…";
  try {
    const artifact = await createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleArtifact(
      validation,
      packageIndex,
      options,
    );
    downloadRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleArtifact(artifact);
    button.dataset.bundleSchema = artifact.document.schema;
    button.dataset.bundleSchemaVersion = String(artifact.document.schemaVersion);
    button.dataset.bundleStatus = artifact.document.status;
    button.dataset.bundleArtifactCount = String(artifact.document.summary.artifactCount);
    preview.textContent = `${artifact.filename} · ${artifact.document.status} · ${artifact.document.summary.artifactCount} artifacts · ${formatByteSize(artifact.bytes)}`;
    button.title = preview.textContent;
    button.setAttribute("aria-label", `Download validation artifact bundle. ${preview.textContent}`);
    options.onDownload?.(artifact);
    options.onStatus?.(
      `Downloaded validation artifact bundle ${artifact.filename} with ${artifact.document.summary.artifactCount} artifacts.`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("Mission diagnostics manifest validation artifact bundle download failed.", error);
    options.onStatus?.(`Validation artifact bundle download failed: ${message}`);
  } finally {
    button.disabled = false;
    label.textContent = "Download validation artifact bundle";
  }
}

async function createArtifactTextChecksum(
  text: string,
): Promise<RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleChecksum> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle?.digest) throw new Error("Web Crypto SHA-256 is unavailable.");
  const digest = await subtle.digest(
    RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_JSON_REPORT_CHECKSUM_ALGORITHM,
    new TextEncoder().encode(text),
  );
  return {
    algorithm: RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_JSON_REPORT_CHECKSUM_ALGORITHM,
    input: "artifact-text-utf8",
    hex: formatHexDigest(digest),
  };
}

function createBundleStatus(
  validation: RuntimeNavMissionDiagnosticsManifestAuthoringValidationResult,
  target: RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportTarget,
): RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleStatus {
  if (target.scope === "invalid") return "invalid-target";
  if (!validation.valid) return "blocking-error";
  if (validation.warnings > 0) return "warnings-only";
  return "passed";
}

function createValidationTextReportFilename(packageIndex: number): string {
  if (packageIndex === -1) return "large-world-manifest.diagnostics-policy.validation-report.txt";
  if (Number.isInteger(packageIndex) && packageIndex >= 0) {
    return `mission-package-${packageIndex}.diagnostics-policy.validation-report.txt`;
  }
  return "mission-diagnostics-policy-manifest.invalid-target.validation-report.txt";
}

function normalizeValidationArtifactBundleFilename(filename: string): string {
  const normalized = filename.trim().replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  if (!normalized) return DEFAULT_VALIDATION_ARTIFACT_BUNDLE_FILENAME;
  return normalized.toLowerCase().endsWith(".json") ? normalized : `${normalized}.json`;
}

function formatHexDigest(digest: ArrayBuffer): string {
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function formatByteSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kilobytes = bytes / 1024;
  return `${kilobytes >= 10 ? kilobytes.toFixed(0) : kilobytes.toFixed(1)} KB`;
}
