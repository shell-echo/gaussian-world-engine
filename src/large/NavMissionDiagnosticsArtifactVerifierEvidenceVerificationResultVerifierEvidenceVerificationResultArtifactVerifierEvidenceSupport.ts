import type {
  RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultVerificationAnchors as Anchors,
  RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultVerificationChecks as Checks,
} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultVerificationContract.js";
import type {RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceDocument as Document} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceContract.js";

export const JSON_MIME = "application/json;charset=utf-8" as const;
export const TEXT_MIME = "text/plain;charset=utf-8" as const;
const SAFE = /^[a-zA-Z0-9._-]+$/;
const SHA = /^[0-9a-f]{64}$/;

export const CHECK_FIELDS = [
  "parsed",
  "schema",
  "canonical",
  "input",
  "recordedEvidence",
  "result",
  "verificationChecks",
  "anchors",
  "evidence",
  "issues",
  "jsonChecksum",
  "textResult",
  "artifactEnvelope",
] as const;

export const ANCHOR_FIELDS = [
  "expectedVerification",
  "expectedSource",
  "inputEvidenceChecksum",
  "jsonChecksumArtifact",
  "textResultArtifact",
] as const;

export function copyChecks(value: Checks): Checks {
  return {...value};
}

export function copyAnchors(value: Anchors): Anchors {
  return {...value};
}

export function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort()) {
      if (source[key] !== undefined) output[key] = canonical(source[key]);
    }
    return output;
  }
  return value;
}

export async function digest(text: string, subtle: SubtleCrypto): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return Array.from(new Uint8Array(await subtle.digest("SHA-256", copy.buffer)), value => value.toString(16).padStart(2, "0")).join("");
}

export function safe(value: string): boolean {
  return value.length > 0 && value.length <= 255 && SAFE.test(value);
}

export function integer(value: number): number {
  return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

export function checksum(value: string): string {
  return SHA.test(value) ? value : "0".repeat(64);
}

export function string(value: string, max: number, fallback: string): string {
  return value.length > 0 && value.length <= max ? value : fallback;
}

export function target(value: unknown): unknown {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const scope = typeof record.scope === "string" && record.scope.length <= 64 ? record.scope : null;
  const packageIndex = record.packageIndex === null || (typeof record.packageIndex === "number" && Number.isSafeInteger(record.packageIndex) && record.packageIndex >= 0)
    ? record.packageIndex
    : null;
  return {packageIndex, scope};
}

export function filenames(source: string): {text: string; json: string; checksum: string} {
  let base = "mission-diagnostics-policy-manifest.artifact-verifier-evidence.verification-result.verifier-evidence.verification-result";
  if (safe(source) && source.endsWith(".json")) base = source.slice(0, -5);
  base += ".artifact-verifier-evidence";
  return {text: `${base}.txt`, json: `${base}.json`, checksum: `${base}.json.sha256`};
}

export function createText(document: Document): string {
  const lines = [
    "Splat World Engine Artifact-Verifier Evidence Verification-Result Verifier-Evidence Verification-Result Artifact-Verifier Evidence",
    "",
    `Schema: ${document.schema}`,
    `Schema version: ${document.schemaVersion}`,
    `Target: ${JSON.stringify(canonical(document.target))}`,
    "",
    `Verification-result artifact verification valid: ${document.result.valid}`,
    `Verification-result artifact verification trust: ${document.result.trust}`,
    `Verification-result artifact verification issue count: ${document.result.issueCount}`,
    "",
    `Verifier-evidence verification-result JSON: ${document.input.verificationResultJsonFilename}`,
    `Verifier-evidence verification-result exact bytes: ${document.input.exactBytes}`,
    `Verifier-evidence verification-result exact SHA-256: ${document.input.exactChecksum.hex}`,
    `Envelope filename safe: ${document.input.envelope.filenameSafe}`,
    `Envelope MIME type matches: ${document.input.envelope.mimeTypeMatches}`,
    `Envelope byte size matches: ${document.input.envelope.byteSizeMatches}`,
    `Envelope checksum matches: ${document.input.envelope.checksumMatches}`,
    "",
    `Recorded result schema: ${document.recordedResult.schema ?? "unavailable"}`,
    `Recorded result schema version: ${document.recordedResult.schemaVersion ?? "unavailable"}`,
    `Recorded verification-result verifier-evidence artifact verification valid: ${document.recordedResult.verificationResultVerifierEvidenceArtifactVerificationValid ?? "unavailable"}`,
    `Recorded verification-result verifier-evidence artifact verification trust: ${document.recordedResult.verificationResultVerifierEvidenceArtifactVerificationTrust ?? "unavailable"}`,
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
  lines.push("", `Result: ${document.result.valid ? "verification-result artifact verification passed" : "verification-result artifact verification failed"}`);
  return `${lines.join("\n")}\n`;
}
