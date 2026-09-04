import {RUNTIME_NAV_MISSION_DIAGNOSTICS_ARTIFACT_VERIFIER_EVIDENCE_VERIFICATION_RESULT_VERIFIER_EVIDENCE_VERIFICATION_RESULT_ORDER as SOURCE_ORDER} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultContract.js";
import type {
  RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifact as SourceArtifact,
  RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultEvidence as Source,
} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultContract.js";
import type {RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultVerificationResult as Verification} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultVerificationContract.js";
import {
  RUNTIME_NAV_MISSION_DIAGNOSTICS_ARTIFACT_VERIFIER_EVIDENCE_VERIFICATION_RESULT_VERIFIER_EVIDENCE_VERIFICATION_RESULT_ARTIFACT_VERIFIER_EVIDENCE_SCHEMA as SCHEMA,
  RUNTIME_NAV_MISSION_DIAGNOSTICS_ARTIFACT_VERIFIER_EVIDENCE_VERIFICATION_RESULT_VERIFIER_EVIDENCE_VERIFICATION_RESULT_ARTIFACT_VERIFIER_EVIDENCE_SCHEMA_VERSION as VERSION,
} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceContract.js";
import type {
  RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceArtifact as Artifact,
  RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceArtifactKind as Kind,
  RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceDocument as Document,
  RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceResult as Result,
  RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceStatus as Status,
} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceContract.js";
import {
  JSON_MIME,
  TEXT_MIME,
  canonical,
  checksum,
  copyAnchors,
  copyChecks,
  createText,
  digest,
  filenames,
  integer,
  safe,
  string,
  target,
} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceSupport.js";
import {normalizeIssue} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceIssue.js";

const MAX_INPUT_BYTES = 4 * 1024 * 1024;
const MAX_ISSUES = 512;

export * from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceContract.js";

