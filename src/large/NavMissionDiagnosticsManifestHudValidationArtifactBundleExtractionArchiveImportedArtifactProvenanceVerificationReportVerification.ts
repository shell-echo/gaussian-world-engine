import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportDocument,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReport.js";
import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationAnchors,
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationChecks,
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationIssue,
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationIssueCode,
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationOptions,
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationResult,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerificationContract.js";
import {
  verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportDocument,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerificationDocument.js";
import {
  runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportCanonicalize,
  runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportCreateResult,
  runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportCreateText,
  runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportDigestText,
  runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportFinalizeResult,
  runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportIsSafeBasename,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerificationSupport.js";

export * from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerificationContract.js";
export * from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerificationSupport.js";

const DEFAULT_MAX_TEXT_BYTES = 4 * 1024 * 1024;
const DEFAULT_MAX_STRING_CHARACTERS = 1024 * 1024;
const DEFAULT_MAX_ARRAY_ENTRIES = 512;
const DEFAULT_MAX_OBJECT_FIELDS = 64;
const DEFAULT_MAX_DEPTH = 32;
type Issue = RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationIssue;
type Checks = RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationChecks;
type Anchors = RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationAnchors;
type JsonRecord = Record<string, unknown>;
interface Limits { maxTextBytes: number; maxStringCharacters: number; maxArrayEntries: number; maxObjectFields: number; maxDepth: number }

export async function verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportText(
  text: string,
  options: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationOptions = {},
): Promise<RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationResult> {
  const issues: Issue[] = [];
  const checks = createChecks(options);
  const anchors = createAnchors(options);
  const limits = normalizeLimits(options);
  if (typeof text !== "string") return early("text-invalid", "$", "Verification report input must be a string.", checks, anchors);
  const bytes = new TextEncoder().encode(text).byteLength;
  if (bytes > limits.maxTextBytes) return early("text-size-invalid", "$", `Verification report exceeds ${limits.maxTextBytes} bytes.`, checks, anchors, bytes);
  let parsed: unknown;
  try { parsed = JSON.parse(text); checks.parsed = true; }
  catch { return early("json-parse-failed", "$", "Verification report text is not valid JSON.", checks, anchors, bytes); }
  if (!isRecord(parsed)) return early("document-type-invalid", "$", "Verification report root must be a plain object.", checks, anchors, bytes);
  const canonicalText = `${JSON.stringify(runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportCanonicalize(parsed), null, 2)}\n`;
  checks.canonical = canonicalText === text;
  if (!checks.canonical) add(issues, "canonical-json-mismatch", "$", "Verification report JSON is not canonical.");
  const document = verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportDocument(parsed, limits, issues, checks);
  let checksumHex: string | null = null;
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) add(issues, "crypto-unavailable", "$", "Web Crypto SHA-256 is unavailable.");
  else {
    checksumHex = await runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportDigestText(text, subtle);
    checks.jsonChecksum = verifyChecksumArtifact(checksumHex, options, issues, anchors);
    checks.textReport = verifyTextArtifact(document, options, issues, anchors);
  }
  const result = runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportCreateResult(document, canonicalText, bytes, checksumHex, issues, checks, anchors);
  runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportFinalizeResult(result);
  return result;
}

function verifyChecksumArtifact(checksumHex: string, options: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationOptions, issues: Issue[], anchors: Anchors): boolean {
  if (options.checksumArtifactText === undefined) return true;
  const filename = options.jsonFilename;
  let valid = !!filename && runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportIsSafeBasename(filename) && options.checksumArtifactText === `${checksumHex}  ${filename}\n`;
  if (options.checksumArtifactFilename !== undefined) valid = valid && options.checksumArtifactFilename === `${filename}.sha256`;
  if (!valid) add(issues, "checksum-artifact-invalid", "$.artifacts", "Report JSON SHA-256 artifact is invalid.");
  anchors.jsonChecksumArtifact = valid;
  return valid;
}

function verifyTextArtifact(document: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportDocument | null, options: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationOptions, issues: Issue[], anchors: Anchors): boolean {
  if (options.textReportText === undefined) return true;
  let valid = !!document && options.textReportText === runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportCreateText(document);
  if (options.textReportFilename !== undefined && options.jsonFilename !== undefined) valid = valid && options.jsonFilename.endsWith(".json") && options.textReportFilename === `${options.jsonFilename.slice(0, -5)}.txt`;
  if (!valid) add(issues, "text-report-mismatch", "$.artifacts", "Report text artifact does not match the report document.");
  anchors.textReportArtifact = valid;
  return valid;
}

function add(issues: Issue[], code: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationIssueCode, path: string, message: string): void { issues.push({ code, path, message }); }
function early(code: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationIssueCode, path: string, message: string, checks: Checks, anchors: Anchors, bytes = 0): RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationResult { const issues: Issue[] = []; add(issues, code, path, message); return runtimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportCreateResult(null, null, bytes, null, issues, checks, anchors); }
function createChecks(options: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationOptions): Checks { return { parsed:false, schema:false, canonical:false, input:false, sourceArchive:false, result:false, verificationChecks:false, anchors:false, evidence:false, issues:false, jsonChecksum:options.checksumArtifactText === undefined, textReport:options.textReportText === undefined, artifactEnvelope:true }; }
function createAnchors(options: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationOptions): Anchors { return { expectedReport:null, verification:null, provenance:null, jsonChecksumArtifact:options.checksumArtifactText === undefined ? null : false, textReportArtifact:options.textReportText === undefined ? null : false }; }
function normalizeLimits(options: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationOptions): Limits { return { maxTextBytes:positive(options.maxTextBytes, DEFAULT_MAX_TEXT_BYTES, "maxTextBytes"), maxStringCharacters:positive(options.maxStringCharacters, DEFAULT_MAX_STRING_CHARACTERS, "maxStringCharacters"), maxArrayEntries:positive(options.maxArrayEntries, DEFAULT_MAX_ARRAY_ENTRIES, "maxArrayEntries"), maxObjectFields:positive(options.maxObjectFields, DEFAULT_MAX_OBJECT_FIELDS, "maxObjectFields"), maxDepth:positive(options.maxDepth, DEFAULT_MAX_DEPTH, "maxDepth") }; }
function positive(value: number | undefined, fallback: number, label: string): number { if (value === undefined) return fallback; if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${label} must be a positive safe integer.`); return value; }
function isRecord(value: unknown): value is JsonRecord { return value !== null && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype; }
