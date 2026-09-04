import type {RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceResult as Evidence} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceContract.js";
import type {RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultVerificationResult as Verification} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultVerificationContract.js";
import type {RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultEvidence as ExpectedSource} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultContract.js";
import type {RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportTrust as Trust} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerification.js";

export type RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationIssueCode =
  | "text-invalid" | "text-size-invalid" | "json-parse-failed" | "document-type-invalid"
  | "field-type-invalid" | "field-value-invalid" | "array-size-invalid" | "string-size-invalid"
  | "schema-mismatch" | "schema-version-mismatch" | "unknown-field" | "canonical-json-mismatch"
  | "input-envelope-mismatch" | "recorded-result-mismatch" | "result-mismatch" | "verification-check-mismatch"
  | "anchor-mismatch" | "evidence-mismatch" | "issue-count-mismatch" | "issue-evidence-mismatch"
  | "artifact-count-mismatch" | "artifact-order-mismatch" | "artifact-metadata-mismatch"
  | "text-evidence-mismatch" | "checksum-artifact-invalid" | "expected-verification-mismatch"
  | "expected-source-mismatch" | "expected-input-checksum-mismatch" | "sha256-mismatch" | "crypto-unavailable";

export interface RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationIssue {
  code: RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationIssueCode;
  path: string;
  message: string;
}

export interface RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationChecks {
  parsed: boolean;
  schema: boolean;
  canonical: boolean;
  input: boolean;
  recordedResult: boolean;
  result: boolean;
  verificationChecks: boolean;
  anchors: boolean;
  evidence: boolean;
  issues: boolean;
  jsonChecksum: boolean;
  textEvidence: boolean;
  artifactEnvelope: boolean;
}

export interface RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationAnchors {
  expectedVerification: boolean | null;
  expectedSource: boolean | null;
  inputResultChecksum: boolean | null;
  jsonChecksumArtifact: boolean | null;
  textEvidenceArtifact: boolean | null;
}

export interface RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResult {
  valid: boolean;
  trust: Trust;
  document: Evidence["document"];
  canonicalText: string | null;
  bytes: number;
  checksumHex: string | null;
  issues: RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationIssue[];
  checks: RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationChecks;
  anchors: RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationAnchors;
}

export interface RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationOptions {
  maxTextBytes?: number;
  maxStringCharacters?: number;
  maxArrayEntries?: number;
  maxObjectFields?: number;
  maxDepth?: number;
  jsonFilename?: string;
  checksumArtifactText?: string;
  checksumArtifactFilename?: string;
  textEvidenceText?: string;
  textEvidenceFilename?: string;
  expectedInputResultChecksumHex?: string;
}

export interface RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceAnchoredVerificationOptions extends RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationOptions {
  expectedVerification?: Verification;
  expectedSource?: ExpectedSource;
}

export interface RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationControlOptions {
  expectedVerification?: Verification;
  expectedSource?: ExpectedSource;
  expectedInputResultChecksumHex?: string;
  onVerify?: (
    result: RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResult,
    evidence: Evidence,
  ) => void;
  onStatus?: (message: string) => void;
}
