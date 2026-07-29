import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumArtifact,
} from "./NavMissionDiagnosticsManifestHudValidationJsonReportChecksum.js";

export interface RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumDownloadArtifact {
  filename: string;
  mimeType: "text/plain;charset=utf-8";
  text: string;
  bytes: number;
  checksum: RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumArtifact;
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
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = artifact.filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
