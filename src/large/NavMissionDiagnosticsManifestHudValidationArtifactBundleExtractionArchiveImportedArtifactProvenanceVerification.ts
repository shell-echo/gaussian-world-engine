import {
  RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_IMPORTED_ARCHIVE_PROVENANCE_SCHEMA,
  RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_IMPORTED_ARCHIVE_PROVENANCE_SCHEMA_VERSION,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenance.js";
import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceArtifact,
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceDocument,
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceResult,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenance.js";
import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveExtractionResult,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactExtraction.js";
import {
  RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_ORDER,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleVerification.js";

const SHA256_ALGORITHM = "SHA-256" as const;
const DEFAULT_MAX_TEXT_BYTES = 4 * 1024 * 1024;
const DEFAULT_MAX_STRING_CHARACTERS = 1024 * 1024;
const DEFAULT_MAX_ARRAY_ENTRIES = 128;
const DEFAULT_MAX_OBJECT_FIELDS = 64;
const DEFAULT_MAX_DEPTH = 32;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const CRC32_PATTERN = /^[0-9a-f]{8}$/;
const SAFE_BASENAME_PATTERN = /^[a-zA-Z0-9._-]+$/;
const CRC32_TABLE = createCrc32Table();

const TOP_LEVEL_FIELDS = [
  "schema",
  "schemaVersion",
  "target",
  "sourceArchive",
  "verification",
  "trustedExtraction",
  "importedExtraction",
  "relationships",
] as const;
const SOURCE_ARCHIVE_FIELDS = ["filename", "reportedMimeType", "reportedBytes", "exactBytes", "checksum"] as const;
const CHECKSUM_FIELDS = ["algorithm", "input", "hex"] as const;
const VERIFICATION_FIELDS = [
  "valid",
  "issueCount",
  "archiveBytes",
  "entryCount",
  "totalUncompressedBytes",
  "checks",
] as const;
const VERIFICATION_CHECK_FIELDS = [
  "archiveChecksum",
  "eocd",
  "centralDirectory",
  "entryOrder",
  "localHeadersVerified",
  "deterministicMetadataVerified",
  "crc32Verified",
  "sha256Verified",
] as const;
const TRUSTED_EXTRACTION_FIELDS = ["status", "bundleStatus", "artifactCount", "totalBytes", "artifacts"] as const;
const IMPORTED_EXTRACTION_FIELDS = [
  "status",
  "sourceArchiveFilename",
  "artifactCount",
  "totalBytes",
  "artifacts",
] as const;
const TRUSTED_ARTIFACT_FIELDS = ["index", "kind", "filename", "mimeType", "bytes", "checksum"] as const;
const IMPORTED_ARTIFACT_FIELDS = [
  "index",
  "kind",
  "filename",
  "mimeType",
  "bytes",
  "checksum",
  "dataOffset",
  "dataEnd",
  "crc32",
] as const;
const CRC32_FIELDS = ["algorithm", "input", "hex"] as const;
const RELATIONSHIP_FIELDS = [
  "index",
  "kind",
  "filenameMatches",
  "mimeTypeMatches",
  "byteSizeMatches",
  "dataRangeMatches",
  "crc32Matches",
  "checksumMatches",
  "exactTextMatches",
] as const;

export type RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationIssueCode =
  | "text-invalid"
  | "text-size-invalid"
  | "json-parse-failed"
  | "document-type-invalid"
  | "field-type-invalid"
  | "field-value-invalid"
  | "array-size-invalid"
  | "string-size-invalid"
  | "schema-mismatch"
  | "schema-version-mismatch"
  | "unknown-field"
  | "canonical-json-mismatch"
  | "source-archive-mismatch"
  | "source-archive-checksum-mismatch"
  | "verification-check-mismatch"
  | "trusted-extraction-mismatch"
  | "imported-extraction-mismatch"
  | "relationship-count-mismatch"
  | "relationship-mismatch"
  | "artifact-order-mismatch"
  | "artifact-metadata-mismatch"
  | "crc32-mismatch"
  | "sha256-mismatch"
  | "checksum-artifact-invalid"
  | "expected-provenance-mismatch"
  | "crypto-unavailable";

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationIssue {
  code: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationIssueCode;
  path: string;
  message: string;
}

export type RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceTrust =
  | "anchored"
  | "self-consistent"
  | "untrusted";

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationChecks {
  parsed: boolean;
  schema: boolean;
  canonical: boolean;
  sourceArchive: boolean;
  verification: boolean;
  trustedExtraction: boolean;
  importedExtraction: boolean;
  relationships: boolean;
  jsonChecksum: boolean;
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationAnchors {
  expectedProvenance: boolean | null;
  entryExtraction: boolean | null;
  sourceArchiveChecksum: boolean | null;
  jsonChecksumArtifact: boolean | null;
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationResult {
  valid: boolean;
  trust: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceTrust;
  document: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceDocument | null;
  canonicalText: string | null;
  bytes: number;
  checksumHex: string | null;
  issues: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationIssue[];
  checks: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationChecks;
  anchors: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationAnchors;
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationOptions {
  maxTextBytes?: number;
  maxStringCharacters?: number;
  maxArrayEntries?: number;
  maxObjectFields?: number;
  maxDepth?: number;
  jsonFilename?: string;
  checksumArtifactText?: string;
  checksumArtifactFilename?: string;
  expectedProvenance?: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceResult;
  expectedEntryExtraction?: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveExtractionResult;
  expectedSourceArchiveChecksumHex?: string;
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationControlOptions {
  onVerify?: (
    verification: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationResult,
    provenance: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceResult,
    entryExtraction: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveExtractionResult,
  ) => void;
  onStatus?: (message: string) => void;
}

type JsonRecord = Record<string, unknown>;
type VerificationIssue = RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationIssue;
type VerificationChecks = RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationChecks;
type VerificationAnchors = RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationAnchors;

interface Limits {
  maxTextBytes: number;
  maxStringCharacters: number;
  maxArrayEntries: number;
  maxObjectFields: number;
  maxDepth: number;
}

interface DocumentSections {
  sourceArchive: JsonRecord | null;
  verification: JsonRecord | null;
  trustedExtraction: JsonRecord | null;
  importedExtraction: JsonRecord | null;
  relationships: unknown[] | null;
}

export async function verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceArtifact(
  provenance: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceResult,
  entryExtraction: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveExtractionResult,
): Promise<RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationResult> {
  const jsonArtifact = findSingleArtifact(provenance.artifacts, "provenance-report-json");
  const checksumArtifact = findSingleArtifact(provenance.artifacts, "provenance-report-json-sha256");
  if (!jsonArtifact) {
    return createEarlyFailure(
      0,
      "checksum-artifact-invalid",
      "$.artifacts",
      "Provenance result must contain exactly one provenance JSON artifact.",
    );
  }

  const result = await verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceText(
    jsonArtifact.text,
    {
      jsonFilename: jsonArtifact.filename,
      checksumArtifactText: checksumArtifact?.text,
      checksumArtifactFilename: checksumArtifact?.filename,
      expectedProvenance: provenance,
      expectedEntryExtraction: entryExtraction,
      expectedSourceArchiveChecksumHex: entryExtraction.importResult.verification?.archiveChecksumHex ?? undefined,
    },
  );

  await verifyArtifactEnvelope(provenance, jsonArtifact, checksumArtifact, result);
  finalizeResult(result);
  return result;
}

export async function verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceText(
  text: string,
  options: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationOptions = {},
): Promise<RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationResult> {
  const limits = normalizeLimits(options);
  const issues: VerificationIssue[] = [];
  const checks = createChecks();
  const anchors = createAnchors(options);
  if (typeof text !== "string") {
    addIssue(issues, "text-invalid", "$", "Provenance input must be a string.");
    return createResult(null, null, 0, null, issues, checks, anchors);
  }

  const encoder = new TextEncoder();
  const bytes = encoder.encode(text).byteLength;
  if (bytes > limits.maxTextBytes) {
    addIssue(
      issues,
      "text-size-invalid",
      "$",
      `Provenance text exceeds the ${limits.maxTextBytes} byte verification limit.`,
    );
    return createResult(null, null, bytes, null, issues, checks, anchors);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
    checks.parsed = true;
  } catch (error) {
    addIssue(
      issues,
      "json-parse-failed",
      "$",
      `Provenance text is not valid JSON: ${formatError(error)}`,
    );
    return createResult(null, null, bytes, null, issues, checks, anchors);
  }
  if (!isRecord(parsed)) {
    addIssue(issues, "document-type-invalid", "$", "Provenance document root must be a plain JSON object.");
    return createResult(null, null, bytes, null, issues, checks, anchors);
  }

  validateValueBounds(parsed, "$", 0, limits, issues);
  expectExactFields(parsed, TOP_LEVEL_FIELDS, "$", issues);

  const canonicalText = `${JSON.stringify(canonicalize(parsed), null, 2)}\n`;
  checks.canonical = canonicalText === text;
  if (!checks.canonical) {
    addIssue(
      issues,
      "canonical-json-mismatch",
      "$",
      "Provenance JSON must use recursively sorted object keys, preserved array order, two-space indentation, and exactly one trailing newline.",
    );
  }

  checks.schema = verifySchema(parsed, issues);
  const sections = readSections(parsed, issues);
  checks.sourceArchive = verifySourceArchive(sections.sourceArchive, issues);
  checks.verification = verifyVerification(sections.verification, sections.sourceArchive, issues);
  checks.trustedExtraction = verifyExtractionSection(
    sections.trustedExtraction,
    "trusted",
    sections.sourceArchive,
    issues,
  );
  checks.importedExtraction = verifyExtractionSection(
    sections.importedExtraction,
    "imported",
    sections.sourceArchive,
    issues,
  );
  checks.relationships = verifyRelationships(
    sections.relationships,
    sections.trustedExtraction,
    sections.importedExtraction,
    issues,
  );
  verifyCrossSectionTotals(sections, issues, checks);

  const subtle = globalThis.crypto?.subtle;
  let checksumHex: string | null = null;
  if (!subtle) {
    addIssue(issues, "crypto-unavailable", "$", "Web Crypto SHA-256 is unavailable for provenance verification.");
  } else {
    checksumHex = await digestText(text, subtle);
    checks.jsonChecksum = verifyChecksumArtifact(text, checksumHex, options, issues);
    await verifyExpectedProvenance(text, checksumHex, options.expectedProvenance, issues, anchors);
    await verifyEntryExtractionAnchor(parsed, options.expectedEntryExtraction, subtle, issues, anchors);
    verifySourceChecksumAnchor(parsed, options.expectedSourceArchiveChecksumHex, issues, anchors);
  }

  const structurallyTyped =
    checks.schema &&
    checks.sourceArchive &&
    checks.verification &&
    checks.trustedExtraction &&
    checks.importedExtraction &&
    checks.relationships;
  const document = structurallyTyped
    ? parsed as unknown as RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceDocument
    : null;
  const result = createResult(document, canonicalText, bytes, checksumHex, issues, checks, anchors);
  finalizeResult(result);
  return result;
}

export function createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationControl(
  provenance: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceResult,
  entryExtraction: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveExtractionResult,
  options: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationControlOptions = {},
): HTMLElement {
  const root = document.createElement("section");
  root.className = "mission-debug-diagnostics-manifest-validation-imported-archive-provenance-verification";
  root.dataset.bundleImportedArchiveProvenanceVerificationStatus = "idle";
  root.dataset.bundleImportedArchiveProvenanceVerificationValid = "false";
  root.dataset.bundleImportedArchiveProvenanceVerificationTrust = "untrusted";
  root.dataset.bundleImportedArchiveProvenanceVerificationIssueCount = "0";
  Object.assign(root.style, { display: "grid", gap: "5px", minWidth: "0" });

  const button = createActionButton(
    "Verify imported archive provenance report",
    "strict JSON · canonical bytes · source ZIP · trusted/imported artifacts · relationships · JSON SHA-256",
  );
  button.dataset.bundleImportedArchiveProvenanceVerificationAction = "verify";

  const details = document.createElement("details");
  details.hidden = true;
  Object.assign(details.style, {
    minWidth: "0",
    padding: "6px 7px",
    border: "1px solid rgba(118, 190, 255, 0.22)",
    borderRadius: "7px",
    background: "rgba(118, 190, 255, 0.035)",
  });

  button.addEventListener("click", () => {
    void runVerification(root, button, details, provenance, entryExtraction, options);
  });
  root.append(button, details);
  return root;
}

async function runVerification(
  root: HTMLElement,
  button: HTMLButtonElement,
  details: HTMLDetailsElement,
  provenance: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceResult,
  entryExtraction: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveExtractionResult,
  options: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationControlOptions,
): Promise<void> {
  button.disabled = true;
  root.dataset.bundleImportedArchiveProvenanceVerificationStatus = "verifying";
  try {
    const verification =
      await verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceArtifact(
        provenance,
        entryExtraction,
      );
    applyVerificationDataset(root, verification);
    renderVerificationDetails(details, verification);
    options.onVerify?.(verification, provenance, entryExtraction);
    options.onStatus?.(
      verification.valid
        ? `Imported archive provenance verified with ${verification.trust} trust and ${verification.issues.length} issues.`
        : `Imported archive provenance verification failed with ${formatIssueCount(verification.issues.length)}.`,
    );
  } catch (error) {
    root.dataset.bundleImportedArchiveProvenanceVerificationStatus = "error";
    root.dataset.bundleImportedArchiveProvenanceVerificationValid = "false";
    root.dataset.bundleImportedArchiveProvenanceVerificationTrust = "untrusted";
    details.hidden = false;
    details.open = true;
    const summary = document.createElement("summary");
    summary.textContent = "Imported archive provenance verification error";
    const message = document.createElement("small");
    message.textContent = formatError(error);
    message.style.color = "#ffb4b4";
    message.style.overflowWrap = "anywhere";
    details.replaceChildren(summary, message);
    options.onStatus?.(`Imported archive provenance verification error: ${formatError(error)}`);
  } finally {
    button.disabled = false;
  }
}

function applyVerificationDataset(
  root: HTMLElement,
  verification: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationResult,
): void {
  root.dataset.bundleImportedArchiveProvenanceVerificationStatus = verification.valid ? "verified" : "failed";
  root.dataset.bundleImportedArchiveProvenanceVerificationValid = String(verification.valid);
  root.dataset.bundleImportedArchiveProvenanceVerificationTrust = verification.trust;
  root.dataset.bundleImportedArchiveProvenanceVerificationIssueCount = String(verification.issues.length);
  if (verification.document) {
    root.dataset.bundleImportedArchiveProvenanceVerificationSchemaVersion = String(verification.document.schemaVersion);
  } else {
    delete root.dataset.bundleImportedArchiveProvenanceVerificationSchemaVersion;
  }
  if (verification.checksumHex) {
    root.dataset.bundleImportedArchiveProvenanceVerificationChecksum = verification.checksumHex;
  } else {
    delete root.dataset.bundleImportedArchiveProvenanceVerificationChecksum;
  }
}

function renderVerificationDetails(
  details: HTMLDetailsElement,
  verification: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationResult,
): void {
  details.hidden = false;
  details.open = !verification.valid;
  details.style.border = verification.valid
    ? "1px solid rgba(112, 214, 151, 0.28)"
    : "1px solid rgba(255, 93, 93, 0.32)";
  details.style.background = verification.valid
    ? "rgba(112, 214, 151, 0.05)"
    : "rgba(255, 93, 93, 0.055)";
  const summary = document.createElement("summary");
  summary.textContent = verification.valid
    ? `Provenance verification · passed · ${verification.trust}`
    : `Provenance verification · failed · ${formatIssueCount(verification.issues.length)}`;
  Object.assign(summary.style, {
    cursor: "pointer",
    fontSize: "10px",
    fontWeight: "750",
    overflowWrap: "anywhere",
  });
  const body = document.createElement("div");
  Object.assign(body.style, { display: "grid", gap: "5px", marginTop: "6px" });
  const provenanceDocument = verification.document;
  const metadata = provenanceDocument ? [
    `schema/version ${provenanceDocument.schema} / ${provenanceDocument.schemaVersion}`,
    `canonical JSON ${formatBooleanCheck(verification.checks.canonical)}`,
    `source ZIP SHA-256 ${provenanceDocument.sourceArchive.checksum.hex}`,
    `trusted artifacts ${provenanceDocument.trustedExtraction.artifactCount}`,
    `imported artifacts ${provenanceDocument.importedExtraction.artifactCount}`,
    `relationships ${provenanceDocument.relationships.length}`,
    `JSON SHA-256 ${verification.checksumHex ?? "unavailable"}`,
    `issues ${verification.issues.length}`,
  ] : [
    `canonical JSON ${formatBooleanCheck(verification.checks.canonical)}`,
    `JSON SHA-256 ${verification.checksumHex ?? "unavailable"}`,
    `issues ${verification.issues.length}`,
  ];
  for (const line of metadata) {
    const item = document.createElement("small");
    item.textContent = line;
    item.style.overflowWrap = "anywhere";
    body.append(item);
  }
  if (verification.issues.length > 0) body.append(createIssueList(verification.issues));
  details.replaceChildren(summary, body);
}

function createIssueList(issues: VerificationIssue[]): HTMLElement {
  const list = document.createElement("ul");
  Object.assign(list.style, { display: "grid", gap: "4px", margin: "0", padding: "0", listStyle: "none" });
  for (const issue of issues) {
    const item = document.createElement("li");
    Object.assign(item.style, {
      display: "grid",
      gap: "2px",
      padding: "5px 6px",
      border: "1px solid rgba(255, 93, 93, 0.28)",
      borderRadius: "6px",
      background: "rgba(255, 93, 93, 0.07)",
    });
    const heading = document.createElement("span");
    const code = document.createElement("b");
    code.textContent = issue.code;
    code.style.fontSize = "9px";
    const path = document.createElement("code");
    path.textContent = ` ${issue.path}`;
    path.style.fontSize = "9px";
    path.style.opacity = "0.58";
    heading.append(code, path);
    const message = document.createElement("small");
    message.textContent = issue.message;
    message.style.fontSize = "9px";
    message.style.lineHeight = "1.35";
    message.style.overflowWrap = "anywhere";
    item.append(heading, message);
    list.append(item);
  }
  return list;
}

function verifySchema(document: JsonRecord, issues: VerificationIssue[]): boolean {
  let valid = true;
  if (document.schema !== RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_IMPORTED_ARCHIVE_PROVENANCE_SCHEMA) {
    valid = false;
    addIssue(
      issues,
      "schema-mismatch",
      "$.schema",
      `Expected provenance schema ${RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_IMPORTED_ARCHIVE_PROVENANCE_SCHEMA}.`,
    );
  }
  if (
    document.schemaVersion !==
    RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_IMPORTED_ARCHIVE_PROVENANCE_SCHEMA_VERSION
  ) {
    valid = false;
    addIssue(
      issues,
      "schema-version-mismatch",
      "$.schemaVersion",
      `Expected provenance schema version ${RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_IMPORTED_ARCHIVE_PROVENANCE_SCHEMA_VERSION}.`,
    );
  }
  return valid;
}

function readSections(document: JsonRecord, issues: VerificationIssue[]): DocumentSections {
  const sourceArchive = readRecord(document.sourceArchive, "$.sourceArchive", issues);
  const verification = readRecord(document.verification, "$.verification", issues);
  const trustedExtraction = readRecord(document.trustedExtraction, "$.trustedExtraction", issues);
  const importedExtraction = readRecord(document.importedExtraction, "$.importedExtraction", issues);
  let relationships: unknown[] | null = null;
  if (Array.isArray(document.relationships)) relationships = document.relationships;
  else addIssue(issues, "field-type-invalid", "$.relationships", "relationships must be an array.");
  return { sourceArchive, verification, trustedExtraction, importedExtraction, relationships };
}

function verifySourceArchive(source: JsonRecord | null, issues: VerificationIssue[]): boolean {
  if (!source) return false;
  const start = issues.length;
  expectExactFields(source, SOURCE_ARCHIVE_FIELDS, "$.sourceArchive", issues);
  readBoundedString(source.filename, "$.sourceArchive.filename", issues, 1024);
  readBoundedString(source.reportedMimeType, "$.sourceArchive.reportedMimeType", issues, 255);
  const reportedBytes = readNonNegativeInteger(source.reportedBytes, "$.sourceArchive.reportedBytes", issues);
  const exactBytes = readNonNegativeInteger(source.exactBytes, "$.sourceArchive.exactBytes", issues);
  const checksum = readRecord(source.checksum, "$.sourceArchive.checksum", issues);
  verifyChecksum(checksum, "archive-bytes", "$.sourceArchive.checksum", issues);
  if (reportedBytes !== null && exactBytes !== null && reportedBytes !== exactBytes) {
    addIssue(
      issues,
      "source-archive-mismatch",
      "$.sourceArchive.reportedBytes",
      "Reported source archive bytes must match the retained exact source bytes.",
    );
  }
  return issues.length === start;
}

function verifyVerification(
  verification: JsonRecord | null,
  sourceArchive: JsonRecord | null,
  issues: VerificationIssue[],
): boolean {
  if (!verification) return false;
  const start = issues.length;
  expectExactFields(verification, VERIFICATION_FIELDS, "$.verification", issues);
  if (verification.valid !== true) {
    addIssue(issues, "verification-check-mismatch", "$.verification.valid", "verification.valid must be true.");
  }
  if (verification.issueCount !== 0) {
    addIssue(issues, "verification-check-mismatch", "$.verification.issueCount", "verification.issueCount must be zero.");
  }
  const archiveBytes = readNonNegativeInteger(verification.archiveBytes, "$.verification.archiveBytes", issues);
  if (archiveBytes !== null && sourceArchive && archiveBytes !== sourceArchive.exactBytes) {
    addIssue(
      issues,
      "verification-check-mismatch",
      "$.verification.archiveBytes",
      "verification.archiveBytes must match sourceArchive.exactBytes.",
    );
  }
  const entryCount = readNonNegativeInteger(verification.entryCount, "$.verification.entryCount", issues);
  if (entryCount !== 3) {
    addIssue(issues, "verification-check-mismatch", "$.verification.entryCount", "verification.entryCount must be three.");
  }
  readNonNegativeInteger(
    verification.totalUncompressedBytes,
    "$.verification.totalUncompressedBytes",
    issues,
  );
  const checks = readRecord(verification.checks, "$.verification.checks", issues);
  if (checks) {
    expectExactFields(checks, VERIFICATION_CHECK_FIELDS, "$.verification.checks", issues);
    for (const field of ["archiveChecksum", "eocd", "centralDirectory", "entryOrder"] as const) {
      if (checks[field] !== true) {
        addIssue(
          issues,
          "verification-check-mismatch",
          `$.verification.checks.${field}`,
          `${field} must be true.`,
        );
      }
    }
    for (const field of [
      "localHeadersVerified",
      "deterministicMetadataVerified",
      "crc32Verified",
      "sha256Verified",
    ] as const) {
      const value = readNonNegativeInteger(checks[field], `$.verification.checks.${field}`, issues);
      if (value !== 3) {
        addIssue(
          issues,
          "verification-check-mismatch",
          `$.verification.checks.${field}`,
          `${field} must equal three verified entries.`,
        );
      }
    }
  }
  return issues.length === start;
}

function verifyExtractionSection(
  extraction: JsonRecord | null,
  mode: "trusted" | "imported",
  sourceArchive: JsonRecord | null,
  issues: VerificationIssue[],
): boolean {
  if (!extraction) return false;
  const path = mode === "trusted" ? "$.trustedExtraction" : "$.importedExtraction";
  const code = mode === "trusted" ? "trusted-extraction-mismatch" : "imported-extraction-mismatch";
  const start = issues.length;
  expectExactFields(
    extraction,
    mode === "trusted" ? TRUSTED_EXTRACTION_FIELDS : IMPORTED_EXTRACTION_FIELDS,
    path,
    issues,
  );
  if (extraction.status !== "extracted") {
    addIssue(issues, code, `${path}.status`, `${path.slice(2)}.status must be extracted.`);
  }
  if (mode === "trusted") {
    if (extraction.bundleStatus !== null && typeof extraction.bundleStatus !== "string") {
      addIssue(issues, "field-type-invalid", `${path}.bundleStatus`, "bundleStatus must be a string or null.");
    }
  } else {
    const sourceFilename = readBoundedString(extraction.sourceArchiveFilename, `${path}.sourceArchiveFilename`, issues, 1024);
    if (sourceFilename && sourceArchive && sourceFilename !== sourceArchive.filename) {
      addIssue(
        issues,
        code,
        `${path}.sourceArchiveFilename`,
        "Imported extraction source filename must match sourceArchive.filename.",
      );
    }
  }
  const artifactCount = readNonNegativeInteger(extraction.artifactCount, `${path}.artifactCount`, issues);
  if (artifactCount !== 3) addIssue(issues, code, `${path}.artifactCount`, "artifactCount must be three.");
  const totalBytes = readNonNegativeInteger(extraction.totalBytes, `${path}.totalBytes`, issues);
  const artifacts = Array.isArray(extraction.artifacts) ? extraction.artifacts : null;
  if (!artifacts) {
    addIssue(issues, "field-type-invalid", `${path}.artifacts`, "artifacts must be an array.");
    return false;
  }
  if (artifacts.length !== 3) addIssue(issues, code, `${path}.artifacts`, "artifacts must contain exactly three entries.");
  let calculatedTotal = 0;
  let previousDataEnd: number | null = null;
  for (let index = 0; index < artifacts.length; index += 1) {
    const artifact = artifacts[index];
    const artifactPath = `${path}.artifacts[${index}]`;
    if (!isRecord(artifact)) {
      addIssue(issues, "field-type-invalid", artifactPath, "Artifact entry must be a plain object.");
      continue;
    }
    const metadata = verifyDocumentArtifact(artifact, index, mode, artifactPath, issues);
    if (metadata.bytes !== null) calculatedTotal += metadata.bytes;
    if (mode === "imported" && metadata.dataOffset !== null && metadata.dataEnd !== null) {
      if (previousDataEnd !== null && metadata.dataOffset < previousDataEnd) {
        addIssue(
          issues,
          "artifact-order-mismatch",
          `${artifactPath}.dataOffset`,
          "Imported artifact byte ranges must be ordered and non-overlapping.",
        );
      }
      if (sourceArchive && typeof sourceArchive.exactBytes === "number" && Number.isSafeInteger(sourceArchive.exactBytes) && metadata.dataEnd > sourceArchive.exactBytes) {
        addIssue(
          issues,
          "artifact-metadata-mismatch",
          `${artifactPath}.dataEnd`,
          "Imported artifact dataEnd must remain within sourceArchive.exactBytes.",
        );
      }
      previousDataEnd = metadata.dataEnd;
    }
  }
  if (totalBytes !== null && totalBytes !== calculatedTotal) {
    addIssue(issues, code, `${path}.totalBytes`, "totalBytes must equal the sum of artifact bytes.");
  }
  return issues.length === start;
}

function verifyDocumentArtifact(
  artifact: JsonRecord,
  index: number,
  mode: "trusted" | "imported",
  path: string,
  issues: VerificationIssue[],
): { bytes: number | null; dataOffset: number | null; dataEnd: number | null } {
  expectExactFields(
    artifact,
    mode === "trusted" ? TRUSTED_ARTIFACT_FIELDS : IMPORTED_ARTIFACT_FIELDS,
    path,
    issues,
  );
  if (artifact.index !== index) {
    addIssue(issues, "artifact-order-mismatch", `${path}.index`, `Artifact index must be ${index}.`);
  }
  const expectedKind = RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_ORDER[index];
  if (!expectedKind || artifact.kind !== expectedKind) {
    addIssue(
      issues,
      "artifact-order-mismatch",
      `${path}.kind`,
      expectedKind ? `Artifact kind must be ${expectedKind}.` : "Unexpected artifact entry.",
    );
  }
  readSafeFilename(artifact.filename, `${path}.filename`, issues);
  const mimeType = readBoundedString(artifact.mimeType, `${path}.mimeType`, issues, 255);
  if (expectedKind && mimeType !== expectedArtifactMimeType(expectedKind)) {
    addIssue(
      issues,
      "artifact-metadata-mismatch",
      `${path}.mimeType`,
      `Artifact ${expectedKind} must use MIME type ${expectedArtifactMimeType(expectedKind)}.`,
    );
  }
  const bytes = readNonNegativeInteger(artifact.bytes, `${path}.bytes`, issues);
  const checksum = readRecord(artifact.checksum, `${path}.checksum`, issues);
  verifyChecksum(
    checksum,
    mode === "trusted" ? "artifact-text-utf8" : "entry-bytes",
    `${path}.checksum`,
    issues,
  );
  let dataOffset: number | null = null;
  let dataEnd: number | null = null;
  if (mode === "imported") {
    dataOffset = readNonNegativeInteger(artifact.dataOffset, `${path}.dataOffset`, issues);
    dataEnd = readNonNegativeInteger(artifact.dataEnd, `${path}.dataEnd`, issues);
    if (bytes !== null && dataOffset !== null && dataEnd !== null && dataEnd - dataOffset !== bytes) {
      addIssue(issues, "artifact-metadata-mismatch", `${path}.dataEnd`, "dataEnd - dataOffset must equal bytes.");
    }
    const crc32 = readRecord(artifact.crc32, `${path}.crc32`, issues);
    verifyCrc32(crc32, `${path}.crc32`, issues);
  }
  return { bytes, dataOffset, dataEnd };
}

function verifyRelationships(
  relationships: unknown[] | null,
  trustedExtraction: JsonRecord | null,
  importedExtraction: JsonRecord | null,
  issues: VerificationIssue[],
): boolean {
  if (!relationships) return false;
  const start = issues.length;
  if (relationships.length !== 3) {
    addIssue(
      issues,
      "relationship-count-mismatch",
      "$.relationships",
      "relationships must contain exactly three fixed-order entries.",
    );
  }
  const trustedArtifacts = trustedExtraction && Array.isArray(trustedExtraction.artifacts)
    ? trustedExtraction.artifacts
    : [];
  const importedArtifacts = importedExtraction && Array.isArray(importedExtraction.artifacts)
    ? importedExtraction.artifacts
    : [];
  for (let index = 0; index < relationships.length; index += 1) {
    const relationship = relationships[index];
    const path = `$.relationships[${index}]`;
    if (!isRecord(relationship)) {
      addIssue(issues, "field-type-invalid", path, "Relationship entry must be a plain object.");
      continue;
    }
    expectExactFields(relationship, RELATIONSHIP_FIELDS, path, issues);
    const expectedKind = RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_ORDER[index];
    if (relationship.index !== index || !expectedKind || relationship.kind !== expectedKind) {
      addIssue(issues, "artifact-order-mismatch", path, "Relationship index and kind must match fixed artifact order.");
    }
    for (const field of [
      "filenameMatches",
      "mimeTypeMatches",
      "byteSizeMatches",
      "dataRangeMatches",
      "crc32Matches",
      "checksumMatches",
      "exactTextMatches",
    ] as const) {
      if (relationship[field] !== true) {
        addIssue(issues, "relationship-mismatch", `${path}.${field}`, `${field} must be true.`);
      }
    }
    const trusted = trustedArtifacts[index];
    const imported = importedArtifacts[index];
    if (isRecord(trusted) && isRecord(imported)) {
      if (
        trusted.kind !== imported.kind ||
        trusted.filename !== imported.filename ||
        trusted.mimeType !== imported.mimeType ||
        trusted.bytes !== imported.bytes
      ) {
        addIssue(
          issues,
          "relationship-mismatch",
          path,
          "Trusted and imported artifact metadata must match for every relationship.",
        );
      }
      const trustedChecksum = isRecord(trusted.checksum) ? trusted.checksum.hex : null;
      const importedChecksum = isRecord(imported.checksum) ? imported.checksum.hex : null;
      if (trustedChecksum !== importedChecksum) {
        addIssue(issues, "sha256-mismatch", path, "Trusted and imported artifact SHA-256 values must match.");
      }
    }
  }
  return issues.length === start;
}

function verifyCrossSectionTotals(
  sections: DocumentSections,
  issues: VerificationIssue[],
  checks: VerificationChecks,
): void {
  if (!sections.verification || !sections.trustedExtraction || !sections.importedExtraction) return;
  const verificationTotal = sections.verification.totalUncompressedBytes;
  const trustedTotal = sections.trustedExtraction.totalBytes;
  const importedTotal = sections.importedExtraction.totalBytes;
  if (verificationTotal !== trustedTotal || verificationTotal !== importedTotal) {
    addIssue(
      issues,
      "verification-check-mismatch",
      "$.verification.totalUncompressedBytes",
      "Verification, trusted extraction, and imported extraction total bytes must match.",
    );
    checks.verification = false;
    checks.trustedExtraction = false;
    checks.importedExtraction = false;
  }
}

function verifyChecksum(
  checksum: JsonRecord | null,
  expectedInput: "archive-bytes" | "entry-bytes" | "artifact-text-utf8",
  path: string,
  issues: VerificationIssue[],
): boolean {
  if (!checksum) return false;
  const start = issues.length;
  expectExactFields(checksum, CHECKSUM_FIELDS, path, issues);
  if (checksum.algorithm !== SHA256_ALGORITHM) {
    addIssue(issues, "sha256-mismatch", `${path}.algorithm`, "Checksum algorithm must be SHA-256.");
  }
  if (checksum.input !== expectedInput) {
    addIssue(issues, "artifact-metadata-mismatch", `${path}.input`, `Checksum input must be ${expectedInput}.`);
  }
  if (typeof checksum.hex !== "string" || !SHA256_PATTERN.test(checksum.hex)) {
    addIssue(issues, "sha256-mismatch", `${path}.hex`, "SHA-256 must be 64 lowercase hexadecimal characters.");
  }
  return issues.length === start;
}

function verifyCrc32(crc32: JsonRecord | null, path: string, issues: VerificationIssue[]): boolean {
  if (!crc32) return false;
  const start = issues.length;
  expectExactFields(crc32, CRC32_FIELDS, path, issues);
  if (crc32.algorithm !== "CRC-32" || crc32.input !== "entry-bytes") {
    addIssue(issues, "crc32-mismatch", path, "CRC-32 metadata must use CRC-32 over entry-bytes.");
  }
  if (typeof crc32.hex !== "string" || !CRC32_PATTERN.test(crc32.hex)) {
    addIssue(issues, "crc32-mismatch", `${path}.hex`, "CRC-32 must be eight lowercase hexadecimal characters.");
  }
  return issues.length === start;
}

function verifyChecksumArtifact(
  text: string,
  checksumHex: string,
  options: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationOptions,
  issues: VerificationIssue[],
): boolean {
  if (options.checksumArtifactText === undefined) return false;
  const filename = options.jsonFilename;
  if (!filename || !SAFE_BASENAME_PATTERN.test(filename)) {
    addIssue(
      issues,
      "checksum-artifact-invalid",
      "$.checksumArtifact",
      "A safe provenance JSON filename is required to verify the checksum artifact.",
    );
    return false;
  }
  let valid = true;
  if (
    options.checksumArtifactFilename !== undefined &&
    (!SAFE_BASENAME_PATTERN.test(options.checksumArtifactFilename) ||
      options.checksumArtifactFilename !== `${filename}.sha256`)
  ) {
    valid = false;
    addIssue(
      issues,
      "checksum-artifact-invalid",
      "$.checksumArtifact.filename",
      "Checksum artifact filename must be the provenance JSON basename plus .sha256.",
    );
  }
  const match = /^([0-9a-f]{64})  ([a-zA-Z0-9._-]+)\n$/.exec(options.checksumArtifactText);
  if (!match) {
    addIssue(
      issues,
      "checksum-artifact-invalid",
      "$.checksumArtifact",
      "Checksum artifact must contain one lowercase SHA-256, two spaces, the JSON basename, and one trailing newline.",
    );
    return false;
  }
  const claimedChecksum = match[1];
  const claimedFilename = match[2];
  if (claimedFilename !== filename) {
    valid = false;
    addIssue(
      issues,
      "checksum-artifact-invalid",
      "$.checksumArtifact.filename",
      "Checksum artifact filename claim does not match the provenance JSON filename.",
    );
  }
  if (claimedChecksum !== checksumHex) {
    valid = false;
    addIssue(issues, "sha256-mismatch", "$.checksumArtifact.sha256", "Checksum artifact SHA-256 does not match exact JSON bytes.");
  }
  if (new TextEncoder().encode(text).byteLength === 0) {
    valid = false;
    addIssue(issues, "checksum-artifact-invalid", "$.checksumArtifact", "Checksum artifact cannot verify empty JSON bytes.");
  }
  return valid;
}

async function verifyExpectedProvenance(
  text: string,
  checksumHex: string,
  provenance: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceResult | undefined,
  issues: VerificationIssue[],
  anchors: VerificationAnchors,
): Promise<void> {
  if (!provenance) return;
  const start = issues.length;
  if (provenance.status !== "created" || !provenance.document) {
    addIssue(
      issues,
      "expected-provenance-mismatch",
      "$.expectedProvenance",
      "Expected provenance result must be in created state with a document.",
    );
  }
  if (provenance.document) {
    const expectedText = `${JSON.stringify(canonicalize(provenance.document), null, 2)}\n`;
    if (expectedText !== text) {
      addIssue(
        issues,
        "expected-provenance-mismatch",
        "$.expectedProvenance.document",
        "Expected provenance document does not serialize to the exact verified JSON bytes.",
      );
    }
  }
  const jsonArtifacts = provenance.artifacts.filter((artifact) => artifact.kind === "provenance-report-json");
  if (jsonArtifacts.length !== 1) {
    addIssue(
      issues,
      "expected-provenance-mismatch",
      "$.expectedProvenance.artifacts",
      "Expected provenance result must contain exactly one JSON artifact.",
    );
  } else {
    const artifact = jsonArtifacts[0]!;
    if (artifact.text !== text || artifact.bytes !== new TextEncoder().encode(text).byteLength) {
      addIssue(
        issues,
        "expected-provenance-mismatch",
        "$.expectedProvenance.artifacts",
        "Expected provenance JSON artifact text or byte size does not match the verified input.",
      );
    }
    if (artifact.checksumHex !== checksumHex) {
      addIssue(
        issues,
        "expected-provenance-mismatch",
        "$.expectedProvenance.artifacts",
        "Expected provenance JSON artifact checksum does not match exact verified JSON bytes.",
      );
    }
  }
  anchors.expectedProvenance = issues.length === start;
}

async function verifyEntryExtractionAnchor(
  document: JsonRecord,
  entryExtraction: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveExtractionResult | undefined,
  subtle: SubtleCrypto,
  issues: VerificationIssue[],
  anchors: VerificationAnchors,
): Promise<void> {
  if (!entryExtraction) return;
  const start = issues.length;
  if (
    entryExtraction.status !== "extracted" ||
    entryExtraction.extraction.status !== "extracted" ||
    entryExtraction.importResult.status !== "verified" ||
    !entryExtraction.importResult.verification?.valid ||
    !entryExtraction.importResult.data
  ) {
    addIssue(
      issues,
      "trusted-extraction-mismatch",
      "$.expectedEntryExtraction",
      "Trusted entry extraction anchor is incomplete or not verified.",
    );
    anchors.entryExtraction = false;
    return;
  }

  const source = isRecord(document.sourceArchive) ? document.sourceArchive : null;
  const verification = isRecord(document.verification) ? document.verification : null;
  const trustedExtraction = isRecord(document.trustedExtraction) ? document.trustedExtraction : null;
  const importedExtraction = isRecord(document.importedExtraction) ? document.importedExtraction : null;
  if (!source || !verification || !trustedExtraction || !importedExtraction) {
    addIssue(issues, "trusted-extraction-mismatch", "$", "Document sections are unavailable for trusted anchor verification.");
    anchors.entryExtraction = false;
    return;
  }

  const importResult = entryExtraction.importResult;
  const importData = importResult.data;
  const trustedVerification = importResult.verification;
  if (!importData || !trustedVerification) {
    addIssue(issues, "trusted-extraction-mismatch", "$.expectedEntryExtraction", "Trusted source ZIP bytes or verification metadata are unavailable.");
    anchors.entryExtraction = false;
    return;
  }
  const archiveChecksum = await digestBytes(importData, subtle);
  if (
    source.filename !== importResult.file.filename ||
    source.reportedMimeType !== importResult.file.mimeType ||
    source.reportedBytes !== importResult.file.bytes ||
    source.exactBytes !== importData.byteLength ||
    !isRecord(source.checksum) ||
    source.checksum.hex !== archiveChecksum
  ) {
    addIssue(
      issues,
      "source-archive-mismatch",
      "$.sourceArchive",
      "Source archive metadata or exact SHA-256 does not match trusted imported ZIP bytes.",
    );
  }

  if (
    verification.valid !== trustedVerification.valid ||
    verification.issueCount !== trustedVerification.issues.length ||
    verification.archiveBytes !== trustedVerification.archiveBytes ||
    verification.entryCount !== trustedVerification.entryCount ||
    verification.totalUncompressedBytes !== trustedVerification.totalUncompressedBytes ||
    !sameRecordValues(verification.checks, trustedVerification.checks)
  ) {
    addIssue(
      issues,
      "verification-check-mismatch",
      "$.verification",
      "Provenance verification metadata does not match the trusted ZIP verifier result.",
    );
  }

  const trustedArtifacts = Array.isArray(trustedExtraction.artifacts) ? trustedExtraction.artifacts : [];
  const importedArtifacts = Array.isArray(importedExtraction.artifacts) ? importedExtraction.artifacts : [];
  if (
    trustedArtifacts.length !== entryExtraction.extraction.artifacts.length ||
    importedArtifacts.length !== entryExtraction.artifacts.length
  ) {
    addIssue(
      issues,
      "artifact-order-mismatch",
      "$.trustedExtraction.artifacts",
      "Provenance artifact counts do not match the trusted entry extraction anchor.",
    );
  }

  const encoder = new TextEncoder();
  for (let index = 0; index < 3; index += 1) {
    const documentTrusted = trustedArtifacts[index];
    const documentImported = importedArtifacts[index];
    const trusted = entryExtraction.extraction.artifacts[index];
    const imported = entryExtraction.artifacts[index];
    const verifiedEntry = trustedVerification.entries[index];
    if (!isRecord(documentTrusted) || !isRecord(documentImported) || !trusted || !imported || !verifiedEntry) {
      addIssue(
        issues,
        "artifact-order-mismatch",
        `$.relationships[${index}]`,
        "Trusted anchor artifact relationship is incomplete.",
      );
      continue;
    }
    if (
      documentTrusted.index !== index ||
      documentTrusted.kind !== trusted.kind ||
      documentTrusted.filename !== trusted.filename ||
      documentTrusted.mimeType !== trusted.mimeType ||
      documentTrusted.bytes !== trusted.bytes ||
      !isRecord(documentTrusted.checksum) ||
      documentTrusted.checksum.hex !== trusted.checksumHex
    ) {
      addIssue(
        issues,
        "trusted-extraction-mismatch",
        `$.trustedExtraction.artifacts[${index}]`,
        "Trusted artifact metadata does not match the trusted extraction anchor.",
      );
    }

    const trustedTextBytes = encoder.encode(trusted.text);
    const trustedChecksumHex = await digestBytes(trustedTextBytes, subtle);
    if (
      trustedTextBytes.byteLength !== trusted.bytes ||
      trustedChecksumHex !== trusted.checksumHex ||
      !isRecord(documentTrusted.checksum) ||
      documentTrusted.checksum.hex !== trustedChecksumHex
    ) {
      addIssue(
        issues,
        "trusted-extraction-mismatch",
        `$.trustedExtraction.artifacts[${index}].checksum`,
        "Trusted artifact UTF-8 bytes or SHA-256 do not match the trusted extraction anchor.",
      );
    }

    const crc32Hex = calculateCrc32(imported.data).toString(16).padStart(8, "0");
    const checksumHex = await digestBytes(imported.data, subtle);
    if (
      documentImported.index !== index ||
      documentImported.kind !== imported.kind ||
      documentImported.filename !== imported.filename ||
      documentImported.mimeType !== imported.mimeType ||
      documentImported.bytes !== imported.bytes ||
      documentImported.dataOffset !== imported.dataOffset ||
      documentImported.dataEnd !== imported.dataEnd ||
      !isRecord(documentImported.crc32) ||
      documentImported.crc32.hex !== crc32Hex ||
      !isRecord(documentImported.checksum) ||
      documentImported.checksum.hex !== checksumHex
    ) {
      addIssue(
        issues,
        "imported-extraction-mismatch",
        `$.importedExtraction.artifacts[${index}]`,
        "Imported artifact metadata or exact entry bytes do not match the trusted extraction anchor.",
      );
    }
    if (
      verifiedEntry.kind !== imported.kind ||
      verifiedEntry.filename !== imported.filename ||
      verifiedEntry.bytes !== imported.bytes ||
      verifiedEntry.crc32Hex !== crc32Hex ||
      verifiedEntry.checksumHex !== checksumHex
    ) {
      addIssue(
        issues,
        "imported-extraction-mismatch",
        `$.importedExtraction.artifacts[${index}]`,
        "Imported artifact no longer matches the trusted archive verification entry.",
      );
    }
    const sourceRange = importData.subarray(imported.dataOffset, imported.dataEnd);
    if (
      imported.dataOffset < 0 ||
      imported.dataEnd < imported.dataOffset ||
      imported.dataEnd > importData.byteLength ||
      imported.dataEnd - imported.dataOffset !== imported.bytes ||
      !equalBytes(sourceRange, imported.data)
    ) {
      addIssue(
        issues,
        "imported-extraction-mismatch",
        `$.importedExtraction.artifacts[${index}].dataOffset`,
        "Imported artifact data range does not match exact retained source ZIP bytes.",
      );
    }
    if (crc32Hex !== imported.crc32Hex) {
      addIssue(issues, "crc32-mismatch", `$.importedExtraction.artifacts[${index}].crc32`, "Imported entry CRC-32 changed after extraction.");
    }
    if (checksumHex !== imported.checksumHex || checksumHex !== trusted.checksumHex) {
      addIssue(issues, "sha256-mismatch", `$.importedExtraction.artifacts[${index}].checksum`, "Imported entry SHA-256 changed after extraction.");
    }
    if (!equalBytes(imported.data, encoder.encode(trusted.text)) || imported.text !== trusted.text) {
      addIssue(issues, "relationship-mismatch", `$.relationships[${index}].exactTextMatches`, "Imported entry bytes no longer match trusted UTF-8 text.");
    }
  }
  anchors.entryExtraction = issues.length === start;
  anchors.sourceArchiveChecksum = archiveChecksum === (isRecord(source.checksum) ? source.checksum.hex : null);
}

function verifySourceChecksumAnchor(
  document: JsonRecord,
  expectedChecksumHex: string | undefined,
  issues: VerificationIssue[],
  anchors: VerificationAnchors,
): void {
  if (expectedChecksumHex === undefined) return;
  const source = isRecord(document.sourceArchive) ? document.sourceArchive : null;
  const checksum = source && isRecord(source.checksum) ? source.checksum.hex : null;
  const valid = SHA256_PATTERN.test(expectedChecksumHex) && checksum === expectedChecksumHex;
  anchors.sourceArchiveChecksum = valid;
  if (!valid) {
    addIssue(
      issues,
      "source-archive-checksum-mismatch",
      "$.sourceArchive.checksum.hex",
      "Provenance source archive SHA-256 does not match the expected trusted checksum anchor.",
    );
  }
}

async function verifyArtifactEnvelope(
  provenance: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceResult,
  jsonArtifact: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceArtifact,
  checksumArtifact: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceArtifact | null,
  result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationResult,
): Promise<void> {
  const start = result.issues.length;
  const expectedKinds = [
    "provenance-report-text",
    "provenance-report-json",
    "provenance-report-json-sha256",
  ] as const;
  if (provenance.artifactCount !== 3 || provenance.artifacts.length !== 3) {
    addIssue(
      result.issues,
      "artifact-order-mismatch",
      "$.artifacts",
      "Provenance result must declare and contain exactly three artifacts.",
    );
  }
  let totalBytes = 0;
  for (let index = 0; index < provenance.artifacts.length; index += 1) {
    const artifact = provenance.artifacts[index];
    const expectedKind = expectedKinds[index];
    if (!artifact || artifact.kind !== expectedKind) {
      addIssue(
        result.issues,
        "artifact-order-mismatch",
        `$.artifacts[${index}]`,
        expectedKind ? `Provenance artifact ${index} must be ${expectedKind}.` : "Unexpected provenance artifact.",
      );
      continue;
    }
    totalBytes += artifact.bytes;
  }
  if (provenance.totalBytes !== totalBytes) {
    addIssue(
      result.issues,
      "artifact-metadata-mismatch",
      "$.totalBytes",
      "Provenance totalBytes must equal the sum of artifact byte sizes.",
    );
  }
  const subtle = globalThis.crypto?.subtle;
  for (let index = 0; index < provenance.artifacts.length; index += 1) {
    const artifact = provenance.artifacts[index];
    if (!artifact) continue;
    const actualArtifactBytes = new TextEncoder().encode(artifact.text).byteLength;
    const expectedMimeType = artifact.kind === "provenance-report-json"
      ? "application/json;charset=utf-8"
      : "text/plain;charset=utf-8";
    if (
      artifact.bytes !== actualArtifactBytes ||
      artifact.mimeType !== expectedMimeType ||
      !SAFE_BASENAME_PATTERN.test(artifact.filename)
    ) {
      addIssue(
        result.issues,
        "artifact-metadata-mismatch",
        `$.artifacts[${index}]`,
        "Provenance artifact filename, MIME type, or UTF-8 byte size is invalid.",
      );
    }
    if (subtle) {
      const artifactChecksum = await digestText(artifact.text, subtle);
      if (artifact.checksumHex !== artifactChecksum) {
        addIssue(
          result.issues,
          "sha256-mismatch",
          `$.artifacts[${index}].checksumHex`,
          "Provenance artifact SHA-256 does not match exact UTF-8 bytes.",
        );
      }
    }
  }
  const actualBytes = new TextEncoder().encode(jsonArtifact.text).byteLength;
  if (
    jsonArtifact.mimeType !== "application/json;charset=utf-8" ||
    jsonArtifact.bytes !== actualBytes ||
    !SAFE_BASENAME_PATTERN.test(jsonArtifact.filename)
  ) {
    addIssue(
      result.issues,
      "artifact-metadata-mismatch",
      "$.artifacts.provenance-report-json",
      "Provenance JSON artifact metadata does not match its exact UTF-8 text.",
    );
  }
  if (!subtle) return;
  const jsonChecksum = await digestText(jsonArtifact.text, subtle);
  if (jsonArtifact.checksumHex !== jsonChecksum) {
    addIssue(
      result.issues,
      "sha256-mismatch",
      "$.artifacts.provenance-report-json.checksumHex",
      "Provenance JSON artifact checksum does not match exact JSON bytes.",
    );
  }
  if (!checksumArtifact) {
    addIssue(
      result.issues,
      "checksum-artifact-invalid",
      "$.artifacts",
      "Provenance result must contain exactly one JSON SHA-256 artifact.",
    );
    result.anchors.jsonChecksumArtifact = false;
    return;
  }
  const checksumBytes = new TextEncoder().encode(checksumArtifact.text).byteLength;
  const checksumDigest = await digestText(checksumArtifact.text, subtle);
  if (
    checksumArtifact.mimeType !== "text/plain;charset=utf-8" ||
    checksumArtifact.bytes !== checksumBytes ||
    checksumArtifact.checksumHex !== checksumDigest ||
    !SAFE_BASENAME_PATTERN.test(checksumArtifact.filename)
  ) {
    addIssue(
      result.issues,
      "checksum-artifact-invalid",
      "$.artifacts.provenance-report-json-sha256",
      "Provenance checksum artifact metadata or own SHA-256 is invalid.",
    );
    result.anchors.jsonChecksumArtifact = false;
  }
  if (result.anchors.jsonChecksumArtifact !== null && result.issues.length === start) {
    result.anchors.jsonChecksumArtifact = true;
  }
}

function validateValueBounds(
  value: unknown,
  path: string,
  depth: number,
  limits: Limits,
  issues: VerificationIssue[],
): void {
  if (depth > limits.maxDepth) {
    addIssue(issues, "field-value-invalid", path, `JSON nesting exceeds the maximum depth ${limits.maxDepth}.`);
    return;
  }
  if (typeof value === "string") {
    if (value.length > limits.maxStringCharacters) {
      addIssue(issues, "string-size-invalid", path, `String exceeds ${limits.maxStringCharacters} characters.`);
    }
    return;
  }
  if (Array.isArray(value)) {
    if (value.length > limits.maxArrayEntries) {
      addIssue(issues, "array-size-invalid", path, `Array exceeds ${limits.maxArrayEntries} entries.`);
      return;
    }
    for (let index = 0; index < value.length; index += 1) {
      validateValueBounds(value[index], `${path}[${index}]`, depth + 1, limits, issues);
    }
    return;
  }
  if (isRecord(value)) {
    const keys = Object.keys(value);
    if (keys.length > limits.maxObjectFields) {
      addIssue(issues, "field-value-invalid", path, `Object exceeds ${limits.maxObjectFields} fields.`);
      return;
    }
    for (const key of keys) validateValueBounds(value[key], `${path}.${key}`, depth + 1, limits, issues);
  }
}

function expectExactFields(
  record: JsonRecord,
  expected: readonly string[],
  path: string,
  issues: VerificationIssue[],
): void {
  const expectedSet = new Set(expected);
  for (const key of Object.keys(record)) {
    if (!expectedSet.has(key)) addIssue(issues, "unknown-field", `${path}.${key}`, `Unknown field ${key}.`);
  }
  for (const key of expected) {
    if (!Object.hasOwn(record, key)) addIssue(issues, "field-type-invalid", `${path}.${key}`, `Required field ${key} is missing.`);
  }
}

function readRecord(value: unknown, path: string, issues: VerificationIssue[]): JsonRecord | null {
  if (isRecord(value)) return value;
  addIssue(issues, "field-type-invalid", path, "Value must be a plain JSON object.");
  return null;
}

function expectedArtifactMimeType(
  kind: (typeof RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_ORDER)[number],
): string {
  return kind === "validation-report-json"
    ? "application/json;charset=utf-8"
    : "text/plain;charset=utf-8";
}

function readSafeFilename(value: unknown, path: string, issues: VerificationIssue[]): string | null {
  const filename = readBoundedString(value, path, issues, 255);
  if (filename !== null && !SAFE_BASENAME_PATTERN.test(filename)) {
    addIssue(issues, "field-value-invalid", path, "Filename must be a safe basename without path separators.");
    return null;
  }
  return filename;
}

function readBoundedString(
  value: unknown,
  path: string,
  issues: VerificationIssue[],
  maxCharacters: number,
): string | null {
  if (typeof value !== "string") {
    addIssue(issues, "field-type-invalid", path, "Value must be a string.");
    return null;
  }
  if (value.length === 0 || value.length > maxCharacters) {
    addIssue(issues, "field-value-invalid", path, `String must contain 1-${maxCharacters} characters.`);
    return null;
  }
  return value;
}

function readNonNegativeInteger(value: unknown, path: string, issues: VerificationIssue[]): number | null {
  if (!Number.isSafeInteger(value) || typeof value !== "number" || value < 0) {
    addIssue(issues, "field-type-invalid", path, "Value must be a non-negative safe integer.");
    return null;
  }
  return value;
}

function sameRecordValues(left: unknown, right: unknown): boolean {
  if (!isRecord(left) || !isRecord(right)) return false;
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  if (leftKeys.length !== rightKeys.length) return false;
  for (let index = 0; index < leftKeys.length; index += 1) {
    const key = leftKeys[index];
    if (!key || key !== rightKeys[index] || left[key] !== right[key]) return false;
  }
  return true;
}

function createChecks(): VerificationChecks {
  return {
    parsed: false,
    schema: false,
    canonical: false,
    sourceArchive: false,
    verification: false,
    trustedExtraction: false,
    importedExtraction: false,
    relationships: false,
    jsonChecksum: false,
  };
}

function createAnchors(
  options: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationOptions,
): VerificationAnchors {
  return {
    expectedProvenance: options.expectedProvenance ? false : null,
    entryExtraction: options.expectedEntryExtraction ? false : null,
    sourceArchiveChecksum: options.expectedSourceArchiveChecksumHex ? false : null,
    jsonChecksumArtifact: options.checksumArtifactText !== undefined ? false : null,
  };
}

function createResult(
  document: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceDocument | null,
  canonicalText: string | null,
  bytes: number,
  checksumHex: string | null,
  issues: VerificationIssue[],
  checks: VerificationChecks,
  anchors: VerificationAnchors,
): RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationResult {
  return {
    valid: false,
    trust: "untrusted",
    document,
    canonicalText,
    bytes,
    checksumHex,
    issues,
    checks,
    anchors,
  };
}

function createEarlyFailure(
  bytes: number,
  code: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationIssueCode,
  path: string,
  message: string,
): RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationResult {
  const issues: VerificationIssue[] = [];
  addIssue(issues, code, path, message);
  return createResult(null, null, bytes, null, issues, createChecks(), {
    expectedProvenance: null,
    entryExtraction: null,
    sourceArchiveChecksum: null,
    jsonChecksumArtifact: null,
  });
}

function finalizeResult(
  result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationResult,
): void {
  if (result.anchors.jsonChecksumArtifact !== null && result.anchors.jsonChecksumArtifact !== false) {
    result.anchors.jsonChecksumArtifact = result.checks.jsonChecksum;
  }
  result.valid = result.issues.length === 0;
  if (!result.valid) {
    result.trust = "untrusted";
    return;
  }
  const trustedAnchors = [
    result.anchors.expectedProvenance,
    result.anchors.entryExtraction,
    result.anchors.sourceArchiveChecksum,
  ].filter((value): value is boolean => value !== null);
  result.trust = trustedAnchors.length > 0 && trustedAnchors.every(Boolean)
    ? "anchored"
    : "self-consistent";
}

function normalizeLimits(
  options: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationOptions,
): Limits {
  return {
    maxTextBytes: normalizePositiveInteger(options.maxTextBytes, DEFAULT_MAX_TEXT_BYTES, "maxTextBytes"),
    maxStringCharacters: normalizePositiveInteger(
      options.maxStringCharacters,
      DEFAULT_MAX_STRING_CHARACTERS,
      "maxStringCharacters",
    ),
    maxArrayEntries: normalizePositiveInteger(options.maxArrayEntries, DEFAULT_MAX_ARRAY_ENTRIES, "maxArrayEntries"),
    maxObjectFields: normalizePositiveInteger(options.maxObjectFields, DEFAULT_MAX_OBJECT_FIELDS, "maxObjectFields"),
    maxDepth: normalizePositiveInteger(options.maxDepth, DEFAULT_MAX_DEPTH, "maxDepth"),
  };
}

function normalizePositiveInteger(value: number | undefined, fallback: number, label: string): number {
  if (value === undefined) return fallback;
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${label} must be a positive safe integer.`);
  return value;
}

function findSingleArtifact(
  artifacts: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceArtifact[],
  kind: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceArtifact["kind"],
): RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceArtifact | null {
  const matches = artifacts.filter((artifact) => artifact.kind === kind);
  return matches.length === 1 ? matches[0] ?? null : null;
}

function addIssue(
  issues: VerificationIssue[],
  code: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationIssueCode,
  path: string,
  message: string,
): void {
  issues.push({ code, path, message });
}

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (isRecord(value)) {
    const output: JsonRecord = {};
    for (const key of Object.keys(value).sort()) output[key] = canonicalize(value[key]);
    return output;
  }
  return value;
}

async function digestText(text: string, subtle: SubtleCrypto): Promise<string> {
  return digestBytes(new TextEncoder().encode(text), subtle);
}

async function digestBytes(bytes: Uint8Array, subtle: SubtleCrypto): Promise<string> {
  return bytesToHex(await subtle.digest(SHA256_ALGORITHM, copyToArrayBuffer(bytes)));
}

function calculateCrc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = CRC32_TABLE[(crc ^ byte) & 0xff]! ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function createCrc32Table(): Uint32Array {
  const table = new Uint32Array(256);
  for (let index = 0; index < table.length; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) value = (value & 1) !== 0 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    table[index] = value >>> 0;
  }
  return table;
}

function equalBytes(left: Uint8Array, right: Uint8Array): boolean {
  if (left.byteLength !== right.byteLength) return false;
  for (let index = 0; index < left.byteLength; index += 1) if (left[index] !== right[index]) return false;
  return true;
}

function copyToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

function bytesToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function createActionButton(labelText: string, previewText: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  Object.assign(button.style, { display: "grid", width: "100%", gap: "2px", textAlign: "left" });
  const label = document.createElement("span");
  label.textContent = labelText;
  const preview = document.createElement("small");
  preview.textContent = previewText;
  preview.style.fontSize = "9px";
  preview.style.opacity = "0.66";
  preview.style.overflowWrap = "anywhere";
  button.title = previewText;
  button.setAttribute("aria-label", `${labelText}. ${previewText}`);
  button.append(label, preview);
  return button;
}

function formatIssueCount(count: number): string {
  return `${count} verification issue${count === 1 ? "" : "s"}`;
}

function formatBooleanCheck(value: boolean): string {
  return value ? "verified" : "failed";
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
