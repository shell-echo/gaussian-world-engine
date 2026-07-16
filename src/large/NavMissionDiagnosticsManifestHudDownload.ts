import {
  createRuntimeNavMissionDiagnosticsManifestAuthoringArtifact,
  downloadRuntimeNavMissionDiagnosticsManifestArtifact,
} from "./NavMissionDiagnosticsManifestAuthoring.js";
import type { RuntimeNavMissionDiagnosticsManifestAuthoringArtifact } from "./NavMissionDiagnosticsManifestAuthoring.js";
import {
  formatRuntimeNavMissionDiagnosticsManifestAuthoringValidation,
  validateRuntimeNavMissionDiagnosticsManifestAuthoringInput,
} from "./NavMissionDiagnosticsManifestAuthoringValidation.js";
import type { RuntimeNavMissionDiagnosticsManifestAuthoringValidationResult } from "./NavMissionDiagnosticsManifestAuthoringValidation.js";
import { createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportButton } from "./NavMissionDiagnosticsManifestHudValidationJsonReport.js";
import { createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportCopyButton } from "./NavMissionDiagnosticsManifestHudValidationJsonReportCopy.js";
import {
  createRuntimeNavMissionDiagnosticsManifestHudValidationDetails,
  createRuntimeNavMissionDiagnosticsManifestHudValidationReportFilename,
} from "./NavMissionDiagnosticsManifestHudValidationDetails.js";
import type { RuntimeNavMissionDiagnosticsSeverityPolicy } from "./NavMissionPackageLoader.js";

export interface RuntimeNavMissionDiagnosticsManifestHudDownloadInput {
  sourceManifestText: string;
  packageIndex: number;
  policy: RuntimeNavMissionDiagnosticsSeverityPolicy | null;
}

export interface RuntimeNavMissionDiagnosticsManifestHudDownloadButtonOptions
  extends RuntimeNavMissionDiagnosticsManifestHudDownloadInput {
  label?: string;
  onArtifact?: (artifact: RuntimeNavMissionDiagnosticsManifestAuthoringArtifact) => void;
  onStatus?: (message: string) => void;
}

export interface RuntimeNavMissionDiagnosticsManifestHudDownloadSummary {
  filename: string;
  target: string;
  operation: RuntimeNavMissionDiagnosticsManifestAuthoringArtifact["operation"];
  jsonPatchCount: number;
  bytes: number;
  validation: RuntimeNavMissionDiagnosticsManifestAuthoringValidationResult;
}

export function createRuntimeNavMissionDiagnosticsManifestHudDownloadArtifact(
  input: RuntimeNavMissionDiagnosticsManifestHudDownloadInput,
): RuntimeNavMissionDiagnosticsManifestAuthoringArtifact {
  return createRuntimeNavMissionDiagnosticsManifestAuthoringArtifact({
    sourceManifestText: input.sourceManifestText,
    packageIndex: input.packageIndex,
    policy: input.policy,
  });
}

export function createRuntimeNavMissionDiagnosticsManifestHudDownloadSummary(
  input: RuntimeNavMissionDiagnosticsManifestHudDownloadInput,
): RuntimeNavMissionDiagnosticsManifestHudDownloadSummary {
  const validation = validateRuntimeNavMissionDiagnosticsManifestAuthoringInput(input);
  if (!validation.valid) throw new Error(formatRuntimeNavMissionDiagnosticsManifestAuthoringValidation(validation));
  const artifact = createRuntimeNavMissionDiagnosticsManifestHudDownloadArtifact(input);
  return {
    filename: artifact.filename,
    target: artifact.target,
    operation: artifact.operation,
    jsonPatchCount: artifact.jsonPatch.length,
    bytes: new TextEncoder().encode(artifact.manifestText).byteLength,
    validation,
  };
}

export function formatRuntimeNavMissionDiagnosticsManifestHudDownloadSummary(
  summary: RuntimeNavMissionDiagnosticsManifestHudDownloadSummary,
): string {
  const patchLabel = `${summary.jsonPatchCount} JSON patch${summary.jsonPatchCount === 1 ? "" : "es"}`;
  const validationLabel = formatRuntimeNavMissionDiagnosticsManifestAuthoringValidation(summary.validation);
  return `${summary.filename} · ${summary.target} · ${summary.operation} · ${patchLabel} · ${formatByteSize(summary.bytes)} · ${validationLabel}`;
}

export function createRuntimeNavMissionDiagnosticsManifestHudDownloadButton(
  options: RuntimeNavMissionDiagnosticsManifestHudDownloadButtonOptions,
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.style.display = "grid";
  button.style.gap = "2px";
  button.style.maxWidth = "100%";
  button.style.textAlign = "left";

  const label = document.createElement("span");
  label.textContent = options.label ?? "Download manifest";

  const preview = document.createElement("small");
  preview.style.display = "block";
  preview.style.maxWidth = "240px";
  preview.style.fontSize = "9px";
  preview.style.fontWeight = "500";
  preview.style.lineHeight = "1.25";
  preview.style.opacity = "0.66";
  preview.style.overflowWrap = "anywhere";

  const validation = validateRuntimeNavMissionDiagnosticsManifestAuthoringInput(options);
  const validationDetails = createRuntimeNavMissionDiagnosticsManifestHudValidationDetails(validation, {
    onStatus: options.onStatus,
    reportFilename: createRuntimeNavMissionDiagnosticsManifestHudValidationReportFilename(options.packageIndex),
  });
  const validationJsonReportCopyButton = createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportCopyButton(
    validation,
    options.packageIndex,
    { onStatus: options.onStatus },
  );
  const validationJsonReportDownloadButton = createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportButton(
    validation,
    options.packageIndex,
    { onStatus: options.onStatus },
  );
  if (!validation.valid) {
    const validationText = formatRuntimeNavMissionDiagnosticsManifestAuthoringValidation(validation);
    preview.textContent = validationText;
    button.title = validationText;
    button.setAttribute("aria-label", `${label.textContent}. ${validationText}`);
  } else {
    try {
      const summary = createRuntimeNavMissionDiagnosticsManifestHudDownloadSummary(options);
      const summaryText = formatRuntimeNavMissionDiagnosticsManifestHudDownloadSummary(summary);
      preview.textContent = summaryText;
      button.title = summaryText;
      button.setAttribute("aria-label", `${label.textContent}. ${summaryText}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const summaryText = `Preview unavailable · ${message}`;
      preview.textContent = summaryText;
      button.title = summaryText;
      button.setAttribute("aria-label", `${label.textContent}. ${summaryText}`);
    }
  }

  button.append(label, preview);
  queueMicrotask(() => {
    const actions = button.parentElement;
    if (!button.isConnected || !actions) return;
    for (const element of [validationDetails, validationJsonReportCopyButton, validationJsonReportDownloadButton]) {
      if (!element.isConnected) actions.append(element);
    }
  });
  button.addEventListener("click", () => {
    try {
      const artifact = createRuntimeNavMissionDiagnosticsManifestHudDownloadArtifact(options);
      downloadRuntimeNavMissionDiagnosticsManifestArtifact(artifact);
      options.onArtifact?.(artifact);
      options.onStatus?.(`Downloaded ${artifact.filename} for ${artifact.target}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn("Mission diagnostics manifest download failed.", error);
      options.onStatus?.(`Download failed: ${message}`);
    }
  });
  return button;
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
