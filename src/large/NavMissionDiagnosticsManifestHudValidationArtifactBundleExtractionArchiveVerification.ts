import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleEntryKind,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundle.js";
import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionResult,
  RuntimeNavMissionDiagnosticsManifestHudValidationExtractedArtifact,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtraction.js";
import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveArtifact,
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveEntry,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchive.js";
import {
  RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_ORDER,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleVerification.js";

const ZIP_LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const ZIP_CENTRAL_DIRECTORY_HEADER_SIGNATURE = 0x02014b50;
const ZIP_END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;
const ZIP_VERSION = 20;
const ZIP_UTF8_FLAG = 0x0800;
const ZIP_STORE_METHOD = 0;
const ZIP_FIXED_DOS_TIME = 0;
const ZIP_FIXED_DOS_DATE = 0x0021;
const ZIP_EOCD_FIXED_BYTES = 22;
const ZIP_MAX_COMMENT_BYTES = 0xffff;
const ZIP_MIME_TYPE = "application/zip";
const CRC32_TABLE = createCrc32Table();

export type RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveVerificationIssueCode =
  | "archive-empty"
  | "archive-filename-invalid"
  | "archive-mime-type-mismatch"
  | "archive-byte-size-mismatch"
  | "archive-checksum-invalid"
  | "archive-checksum-mismatch"
  | "archive-metadata-mismatch"
  | "crypto-unavailable"
  | "eocd-not-found"
  | "eocd-invalid"
  | "multi-disk-unsupported"
  | "archive-comment-not-empty"
  | "archive-trailing-data"
  | "central-directory-range-invalid"
  | "central-directory-size-mismatch"
  | "central-directory-count-mismatch"
  | "central-directory-signature-mismatch"
  | "central-directory-entry-truncated"
  | "central-directory-trailing-data"
  | "entry-count-mismatch"
  | "entry-order-mismatch"
  | "entry-filename-invalid"
  | "entry-filename-mismatch"
  | "entry-utf8-flag-mismatch"
  | "entry-compression-method-mismatch"
  | "entry-version-mismatch"
  | "entry-timestamp-mismatch"
  | "entry-extra-field-not-empty"
  | "entry-comment-not-empty"
  | "entry-disk-number-mismatch"
  | "entry-attributes-mismatch"
  | "entry-size-mismatch"
  | "entry-crc32-mismatch"
  | "entry-sha256-mismatch"
  | "entry-content-mismatch"
  | "local-header-offset-invalid"
  | "local-header-signature-mismatch"
  | "local-header-truncated"
  | "local-header-metadata-mismatch"
  | "local-central-mismatch"
  | "local-entry-order-mismatch"
  | "entry-data-range-invalid"
  | "local-data-central-directory-gap";

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveVerificationIssue {
  code: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveVerificationIssueCode;
  path: string;
  message: string;
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveVerificationEntry {
  kind: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleEntryKind | null;
  filename: string;
  bytes: number;
  compressedBytes: number;
  crc32Hex: string;
  checksumHex: string | null;
  localHeaderOffset: number;
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveVerificationChecks {
  archiveChecksum: boolean;
  eocd: boolean;
  centralDirectory: boolean;
  entryOrder: boolean;
  localHeadersVerified: number;
  deterministicMetadataVerified: number;
  crc32Verified: number;
  sha256Verified: number;
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveVerificationResult {
  valid: boolean;
  archiveChecksumHex: string | null;
  archiveBytes: number;
  entryCount: number;
  totalUncompressedBytes: number;
  issues: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveVerificationIssue[];
  checks: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveVerificationChecks;
  entries: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveVerificationEntry[];
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveVerificationOptions {
  expectedExtraction?: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionResult;
  expectedFilename?: string;
  expectedArchiveBytes?: number;
  expectedArchiveChecksumHex?: string;
  declaredEntries?: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveEntry[];
  declaredEntryCount?: number;
  declaredTotalUncompressedBytes?: number;
  declaredMimeType?: string;
  declaredCompressionMethod?: string;
  declaredFixedTimestamp?: string;
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveVerificationControlOptions {
  onVerify?: (
    verification: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveVerificationResult,
    artifact: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveArtifact,
  ) => void;
  onStatus?: (message: string) => void;
}

interface CentralDirectoryEntry {
  index: number;
  kind: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleEntryKind | null;
  filename: string;
  filenameBytes: Uint8Array;
  flags: number;
  method: number;
  modifiedTime: number;
  modifiedDate: number;
  crc32: number;
  compressedBytes: number;
  uncompressedBytes: number;
  localHeaderOffset: number;
  recordEnd: number;
  deterministicMetadata: boolean;
}

export async function verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveArtifact(
  artifact: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveArtifact,
  extraction: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionResult,
): Promise<RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveVerificationResult> {
  return verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveBytes(
    artifact.data,
    {
      expectedExtraction: extraction,
      expectedFilename: artifact.filename,
      expectedArchiveBytes: artifact.bytes,
      expectedArchiveChecksumHex: artifact.checksumHex,
      declaredEntries: artifact.entries,
      declaredEntryCount: artifact.entryCount,
      declaredTotalUncompressedBytes: artifact.totalUncompressedBytes,
      declaredMimeType: artifact.mimeType,
      declaredCompressionMethod: artifact.compressionMethod,
      declaredFixedTimestamp: artifact.fixedTimestamp,
    },
  );
}

export async function verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveBytes(
  data: Uint8Array,
  options: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveVerificationOptions = {},
): Promise<RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveVerificationResult> {
  const issues: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveVerificationIssue[] = [];
  const checks: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveVerificationChecks = {
    archiveChecksum: false,
    eocd: false,
    centralDirectory: false,
    entryOrder: false,
    localHeadersVerified: 0,
    deterministicMetadataVerified: 0,
    crc32Verified: 0,
    sha256Verified: 0,
  };
  const entries: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveVerificationEntry[] = [];
  let archiveChecksumHex: string | null = null;
  let totalUncompressedBytes = 0;

  if (data.byteLength === 0) {
    addIssue(issues, "archive-empty", "$", "ZIP archive bytes must not be empty.");
    return createVerificationResult(data, archiveChecksumHex, entries, totalUncompressedBytes, issues, checks);
  }

  validateDeclaredArchiveMetadata(options, data, issues);

  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    addIssue(
      issues,
      "crypto-unavailable",
      "$",
      "Web Crypto is unavailable; archive and entry SHA-256 values cannot be verified.",
    );
  } else {
    archiveChecksumHex = bytesToHex(await subtle.digest("SHA-256", data));
    checks.archiveChecksum = validateArchiveChecksum(archiveChecksumHex, options, issues);
  }

  const eocdOffset = findEndOfCentralDirectoryOffset(data);
  if (eocdOffset < 0) {
    addIssue(issues, "eocd-not-found", "$", "ZIP end-of-central-directory record was not found.");
    return createVerificationResult(data, archiveChecksumHex, entries, totalUncompressedBytes, issues, checks);
  }

  const view = createDataView(data);
  const diskNumber = view.getUint16(eocdOffset + 4, true);
  const centralDirectoryDisk = view.getUint16(eocdOffset + 6, true);
  const entryCountOnDisk = view.getUint16(eocdOffset + 8, true);
  const entryCount = view.getUint16(eocdOffset + 10, true);
  const centralDirectoryBytes = view.getUint32(eocdOffset + 12, true);
  const centralDirectoryOffset = view.getUint32(eocdOffset + 16, true);
  const archiveCommentBytes = view.getUint16(eocdOffset + 20, true);

  let eocdValid = true;
  if (diskNumber !== 0 || centralDirectoryDisk !== 0) {
    eocdValid = false;
    addIssue(
      issues,
      "multi-disk-unsupported",
      "$.eocd",
      "Deterministic verified artifact ZIP archives must use a single disk.",
    );
  }
  if (entryCountOnDisk !== entryCount) {
    eocdValid = false;
    addIssue(
      issues,
      "central-directory-count-mismatch",
      "$.eocd.entryCount",
      "EOCD entry count on disk does not match the total entry count.",
    );
  }
  if (archiveCommentBytes !== 0) {
    eocdValid = false;
    addIssue(
      issues,
      "archive-comment-not-empty",
      "$.eocd.commentLength",
      "Deterministic verified artifact ZIP archives must not contain an archive comment.",
    );
  }
  if (eocdOffset + ZIP_EOCD_FIXED_BYTES + archiveCommentBytes !== data.byteLength) {
    eocdValid = false;
    addIssue(
      issues,
      "archive-trailing-data",
      "$.eocd",
      "ZIP archive bytes must end immediately after the EOCD record.",
    );
  }

  const centralDirectoryEnd = centralDirectoryOffset + centralDirectoryBytes;
  if (
    centralDirectoryOffset > eocdOffset ||
    centralDirectoryEnd > eocdOffset ||
    centralDirectoryEnd > data.byteLength
  ) {
    eocdValid = false;
    addIssue(
      issues,
      "central-directory-range-invalid",
      "$.eocd.centralDirectory",
      "EOCD central-directory offset and size are outside the ZIP archive bounds.",
    );
  } else if (centralDirectoryEnd !== eocdOffset) {
    eocdValid = false;
    addIssue(
      issues,
      "central-directory-size-mismatch",
      "$.eocd.centralDirectory",
      "Central directory must end immediately before the EOCD record.",
    );
  }
  checks.eocd = eocdValid;

  if (entryCount !== RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_ORDER.length) {
    addIssue(
      issues,
      "entry-count-mismatch",
      "$.eocd.entryCount",
      `Verified artifact ZIP must contain exactly ${RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_ORDER.length} entries.`,
    );
  }
  if (options.declaredEntryCount !== undefined && options.declaredEntryCount !== entryCount) {
    addIssue(
      issues,
      "archive-metadata-mismatch",
      "$.artifact.entryCount",
      "Declared archive entry count does not match the parsed EOCD entry count.",
    );
  }

  const parsedCentralEntries: CentralDirectoryEntry[] = [];
  let centralDirectoryValid = eocdValid;
  let centralCursor = centralDirectoryOffset;
  const decoder = new TextDecoder("utf-8", { fatal: true });
  for (let index = 0; index < entryCount; index += 1) {
    const path = `$.entries[${index}]`;
    if (centralCursor + 46 > centralDirectoryEnd || centralCursor + 46 > data.byteLength) {
      centralDirectoryValid = false;
      addIssue(
        issues,
        "central-directory-entry-truncated",
        path,
        "Central-directory entry header is truncated.",
      );
      break;
    }
    if (view.getUint32(centralCursor, true) !== ZIP_CENTRAL_DIRECTORY_HEADER_SIGNATURE) {
      centralDirectoryValid = false;
      addIssue(
        issues,
        "central-directory-signature-mismatch",
        path,
        "Central-directory entry signature is invalid.",
      );
      break;
    }

    const versionMadeBy = view.getUint16(centralCursor + 4, true);
    const versionNeeded = view.getUint16(centralCursor + 6, true);
    const flags = view.getUint16(centralCursor + 8, true);
    const method = view.getUint16(centralCursor + 10, true);
    const modifiedTime = view.getUint16(centralCursor + 12, true);
    const modifiedDate = view.getUint16(centralCursor + 14, true);
    const crc32 = view.getUint32(centralCursor + 16, true);
    const compressedBytes = view.getUint32(centralCursor + 20, true);
    const uncompressedBytes = view.getUint32(centralCursor + 24, true);
    const filenameBytesLength = view.getUint16(centralCursor + 28, true);
    const extraBytesLength = view.getUint16(centralCursor + 30, true);
    const commentBytesLength = view.getUint16(centralCursor + 32, true);
    const diskStart = view.getUint16(centralCursor + 34, true);
    const internalAttributes = view.getUint16(centralCursor + 36, true);
    const externalAttributes = view.getUint32(centralCursor + 38, true);
    const localHeaderOffset = view.getUint32(centralCursor + 42, true);
    const recordEnd =
      centralCursor + 46 + filenameBytesLength + extraBytesLength + commentBytesLength;
    if (recordEnd > centralDirectoryEnd || recordEnd > data.byteLength) {
      centralDirectoryValid = false;
      addIssue(
        issues,
        "central-directory-entry-truncated",
        path,
        "Central-directory entry filename, extra field, or comment is truncated.",
      );
      break;
    }

    const filenameBytes = data.subarray(centralCursor + 46, centralCursor + 46 + filenameBytesLength);
    let filename = "";
    try {
      filename = decoder.decode(filenameBytes);
    } catch {
      centralDirectoryValid = false;
      addIssue(
        issues,
        "entry-filename-invalid",
        `${path}.filename`,
        "ZIP entry filename is not valid UTF-8.",
      );
    }

    let deterministicMetadata = true;
    if (versionMadeBy !== ZIP_VERSION || versionNeeded !== ZIP_VERSION) {
      deterministicMetadata = false;
      addIssue(
        issues,
        "entry-version-mismatch",
        `${path}.version`,
        "ZIP entry versions must both be 20 for deterministic ZIP32 Store output.",
      );
    }
    if (flags !== ZIP_UTF8_FLAG) {
      deterministicMetadata = false;
      addIssue(
        issues,
        "entry-utf8-flag-mismatch",
        `${path}.flags`,
        "ZIP entry flags must contain only the UTF-8 filename flag.",
      );
    }
    if (method !== ZIP_STORE_METHOD) {
      deterministicMetadata = false;
      addIssue(
        issues,
        "entry-compression-method-mismatch",
        `${path}.compressionMethod`,
        "Verified artifact ZIP entries must use Store compression method 0.",
      );
    }
    if (modifiedTime !== ZIP_FIXED_DOS_TIME || modifiedDate !== ZIP_FIXED_DOS_DATE) {
      deterministicMetadata = false;
      addIssue(
        issues,
        "entry-timestamp-mismatch",
        `${path}.timestamp`,
        "ZIP entry timestamp must be fixed to 1980-01-01 00:00:00.",
      );
    }
    if (extraBytesLength !== 0) {
      deterministicMetadata = false;
      addIssue(
        issues,
        "entry-extra-field-not-empty",
        `${path}.extraLength`,
        "Deterministic verified artifact ZIP entries must not contain extra fields.",
      );
    }
    if (commentBytesLength !== 0) {
      deterministicMetadata = false;
      addIssue(
        issues,
        "entry-comment-not-empty",
        `${path}.commentLength`,
        "Deterministic verified artifact ZIP entries must not contain file comments.",
      );
    }
    if (diskStart !== 0) {
      deterministicMetadata = false;
      addIssue(
        issues,
        "entry-disk-number-mismatch",
        `${path}.diskStart`,
        "ZIP entry must start on disk zero.",
      );
    }
    if (internalAttributes !== 0 || externalAttributes !== 0) {
      deterministicMetadata = false;
      addIssue(
        issues,
        "entry-attributes-mismatch",
        `${path}.attributes`,
        "Deterministic verified artifact ZIP entries must not declare file attributes.",
      );
    }
    if (compressedBytes !== uncompressedBytes) {
      deterministicMetadata = false;
      addIssue(
        issues,
        "entry-size-mismatch",
        `${path}.compressedBytes`,
        "Stored ZIP entry compressed and uncompressed sizes must match.",
      );
    }
    if (!isSafeEntryFilename(filename)) {
      deterministicMetadata = false;
      addIssue(
        issues,
        "entry-filename-invalid",
        `${path}.filename`,
        "ZIP entry filename must be a safe basename.",
      );
    }
    if (deterministicMetadata) checks.deterministicMetadataVerified += 1;

    const expectedKind =
      RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_ORDER[index] ?? null;
    const expectedArtifact = getExpectedArtifact(options.expectedExtraction, index);
    const declaredEntry = options.declaredEntries?.[index];
    validateExpectedEntryMetadata(
      index,
      expectedKind,
      filename,
      uncompressedBytes,
      crc32,
      expectedArtifact,
      declaredEntry,
      issues,
    );

    parsedCentralEntries.push({
      index,
      kind: expectedKind,
      filename,
      filenameBytes,
      flags,
      method,
      modifiedTime,
      modifiedDate,
      crc32,
      compressedBytes,
      uncompressedBytes,
      localHeaderOffset,
      recordEnd,
      deterministicMetadata,
    });
    totalUncompressedBytes += uncompressedBytes;
    centralCursor = recordEnd;
  }

  if (centralCursor !== centralDirectoryEnd) {
    centralDirectoryValid = false;
    addIssue(
      issues,
      "central-directory-trailing-data",
      "$.centralDirectory",
      "Parsed central-directory entries do not consume the declared central-directory byte range.",
    );
  }
  checks.centralDirectory = centralDirectoryValid;

  let entryOrderValid = parsedCentralEntries.length === entryCount;
  let expectedLocalOffset = 0;
  for (const centralEntry of parsedCentralEntries) {
    const index = centralEntry.index;
    const path = `$.entries[${index}]`;
    const expectedKind = centralEntry.kind;
    if (!expectedKind) {
      entryOrderValid = false;
      addIssue(
        issues,
        "entry-order-mismatch",
        `${path}.kind`,
        "ZIP entry index is outside the fixed validation artifact order.",
      );
    }
    if (centralEntry.localHeaderOffset !== expectedLocalOffset) {
      entryOrderValid = false;
      addIssue(
        issues,
        "local-entry-order-mismatch",
        `${path}.localHeaderOffset`,
        "Local ZIP entries must be contiguous and in the same fixed order as the central directory.",
      );
    }

    if (centralEntry.localHeaderOffset + 30 > centralDirectoryOffset) {
      addIssue(
        issues,
        "local-header-offset-invalid",
        `${path}.localHeaderOffset`,
        "Local ZIP header offset points outside the local-file data region.",
      );
      continue;
    }
    const localOffset = centralEntry.localHeaderOffset;
    if (view.getUint32(localOffset, true) !== ZIP_LOCAL_FILE_HEADER_SIGNATURE) {
      addIssue(
        issues,
        "local-header-signature-mismatch",
        `${path}.localHeader`,
        "Local ZIP header signature is invalid.",
      );
      continue;
    }

    const localVersion = view.getUint16(localOffset + 4, true);
    const localFlags = view.getUint16(localOffset + 6, true);
    const localMethod = view.getUint16(localOffset + 8, true);
    const localModifiedTime = view.getUint16(localOffset + 10, true);
    const localModifiedDate = view.getUint16(localOffset + 12, true);
    const localCrc32 = view.getUint32(localOffset + 14, true);
    const localCompressedBytes = view.getUint32(localOffset + 18, true);
    const localUncompressedBytes = view.getUint32(localOffset + 22, true);
    const localFilenameBytesLength = view.getUint16(localOffset + 26, true);
    const localExtraBytesLength = view.getUint16(localOffset + 28, true);
    const localHeaderEnd = localOffset + 30 + localFilenameBytesLength + localExtraBytesLength;
    if (localHeaderEnd > centralDirectoryOffset || localHeaderEnd > data.byteLength) {
      addIssue(
        issues,
        "local-header-truncated",
        `${path}.localHeader`,
        "Local ZIP header filename or extra field is truncated.",
      );
      continue;
    }

    const localFilenameBytes = data.subarray(localOffset + 30, localOffset + 30 + localFilenameBytesLength);
    let localFilename = "";
    try {
      localFilename = decoder.decode(localFilenameBytes);
    } catch {
      addIssue(
        issues,
        "entry-filename-invalid",
        `${path}.localFilename`,
        "Local ZIP entry filename is not valid UTF-8.",
      );
    }

    let localHeaderValid = true;
    if (
      localVersion !== ZIP_VERSION ||
      localFlags !== ZIP_UTF8_FLAG ||
      localMethod !== ZIP_STORE_METHOD ||
      localModifiedTime !== ZIP_FIXED_DOS_TIME ||
      localModifiedDate !== ZIP_FIXED_DOS_DATE ||
      localExtraBytesLength !== 0
    ) {
      localHeaderValid = false;
      addIssue(
        issues,
        "local-header-metadata-mismatch",
        `${path}.localHeader`,
        "Local ZIP header does not match deterministic version, flags, method, timestamp, or extra-field requirements.",
      );
    }
    if (
      localFlags !== centralEntry.flags ||
      localMethod !== centralEntry.method ||
      localModifiedTime !== centralEntry.modifiedTime ||
      localModifiedDate !== centralEntry.modifiedDate ||
      localCrc32 !== centralEntry.crc32 ||
      localCompressedBytes !== centralEntry.compressedBytes ||
      localUncompressedBytes !== centralEntry.uncompressedBytes ||
      localFilename !== centralEntry.filename
    ) {
      localHeaderValid = false;
      addIssue(
        issues,
        "local-central-mismatch",
        `${path}.localHeader`,
        "Local ZIP header metadata does not match the central-directory entry.",
      );
    }

    const dataStart = localHeaderEnd;
    const dataEnd = dataStart + localCompressedBytes;
    if (dataEnd > centralDirectoryOffset || dataEnd > data.byteLength) {
      localHeaderValid = false;
      addIssue(
        issues,
        "entry-data-range-invalid",
        `${path}.data`,
        "Stored ZIP entry data extends outside the local-file data region.",
      );
      continue;
    }
    expectedLocalOffset = dataEnd;
    if (localHeaderValid) checks.localHeadersVerified += 1;

    const entryData = data.subarray(dataStart, dataEnd);
    const actualCrc32 = calculateCrc32(entryData);
    if (actualCrc32 !== centralEntry.crc32 || actualCrc32 !== localCrc32) {
      addIssue(
        issues,
        "entry-crc32-mismatch",
        `${path}.crc32`,
        "Stored ZIP entry CRC-32 does not match the exact entry bytes.",
      );
    } else {
      checks.crc32Verified += 1;
    }

    const expectedArtifact = getExpectedArtifact(options.expectedExtraction, index);
    if (expectedArtifact) {
      const expectedBytes = new TextEncoder().encode(expectedArtifact.text);
      if (!equalBytes(entryData, expectedBytes)) {
        addIssue(
          issues,
          "entry-content-mismatch",
          `${path}.data`,
          "Stored ZIP entry bytes do not match the verified extracted artifact text.",
        );
      }
    }

    let checksumHex: string | null = null;
    if (subtle) {
      checksumHex = bytesToHex(await subtle.digest("SHA-256", entryData));
      const expectedChecksum = expectedArtifact?.checksumHex ?? options.declaredEntries?.[index]?.checksumHex;
      if (expectedChecksum && checksumHex !== expectedChecksum) {
        addIssue(
          issues,
          "entry-sha256-mismatch",
          `${path}.sha256`,
          "Stored ZIP entry SHA-256 does not match the verified artifact checksum.",
        );
      } else {
        checks.sha256Verified += 1;
      }
    }

    entries.push({
      kind: expectedKind,
      filename: centralEntry.filename,
      bytes: centralEntry.uncompressedBytes,
      compressedBytes: centralEntry.compressedBytes,
      crc32Hex: centralEntry.crc32.toString(16).padStart(8, "0"),
      checksumHex,
      localHeaderOffset: centralEntry.localHeaderOffset,
    });
  }

  if (expectedLocalOffset !== centralDirectoryOffset) {
    entryOrderValid = false;
    addIssue(
      issues,
      "local-data-central-directory-gap",
      "$.centralDirectory.offset",
      "Local ZIP records must end exactly where the central directory begins.",
    );
  }
  checks.entryOrder = entryOrderValid;

  if (
    options.declaredTotalUncompressedBytes !== undefined &&
    options.declaredTotalUncompressedBytes !== totalUncompressedBytes
  ) {
    addIssue(
      issues,
      "archive-metadata-mismatch",
      "$.artifact.totalUncompressedBytes",
      "Declared total uncompressed bytes do not match parsed ZIP entries.",
    );
  }

  return createVerificationResult(data, archiveChecksumHex, entries, totalUncompressedBytes, issues, checks);
}

export function formatRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveVerification(
  verification: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveVerificationResult,
): string {
  if (verification.valid) {
    return `verified · ${verification.entryCount} entries · ${verification.checks.crc32Verified} CRC-32 · ${verification.checks.sha256Verified} SHA-256`;
  }
  return `verification failed · ${formatIssueCount(verification.issues.length)}`;
}

export function createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveVerificationControl(
  artifact: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveArtifact,
  extraction: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionResult,
  options: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveVerificationControlOptions = {},
): HTMLElement {
  const root = document.createElement("section");
  root.className = "mission-debug-diagnostics-manifest-validation-bundle-extraction-archive-verification";
  root.dataset.bundleExtractionArchiveVerificationStatus = "idle";
  Object.assign(root.style, {
    display: "grid",
    gap: "4px",
    minWidth: "0",
  });

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
  label.textContent = "Verify verified artifacts ZIP";
  const preview = document.createElement("small");
  preview.textContent = "EOCD · central directory · local headers · CRC-32 · SHA-256";
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

  const details = document.createElement("details");
  details.hidden = true;
  Object.assign(details.style, {
    minWidth: "0",
    padding: "6px 7px",
    border: "1px solid rgba(118, 190, 255, 0.2)",
    borderRadius: "7px",
    background: "rgba(118, 190, 255, 0.035)",
  });

  button.addEventListener("click", () => {
    void handleArchiveVerification(root, button, label, preview, details, artifact, extraction, options);
  });
  root.append(button, details);
  return root;
}

async function handleArchiveVerification(
  root: HTMLElement,
  button: HTMLButtonElement,
  label: HTMLSpanElement,
  preview: HTMLElement,
  details: HTMLDetailsElement,
  artifact: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveArtifact,
  extraction: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionResult,
  options: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveVerificationControlOptions,
): Promise<void> {
  button.disabled = true;
  label.textContent = "Verifying verified artifacts ZIP…";
  root.dataset.bundleExtractionArchiveVerificationStatus = "verifying";
  try {
    const verification =
      await verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveArtifact(
        artifact,
        extraction,
      );
    root.dataset.bundleExtractionArchiveVerificationStatus = verification.valid ? "verified" : "failed";
    root.dataset.bundleExtractionArchiveVerificationValid = String(verification.valid);
    root.dataset.bundleExtractionArchiveVerificationIssueCount = String(verification.issues.length);
    root.dataset.bundleExtractionArchiveVerificationEntryCount = String(verification.entryCount);
    root.dataset.bundleExtractionArchiveVerificationCrc32Count = String(verification.checks.crc32Verified);
    root.dataset.bundleExtractionArchiveVerificationSha256Count = String(verification.checks.sha256Verified);
    if (verification.archiveChecksumHex) {
      root.dataset.bundleExtractionArchiveVerificationChecksum = verification.archiveChecksumHex;
    } else {
      delete root.dataset.bundleExtractionArchiveVerificationChecksum;
    }

    const summary =
      formatRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveVerification(
        verification,
      );
    preview.textContent = `${artifact.filename} · ${summary}`;
    button.title = preview.textContent;
    button.setAttribute("aria-label", `Verify verified artifacts ZIP. ${preview.textContent}`);
    renderArchiveVerificationDetails(details, verification);
    options.onVerify?.(verification, artifact);
    options.onStatus?.(
      verification.valid
        ? `Verified artifact ZIP ${artifact.filename} with ${verification.entryCount} entries.`
        : `Verified artifact ZIP verification failed with ${formatIssueCount(verification.issues.length)}.`,
    );
  } catch (error) {
    const message = formatErrorMessage(error);
    root.dataset.bundleExtractionArchiveVerificationStatus = "error";
    preview.textContent = `${artifact.filename} · verification error · ${message}`;
    details.hidden = false;
    details.open = true;
    const summary = document.createElement("summary");
    summary.textContent = "Archive verification error";
    const errorText = document.createElement("small");
    errorText.textContent = message;
    details.replaceChildren(summary, errorText);
    options.onStatus?.(`Verified artifact ZIP verification error: ${message}`);
  } finally {
    button.disabled = false;
    label.textContent = "Verify verified artifacts ZIP";
  }
}

function renderArchiveVerificationDetails(
  details: HTMLDetailsElement,
  verification: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveVerificationResult,
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
    ? `Archive verification · passed · ${verification.entryCount} entries`
    : `Archive verification · failed · ${formatIssueCount(verification.issues.length)}`;
  Object.assign(summary.style, {
    cursor: "pointer",
    fontSize: "10px",
    fontWeight: "750",
    lineHeight: "1.35",
    overflowWrap: "anywhere",
  });

  const body = document.createElement("div");
  Object.assign(body.style, {
    display: "grid",
    gap: "5px",
    marginTop: "6px",
  });
  const checks = document.createElement("small");
  checks.textContent = [
    `EOCD ${formatBooleanCheck(verification.checks.eocd)}`,
    `central directory ${formatBooleanCheck(verification.checks.centralDirectory)}`,
    `entry order ${formatBooleanCheck(verification.checks.entryOrder)}`,
    `${verification.checks.localHeadersVerified} local headers`,
    `${verification.checks.crc32Verified} CRC-32`,
    `${verification.checks.sha256Verified} SHA-256`,
  ].join(" · ");
  body.append(checks);

  if (verification.issues.length > 0) {
    const list = document.createElement("ul");
    Object.assign(list.style, {
      display: "grid",
      gap: "4px",
      margin: "0",
      padding: "0",
      listStyle: "none",
    });
    for (const issue of verification.issues) {
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
      item.append(heading, message);
      list.append(item);
    }
    body.append(list);
  }
  details.replaceChildren(summary, body);
}

function validateDeclaredArchiveMetadata(
  options: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveVerificationOptions,
  data: Uint8Array,
  issues: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveVerificationIssue[],
): void {
  if (options.expectedFilename !== undefined && !isSafeArchiveFilename(options.expectedFilename)) {
    addIssue(
      issues,
      "archive-filename-invalid",
      "$.artifact.filename",
      "Declared archive filename must be a safe .zip basename.",
    );
  }
  if (options.expectedArchiveBytes !== undefined && options.expectedArchiveBytes !== data.byteLength) {
    addIssue(
      issues,
      "archive-byte-size-mismatch",
      "$.artifact.bytes",
      "Declared archive byte size does not match the exact ZIP bytes.",
    );
  }
  if (options.declaredMimeType !== undefined && options.declaredMimeType !== ZIP_MIME_TYPE) {
    addIssue(
      issues,
      "archive-mime-type-mismatch",
      "$.artifact.mimeType",
      "Verified artifact archive MIME type must be application/zip.",
    );
  }
  if (
    options.declaredCompressionMethod !== undefined &&
    options.declaredCompressionMethod !== "store"
  ) {
    addIssue(
      issues,
      "archive-metadata-mismatch",
      "$.artifact.compressionMethod",
      "Declared archive compression method must be store.",
    );
  }
  if (
    options.declaredFixedTimestamp !== undefined &&
    options.declaredFixedTimestamp !== "1980-01-01T00:00:00"
  ) {
    addIssue(
      issues,
      "archive-metadata-mismatch",
      "$.artifact.fixedTimestamp",
      "Declared archive fixed timestamp must be 1980-01-01T00:00:00.",
    );
  }
}

function validateArchiveChecksum(
  actualChecksumHex: string,
  options: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveVerificationOptions,
  issues: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveVerificationIssue[],
): boolean {
  if (options.expectedArchiveChecksumHex === undefined) return true;
  if (!/^[0-9a-f]{64}$/u.test(options.expectedArchiveChecksumHex)) {
    addIssue(
      issues,
      "archive-checksum-invalid",
      "$.artifact.checksumHex",
      "Declared archive SHA-256 must be 64 lowercase hexadecimal characters.",
    );
    return false;
  }
  if (actualChecksumHex !== options.expectedArchiveChecksumHex) {
    addIssue(
      issues,
      "archive-checksum-mismatch",
      "$.artifact.checksumHex",
      "Archive SHA-256 does not match the exact ZIP bytes.",
    );
    return false;
  }
  return true;
}

function validateExpectedEntryMetadata(
  index: number,
  expectedKind: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleEntryKind | null,
  filename: string,
  bytes: number,
  crc32: number,
  expectedArtifact: RuntimeNavMissionDiagnosticsManifestHudValidationExtractedArtifact | null,
  declaredEntry: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveEntry | undefined,
  issues: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveVerificationIssue[],
): void {
  const path = `$.entries[${index}]`;
  if (declaredEntry && expectedKind && declaredEntry.kind !== expectedKind) {
    addIssue(
      issues,
      "entry-order-mismatch",
      `${path}.kind`,
      "Declared archive entry kind does not match the fixed artifact order.",
    );
  }
  const expectedFilename = expectedArtifact?.filename ?? declaredEntry?.filename;
  if (expectedFilename !== undefined && filename !== expectedFilename) {
    addIssue(
      issues,
      "entry-filename-mismatch",
      `${path}.filename`,
      "ZIP entry filename does not match the verified artifact filename.",
    );
  }
  const expectedBytes = expectedArtifact?.bytes ?? declaredEntry?.bytes;
  if (expectedBytes !== undefined && bytes !== expectedBytes) {
    addIssue(
      issues,
      "entry-size-mismatch",
      `${path}.bytes`,
      "ZIP entry byte size does not match the verified artifact byte size.",
    );
  }
  if (declaredEntry) {
    const actualCrc32Hex = crc32.toString(16).padStart(8, "0");
    if (declaredEntry.crc32Hex !== actualCrc32Hex) {
      addIssue(
        issues,
        "entry-crc32-mismatch",
        `${path}.crc32Hex`,
        "Declared entry CRC-32 does not match the central-directory CRC-32.",
      );
    }
  }
}

function getExpectedArtifact(
  extraction: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionResult | undefined,
  index: number,
): RuntimeNavMissionDiagnosticsManifestHudValidationExtractedArtifact | null {
  if (!extraction || extraction.status !== "extracted") return null;
  return extraction.artifacts[index] ?? null;
}

function findEndOfCentralDirectoryOffset(data: Uint8Array): number {
  if (data.byteLength < ZIP_EOCD_FIXED_BYTES) return -1;
  const view = createDataView(data);
  const minimumOffset = Math.max(
    0,
    data.byteLength - ZIP_EOCD_FIXED_BYTES - ZIP_MAX_COMMENT_BYTES,
  );
  for (let offset = data.byteLength - ZIP_EOCD_FIXED_BYTES; offset >= minimumOffset; offset -= 1) {
    if (view.getUint32(offset, true) === ZIP_END_OF_CENTRAL_DIRECTORY_SIGNATURE) return offset;
  }
  return -1;
}

function createVerificationResult(
  data: Uint8Array,
  archiveChecksumHex: string | null,
  entries: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveVerificationEntry[],
  totalUncompressedBytes: number,
  issues: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveVerificationIssue[],
  checks: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveVerificationChecks,
): RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveVerificationResult {
  return {
    valid: issues.length === 0,
    archiveChecksumHex,
    archiveBytes: data.byteLength,
    entryCount: entries.length,
    totalUncompressedBytes,
    issues,
    checks,
    entries,
  };
}

function addIssue(
  issues: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveVerificationIssue[],
  code: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveVerificationIssueCode,
  path: string,
  message: string,
): void {
  issues.push({ code, path, message });
}

function createDataView(data: Uint8Array): DataView {
  return new DataView(data.buffer, data.byteOffset, data.byteLength);
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

function bytesToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function equalBytes(left: Uint8Array, right: Uint8Array): boolean {
  if (left.byteLength !== right.byteLength) return false;
  for (let index = 0; index < left.byteLength; index += 1) {
    if (left[index] !== right[index]) return false;
  }
  return true;
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

function formatIssueCount(count: number): string {
  return `${count} verification issue${count === 1 ? "" : "s"}`;
}

function formatBooleanCheck(value: boolean): string {
  return value ? "verified" : "failed";
}

function formatErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
