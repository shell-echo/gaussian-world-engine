import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleEntryKind,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundle.js";
import {
  RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_ORDER,
  verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleText,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleVerification.js";
import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleVerificationResult,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleVerification.js";

export type RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionStatus =
  | "extracted"
  | "verification-failed"
  | "document-unavailable"
  | "artifact-set-invalid";

export interface RuntimeNavMissionDiagnosticsManifestHudValidationExtractedArtifact {
  kind: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleEntryKind;
  filename: string;
  mimeType: string;
  bytes: number;
  checksumHex: string;
  text: string;
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionResult {
  status: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionStatus;
  verification: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleVerificationResult;
  bundleStatus: string | null;
  artifactCount: number;
  totalBytes: number;
  artifacts: RuntimeNavMissionDiagnosticsManifestHudValidationExtractedArtifact[];
  error: string | null;
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionActionsOptions {
  onArtifactDownload?: (
    artifact: RuntimeNavMissionDiagnosticsManifestHudValidationExtractedArtifact,
    extraction: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionResult,
  ) => void;
  onDownloadAll?: (
    extraction: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionResult,
  ) => void;
  onStatus?: (message: string) => void;
}

export async function extractRuntimeNavMissionDiagnosticsManifestHudValidationArtifactsFromBundleText(
  text: string,
): Promise<RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionResult> {
  const verification =
    await verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleText(text);
  return extractRuntimeNavMissionDiagnosticsManifestHudValidationArtifactsFromVerification(
    verification,
  );
}

export function extractRuntimeNavMissionDiagnosticsManifestHudValidationArtifactsFromVerification(
  verification: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleVerificationResult,
): RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionResult {
  if (!verification.valid || verification.issues.length > 0) {
    return createExtractionFailure(
      "verification-failed",
      verification,
      "Validation artifact bundle must pass verification before artifacts can be extracted.",
    );
  }
  if (!verification.document) {
    return createExtractionFailure(
      "document-unavailable",
      verification,
      "Verified validation artifact bundle document is unavailable.",
    );
  }

  const document = verification.document;
  if (
    document.artifactOrder.length !==
      RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_ORDER.length ||
    document.artifacts.length !==
      RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_ORDER.length
  ) {
    return createExtractionFailure(
      "artifact-set-invalid",
      verification,
      "Verified validation artifact bundle must contain exactly three ordered artifacts.",
    );
  }

  const artifacts: RuntimeNavMissionDiagnosticsManifestHudValidationExtractedArtifact[] = [];
  let totalBytes = 0;
  for (
    let index = 0;
    index < RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_ORDER.length;
    index += 1
  ) {
    const expectedKind =
      RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_ORDER[index];
    const declaredKind = document.artifactOrder[index];
    const entry = document.artifacts[index];
    if (!expectedKind || declaredKind !== expectedKind || !entry || entry.kind !== expectedKind) {
      return createExtractionFailure(
        "artifact-set-invalid",
        verification,
        `Verified validation artifact bundle artifact ${index} does not match the required extraction order.`,
      );
    }

    const actualBytes = new TextEncoder().encode(entry.text).byteLength;
    if (actualBytes !== entry.bytes) {
      return createExtractionFailure(
        "artifact-set-invalid",
        verification,
        `Verified artifact ${entry.filename} no longer matches its declared UTF-8 byte size.`,
      );
    }

    artifacts.push({
      kind: entry.kind,
      filename: entry.filename,
      mimeType: entry.mimeType,
      bytes: entry.bytes,
      checksumHex: entry.checksum.hex,
      text: entry.text,
    });
    totalBytes += entry.bytes;
  }

  return {
    status: "extracted",
    verification,
    bundleStatus: verification.bundleStatus,
    artifactCount: artifacts.length,
    totalBytes,
    artifacts,
    error: null,
  };
}

export function downloadRuntimeNavMissionDiagnosticsManifestHudValidationExtractedArtifact(
  artifact: RuntimeNavMissionDiagnosticsManifestHudValidationExtractedArtifact,
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

export function downloadRuntimeNavMissionDiagnosticsManifestHudValidationExtractedArtifacts(
  extraction: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionResult,
): number {
  assertExtracted(extraction);
  for (const artifact of extraction.artifacts) {
    downloadRuntimeNavMissionDiagnosticsManifestHudValidationExtractedArtifact(artifact);
  }
  return extraction.artifacts.length;
}

export function createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionActions(
  extraction: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionResult,
  options: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionActionsOptions = {},
): HTMLElement {
  assertExtracted(extraction);
  const root = document.createElement("section");
  root.className = "mission-debug-diagnostics-manifest-validation-bundle-extraction";
  root.dataset.bundleExtractionStatus = extraction.status;
  root.dataset.bundleExtractionArtifactCount = String(extraction.artifactCount);
  root.dataset.bundleExtractionTotalBytes = String(extraction.totalBytes);
  Object.assign(root.style, {
    display: "grid",
    gap: "5px",
    minWidth: "0",
    paddingTop: "2px",
  });

  const heading = document.createElement("small");
  heading.textContent = `Verified artifact extraction · ${extraction.artifactCount} artifacts · ${formatByteSize(
    extraction.totalBytes,
  )}`;
  Object.assign(heading.style, {
    fontWeight: "750",
    lineHeight: "1.35",
    overflowWrap: "anywhere",
  });

  const downloadAll = createExtractionButton(
    "Download all verified artifacts",
    `${extraction.artifactCount} artifacts · fixed bundle order · ${formatByteSize(extraction.totalBytes)}`,
  );
  downloadAll.dataset.bundleExtractionAction = "download-all";
  downloadAll.addEventListener("click", () => {
    try {
      const count =
        downloadRuntimeNavMissionDiagnosticsManifestHudValidationExtractedArtifacts(extraction);
      options.onDownloadAll?.(extraction);
      options.onStatus?.(`Downloaded ${count} verified validation artifacts.`);
    } catch (error) {
      const message = formatErrorMessage(error);
      console.warn("Verified validation artifact bundle download-all failed.", error);
      options.onStatus?.(`Verified artifact download failed: ${message}`);
    }
  });

  const artifacts = document.createElement("div");
  Object.assign(artifacts.style, {
    display: "grid",
    gap: "4px",
  });
  for (const artifact of extraction.artifacts) {
    const button = createExtractionButton(
      createArtifactActionLabel(artifact.kind),
      `${artifact.filename} · ${formatByteSize(artifact.bytes)} · SHA-256 ${artifact.checksumHex.slice(0, 12)}…`,
    );
    button.dataset.bundleExtractionAction = "download-artifact";
    button.dataset.bundleExtractionArtifactKind = artifact.kind;
    button.dataset.bundleExtractionArtifactFilename = artifact.filename;
    button.dataset.bundleExtractionArtifactBytes = String(artifact.bytes);
    button.dataset.bundleExtractionArtifactChecksum = artifact.checksumHex;
    button.addEventListener("click", () => {
      try {
        downloadRuntimeNavMissionDiagnosticsManifestHudValidationExtractedArtifact(artifact);
        options.onArtifactDownload?.(artifact, extraction);
        options.onStatus?.(`Downloaded verified artifact ${artifact.filename}.`);
      } catch (error) {
        const message = formatErrorMessage(error);
        console.warn("Verified validation artifact download failed.", error);
        options.onStatus?.(`Verified artifact download failed: ${message}`);
      }
    });
    artifacts.append(button);
  }

  root.append(heading, downloadAll, artifacts);
  return root;
}

function createExtractionFailure(
  status: Exclude<
    RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionStatus,
    "extracted"
  >,
  verification: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleVerificationResult,
  error: string,
): RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionResult {
  return {
    status,
    verification,
    bundleStatus: verification.bundleStatus,
    artifactCount: 0,
    totalBytes: 0,
    artifacts: [],
    error,
  };
}

function assertExtracted(
  extraction: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionResult,
): asserts extraction is RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionResult & {
  status: "extracted";
} {
  if (extraction.status !== "extracted") {
    throw new Error(extraction.error ?? "Validation artifact bundle extraction is unavailable.");
  }
}

function createExtractionButton(labelText: string, previewText: string): HTMLButtonElement {
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
  label.textContent = labelText;

  const preview = document.createElement("small");
  preview.textContent = previewText;
  Object.assign(preview.style, {
    display: "block",
    maxWidth: "100%",
    fontSize: "9px",
    fontWeight: "500",
    lineHeight: "1.25",
    opacity: "0.66",
    overflowWrap: "anywhere",
  });

  button.title = previewText;
  button.setAttribute("aria-label", `${labelText}. ${previewText}`);
  button.append(label, preview);
  return button;
}

function createArtifactActionLabel(
  kind: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleEntryKind,
): string {
  switch (kind) {
    case "validation-report-text":
      return "Download verified validation text report";
    case "validation-report-json":
      return "Download verified validation JSON report";
    case "validation-report-json-sha256":
      return "Download verified validation JSON SHA-256";
  }
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