export async function createRuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidence(
  verification: Verification,
  source: Source,
): Promise<Result> {
  if (source.status !== "created") {
    return failure("result-unavailable", verification, source, source.error ?? "Created verifier-evidence verification-result artifacts are unavailable.");
  }
  const inputArtifact = oneJson(source.artifacts);
  if (!inputArtifact) {
    return failure("result-unavailable", verification, source, "Verifier-evidence verification-result source must contain exactly one JSON artifact.");
  }
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    return failure("crypto-unavailable", verification, source, "Web Crypto is unavailable; deterministic artifact-verifier evidence checksums cannot be created.");
  }
  try {
    const input = typeof inputArtifact.text === "string" ? inputArtifact.text : "";
    const exactBytes = new TextEncoder().encode(input).byteLength;
    if (exactBytes > MAX_INPUT_BYTES) {
      return failure("input-too-large", verification, source, `Verifier-evidence verification-result JSON exceeds the ${MAX_INPUT_BYTES} byte evidence limit.`);
    }
    const exact = await digest(input, subtle);
    const filename = typeof inputArtifact.filename === "string" ? inputArtifact.filename : "";
    const mimeType = typeof inputArtifact.mimeType === "string" ? inputArtifact.mimeType : "";
    const declaredBytes = typeof inputArtifact.bytes === "number" ? inputArtifact.bytes : -1;
    const declaredChecksum = typeof inputArtifact.checksumHex === "string" ? inputArtifact.checksumHex : "";
    const filenameSafe = safe(filename);
    const issues = Array.isArray(verification.issues) ? verification.issues : [];
    const recorded = source.document;
    const document: Document = {
      schema: SCHEMA,
      schemaVersion: VERSION,
      target: target(verification.document?.target ?? recorded?.target),
      input: {
        verificationResultJsonFilename: filenameSafe ? filename : "mission-diagnostics-policy-manifest.artifact-verifier-evidence.verification-result.verifier-evidence.verification-result.json",
        verificationResultJsonMimeType: string(mimeType, 255, "application/octet-stream"),
        declaredBytes: integer(declaredBytes),
        exactBytes,
        declaredChecksumHex: checksum(declaredChecksum),
        exactChecksum: {
          algorithm: "SHA-256",
          input: "artifact-verifier-evidence-verification-result-verifier-evidence-verification-result-json-utf8",
          hex: exact,
        },
        envelope: {
          filenameSafe,
          mimeTypeMatches: mimeType === JSON_MIME,
          byteSizeMatches: declaredBytes === exactBytes,
          checksumMatches: declaredChecksum === exact,
        },
      },
      recordedResult: {
        schema: typeof recorded?.schema === "string" ? recorded.schema : null,
        schemaVersion: Number.isSafeInteger(recorded?.schemaVersion) ? recorded!.schemaVersion : null,
        verificationResultVerifierEvidenceArtifactVerificationValid: typeof recorded?.result?.valid === "boolean" ? recorded.result.valid : null,
        verificationResultVerifierEvidenceArtifactVerificationTrust: recorded?.result?.trust ?? null,
      },
      result: {
        valid: verification.valid,
        trust: verification.trust,
        issueCount: issues.length,
      },
      checks: copyChecks(verification.checks),
      anchors: copyAnchors(verification.anchors),
      evidence: {
        documentAvailable: verification.document !== null,
        canonicalTextAvailable: typeof verification.canonicalText === "string",
        canonicalTextMatchesInput: typeof verification.canonicalText === "string" && verification.canonicalText === input,
        verificationChecksumAvailable: typeof verification.checksumHex === "string",
        verificationChecksumMatchesInput: typeof verification.checksumHex === "string" && verification.checksumHex === exact,
        issuesTruncated: issues.length > MAX_ISSUES,
      },
      issues: issues.slice(0, MAX_ISSUES).map(normalizeIssue),
    };
    const names = filenames(filename);
    const json = `${JSON.stringify(canonical(document), null, 2)}\n`;
    const plain = createText(document);
    const jsonHash = await digest(json, subtle);
    const artifacts: Artifact[] = [
      await artifact(
        "result-verifier-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence-verification-result-artifact-verifier-evidence-text",
        names.text,
        TEXT_MIME,
        plain,
        subtle,
      ),
      {
        kind: "result-verifier-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence-verification-result-artifact-verifier-evidence-json",
        filename: names.json,
        mimeType: JSON_MIME,
        bytes: new TextEncoder().encode(json).byteLength,
        checksumHex: jsonHash,
        text: json,
      },
      await artifact(
        "result-verifier-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence-verification-result-artifact-verifier-evidence-json-sha256",
        names.checksum,
        TEXT_MIME,
        `${jsonHash}  ${names.json}\n`,
        subtle,
      ),
    ];
    return {
      status: "created",
      verification,
      source,
      document,
      artifactCount: artifacts.length,
      totalBytes: artifacts.reduce((sum, item) => sum + item.bytes, 0),
      artifacts,
      error: null,
    };
  } catch (error) {
    return failure("evidence-error", verification, source, error instanceof Error ? error.message : String(error));
  }
}

async function artifact(kind: Kind, filename: string, mimeType: Artifact["mimeType"], text: string, subtle: SubtleCrypto): Promise<Artifact> {
  return {
    kind,
    filename,
    mimeType,
    bytes: new TextEncoder().encode(text).byteLength,
    checksumHex: await digest(text, subtle),
    text,
  };
}

function oneJson(artifacts: SourceArtifact[]): SourceArtifact | null {
  const matches = Array.isArray(artifacts) ? artifacts.filter(item => item?.kind === SOURCE_ORDER[1]) : [];
  return matches.length === 1 ? matches[0] ?? null : null;
}

function failure(status: Exclude<Status, "created">, verification: Verification, source: Source, error: string): Result {
  return {status, verification, source, document: null, artifactCount: 0, totalBytes: 0, artifacts: [], error};
}
