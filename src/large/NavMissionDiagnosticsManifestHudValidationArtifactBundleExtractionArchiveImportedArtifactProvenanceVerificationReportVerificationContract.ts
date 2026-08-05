import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportDocument,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReport.js";

export const RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_IMPORTED_ARCHIVE_PROVENANCE_VERIFICATION_REPORT_ARTIFACT_ORDER = [
  "provenance-verification-report-text",
  "provenance-verification-report-json",
  "provenance-verification-report-json-sha256",
] as const;

export const RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_IMPORTED_ARCHIVE_PROVENANCE_VERIFICATION_CHECK_FIELDS = [
  "parsed", "schema", "canonical", "sourceArchive", "verification", "trustedExtraction", "importedExtraction", "relationships", "jsonChecksum",
] as const;

export const RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_IMPORTED_ARCHIVE_PROVENANCE_VERIFICATION_ANCHOR_FIELDS = [
  "expectedProvenance", "entryExtraction", "sourceArchiveChecksum", "jsonChecksumArtifact",
] as const;

export const RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_IMPORTED_ARCHIVE_PROVENANCE_VERIFICATION_REPORT_JSON_MIME_TYPE =
  "application/json;charset=utf-8" as const;

export type RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationIssueCode =
  | "text-invalid" | "text-size-invalid" | "json-parse-failed" | "document-type-invalid"
  | "field-type-invalid" | "field-value-invalid" | "array-size-invalid" | "string-size-invalid"
  | "schema-mismatch" | "schema-version-mismatch" | "unknown-field" | "canonical-json-mismatch"
  | "input-envelope-mismatch" | "source-archive-mismatch" | "result-mismatch"
  | "verification-check-mismatch" | "anchor-mismatch" | "evidence-mismatch"
  | "issue-count-mismatch" | "issue-evidence-mismatch" | "artifact-count-mismatch"
  | "artifact-order-mismatch" | "artifact-metadata-mismatch" | "text-report-mismatch"
  | "checksum-artifact-invalid" | "expected-report-mismatch" | "expected-verification-mismatch"
  | "expected-provenance-mismatch" | "sha256-mismatch" | "crypto-unavailable";

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationIssue {
  code: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationIssueCode;
  path: string;
  message: string;
}

export type RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportTrust =
  "anchored" | "self-consistent" | "untrusted";

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationChecks {
  parsed: boolean;
  schema: boolean;
  canonical: boolean;
  input: boolean;
  sourceArchive: boolean;
  result: boolean;
  verificationChecks: boolean;
  anchors: boolean;
  evidence: boolean;
  issues: boolean;
  jsonChecksum: boolean;
  textReport: boolean;
  artifactEnvelope: boolean;
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationAnchors {
  expectedReport: boolean | null;
  verification: boolean | null;
  provenance: boolean | null;
  jsonChecksumArtifact: boolean | null;
  textReportArtifact: boolean | null;
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationResult {
  valid: boolean;
  trust: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportTrust;
  document: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportDocument | null;
  canonicalText: string | null;
  bytes: number;
  checksumHex: string | null;
  issues: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationIssue[];
  checks: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationChecks;
  anchors: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationAnchors;
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationOptions {
  maxTextBytes?: number;
  maxStringCharacters?: number;
  maxArrayEntries?: number;
  maxObjectFields?: number;
  maxDepth?: number;
  jsonFilename?: string;
  checksumArtifactText?: string;
  checksumArtifactFilename?: string;
  textReportText?: string;
  textReportFilename?: string;
}
