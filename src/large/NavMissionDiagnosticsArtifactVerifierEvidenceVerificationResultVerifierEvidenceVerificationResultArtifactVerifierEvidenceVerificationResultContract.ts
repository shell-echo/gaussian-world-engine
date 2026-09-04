import type {RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceResult as Source} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceContract.js";
import type {
  RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationAnchors as Anchors,
  RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationChecks as Checks,
  RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationIssueCode as Code,
  RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResult as Verification,
} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationContract.js";
import type {RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportTrust as Trust} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerification.js";

export const RUNTIME_NAV_MISSION_DIAGNOSTICS_ARTIFACT_VERIFIER_EVIDENCE_VERIFICATION_RESULT_VERIFIER_EVIDENCE_VERIFICATION_RESULT_ARTIFACT_VERIFIER_EVIDENCE_VERIFICATION_RESULT_SCHEMA = "splat-world-engine/mission-diagnostics-policy-manifest-provenance-verification-report-verification-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence-verification-result-artifact-verifier-evidence-verification-result" as const;
export const RUNTIME_NAV_MISSION_DIAGNOSTICS_ARTIFACT_VERIFIER_EVIDENCE_VERIFICATION_RESULT_VERIFIER_EVIDENCE_VERIFICATION_RESULT_ARTIFACT_VERIFIER_EVIDENCE_VERIFICATION_RESULT_SCHEMA_VERSION = 1 as const;
export const RUNTIME_NAV_MISSION_DIAGNOSTICS_ARTIFACT_VERIFIER_EVIDENCE_VERIFICATION_RESULT_VERIFIER_EVIDENCE_VERIFICATION_RESULT_ARTIFACT_VERIFIER_EVIDENCE_VERIFICATION_RESULT_ORDER = [
  "result-verifier-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence-verification-result-artifact-verifier-evidence-verification-result-text",
  "result-verifier-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence-verification-result-artifact-verifier-evidence-verification-result-json",
  "result-verifier-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence-verification-result-artifact-verifier-evidence-verification-result-json-sha256",
] as const;

export type RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultStatus =
  "created" | "evidence-unavailable" | "input-too-large" | "crypto-unavailable" | "result-error";
export type RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultArtifactKind =
  (typeof RUNTIME_NAV_MISSION_DIAGNOSTICS_ARTIFACT_VERIFIER_EVIDENCE_VERIFICATION_RESULT_VERIFIER_EVIDENCE_VERIFICATION_RESULT_ARTIFACT_VERIFIER_EVIDENCE_VERIFICATION_RESULT_ORDER)[number];

export interface RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultIssue {
  code: Code;
  path: string;
  message: string;
}

export interface RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultDocument {
  schema: typeof RUNTIME_NAV_MISSION_DIAGNOSTICS_ARTIFACT_VERIFIER_EVIDENCE_VERIFICATION_RESULT_VERIFIER_EVIDENCE_VERIFICATION_RESULT_ARTIFACT_VERIFIER_EVIDENCE_VERIFICATION_RESULT_SCHEMA;
  schemaVersion: 1;
  target: unknown;
  input: {
    artifactVerifierEvidenceJsonFilename: string;
    artifactVerifierEvidenceJsonMimeType: string;
    declaredBytes: number;
    exactBytes: number;
    declaredChecksumHex: string;
    exactChecksum: {
      algorithm: "SHA-256";
      input: "artifact-verifier-evidence-verification-result-verifier-evidence-verification-result-artifact-verifier-evidence-json-utf8";
      hex: string;
    };
    envelope: {
      filenameSafe: boolean;
      mimeTypeMatches: boolean;
      byteSizeMatches: boolean;
      checksumMatches: boolean;
    };
  };
  recordedEvidence: {
    schema: string | null;
    schemaVersion: number | null;
    verifierEvidenceVerificationResultArtifactVerificationValid: boolean | null;
    verifierEvidenceVerificationResultArtifactVerificationTrust: Trust | null;
  };
  result: {
    valid: boolean;
    trust: Trust;
    issueCount: number;
  };
  checks: Checks;
  anchors: Anchors;
  evidence: {
    documentAvailable: boolean;
    canonicalTextAvailable: boolean;
    canonicalTextMatchesInput: boolean;
    verificationChecksumAvailable: boolean;
    verificationChecksumMatchesInput: boolean;
    issuesTruncated: boolean;
  };
  issues: RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultIssue[];
}

export interface RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultArtifact {
  kind: RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultArtifactKind;
  filename: string;
  mimeType: "text/plain;charset=utf-8" | "application/json;charset=utf-8";
  bytes: number;
  checksumHex: string;
  text: string;
}

export interface RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultEvidence {
  status: RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultStatus;
  verification: Verification;
  source: Source;
  document: RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultDocument | null;
  artifactCount: number;
  totalBytes: number;
  artifacts: RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultArtifact[];
  error: string | null;
}

export interface RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultActionsOptions {
  maxPreviewCharacters?: number;
  onCreate?: (result: RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultEvidence) => void;
  onArtifactDownload?: (
    artifact: RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultArtifact,
    result: RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultEvidence,
  ) => void;
  onDownloadAll?: (result: RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultEvidence) => void;
  onArtifactCopy?: (
    artifact: RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultArtifact,
    result: RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultEvidence,
  ) => void;
  onStatus?: (message: string) => void;
}
