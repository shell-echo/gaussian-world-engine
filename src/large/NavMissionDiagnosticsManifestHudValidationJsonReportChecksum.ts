import {
  createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportArtifact,
} from "./NavMissionDiagnosticsManifestHudValidationJsonReport.js";
import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportArtifact,
} from "./NavMissionDiagnosticsManifestHudValidationJsonReport.js";
import type {
  RuntimeNavMissionDiagnosticsManifestAuthoringValidationResult,
} from "./NavMissionDiagnosticsManifestAuthoringValidation.js";

export const RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_JSON_REPORT_CHECKSUM_ALGORITHM = "SHA-256" as const;

const DEFAULT_VALIDATION_JSON_REPORT_CHECKSUM_FILENAME =
  "mission-diagnostics-policy-manifest.validation-report.json.sha256";

export interface RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumArtifact {
  filename: string;
  mimeType: "text/plain;charset=utf-8";
  algorithm: typeof RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_JSON_REPORT_CHECKSUM_ALGORITHM;
  hex: string;
  reportFilename: string;
  reportBytes: number;
  text: string;
  bytes: number;
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumButtonOptions {
  reportFilename?: string;
  checksumFilename?: string;
  onCopy?: (
    checksum: RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumArtifact,
    report: RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportArtifact,
  ) => void;
  onStatus?: (message: string) => void;
}

export function createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumFilename(
  reportFilename: string,
): string {
  return normalizeChecksumFilename(`${reportFilename}.sha256`);
}

export async function createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumArtifact(
  report: RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportArtifact,
  filename = createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumFilename(report.filename),
): Promise<RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumArtifact> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle?.digest) throw new Error("Web Crypto SHA-256 is unavailable.");

  const reportBytes = new TextEncoder().encode(report.text);
  const digest = await subtle.digest(
    RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_JSON_REPORT_CHECKSUM_ALGORITHM,
    reportBytes,
  );
  const hex = formatHexDigest(digest);
  const text = `${hex}  ${report.filename}\n`;

  return {
    filename: normalizeChecksumFilename(filename),
    mimeType: "text/plain;charset=utf-8",
    algorithm: RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_JSON_REPORT_CHECKSUM_ALGORITHM,
    hex,
    reportFilename: report.filename,
    reportBytes: reportBytes.byteLength,
    text,
    bytes: new TextEncoder().encode(text).byteLength,
  };
}

export async function copyRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumArtifact(
  checksum: RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumArtifact,
): Promise<void> {
  if (!navigator.clipboard?.writeText) throw new Error("Clipboard API is unavailable.");
  await navigator.clipboard.writeText(checksum.text);
}

export function createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumButton(
  validation: RuntimeNavMissionDiagnosticsManifestAuthoringValidationResult,
  packageIndex: number,
  options: RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumButtonOptions = {},
): HTMLButtonElement {
  const report = createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportArtifact(
    validation,
    packageIndex,
    options.reportFilename,
  );
  const checksumFilename = options.checksumFilename
    ? normalizeChecksumFilename(options.checksumFilename)
    : createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumFilename(report.filename);

  const button = document.createElement("button");
  button.type = "button";
  button.style.display = "grid";
  button.style.flex = "1 0 100%";
  button.style.gap = "2px";
  button.style.maxWidth = "100%";
  button.style.textAlign = "left";

  const label = document.createElement("span");
  label.textContent = "Copy validation JSON checksum";

  const preview = document.createElement("small");
  preview.style.display = "block";
  preview.style.maxWidth = "100%";
  preview.style.fontSize = "9px";
  preview.style.fontWeight = "500";
  preview.style.lineHeight = "1.25";
  preview.style.opacity = "0.66";
  preview.style.overflowWrap = "anywhere";
  preview.textContent = `${checksumFilename} · SHA-256 · exact ${formatByteSize(report.bytes)} JSON artifact`;

  button.title = preview.textContent;
  button.setAttribute("aria-label", `${label.textContent}. ${preview.textContent}`);
  button.append(label, preview);
  button.addEventListener("click", () => {
    void copyValidationJsonReportChecksum(report, checksumFilename, button, label, preview, options);
  });
  return button;
}

async function copyValidationJsonReportChecksum(
  report: RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportArtifact,
  checksumFilename: string,
  button: HTMLButtonElement,
  label: HTMLSpanElement,
  preview: HTMLElement,
  options: RuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumButtonOptions,
): Promise<void> {
  button.disabled = true;
  label.textContent = "Computing validation JSON checksum…";
  try {
    const checksum = await createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumArtifact(
      report,
      checksumFilename,
    );
    await copyRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumArtifact(checksum);
    button.dataset.checksumAlgorithm = checksum.algorithm;
    button.dataset.checksumHex = checksum.hex;
    preview.textContent = `${checksum.algorithm} ${checksum.hex} · ${checksum.reportFilename}`;
    button.title = preview.textContent;
    button.setAttribute("aria-label", `Copy validation JSON checksum. ${preview.textContent}`);
    options.onCopy?.(checksum, report);
    options.onStatus?.(`Copied ${checksum.algorithm} ${formatShortDigest(checksum.hex)} for ${checksum.reportFilename}.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("Mission diagnostics manifest validation JSON report checksum copy failed.", error);
    options.onStatus?.(`Validation JSON report checksum failed: ${message}`);
  } finally {
    button.disabled = false;
    label.textContent = "Copy validation JSON checksum";
  }
}

function formatHexDigest(digest: ArrayBuffer): string {
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function formatShortDigest(hex: string): string {
  return `${hex.slice(0, 12)}…`;
}

function normalizeChecksumFilename(filename: string): string {
  const normalized = filename.trim().replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  if (!normalized) return DEFAULT_VALIDATION_JSON_REPORT_CHECKSUM_FILENAME;
  return normalized.toLowerCase().endsWith(".sha256") ? normalized : `${normalized}.sha256`;
}

function formatByteSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kilobytes = bytes / 1024;
  return `${kilobytes >= 10 ? kilobytes.toFixed(0) : kilobytes.toFixed(1)} KB`;
}
