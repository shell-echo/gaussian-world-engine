import {
  createRuntimeNavMissionDiagnosticsManifestAuthoringArtifact,
  downloadRuntimeNavMissionDiagnosticsManifestArtifact,
} from "./NavMissionDiagnosticsManifestAuthoring.js";
import type { RuntimeNavMissionDiagnosticsManifestAuthoringArtifact } from "./NavMissionDiagnosticsManifestAuthoring.js";
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
  const artifact = createRuntimeNavMissionDiagnosticsManifestHudDownloadArtifact(input);
  return {
    filename: artifact.filename,
    target: artifact.target,
    operation: artifact.operation,
    jsonPatchCount: artifact.jsonPatch.length,
    bytes: new TextEncoder().encode(artifact.manifestText).byteLength,
  };
}

export function createRuntimeNavMissionDiagnosticsManifestHudDownloadButton(
  options: RuntimeNavMissionDiagnosticsManifestHudDownloadButtonOptions,
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = options.label ?? "Download manifest";
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
