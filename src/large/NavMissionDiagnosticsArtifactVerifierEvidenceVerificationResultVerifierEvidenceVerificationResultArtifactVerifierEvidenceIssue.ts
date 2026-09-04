import type {
  RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultVerificationIssue as Source,
  RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultVerificationIssueCode as Code,
} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultVerificationContract.js";
import type {RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceIssue as Issue} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceContract.js";

const MESSAGE: Record<Code, string> = {
  "text-invalid": "Verifier-evidence verification-result text input is invalid.",
  "text-size-invalid": "Verifier-evidence verification-result text exceeds the configured size limit.",
  "json-parse-failed": "Verifier-evidence verification-result text is not valid JSON.",
  "document-type-invalid": "Verifier-evidence verification-result root is not a plain JSON object.",
  "field-type-invalid": "A required verification-result field has an invalid type or is missing.",
  "field-value-invalid": "A verification-result field contains an invalid value.",
  "array-size-invalid": "A verification-result array exceeds the configured entry limit.",
  "string-size-invalid": "A verification-result string exceeds the configured character limit.",
  "schema-mismatch": "Verification-result schema does not match the required schema.",
  "schema-version-mismatch": "Verification-result schema version does not match the required version.",
  "unknown-field": "Verification-result contains a field not allowed by the fixed schema.",
  "canonical-json-mismatch": "Verification-result JSON is not canonical.",
  "input-envelope-mismatch": "Verification-result input envelope is inconsistent.",
  "recorded-evidence-mismatch": "Recorded verifier-evidence metadata is inconsistent.",
  "result-mismatch": "Recorded verification-result artifact verification relationship is inconsistent.",
  "verification-check-mismatch": "Recorded verification-result artifact verification checks are inconsistent.",
  "anchor-mismatch": "Recorded verification-result artifact verification anchors are inconsistent.",
  "evidence-mismatch": "Recorded verification-result evidence relationships are inconsistent.",
  "issue-count-mismatch": "Recorded verification-result artifact verification issue count is inconsistent.",
  "issue-evidence-mismatch": "Recorded verification-result artifact verification issue evidence is inconsistent.",
  "artifact-count-mismatch": "Verification-result artifact count is invalid.",
  "artifact-order-mismatch": "Verification-result artifacts are not in fixed order.",
  "artifact-metadata-mismatch": "Verification-result artifact metadata is inconsistent.",
  "text-result-mismatch": "Verification-result text artifact does not match the document.",
  "checksum-artifact-invalid": "Verification-result JSON SHA-256 artifact is invalid.",
  "expected-verification-mismatch": "Verification-result does not match the expected verifier-evidence verification.",
  "expected-source-mismatch": "Verification-result does not match the expected verifier-evidence source.",
  "expected-input-checksum-mismatch": "Verification-result input checksum does not match the trusted anchor.",
  "sha256-mismatch": "A verification-result SHA-256 value does not match exact text.",
  "crypto-unavailable": "Web Crypto SHA-256 was unavailable during verification-result artifact verification.",
};

export function normalizeIssue(issue: Source): Issue {
  const path = typeof issue.path === "string" && issue.path.length ? issue.path : "$";
  return {code: issue.code, path: path.slice(0, 2048), message: MESSAGE[issue.code]};
}
