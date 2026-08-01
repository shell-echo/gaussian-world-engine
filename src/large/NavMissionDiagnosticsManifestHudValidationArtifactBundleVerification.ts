import type {
  RuntimeNavMissionDiagnosticsManifestAuthoringValidationResult,
} from "./NavMissionDiagnosticsManifestAuthoringValidation.js";
import {
  createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleArtifact,
  RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_SCHEMA,
  RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_SCHEMA_VERSION,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundle.js";
import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleArtifact,
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleDocument,
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleEntryKind,
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleStatus,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundle.js";
import {
  RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_JSON_REPORT_SCHEMA,
  RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_JSON_REPORT_SCHEMA_VERSION,
} from "./NavMissionDiagnosticsManifestHudValidationJsonReport.js";
import {
  RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_JSON_REPORT_CHECKSUM_ALGORITHM,
} from "./NavMissionDiagnosticsManifestHudValidationJsonReportChecksum.js";

export const RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_ORDER = [
  "validation-report-text",
  "validation-report-json",
  "validation-report-json-sha256",
] as const satisfies readonly RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleEntryKind[];

export type RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleVerificationIssueCode =
  | "invalid-json"
  | "invalid-root"
  | "non-canonical-bundle-text"
  | "schema-mismatch"
  | "schema-version-mismatch"
  | "target-invalid"
  | "status-invalid"
  | "status-mismatch"
  | "validity-invalid"
  | "validity-mismatch"
  | "summary-invalid"
  | "summary-mismatch"
  | "artifact-order-invalid"
  | "artifact-count-mismatch"
  | "artifact-invalid"
  | "artifact-kind-mismatch"
  | "artifact-filename-invalid"
  | "artifact-filename-duplicate"
  | "artifact-mime-type-mismatch"
  | "artifact-byte-size-mismatch"
  | "artifact-checksum-invalid"
  | "artifact-checksum-mismatch"
  | "checksum-reference-invalid"
  | "checksum-reference-mismatch"
  | "checksum-text-mismatch"
  | "json-report-invalid"
  | "json-report-mismatch"
  | "crypto-unavailable";

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleVerificationIssue {
  code: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleVerificationIssueCode;
  path: string;
  message: string;
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleVerificationResult {
  valid: boolean;
  bundleSchema: string | null;
  bundleSchemaVersion: number | null;
  bundleStatus: string | null;
  artifactCount: number;
  issues: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleVerificationIssue[];
  checks: {
    canonicalBundleText: boolean;
    artifactOrder: boolean;
    byteSizesVerified: number;
    checksumsVerified: number;
    checksumRelationshipsVerified: number;
    jsonReportMetadataVerified: boolean;
  };
  document: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleDocument | null;
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleVerificationButtonOptions {
  onVerify?: (
    verification: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleVerificationResult,
    artifact: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleArtifact,
  ) => void;
  onStatus?: (message: string) => void;
}

type JsonRecord = Record<string, unknown>;
type VerificationChecks = RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleVerificationResult["checks"];
type VerificationIssue = RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleVerificationIssue;

export async function verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleArtifact(
  artifact: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleArtifact,
): Promise<RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleVerificationResult> {
  return verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleText(artifact.text);
}

export async function verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleText(
  text: string,
): Promise<RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleVerificationResult> {
  const issues: VerificationIssue[] = [];
  const checks: VerificationChecks = {
    canonicalBundleText: false,
    artifactOrder: false,
    byteSizesVerified: 0,
    checksumsVerified: 0,
    checksumRelationshipsVerified: 0,
    jsonReportMetadataVerified: false,
  };

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    addIssue(issues, "invalid-json", "$", `Bundle text is not valid JSON: ${message}`);
    return createVerificationResult(null, issues, checks);
  }
  if (!isRecord(parsed)) {
    addIssue(issues, "invalid-root", "$", "Bundle document root must be a JSON object.");
    return createVerificationResult(null, issues, checks);
  }

  checks.canonicalBundleText = `${JSON.stringify(parsed, null, 2)}\n` === text;
  if (!checks.canonicalBundleText) {
    addIssue(
      issues,
      "non-canonical-bundle-text",
      "$",
      "Bundle text must use deterministic two-space JSON indentation and one trailing newline.",
    );
  }

  verifyDescriptorMetadata(parsed, issues);
  verifySummaryAndStatus(parsed, issues);

  const artifacts = Array.isArray(parsed.artifacts) ? parsed.artifacts : [];
  const declaredArtifactCount = isRecord(parsed.summary)
    ? readNonNegativeInteger(parsed.summary.artifactCount)
    : null;
  if (declaredArtifactCount !== artifacts.length || artifacts.length !== 3) {
    addIssue(
      issues,
      "artifact-count-mismatch",
      "$.summary.artifactCount",
      "Bundle must declare and contain exactly three validation artifacts.",
    );
  }

  checks.artifactOrder = verifyArtifactOrder(parsed.artifactOrder);
  if (!checks.artifactOrder) {
    addIssue(
      issues,
      "artifact-order-invalid",
      "$.artifactOrder",
      `Bundle artifactOrder must be ${RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_ORDER.join(
        ", ",
      )}.`,
    );
  }

  const cryptoAvailable = Boolean(globalThis.crypto?.subtle);
  if (!cryptoAvailable) {
    addIssue(issues, "crypto-unavailable", "$", "Web Crypto SHA-256 is unavailable for bundle verification.");
  }

  const artifactRecords: JsonRecord[] = [];
  const seenFilenames = new Set<string>();
  for (let index = 0; index < artifacts.length; index += 1) {
    const artifact = artifacts[index];
    const path = `$.artifacts[${index}]`;
    if (!isRecord(artifact)) {
      addIssue(issues, "artifact-invalid", path, "Bundle artifact entry must be a JSON object.");
      continue;
    }
    artifactRecords.push(artifact);
    await verifyArtifactEntry(artifact, index, path, seenFilenames, cryptoAvailable, issues, checks);
  }

  verifyChecksumRelationship(artifactRecords, issues, checks);
  checks.jsonReportMetadataVerified = verifyJsonReportMetadata(parsed, artifactRecords, issues);

  const result = createVerificationResult(parsed, issues, checks);
  if (result.valid) {
    result.document = parsed as unknown as RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleDocument;
  }
  return result;
}

export function formatRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleVerification(
  verification: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleVerificationResult,
): string {
  if (!verification.valid) {
    return `Validation artifact bundle verification · failed · ${formatIssueCount(verification.issues.length)}`;
  }
  return `Validation artifact bundle verification · passed · ${verification.artifactCount} artifacts · ${verification.checks.byteSizesVerified} byte sizes · ${verification.checks.checksumsVerified} SHA-256 checksums · checksum relationship verified`;
}

export function createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleVerificationButton(
  validation: RuntimeNavMissionDiagnosticsManifestAuthoringValidationResult,
  packageIndex: number,
  options: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleVerificationButtonOptions = {},
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.style.display = "grid";
  button.style.flex = "1 0 100%";
  button.style.gap = "2px";
  button.style.maxWidth = "100%";
  button.style.textAlign = "left";

  const label = document.createElement("span");
  label.textContent = "Verify validation artifact bundle";

  const preview = document.createElement("small");
  preview.style.display = "block";
  preview.style.maxWidth = "100%";
  preview.style.fontSize = "9px";
  preview.style.fontWeight = "500";
  preview.style.lineHeight = "1.25";
  preview.style.opacity = "0.66";
  preview.style.overflowWrap = "anywhere";
  preview.textContent = "canonical JSON · artifact order · UTF-8 byte sizes · SHA-256 · checksum-for";

  button.title = preview.textContent;
  button.setAttribute("aria-label", `${label.textContent}. ${preview.textContent}`);
  button.append(label, preview);
  button.addEventListener("click", () => {
    void verifyValidationArtifactBundle(validation, packageIndex, button, label, preview, options);
  });
  return button;
}

async function verifyValidationArtifactBundle(
  validation: RuntimeNavMissionDiagnosticsManifestAuthoringValidationResult,
  packageIndex: number,
  button: HTMLButtonElement,
  label: HTMLSpanElement,
  preview: HTMLElement,
  options: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleVerificationButtonOptions,
): Promise<void> {
  button.disabled = true;
  label.textContent = "Verifying validation artifact bundle…";
  try {
    const artifact = await createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleArtifact(
      validation,
      packageIndex,
    );
    const verification = await verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleArtifact(artifact);
    button.dataset.bundleVerificationValid = String(verification.valid);
    button.dataset.bundleVerificationIssueCount = String(verification.issues.length);
    button.dataset.bundleVerificationChecksumCount = String(verification.checks.checksumsVerified);
    preview.textContent = verification.valid
      ? `${artifact.filename} · verified · ${verification.artifactCount} artifacts · ${verification.checks.checksumsVerified} checksums`
      : `${artifact.filename} · failed · ${formatIssueCount(verification.issues.length)}`;
    button.title = preview.textContent;
    button.setAttribute("aria-label", `Verify validation artifact bundle. ${preview.textContent}`);
    options.onVerify?.(verification, artifact);
    options.onStatus?.(
      verification.valid
        ? `Verified validation artifact bundle ${artifact.filename} with ${verification.artifactCount} artifacts.`
        : `Validation artifact bundle verification failed with ${formatIssueCount(verification.issues.length)}.`,
    );
    if (!verification.valid) {
      console.warn("Mission diagnostics manifest validation artifact bundle verification failed.", verification.issues);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("Mission diagnostics manifest validation artifact bundle verification failed.", error);
    options.onStatus?.(`Validation artifact bundle verification failed: ${message}`);
  } finally {
    button.disabled = false;
    label.textContent = "Verify validation artifact bundle";
  }
}

function verifyDescriptorMetadata(bundle: JsonRecord, issues: VerificationIssue[]): void {
  if (bundle.schema !== RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_SCHEMA) {
    addIssue(
      issues,
      "schema-mismatch",
      "$.schema",
      `Expected bundle schema ${RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_SCHEMA}.`,
    );
  }
  if (bundle.schemaVersion !== RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_SCHEMA_VERSION) {
    addIssue(
      issues,
      "schema-version-mismatch",
      "$.schemaVersion",
      `Expected bundle schema version ${RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_SCHEMA_VERSION}.`,
    );
  }
  if (!isRecord(bundle.target) || !validateTarget(bundle.target)) {
    addIssue(issues, "target-invalid", "$.target", "Bundle target metadata is incomplete or inconsistent.");
  }
  if (!isBundleStatus(bundle.status)) {
    addIssue(issues, "status-invalid", "$.status", "Bundle status is not a supported validation artifact status.");
  }
  if (typeof bundle.valid !== "boolean") {
    addIssue(issues, "validity-invalid", "$.valid", "Bundle valid must be a boolean.");
  }
}

function verifySummaryAndStatus(bundle: JsonRecord, issues: VerificationIssue[]): void {
  if (!isRecord(bundle.summary)) {
    addIssue(issues, "summary-invalid", "$.summary", "Bundle summary must be a JSON object.");
    return;
  }
  const issueCount = readNonNegativeInteger(bundle.summary.issueCount);
  const errors = readNonNegativeInteger(bundle.summary.errors);
  const warnings = readNonNegativeInteger(bundle.summary.warnings);
  const artifactCount = readNonNegativeInteger(bundle.summary.artifactCount);
  if (issueCount === null || errors === null || warnings === null || artifactCount === null) {
    addIssue(issues, "summary-invalid", "$.summary", "Bundle summary fields must be non-negative integers.");
    return;
  }
  if (issueCount !== errors + warnings) {
    addIssue(issues, "summary-mismatch", "$.summary.issueCount", "Bundle issueCount must equal errors plus warnings.");
  }
  if (typeof bundle.valid === "boolean" && bundle.valid !== (errors === 0)) {
    addIssue(issues, "validity-mismatch", "$.valid", "Bundle valid must be true exactly when errors is zero.");
  }
  const scope = isRecord(bundle.target) && isTargetScope(bundle.target.scope) ? bundle.target.scope : null;
  const expectedStatus = createExpectedStatus(scope, bundle.valid, warnings);
  if (expectedStatus && bundle.status !== expectedStatus) {
    addIssue(
      issues,
      "status-mismatch",
      "$.status",
      `Bundle status must be ${expectedStatus} for the declared target and summary.`,
    );
  }
}

async function verifyArtifactEntry(
  artifact: JsonRecord,
  index: number,
  path: string,
  seenFilenames: Set<string>,
  cryptoAvailable: boolean,
  issues: VerificationIssue[],
  checks: VerificationChecks,
): Promise<void> {
  const expectedKind = RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_ORDER[index];
  if (!expectedKind || artifact.kind !== expectedKind) {
    addIssue(
      issues,
      "artifact-kind-mismatch",
      `${path}.kind`,
      expectedKind ? `Artifact at index ${index} must be ${expectedKind}.` : "Bundle contains an unexpected artifact.",
    );
  }

  const filename = typeof artifact.filename === "string" ? artifact.filename : null;
  if (!filename || !/^[a-zA-Z0-9._-]+$/.test(filename)) {
    addIssue(issues, "artifact-filename-invalid", `${path}.filename`, "Artifact filename must be a safe basename.");
  } else if (seenFilenames.has(filename)) {
    addIssue(issues, "artifact-filename-duplicate", `${path}.filename`, `Duplicate artifact filename ${filename}.`);
  } else {
    seenFilenames.add(filename);
  }

  if (expectedKind && artifact.mimeType !== expectedArtifactMimeType(expectedKind)) {
    addIssue(
      issues,
      "artifact-mime-type-mismatch",
      `${path}.mimeType`,
      `Artifact ${expectedKind} must use MIME type ${expectedArtifactMimeType(expectedKind)}.`,
    );
  }

  const artifactText = typeof artifact.text === "string" ? artifact.text : null;
  const declaredBytes = readNonNegativeInteger(artifact.bytes);
  if (artifactText === null || declaredBytes === null) {
    addIssue(
      issues,
      "artifact-byte-size-mismatch",
      `${path}.bytes`,
      "Artifact text and non-negative UTF-8 byte size are required.",
    );
  } else {
    const actualBytes = new TextEncoder().encode(artifactText).byteLength;
    if (actualBytes !== declaredBytes) {
      addIssue(
        issues,
        "artifact-byte-size-mismatch",
        `${path}.bytes`,
        `Declared byte size ${declaredBytes} does not match exact UTF-8 byte size ${actualBytes}.`,
      );
    } else {
      checks.byteSizesVerified += 1;
    }
  }

  const checksum = isRecord(artifact.checksum) ? artifact.checksum : null;
  const checksumHex = checksum && typeof checksum.hex === "string" ? checksum.hex : null;
  const checksumMetadataValid =
    checksum?.algorithm === RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_JSON_REPORT_CHECKSUM_ALGORITHM &&
    checksum.input === "artifact-text-utf8" &&
    checksumHex !== null &&
    /^[0-9a-f]{64}$/.test(checksumHex);
  if (!checksumMetadataValid) {
    addIssue(
      issues,
      "artifact-checksum-invalid",
      `${path}.checksum`,
      "Artifact checksum must be SHA-256 over artifact-text-utf8 with 64 lowercase hexadecimal characters.",
    );
  } else if (artifactText !== null && cryptoAvailable) {
    const actualHex = await createSha256Hex(artifactText);
    if (actualHex !== checksumHex) {
      addIssue(
        issues,
        "artifact-checksum-mismatch",
        `${path}.checksum.hex`,
        `Artifact checksum does not match the exact UTF-8 bytes of ${filename ?? expectedKind ?? "artifact"}.`,
      );
    } else {
      checks.checksumsVerified += 1;
    }
  }
}

function verifyChecksumRelationship(
  artifacts: JsonRecord[],
  issues: VerificationIssue[],
  checks: VerificationChecks,
): void {
  const jsonReport = artifacts.find((artifact) => artifact.kind === "validation-report-json");
  const checksumArtifact = artifacts.find((artifact) => artifact.kind === "validation-report-json-sha256");
  if (!jsonReport || !checksumArtifact) return;

  const verifies = isRecord(checksumArtifact.verifies) ? checksumArtifact.verifies : null;
  const jsonChecksum = isRecord(jsonReport.checksum) ? jsonReport.checksum : null;
  const verifiesChecksum = verifies && isRecord(verifies.checksum) ? verifies.checksum : null;
  if (!verifies || !verifiesChecksum) {
    addIssue(
      issues,
      "checksum-reference-invalid",
      "$.artifacts[2].verifies",
      "Checksum artifact must contain a structured checksum-for reference.",
    );
    return;
  }

  if (
    verifies.relation !== "checksum-for" ||
    verifies.filename !== jsonReport.filename ||
    verifies.bytes !== jsonReport.bytes ||
    verifiesChecksum.algorithm !== jsonChecksum?.algorithm ||
    verifiesChecksum.input !== jsonChecksum?.input ||
    verifiesChecksum.hex !== jsonChecksum?.hex
  ) {
    addIssue(
      issues,
      "checksum-reference-mismatch",
      "$.artifacts[2].verifies",
      "Checksum-for metadata must exactly match the embedded JSON report filename, byte size, and checksum.",
    );
  } else {
    checks.checksumRelationshipsVerified += 1;
  }

  const expectedText =
    typeof jsonChecksum?.hex === "string" && typeof jsonReport.filename === "string"
      ? `${jsonChecksum.hex}  ${jsonReport.filename}\n`
      : null;
  if (expectedText === null || checksumArtifact.text !== expectedText) {
    addIssue(
      issues,
      "checksum-text-mismatch",
      "$.artifacts[2].text",
      "Checksum artifact text must be the JSON report SHA-256, two spaces, filename, and one trailing newline.",
    );
  }
}

function verifyJsonReportMetadata(
  bundle: JsonRecord,
  artifacts: JsonRecord[],
  issues: VerificationIssue[],
): boolean {
  const jsonReport = artifacts.find((artifact) => artifact.kind === "validation-report-json");
  if (!jsonReport || typeof jsonReport.text !== "string") return false;

  let report: unknown;
  try {
    report = JSON.parse(jsonReport.text);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    addIssue(issues, "json-report-invalid", "$.artifacts[1].text", `Embedded JSON report is invalid: ${message}`);
    return false;
  }
  if (!isRecord(report)) {
    addIssue(issues, "json-report-invalid", "$.artifacts[1].text", "Embedded JSON report root must be an object.");
    return false;
  }

  const reportSummary = isRecord(report.summary) ? report.summary : null;
  const bundleSummary = isRecord(bundle.summary) ? bundle.summary : null;
  const matches =
    report.schema === RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_JSON_REPORT_SCHEMA &&
    report.schemaVersion === RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_JSON_REPORT_SCHEMA_VERSION &&
    sameJsonValue(report.target, bundle.target) &&
    report.valid === bundle.valid &&
    reportSummary !== null &&
    bundleSummary !== null &&
    reportSummary.issueCount === bundleSummary.issueCount &&
    reportSummary.errors === bundleSummary.errors &&
    reportSummary.warnings === bundleSummary.warnings &&
    Array.isArray(report.issues) &&
    report.issues.length === reportSummary.issueCount;
  if (!matches) {
    addIssue(
      issues,
      "json-report-mismatch",
      "$.artifacts[1].text",
      "Embedded JSON report schema, target, validity, summary, and issue count must match the bundle descriptor.",
    );
  }
  return matches;
}

function createVerificationResult(
  document: JsonRecord | null,
  issues: VerificationIssue[],
  checks: VerificationChecks,
): RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleVerificationResult {
  return {
    valid: issues.length === 0,
    bundleSchema: document && typeof document.schema === "string" ? document.schema : null,
    bundleSchemaVersion: document && typeof document.schemaVersion === "number" ? document.schemaVersion : null,
    bundleStatus: document && typeof document.status === "string" ? document.status : null,
    artifactCount: document && Array.isArray(document.artifacts) ? document.artifacts.length : 0,
    issues,
    checks,
    document: null,
  };
}

function verifyArtifactOrder(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.length === RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_ORDER.length &&
    value.every(
      (kind, index) => kind === RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_ORDER[index],
    )
  );
}

function createExpectedStatus(
  scope: "manifest" | "mission-package" | "invalid" | null,
  valid: unknown,
  warnings: number,
): RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleStatus | null {
  if (scope === null || typeof valid !== "boolean") return null;
  if (scope === "invalid") return "invalid-target";
  if (!valid) return "blocking-error";
  return warnings > 0 ? "warnings-only" : "passed";
}

function validateTarget(target: JsonRecord): boolean {
  if (!isTargetScope(target.scope)) return false;
  if (typeof target.requestedPackageIndex !== "number" && typeof target.requestedPackageIndex !== "string") return false;
  if (typeof target.path !== "string") return false;
  if (target.scope === "manifest") return target.packageIndex === null && target.path === "$.severityPolicy";
  if (target.scope === "mission-package") {
    return (
      typeof target.packageIndex === "number" &&
      Number.isInteger(target.packageIndex) &&
      target.packageIndex >= 0 &&
      target.path === `$.missionPackages[${target.packageIndex}].severityPolicy`
    );
  }
  return target.packageIndex === null && target.path === "$.packageIndex";
}

function expectedArtifactMimeType(
  kind: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleEntryKind,
): "text/plain;charset=utf-8" | "application/json;charset=utf-8" {
  return kind === "validation-report-json" ? "application/json;charset=utf-8" : "text/plain;charset=utf-8";
}

async function createSha256Hex(text: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error("Web Crypto SHA-256 is unavailable.");
  const digest = await subtle.digest(
    RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_JSON_REPORT_CHECKSUM_ALGORITHM,
    new TextEncoder().encode(text),
  );
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTargetScope(value: unknown): value is "manifest" | "mission-package" | "invalid" {
  return value === "manifest" || value === "mission-package" || value === "invalid";
}

function isBundleStatus(value: unknown): value is RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleStatus {
  return value === "passed" || value === "warnings-only" || value === "blocking-error" || value === "invalid-target";
}

function readNonNegativeInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : null;
}

function sameJsonValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function addIssue(
  issues: VerificationIssue[],
  code: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleVerificationIssueCode,
  path: string,
  message: string,
): void {
  issues.push({ code, path, message });
}

function formatIssueCount(count: number): string {
  return `${count} verification issue${count === 1 ? "" : "s"}`;
}
