import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleEntryKind,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundle.js";
import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionResult,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtraction.js";
import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportResult,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImport.js";
import {
  RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_ORDER,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleVerification.js";

const ZIP_LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const ZIP_UTF8_FLAG = 0x0800;
const ZIP_STORE_METHOD = 0;
const DEFAULT_PREVIEW_CHARACTERS = 4096;
const CRC32_TABLE = createCrc32Table();

export type RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveExtractionStatus =
  | "extracted"
  | "import-unavailable"
  | "verification-unavailable"
  | "verification-failed"
  | "archive-data-unavailable"
  | "artifact-set-invalid"
  | "crypto-unavailable"
  | "extraction-error";

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveArtifact {
  kind: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleEntryKind;
  filename: string;
  mimeType: string;
  bytes: number;
  crc32Hex: string;
  checksumHex: string;
  dataOffset: number;
  dataEnd: number;
  data: Uint8Array;
  text: string;
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveExtractionResult {
  status: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveExtractionStatus;
  importResult: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportResult;
  extraction: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionResult;
  sourceArchiveFilename: string;
  artifactCount: number;
  totalBytes: number;
  artifacts: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveArtifact[];
  error: string | null;
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveActionsOptions {
  maxPreviewCharacters?: number;
  onArtifactDownload?: (
    artifact: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveArtifact,
    result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveExtractionResult,
  ) => void;
  onDownloadAll?: (
    result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveExtractionResult,
  ) => void;
  onArtifactCopy?: (
    artifact: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveArtifact,
    result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveExtractionResult,
  ) => void;
  onStatus?: (message: string) => void;
}

export async function extractRuntimeNavMissionDiagnosticsManifestHudValidationArtifactsFromVerifiedArchiveImport(
  importResult: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportResult,
  extraction: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionResult,
): Promise<RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveExtractionResult> {
  if (importResult.status !== "verified") {
    return createExtractionFailure(
      "import-unavailable",
      importResult,
      extraction,
      "External artifact ZIP import must be verified before entries can be extracted.",
    );
  }
  if (!importResult.verification) {
    return createExtractionFailure(
      "verification-unavailable",
      importResult,
      extraction,
      "External artifact ZIP verification result is unavailable.",
    );
  }
  if (!importResult.verification.valid || importResult.verification.issues.length > 0) {
    return createExtractionFailure(
      "verification-failed",
      importResult,
      extraction,
      "External artifact ZIP must pass verification before entries can be extracted.",
    );
  }
  if (!importResult.data) {
    return createExtractionFailure(
      "archive-data-unavailable",
      importResult,
      extraction,
      "Verified external artifact ZIP bytes are unavailable.",
    );
  }
  if (extraction.status !== "extracted") {
    return createExtractionFailure(
      "artifact-set-invalid",
      importResult,
      extraction,
      extraction.error ?? "Trusted artifact extraction is unavailable.",
    );
  }

  const verification = importResult.verification;
  if (
    verification.entries.length !== RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_ORDER.length ||
    extraction.artifacts.length !== RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_ORDER.length
  ) {
    return createExtractionFailure(
      "artifact-set-invalid",
      importResult,
      extraction,
      "Verified external artifact ZIP must expose exactly three ordered entries.",
    );
  }

  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    return createExtractionFailure(
      "crypto-unavailable",
      importResult,
      extraction,
      "Web Crypto is unavailable; imported artifact SHA-256 values cannot be revalidated.",
    );
  }

  try {
    const data = importResult.data;
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    const decoder = new TextDecoder("utf-8", { fatal: true });
    const encoder = new TextEncoder();
    const artifacts: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveArtifact[] = [];
    let totalBytes = 0;

    for (let index = 0; index < verification.entries.length; index += 1) {
      const verifiedEntry = verification.entries[index];
      const expectedKind =
        RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_ORDER[index];
      const expectedArtifact = extraction.artifacts[index];
      if (
        !verifiedEntry ||
        !expectedKind ||
        !expectedArtifact ||
        verifiedEntry.kind !== expectedKind ||
        expectedArtifact.kind !== expectedKind ||
        verifiedEntry.filename !== expectedArtifact.filename
      ) {
        return createExtractionFailure(
          "artifact-set-invalid",
          importResult,
          extraction,
          `Verified imported ZIP entry ${index} does not match the trusted artifact order.`,
        );
      }

      const localOffset = verifiedEntry.localHeaderOffset;
      if (!isRangeWithin(localOffset, 30, data.byteLength)) {
        return createExtractionFailure(
          "artifact-set-invalid",
          importResult,
          extraction,
          `Verified imported ZIP entry ${index} local header is outside the archive bounds.`,
        );
      }
      if (view.getUint32(localOffset, true) !== ZIP_LOCAL_FILE_HEADER_SIGNATURE) {
        return createExtractionFailure(
          "artifact-set-invalid",
          importResult,
          extraction,
          `Verified imported ZIP entry ${index} local header signature changed after verification.`,
        );
      }

      const flags = view.getUint16(localOffset + 6, true);
      const method = view.getUint16(localOffset + 8, true);
      const localCrc32 = view.getUint32(localOffset + 14, true);
      const compressedBytes = view.getUint32(localOffset + 18, true);
      const uncompressedBytes = view.getUint32(localOffset + 22, true);
      const filenameBytesLength = view.getUint16(localOffset + 26, true);
      const extraBytesLength = view.getUint16(localOffset + 28, true);
      const filenameStart = localOffset + 30;
      const filenameEnd = filenameStart + filenameBytesLength;
      const dataOffset = filenameEnd + extraBytesLength;
      const dataEnd = dataOffset + compressedBytes;
      if (
        flags !== ZIP_UTF8_FLAG ||
        method !== ZIP_STORE_METHOD ||
        extraBytesLength !== 0 ||
        compressedBytes !== uncompressedBytes ||
        !isRangeWithin(filenameStart, filenameBytesLength, data.byteLength) ||
        !isRangeWithin(dataOffset, compressedBytes, data.byteLength)
      ) {
        return createExtractionFailure(
          "artifact-set-invalid",
          importResult,
          extraction,
          `Verified imported ZIP entry ${index} local metadata or byte range changed after verification.`,
        );
      }

      const localFilename = decoder.decode(data.subarray(filenameStart, filenameEnd));
      if (
        localFilename !== verifiedEntry.filename ||
        localFilename !== expectedArtifact.filename ||
        verifiedEntry.bytes !== uncompressedBytes ||
        verifiedEntry.compressedBytes !== compressedBytes ||
        expectedArtifact.bytes !== uncompressedBytes
      ) {
        return createExtractionFailure(
          "artifact-set-invalid",
          importResult,
          extraction,
          `Verified imported ZIP entry ${index} filename or byte size changed after verification.`,
        );
      }

      const entryDataView = data.subarray(dataOffset, dataEnd);
      const actualCrc32 = calculateCrc32(entryDataView);
      const actualCrc32Hex = actualCrc32.toString(16).padStart(8, "0");
      if (
        actualCrc32 !== localCrc32 ||
        actualCrc32Hex !== verifiedEntry.crc32Hex
      ) {
        return createExtractionFailure(
          "artifact-set-invalid",
          importResult,
          extraction,
          `Verified imported ZIP entry ${index} CRC-32 changed after verification.`,
        );
      }

      const checksumHex = bytesToHex(await subtle.digest("SHA-256", entryDataView));
      if (
        checksumHex !== verifiedEntry.checksumHex ||
        checksumHex !== expectedArtifact.checksumHex
      ) {
        return createExtractionFailure(
          "artifact-set-invalid",
          importResult,
          extraction,
          `Verified imported ZIP entry ${index} SHA-256 changed after verification.`,
        );
      }

      const expectedBytes = encoder.encode(expectedArtifact.text);
      if (!equalBytes(entryDataView, expectedBytes)) {
        return createExtractionFailure(
          "artifact-set-invalid",
          importResult,
          extraction,
          `Verified imported ZIP entry ${index} no longer matches the trusted artifact bytes.`,
        );
      }
      const text = decoder.decode(entryDataView);
      if (text !== expectedArtifact.text) {
        return createExtractionFailure(
          "artifact-set-invalid",
          importResult,
          extraction,
          `Verified imported ZIP entry ${index} text changed after verification.`,
        );
      }

      const copiedData = new Uint8Array(entryDataView.byteLength);
      copiedData.set(entryDataView);
      artifacts.push({
        kind: expectedKind,
        filename: expectedArtifact.filename,
        mimeType: expectedArtifact.mimeType,
        bytes: copiedData.byteLength,
        crc32Hex: actualCrc32Hex,
        checksumHex,
        dataOffset,
        dataEnd,
        data: copiedData,
        text,
      });
      totalBytes += copiedData.byteLength;
    }

    if (totalBytes !== extraction.totalBytes) {
      return createExtractionFailure(
        "artifact-set-invalid",
        importResult,
        extraction,
        "Verified imported ZIP total entry bytes do not match the trusted extraction total.",
      );
    }

    return {
      status: "extracted",
      importResult,
      extraction,
      sourceArchiveFilename: importResult.file.filename,
      artifactCount: artifacts.length,
      totalBytes,
      artifacts,
      error: null,
    };
  } catch (error) {
    return createExtractionFailure(
      "extraction-error",
      importResult,
      extraction,
      formatErrorMessage(error),
    );
  }
}

export function downloadRuntimeNavMissionDiagnosticsManifestHudValidationImportedArchiveArtifact(
  artifact: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveArtifact,
): void {
  const blob = new Blob([copyToArrayBuffer(artifact.data)], { type: artifact.mimeType });
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

export function downloadRuntimeNavMissionDiagnosticsManifestHudValidationImportedArchiveArtifacts(
  result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveExtractionResult,
): number {
  assertImportedArtifactsExtracted(result);
  for (const artifact of result.artifacts) {
    downloadRuntimeNavMissionDiagnosticsManifestHudValidationImportedArchiveArtifact(artifact);
  }
  return result.artifacts.length;
}

export async function copyRuntimeNavMissionDiagnosticsManifestHudValidationImportedArchiveArtifactText(
  artifact: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveArtifact,
): Promise<void> {
  const clipboard = globalThis.navigator?.clipboard;
  if (!clipboard) {
    throw new Error("Clipboard API is unavailable.");
  }
  await clipboard.writeText(artifact.text);
}

export function createRuntimeNavMissionDiagnosticsManifestHudValidationImportedArchiveArtifactActions(
  result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveExtractionResult,
  options: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveActionsOptions = {},
): HTMLElement {
  assertImportedArtifactsExtracted(result);
  const maxPreviewCharacters = normalizeMaxPreviewCharacters(options.maxPreviewCharacters);
  const root = document.createElement("section");
  root.className = "mission-debug-diagnostics-manifest-validation-imported-archive-artifacts";
  root.dataset.bundleImportedArchiveExtractionStatus = result.status;
  root.dataset.bundleImportedArchiveExtractionSourceFilename = result.sourceArchiveFilename;
  root.dataset.bundleImportedArchiveExtractionArtifactCount = String(result.artifactCount);
  root.dataset.bundleImportedArchiveExtractionTotalBytes = String(result.totalBytes);
  Object.assign(root.style, {
    display: "grid",
    gap: "5px",
    minWidth: "0",
    paddingTop: "2px",
  });

  const heading = document.createElement("small");
  heading.textContent = `Verified imported ZIP entries · ${result.artifactCount} artifacts · ${formatByteSize(
    result.totalBytes,
  )}`;
  Object.assign(heading.style, {
    fontWeight: "750",
    lineHeight: "1.35",
    overflowWrap: "anywhere",
  });

  const downloadAll = createActionButton(
    "Download all verified imported artifacts",
    `${result.artifactCount} artifacts · fixed order · ${formatByteSize(result.totalBytes)}`,
  );
  downloadAll.dataset.bundleImportedArchiveAction = "download-all";
  downloadAll.addEventListener("click", () => {
    try {
      const count =
        downloadRuntimeNavMissionDiagnosticsManifestHudValidationImportedArchiveArtifacts(result);
      options.onDownloadAll?.(result);
      options.onStatus?.(`Downloaded ${count} verified imported archive artifacts.`);
    } catch (error) {
      const message = formatErrorMessage(error);
      console.warn("Verified imported archive download-all failed.", error);
      options.onStatus?.(`Verified imported archive download failed: ${message}`);
    }
  });

  const entries = document.createElement("div");
  Object.assign(entries.style, {
    display: "grid",
    gap: "5px",
  });
  for (const artifact of result.artifacts) {
    entries.append(createImportedArtifactInspection(artifact, result, maxPreviewCharacters, options));
  }

  root.append(heading, downloadAll, entries);
  return root;
}

function createImportedArtifactInspection(
  artifact: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveArtifact,
  result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveExtractionResult,
  maxPreviewCharacters: number,
  options: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveActionsOptions,
): HTMLElement {
  const details = document.createElement("details");
  details.dataset.bundleImportedArchiveArtifactKind = artifact.kind;
  details.dataset.bundleImportedArchiveArtifactFilename = artifact.filename;
  details.dataset.bundleImportedArchiveArtifactBytes = String(artifact.bytes);
  details.dataset.bundleImportedArchiveArtifactCrc32 = artifact.crc32Hex;
  details.dataset.bundleImportedArchiveArtifactChecksum = artifact.checksumHex;
  details.dataset.bundleImportedArchiveArtifactDataOffset = String(artifact.dataOffset);
  details.dataset.bundleImportedArchiveArtifactDataEnd = String(artifact.dataEnd);
  Object.assign(details.style, {
    minWidth: "0",
    padding: "6px 7px",
    border: "1px solid rgba(112, 214, 151, 0.22)",
    borderRadius: "7px",
    background: "rgba(112, 214, 151, 0.035)",
  });

  const summary = document.createElement("summary");
  summary.textContent = `${artifact.filename} · ${formatByteSize(artifact.bytes)} · CRC-32 ${artifact.crc32Hex} · SHA-256 ${artifact.checksumHex.slice(0, 12)}…`;
  Object.assign(summary.style, {
    cursor: "pointer",
    fontSize: "10px",
    fontWeight: "700",
    lineHeight: "1.35",
    overflowWrap: "anywhere",
  });

  const body = document.createElement("div");
  Object.assign(body.style, {
    display: "grid",
    gap: "5px",
    marginTop: "6px",
  });

  const metadata = document.createElement("small");
  metadata.textContent = `${artifact.kind} · ${artifact.mimeType} · ZIP bytes ${artifact.dataOffset}-${artifact.dataEnd}`;
  metadata.style.overflowWrap = "anywhere";

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
    "Copy verified imported text",
    `${artifact.filename} · exact ${artifact.bytes} bytes`,
  );
  copy.dataset.bundleImportedArchiveAction = "copy";
  copy.dataset.bundleImportedArchiveArtifactKind = artifact.kind;
  copy.addEventListener("click", () => {
    void (async () => {
      try {
        await copyRuntimeNavMissionDiagnosticsManifestHudValidationImportedArchiveArtifactText(artifact);
        options.onArtifactCopy?.(artifact, result);
        options.onStatus?.(`Copied verified imported artifact ${artifact.filename}.`);
      } catch (error) {
        const message = formatErrorMessage(error);
        console.warn("Verified imported artifact copy failed.", error);
        options.onStatus?.(`Verified imported artifact copy failed: ${message}`);
      }
    })();
  });

  const download = createActionButton(
    "Download verified imported artifact",
    `${artifact.filename} · ${artifact.mimeType}`,
  );
  download.dataset.bundleImportedArchiveAction = "download";
  download.dataset.bundleImportedArchiveArtifactKind = artifact.kind;
  download.addEventListener("click", () => {
    try {
      downloadRuntimeNavMissionDiagnosticsManifestHudValidationImportedArchiveArtifact(artifact);
      options.onArtifactDownload?.(artifact, result);
      options.onStatus?.(`Downloaded verified imported artifact ${artifact.filename}.`);
    } catch (error) {
      const message = formatErrorMessage(error);
      console.warn("Verified imported artifact download failed.", error);
      options.onStatus?.(`Verified imported artifact download failed: ${message}`);
    }
  });

  actions.append(copy, download);
  body.append(metadata, preview, actions);
  details.append(summary, body);
  return details;
}

function createExtractionFailure(
  status: Exclude<
    RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveExtractionStatus,
    "extracted"
  >,
  importResult: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportResult,
  extraction: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionResult,
  error: string,
): RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveExtractionResult {
  return {
    status,
    importResult,
    extraction,
    sourceArchiveFilename: importResult.file.filename,
    artifactCount: 0,
    totalBytes: 0,
    artifacts: [],
    error,
  };
}

function assertImportedArtifactsExtracted(
  result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveExtractionResult,
): asserts result is RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveExtractionResult & {
  status: "extracted";
} {
  if (result.status !== "extracted") {
    throw new Error(result.error ?? "Verified imported archive artifacts are unavailable.");
  }
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
    throw new Error("Imported artifact maxPreviewCharacters must be a positive finite number.");
  }
  return Math.floor(value);
}

function isRangeWithin(offset: number, length: number, total: number): boolean {
  return (
    Number.isInteger(offset) &&
    Number.isInteger(length) &&
    offset >= 0 &&
    length >= 0 &&
    offset <= total &&
    length <= total - offset
  );
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

function copyToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
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
