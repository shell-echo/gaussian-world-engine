import type {RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultEvidence as Source} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultContract.js";
import type {RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResult as Verification} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationContract.js";
import type {RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceResult as ExpectedSource} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceContract.js";
import type {RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportTrust as Trust} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerification.js";

export type RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultVerificationIssueCode=
  "text-invalid"|"text-size-invalid"|"json-parse-failed"|"document-type-invalid"|
  "field-type-invalid"|"field-value-invalid"|"array-size-invalid"|"string-size-invalid"|
  "schema-mismatch"|"schema-version-mismatch"|"unknown-field"|"canonical-json-mismatch"|
  "input-envelope-mismatch"|"recorded-evidence-mismatch"|"result-mismatch"|"verification-check-mismatch"|
  "anchor-mismatch"|"evidence-mismatch"|"issue-count-mismatch"|"issue-evidence-mismatch"|
  "artifact-count-mismatch"|"artifact-order-mismatch"|"artifact-metadata-mismatch"|
  "text-result-mismatch"|"checksum-artifact-invalid"|"expected-verification-mismatch"|
  "expected-source-mismatch"|"expected-input-checksum-mismatch"|"sha256-mismatch"|"crypto-unavailable";

export interface RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultVerificationIssue{
  code:RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultVerificationIssueCode;
  path:string;
  message:string;
}

export interface RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultVerificationChecks{
  parsed:boolean;
  schema:boolean;
  canonical:boolean;
  input:boolean;
  recordedEvidence:boolean;
  result:boolean;
  verificationChecks:boolean;
  anchors:boolean;
  evidence:boolean;
  issues:boolean;
  jsonChecksum:boolean;
  textResult:boolean;
  artifactEnvelope:boolean;
}

export interface RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultVerificationAnchors{
  expectedVerification:boolean|null;
  expectedSource:boolean|null;
  inputEvidenceChecksum:boolean|null;
  jsonChecksumArtifact:boolean|null;
  textResultArtifact:boolean|null;
}

export interface RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultVerificationResult{
  valid:boolean;
  trust:Trust;
  document:Source["document"];
  canonicalText:string|null;
  bytes:number;
  checksumHex:string|null;
  issues:RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultVerificationIssue[];
  checks:RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultVerificationChecks;
  anchors:RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultVerificationAnchors;
}

export interface RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultVerificationOptions{
  maxTextBytes?:number;
  maxStringCharacters?:number;
  maxArrayEntries?:number;
  maxObjectFields?:number;
  maxDepth?:number;
  jsonFilename?:string;
  checksumArtifactText?:string;
  checksumArtifactFilename?:string;
  textResultText?:string;
  textResultFilename?:string;
  expectedInputEvidenceChecksumHex?:string;
}

export interface RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultAnchoredVerificationOptions extends RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultVerificationOptions{
  expectedVerification?:Verification;
  expectedSource?:ExpectedSource;
}

export interface RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultVerificationControlOptions{
  expectedVerification?:Verification;
  expectedSource?:ExpectedSource;
  expectedInputEvidenceChecksumHex?:string;
  onVerify?:(result:RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultVerificationResult,source:Source)=>void;
  onStatus?:(message:string)=>void;
}
