import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceArtifact,
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceResult,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenance.js";
import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationChecks,
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationAnchors,
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationIssue,
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationResult,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerification.js";
import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportArtifact,
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportDocument,
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportResult,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReport.js";
import {
  RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_IMPORTED_ARCHIVE_PROVENANCE_VERIFICATION_REPORT_JSON_MIME_TYPE,
  runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportAddIssue,
  runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportDigestText,
  runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportEqualJson,
  runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportIsSafeBasename,
  runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportNormalizeChecksum,
  runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportNormalizeInteger,
  runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportNormalizeIssuePath,
  runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportNormalizeString,
  runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportStableIssueMessage,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerification.js";
import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationOptions,
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationResult,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerification.js";

const MAX_REPORTED_ISSUES = 512;
type Result = RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationResult;
type Report = RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportResult;
type Provenance = RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceResult;
type Verification = RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationResult;

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportAnchoredVerificationOptions
  extends RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationOptions {
  expectedReport?: Report;
  expectedVerification?: Verification;
  expectedProvenance?: Provenance;
}

export async function verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportTrustedAnchors(
  text: string,
  checksumHex: string | null,
  document: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportDocument,
  options: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportAnchoredVerificationOptions,
  result: Result,
): Promise<void> {
  await verifyExpectedReport(text, checksumHex, options.expectedReport, result);
  verifyExpectedVerification(document, options.expectedVerification, options.expectedProvenance, result);
  const subtle = globalThis.crypto?.subtle;
  if (subtle) await verifyExpectedProvenance(document, options.expectedProvenance, subtle, result);
  else if (options.expectedProvenance) result.anchors.provenance = false;
}

async function verifyExpectedReport(text: string, checksumHex: string | null, expected: Report | undefined, result: Result): Promise<void> {
  if (!expected) return;
  const artifact = expected.status === "created" ? singleReportArtifact(expected.artifacts, "provenance-verification-report-json") : null;
  const valid = !!artifact && checksumHex !== null && artifact.text === text && artifact.checksumHex === checksumHex;
  if (!valid) issue(result, "expected-report-mismatch", "$", "Verification report JSON does not match the expected report result.");
  result.anchors.expectedReport = valid;
}

function verifyExpectedVerification(document: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportDocument, expected: Verification | undefined, provenance: Provenance | undefined, result: Result): void {
  if (!expected) return;
  if (!Array.isArray(expected.issues)) { issue(result, "expected-verification-mismatch", "$", "Expected verification issues are invalid."); result.anchors.verification = false; return; }
  const expectedIssues = expected.issues.slice(0, MAX_REPORTED_ISSUES).map(normalizeIssue);
  const canonicalRelationship = provenance === undefined || document.evidence.canonicalTextMatchesInput === (typeof expected.canonicalText === "string" && expected.canonicalText === singleProvenanceJsonArtifact(provenance.artifacts)?.text);
  const valid =
    document.result.valid === expected.valid && document.result.trust === expected.trust && document.result.issueCount === expected.issues.length &&
    runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportEqualJson(document.checks, copyChecks(expected.checks)) &&
    runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportEqualJson(document.anchors, copyAnchors(expected.anchors)) &&
    document.evidence.documentAvailable === (expected.document !== null) &&
    document.evidence.canonicalTextAvailable === (typeof expected.canonicalText === "string") && canonicalRelationship &&
    document.evidence.verificationChecksumAvailable === (typeof expected.checksumHex === "string") &&
    document.evidence.issuesTruncated === (expected.issues.length > MAX_REPORTED_ISSUES) &&
    runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportEqualJson(document.issues, expectedIssues);
  if (!valid) issue(result, "expected-verification-mismatch", "$", "Report evidence does not match the expected provenance verification result.");
  result.anchors.verification = valid;
}

async function verifyExpectedProvenance(document: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportDocument, expected: Provenance | undefined, subtle: SubtleCrypto, result: Result): Promise<void> {
  if (!expected) return;
  const artifact = expected.status === "created" ? singleProvenanceJsonArtifact(expected.artifacts) : null;
  if (!artifact) { issue(result, "expected-provenance-mismatch", "$.input", "Expected provenance JSON artifact is unavailable."); result.anchors.provenance = false; return; }
  const text = typeof artifact.text === "string" ? artifact.text : "";
  const filename = typeof artifact.filename === "string" ? artifact.filename : "";
  const mimeType = typeof artifact.mimeType === "string" ? artifact.mimeType : "";
  const declaredBytes = typeof artifact.bytes === "number" ? artifact.bytes : -1;
  const declaredChecksum = typeof artifact.checksumHex === "string" ? artifact.checksumHex : "";
  const exactBytes = new TextEncoder().encode(text).byteLength;
  const exactChecksum = await runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportDigestText(text, subtle);
  const safe = runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportIsSafeBasename(filename);
  const source = sourceArchive(expected.document);
  const valid =
    document.input.provenanceJsonFilename === (safe ? filename : "mission-diagnostics-policy-manifest.verified-import-provenance.json") &&
    document.input.provenanceJsonMimeType === runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportNormalizeString(mimeType, 255, "application/octet-stream") &&
    document.input.declaredBytes === runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportNormalizeInteger(declaredBytes) &&
    document.input.exactBytes === exactBytes && document.input.declaredChecksumHex === runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportNormalizeChecksum(declaredChecksum) &&
    document.input.exactChecksum.hex === exactChecksum && document.input.envelope.filenameSafe === safe &&
    document.input.envelope.mimeTypeMatches === (mimeType === RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_IMPORTED_ARCHIVE_PROVENANCE_VERIFICATION_REPORT_JSON_MIME_TYPE) &&
    document.input.envelope.byteSizeMatches === (declaredBytes === exactBytes) && document.input.envelope.checksumMatches === (declaredChecksum === exactChecksum) &&
    runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportEqualJson(document.target, normalizeTarget(target(expected.document))) &&
    document.sourceArchive.filename === source.filename && document.sourceArchive.exactBytes === source.exactBytes && document.sourceArchive.checksumHex === source.checksumHex;
  if (!valid) issue(result, "expected-provenance-mismatch", "$", "Report input does not match the expected provenance result.");
  result.anchors.provenance = valid;
}


function normalizeIssue(value: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationIssue): { code: typeof value.code; path: string; message: string } {
  return { code: value.code, path: runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportNormalizeIssuePath(value.path), message: runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportStableIssueMessage(value.code) };
}
function copyChecks(value: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationChecks): RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationChecks { return { parsed:value.parsed, schema:value.schema, canonical:value.canonical, sourceArchive:value.sourceArchive, verification:value.verification, trustedExtraction:value.trustedExtraction, importedExtraction:value.importedExtraction, relationships:value.relationships, jsonChecksum:value.jsonChecksum }; }
function copyAnchors(value: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationAnchors): RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationAnchors { return { expectedProvenance:value.expectedProvenance, entryExtraction:value.entryExtraction, sourceArchiveChecksum:value.sourceArchiveChecksum, jsonChecksumArtifact:value.jsonChecksumArtifact }; }
function singleReportArtifact(artifacts: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportArtifact[], kind: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportArtifact["kind"]): RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportArtifact | null { if (!Array.isArray(artifacts)) return null; const matches = artifacts.filter((artifact) => artifact?.kind === kind); return matches.length === 1 ? matches[0] ?? null : null; }
function singleProvenanceJsonArtifact(artifacts: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceArtifact[]): RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceArtifact | null { if (!Array.isArray(artifacts)) return null; const matches = artifacts.filter((artifact) => artifact?.kind === "provenance-report-json"); return matches.length === 1 ? matches[0] ?? null : null; }
function target(document: unknown): unknown { return record(document) && Object.hasOwn(document, "target") ? document.target : null; }
function normalizeTarget(value: unknown): unknown { if (!record(value)) return null; const scope = typeof value.scope === "string" && value.scope.length <= 64 ? value.scope : null; const packageIndex = value.packageIndex === null || (typeof value.packageIndex === "number" && Number.isSafeInteger(value.packageIndex) && value.packageIndex >= 0) ? value.packageIndex : null; return { packageIndex, scope }; }
function sourceArchive(document: unknown): { filename: string | null; exactBytes: number | null; checksumHex: string | null } { if (!record(document) || !record(document.sourceArchive)) return { filename:null, exactBytes:null, checksumHex:null }; const source = document.sourceArchive; return { filename:typeof source.filename === "string" && runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportIsSafeBasename(source.filename) ? source.filename : null, exactBytes:typeof source.exactBytes === "number" && Number.isSafeInteger(source.exactBytes) && source.exactBytes >= 0 ? source.exactBytes : null, checksumHex:record(source.checksum) && typeof source.checksum.hex === "string" && /^[0-9a-f]{64}$/.test(source.checksum.hex) ? source.checksum.hex : null }; }
function record(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === "object" && !Array.isArray(value); }
function issue(result: Result, code: Parameters<typeof runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportAddIssue>[1], path: string, message: string): void { runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportAddIssue(result.issues, code, path, message); }
