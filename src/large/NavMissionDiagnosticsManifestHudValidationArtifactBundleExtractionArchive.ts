import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleEntryKind,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundle.js";
import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionResult,
  RuntimeNavMissionDiagnosticsManifestHudValidationExtractedArtifact,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtraction.js";

const ZIP_LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const ZIP_CENTRAL_DIRECTORY_HEADER_SIGNATURE = 0x02014b50;
const ZIP_END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;
const ZIP_VERSION = 20;
const ZIP_UTF8_FLAG = 0x0800;
const ZIP_STORE_METHOD = 0;
const ZIP_FIXED_DOS_TIME = 0;
const ZIP_FIXED_DOS_DATE = 0x0021;
const ZIP_MAX_UINT16 = 0xffff;
const ZIP_MAX_UINT32 = 0xffffffff;
const ZIP_MIME_TYPE = "application/zip" as const;
const DEFAULT_ARCHIVE_FILENAME =
  "mission-diagnostics-policy-manifest.verified-validation-artifacts.zip";

const CRC32_TABLE = createCrc32Table();

export type RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveStatus =
  | "created"
  | "extraction-unavailable"
  | "filename-invalid"
  | "zip64-required"
  | "crypto-unavailable"
  | "archive-error";

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveEntry {
  kind: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleEntryKind;
  filename: string;
  bytes: number;
  crc32Hex: string;
  checksumHex: string;
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveArtifact {
  filename: string;
  mimeType: typeof ZIP_MIME_TYPE;
  bytes: number;
  checksumHex: string;
  entryCount: number;
  totalUncompressedBytes: number;
  compressionMethod: "store";
  fixedTimestamp: "1980-01-01T00:00:00";
  entries: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveEntry[];
  data: Uint8Array;
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveResult {
  status: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveStatus;
  extraction: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionResult;
  artifact: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveArtifact | null;
  error: string | null;
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveOptions {
  filename?: string;
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveButtonOptions {
  onDownload?: (
    artifact: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveArtifact,
    result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveResult,
  ) => void;
  onStatus?: (message: string) => void;
}

interface ZipPreparedEntry {
  artifact: RuntimeNavMissionDiagnosticsManifestHudValidationExtractedArtifact;
  filenameBytes: Uint8Array;
  dataBytes: Uint8Array;
  crc32: number;
  localHeaderOffset: number;
}

export async function createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchive(
  extraction: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionResult,
  options: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveOptions = {},
): Promise<RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveResult> {
  if (extraction.status !== "extracted") {
    return createArchiveFailure(
      "extraction-unavailable",
      extraction,
      extraction.error ?? "Verified artifact extraction is unavailable.",
    );
  }

  const filename =
    options.filename ?? createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveFilename(extraction);
  if (!isSafeArchiveFilename(filename)) {
    return createArchiveFailure(
      "filename-invalid",
      extraction,
      "Verified extraction archive filename must be a safe .zip basename.",
    );
  }

  try {
    const prepared = prepareZipEntries(extraction.artifacts);
    if (prepared.status !== "ready") {
      return createArchiveFailure(prepared.status, extraction, prepared.error);
    }

    const data = createStoredZip(prepared.entries);
    const subtle = globalThis.crypto?.subtle;
    if (!subtle) {
      return createArchiveFailure(
        "crypto-unavailable",
        extraction,
        "Web Crypto is unavailable; the deterministic ZIP archive SHA-256 cannot be calculated.",
      );
    }
    const checksumHex = bytesToHex(await subtle.digest("SHA-256", data));
    const entries = prepared.entries.map((entry) => ({
      kind: entry.artifact.kind,
      filename: entry.artifact.filename,
      bytes: entry.dataBytes.byteLength,
      crc32Hex: entry.crc32.toString(16).padStart(8, "0"),
      checksumHex: entry.artifact.checksumHex,
    }));

    return {
      status: "created",
      extraction,
      artifact: {
        filename,
        mimeType: ZIP_MIME_TYPE,
        bytes: data.byteLength,
        checksumHex,
        entryCount: entries.length,
        totalUncompressedBytes: extraction.totalBytes,
        compressionMethod: "store",
        fixedTimestamp: "1980-01-01T00:00:00",
        entries,
        data,
      },
      error: null,
    };
  } catch (error) {
    return createArchiveFailure("archive-error", extraction, formatErrorMessage(error));
  }
}

export function createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveFilename(
  extraction: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionResult,
): string {
  const target = extraction.verification.document?.target;
  if (target?.scope === "manifest") {
    return "large-world-manifest.diagnostics-policy.verified-validation-artifacts.zip";
  }
  if (target?.scope === "mission-package" && target.packageIndex !== null) {
    return `mission-package-${target.packageIndex}.diagnostics-policy.verified-validation-artifacts.zip`;
  }
  if (target?.scope === "invalid") {
    return "mission-diagnostics-policy-manifest.invalid-target.verified-validation-artifacts.zip";
  }
  return DEFAULT_ARCHIVE_FILENAME;
}

export function downloadRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchive(
  artifact: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveArtifact,
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

export function createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveButton(
  result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveResult,
  options: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveButtonOptions = {},
): HTMLButtonElement {
  const artifact = assertArchiveCreated(result);
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.bundleExtractionArchiveAction = "download";
  button.dataset.bundleExtractionArchiveStatus = result.status;
  button.dataset.bundleExtractionArchiveFilename = artifact.filename;
  button.dataset.bundleExtractionArchiveBytes = String(artifact.bytes);
  button.dataset.bundleExtractionArchiveEntryCount = String(artifact.entryCount);
  button.dataset.bundleExtractionArchiveChecksum = artifact.checksumHex;
  button.dataset.bundleExtractionArchiveCompression = artifact.compressionMethod;
  Object.assign(button.style, {
    display: "grid",
    width: "100%",
    gap: "2px",
    maxWidth: "100%",
    textAlign: "left",
  });

  const label = document.createElement("span");
  label.textContent = "Download verified artifacts ZIP";

  const preview = document.createElement("small");
  preview.textContent = `${artifact.filename} · ${artifact.entryCount} entries · ${formatByteSize(
    artifact.bytes,
  )} · Store · SHA-256 ${artifact.checksumHex.slice(0, 12)}…`;
  Object.assign(preview.style, {
    display: "block",
    maxWidth: "100%",
    fontSize: "9px",
    fontWeight: "500",
    lineHeight: "1.25",
    opacity: "0.66",
    overflowWrap: "anywhere",
  });

  button.title = preview.textContent;
  button.setAttribute("aria-label", `${label.textContent}. ${preview.textContent}`);
  button.append(label, preview);
  button.addEventListener("click", () => {
    try {
      downloadRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchive(artifact);
      options.onDownload?.(artifact, result);
      options.onStatus?.(`Downloaded verified artifact archive ${artifact.filename}.`);
    } catch (error) {
      const message = formatErrorMessage(error);
      console.warn("Verified validation artifact ZIP download failed.", error);
      options.onStatus?.(`Verified artifact archive download failed: ${message}`);
    }
  });
  return button;
}

function prepareZipEntries(
  artifacts: RuntimeNavMissionDiagnosticsManifestHudValidationExtractedArtifact[],
):
  | { status: "ready"; entries: ZipPreparedEntry[] }
  | { status: "filename-invalid" | "zip64-required"; error: string } {
  if (artifacts.length > ZIP_MAX_UINT16) {
    return {
      status: "zip64-required",
      error: "Verified extraction contains too many entries for deterministic non-ZIP64 output.",
    };
  }

  const encoder = new TextEncoder();
  const entries: ZipPreparedEntry[] = [];
  let localOffset = 0;
  for (const artifact of artifacts) {
    if (!isSafeEntryFilename(artifact.filename)) {
      return {
        status: "filename-invalid",
        error: `Verified artifact filename ${artifact.filename} is not a safe ZIP entry basename.`,
      };
    }
    const filenameBytes = encoder.encode(artifact.filename);
    const dataBytes = encoder.encode(artifact.text);
    if (filenameBytes.byteLength > ZIP_MAX_UINT16) {
      return {
        status: "zip64-required",
        error: `Verified artifact filename ${artifact.filename} exceeds the ZIP filename limit.`,
      };
    }
    if (dataBytes.byteLength !== artifact.bytes) {
      return {
        status: "filename-invalid",
        error: `Verified artifact ${artifact.filename} no longer matches its UTF-8 byte size.`,
      };
    }
    if (dataBytes.byteLength > ZIP_MAX_UINT32 || localOffset > ZIP_MAX_UINT32) {
      return {
        status: "zip64-required",
        error: "Verified artifact archive requires ZIP64 because an entry or offset exceeds 32-bit ZIP limits.",
      };
    }

    entries.push({
      artifact,
      filenameBytes,
      dataBytes,
      crc32: calculateCrc32(dataBytes),
      localHeaderOffset: localOffset,
    });
    localOffset += 30 + filenameBytes.byteLength + dataBytes.byteLength;
    if (localOffset > ZIP_MAX_UINT32) {
      return {
        status: "zip64-required",
        error: "Verified artifact archive requires ZIP64 because local file data exceeds 32-bit ZIP limits.",
      };
    }
  }
  return { status: "ready", entries };
}

function createStoredZip(entries: ZipPreparedEntry[]): Uint8Array {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let centralSize = 0;

  for (const entry of entries) {
    const localHeader = new Uint8Array(30);
    const localView = new DataView(localHeader.buffer);
    localView.setUint32(0, ZIP_LOCAL_FILE_HEADER_SIGNATURE, true);
    localView.setUint16(4, ZIP_VERSION, true);
    localView.setUint16(6, ZIP_UTF8_FLAG, true);
    localView.setUint16(8, ZIP_STORE_METHOD, true);
    localView.setUint16(10, ZIP_FIXED_DOS_TIME, true);
    localView.setUint16(12, ZIP_FIXED_DOS_DATE, true);
    localView.setUint32(14, entry.crc32, true);
    localView.setUint32(18, entry.dataBytes.byteLength, true);
    localView.setUint32(22, entry.dataBytes.byteLength, true);
    localView.setUint16(26, entry.filenameBytes.byteLength, true);
    localView.setUint16(28, 0, true);
    localParts.push(localHeader, entry.filenameBytes, entry.dataBytes);

    const centralHeader = new Uint8Array(46);
    const centralView = new DataView(centralHeader.buffer);
    centralView.setUint32(0, ZIP_CENTRAL_DIRECTORY_HEADER_SIGNATURE, true);
    centralView.setUint16(4, ZIP_VERSION, true);
    centralView.setUint16(6, ZIP_VERSION, true);
    centralView.setUint16(8, ZIP_UTF8_FLAG, true);
    centralView.setUint16(10, ZIP_STORE_METHOD, true);
    centralView.setUint16(12, ZIP_FIXED_DOS_TIME, true);
    centralView.setUint16(14, ZIP_FIXED_DOS_DATE, true);
    centralView.setUint32(16, entry.crc32, true);
    centralView.setUint32(20, entry.dataBytes.byteLength, true);
    centralView.setUint32(24, entry.dataBytes.byteLength, true);
    centralView.setUint16(28, entry.filenameBytes.byteLength, true);
    centralView.setUint16(30, 0, true);
    centralView.setUint16(32, 0, true);
    centralView.setUint16(34, 0, true);
    centralView.setUint16(36, 0, true);
    centralView.setUint32(38, 0, true);
    centralView.setUint32(42, entry.localHeaderOffset, true);
    centralParts.push(centralHeader, entry.filenameBytes);
    centralSize += centralHeader.byteLength + entry.filenameBytes.byteLength;
  }

  const centralOffset = localParts.reduce((sum, part) => sum + part.byteLength, 0);
  if (centralOffset > ZIP_MAX_UINT32 || centralSize > ZIP_MAX_UINT32) {
    throw new Error("Verified artifact archive requires ZIP64 central directory fields.");
  }

  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, ZIP_END_OF_CENTRAL_DIRECTORY_SIGNATURE, true);
  endView.setUint16(4, 0, true);
  endView.setUint16(6, 0, true);
  endView.setUint16(8, entries.length, true);
  endView.setUint16(10, entries.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, centralOffset, true);
  endView.setUint16(20, 0, true);
  return concatenateBytes([...localParts, ...centralParts, end]);
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

function concatenateBytes(parts: Uint8Array[]): Uint8Array {
  const totalBytes = parts.reduce((sum, part) => sum + part.byteLength, 0);
  const output = new Uint8Array(totalBytes);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.byteLength;
  }
  return output;
}

function bytesToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function copyToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

function isSafeArchiveFilename(filename: string): boolean {
  return isSafeEntryFilename(filename) && filename.toLowerCase().endsWith(".zip");
}

function isSafeEntryFilename(filename: string): boolean {
  return (
    filename.length > 0 &&
    filename !== "." &&
    filename !== ".." &&
    !filename.includes("/") &&
    !filename.includes("\\") &&
    !/[\u0000-\u001f\u007f]/u.test(filename)
  );
}

function assertArchiveCreated(
  result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveResult,
): RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveArtifact {
  if (result.status !== "created" || !result.artifact) {
    throw new Error(result.error ?? "Verified extraction archive is unavailable.");
  }
  return result.artifact;
}

function createArchiveFailure(
  status: Exclude<
    RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveStatus,
    "created"
  >,
  extraction: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionResult,
  error: string,
): RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveResult {
  return {
    status,
    extraction,
    artifact: null,
    error,
  };
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
