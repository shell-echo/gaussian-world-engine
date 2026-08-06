import {
  RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_IMPORTED_ARCHIVE_PROVENANCE_VERIFICATION_REPORT_SCHEMA,
  RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_IMPORTED_ARCHIVE_PROVENANCE_VERIFICATION_REPORT_SCHEMA_VERSION,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReport.js";
import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportDocument,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReport.js";
import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceTrust,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerification.js";
import {
  RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_IMPORTED_ARCHIVE_PROVENANCE_VERIFICATION_ANCHOR_FIELDS,
  RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_IMPORTED_ARCHIVE_PROVENANCE_VERIFICATION_CHECK_FIELDS,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerificationContract.js";
import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationChecks,
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationIssue,
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationIssueCode,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerificationContract.js";
import {
  runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportIsSafeBasename,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerificationSupport.js";
import {
  verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportEvidenceRelationships,
  verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportIssueEvidence,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerificationEvidence.js";

const SHA256_ALGORITHM = "SHA-256" as const;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const TOP_FIELDS = ["schema", "schemaVersion", "target", "input", "sourceArchive", "result", "checks", "anchors", "evidence", "issues"] as const;
const TARGET_FIELDS = ["packageIndex", "scope"] as const;
const INPUT_FIELDS = ["provenanceJsonFilename", "provenanceJsonMimeType", "declaredBytes", "exactBytes", "declaredChecksumHex", "exactChecksum", "envelope"] as const;
const CHECKSUM_FIELDS = ["algorithm", "input", "hex"] as const;
const ENVELOPE_FIELDS = ["filenameSafe", "mimeTypeMatches", "byteSizeMatches", "checksumMatches"] as const;
const SOURCE_FIELDS = ["filename", "exactBytes", "checksumHex"] as const;
const RESULT_FIELDS = ["valid", "trust", "issueCount"] as const;
const EVIDENCE_FIELDS = ["documentAvailable", "canonicalTextAvailable", "canonicalTextMatchesInput", "verificationChecksumAvailable", "issuesTruncated"] as const;
type Issue = RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationIssue;
type Checks = RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationChecks;
type JsonRecord = Record<string, unknown>;
export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationLimits {
  maxStringCharacters: number;
  maxArrayEntries: number;
  maxObjectFields: number;
  maxDepth: number;
}
interface Sections { input: JsonRecord | null; source: JsonRecord | null; result: JsonRecord | null; checks: JsonRecord | null; anchors: JsonRecord | null; evidence: JsonRecord | null; issues: unknown[] | null }

export function verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportDocument(
  value: JsonRecord,
  limits: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationLimits,
  issues: Issue[],
  checks: Checks,
): RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportDocument | null {
  validateBounds(value, "$", 0, limits, issues);
  exactFields(value, TOP_FIELDS, "$", issues);
  checks.schema = verifySchema(value, issues);
  const sections = readSections(value, issues);
  checks.input = verifyInput(sections.input, issues);
  checks.sourceArchive = verifySource(sections.source, issues);
  checks.result = verifyRecordedResult(sections.result, issues);
  checks.verificationChecks = verifyBooleanRecord(sections.checks, RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_IMPORTED_ARCHIVE_PROVENANCE_VERIFICATION_CHECK_FIELDS, "$.checks", issues);
  checks.anchors = verifyNullableBooleanRecord(sections.anchors, RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_IMPORTED_ARCHIVE_PROVENANCE_VERIFICATION_ANCHOR_FIELDS, "$.anchors", issues);
  checks.evidence = verifyEvidence(sections.evidence, issues);
  checks.issues = verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportIssueEvidence(sections, issues);
  verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportEvidenceRelationships(sections, checks, issues);
  return checks.schema && checks.input && checks.sourceArchive && checks.result && checks.verificationChecks && checks.anchors && checks.evidence && checks.issues
    ? value as unknown as RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportDocument
    : null;
}

function verifySchema(value: JsonRecord, issues: Issue[]): boolean {
  const start = issues.length;
  if (value.schema !== RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_IMPORTED_ARCHIVE_PROVENANCE_VERIFICATION_REPORT_SCHEMA) add(issues, "schema-mismatch", "$.schema", "Verification report schema mismatch.");
  if (value.schemaVersion !== RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_IMPORTED_ARCHIVE_PROVENANCE_VERIFICATION_REPORT_SCHEMA_VERSION) add(issues, "schema-version-mismatch", "$.schemaVersion", "Verification report schema version mismatch.");
  return issues.length === start;
}

function readSections(value: JsonRecord, issues: Issue[]): Sections {
  if (value.target !== null) {
    const target = record(value.target, "$.target", issues);
    if (target) {
      exactFields(target, TARGET_FIELDS, "$.target", issues);
      nullableString(target.scope, "$.target.scope", 64, issues);
      if (target.packageIndex !== null) nonNegativeInteger(target.packageIndex, "$.target.packageIndex", issues);
    }
  }
  const issueEntries = Array.isArray(value.issues) ? value.issues : null;
  if (!issueEntries) add(issues, "field-type-invalid", "$.issues", "issues must be an array.");
  return {
    input: record(value.input, "$.input", issues), source: record(value.sourceArchive, "$.sourceArchive", issues),
    result: record(value.result, "$.result", issues), checks: record(value.checks, "$.checks", issues),
    anchors: record(value.anchors, "$.anchors", issues), evidence: record(value.evidence, "$.evidence", issues), issues: issueEntries,
  };
}

function verifyInput(value: JsonRecord | null, issues: Issue[]): boolean {
  if (!value) return false;
  const start = issues.length;
  exactFields(value, INPUT_FIELDS, "$.input", issues);
  safeFilename(value.provenanceJsonFilename, "$.input.provenanceJsonFilename", issues);
  stringValue(value.provenanceJsonMimeType, "$.input.provenanceJsonMimeType", 255, issues);
  nonNegativeInteger(value.declaredBytes, "$.input.declaredBytes", issues);
  nonNegativeInteger(value.exactBytes, "$.input.exactBytes", issues);
  checksum(value.declaredChecksumHex, "$.input.declaredChecksumHex", issues);
  const exact = record(value.exactChecksum, "$.input.exactChecksum", issues);
  if (exact) {
    exactFields(exact, CHECKSUM_FIELDS, "$.input.exactChecksum", issues);
    if (exact.algorithm !== SHA256_ALGORITHM) add(issues, "field-value-invalid", "$.input.exactChecksum.algorithm", "Algorithm must be SHA-256.");
    if (exact.input !== "provenance-json-utf8") add(issues, "field-value-invalid", "$.input.exactChecksum.input", "Checksum input must be provenance-json-utf8.");
    checksum(exact.hex, "$.input.exactChecksum.hex", issues);
  }
  verifyBooleanRecord(record(value.envelope, "$.input.envelope", issues), ENVELOPE_FIELDS, "$.input.envelope", issues);
  return issues.length === start;
}

function verifySource(value: JsonRecord | null, issues: Issue[]): boolean {
  if (!value) return false;
  const start = issues.length;
  exactFields(value, SOURCE_FIELDS, "$.sourceArchive", issues);
  if (value.filename !== null) safeFilename(value.filename, "$.sourceArchive.filename", issues);
  if (value.exactBytes !== null) nonNegativeInteger(value.exactBytes, "$.sourceArchive.exactBytes", issues);
  if (value.checksumHex !== null) checksum(value.checksumHex, "$.sourceArchive.checksumHex", issues);
  const nulls = SOURCE_FIELDS.filter((field) => value[field] === null).length;
  if (nulls !== 0 && nulls !== SOURCE_FIELDS.length) add(issues, "source-archive-mismatch", "$.sourceArchive", "Source archive evidence must be complete or fully unavailable.");
  return issues.length === start;
}

function verifyRecordedResult(value: JsonRecord | null, issues: Issue[]): boolean {
  if (!value) return false;
  const start = issues.length;
  exactFields(value, RESULT_FIELDS, "$.result", issues);
  const valid = booleanValue(value.valid, "$.result.valid", issues);
  const trust = trustValue(value.trust, "$.result.trust", issues);
  const count = nonNegativeInteger(value.issueCount, "$.result.issueCount", issues);
  if (valid === true && trust === "untrusted") add(issues, "result-mismatch", "$.result.trust", "A valid recorded result cannot be untrusted.");
  if (valid === false && trust && trust !== "untrusted") add(issues, "result-mismatch", "$.result.trust", "An invalid recorded result must be untrusted.");
  if (valid === true && count !== 0) add(issues, "result-mismatch", "$.result.issueCount", "A valid recorded result must have zero issues.");
  if (valid === false && count === 0) add(issues, "result-mismatch", "$.result.issueCount", "An invalid recorded result must retain issues.");
  return issues.length === start;
}

function verifyEvidence(value: JsonRecord | null, issues: Issue[]): boolean {
  if (!value) return false;
  const start = issues.length;
  verifyBooleanRecord(value, EVIDENCE_FIELDS, "$.evidence", issues);
  if (value.canonicalTextMatchesInput === true && value.canonicalTextAvailable !== true) add(issues, "evidence-mismatch", "$.evidence.canonicalTextMatchesInput", "Canonical input match requires canonical text evidence.");
  return issues.length === start;
}

function verifyBooleanRecord(value: JsonRecord | null, fields: readonly string[], path: string, issues: Issue[]): boolean {
  if (!value) return false; const start = issues.length; exactFields(value, fields, path, issues);
  for (const field of fields) booleanValue(value[field], `${path}.${field}`, issues); return issues.length === start;
}
function verifyNullableBooleanRecord(value: JsonRecord | null, fields: readonly string[], path: string, issues: Issue[]): boolean {
  if (!value) return false; const start = issues.length; exactFields(value, fields, path, issues);
  for (const field of fields) if (value[field] !== null) booleanValue(value[field], `${path}.${field}`, issues); return issues.length === start;
}
function exactFields(value: JsonRecord, fields: readonly string[], path: string, issues: Issue[]): void {
  const expected = new Set(fields); for (const key of Object.keys(value)) if (!expected.has(key)) add(issues, "unknown-field", `${path}.${key}`, `Unknown field ${key}.`);
  for (const field of fields) if (!Object.hasOwn(value, field)) add(issues, "field-type-invalid", `${path}.${field}`, `Missing field ${field}.`);
}
function validateBounds(value: unknown, path: string, depth: number, limits: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationLimits, issues: Issue[]): void {
  if (depth > limits.maxDepth) { add(issues, "field-value-invalid", path, "Maximum nesting depth exceeded."); return; }
  if (typeof value === "string") { if (value.length > limits.maxStringCharacters) add(issues, "string-size-invalid", path, "String limit exceeded."); return; }
  if (Array.isArray(value)) { if (value.length > limits.maxArrayEntries) { add(issues, "array-size-invalid", path, "Array limit exceeded."); return; } value.forEach((entry, index) => validateBounds(entry, `${path}[${index}]`, depth + 1, limits, issues)); return; }
  if (isRecord(value)) { const keys = Object.keys(value); if (keys.length > limits.maxObjectFields) { add(issues, "field-value-invalid", path, "Object field limit exceeded."); return; } keys.forEach((key) => validateBounds(value[key], `${path}.${key}`, depth + 1, limits, issues)); }
}
function record(value: unknown, path: string, issues: Issue[]): JsonRecord | null { if (isRecord(value)) return value; add(issues, "field-type-invalid", path, "Value must be a plain object."); return null; }
function booleanValue(value: unknown, path: string, issues: Issue[]): boolean | null { if (typeof value === "boolean") return value; add(issues, "field-type-invalid", path, "Value must be boolean."); return null; }
function stringValue(value: unknown, path: string, max: number, issues: Issue[]): string | null { if (typeof value !== "string" || value.length === 0 || value.length > max) { add(issues, "field-value-invalid", path, `Value must be a string of 1-${max} characters.`); return null; } return value; }
function nullableString(value: unknown, path: string, max: number, issues: Issue[]): string | null { return value === null ? null : stringValue(value, path, max, issues); }
function nonNegativeInteger(value: unknown, path: string, issues: Issue[]): number | null { if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) { add(issues, "field-type-invalid", path, "Value must be a non-negative safe integer."); return null; } return value; }
function safeFilename(value: unknown, path: string, issues: Issue[]): string | null { const filename = stringValue(value, path, 255, issues); if (filename && !runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportIsSafeBasename(filename)) { add(issues, "field-value-invalid", path, "Filename must be a safe basename."); return null; } return filename; }
function checksum(value: unknown, path: string, issues: Issue[]): string | null { if (typeof value !== "string" || !SHA256_PATTERN.test(value)) { add(issues, "field-value-invalid", path, "Value must be lowercase SHA-256 hex."); return null; } return value; }
function trustValue(value: unknown, path: string, issues: Issue[]): RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceTrust | null { if (value === "anchored" || value === "self-consistent" || value === "untrusted") return value; add(issues, "field-value-invalid", path, "Invalid trust value."); return null; }
function add(issues: Issue[], code: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationIssueCode, path: string, message: string): void { issues.push({ code, path, message }); }
function isRecord(value: unknown): value is JsonRecord { return value !== null && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype; }
