import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationIssueCode,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerification.js";
import {
  RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_IMPORTED_ARCHIVE_PROVENANCE_VERIFICATION_CHECK_FIELDS,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerificationContract.js";
import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationChecks,
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationIssue,
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationIssueCode,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerificationContract.js";
import {
  runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportStableIssueMessage,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerificationSupport.js";

const MAX_REPORTED_ISSUES = 512;
const MAX_ISSUE_PATH_CHARACTERS = 2048;
const ISSUE_FIELDS = ["code", "path", "message"] as const;
const PROVENANCE_ISSUE_CODES = new Set<RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationIssueCode>([
  "text-invalid", "text-size-invalid", "json-parse-failed", "document-type-invalid", "field-type-invalid", "field-value-invalid",
  "array-size-invalid", "string-size-invalid", "schema-mismatch", "schema-version-mismatch", "unknown-field", "canonical-json-mismatch",
  "source-archive-mismatch", "source-archive-checksum-mismatch", "verification-check-mismatch", "trusted-extraction-mismatch",
  "imported-extraction-mismatch", "relationship-count-mismatch", "relationship-mismatch", "artifact-order-mismatch",
  "artifact-metadata-mismatch", "crc32-mismatch", "sha256-mismatch", "checksum-artifact-invalid", "expected-provenance-mismatch",
  "crypto-unavailable",
]);
type JsonRecord = Record<string, unknown>;
type Issue = RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationIssue;
type Checks = RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationChecks;

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportEvidenceSections {
  result: JsonRecord | null;
  checks: JsonRecord | null;
  anchors: JsonRecord | null;
  evidence: JsonRecord | null;
  issues: unknown[] | null;
}

export function verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportIssueEvidence(
  sections: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportEvidenceSections,
  issues: Issue[],
): boolean {
  if (!sections.issues) return false;
  const start = issues.length;
  if (sections.issues.length > MAX_REPORTED_ISSUES) add(issues, "array-size-invalid", "$.issues", "Too many report issues.");
  sections.issues.forEach((entry, index) => {
    const path = `$.issues[${index}]`;
    const item = record(entry, path, issues);
    if (!item) return;
    exactFields(item, ISSUE_FIELDS, path, issues);
    const code = provenanceIssueCode(item.code, `${path}.code`, issues);
    const issuePath = stringValue(item.path, `${path}.path`, MAX_ISSUE_PATH_CHARACTERS, issues);
    const message = stringValue(item.message, `${path}.message`, 512, issues);
    if (issuePath && !issuePath.startsWith("$")) add(issues, "issue-evidence-mismatch", `${path}.path`, "Issue path must start with $.");
    if (code && message && message !== runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportStableIssueMessage(code)) add(issues, "issue-evidence-mismatch", `${path}.message`, "Issue message is not stable for its code.");
  });
  const count = sections.result?.issueCount;
  const truncated = sections.evidence?.issuesTruncated;
  if (typeof count === "number" && typeof truncated === "boolean") {
    if (!truncated && count !== sections.issues.length) add(issues, "issue-count-mismatch", "$.result.issueCount", "Issue count does not match retained issues.");
    if (truncated && (sections.issues.length !== MAX_REPORTED_ISSUES || count <= sections.issues.length)) add(issues, "issue-count-mismatch", "$.evidence.issuesTruncated", "Truncated issue evidence is inconsistent.");
  }
  return issues.length === start;
}

export function verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportEvidenceRelationships(
  sections: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportEvidenceSections,
  checks: Checks,
  issues: Issue[],
): void {
  if (!sections.result || !sections.checks || !sections.anchors) return;
  if (sections.result.valid === true) {
    for (const field of RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_IMPORTED_ARCHIVE_PROVENANCE_VERIFICATION_CHECK_FIELDS) {
      if (sections.checks[field] !== true) { checks.verificationChecks = false; add(issues, "verification-check-mismatch", `$.checks.${field}`, "Recorded valid result requires every verification check."); }
    }
  }
  const trusted = [sections.anchors.expectedProvenance, sections.anchors.entryExtraction, sections.anchors.sourceArchiveChecksum].filter((value): value is boolean => typeof value === "boolean");
  if (sections.result.trust === "anchored" && (trusted.length === 0 || !trusted.every(Boolean))) { checks.anchors = false; add(issues, "anchor-mismatch", "$.anchors", "Recorded anchored trust requires matching trusted anchors."); }
  if (sections.result.trust === "self-consistent" && trusted.length > 0) { checks.anchors = false; add(issues, "anchor-mismatch", "$.anchors", "Recorded self-consistent trust cannot claim trusted anchors."); }
}

function exactFields(value: JsonRecord, fields: readonly string[], path: string, issues: Issue[]): void {
  const expected = new Set(fields);
  for (const key of Object.keys(value)) if (!expected.has(key)) add(issues, "unknown-field", `${path}.${key}`, `Unknown field ${key}.`);
  for (const field of fields) if (!Object.hasOwn(value, field)) add(issues, "field-type-invalid", `${path}.${field}`, `Missing field ${field}.`);
}
function record(value: unknown, path: string, issues: Issue[]): JsonRecord | null { if (isRecord(value)) return value; add(issues, "field-type-invalid", path, "Value must be a plain object."); return null; }
function stringValue(value: unknown, path: string, max: number, issues: Issue[]): string | null { if (typeof value !== "string" || value.length === 0 || value.length > max) { add(issues, "field-value-invalid", path, `Value must be a string of 1-${max} characters.`); return null; } return value; }
function provenanceIssueCode(value: unknown, path: string, issues: Issue[]): RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationIssueCode | null { if (typeof value === "string" && PROVENANCE_ISSUE_CODES.has(value as RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationIssueCode)) return value as RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationIssueCode; add(issues, "field-value-invalid", path, "Unsupported provenance issue code."); return null; }
function add(issues: Issue[], code: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationIssueCode, path: string, message: string): void { issues.push({ code, path, message }); }
function isRecord(value: unknown): value is JsonRecord { return value !== null && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype; }
