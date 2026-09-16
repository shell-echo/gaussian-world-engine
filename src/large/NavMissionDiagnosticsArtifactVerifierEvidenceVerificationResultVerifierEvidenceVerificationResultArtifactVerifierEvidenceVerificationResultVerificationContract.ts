import type {RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultEvidence as Source} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultContract.js";
import type {RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResult as Verification} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationContract.js";
import type {RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceResult as ExpectedSource} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceContract.js";
import type {RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportTrust as Trust} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerification.js";

export type RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultVerificationIssueCode =
  | "text-invalid" | "text-size-invalid" | "json-parse-failed" | "document-type-invalid"
  | "field-type-invalid" | "field-value-invalid" | "array-size-invalid" | "string-size-invalid"
  | "schema-mismatch" | "schema-version-mismatch" | "unknown-field" | "canonical-json-mismatch"
  | "input-envelope-mismatch" | "recorded-evidence-mismatch" | "result-mismatch" | "verification-check-mismatch"
  | "anchor-mismatch" | "evidence-mismatch" | "issue-count-mismatch" | "issue-evidence-mismatch"
  | "artifact-count-mismatch" | "artifact-order-mismatch" | "artifact-metadata-mismatch"
  | "text-result-mismatch" | "checksum-artifact-invalid" | "expected-verification-mismatch"
  | "expected-source-mismatch" | "expected-input-checksum-mismatch" | "sha256-mismatch" | "crypto-unavailable";

export interface RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultVerificationIssue {
  code: RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultVerificationIssueCode;
  path: string;
  message: string;
}

export interface RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultVerificationChecks {
  parsed: boolean;
  schema: boolean;
  canonical: boolean;
  input: boolean;
  recordedEvidence: boolean;
  result: boolean;
  verificationChecks: boolean;
  anchors: boolean;
  evidence: boolean;
  issues: boolean;
  jsonChecksum: boolean;
  textResult: boolean;
  artifactEnvelope: boolean;
}

export interface RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultVerificationAnchors {
  expectedVerification: boolean | null;
  expectedSource: boolean | null;
  inputArtifactVerifierEvidenceChecksum: boolean | null;
  jsonChecksumArtifact: boolean | null;
  textResultArtifact: boolean | null;
}

export interface RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultVerificationResult {
  valid: boolean;
  trust: Trust;
  document: Source["document"];
  canonicalText: string | null;
  bytes: number;
  checksumHex: string | null;
  issues: RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultVerificationIssue[];
  checks: RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultVerificationChecks;
  anchors: RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultVerificationAnchors;
}

export interface RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultVerificationOptions {
  maxTextBytes?: number;
  maxStringCharacters?: number;
  maxArrayEntries?: number;
  maxObjectFields?: number;
  maxDepth?: number;
  jsonFilename?: string;
  checksumArtifactText?: string;
  checksumArtifactFilename?: string;
  textResultText?: string;
  textResultFilename?: string;
  expectedInputArtifactVerifierEvidenceChecksumHex?: string;
}

export interface RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultAnchoredVerificationOptions extends RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultVerificationOptions {
  expectedVerification?: Verification;
  expectedSource?: ExpectedSource;
}

export interface RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultVerificationControlOptions {
  expectedVerification?: Verification;
  expectedSource?: ExpectedSource;
  expectedInputArtifactVerifierEvidenceChecksumHex?: string;
  onVerify?: (
    result: RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultVerificationResult,
    source: Source,
  ) => void;
  onStatus?: (message: string) => void;
}
