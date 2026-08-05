import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceArtifact,
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceResult,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenance.js";
import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceTrust,
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationAnchors,
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationChecks,
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationIssue,
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationIssueCode,
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationResult,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerification.js";

export const RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_IMPORTED_ARCHIVE_PROVENANCE_VERIFICATION_REPORT_SCHEMA =
  "splat-world-engine/mission-diagnostics-policy-manifest-verified-imported-archive-provenance-verification-report";
export const RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_IMPORTED_ARCHIVE_PROVENANCE_VERIFICATION_REPORT_SCHEMA_VERSION =
  1 as const;

const SHA256_ALGORITHM = "SHA-256" as const;
const DEFAULT_PREVIEW_CHARACTERS = 4096;
const MAX_PROVENANCE_JSON_BYTES = 4 * 1024 * 1024;
const MAX_REPORTED_ISSUES = 512;
const SAFE_BASENAME_PATTERN = /^[a-zA-Z0-9._-]+$/;
const PROVENANCE_JSON_MIME_TYPE = "application/json;charset=utf-8" as const;

export type RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportStatus =
  | "created"
  | "provenance-unavailable"
  | "input-too-large"
  | "crypto-unavailable"
  | "report-error";

export type RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportArtifactKind =
  | "provenance-verification-report-text"
  | "provenance-verification-report-json"
  | "provenance-verification-report-json-sha256";

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportChecksum {
  algorithm: typeof SHA256_ALGORITHM;
  input: "provenance-json-utf8" | "verification-report-artifact-text-utf8";
  hex: string;
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportIssue {
  code: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationIssueCode;
  path: string;
  message: string;
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportDocument {
  schema: typeof RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_IMPORTED_ARCHIVE_PROVENANCE_VERIFICATION_REPORT_SCHEMA;
  schemaVersion: typeof RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_IMPORTED_ARCHIVE_PROVENANCE_VERIFICATION_REPORT_SCHEMA_VERSION;
  target: unknown;
  input: {
    provenanceJsonFilename: string;
    provenanceJsonMimeType: string;
    declaredBytes: number;
    exactBytes: number;
    declaredChecksumHex: string;
    exactChecksum: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportChecksum;
    envelope: {
      filenameSafe: boolean;
      mimeTypeMatches: boolean;
      byteSizeMatches: boolean;
      checksumMatches: boolean;
    };
  };
  sourceArchive: {
    filename: string | null;
    exactBytes: number | null;
    checksumHex: string | null;
  };
  result: {
    valid: boolean;
    trust: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceTrust;
    issueCount: number;
  };
  checks: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationChecks;
  anchors: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationAnchors;
  evidence: {
    documentAvailable: boolean;
    canonicalTextAvailable: boolean;
    canonicalTextMatchesInput: boolean;
    verificationChecksumAvailable: boolean;
    issuesTruncated: boolean;
  };
  issues: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportIssue[];
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportArtifact {
  kind: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportArtifactKind;
  filename: string;
  mimeType: "text/plain;charset=utf-8" | typeof PROVENANCE_JSON_MIME_TYPE;
  bytes: number;
  checksumHex: string;
  text: string;
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportResult {
  status: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportStatus;
  verification: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationResult;
  provenance: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceResult;
  document: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportDocument | null;
  artifactCount: number;
  totalBytes: number;
  artifacts: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportArtifact[];
  error: string | null;
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportActionsOptions {
  maxPreviewCharacters?: number;
  onCreate?: (
    result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportResult,
  ) => void;
  onArtifactDownload?: (
    artifact: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportArtifact,
    result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportResult,
  ) => void;
  onDownloadAll?: (
    result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportResult,
  ) => void;
  onArtifactCopy?: (
    artifact: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportArtifact,
    result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportResult,
  ) => void;
  onStatus?: (message: string) => void;
}

export async function createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReport(
  verification: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationResult,
  provenance: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceResult,
): Promise<RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportResult> {
  if (provenance.status !== "created") {
    return fail(
      "provenance-unavailable",
      verification,
      provenance,
      provenance.error ?? "Created provenance artifacts are unavailable.",
    );
  }

  const jsonArtifact = findSingleProvenanceJsonArtifact(provenance.artifacts);
  if (!jsonArtifact) {
    return fail(
      "provenance-unavailable",
      verification,
      provenance,
      "Provenance result must contain exactly one provenance JSON artifact.",
    );
  }

  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    return fail(
      "crypto-unavailable",
      verification,
      provenance,
      "Web Crypto is unavailable; deterministic verification report checksums cannot be created.",
    );
  }

  try {
    const encoder = new TextEncoder();
    const provenanceText = typeof jsonArtifact.text === "string" ? jsonArtifact.text : "";
    const exactBytes = encoder.encode(provenanceText).byteLength;
    if (exactBytes > MAX_PROVENANCE_JSON_BYTES) {
      return fail(
        "input-too-large",
        verification,
        provenance,
        `Provenance JSON exceeds the ${MAX_PROVENANCE_JSON_BYTES} byte verification report limit.`,
      );
    }
    const exactChecksumHex = await digestText(provenanceText, subtle);
    const sourceFilename = typeof jsonArtifact.filename === "string" ? jsonArtifact.filename : "";
    const sourceMimeType = typeof jsonArtifact.mimeType === "string" ? jsonArtifact.mimeType : "";
    const sourceDeclaredChecksum = typeof jsonArtifact.checksumHex === "string" ? jsonArtifact.checksumHex : "";
    const sourceDeclaredBytes = typeof jsonArtifact.bytes === "number" ? jsonArtifact.bytes : -1;
    const filenameSafe = isSafeBasename(sourceFilename);
    const mimeTypeMatches = sourceMimeType === PROVENANCE_JSON_MIME_TYPE;
    const byteSizeMatches = sourceDeclaredBytes === exactBytes;
    const checksumMatches = sourceDeclaredChecksum === exactChecksumHex;
    const verifiedSource = readSourceArchive(verification.document);
    const trustedSource = readSourceArchive(provenance.document);
    const boundedIssues = Array.isArray(verification.issues)
      ? verification.issues.slice(0, MAX_REPORTED_ISSUES)
      : [];

    const document: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportDocument = {
      schema:
        RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_IMPORTED_ARCHIVE_PROVENANCE_VERIFICATION_REPORT_SCHEMA,
      schemaVersion:
        RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_ARTIFACT_BUNDLE_IMPORTED_ARCHIVE_PROVENANCE_VERIFICATION_REPORT_SCHEMA_VERSION,
      target: normalizeTarget(readTarget(verification.document) ?? readTarget(provenance.document)),
      input: {
        provenanceJsonFilename: filenameSafe
          ? sourceFilename
          : "mission-diagnostics-policy-manifest.verified-import-provenance.json",
        provenanceJsonMimeType: normalizeBoundedString(sourceMimeType, 255, "application/octet-stream"),
        declaredBytes: normalizeNonNegativeInteger(sourceDeclaredBytes),
        exactBytes,
        declaredChecksumHex: normalizeChecksumHex(sourceDeclaredChecksum),
        exactChecksum: {
          algorithm: SHA256_ALGORITHM,
          input: "provenance-json-utf8",
          hex: exactChecksumHex,
        },
        envelope: {
          filenameSafe,
          mimeTypeMatches,
          byteSizeMatches,
          checksumMatches,
        },
      },
      sourceArchive: {
        filename: verifiedSource.filename ?? trustedSource.filename,
        exactBytes: verifiedSource.exactBytes ?? trustedSource.exactBytes,
        checksumHex: verifiedSource.checksumHex ?? trustedSource.checksumHex,
      },
      result: {
        valid: verification.valid,
        trust: verification.trust,
        issueCount: verification.issues.length,
      },
      checks: copyChecks(verification.checks),
      anchors: copyAnchors(verification.anchors),
      evidence: {
        documentAvailable: verification.document !== null,
        canonicalTextAvailable: typeof verification.canonicalText === "string",
        canonicalTextMatchesInput:
          typeof verification.canonicalText === "string" && verification.canonicalText === provenanceText,
        verificationChecksumAvailable: typeof verification.checksumHex === "string",
        issuesTruncated: Array.isArray(verification.issues) && verification.issues.length > MAX_REPORTED_ISSUES,
      },
      issues: boundedIssues.map(normalizeIssue),
    };

    const filenames = createReportFilenames(sourceFilename);
    const jsonText = `${JSON.stringify(canonicalize(document), null, 2)}\n`;
    const textReport = createTextReport(document);
    const jsonChecksumHex = await digestText(jsonText, subtle);
    const checksumText = `${jsonChecksumHex}  ${filenames.json}\n`;
    const artifacts = [
      await createArtifact(
        "provenance-verification-report-text",
        filenames.text,
        "text/plain;charset=utf-8",
        textReport,
        subtle,
      ),
      {
        kind: "provenance-verification-report-json" as const,
        filename: filenames.json,
        mimeType: PROVENANCE_JSON_MIME_TYPE,
        bytes: encoder.encode(jsonText).byteLength,
        checksumHex: jsonChecksumHex,
        text: jsonText,
      },
      await createArtifact(
        "provenance-verification-report-json-sha256",
        filenames.checksum,
        "text/plain;charset=utf-8",
        checksumText,
        subtle,
      ),
    ];

    return {
      status: "created",
      verification,
      provenance,
      document,
      artifactCount: artifacts.length,
      totalBytes: artifacts.reduce((sum, artifact) => sum + artifact.bytes, 0),
      artifacts,
      error: null,
    };
  } catch (error) {
    return fail("report-error", verification, provenance, formatError(error));
  }
}

export function createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportActions(
  verification: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationResult,
  provenance: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceResult,
  options: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportActionsOptions = {},
): HTMLElement {
  const root = document.createElement("section");
  root.className =
    "mission-debug-diagnostics-manifest-validation-imported-archive-provenance-verification-report";
  root.dataset.bundleImportedArchiveProvenanceVerificationReportStatus = "preparing";
  Object.assign(root.style, { display: "grid", gap: "5px", minWidth: "0", paddingTop: "2px" });

  const preparing = document.createElement("small");
  preparing.textContent = "Preparing deterministic provenance verification report artifacts…";
  preparing.style.opacity = "0.66";
  root.append(preparing);
  void prepareActions(root, verification, provenance, options);
  return root;
}

export function downloadRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportArtifact(
  artifact: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportArtifact,
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

export function downloadRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportArtifacts(
  result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportResult,
): number {
  assertCreated(result);
  for (const artifact of result.artifacts) {
    downloadRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportArtifact(
      artifact,
    );
  }
  return result.artifacts.length;
}

export async function copyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportArtifact(
  artifact: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportArtifact,
): Promise<void> {
  const clipboard = globalThis.navigator?.clipboard;
  if (!clipboard) throw new Error("Clipboard API is unavailable.");
  await clipboard.writeText(artifact.text);
}

async function prepareActions(
  root: HTMLElement,
  verification: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationResult,
  provenance: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceResult,
  options: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportActionsOptions,
): Promise<void> {
  const result =
    await createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReport(
      verification,
      provenance,
    );
  root.dataset.bundleImportedArchiveProvenanceVerificationReportStatus = result.status;
  options.onCreate?.(result);

  if (result.status !== "created" || !result.document) {
    clearDataset(root);
    const error = document.createElement("small");
    error.textContent = `Provenance verification reports unavailable: ${result.error ?? "Unknown failure."}`;
    error.style.color = "#ffb4b4";
    error.style.overflowWrap = "anywhere";
    root.replaceChildren(error);
    return;
  }

  const jsonArtifact = result.artifacts.find(
    (artifact) => artifact.kind === "provenance-verification-report-json",
  );
  root.dataset.bundleImportedArchiveProvenanceVerificationReportValid = String(result.document.result.valid);
  root.dataset.bundleImportedArchiveProvenanceVerificationReportTrust = result.document.result.trust;
  root.dataset.bundleImportedArchiveProvenanceVerificationReportIssueCount = String(
    result.document.result.issueCount,
  );
  root.dataset.bundleImportedArchiveProvenanceVerificationReportArtifactCount = String(result.artifactCount);
  root.dataset.bundleImportedArchiveProvenanceVerificationReportTotalBytes = String(result.totalBytes);
  root.dataset.bundleImportedArchiveProvenanceVerificationReportInputChecksum =
    result.document.input.exactChecksum.hex;
  if (jsonArtifact) {
    root.dataset.bundleImportedArchiveProvenanceVerificationReportJsonChecksum =
      jsonArtifact.checksumHex;
  }

  const heading = document.createElement("small");
  heading.textContent =
    `Provenance verification evidence · ${result.document.result.trust} · ` +
    `${result.document.result.issueCount} issues · ${result.artifactCount} artifacts`;
  heading.style.fontWeight = "750";
  heading.style.overflowWrap = "anywhere";

  const downloadAll = createActionButton(
    "Download all verification report artifacts",
    `${result.artifactCount} artifacts · canonical fixed order · ${formatBytes(result.totalBytes)}`,
  );
  downloadAll.dataset.bundleImportedArchiveProvenanceVerificationReportAction = "download-all";
  downloadAll.addEventListener("click", () => {
    try {
      const count =
        downloadRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportArtifacts(
          result,
        );
      options.onDownloadAll?.(result);
      options.onStatus?.(`Downloaded ${count} provenance verification report artifacts.`);
    } catch (error) {
      options.onStatus?.(`Verification report download failed: ${formatError(error)}`);
    }
  });

  const list = document.createElement("div");
  Object.assign(list.style, { display: "grid", gap: "5px" });
  const maxPreviewCharacters = normalizePreview(options.maxPreviewCharacters);
  for (const artifact of result.artifacts) {
    list.append(createArtifactInspection(artifact, result, maxPreviewCharacters, options));
  }
  root.replaceChildren(heading, downloadAll, list);
}

function createArtifactInspection(
  artifact: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportArtifact,
  result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportResult,
  maxPreviewCharacters: number,
  options: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportActionsOptions,
): HTMLElement {
  const details = document.createElement("details");
  details.dataset.bundleImportedArchiveProvenanceVerificationReportArtifactKind = artifact.kind;
  details.dataset.bundleImportedArchiveProvenanceVerificationReportArtifactFilename = artifact.filename;
  details.dataset.bundleImportedArchiveProvenanceVerificationReportArtifactBytes = String(artifact.bytes);
  details.dataset.bundleImportedArchiveProvenanceVerificationReportArtifactChecksum = artifact.checksumHex;
  Object.assign(details.style, {
    minWidth: "0",
    padding: "6px 7px",
    border: "1px solid rgba(173, 136, 255, 0.24)",
    borderRadius: "7px",
    background: "rgba(173, 136, 255, 0.04)",
  });

  const summary = document.createElement("summary");
  summary.textContent =
    `${artifact.filename} · ${formatBytes(artifact.bytes)} · SHA-256 ${artifact.checksumHex.slice(0, 12)}…`;
  Object.assign(summary.style, {
    cursor: "pointer",
    fontSize: "10px",
    fontWeight: "700",
    overflowWrap: "anywhere",
  });

  const preview = document.createElement("pre");
  const visible = artifact.text.slice(0, maxPreviewCharacters);
  preview.textContent = artifact.text.length > maxPreviewCharacters
    ? `${visible}\n… preview truncated after ${maxPreviewCharacters} characters`
    : visible;
  Object.assign(preview.style, {
    margin: "6px 0 0",
    maxHeight: "220px",
    overflow: "auto",
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
    fontSize: "9px",
    lineHeight: "1.4",
  });

  const actions = document.createElement("div");
  Object.assign(actions.style, {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "4px",
    marginTop: "5px",
  });

  const copy = createActionButton(
    "Copy verification report artifact",
    `${artifact.filename} · exact ${artifact.bytes} bytes`,
  );
  copy.dataset.bundleImportedArchiveProvenanceVerificationReportAction = "copy";
  copy.addEventListener("click", () => {
    void copyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportArtifact(
      artifact,
    )
      .then(() => {
        options.onArtifactCopy?.(artifact, result);
        options.onStatus?.(`Copied verification report artifact ${artifact.filename}.`);
      })
      .catch((error: unknown) => options.onStatus?.(`Verification report copy failed: ${formatError(error)}`));
  });

  const download = createActionButton(
    "Download verification report artifact",
    `${artifact.filename} · ${artifact.mimeType}`,
  );
  download.dataset.bundleImportedArchiveProvenanceVerificationReportAction = "download";
  download.addEventListener("click", () => {
    try {
      downloadRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportArtifact(
        artifact,
      );
      options.onArtifactDownload?.(artifact, result);
      options.onStatus?.(`Downloaded verification report artifact ${artifact.filename}.`);
    } catch (error) {
      options.onStatus?.(`Verification report download failed: ${formatError(error)}`);
    }
  });

  actions.append(copy, download);
  details.append(summary, preview, actions);
  return details;
}

function createTextReport(
  document: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportDocument,
): string {
  const lines = [
    "Splat World Engine Imported Archive Provenance Verification Report",
    "",
    `Schema: ${document.schema}`,
    `Schema version: ${document.schemaVersion}`,
    `Target: ${JSON.stringify(canonicalize(document.target))}`,
    "",
    `Result valid: ${document.result.valid}`,
    `Trust: ${document.result.trust}`,
    `Issue count: ${document.result.issueCount}`,
    "",
    `Provenance JSON: ${document.input.provenanceJsonFilename}`,
    `Provenance exact bytes: ${document.input.exactBytes}`,
    `Provenance exact SHA-256: ${document.input.exactChecksum.hex}`,
    `Envelope filename safe: ${document.input.envelope.filenameSafe}`,
    `Envelope MIME type matches: ${document.input.envelope.mimeTypeMatches}`,
    `Envelope byte size matches: ${document.input.envelope.byteSizeMatches}`,
    `Envelope checksum matches: ${document.input.envelope.checksumMatches}`,
    "",
    `Source archive: ${document.sourceArchive.filename ?? "unavailable"}`,
    `Source archive exact bytes: ${document.sourceArchive.exactBytes ?? "unavailable"}`,
    `Source archive SHA-256: ${document.sourceArchive.checksumHex ?? "unavailable"}`,
    "",
    "Verification checks",
  ];
  for (const [name, value] of Object.entries(document.checks)) {
    lines.push(`  ${name}: ${value}`);
  }
  lines.push("", "Trusted anchors");
  for (const [name, value] of Object.entries(document.anchors)) {
    lines.push(`  ${name}: ${value === null ? "not-provided" : value}`);
  }
  lines.push("", "Issues");
  if (document.issues.length === 0) {
    lines.push("  none");
  } else {
    for (const issue of document.issues) {
      lines.push(`  ${issue.code} ${issue.path}`, `    ${issue.message}`);
    }
  }
  lines.push("", `Result: ${document.result.valid ? "verification passed" : "verification failed"}`);
  return `${lines.join("\n")}\n`;
}

function createReportFilenames(sourceFilename: string): { text: string; json: string; checksum: string } {
  let base = "mission-diagnostics-policy-manifest.verified-import-provenance";
  if (isSafeBasename(sourceFilename) && sourceFilename.endsWith(".json")) {
    base = sourceFilename.slice(0, -".json".length);
  }
  const verificationBase = `${base}.verification-report`;
  return {
    text: `${verificationBase}.txt`,
    json: `${verificationBase}.json`,
    checksum: `${verificationBase}.json.sha256`,
  };
}

function normalizeIssue(
  issue: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationIssue,
): RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportIssue {
  return {
    code: issue.code,
    path: normalizeIssuePath(issue.path),
    message: stableIssueMessage(issue.code),
  };
}

function stableIssueMessage(
  code: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationIssueCode,
): string {
  switch (code) {
    case "text-invalid":
      return "Provenance text input is invalid.";
    case "text-size-invalid":
      return "Provenance text exceeds the configured verification size limit.";
    case "json-parse-failed":
      return "Provenance text is not valid JSON.";
    case "document-type-invalid":
      return "Provenance document root is not a plain JSON object.";
    case "field-type-invalid":
      return "A required provenance field has an invalid type or is missing.";
    case "field-value-invalid":
      return "A provenance field contains an invalid value.";
    case "array-size-invalid":
      return "A provenance array exceeds the configured entry limit.";
    case "string-size-invalid":
      return "A provenance string exceeds the configured character limit.";
    case "schema-mismatch":
      return "Provenance schema does not match the required schema.";
    case "schema-version-mismatch":
      return "Provenance schema version does not match the required version.";
    case "unknown-field":
      return "Provenance contains a field that is not allowed by the fixed schema.";
    case "canonical-json-mismatch":
      return "Provenance JSON does not match the required canonical serialization.";
    case "source-archive-mismatch":
      return "Source archive metadata is inconsistent.";
    case "source-archive-checksum-mismatch":
      return "Source archive SHA-256 does not match the trusted anchor.";
    case "verification-check-mismatch":
      return "Recorded archive verification checks are inconsistent.";
    case "trusted-extraction-mismatch":
      return "Trusted extraction metadata does not match the trusted extraction anchor.";
    case "imported-extraction-mismatch":
      return "Imported extraction metadata does not match retained imported bytes.";
    case "relationship-count-mismatch":
      return "Provenance relationship count is invalid.";
    case "relationship-mismatch":
      return "A provenance relationship is incomplete or false.";
    case "artifact-order-mismatch":
      return "Provenance artifacts are not in the required fixed order.";
    case "artifact-metadata-mismatch":
      return "Provenance artifact metadata is inconsistent.";
    case "crc32-mismatch":
      return "An imported artifact CRC-32 does not match retained bytes.";
    case "sha256-mismatch":
      return "A SHA-256 value does not match retained bytes.";
    case "checksum-artifact-invalid":
      return "The provenance JSON SHA-256 artifact is invalid.";
    case "expected-provenance-mismatch":
      return "Provenance input does not match the expected provenance result.";
    case "crypto-unavailable":
      return "Web Crypto SHA-256 was unavailable during provenance verification.";
  }
}

function normalizeIssuePath(path: string): string {
  if (typeof path !== "string" || path.length === 0) return "$";
  return path.length <= 2048 ? path : path.slice(0, 2048);
}

function copyChecks(
  checks: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationChecks,
): RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationChecks {
  return {
    parsed: checks.parsed,
    schema: checks.schema,
    canonical: checks.canonical,
    sourceArchive: checks.sourceArchive,
    verification: checks.verification,
    trustedExtraction: checks.trustedExtraction,
    importedExtraction: checks.importedExtraction,
    relationships: checks.relationships,
    jsonChecksum: checks.jsonChecksum,
  };
}

function copyAnchors(
  anchors: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationAnchors,
): RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationAnchors {
  return {
    expectedProvenance: anchors.expectedProvenance,
    entryExtraction: anchors.entryExtraction,
    sourceArchiveChecksum: anchors.sourceArchiveChecksum,
    jsonChecksumArtifact: anchors.jsonChecksumArtifact,
  };
}

async function createArtifact(
  kind: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportArtifactKind,
  filename: string,
  mimeType: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportArtifact["mimeType"],
  text: string,
  subtle: SubtleCrypto,
): Promise<RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportArtifact> {
  return {
    kind,
    filename,
    mimeType,
    bytes: new TextEncoder().encode(text).byteLength,
    checksumHex: await digestText(text, subtle),
    text,
  };
}

function fail(
  status: Exclude<
    RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportStatus,
    "created"
  >,
  verification: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationResult,
  provenance: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceResult,
  error: string,
): RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportResult {
  return {
    status,
    verification,
    provenance,
    document: null,
    artifactCount: 0,
    totalBytes: 0,
    artifacts: [],
    error,
  };
}

function assertCreated(
  result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportResult,
): void {
  if (result.status !== "created") {
    throw new Error(result.error ?? "Provenance verification report artifacts are unavailable.");
  }
}

function findSingleProvenanceJsonArtifact(
  artifacts: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceArtifact[],
): RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceArtifact | null {
  if (!Array.isArray(artifacts)) return null;
  const matches = artifacts.filter(
    (artifact): artifact is RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceArtifact =>
      isRecord(artifact) && artifact.kind === "provenance-report-json",
  );
  return matches.length === 1 ? matches[0] ?? null : null;
}

function clearDataset(root: HTMLElement): void {
  delete root.dataset.bundleImportedArchiveProvenanceVerificationReportValid;
  delete root.dataset.bundleImportedArchiveProvenanceVerificationReportTrust;
  delete root.dataset.bundleImportedArchiveProvenanceVerificationReportIssueCount;
  delete root.dataset.bundleImportedArchiveProvenanceVerificationReportArtifactCount;
  delete root.dataset.bundleImportedArchiveProvenanceVerificationReportTotalBytes;
  delete root.dataset.bundleImportedArchiveProvenanceVerificationReportInputChecksum;
  delete root.dataset.bundleImportedArchiveProvenanceVerificationReportJsonChecksum;
}

function readTarget(document: unknown): unknown {
  return isRecord(document) && Object.hasOwn(document, "target") ? document.target : null;
}

function normalizeTarget(value: unknown): unknown {
  if (!isRecord(value)) return null;
  const scope = typeof value.scope === "string" && value.scope.length <= 64 ? value.scope : null;
  const packageIndex =
    value.packageIndex === null ||
    (typeof value.packageIndex === "number" && Number.isSafeInteger(value.packageIndex) && value.packageIndex >= 0)
      ? value.packageIndex
      : null;
  return { packageIndex, scope };
}

function readSourceArchive(document: unknown): {
  filename: string | null;
  exactBytes: number | null;
  checksumHex: string | null;
} {
  if (!isRecord(document) || !isRecord(document.sourceArchive)) {
    return { filename: null, exactBytes: null, checksumHex: null };
  }
  const source = document.sourceArchive;
  const filename =
    typeof source.filename === "string" && isSafeBasename(source.filename)
      ? source.filename
      : null;
  const exactBytes =
    typeof source.exactBytes === "number" &&
    Number.isSafeInteger(source.exactBytes) &&
    source.exactBytes >= 0
      ? source.exactBytes
      : null;
  const checksumHex =
    isRecord(source.checksum) &&
    typeof source.checksum.hex === "string" &&
    /^[0-9a-f]{64}$/.test(source.checksum.hex)
      ? source.checksum.hex
      : null;
  return { filename, exactBytes, checksumHex };
}

function normalizeBoundedString(value: string, maxCharacters: number, fallback: string): string {
  return value.length > 0 && value.length <= maxCharacters ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort()) {
      if (source[key] !== undefined) output[key] = canonicalize(source[key]);
    }
    return output;
  }
  return value;
}

function isSafeBasename(value: string): boolean {
  return value.length > 0 && value.length <= 255 && SAFE_BASENAME_PATTERN.test(value);
}

function normalizeNonNegativeInteger(value: number): number {
  return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

function normalizeChecksumHex(value: string): string {
  return /^[0-9a-f]{64}$/.test(value) ? value : "0".repeat(64);
}

function createActionButton(labelText: string, previewText: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  Object.assign(button.style, { display: "grid", width: "100%", gap: "2px", textAlign: "left" });
  const label = document.createElement("span");
  label.textContent = labelText;
  const preview = document.createElement("small");
  preview.textContent = previewText;
  preview.style.fontSize = "9px";
  preview.style.opacity = "0.66";
  preview.style.overflowWrap = "anywhere";
  button.title = previewText;
  button.setAttribute("aria-label", `${labelText}. ${previewText}`);
  button.append(label, preview);
  return button;
}

function normalizePreview(value: number | undefined): number {
  if (value === undefined) return DEFAULT_PREVIEW_CHARACTERS;
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error("maxPreviewCharacters must be a positive safe integer.");
  }
  return value;
}

async function digestText(text: string, subtle: SubtleCrypto): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const buffer = new Uint8Array(bytes.byteLength);
  buffer.set(bytes);
  return bytesToHex(await subtle.digest(SHA256_ALGORITHM, buffer.buffer));
}

function bytesToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kilobytes = bytes / 1024;
  if (kilobytes < 1024) return `${kilobytes >= 10 ? kilobytes.toFixed(0) : kilobytes.toFixed(1)} KB`;
  const megabytes = kilobytes / 1024;
  return `${megabytes >= 10 ? megabytes.toFixed(0) : megabytes.toFixed(1)} MB`;
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
