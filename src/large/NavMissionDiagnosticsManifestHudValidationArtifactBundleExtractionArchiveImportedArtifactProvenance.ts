import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleEntryKind,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundle.js";
import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportResult,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImport.js";
import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveExtractionResult,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactExtraction.js";
import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationResult,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerification.js";
import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportArtifact,
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportResult,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReport.js";

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

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceDocumentArtifact {
  index: number;
  kind: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleEntryKind;
  filename: string;
  mimeType: string;
  bytes: number;
  checksum: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceChecksum;
  dataOffset?: number;
  dataEnd?: number;
  crc32?: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceCrc32;
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceRelationship {
  index: number;
  kind: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleEntryKind;
  filenameMatches: boolean;
  mimeTypeMatches: boolean;
  byteSizeMatches: boolean;
  dataRangeMatches: boolean;
  crc32Matches: boolean;
  checksumMatches: boolean;
  exactTextMatches: boolean;
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
    valid: boolean;
    issueCount: number;
    archiveBytes: number;
    entryCount: number;
    totalUncompressedBytes: number;
    checks: {
      archiveChecksum: boolean;
      eocd: boolean;
      centralDirectory: boolean;
      entryOrder: boolean;
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
    artifacts: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceDocumentArtifact[];
  };
  importedExtraction: {
    status: "extracted";
    sourceArchiveFilename: string;
    artifactCount: number;
    totalBytes: number;
    artifacts: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceDocumentArtifact[];
  };
  relationships: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceRelationship[];
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
  onVerify?: (
    verification: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationResult,
    result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceResult,
  ) => void;
  onVerificationReportCreate?: (
    report: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportResult,
  ) => void;
  onVerificationReportArtifactDownload?: (
    artifact: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportArtifact,
    report: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportResult,
  ) => void;
  onVerificationReportDownloadAll?: (
    report: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportResult,
  ) => void;
  onVerificationReportArtifactCopy?: (
    artifact: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportArtifact,
    report: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportResult,
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
    return fail("import-unavailable", entryExtraction, "External ZIP import is not verified.");
  }
  const verification = importResult.verification;
  if (!verification || !verification.valid || verification.issues.length > 0) {
    return fail("verification-unavailable", entryExtraction, "External ZIP verification is unavailable or failed.");
  }
  if (entryExtraction.status !== "extracted") {
    return fail(
      "entry-extraction-unavailable",
      entryExtraction,
      entryExtraction.error ?? "Verified imported entries are unavailable.",
    );
  }
  if (!importResult.data || !verification.archiveChecksumHex) {
    return fail("verification-unavailable", entryExtraction, "Verified source ZIP bytes or SHA-256 are unavailable.");
  }
  if (entryExtraction.extraction.status !== "extracted") {
    return fail(
      "relationship-invalid",
      entryExtraction,
      entryExtraction.extraction.error ?? "Trusted extraction is unavailable.",
    );
  }

  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    return fail("crypto-unavailable", entryExtraction, "Web Crypto is unavailable.");
  }

  try {
    const trusted = entryExtraction.extraction.artifacts;
    const imported = entryExtraction.artifacts;
    if (verification.entries.length !== 3 || trusted.length !== 3 || imported.length !== 3) {
      return fail("relationship-invalid", entryExtraction, "Provenance requires exactly three aligned artifacts.");
    }

    const sourceChecksum = await digestBytes(importResult.data, subtle);
    if (sourceChecksum !== verification.archiveChecksumHex) {
      return fail("relationship-invalid", entryExtraction, "Source ZIP SHA-256 changed after verification.");
    }

    const trustedArtifacts: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceDocumentArtifact[] = [];
    const importedArtifacts: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceDocumentArtifact[] = [];
    const relationships: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceRelationship[] = [];
    const encoder = new TextEncoder();

    for (let index = 0; index < 3; index += 1) {
      const trustedArtifact = trusted[index];
      const importedArtifact = imported[index];
      const verifiedEntry = verification.entries[index];
      if (!trustedArtifact || !importedArtifact || !verifiedEntry || !verifiedEntry.kind) {
        return fail("relationship-invalid", entryExtraction, `Artifact relationship ${index} is incomplete.`);
      }

      const metadataMatches =
        trustedArtifact.kind === importedArtifact.kind &&
        trustedArtifact.kind === verifiedEntry.kind &&
        trustedArtifact.filename === importedArtifact.filename &&
        trustedArtifact.filename === verifiedEntry.filename &&
        trustedArtifact.mimeType === importedArtifact.mimeType &&
        trustedArtifact.bytes === importedArtifact.bytes &&
        trustedArtifact.bytes === verifiedEntry.bytes;
      const dataRangeMatches =
        importedArtifact.dataEnd - importedArtifact.dataOffset === importedArtifact.bytes &&
        importedArtifact.data.byteLength === importedArtifact.bytes;
      if (!metadataMatches || !dataRangeMatches) {
        return fail("relationship-invalid", entryExtraction, `Artifact relationship ${index} metadata changed.`);
      }

      const crc32Hex = calculateCrc32(importedArtifact.data).toString(16).padStart(8, "0");
      const crc32Matches =
        crc32Hex === importedArtifact.crc32Hex &&
        crc32Hex === verifiedEntry.crc32Hex;
      const checksumHex = await digestBytes(importedArtifact.data, subtle);
      const checksumMatches =
        checksumHex === importedArtifact.checksumHex &&
        checksumHex === trustedArtifact.checksumHex &&
        checksumHex === verifiedEntry.checksumHex;
      const exactTextMatches =
        importedArtifact.text === trustedArtifact.text &&
        equalBytes(importedArtifact.data, encoder.encode(trustedArtifact.text));
      if (!crc32Matches || !checksumMatches || !exactTextMatches) {
        return fail("relationship-invalid", entryExtraction, `Artifact relationship ${index} integrity changed.`);
      }

      trustedArtifacts.push({
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
      importedArtifacts.push({
        index,
        kind: importedArtifact.kind,
        filename: importedArtifact.filename,
        mimeType: importedArtifact.mimeType,
        bytes: importedArtifact.bytes,
        dataOffset: importedArtifact.dataOffset,
        dataEnd: importedArtifact.dataEnd,
        crc32: { algorithm: "CRC-32", input: "entry-bytes", hex: crc32Hex },
        checksum: { algorithm: SHA256_ALGORITHM, input: "entry-bytes", hex: checksumHex },
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
        checksum: { algorithm: SHA256_ALGORITHM, input: "archive-bytes", hex: sourceChecksum },
      },
      verification: {
        valid: verification.valid,
        issueCount: verification.issues.length,
        archiveBytes: verification.archiveBytes,
        entryCount: verification.entryCount,
        totalUncompressedBytes: verification.totalUncompressedBytes,
        checks: { ...verification.checks },
      },
      trustedExtraction: {
        status: "extracted",
        bundleStatus: entryExtraction.extraction.bundleStatus,
        artifactCount: entryExtraction.extraction.artifactCount,
        totalBytes: entryExtraction.extraction.totalBytes,
        artifacts: trustedArtifacts,
      },
      importedExtraction: {
        status: "extracted",
        sourceArchiveFilename: entryExtraction.sourceArchiveFilename,
        artifactCount: entryExtraction.artifactCount,
        totalBytes: entryExtraction.totalBytes,
        artifacts: importedArtifacts,
      },
      relationships,
    };

    const filenames = createFilenames(entryExtraction);
    const jsonText = `${JSON.stringify(canonicalize(document), null, 2)}\n`;
    const textReport = createTextReport(document);
    const jsonChecksum = await digestText(jsonText, subtle);
    const checksumText = `${jsonChecksum}  ${filenames.json}\n`;
    const artifacts = [
      await createArtifact(
        "provenance-report-text",
        filenames.text,
        "text/plain;charset=utf-8",
        textReport,
        subtle,
      ),
      {
        kind: "provenance-report-json" as const,
        filename: filenames.json,
        mimeType: "application/json;charset=utf-8" as const,
        bytes: encoder.encode(jsonText).byteLength,
        checksumHex: jsonChecksum,
        text: jsonText,
      },
      await createArtifact(
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
    return fail("provenance-error", entryExtraction, formatError(error));
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
  assertCreated(result);
  for (const artifact of result.artifacts) {
    downloadRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceArtifact(artifact);
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
  void prepareActions(root, entryExtraction, options);
  return root;
}

async function prepareActions(
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
    clearDataset(root);
    const error = document.createElement("small");
    error.textContent = `Verified import provenance unavailable: ${result.error ?? "Unknown failure."}`;
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
  heading.textContent =
    `Verified import provenance · ${result.artifactCount} artifacts · ${formatBytes(result.totalBytes)}`;
  heading.style.fontWeight = "750";

  const verificationReports = document.createElement("div");
  verificationReports.dataset.bundleImportedArchiveProvenanceVerificationReportContainer = "true";
  verificationReports.dataset.bundleImportedArchiveProvenanceVerificationReportStatus = "unavailable";

  let reportSequence = 0;
  const verificationModule =
    await import("./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerification.js");
  const verification =
    verificationModule.createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationControl(
      result,
      entryExtraction,
      {
        onVerify: (verificationResult, verifiedResult) => {
          options.onVerify?.(verificationResult, verifiedResult);
          const sequence = ++reportSequence;
          verificationReports.dataset.bundleImportedArchiveProvenanceVerificationReportStatus = "loading";
          const preparingReport = document.createElement("small");
          preparingReport.textContent = "Preparing provenance verification evidence…";
          preparingReport.style.opacity = "0.66";
          verificationReports.replaceChildren(preparingReport);
          void import("./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReport.js")
            .then((reportModule) => {
              if (sequence !== reportSequence) return;
              const reportActions =
                reportModule.createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportActions(
                  verificationResult,
                  verifiedResult,
                  {
                    onCreate: (report) => {
                      verificationReports.dataset.bundleImportedArchiveProvenanceVerificationReportStatus =
                        report.status;
                      options.onVerificationReportCreate?.(report);
                    },
                    onArtifactDownload: options.onVerificationReportArtifactDownload,
                    onDownloadAll: options.onVerificationReportDownloadAll,
                    onArtifactCopy: options.onVerificationReportArtifactCopy,
                    onStatus: options.onStatus,
                  },
                );
              verificationReports.replaceChildren(reportActions);
            })
            .catch((error: unknown) => {
              if (sequence !== reportSequence) return;
              verificationReports.dataset.bundleImportedArchiveProvenanceVerificationReportStatus = "error";
              const message = document.createElement("small");
              message.textContent = `Verification report module unavailable: ${formatError(error)}`;
              message.style.color = "#ffb4b4";
              message.style.overflowWrap = "anywhere";
              verificationReports.replaceChildren(message);
              options.onStatus?.(`Verification report module unavailable: ${formatError(error)}`);
            });
        },
        onStatus: options.onStatus,
      },
    );

  const downloadAll = button(
    "Download all provenance artifacts",
    `${result.artifactCount} artifacts · canonical fixed order · ${formatBytes(result.totalBytes)}`,
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
      options.onStatus?.(`Verified import provenance download failed: ${formatError(error)}`);
    }
  });

  const list = document.createElement("div");
  Object.assign(list.style, { display: "grid", gap: "5px" });
  const maxPreview = normalizePreview(options.maxPreviewCharacters);
  for (const artifact of result.artifacts) {
    list.append(inspection(artifact, result, maxPreview, options));
  }
  root.replaceChildren(heading, verification, verificationReports, downloadAll, list);
}

function inspection(
  artifact: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceArtifact,
  result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceResult,
  maxPreview: number,
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
  summary.textContent =
    `${artifact.filename} · ${formatBytes(artifact.bytes)} · SHA-256 ${artifact.checksumHex.slice(0, 12)}…`;
  Object.assign(summary.style, {
    cursor: "pointer",
    fontSize: "10px",
    fontWeight: "700",
    overflowWrap: "anywhere",
  });

  const preview = document.createElement("pre");
  const visible = artifact.text.slice(0, maxPreview);
  preview.textContent = artifact.text.length > maxPreview
    ? `${visible}\n… preview truncated after ${maxPreview} characters`
    : visible;
  Object.assign(preview.style, {
    margin: "6px 0 0",
    maxHeight: "220px",
    overflow: "auto",
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
    fontSize: "9px",
    lineHeight: "1.4",
  });

  const actions = document.createElement("div");
  Object.assign(actions.style, {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "4px",
    marginTop: "5px",
  });

  const copy = button(
    "Copy provenance artifact",
    `${artifact.filename} · exact ${artifact.bytes} bytes`,
  );
  copy.dataset.bundleImportedArchiveProvenanceAction = "copy";
  copy.addEventListener("click", () => {
    void copyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceArtifact(
      artifact,
    )
      .then(() => {
        options.onArtifactCopy?.(artifact, result);
        options.onStatus?.(`Copied provenance artifact ${artifact.filename}.`);
      })
      .catch((error: unknown) => options.onStatus?.(`Provenance copy failed: ${formatError(error)}`));
  });

  const download = button(
    "Download provenance artifact",
    `${artifact.filename} · ${artifact.mimeType}`,
  );
  download.dataset.bundleImportedArchiveProvenanceAction = "download";
  download.addEventListener("click", () => {
    try {
      downloadRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceArtifact(
        artifact,
      );
      options.onArtifactDownload?.(artifact, result);
      options.onStatus?.(`Downloaded provenance artifact ${artifact.filename}.`);
    } catch (error) {
      options.onStatus?.(`Provenance download failed: ${formatError(error)}`);
    }
  });

  actions.append(copy, download);
  details.append(summary, preview, actions);
  return details;
}

async function createArtifact(
  kind: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceArtifactKind,
  filename: string,
  mimeType: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceArtifact["mimeType"],
  text: string,
  subtle: SubtleCrypto,
): Promise<RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceArtifact> {
  return {
    kind,
    filename,
    mimeType,
    bytes: new TextEncoder().encode(text).byteLength,
    checksumHex: await digestText(text, subtle),
    text,
  };
}

function createFilenames(
  result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveExtractionResult,
): { text: string; json: string; checksum: string } {
  const target = result.extraction.verification.document?.target;
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

function createTextReport(
  document: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceDocument,
): string {
  const lines = [
    "Splat World Engine Mission Diagnostics Verified Imported Archive Provenance",
    "",
    `Schema: ${document.schema}`,
    `Schema version: ${document.schemaVersion}`,
    `Target: ${JSON.stringify(canonicalize(document.target))}`,
    "",
    `Source archive: ${document.sourceArchive.filename}`,
    `Source exact bytes: ${document.sourceArchive.exactBytes}`,
    `Source SHA-256: ${document.sourceArchive.checksum.hex}`,
    "",
    `ZIP verification valid: ${document.verification.valid}`,
    `ZIP verification issues: ${document.verification.issueCount}`,
    `ZIP entries: ${document.verification.entryCount}`,
    `Local headers verified: ${document.verification.checks.localHeadersVerified}`,
    `CRC-32 verified: ${document.verification.checks.crc32Verified}`,
    `SHA-256 verified: ${document.verification.checks.sha256Verified}`,
    "",
    "Artifact relationships",
  ];

  for (const relationship of document.relationships) {
    const artifact = document.importedExtraction.artifacts[relationship.index];
    lines.push(
      `  ${relationship.index + 1}. ${relationship.kind}`,
      `     Filename: ${artifact?.filename ?? "unavailable"}`,
      `     Data range: ${artifact?.dataOffset ?? -1}-${artifact?.dataEnd ?? -1}`,
      `     Bytes: ${artifact?.bytes ?? 0}`,
      `     CRC-32: ${artifact?.crc32?.hex ?? "unavailable"}`,
      `     SHA-256: ${artifact?.checksum.hex ?? "unavailable"}`,
      "     All trusted relationships: true",
    );
  }

  lines.push("", "Result: verified provenance relationships complete");
  return `${lines.join("\n")}\n`;
}

function fail(
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

function assertCreated(
  result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceResult,
): void {
  if (result.status !== "created") {
    throw new Error(result.error ?? "Provenance artifacts are unavailable.");
  }
}

function clearDataset(root: HTMLElement): void {
  delete root.dataset.bundleImportedArchiveProvenanceSchema;
  delete root.dataset.bundleImportedArchiveProvenanceSchemaVersion;
  delete root.dataset.bundleImportedArchiveProvenanceArtifactCount;
  delete root.dataset.bundleImportedArchiveProvenanceTotalBytes;
  delete root.dataset.bundleImportedArchiveProvenanceSourceChecksum;
  delete root.dataset.bundleImportedArchiveProvenanceJsonChecksum;
}

function button(labelText: string, previewText: string): HTMLButtonElement {
  const element = document.createElement("button");
  element.type = "button";
  Object.assign(element.style, {
    display: "grid",
    width: "100%",
    gap: "2px",
    textAlign: "left",
  });
  const label = document.createElement("span");
  label.textContent = labelText;
  const preview = document.createElement("small");
  preview.textContent = previewText;
  preview.style.fontSize = "9px";
  preview.style.opacity = "0.66";
  preview.style.overflowWrap = "anywhere";
  element.title = previewText;
  element.setAttribute("aria-label", `${labelText}. ${previewText}`);
  element.append(label, preview);
  return element;
}

function normalizePreview(value: number | undefined): number {
  if (value === undefined) return DEFAULT_PREVIEW_CHARACTERS;
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error("maxPreviewCharacters must be a positive safe integer.");
  }
  return value;
}

async function digestBytes(bytes: Uint8Array, subtle: SubtleCrypto): Promise<string> {
  return bytesToHex(await subtle.digest(SHA256_ALGORITHM, copyToArrayBuffer(bytes)));
}

async function digestText(text: string, subtle: SubtleCrypto): Promise<string> {
  return digestBytes(new TextEncoder().encode(text), subtle);
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort()) {
      if (source[key] !== undefined) output[key] = canonicalize(source[key]);
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

function copyToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

function bytesToHex(buffer: ArrayBuffer): string {
  return Array.from(
    new Uint8Array(buffer),
    (byte) => byte.toString(16).padStart(2, "0"),
  ).join("");
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kilobytes = bytes / 1024;
  if (kilobytes < 1024) {
    return `${kilobytes >= 10 ? kilobytes.toFixed(0) : kilobytes.toFixed(1)} KB`;
  }
  const megabytes = kilobytes / 1024;
  return `${megabytes >= 10 ? megabytes.toFixed(0) : megabytes.toFixed(1)} MB`;
}
