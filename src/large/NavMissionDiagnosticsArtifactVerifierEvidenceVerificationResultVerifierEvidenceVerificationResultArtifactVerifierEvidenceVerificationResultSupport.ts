import type {
  RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationAnchors as Anchors,
  RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationChecks as Checks,
} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationContract.js";
import type {RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultDocument as Document} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultContract.js";

export const JSON_MIME = "application/json;charset=utf-8" as const;
export const TEXT_MIME = "text/plain;charset=utf-8" as const;
const SAFE = /^[a-zA-Z0-9._-]+$/;
const SHA = /^[0-9a-f]{64}$/;
export const CHECK_FIELDS = ["parsed","schema","canonical","input","recordedResult","result","verificationChecks","anchors","evidence","issues","jsonChecksum","textEvidence","artifactEnvelope"] as const;
export const ANCHOR_FIELDS = ["expectedVerification","expectedSource","inputResultChecksum","jsonChecksumArtifact","textEvidenceArtifact"] as const;

export function copyChecks(value: Checks): Checks { return {...value}; }
export function copyAnchors(value: Anchors): Anchors { return {...value}; }
export function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort()) if (source[key] !== undefined) output[key] = canonical(source[key]);
    return output;
  }
  return value;
}
export async function digest(text: string, subtle: SubtleCrypto): Promise<string> {
  const bytes = new TextEncoder().encode(text), copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return Array.from(new Uint8Array(await subtle.digest("SHA-256", copy.buffer)), value => value.toString(16).padStart(2, "0")).join("");
}
export function safe(value: string): boolean { return value.length > 0 && value.length <= 255 && SAFE.test(value); }
export function integer(value: number): number { return Number.isSafeInteger(value) && value >= 0 ? value : 0; }
export function checksum(value: string): string { return SHA.test(value) ? value : "0".repeat(64); }
export function string(value: string, max: number, fallback: string): string { return value.length > 0 && value.length <= max ? value : fallback; }
export function target(value: unknown): unknown {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const scope = typeof record.scope === "string" && record.scope.length <= 64 ? record.scope : null;
  const packageIndex = record.packageIndex === null || (typeof record.packageIndex === "number" && Number.isSafeInteger(record.packageIndex) && record.packageIndex >= 0) ? record.packageIndex : null;
  return {packageIndex, scope};
}
export function filenames(source: string): {text: string; json: string; checksum: string} {
  let base = "mission-diagnostics-policy-manifest.artifact-verifier-evidence.verification-result.verifier-evidence.verification-result.artifact-verifier-evidence";
  if (safe(source) && source.endsWith(".json")) base = source.slice(0, -5);
  base += ".verification-result";
  return {text: `${base}.txt`, json: `${base}.json`, checksum: `${base}.json.sha256`};
}
export function createText(document: Document): string {
  const lines = [
    "Splat World Engine Artifact-Verifier Evidence Verification-Result Verifier-Evidence Verification-Result Artifact-Verifier Evidence Verification Result",
    "",
    `Schema: ${document.schema}`,
    `Schema version: ${document.schemaVersion}`,
    `Target: ${JSON.stringify(canonical(document.target))}`,
    "",
    `Artifact-verifier evidence artifact verification valid: ${document.result.valid}`,
    `Artifact-verifier evidence artifact verification trust: ${document.result.trust}`,
    `Artifact-verifier evidence artifact verification issue count: ${document.result.issueCount}`,
    "",
    `Artifact-verifier evidence JSON: ${document.input.artifactVerifierEvidenceJsonFilename}`,
    `Artifact-verifier evidence exact bytes: ${document.input.exactBytes}`,
    `Artifact-verifier evidence exact SHA-256: ${document.input.exactChecksum.hex}`,
    `Envelope filename safe: ${document.input.envelope.filenameSafe}`,
    `Envelope MIME type matches: ${document.input.envelope.mimeTypeMatches}`,
    `Envelope byte size matches: ${document.input.envelope.byteSizeMatches}`,
    `Envelope checksum matches: ${document.input.envelope.checksumMatches}`,
    "",
    `Recorded evidence schema: ${document.recordedEvidence.schema ?? "unavailable"}`,
    `Recorded evidence schema version: ${document.recordedEvidence.schemaVersion ?? "unavailable"}`,
    `Recorded verifier-evidence verification-result artifact verification valid: ${document.recordedEvidence.verifierEvidenceVerificationResultArtifactVerificationValid ?? "unavailable"}`,
    `Recorded verifier-evidence verification-result artifact verification trust: ${document.recordedEvidence.verifierEvidenceVerificationResultArtifactVerificationTrust ?? "unavailable"}`,
    "",
    "Verification checks",
  ];
  for (const field of CHECK_FIELDS) lines.push(`  ${field}: ${document.checks[field]}`);
  lines.push("", "Trusted anchors");
  for (const field of ANCHOR_FIELDS) {
    const value = document.anchors[field];
    lines.push(`  ${field}: ${value === null ? "not-provided" : value}`);
  }
  lines.push(
    "",
    "Evidence relationships",
    `  documentAvailable: ${document.evidence.documentAvailable}`,
    `  canonicalTextAvailable: ${document.evidence.canonicalTextAvailable}`,
    `  canonicalTextMatchesInput: ${document.evidence.canonicalTextMatchesInput}`,
    `  verificationChecksumAvailable: ${document.evidence.verificationChecksumAvailable}`,
    `  verificationChecksumMatchesInput: ${document.evidence.verificationChecksumMatchesInput}`,
    `  issuesTruncated: ${document.evidence.issuesTruncated}`,
    "",
    "Issues",
  );
  if (document.issues.length === 0) lines.push("  none");
  else for (const issue of document.issues) lines.push(`  ${issue.code} ${issue.path}`, `    ${issue.message}`);
  lines.push("", `Result: ${document.result.valid ? "artifact-verifier evidence artifact verification passed" : "artifact-verifier evidence artifact verification failed"}`);
  return `${lines.join("\n")}\n`;
}
