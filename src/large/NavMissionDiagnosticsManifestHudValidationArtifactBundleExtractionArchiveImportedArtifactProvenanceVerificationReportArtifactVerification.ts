import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceResult,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenance.js";
import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationResult,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerification.js";
import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportResult,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReport.js";
import {
  RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_IMPORTED_ARCHIVE_PROVENANCE_VERIFICATION_REPORT_ARTIFACT_ORDER,
  RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_IMPORTED_ARCHIVE_PROVENANCE_VERIFICATION_REPORT_JSON_MIME_TYPE,
  runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportAddIssue,
  runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportDigestText,
  runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportEqualJson,
  runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportFinalizeResult,
  runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportIsSafeBasename,
  verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportText,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerification.js";
import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationOptions,
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationResult,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerification.js";
import {
  verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportTrustedAnchors,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportAnchorVerification.js";
import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportAnchoredVerificationOptions,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportAnchorVerification.js";

export type { RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportAnchoredVerificationOptions } from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportAnchorVerification.js";

const TEXT_MIME_TYPE = "text/plain;charset=utf-8" as const;
type Result = RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationResult;
type Report = RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportResult;
type Provenance = RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceResult;
type Verification = RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationResult;

export async function verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportArtifact(
  report: Report,
  expectedVerification?: Verification,
  expectedProvenance?: Provenance,
): Promise<Result> {
  if (report.status !== "created") return failure("expected-report-mismatch", report.error ?? "Verification report artifacts are unavailable.");
  if (!Array.isArray(report.artifacts) || report.artifacts.length !== 3) return failure("artifact-count-mismatch", "Verification report result must contain exactly three artifacts.");
  const textArtifact = report.artifacts[0];
  const jsonArtifact = report.artifacts[1];
  const checksumArtifact = report.artifacts[2];
  if (!textArtifact || !jsonArtifact || !checksumArtifact || textArtifact.kind !== RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_IMPORTED_ARCHIVE_PROVENANCE_VERIFICATION_REPORT_ARTIFACT_ORDER[0] || jsonArtifact.kind !== RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_IMPORTED_ARCHIVE_PROVENANCE_VERIFICATION_REPORT_ARTIFACT_ORDER[1] || checksumArtifact.kind !== RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_IMPORTED_ARCHIVE_PROVENANCE_VERIFICATION_REPORT_ARTIFACT_ORDER[2]) return failure("artifact-order-mismatch", "Verification report artifacts are not in fixed order.");

  const options: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportAnchoredVerificationOptions = {
    jsonFilename: jsonArtifact.filename,
    checksumArtifactText: checksumArtifact.text,
    checksumArtifactFilename: checksumArtifact.filename,
    textReportText: textArtifact.text,
    textReportFilename: textArtifact.filename,
    ...(expectedVerification === undefined ? {} : { expectedVerification }),
    ...(expectedProvenance === undefined ? {} : { expectedProvenance }),
  };
  const result = await verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportTextAnchored(jsonArtifact.text, options);
  await verifyEnvelope(report, result);
  runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportFinalizeResult(result);
  return result;
}

export async function verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportTextAnchored(
  text: string,
  options: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportAnchoredVerificationOptions = {},
): Promise<Result> {
  const coreOptions: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationOptions = {
    ...(options.maxTextBytes === undefined ? {} : { maxTextBytes: options.maxTextBytes }),
    ...(options.maxStringCharacters === undefined ? {} : { maxStringCharacters: options.maxStringCharacters }),
    ...(options.maxArrayEntries === undefined ? {} : { maxArrayEntries: options.maxArrayEntries }),
    ...(options.maxObjectFields === undefined ? {} : { maxObjectFields: options.maxObjectFields }),
    ...(options.maxDepth === undefined ? {} : { maxDepth: options.maxDepth }),
    ...(options.jsonFilename === undefined ? {} : { jsonFilename: options.jsonFilename }),
    ...(options.checksumArtifactText === undefined ? {} : { checksumArtifactText: options.checksumArtifactText }),
    ...(options.checksumArtifactFilename === undefined ? {} : { checksumArtifactFilename: options.checksumArtifactFilename }),
    ...(options.textReportText === undefined ? {} : { textReportText: options.textReportText }),
    ...(options.textReportFilename === undefined ? {} : { textReportFilename: options.textReportFilename }),
  };
  const result = await verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportText(text, coreOptions);
  if (result.document) {
    await verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportTrustedAnchors(text, result.checksumHex, result.document, options, result);
  } else {
    if (options.expectedReport) result.anchors.expectedReport = false;
    if (options.expectedVerification) result.anchors.verification = false;
    if (options.expectedProvenance) result.anchors.provenance = false;
  }
  runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportFinalizeResult(result);
  return result;
}

async function verifyEnvelope(report: Report, result: Result): Promise<void> {
  const subtle = globalThis.crypto?.subtle;
  const start = result.issues.length;
  if (!subtle) { result.checks.artifactEnvelope = false; return; }
  if (report.artifactCount !== 3 || report.artifacts.length !== 3) issue(result, "artifact-count-mismatch", "$.artifacts", "Report artifact count must be three.");
  let total = 0;
  for (let index = 0; index < report.artifacts.length; index += 1) {
    const artifact = report.artifacts[index];
    const kind = RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_IMPORTED_ARCHIVE_PROVENANCE_VERIFICATION_REPORT_ARTIFACT_ORDER[index];
    const path = `$.artifacts[${index}]`;
    if (!artifact || artifact.kind !== kind) { issue(result, "artifact-order-mismatch", path, "Report artifact kind is out of order."); continue; }
    const bytes = new TextEncoder().encode(artifact.text).byteLength;
    const checksum = await runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportDigestText(artifact.text, subtle);
    const mime = kind === "provenance-verification-report-json" ? RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_IMPORTED_ARCHIVE_PROVENANCE_VERIFICATION_REPORT_JSON_MIME_TYPE : TEXT_MIME_TYPE;
    total += bytes;
    if (!runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportIsSafeBasename(artifact.filename) || artifact.mimeType !== mime || artifact.bytes !== bytes) issue(result, "artifact-metadata-mismatch", path, "Report artifact filename, MIME type, or byte size is invalid.");
    if (artifact.checksumHex !== checksum) issue(result, "sha256-mismatch", `${path}.checksumHex`, "Report artifact SHA-256 does not match exact text.");
  }
  if (report.totalBytes !== total) issue(result, "artifact-metadata-mismatch", "$.totalBytes", "Report totalBytes does not match exact artifact bytes.");
  if (result.document && report.document && !runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportEqualJson(result.document, report.document)) issue(result, "expected-report-mismatch", "$.document", "Report document does not match its JSON artifact.");
  result.checks.artifactEnvelope = result.issues.length === start;
}

function issue(result: Result, code: Parameters<typeof runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportAddIssue>[1], path: string, message: string): void { runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportAddIssue(result.issues, code, path, message); }
function failure(code: Parameters<typeof runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportAddIssue>[1], message: string): Result { const result: Result = { valid:false, trust:"untrusted", document:null, canonicalText:null, bytes:0, checksumHex:null, issues:[], checks:{ parsed:false,schema:false,canonical:false,input:false,sourceArchive:false,result:false,verificationChecks:false,anchors:false,evidence:false,issues:false,jsonChecksum:false,textReport:false,artifactEnvelope:false }, anchors:{ expectedReport:null,verification:null,provenance:null,jsonChecksumArtifact:null,textReportArtifact:null } }; issue(result, code, "$", message); return result; }
