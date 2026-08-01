import {
  createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportArtifact,
} from "./NavMissionDiagnosticsManifestHudValidationJsonReport.js";
import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportArtifact,
} from "./NavMissionDiagnosticsManifestHudValidationJsonReport.js";
import {
  createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumArtifact,
} from "./NavMissionDiagnosticsManifestHudValidationJsonReportChecksum.js";
import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumArtifact,
} from "./NavMissionDiagnosticsManifestHudValidationJsonReportChecksum.js";
import type {
  RuntimeNavMissionDiagnosticsManifestAuthoringValidationResult,
} from "./NavMissionDiagnosticsManifestAuthoringValidation.js";

export interface RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumDownloadArtifact {
  filename: string;
  mimeType: "text/plain;charset=utf-8";
  text: string;
  bytes: number;
  checksum: RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumArtifact;
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumDownloadButtonOptions {
  reportFilename?: string;
  checksumFilename?: string;
  onDownload?: (
    artifact: RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumDownloadArtifact,
    report: RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportArtifact,
  ) => void;
  onStatus?: (message: string) => void;
}

export function createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumDownloadArtifact(
  checksum: RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumArtifact,
): RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumDownloadArtifact {
  return {
    filename: checksum.filename,
    mimeType: checksum.mimeType,
    text: checksum.text,
    bytes: checksum.bytes,
    checksum,
  };
}

export function downloadRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumArtifact(
  artifact: RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumDownloadArtifact,
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

export function createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumDownloadButton(
  validation: RuntimeNavMissionDiagnosticsManifestAuthoringValidationResult,
  packageIndex: number,
  options: RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumDownloadButtonOptions = {},
): HTMLButtonElement {
  const report = createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportArtifact(
    validation,
    packageIndex,
    options.reportFilename,
  );
  const button = document.createElement("button");
  button.type = "button";
  button.style.display = "grid";
  button.style.flex = "1 0 100%";
  button.style.gap = "2px";
  button.style.maxWidth = "100%";
  button.style.textAlign = "left";

  const label = document.createElement("span");
  label.textContent = "Download validation JSON checksum";

  const preview = document.createElement("small");
  preview.style.display = "block";
  preview.style.maxWidth = "100%";
  preview.style.fontSize = "9px";
  preview.style.fontWeight = "500";
  preview.style.lineHeight = "1.25";
  preview.style.opacity = "0.66";
  preview.style.overflowWrap = "anywhere";
  preview.textContent = `SHA-256 · exact ${formatByteSize(report.bytes)} JSON artifact`;

  button.title = preview.textContent;
  button.setAttribute("aria-label", `${label.textContent}. ${preview.textContent}`);
  button.append(label, preview);
  button.addEventListener("click", () => {
    void downloadValidationJsonReportChecksum(report, button, label, preview, options);
  });
  return button;
}

async function downloadValidationJsonReportChecksum(
  report: RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportArtifact,
  button: HTMLButtonElement,
  label: HTMLSpanElement,
  preview: HTMLElement,
  options: RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumDownloadButtonOptions,
): Promise<void> {
  button.disabled = true;
  label.textContent = "Computing validation JSON checksum…";
  try {
    const checksum = await createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumArtifact(
      report,
      options.checksumFilename,
    );
    const artifact = createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumDownloadArtifact(checksum);
    downloadRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumArtifact(artifact);
    button.dataset.checksumAlgorithm = checksum.algorithm;
    button.dataset.checksumHex = checksum.hex;
    preview.textContent = `${checksum.filename} · ${checksum.algorithm} ${checksum.hex}`;
    button.title = preview.textContent;
    button.setAttribute("aria-label", `Download validation JSON checksum. ${preview.textContent}`);
    options.onDownload?.(artifact, report);
    options.onStatus?.(`Downloaded ${checksum.algorithm} checksum ${checksum.filename}.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("Mission diagnostics manifest validation JSON checksum download failed.", error);
    options.onStatus?.(`Validation JSON checksum download failed: ${message}`);
  } finally {
    button.disabled = false;
    label.textContent = "Download validation JSON checksum";
  }
}

function formatByteSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kilobytes = bytes / 1024;
  return `${kilobytes >= 10 ? kilobytes.toFixed(0) : kilobytes.toFixed(1)} KB`;
}
