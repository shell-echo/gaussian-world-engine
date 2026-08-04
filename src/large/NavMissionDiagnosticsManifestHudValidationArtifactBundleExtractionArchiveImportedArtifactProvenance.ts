import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleEntryKind,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundle.js";
import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportResult,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImport.js";
import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveArtifact,
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveExtractionResult,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactExtraction.js";

export const RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_IMPORTED_ARCHIVE_PROVENANCE_SCHEMA =
  "splat-world-engine/mission-diagnostics-policy-manifest-verified-imported-archive-provenance";
export const RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_IMPORTED_ARCHIVE_PROVENANCE_SCHEMA_VERSION =
  1 as const;

const SHA256_ALGORITHM = "SHA-256" as const;
const DEFAULT_PREVIEW_CHARACTERS = 4096;
const CRC32_TABLE = createCrc32Table();

export type RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceStatus =
  | "created"
  | "import-unavailable"
  | "verification-unavailable"
  | "entry-extraction-unavailable"
  | "relationship-invalid"
  | "crypto-unavailable"
  | "provenance-error";

export type RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceArtifactKind =
  | "provenance-report-text"
  | "provenance-report-json"
  | "provenance-report-json-sha256";

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceChecksum {
  algorithm: typeof SHA256_ALGORITHM;
  input: "archive-bytes" | "entry-bytes" | "artifact-text-utf8";
  hex: string;
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceCrc32 {
  algorithm: "CRC-32";
  input: "entry-bytes";
  hex: string;
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceDocument {
  schema: typeof RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_IMPORTED_ARCHIVE_PROVENANCE_SCHEMA;
  schemaVersion: typeof RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_IMPORTED_ARCHIVE_PROVENANCE_SCHEMA_VERSION;
  target: unknown;
  sourceArchive: {
    filename: string;
    reportedMimeType: string;
    reportedBytes: number;
    exactBytes: number;
    checksum: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceChecksum;
  };
  verification: {
    valid: true;
    issueCount: 0;
    archiveBytes: number;
    entryCount: number;
    totalUncompressedBytes: number;
    checks: {
      archiveChecksum: true;
      eocd: true;
      centralDirectory: true;
      entryOrder: true;
      localHeadersVerified: number;
      deterministicMetadataVerified: number;
      crc32Verified: number;
      sha256Verified: number;
    };
  };
  trustedExtraction: {
    status: "extracted";
    bundleStatus: string | null;
    artifactCount: number;
    totalBytes: number;
    artifacts: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceTrustedArtifact[];
  };
  importedExtraction: {
    status: "extracted";
    sourceArchiveFilename: string;
    artifactCount: number;
    totalBytes: number;
    artifacts: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceImportedArtifact[];
  };
  relationships: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceRelationship[];
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceTrustedArtifact {
  index: number;
  kind: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleEntryKind;
  filename: string;
  mimeType: string;
  bytes: number;
  checksum: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceChecksum;
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceImportedArtifact {
  index: number;
  kind: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleEntryKind;
  filename: string;
  mimeType: string;
  bytes: number;
  dataOffset: number;
  dataEnd: number;
  crc32: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceCrc32;
  checksum: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceChecksum;
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceRelationship {
  index: number;
  kind: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleEntryKind;
  filenameMatches: true;
  mimeTypeMatches: true;
  byteSizeMatches: true;
  dataRangeMatches: true;
  crc32Matches: true;
  checksumMatches: true;
  exactTextMatches: true;
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceArtifact {
  kind: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceArtifactKind;
  filename: string;
  mimeType: "text/plain;charset=utf-8" | "application/json;charset=utf-8";
  bytes: number;
  checksumHex: string;
  text: string;
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceResult {
  status: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceStatus;
  entryExtraction: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveExtractionResult;
  importResult: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportResult;
  document: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceDocument | null;
  artifactCount: number;
  totalBytes: number;
  artifacts: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceArtifact[];
  error: string | null;
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceActionsOptions {
  maxPreviewCharacters?: number;
  onCreate?: (
    result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceResult,
  ) => void;
  onArtifactDownload?: (
    artifact: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceArtifact,
    result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceResult,
  ) => void;
  onDownloadAll?: (
    result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceResult,
  ) => void;
  onArtifactCopy?: (
    artifact: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceArtifact,
    result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceResult,
  ) => void;
  onStatus?: (message: string) => void;
}

export async function createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenance(
  entryExtraction: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveExtractionResult,
): Promise<RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceResult> {
  const importResult = entryExtraction.importResult;
  if (importResult.status !== "verified") {
    return createProvenanceFailure(
      "import-unavailable",
      entryExtraction,
      "External artifact ZIP import must be verified before provenance can be generated.",
    );
  }
  if (!importResult.verification || !importResult.verification.valid || importResult.verification.issues.length > 0) {
    return createProvenanceFailure(
      "verification-unavailable",
      entryExtraction,
      "External artifact ZIP verification must be valid and issue-free before provenance can be generated.",
    );
  }
  if (entryExtraction.status !== "extracted") {
    return createProvenanceFailure(
      "entry-extraction-unavailable",
      entryExtraction,
      entryExtraction.error ?? "Verified imported archive entries are unavailable.",
    );
  }
  if (!importResult.data || !importResult.verification.archiveChecksumHex) {
    return createProvenanceFailure(
      "verification-unavailable",
      entryExtraction,
      "Verified source ZIP bytes or archive SHA-256 are unavailable.",
    );
  }
  if (entryExtraction.extraction.status !== "extracted") {
    return createProvenanceFailure(
      "relationship-invalid",
      entryExtraction,
      entryExtraction.extraction.error ?? "Trusted artifact extraction is unavailable.",
    );
  }

  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    return createProvenanceFailure(
      "crypto-unavailable",
      entryExtraction,
      "Web Crypto is unavailable; provenance checksums cannot be calculated.",
    );
  }

  try {
    const verification = importResult.verification;
    const trustedArtifacts = entryExtraction.extraction.artifacts;
    const importedArtifacts = entryExtraction.artifacts;
    if (
      verification.entries.length !== importedArtifacts.length ||
      importedArtifacts.length !== trustedArtifacts.length ||
      importedArtifacts.length !== 3
    ) {
      return createProvenanceFailure(
        "relationship-invalid",
        entryExtraction,
        "Provenance requires exactly three aligned verified, imported, and trusted artifacts.",
      );
    }

    const sourceArchiveChecksumHex = bytesToHex(
      await subtle.digest(SHA256_ALGORITHM, importResult.data),
    );
    if (sourceArchiveChecksumHex !== verification.archiveChecksumHex) {
      return createProvenanceFailure(
        "relationship-invalid",
        entryExtraction,
        "Source ZIP SHA-256 changed after archive verification.",
      );
    }

    const trustedDocumentArtifacts: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceTrustedArtifact[] = [];
    const importedDocumentArtifacts: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceImportedArtifact[] = [];
    const relationships: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceRelationship[] = [];
    const encoder = new TextEncoder();

    for (let index = 0; index < importedArtifacts.length; index += 1) {
      const importedArtifact = importedArtifacts[index];
      const trustedArtifact = trustedArtifacts[index];
      const verifiedEntry = verification.entries[index];
      if (!importedArtifact || !trustedArtifact || !verifiedEntry || verifiedEntry.kind === null) {
        return createProvenanceFailure(
          "relationship-invalid",
          entryExtraction,
          `Provenance artifact relationship ${index} is incomplete.`,
        );
      }
      if (
        importedArtifact.kind !== trustedArtifact.kind ||
        importedArtifact.kind !== verifiedEntry.kind ||
        importedArtifact.filename !== trustedArtifact.filename ||
        importedArtifact.filename !== verifiedEntry.filename ||
        importedArtifact.mimeType !== trustedArtifact.mimeType ||
        importedArtifact.bytes !== trustedArtifact.bytes ||
        importedArtifact.bytes !== verifiedEntry.bytes ||
        importedArtifact.dataEnd - importedArtifact.dataOffset !== importedArtifact.bytes ||
        importedArtifact.data.byteLength !== importedArtifact.bytes
      ) {
        return createProvenanceFailure(
          "relationship-invalid",
          entryExtraction,
          `Provenance artifact relationship ${index} metadata no longer matches.`,
        );
      }

      const actualCrc32Hex = calculateCrc32(importedArtifact.data).toString(16).padStart(8, "0");
      if (actualCrc32Hex !== importedArtifact.crc32Hex || actualCrc32Hex !== verifiedEntry.crc32Hex) {
        return createProvenanceFailure(
          "relationship-invalid",
          entryExtraction,
          `Provenance artifact relationship ${index} CRC-32 no longer matches.`,
        );
      }

      const importedChecksumHex = bytesToHex(
        await subtle.digest(SHA256_ALGORITHM, importedArtifact.data),
      );
      if (
        importedChecksumHex !== importedArtifact.checksumHex ||
        importedChecksumHex !== trustedArtifact.checksumHex ||
        importedChecksumHex !== verifiedEntry.checksumHex
      ) {
        return createProvenanceFailure(
          "relationship-invalid",
          entryExtraction,
          `Provenance artifact relationship ${index} SHA-256 no longer matches.`,
        );
      }

      const trustedTextBytes = encoder.encode(trustedArtifact.text);
      if (
        importedArtifact.text !== trustedArtifact.text ||
        !equalBytes(importedArtifact.data, trustedTextBytes)
      ) {
        return createProvenanceFailure(
          "relationship-invalid",
          entryExtraction,
          `Provenance artifact relationship ${index} exact text no longer matches.`,
        );
      }

      trustedDocumentArtifacts.push({
        index,
        kind: trustedArtifact.kind,
        filename: trustedArtifact.filename,
        mimeType: trustedArtifact.mimeType,
        bytes: trustedArtifact.bytes,
        checksum: {
          algorithm: SHA256_ALGORITHM,
          input: "artifact-text-utf8",
          hex: trustedArtifact.checksumHex,
        },
      });
      importedDocumentArtifacts.push({
        index,
        kind: importedArtifact.kind,
        filename: importedArtifact.filename,
        mimeType: importedArtifact.mimeType,
        bytes: importedArtifact.bytes,
        dataOffset: importedArtifact.dataOffset,
        dataEnd: importedArtifact.dataEnd,
        crc32: {
          algorithm: "CRC-32",
          input: "entry-bytes",
          hex: actualCrc32Hex,
        },
        checksum: {
          algorithm: SHA256_ALGORITHM,
          input: "entry-bytes",
          hex: importedChecksumHex,
        },
      });
      relationships.push({
        index,
        kind: importedArtifact.kind,
        filenameMatches: true,
        mimeTypeMatches: true,
        byteSizeMatches: true,
        dataRangeMatches: true,
        crc32Matches: true,
        checksumMatches: true,
        exactTextMatches: true,
      });
    }

    const document: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceDocument = {
      schema: RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_IMPORTED_ARCHIVE_PROVENANCE_SCHEMA,
      schemaVersion:
        RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_IMPORTED_ARCHIVE_PROVENANCE_SCHEMA_VERSION,
      target: entryExtraction.extraction.verification.document?.target ?? null,
      sourceArchive: {
        filename: importResult.file.filename,
        reportedMimeType: importResult.file.mimeType,
        reportedBytes: importResult.file.bytes,
        exactBytes: importResult.data.byteLength,
        checksum: {
          algorithm: SHA256_ALGORITHM,
          input: "archive-bytes",
          hex: sourceArchiveChecksumHex,
        },
      },
      verification: {
        valid: true,
        issueCount: 0,
        archiveBytes: verification.archiveBytes,
        entryCount: verification.entryCount,
        totalUncompressedBytes: verification.totalUncompressedBytes,
        checks: {
          archiveChecksum: true,
          eocd: true,
          centralDirectory: true,
          entryOrder: true,
          localHeadersVerified: verification.checks.localHeadersVerified,
          deterministicMetadataVerified: verification.checks.deterministicMetadataVerified,
          crc32Verified: verification.checks.crc32Verified,
          sha256Verified: verification.checks.sha256Verified,
        },
      },
      trustedExtraction: {
        status: "extracted",
        bundleStatus: entryExtraction.extraction.bundleStatus,
        artifactCount: entryExtraction.extraction.artifactCount,
        totalBytes: entryExtraction.extraction.totalBytes,
        artifacts: trustedDocumentArtifacts,
      },
      importedExtraction: {
        status: "extracted",
        sourceArchiveFilename: entryExtraction.sourceArchiveFilename,
        artifactCount: entryExtraction.artifactCount,
        totalBytes: entryExtraction.totalBytes,
        artifacts: importedDocumentArtifacts,
      },
      relationships,
    };

    const filenames = createProvenanceFilenames(entryExtraction);
    const jsonText = `${JSON.stringify(canonicalizeJsonValue(document), null, 2)}\n`;
    const textReport = createProvenanceTextReport(document);
    const jsonChecksumHex = await sha256Text(jsonText, subtle);
    const checksumText = `${jsonChecksumHex}  ${filenames.json}\n`;
    const artifacts: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceArtifact[] = [
      await createProvenanceArtifact(
        "provenance-report-text",
        filenames.text,
        "text/plain;charset=utf-8",
        textReport,
        subtle,
      ),
      {
        kind: "provenance-report-json",
        filename: filenames.json,
        mimeType: "application/json;charset=utf-8",
        bytes: encoder.encode(jsonText).byteLength,
        checksumHex: jsonChecksumHex,
        text: jsonText,
      },
      await createProvenanceArtifact(
        "provenance-report-json-sha256",
        filenames.checksum,
        "text/plain;charset=utf-8",
        checksumText,
        subtle,
      ),
    ];

    return {
      status: "created",
      entryExtraction,
      importResult,
      document,
      artifactCount: artifacts.length,
      totalBytes: artifacts.reduce((sum, artifact) => sum + artifact.bytes, 0),
      artifacts,
      error: null,
    };
  } catch (error) {
    return createProvenanceFailure(
      "provenance-error",
      entryExtraction,
      formatErrorMessage(error),
    );
  }
}

export function downloadRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceArtifact(
  artifact: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceArtifact,
): void {
  const blob = new Blob([artifact.text], { type: artifact.mimeType });
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = artifact.filename;
    anchor.rel = "noopener";
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function downloadRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceArtifacts(
  result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceResult,
): number {
  assertProvenanceCreated(result);
  for (const artifact of result.artifacts) {
    downloadRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceArtifact(
      artifact,
    );
  }
  return result.artifacts.length;
}

export async function copyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceArtifact(
  artifact: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceArtifact,
): Promise<void> {
  const clipboard = globalThis.navigator?.clipboard;
  if (!clipboard) throw new Error("Clipboard API is unavailable.");
  await clipboard.writeText(artifact.text);
}

export function createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceActions(
  entryExtraction: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveExtractionResult,
  options: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceActionsOptions = {},
): HTMLElement {
  const root = document.createElement("section");
  root.className = "mission-debug-diagnostics-manifest-validation-imported-archive-provenance";
  root.dataset.bundleImportedArchiveProvenanceStatus = "preparing";
  Object.assign(root.style, {
    display: "grid",
    gap: "5px",
    minWidth: "0",
    paddingTop: "2px",
  });
  const preparing = document.createElement("small");
  preparing.textContent = "Preparing deterministic verified import provenance reports…";
  preparing.style.opacity = "0.66";
  root.append(preparing);
  void prepareProvenanceActions(root, entryExtraction, options);
  return root;
}

async function prepareProvenanceActions(
  root: HTMLElement,
  entryExtraction: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveExtractionResult,
  options: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceActionsOptions,
): Promise<void> {
  const result =
    await createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenance(
      entryExtraction,
    );
  root.dataset.bundleImportedArchiveProvenanceStatus = result.status;
  options.onCreate?.(result);
  if (result.status !== "created" || !result.document) {
    clearProvenanceDataset(root);
    const error = document.createElement("small");
    error.textContent = `Verified import provenance unavailable: ${result.error ?? "Unknown provenance failure."}`;
    error.style.color = "#ffb4b4";
    error.style.overflowWrap = "anywhere";
    root.replaceChildren(error);
    return;
  }

  const jsonArtifact = result.artifacts.find((artifact) => artifact.kind === "provenance-report-json");
  root.dataset.bundleImportedArchiveProvenanceSchema = result.document.schema;
  root.dataset.bundleImportedArchiveProvenanceSchemaVersion = String(result.document.schemaVersion);
  root.dataset.bundleImportedArchiveProvenanceArtifactCount = String(result.artifactCount);
  root.dataset.bundleImportedArchiveProvenanceTotalBytes = String(result.totalBytes);
  root.dataset.bundleImportedArchiveProvenanceSourceChecksum =
    result.document.sourceArchive.checksum.hex;
  if (jsonArtifact) {
    root.dataset.bundleImportedArchiveProvenanceJsonChecksum = jsonArtifact.checksumHex;
  }

  const heading = document.createElement("small");
  heading.textContent = `Verified import provenance · ${result.artifactCount} artifacts · ${formatByteSize(
    result.totalBytes,
  )}`;
  Object.assign(heading.style, {
    fontWeight: "750",
    lineHeight: "1.35",
    overflowWrap: "anywhere",
  });

  const downloadAll = createActionButton(
    "Download all provenance artifacts",
    `${result.artifactCount} artifacts · canonical fixed order · ${formatByteSize(result.totalBytes)}`,
  );
  downloadAll.dataset.bundleImportedArchiveProvenanceAction = "download-all";
  downloadAll.addEventListener("click", () => {
    try {
      const count =
        downloadRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceArtifacts(
          result,
        );
      options.onDownloadAll?.(result);
      options.onStatus?.(`Downloaded ${count} verified import provenance artifacts.`);
    } catch (error) {
      const message = formatErrorMessage(error);
      console.warn("Verified import provenance download-all failed.", error);
      options.onStatus?.(`Verified import provenance download failed: ${message}`);
    }
  });

  const artifacts = document.createElement("div");
  Object.assign(artifacts.style, { display: "grid", gap: "5px" });
  const maxPreviewCharacters = normalizeMaxPreviewCharacters(options.maxPreviewCharacters);
  for (const artifact of result.artifacts) {
    artifacts.append(createProvenanceArtifactInspection(artifact, result, maxPreviewCharacters, options));
  }
  root.replaceChildren(heading, downloadAll, artifacts);
}

function createProvenanceArtifactInspection(
  artifact: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceArtifact,
  result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceResult,
  maxPreviewCharacters: number,
  options: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceActionsOptions,
): HTMLElement {
  const details = document.createElement("details");
  details.dataset.bundleImportedArchiveProvenanceArtifactKind = artifact.kind;
  details.dataset.bundleImportedArchiveProvenanceArtifactFilename = artifact.filename;
  details.dataset.bundleImportedArchiveProvenanceArtifactBytes = String(artifact.bytes);
  details.dataset.bundleImportedArchiveProvenanceArtifactChecksum = artifact.checksumHex;
  Object.assign(details.style, {
    minWidth: "0",
    padding: "6px 7px",
    border: "1px solid rgba(118, 190, 255, 0.22)",
    borderRadius: "7px",
    background: "rgba(118, 190, 255, 0.035)",
  });

  const summary = document.createElement("summary");
  summary.textContent = `${artifact.filename} · ${formatByteSize(artifact.bytes)} · SHA-256 ${artifact.checksumHex.slice(0, 12)}…`;
  Object.assign(summary.style, {
    cursor: "pointer",
    fontSize: "10px",
    fontWeight: "700",
    lineHeight: "1.35",
    overflowWrap: "anywhere",
  });

  const body = document.createElement("div");
  Object.assign(body.style, { display: "grid", gap: "5px", marginTop: "6px" });
  const preview = document.createElement("pre");
  const previewText = artifact.text.slice(0, maxPreviewCharacters);
  preview.textContent = artifact.text.length > maxPreviewCharacters
    ? `${previewText}\n… preview truncated after ${maxPreviewCharacters} characters`
    : previewText;
  Object.assign(preview.style, {
    margin: "0",
    maxHeight: "220px",
    overflow: "auto",
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
    fontSize: "9px",
    lineHeight: "1.4",
    opacity: "0.82",
  });

  const actions = document.createElement("div");
  Object.assign(actions.style, {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "4px",
  });
  const copy = createActionButton(
    "Copy provenance artifact",
    `${artifact.filename} · exact ${artifact.bytes} bytes`,
  );
  copy.dataset.bundleImportedArchiveProvenanceAction = "copy";
  copy.dataset.bundleImportedArchiveProvenanceArtifactKind = artifact.kind;
  copy.addEventListener("click", () => {
    void (async () => {
      try {
        await copyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceArtifact(
          artifact,
        );
        options.onArtifactCopy?.(artifact, result);
        options.onStatus?.(`Copied provenance artifact ${artifact.filename}.`);
      } catch (error) {
        const message = formatErrorMessage(error);
        console.warn("Verified import provenance copy failed.", error);
        options.onStatus?.(`Verified import provenance copy failed: ${message}`);
      }
    })();
  });

  const download = createActionButton(
    "Download provenance artifact",
    `${artifact.filename} · ${artifact.mimeType}`,
  );
  download.dataset.bundleImportedArchiveProvenanceAction = "download";
  download.dataset.bundleImportedArchiveProvenanceArtifactKind = artifact.kind;
  download.addEventListener("click", () => {
    try {
      downloadRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceArtifact(
        artifact,
      );
      options.onArtifactDownload?.(artifact, result);
      options.onStatus?.(`Downloaded provenance artifact ${artifact.filename}.`);
    } catch (error) {
      const message = formatErrorMessage(error);
      console.warn("Verified import provenance download failed.", error);
      options.onStatus?.(`Verified import provenance download failed: ${message}`);
    }
  });
  actions.append(copy, download);
  body.append(preview, actions);
  details.append(summary, body);
  return details;
}

async function createProvenanceArtifact(
  kind: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceArtifactKind,
  filename: string,
  mimeType: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceArtifact["mimeType"],
  text: string,
  subtle: SubtleCrypto,
): Promise<RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceArtifact> {
  const encoder = new TextEncoder();
  return {
    kind,
    filename,
    mimeType,
    bytes: encoder.encode(text).byteLength,
    checksumHex: await sha256Text(text, subtle),
    text,
  };
}

function createProvenanceFilenames(
  entryExtraction: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveExtractionResult,
): { text: string; json: string; checksum: string } {
  const target = entryExtraction.extraction.verification.document?.target;
  let prefix = "mission-diagnostics-policy-manifest";
  if (target?.scope === "manifest") {
    prefix = "large-world-manifest.diagnostics-policy";
  } else if (target?.scope === "mission-package" && target.packageIndex !== null) {
    prefix = `mission-package-${target.packageIndex}.diagnostics-policy`;
  } else if (target?.scope === "invalid") {
    prefix = "mission-diagnostics-policy-manifest.invalid-target";
  }
  const base = `${prefix}.verified-import-provenance`;
  return {
    text: `${base}.txt`,
    json: `${base}.json`,
    checksum: `${base}.json.sha256`,
  };
}

function createProvenanceTextReport(
  document: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceDocument,
): string {
  const lines = [
    "Splat World Engine Mission Diagnostics Verified Imported Archive Provenance",
    "",
    `Schema: ${document.schema}`,
    `Schema version: ${document.schemaVersion}`,
    `Target: ${JSON.stringify(canonicalizeJsonValue(document.target))}`,
    "",
    "Source archive",
    `  Filename: ${document.sourceArchive.filename}`,
    `  Reported MIME type: ${document.sourceArchive.reportedMimeType}`,
    `  Reported bytes: ${document.sourceArchive.reportedBytes}`,
    `  Exact bytes: ${document.sourceArchive.exactBytes}`,
    `  SHA-256: ${document.sourceArchive.checksum.hex}`,
    "",
    "ZIP verification",
    `  Valid: ${document.verification.valid}`,
    `  Issues: ${document.verification.issueCount}`,
    `  Entries: ${document.verification.entryCount}`,
    `  Total uncompressed bytes: ${document.verification.totalUncompressedBytes}`,
    `  EOCD: ${document.verification.checks.eocd}`,
    `  Central directory: ${document.verification.checks.centralDirectory}`,
    `  Entry order: ${document.verification.checks.entryOrder}`,
    `  Local headers verified: ${document.verification.checks.localHeadersVerified}`,
    `  Deterministic metadata verified: ${document.verification.checks.deterministicMetadataVerified}`,
    `  CRC-32 verified: ${document.verification.checks.crc32Verified}`,
    `  SHA-256 verified: ${document.verification.checks.sha256Verified}`,
    "",
    "Artifact relationships",
  ];
  for (const relationship of document.relationships) {
    const imported = document.importedExtraction.artifacts[relationship.index];
    lines.push(
      `  ${relationship.index + 1}. ${relationship.kind}`,
      `     Filename: ${imported?.filename ?? "unavailable"}`,
      `     ZIP data range: ${imported?.dataOffset ?? -1}-${imported?.dataEnd ?? -1}`,
      `     Bytes: ${imported?.bytes ?? 0}`,
      `     CRC-32: ${imported?.crc32.hex ?? "unavailable"}`,
      `     SHA-256: ${imported?.checksum.hex ?? "unavailable"}`,
      "     Filename match: true",
      "     MIME type match: true",
      "     Byte size match: true",
      "     Data range match: true",
      "     CRC-32 match: true",
      "     SHA-256 match: true",
      "     Exact text match: true",
    );
  }
  lines.push(
    "",
    `Trusted extraction artifacts: ${document.trustedExtraction.artifactCount}`,
    `Imported extraction artifacts: ${document.importedExtraction.artifactCount}`,
    "Result: verified provenance relationships complete",
  );
  return `${lines.join("\n")}\n`;
}

function createProvenanceFailure(
  status: Exclude<
    RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceStatus,
    "created"
  >,
  entryExtraction: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveExtractionResult,
  error: string,
): RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceResult {
  return {
    status,
    entryExtraction,
    importResult: entryExtraction.importResult,
    document: null,
    artifactCount: 0,
    totalBytes: 0,
    artifacts: [],
    error,
  };
}

function assertProvenanceCreated(
  result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceResult,
): asserts result is RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceResult & {
  status: "created";
} {
  if (result.status !== "created") {
    throw new Error(result.error ?? "Verified import provenance artifacts are unavailable.");
  }
}

function clearProvenanceDataset(root: HTMLElement): void {
  delete root.dataset.bundleImportedArchiveProvenanceSchema;
  delete root.dataset.bundleImportedArchiveProvenanceSchemaVersion;
  delete root.dataset.bundleImportedArchiveProvenanceArtifactCount;
  delete root.dataset.bundleImportedArchiveProvenanceTotalBytes;
  delete root.dataset.bundleImportedArchiveProvenanceSourceChecksum;
  delete root.dataset.bundleImportedArchiveProvenanceJsonChecksum;
}

function createActionButton(labelText: string, previewText: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  Object.assign(button.style, {
    display: "grid",
    width: "100%",
    gap: "2px",
    maxWidth: "100%",
    textAlign: "left",
  });
  const label = document.createElement("span");
  label.textContent = labelText;
  const preview = document.createElement("small");
  preview.textContent = previewText;
  Object.assign(preview.style, {
    display: "block",
    maxWidth: "100%",
    fontSize: "9px",
    fontWeight: "500",
    lineHeight: "1.25",
    opacity: "0.66",
    overflowWrap: "anywhere",
  });
  button.title = previewText;
  button.setAttribute("aria-label", `${labelText}. ${previewText}`);
  button.append(label, preview);
  return button;
}

function normalizeMaxPreviewCharacters(value: number | undefined): number {
  if (value === undefined) return DEFAULT_PREVIEW_CHARACTERS;
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Provenance maxPreviewCharacters must be a positive finite number.");
  }
  return Math.floor(value);
}

async function sha256Text(text: string, subtle: SubtleCrypto): Promise<string> {
  return bytesToHex(await subtle.digest(SHA256_ALGORITHM, new TextEncoder().encode(text)));
}

function canonicalizeJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => canonicalizeJsonValue(item));
  if (value !== null && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort()) {
      const child = source[key];
      if (child !== undefined) output[key] = canonicalizeJsonValue(child);
    }
    return output;
  }
  return value;
}

function calculateCrc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = CRC32_TABLE[(crc ^ byte) & 0xff]! ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createCrc32Table(): Uint32Array {
  const table = new Uint32Array(256);
  for (let index = 0; index < table.length; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) !== 0 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
}

function equalBytes(left: Uint8Array, right: Uint8Array): boolean {
  if (left.byteLength !== right.byteLength) return false;
  for (let index = 0; index < left.byteLength; index += 1) {
    if (left[index] !== right[index]) return false;
  }
  return true;
}

function bytesToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function formatErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function formatByteSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kilobytes = bytes / 1024;
  if (kilobytes < 1024) return `${formatByteValue(kilobytes)} KB`;
  const megabytes = kilobytes / 1024;
  return `${formatByteValue(megabytes)} MB`;
}

function formatByteValue(value: number): string {
  return value >= 10 ? value.toFixed(0) : value.toFixed(1);
}
