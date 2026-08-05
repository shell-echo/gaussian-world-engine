import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionResult,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtraction.js";
import {
  createRuntimeNavMissionDiagnosticsManifestHudValidationImportedArchiveArtifactActions,
  extractRuntimeNavMissionDiagnosticsManifestHudValidationArtifactsFromVerifiedArchiveImport,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactExtraction.js";
import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveArtifact,
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveExtractionResult,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactExtraction.js";
import {
  createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceActions,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenance.js";
import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceArtifact,
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceResult,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenance.js";
import {
  formatRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveVerification,
  verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveBytes,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveVerification.js";
import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveVerificationIssue,
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveVerificationResult,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveVerification.js";

export const RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_EXTRACTION_ARCHIVE_IMPORT_MAX_BYTES =
  32 * 1024 * 1024;

export type RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportStatus =
  | "verified"
  | "verification-failed"
  | "entry-extraction-failed"
  | "rejected"
  | "read-failed"
  | "verification-error";

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportFileMetadata {
  filename: string;
  mimeType: string;
  bytes: number;
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportResult {
  status: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportStatus;
  file: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportFileMetadata;
  archiveBytes: number | null;
  data: Uint8Array | null;
  verification: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveVerificationResult | null;
  entryExtraction: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveExtractionResult | null;
  error: string | null;
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportOptions {
  maxFileBytes?: number;
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportControlOptions
  extends RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportOptions {
  onImport?: (
    result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportResult,
    extraction: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionResult,
  ) => void;
  onVerify?: (
    verification: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveVerificationResult,
    result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportResult,
    extraction: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionResult,
  ) => void;
  onExtract?: (
    entryExtraction: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveExtractionResult,
    result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportResult,
    extraction: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionResult,
  ) => void;
  onImportedArtifactDownload?: (
    artifact: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveArtifact,
    entryExtraction: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveExtractionResult,
  ) => void;
  onImportedDownloadAll?: (
    entryExtraction: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveExtractionResult,
  ) => void;
  onImportedArtifactCopy?: (
    artifact: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveArtifact,
    entryExtraction: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveExtractionResult,
  ) => void;
  onProvenanceCreate?: (
    provenance: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceResult,
  ) => void;
  onProvenanceArtifactDownload?: (
    artifact: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceArtifact,
    provenance: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceResult,
  ) => void;
  onProvenanceDownloadAll?: (
    provenance: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceResult,
  ) => void;
  onProvenanceArtifactCopy?: (
    artifact: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceArtifact,
    provenance: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceResult,
  ) => void;
  onStatus?: (message: string) => void;
}

export async function importRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveFile(
  file: File,
  extraction: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionResult,
  options: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportOptions = {},
): Promise<RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportResult> {
  const maxFileBytes = normalizeMaxFileBytes(options.maxFileBytes);
  const metadata = createFileMetadata(file);
  if (extraction.status !== "extracted") {
    throw new Error(extraction.error ?? "Verified artifact extraction is unavailable.");
  }
  if (file.size > maxFileBytes) {
    return {
      status: "rejected",
      file: metadata,
      archiveBytes: null,
      data: null,
      verification: null,
      entryExtraction: null,
      error: `ZIP file exceeds the ${formatByteSize(maxFileBytes)} import limit.`,
    };
  }

  let data: Uint8Array;
  try {
    data = new Uint8Array(await file.arrayBuffer());
  } catch (error) {
    return {
      status: "read-failed",
      file: metadata,
      archiveBytes: null,
      data: null,
      verification: null,
      entryExtraction: null,
      error: formatErrorMessage(error),
    };
  }

  if (data.byteLength > maxFileBytes) {
    return {
      status: "rejected",
      file: metadata,
      archiveBytes: data.byteLength,
      data,
      verification: null,
      entryExtraction: null,
      error: `Decoded ZIP bytes exceed the ${formatByteSize(maxFileBytes)} import limit.`,
    };
  }

  try {
    const verification =
      await verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveBytes(
        data,
        { expectedExtraction: extraction },
      );
    const verifiedResult: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportResult = {
      status: verification.valid ? "verified" : "verification-failed",
      file: metadata,
      archiveBytes: data.byteLength,
      data,
      verification,
      entryExtraction: null,
      error: null,
    };
    if (!verification.valid) return verifiedResult;

    const entryExtraction =
      await extractRuntimeNavMissionDiagnosticsManifestHudValidationArtifactsFromVerifiedArchiveImport(
        verifiedResult,
        extraction,
      );
    return {
      ...verifiedResult,
      status: entryExtraction.status === "extracted" ? "verified" : "entry-extraction-failed",
      entryExtraction,
      error: entryExtraction.status === "extracted" ? null : entryExtraction.error,
    };
  } catch (error) {
    return {
      status: "verification-error",
      file: metadata,
      archiveBytes: data.byteLength,
      data,
      verification: null,
      entryExtraction: null,
      error: formatErrorMessage(error),
    };
  }
}

export function formatRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportResult(
  result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportResult,
): string {
  if (result.status === "verified" && result.verification && result.entryExtraction) {
    return `Imported ${result.file.filename} · ${formatRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveVerification(
      result.verification,
    )} · ${result.entryExtraction.artifactCount} imported artifacts extracted`;
  }
  if (result.verification) {
    return `Imported ${result.file.filename} · ${formatRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveVerification(
      result.verification,
    )}${result.error ? ` · ${result.error}` : ""}`;
  }
  return `ZIP import ${result.status.replaceAll("-", " ")} · ${result.file.filename} · ${
    result.error ?? "Unknown import failure."
  }`;
}

export function createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportControl(
  extraction: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionResult,
  options: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportControlOptions = {},
): HTMLElement {
  if (extraction.status !== "extracted") {
    throw new Error(extraction.error ?? "Verified artifact extraction is unavailable.");
  }
  const maxFileBytes = normalizeMaxFileBytes(options.maxFileBytes);
  const root = document.createElement("section");
  root.className = "mission-debug-diagnostics-manifest-validation-bundle-extraction-archive-import";
  root.dataset.bundleExtractionArchiveImportStatus = "idle";
  root.dataset.bundleImportedArchiveExtractionStatus = "unavailable";
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
  label.textContent = "Import and verify external artifacts ZIP";
  const preview = document.createElement("small");
  preview.textContent = `Select exact ZIP bytes · max ${formatByteSize(maxFileBytes)}`;
  Object.assign(preview.style, {
    display: "block",
    maxWidth: "100%",
    fontSize: "9px",
    fontWeight: "500",
    lineHeight: "1.25",
    opacity: "0.66",
    overflowWrap: "anywhere",
  });

  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".zip,application/zip,application/x-zip-compressed";
  input.hidden = true;
  input.setAttribute("aria-hidden", "true");

  const details = document.createElement("details");
  details.hidden = true;
  Object.assign(details.style, {
    minWidth: "0",
    padding: "6px 7px",
    border: "1px solid rgba(118, 190, 255, 0.2)",
    borderRadius: "7px",
    background: "rgba(118, 190, 255, 0.035)",
  });

  button.title = preview.textContent;
  button.setAttribute("aria-label", `${label.textContent}. ${preview.textContent}`);
  button.append(label, preview);
  root.append(button, input, details);

  button.addEventListener("click", () => {
    input.value = "";
    input.click();
  });
  input.addEventListener("change", () => {
    const file = input.files?.item(0);
    if (!file) return;
    void handleArchiveImport(file, extraction, root, button, label, preview, details, options);
  });
  return root;
}

async function handleArchiveImport(
  file: File,
  extraction: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionResult,
  root: HTMLElement,
  button: HTMLButtonElement,
  label: HTMLSpanElement,
  preview: HTMLElement,
  details: HTMLDetailsElement,
  options: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportControlOptions,
): Promise<void> {
  button.disabled = true;
  label.textContent = "Importing external artifacts ZIP…";
  preview.textContent = `${file.name || "unnamed-artifacts.zip"} · ${formatByteSize(file.size)} · reading exact bytes`;
  root.dataset.bundleExtractionArchiveImportStatus = "reading";
  root.dataset.bundleImportedArchiveExtractionStatus = "unavailable";
  clearImportVerificationDataset(root);
  clearImportedExtractionDataset(root);
  try {
    const result =
      await importRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveFile(
        file,
        extraction,
        options,
      );
    applyImportDataset(root, result);
    renderImportResult(details, result, options);
    const summary =
      formatRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportResult(
        result,
      );
    preview.textContent = createImportPreview(result);
    button.title = summary;
    button.setAttribute("aria-label", `Import and verify external artifacts ZIP. ${summary}`);
    options.onImport?.(result, extraction);
    if (result.verification) {
      options.onVerify?.(result.verification, result, extraction);
    }
    if (result.entryExtraction?.status === "extracted") {
      options.onExtract?.(result.entryExtraction, result, extraction);
    }
    options.onStatus?.(createStatusMessage(result));
  } catch (error) {
    const message = formatErrorMessage(error);
    root.dataset.bundleExtractionArchiveImportStatus = "verification-error";
    root.dataset.bundleImportedArchiveExtractionStatus = "unavailable";
    preview.textContent = `${file.name || "unnamed-artifacts.zip"} · import error · ${message}`;
    details.hidden = false;
    details.open = true;
    const summary = document.createElement("summary");
    summary.textContent = "External ZIP import error";
    const errorText = document.createElement("small");
    errorText.textContent = message;
    details.replaceChildren(summary, errorText);
    options.onStatus?.(`External verified artifacts ZIP import error: ${message}`);
  } finally {
    button.disabled = false;
    label.textContent = "Import and verify external artifacts ZIP";
  }
}

function renderImportResult(
  details: HTMLDetailsElement,
  result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportResult,
  options: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportControlOptions,
): void {
  details.hidden = false;
  details.open = result.status !== "verified";
  details.style.border = result.status === "verified"
    ? "1px solid rgba(112, 214, 151, 0.28)"
    : "1px solid rgba(255, 93, 93, 0.32)";
  details.style.background = result.status === "verified"
    ? "rgba(112, 214, 151, 0.05)"
    : "rgba(255, 93, 93, 0.055)";

  const summary = document.createElement("summary");
  summary.textContent = createDetailsSummary(result);
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
  const file = document.createElement("small");
  file.textContent = `${result.file.filename} · ${result.file.mimeType} · ${formatByteSize(
    result.archiveBytes ?? result.file.bytes,
  )}`;
  file.style.overflowWrap = "anywhere";
  body.append(file);

  if (result.verification) {
    const checks = document.createElement("small");
    checks.textContent = [
      `archive SHA-256 ${formatBooleanCheck(result.verification.checks.archiveChecksum)}`,
      `EOCD ${formatBooleanCheck(result.verification.checks.eocd)}`,
      `central directory ${formatBooleanCheck(result.verification.checks.centralDirectory)}`,
      `entry order ${formatBooleanCheck(result.verification.checks.entryOrder)}`,
      `${result.verification.checks.localHeadersVerified} local headers`,
      `${result.verification.checks.crc32Verified} CRC-32`,
      `${result.verification.checks.sha256Verified} SHA-256`,
    ].join(" · ");
    checks.style.overflowWrap = "anywhere";
    body.append(checks);
    if (result.verification.archiveChecksumHex) {
      const checksum = document.createElement("code");
      checksum.textContent = result.verification.archiveChecksumHex;
      checksum.style.fontSize = "9px";
      checksum.style.overflowWrap = "anywhere";
      body.append(checksum);
    }
    if (result.verification.issues.length > 0) {
      body.append(createIssueList(result.verification.issues));
    }
  } else if (result.error) {
    const error = document.createElement("small");
    error.textContent = result.error;
    error.style.color = "#ffb4b4";
    error.style.overflowWrap = "anywhere";
    body.append(error);
  }

  if (result.entryExtraction?.status === "extracted") {
    body.append(
      createRuntimeNavMissionDiagnosticsManifestHudValidationImportedArchiveArtifactActions(
        result.entryExtraction,
        {
          onArtifactDownload: options.onImportedArtifactDownload,
          onDownloadAll: options.onImportedDownloadAll,
          onArtifactCopy: options.onImportedArtifactCopy,
          onStatus: options.onStatus,
        },
      ),
      createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceActions(
        result.entryExtraction,
        {
          onCreate: options.onProvenanceCreate,
          onArtifactDownload: options.onProvenanceArtifactDownload,
          onDownloadAll: options.onProvenanceDownloadAll,
          onArtifactCopy: options.onProvenanceArtifactCopy,
          onStatus: options.onStatus,
        },
      ),
    );
  } else if (result.entryExtraction?.error) {
    const extractionError = document.createElement("small");
    extractionError.textContent = `Verified imported entry extraction unavailable: ${result.entryExtraction.error}`;
    extractionError.style.color = "#ffb4b4";
    extractionError.style.overflowWrap = "anywhere";
    body.append(extractionError);
  }

  details.replaceChildren(summary, body);
}

function createIssueList(
  issues: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveVerificationIssue[],
): HTMLElement {
  const list = document.createElement("ul");
  Object.assign(list.style, {
    display: "grid",
    gap: "4px",
    margin: "0",
    padding: "0",
    listStyle: "none",
  });
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

function applyImportDataset(
  root: HTMLElement,
  result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportResult,
): void {
  root.dataset.bundleExtractionArchiveImportStatus = result.status;
  root.dataset.bundleExtractionArchiveImportFilename = result.file.filename;
  root.dataset.bundleExtractionArchiveImportMimeType = result.file.mimeType;
  root.dataset.bundleExtractionArchiveImportFileBytes = String(result.file.bytes);
  if (result.archiveBytes !== null) {
    root.dataset.bundleExtractionArchiveImportBytes = String(result.archiveBytes);
  } else {
    delete root.dataset.bundleExtractionArchiveImportBytes;
  }
  if (result.verification) {
    root.dataset.bundleExtractionArchiveImportVerificationValid = String(result.verification.valid);
    root.dataset.bundleExtractionArchiveImportVerificationIssueCount = String(
      result.verification.issues.length,
    );
    root.dataset.bundleExtractionArchiveImportVerificationEntryCount = String(
      result.verification.entryCount,
    );
    root.dataset.bundleExtractionArchiveImportVerificationCrc32Count = String(
      result.verification.checks.crc32Verified,
    );
    root.dataset.bundleExtractionArchiveImportVerificationSha256Count = String(
      result.verification.checks.sha256Verified,
    );
    if (result.verification.archiveChecksumHex) {
      root.dataset.bundleExtractionArchiveImportVerificationChecksum =
        result.verification.archiveChecksumHex;
    } else {
      delete root.dataset.bundleExtractionArchiveImportVerificationChecksum;
    }
  } else {
    clearImportVerificationDataset(root);
  }

  if (result.entryExtraction) {
    root.dataset.bundleImportedArchiveExtractionStatus = result.entryExtraction.status;
    root.dataset.bundleImportedArchiveExtractionArtifactCount = String(
      result.entryExtraction.artifactCount,
    );
    root.dataset.bundleImportedArchiveExtractionTotalBytes = String(
      result.entryExtraction.totalBytes,
    );
    root.dataset.bundleImportedArchiveExtractionSourceFilename =
      result.entryExtraction.sourceArchiveFilename;
  } else {
    root.dataset.bundleImportedArchiveExtractionStatus = "unavailable";
    clearImportedExtractionDataset(root);
  }
}

function clearImportVerificationDataset(root: HTMLElement): void {
  delete root.dataset.bundleExtractionArchiveImportVerificationValid;
  delete root.dataset.bundleExtractionArchiveImportVerificationIssueCount;
  delete root.dataset.bundleExtractionArchiveImportVerificationEntryCount;
  delete root.dataset.bundleExtractionArchiveImportVerificationCrc32Count;
  delete root.dataset.bundleExtractionArchiveImportVerificationSha256Count;
  delete root.dataset.bundleExtractionArchiveImportVerificationChecksum;
}

function clearImportedExtractionDataset(root: HTMLElement): void {
  delete root.dataset.bundleImportedArchiveExtractionArtifactCount;
  delete root.dataset.bundleImportedArchiveExtractionTotalBytes;
  delete root.dataset.bundleImportedArchiveExtractionSourceFilename;
}

function createImportPreview(
  result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportResult,
): string {
  if (result.status === "verified" && result.verification && result.entryExtraction) {
    return `${result.file.filename} · verified · ${result.entryExtraction.artifactCount} imported artifacts ready · ${formatByteSize(
      result.archiveBytes ?? result.file.bytes,
    )}`;
  }
  if (result.verification) {
    return `${result.file.filename} · ${result.status} · ${result.verification.entryCount} entries · ${formatByteSize(
      result.archiveBytes ?? result.file.bytes,
    )} · ${result.verification.issues.length} issues`;
  }
  return `${result.file.filename} · ${result.status} · ${result.error ?? "unknown failure"}`;
}

function createDetailsSummary(
  result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportResult,
): string {
  if (result.status === "verified" && result.verification && result.entryExtraction) {
    return `External ZIP verification · passed · ${result.entryExtraction.artifactCount} imported artifacts ready`;
  }
  if (result.status === "verification-failed" && result.verification) {
    return `External ZIP verification · failed · ${formatIssueCount(result.verification.issues.length)}`;
  }
  if (result.status === "entry-extraction-failed") {
    return "External ZIP verification · passed · imported entry extraction failed";
  }
  return `External ZIP import · ${result.status.replaceAll("-", " ")}`;
}

function createStatusMessage(
  result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportResult,
): string {
  if (result.status === "verified" && result.verification && result.entryExtraction) {
    return `Imported and verified external artifact ZIP ${result.file.filename}; ${result.entryExtraction.artifactCount} artifacts are ready for inspection and extraction.`;
  }
  if (result.status === "verification-failed" && result.verification) {
    return `External artifact ZIP ${result.file.filename} verification failed with ${formatIssueCount(
      result.verification.issues.length,
    )}.`;
  }
  if (result.status === "entry-extraction-failed") {
    return `External artifact ZIP ${result.file.filename} passed ZIP verification but imported entry extraction failed: ${result.error ?? "Unknown failure."}`;
  }
  return `External artifact ZIP import ${result.status.replaceAll("-", " ")}: ${
    result.error ?? "Unknown failure."
  }`;
}

function createFileMetadata(
  file: File,
): RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportFileMetadata {
  return {
    filename: file.name.trim() || "unnamed-artifacts.zip",
    mimeType: file.type.trim() || "application/octet-stream",
    bytes: file.size,
  };
}

function normalizeMaxFileBytes(maxFileBytes: number | undefined): number {
  if (maxFileBytes === undefined) {
    return RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_EXTRACTION_ARCHIVE_IMPORT_MAX_BYTES;
  }
  if (!Number.isFinite(maxFileBytes) || maxFileBytes <= 0) {
    throw new Error("Verified artifacts ZIP maxFileBytes must be a positive finite number.");
  }
  return Math.floor(maxFileBytes);
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
