import {
  createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportArtifact,
} from "./NavMissionDiagnosticsManifestHudValidationJsonReport.js";
import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportArtifact,
} from "./NavMissionDiagnosticsManifestHudValidationJsonReport.js";
import type {
  RuntimeNavMissionDiagnosticsManifestAuthoringValidationResult,
} from "./NavMissionDiagnosticsManifestAuthoringValidation.js";

export interface RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportCopyButtonOptions {
  filename?: string;
  onCopy?: (artifact: RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportArtifact) => void;
  onStatus?: (message: string) => void;
}

export async function copyRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportArtifact(
  artifact: RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportArtifact,
): Promise<void> {
  if (!navigator.clipboard?.writeText) throw new Error("Clipboard API is unavailable.");
  await navigator.clipboard.writeText(artifact.text);
}

export function createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportCopyButton(
  validation: RuntimeNavMissionDiagnosticsManifestAuthoringValidationResult,
  packageIndex: number,
  options: RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportCopyButtonOptions = {},
): HTMLButtonElement {
  const artifact = createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportArtifact(
    validation,
    packageIndex,
    options.filename,
  );
  const button = document.createElement("button");
  button.type = "button";
  button.style.display = "grid";
  button.style.flex = "1 0 100%";
  button.style.gap = "2px";
  button.style.maxWidth = "100%";
  button.style.textAlign = "left";

  const label = document.createElement("span");
  label.textContent = "Copy validation JSON";

  const preview = document.createElement("small");
  preview.style.display = "block";
  preview.style.maxWidth = "100%";
  preview.style.fontSize = "9px";
  preview.style.fontWeight = "500";
  preview.style.lineHeight = "1.25";
  preview.style.opacity = "0.66";
  preview.style.overflowWrap = "anywhere";
  preview.textContent = `${artifact.filename} · schema v${artifact.document.schemaVersion} · ${formatIssueCount(artifact.issueCount)} · ${formatByteSize(artifact.bytes)}`;

  button.title = preview.textContent;
  button.setAttribute("aria-label", `${label.textContent}. ${preview.textContent}`);
  button.append(label, preview);
  button.addEventListener("click", () => {
    void copyRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportArtifact(artifact)
      .then(() => {
        options.onCopy?.(artifact);
        options.onStatus?.(`Copied ${artifact.filename} with ${formatIssueCount(artifact.issueCount)}.`);
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        console.warn("Mission diagnostics manifest validation JSON report copy failed.", error);
        options.onStatus?.(`Validation JSON report copy failed: ${message}`);
      });
  });
  return button;
}

function formatIssueCount(count: number): string {
  return count === 0 ? "no validation issues" : `${count} validation issue${count === 1 ? "" : "s"}`;
}

function formatByteSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kilobytes = bytes / 1024;
  return `${kilobytes >= 10 ? kilobytes.toFixed(0) : kilobytes.toFixed(1)} KB`;
}
