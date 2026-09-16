import type {
  RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationIssue as Source,
  RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationIssueCode as Code,
} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationContract.js";
import type {RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultIssue as Issue} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultContract.js";

const MESSAGE: Record<Code, string> = {
  "text-invalid": "Artifact-verifier evidence text input is invalid.",
  "text-size-invalid": "Artifact-verifier evidence text exceeds the configured size limit.",
  "json-parse-failed": "Artifact-verifier evidence text is not valid JSON.",
  "document-type-invalid": "Artifact-verifier evidence root is not a plain JSON object.",
  "field-type-invalid": "A required artifact-verifier evidence field has an invalid type or is missing.",
  "field-value-invalid": "An artifact-verifier evidence field contains an invalid value.",
  "array-size-invalid": "An artifact-verifier evidence array exceeds the configured entry limit.",
  "string-size-invalid": "An artifact-verifier evidence string exceeds the configured character limit.",
  "schema-mismatch": "Artifact-verifier evidence schema does not match the required schema.",
  "schema-version-mismatch": "Artifact-verifier evidence schema version does not match the required version.",
  "unknown-field": "Artifact-verifier evidence contains a field not allowed by the fixed schema.",
  "canonical-json-mismatch": "Artifact-verifier evidence JSON is not canonical.",
  "input-envelope-mismatch": "Artifact-verifier evidence input envelope is inconsistent.",
  "recorded-result-mismatch": "Recorded artifact-verifier evidence result metadata is inconsistent.",
  "result-mismatch": "Recorded artifact-verifier evidence verification relationship is inconsistent.",
  "verification-check-mismatch": "Recorded artifact-verifier evidence verification checks are inconsistent.",
  "anchor-mismatch": "Recorded artifact-verifier evidence verification anchors are inconsistent.",
  "evidence-mismatch": "Recorded artifact-verifier evidence relationships are inconsistent.",
  "issue-count-mismatch": "Recorded artifact-verifier evidence verification issue count is inconsistent.",
  "issue-evidence-mismatch": "Recorded artifact-verifier evidence verification issue evidence is inconsistent.",
  "artifact-count-mismatch": "Artifact-verifier evidence artifact count is invalid.",
  "artifact-order-mismatch": "Artifact-verifier evidence artifacts are not in fixed order.",
  "artifact-metadata-mismatch": "Artifact-verifier evidence artifact metadata is inconsistent.",
  "text-evidence-mismatch": "Artifact-verifier evidence text artifact does not match the document.",
  "checksum-artifact-invalid": "Artifact-verifier evidence JSON SHA-256 artifact is invalid.",
  "expected-verification-mismatch": "Artifact-verifier evidence does not match the expected verification result.",
  "expected-source-mismatch": "Artifact-verifier evidence does not match the expected source artifact set.",
  "expected-input-checksum-mismatch": "Artifact-verifier evidence input checksum does not match the trusted anchor.",
  "sha256-mismatch": "An artifact-verifier evidence SHA-256 value does not match exact text.",
  "crypto-unavailable": "Web Crypto SHA-256 was unavailable during artifact-verifier evidence verification.",
};

export function normalizeIssue(issue: Source): Issue {
  const path = typeof issue.path === "string" && issue.path.length ? issue.path : "$";
  return {code: issue.code, path: path.slice(0, 2048), message: MESSAGE[issue.code]!};
}
