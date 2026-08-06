import type { RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationIssue as SourceIssue, RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationIssueCode as Code } from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerification.js";
import type { RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationEvidenceIssue as Issue } from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerificationEvidenceContract.js";

const messages: Record<Code,string> = {
  "text-invalid":"Verification report text input is invalid.", "text-size-invalid":"Verification report text exceeds the configured size limit.",
  "json-parse-failed":"Verification report text is not valid JSON.", "document-type-invalid":"Verification report root is not a plain JSON object.",
  "field-type-invalid":"A required verification report field has an invalid type or is missing.", "field-value-invalid":"A verification report field contains an invalid value.",
  "array-size-invalid":"A verification report array exceeds the configured entry limit.", "string-size-invalid":"A verification report string exceeds the configured character limit.",
  "schema-mismatch":"Verification report schema does not match the required schema.", "schema-version-mismatch":"Verification report schema version does not match the required version.",
  "unknown-field":"Verification report contains a field that is not allowed by the fixed schema.", "canonical-json-mismatch":"Verification report JSON does not match the required canonical serialization.",
  "input-envelope-mismatch":"Recorded verification report input envelope is inconsistent.", "source-archive-mismatch":"Recorded source archive evidence is inconsistent.",
  "result-mismatch":"Recorded provenance verification result relationship is inconsistent.", "verification-check-mismatch":"Recorded provenance verification checks are inconsistent.",
  "anchor-mismatch":"Recorded provenance verification anchors are inconsistent.", "evidence-mismatch":"Recorded verification evidence relationships are inconsistent.",
  "issue-count-mismatch":"Recorded verification issue count is inconsistent.", "issue-evidence-mismatch":"Recorded verification issue evidence is inconsistent.",
  "artifact-count-mismatch":"Verification report artifact count is invalid.", "artifact-order-mismatch":"Verification report artifacts are not in the required fixed order.",
  "artifact-metadata-mismatch":"Verification report artifact metadata is inconsistent.", "text-report-mismatch":"Verification report text artifact does not match the report document.",
  "checksum-artifact-invalid":"Verification report JSON SHA-256 artifact is invalid.", "expected-report-mismatch":"Verification report input does not match the expected report result.",
  "expected-verification-mismatch":"Verification report evidence does not match the expected provenance verification result.", "expected-provenance-mismatch":"Verification report input does not match the expected provenance result.",
  "sha256-mismatch":"A verification report SHA-256 value does not match exact retained text.", "crypto-unavailable":"Web Crypto SHA-256 was unavailable during verification report verification."
};
export function normalizeIssue(issue:SourceIssue):Issue { const path=typeof issue.path==="string"&&issue.path.length?issue.path:"$"; return {code:issue.code,path:path.slice(0,2048),message:messages[issue.code]}; }
