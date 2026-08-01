import {
  createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionActions,
  extractRuntimeNavMissionDiagnosticsManifestHudValidationArtifactsFromBundleText,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtraction.js";
import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionResult,
  RuntimeNavMissionDiagnosticsManifestHudValidationExtractedArtifact,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtraction.js";
import {
  formatRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleVerification,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleVerification.js";
import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleVerificationIssue,
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleVerificationResult,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleVerification.js";

export const RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_IMPORT_MAX_BYTES =
  16 * 1024 * 1024;

export type RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportStatus =
  | "verified"
  | "verification-failed"
  | "rejected"
  | "read-failed"
  | "verification-error";

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportFileMetadata {
  filename: string;
  mimeType: string;
  bytes: number;
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportResult {
  status: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportStatus;
  file: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportFileMetadata;
  textBytes: number | null;
  verification: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleVerificationResult | null;
  extraction: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionResult | null;
  error: string | null;
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportOptions {
  maxFileBytes?: number;
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportControlOptions
  extends RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportOptions {
  onImport?: (result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportResult) => void;
  onExtract?: (
    extraction: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionResult,
    result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportResult,
  ) => void;
  onArtifactDownload?: (
    artifact: RuntimeNavMissionDiagnosticsManifestHudValidationExtractedArtifact,
    extraction: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionResult,
  ) => void;
  onDownloadAll?: (
    extraction: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionResult,
  ) => void;
  onStatus?: (message: string) => void;
}

export async function importRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleFile(
  file: File,
  options: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportOptions = {},
): Promise<RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportResult> {
  const maxFileBytes = normalizeMaxFileBytes(options.maxFileBytes);
  const metadata = createFileMetadata(file);
  if (file.size > maxFileBytes) {
    return {
      status: "rejected",
      file: metadata,
      textBytes: null,
      verification: null,
      extraction: null,
      error: `Bundle file exceeds the ${formatByteSize(maxFileBytes)} import limit.`,
    };
  }

  let text: string;
  try {
    text = await file.text();
  } catch (error) {
    return {
      status: "read-failed",
      file: metadata,
      textBytes: null,
      verification: null,
      extraction: null,
      error: formatErrorMessage(error),
    };
  }

  const textBytes = new TextEncoder().encode(text).byteLength;
  if (textBytes > maxFileBytes) {
    return {
      status: "rejected",
      file: metadata,
      textBytes,
      verification: null,
      extraction: null,
      error: `Decoded bundle text exceeds the ${formatByteSize(maxFileBytes)} import limit.`,
    };
  }

  try {
    const extraction =
      await extractRuntimeNavMissionDiagnosticsManifestHudValidationArtifactsFromBundleText(text);
    const verification = extraction.verification;
    const status: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportStatus =
      extraction.status === "extracted"
        ? "verified"
        : extraction.status === "verification-failed"
          ? "verification-failed"
          : "verification-error";
    return {
      status,
      file: metadata,
      textBytes,
      verification,
      extraction,
      error: status === "verification-error" ? extraction.error : null,
    };
  } catch (error) {
    return {
      status: "verification-error",
      file: metadata,
      textBytes,
      verification: null,
      extraction: null,
      error: formatErrorMessage(error),
    };
  }
}

export function formatRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportResult(
  result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportResult,
): string {
  if (result.status === "verified" && result.verification && result.extraction) {
    return `Imported ${result.file.filename} · ${formatRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleVerification(
      result.verification,
    )} · ${result.extraction.artifactCount} artifacts ready for extraction`;
  }
  if (result.status === "verification-failed" && result.verification) {
    return `Imported ${result.file.filename} · verification failed · ${formatIssueCount(
      result.verification.issues.length,
    )}`;
  }
  return `Import ${result.status.replaceAll("-", " ")} · ${result.file.filename} · ${
    result.error ?? "Unknown import failure."
  }`;
}

export function createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportControl(
  options: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportControlOptions = {},
): HTMLElement {
  const maxFileBytes = normalizeMaxFileBytes(options.maxFileBytes);
  const root = document.createElement("section");
  root.className = "mission-debug-diagnostics-manifest-validation-bundle-import";
  Object.assign(root.style, {
    display: "grid",
    flex: "1 0 100%",
    gap: "5px",
    minWidth: "0",
  });

  const button = document.createElement("button");
  button.type = "button";
  button.style.display = "grid";
  button.style.width = "100%";
  button.style.gap = "2px";
  button.style.maxWidth = "100%";
  button.style.textAlign = "left";

  const label = document.createElement("span");
  label.textContent = "Import and verify validation artifact bundle";

  const preview = document.createElement("small");
  Object.assign(preview.style, {
    display: "block",
    maxWidth: "100%",
    fontSize: "9px",
    fontWeight: "500",
    lineHeight: "1.25",
    opacity: "0.66",
    overflowWrap: "anywhere",
  });
  preview.textContent = `Select a bundle descriptor JSON file · max ${formatByteSize(maxFileBytes)}`;

  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json,application/json,text/json";
  input.hidden = true;
  input.setAttribute("aria-hidden", "true");

  const details = document.createElement("details");
  details.hidden = true;
  Object.assign(details.style, {
    minWidth: "0",
    padding: "7px 8px",
    border: "1px solid rgba(118, 190, 255, 0.2)",
    borderRadius: "8px",
    background: "rgba(118, 190, 255, 0.035)",
    color: "rgba(255, 255, 255, 0.76)",
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
    void handleBundleImport(file, root, button, label, preview, details, options);
  });

  return root;
}

async function handleBundleImport(
  file: File,
  root: HTMLElement,
  button: HTMLButtonElement,
  label: HTMLSpanElement,
  preview: HTMLElement,
  details: HTMLDetailsElement,
  options: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportControlOptions,
): Promise<void> {
  button.disabled = true;
  label.textContent = "Importing validation artifact bundle…";
  preview.textContent = `${file.name || "unnamed-bundle.json"} · ${formatByteSize(file.size)} · reading`;
  try {
    const result = await importRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleFile(file, options);
    applyImportDataset(root, result);
    renderImportResult(details, result, options);
    const summary = formatRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportResult(result);
    preview.textContent = createImportPreview(result);
    button.title = summary;
    button.setAttribute("aria-label", `Import and verify validation artifact bundle. ${summary}`);
    options.onImport?.(result);
    if (result.extraction?.status === "extracted") {
      options.onExtract?.(result.extraction, result);
    }
    options.onStatus?.(createImportStatusMessage(result));
  } finally {
    button.disabled = false;
    label.textContent = "Import and verify validation artifact bundle";
  }
}

function renderImportResult(
  details: HTMLDetailsElement,
  result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportResult,
  options: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportControlOptions,
): void {
  details.hidden = false;
  details.open = result.status !== "verified";
  details.style.border = createResultBorder(result);
  details.style.background = createResultBackground(result);

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
    gap: "6px",
    marginTop: "7px",
  });

  const file = document.createElement("small");
  file.textContent = `${result.file.filename} · ${result.file.mimeType} · ${formatByteSize(
    result.textBytes ?? result.file.bytes,
  )}`;
  file.style.overflowWrap = "anywhere";
  body.append(file);

  if (result.verification) {
    body.append(createVerificationChecks(result.verification));
    if (result.verification.issues.length > 0) {
      body.append(createVerificationIssueList(result.verification.issues));
    }
  } else if (result.error) {
    const error = document.createElement("small");
    error.textContent = result.error;
    error.style.color = "#ffb4b4";
    error.style.overflowWrap = "anywhere";
    body.append(error);
  }

  if (result.extraction?.status === "extracted") {
    body.append(
      createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionActions(
        result.extraction,
        {
          onArtifactDownload: options.onArtifactDownload,
          onDownloadAll: options.onDownloadAll,
          onStatus: options.onStatus,
        },
      ),
    );
  } else if (result.extraction?.error && result.status === "verification-error") {
    const extractionError = document.createElement("small");
    extractionError.textContent = `Artifact extraction unavailable: ${result.extraction.error}`;
    extractionError.style.color = "#ffb4b4";
    extractionError.style.overflowWrap = "anywhere";
    body.append(extractionError);
  }

  details.replaceChildren(summary, body);
}

function createVerificationChecks(
  verification: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleVerificationResult,
): HTMLElement {
  const checks = document.createElement("small");
  checks.textContent = [
    `canonical JSON ${formatBooleanCheck(verification.checks.canonicalBundleText)}`,
    `artifact order ${formatBooleanCheck(verification.checks.artifactOrder)}`,
    `${verification.checks.byteSizesVerified} byte sizes`,
    `${verification.checks.checksumsVerified} SHA-256 checksums`,
    `${verification.checks.checksumRelationshipsVerified} checksum relationship`,
    `JSON report metadata ${formatBooleanCheck(verification.checks.jsonReportMetadataVerified)}`,
  ].join(" · ");
  checks.style.overflowWrap = "anywhere";
  return checks;
}

function createVerificationIssueList(
  issues: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleVerificationIssue[],
): HTMLElement {
  const list = document.createElement("ul");
  Object.assign(list.style, {
    display: "grid",
    gap: "5px",
    margin: "0",
    padding: "0",
    listStyle: "none",
  });
  for (const issue of issues) {
    const item = document.createElement("li");
    Object.assign(item.style, {
      display: "grid",
      gap: "2px",
      padding: "6px 7px",
      border: "1px solid rgba(255, 93, 93, 0.28)",
      borderRadius: "7px",
      background: "rgba(255, 93, 93, 0.07)",
    });

    const heading = document.createElement("span");
    heading.style.display = "flex";
    heading.style.flexWrap = "wrap";
    heading.style.gap = "3px 6px";

    const code = document.createElement("b");
    code.textContent = issue.code;
    code.style.fontSize = "9px";

    const path = document.createElement("code");
    path.textContent = issue.path;
    path.style.fontSize = "9px";
    path.style.color = "rgba(255, 255, 255, 0.48)";
    path.style.overflowWrap = "anywhere";

    const message = document.createElement("small");
    message.textContent = issue.message;
    message.style.fontSize = "9px";
    message.style.lineHeight = "1.35";
    message.style.overflowWrap = "anywhere";

    heading.append(code, path);
    item.append(heading, message);
    list.append(item);
  }
  return list;
}

function applyImportDataset(
  root: HTMLElement,
  result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportResult,
): void {
  root.dataset.bundleImportStatus = result.status;
  root.dataset.bundleImportFilename = result.file.filename;
  root.dataset.bundleImportBytes = String(result.textBytes ?? result.file.bytes);
  if (result.verification) {
    root.dataset.bundleVerificationValid = String(result.verification.valid);
    root.dataset.bundleVerificationIssueCount = String(result.verification.issues.length);
    root.dataset.bundleVerificationChecksumCount = String(result.verification.checks.checksumsVerified);
    root.dataset.bundleVerificationStatus = result.verification.bundleStatus ?? "unknown";
  } else {
    delete root.dataset.bundleVerificationValid;
    delete root.dataset.bundleVerificationIssueCount;
    delete root.dataset.bundleVerificationChecksumCount;
    delete root.dataset.bundleVerificationStatus;
  }
  if (result.extraction) {
    root.dataset.bundleExtractionStatus = result.extraction.status;
    root.dataset.bundleExtractionArtifactCount = String(result.extraction.artifactCount);
    root.dataset.bundleExtractionTotalBytes = String(result.extraction.totalBytes);
  } else {
    delete root.dataset.bundleExtractionStatus;
    delete root.dataset.bundleExtractionArtifactCount;
    delete root.dataset.bundleExtractionTotalBytes;
  }
}

function createImportPreview(
  result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportResult,
): string {
  if (result.verification) {
    const status = result.verification.bundleStatus ?? "unknown-status";
    const extraction =
      result.extraction?.status === "extracted"
        ? ` · ${result.extraction.artifactCount} artifacts ready`
        : "";
    return `${result.file.filename} · ${result.status} · ${status} · ${result.verification.artifactCount} artifacts${extraction} · ${formatByteSize(
      result.textBytes ?? result.file.bytes,
    )}`;
  }
  return `${result.file.filename} · ${result.status} · ${result.error ?? "unknown failure"}`;
}

function createImportStatusMessage(
  result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportResult,
): string {
  if (result.status === "verified" && result.verification && result.extraction) {
    return `Imported and verified validation artifact bundle ${result.file.filename}; ${result.extraction.artifactCount} artifacts are ready for extraction.`;
  }
  if (result.status === "verification-failed" && result.verification) {
    return `Imported ${result.file.filename}; validation artifact bundle verification failed with ${formatIssueCount(
      result.verification.issues.length,
    )}.`;
  }
  return `Validation artifact bundle import ${result.status.replaceAll("-", " ")}: ${
    result.error ?? "Unknown failure."
  }`;
}

function createDetailsSummary(
  result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportResult,
): string {
  if (result.status === "verified" && result.verification && result.extraction) {
    return `Imported bundle verification · passed · ${result.extraction.artifactCount} artifacts ready`;
  }
  if (result.status === "verification-failed" && result.verification) {
    return `Imported bundle verification · failed · ${formatIssueCount(result.verification.issues.length)}`;
  }
  return `Imported bundle · ${result.status.replaceAll("-", " ")}`;
}

function createFileMetadata(
  file: File,
): RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportFileMetadata {
  return {
    filename: file.name.trim() || "unnamed-bundle.json",
    mimeType: file.type.trim() || "application/octet-stream",
    bytes: file.size,
  };
}

function normalizeMaxFileBytes(maxFileBytes: number | undefined): number {
  if (maxFileBytes === undefined) {
    return RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_IMPORT_MAX_BYTES;
  }
  if (!Number.isFinite(maxFileBytes) || maxFileBytes <= 0) {
    throw new Error("Validation artifact bundle maxFileBytes must be a positive finite number.");
  }
  return Math.floor(maxFileBytes);
}

function formatErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function formatIssueCount(count: number): string {
  return `${count} verification issue${count === 1 ? "" : "s"}`;
}

function formatBooleanCheck(value: boolean): string {
  return value ? "verified" : "failed";
}

function createResultBorder(
  result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportResult,
): string {
  return result.status === "verified"
    ? "1px solid rgba(112, 214, 151, 0.28)"
    : "1px solid rgba(255, 93, 93, 0.32)";
}

function createResultBackground(
  result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportResult,
): string {
  return result.status === "verified"
    ? "rgba(112, 214, 151, 0.05)"
    : "rgba(255, 93, 93, 0.055)";
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
