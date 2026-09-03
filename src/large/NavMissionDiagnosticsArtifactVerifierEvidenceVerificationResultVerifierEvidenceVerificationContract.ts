import type {RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceResult as Evidence} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceContract.js";
import type {RuntimeNavMissionDiagnosticsVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultVerificationResult as Verification} from "./NavMissionDiagnosticsVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultVerificationContract.js";
import type {RuntimeNavMissionDiagnosticsVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultEvidence as Source} from "./NavMissionDiagnosticsVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultContract.js";
import type {RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportTrust as Trust} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerification.js";

export type RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationIssueCode =
  | "text-invalid" | "text-size-invalid" | "json-parse-failed" | "document-type-invalid"
  | "field-type-invalid" | "field-value-invalid" | "array-size-invalid" | "string-size-invalid"
  | "schema-mismatch" | "schema-version-mismatch" | "unknown-field" | "canonical-json-mismatch"
  | "input-envelope-mismatch" | "recorded-result-mismatch" | "result-mismatch" | "verification-check-mismatch"
  | "anchor-mismatch" | "evidence-mismatch" | "issue-count-mismatch" | "issue-evidence-mismatch"
  | "artifact-count-mismatch" | "artifact-order-mismatch" | "artifact-metadata-mismatch"
  | "text-evidence-mismatch" | "checksum-artifact-invalid" | "expected-verification-mismatch"
  | "expected-source-mismatch" | "expected-input-checksum-mismatch" | "sha256-mismatch" | "crypto-unavailable";

export interface RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationIssue {
  code: RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationIssueCode;
  path: string;
  message: string;
}

export interface RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationChecks {
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

export interface RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationAnchors {
  expectedVerification: boolean | null;
  expectedSource: boolean | null;
  inputResultChecksum: boolean | null;
  jsonChecksumArtifact: boolean | null;
  textEvidenceArtifact: boolean | null;
}

export interface RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResult {
  valid: boolean;
  trust: Trust;
  document: Evidence["document"];
  canonicalText: string | null;
  bytes: number;
  checksumHex: string | null;
  issues: RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationIssue[];
  checks: RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationChecks;
  anchors: RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationAnchors;
}

export interface RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationOptions {
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

export interface RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceAnchoredVerificationOptions extends RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationOptions {
  expectedVerification?: Verification;
  expectedSource?: Source;
}

export interface RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationControlOptions {
  expectedVerification?: Verification;
  expectedSource?: Source;
  expectedInputResultChecksumHex?: string;
  onVerify?: (result: RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResult, evidence: Evidence) => void;
  onStatus?: (message: string) => void;
}
