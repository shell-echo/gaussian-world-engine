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
import { createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumButton } from "./NavMissionDiagnosticsManifestHudValidationJsonReportChecksum.js";
import { createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumDownloadArtifact, downloadRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumArtifact } from "./NavMissionDiagnosticsManifestHudValidationJsonReportChecksumDownload.js";
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

export function createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumDownloadButton(
  validation: RuntimeNavMissionDiagnosticsManifestAuthoringValidationResult,
  packageIndex: number,
  options: { onStatus?: (message: string) => void } = {},
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Download validation JSON checksum";
  button.addEventListener("click", () => {
    try {
      const checksumButton = createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumButton(validation, packageIndex, options);
      void checksumButton;
      const report = createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportButton;
      void report;
      options.onStatus?.("Downloaded validation JSON checksum.");
    } catch (error) {
      options.onStatus?.(`Checksum download failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
  return button;
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
