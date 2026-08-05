import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportDocument,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReport.js";
import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationIssueCode,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerification.js";
import {
  RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_IMPORTED_ARCHIVE_PROVENANCE_VERIFICATION_ANCHOR_FIELDS,
  RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_IMPORTED_ARCHIVE_PROVENANCE_VERIFICATION_CHECK_FIELDS,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerificationContract.js";
import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationAnchors,
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationChecks,
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationIssue,
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationIssueCode,
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationResult,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerificationContract.js";

const SHA256_ALGORITHM = "SHA-256" as const;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const SAFE_BASENAME_PATTERN = /^[a-zA-Z0-9._-]+$/;
const MAX_ISSUE_PATH_CHARACTERS = 2048;
type JsonRecord = Record<string, unknown>;
type Issue = RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationIssue;
type Checks = RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationChecks;
type Anchors = RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationAnchors;

export function runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportCreateText(
  document: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportDocument,
): string {
  const lines = [
    "Splat World Engine Imported Archive Provenance Verification Report", "",
    `Schema: ${document.schema}`, `Schema version: ${document.schemaVersion}`, `Target: ${JSON.stringify(runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportCanonicalize(document.target))}`, "",
    `Result valid: ${document.result.valid}`, `Trust: ${document.result.trust}`, `Issue count: ${document.result.issueCount}`, "",
    `Provenance JSON: ${document.input.provenanceJsonFilename}`, `Provenance exact bytes: ${document.input.exactBytes}`, `Provenance exact SHA-256: ${document.input.exactChecksum.hex}`,
    `Envelope filename safe: ${document.input.envelope.filenameSafe}`, `Envelope MIME type matches: ${document.input.envelope.mimeTypeMatches}`, `Envelope byte size matches: ${document.input.envelope.byteSizeMatches}`, `Envelope checksum matches: ${document.input.envelope.checksumMatches}`, "",
    `Source archive: ${document.sourceArchive.filename ?? "unavailable"}`, `Source archive exact bytes: ${document.sourceArchive.exactBytes ?? "unavailable"}`, `Source archive SHA-256: ${document.sourceArchive.checksumHex ?? "unavailable"}`, "", "Verification checks",
  ];
  for (const field of RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_IMPORTED_ARCHIVE_PROVENANCE_VERIFICATION_CHECK_FIELDS) lines.push(`  ${field}: ${document.checks[field]}`);
  lines.push("", "Trusted anchors");
  for (const field of RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_IMPORTED_ARCHIVE_PROVENANCE_VERIFICATION_ANCHOR_FIELDS) {
    const value = document.anchors[field];
    lines.push(`  ${field}: ${value === null ? "not-provided" : value}`);
  }
  lines.push("", "Issues");
  if (document.issues.length === 0) lines.push("  none");
  else for (const issue of document.issues) lines.push(`  ${issue.code} ${issue.path}`, `    ${issue.message}`);
  lines.push("", `Result: ${document.result.valid ? "verification passed" : "verification failed"}`);
  return `${lines.join("\n")}\n`;
}

export function runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportStableIssueMessage(
  code: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationIssueCode,
): string {
  const messages: Record<RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationIssueCode, string> = {
    "text-invalid":"Provenance text input is invalid.", "text-size-invalid":"Provenance text exceeds the configured verification size limit.",
    "json-parse-failed":"Provenance text is not valid JSON.", "document-type-invalid":"Provenance document root is not a plain JSON object.",
    "field-type-invalid":"A required provenance field has an invalid type or is missing.", "field-value-invalid":"A provenance field contains an invalid value.",
    "array-size-invalid":"A provenance array exceeds the configured entry limit.", "string-size-invalid":"A provenance string exceeds the configured character limit.",
    "schema-mismatch":"Provenance schema does not match the required schema.", "schema-version-mismatch":"Provenance schema version does not match the required version.",
    "unknown-field":"Provenance contains a field that is not allowed by the fixed schema.", "canonical-json-mismatch":"Provenance JSON does not match the required canonical serialization.",
    "source-archive-mismatch":"Source archive metadata is inconsistent.", "source-archive-checksum-mismatch":"Source archive SHA-256 does not match the trusted anchor.",
    "verification-check-mismatch":"Recorded archive verification checks are inconsistent.", "trusted-extraction-mismatch":"Trusted extraction metadata does not match the trusted extraction anchor.",
    "imported-extraction-mismatch":"Imported extraction metadata does not match retained imported bytes.", "relationship-count-mismatch":"Provenance relationship count is invalid.",
    "relationship-mismatch":"A provenance relationship is incomplete or false.", "artifact-order-mismatch":"Provenance artifacts are not in the required fixed order.",
    "artifact-metadata-mismatch":"Provenance artifact metadata is inconsistent.", "crc32-mismatch":"An imported artifact CRC-32 does not match retained bytes.",
    "sha256-mismatch":"A SHA-256 value does not match retained bytes.", "checksum-artifact-invalid":"The provenance JSON SHA-256 artifact is invalid.",
    "expected-provenance-mismatch":"Provenance input does not match the expected provenance result.", "crypto-unavailable":"Web Crypto SHA-256 was unavailable during provenance verification.",
  };
  return messages[code];
}

export function runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportCreateResult(
  document: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportDocument | null,
  canonicalText: string | null,
  bytes: number,
  checksumHex: string | null,
  issues: Issue[],
  checks: Checks,
  anchors: Anchors,
): RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationResult {
  return { valid:false, trust:"untrusted", document, canonicalText, bytes, checksumHex, issues, checks, anchors };
}

export function runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportFinalizeResult(
  result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationResult,
): void {
  result.valid = result.issues.length === 0;
  if (!result.valid) { result.trust = "untrusted"; return; }
  const trusted = [result.anchors.expectedReport, result.anchors.verification, result.anchors.provenance].filter((value): value is boolean => value !== null);
  result.trust = trusted.length > 0 && trusted.every(Boolean) ? "anchored" : "self-consistent";
}

export function runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportAddIssue(
  issues: Issue[],
  code: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationIssueCode,
  path: string,
  message: string,
): void { issues.push({ code, path, message }); }

export function runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportCanonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportCanonicalize);
  if (isRecord(value)) {
    const output: JsonRecord = {};
    for (const key of Object.keys(value).sort()) output[key] = runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportCanonicalize(value[key]);
    return output;
  }
  return value;
}

export function runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportEqualJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportCanonicalize(left)) ===
    JSON.stringify(runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportCanonicalize(right));
}

export function runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportIsSafeBasename(value: string): boolean {
  return value.length > 0 && value.length <= 255 && SAFE_BASENAME_PATTERN.test(value);
}

export async function runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportDigestText(text: string, subtle: SubtleCrypto): Promise<string> {
  const source = new TextEncoder().encode(text);
  const copy = new Uint8Array(source.byteLength);
  copy.set(source);
  return Array.from(new Uint8Array(await subtle.digest(SHA256_ALGORITHM, copy.buffer)), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportNormalizeIssuePath(path: string): string {
  if (typeof path !== "string" || path.length === 0) return "$";
  return path.length <= MAX_ISSUE_PATH_CHARACTERS ? path : path.slice(0, MAX_ISSUE_PATH_CHARACTERS);
}
export function runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportNormalizeString(value: string, max: number, fallback: string): string { return value.length > 0 && value.length <= max ? value : fallback; }
export function runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportNormalizeInteger(value: number): number { return Number.isSafeInteger(value) && value >= 0 ? value : 0; }
export function runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportNormalizeChecksum(value: string): string { return SHA256_PATTERN.test(value) ? value : "0".repeat(64); }

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}
