import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceResult,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenance.js";
import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationResult,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerification.js";
import {
  createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportActions,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReport.js";
import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportActionsOptions,
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportResult,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReport.js";
import {
  verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportArtifact,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportArtifactVerification.js";
import type {
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationResult,
} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerification.js";

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationControlOptions {
  expectedVerification?: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationResult;
  expectedProvenance?: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceResult;
  onVerify?: (
    verification: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationResult,
    report: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportResult,
  ) => void;
  onStatus?: (message: string) => void;
}

export interface RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerifiedActionsOptions
  extends RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportActionsOptions,
    RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationControlOptions {
  onReportVerify?: (
    verification: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationResult,
    report: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportResult,
  ) => void;
}

export function createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationControl(
  report: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportResult,
  options: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationControlOptions = {},
): HTMLElement {
  const root = document.createElement("section");
  root.className = "mission-debug-diagnostics-manifest-validation-imported-archive-provenance-verification-report-verification";
  root.dataset.bundleImportedArchiveProvenanceVerificationReportVerificationStatus = "idle";
  root.dataset.bundleImportedArchiveProvenanceVerificationReportVerificationValid = "false";
  root.dataset.bundleImportedArchiveProvenanceVerificationReportVerificationTrust = "untrusted";
  root.dataset.bundleImportedArchiveProvenanceVerificationReportVerificationIssueCount = "0";
  Object.assign(root.style, { display:"grid", gap:"5px", minWidth:"0" });
  const button = actionButton("Verify provenance verification report artifacts", "schema · canonical JSON · provenance anchors · issues · text report · JSON SHA-256");
  button.dataset.bundleImportedArchiveProvenanceVerificationReportVerificationAction = "verify";
  const details = document.createElement("details");
  details.hidden = true;
  Object.assign(details.style, { minWidth:"0", padding:"6px 7px", border:"1px solid rgba(173, 136, 255, 0.24)", borderRadius:"7px", background:"rgba(173, 136, 255, 0.04)" });
  button.addEventListener("click", () => void run(root, button, details, report, options));
  root.append(button, details);
  return root;
}

export function createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerifiedActions(
  verification: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationResult,
  provenance: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceResult,
  options: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerifiedActionsOptions = {},
): HTMLElement {
  const root = document.createElement("section");
  root.className = "mission-debug-diagnostics-manifest-validation-imported-archive-provenance-verification-report-workflow";
  Object.assign(root.style, { display:"grid", gap:"5px", minWidth:"0" });
  const actions = createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportActions(
    verification,
    provenance,
    {
      ...(options.maxPreviewCharacters === undefined ? {} : { maxPreviewCharacters:options.maxPreviewCharacters }),
      ...(options.onArtifactDownload === undefined ? {} : { onArtifactDownload:options.onArtifactDownload }),
      ...(options.onDownloadAll === undefined ? {} : { onDownloadAll:options.onDownloadAll }),
      ...(options.onArtifactCopy === undefined ? {} : { onArtifactCopy:options.onArtifactCopy }),
      ...(options.onStatus === undefined ? {} : { onStatus:options.onStatus }),
      onCreate: (report) => {
        options.onCreate?.(report);
        root.querySelector<HTMLElement>("[data-provenance-verification-report-verifier]")?.remove();
        if (report.status !== "created") return;
        const control = createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationControl(
          report,
          {
            expectedVerification: options.expectedVerification ?? verification,
            expectedProvenance: options.expectedProvenance ?? provenance,
            onVerify: (result, verifiedReport) => { options.onVerify?.(result, verifiedReport); options.onReportVerify?.(result, verifiedReport); },
            ...(options.onStatus === undefined ? {} : { onStatus:options.onStatus }),
          },
        );
        control.dataset.provenanceVerificationReportVerifier = "true";
        root.append(control);
      },
    },
  );
  root.append(actions);
  return root;
}

async function run(
  root: HTMLElement,
  button: HTMLButtonElement,
  details: HTMLDetailsElement,
  report: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportResult,
  options: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationControlOptions,
): Promise<void> {
  button.disabled = true;
  root.dataset.bundleImportedArchiveProvenanceVerificationReportVerificationStatus = "verifying";
  try {
    const result = await verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportArtifact(report, options.expectedVerification, options.expectedProvenance);
    applyDataset(root, result);
    render(details, result);
    options.onVerify?.(result, report);
    options.onStatus?.(result.valid ? `Provenance verification report verified with ${result.trust} trust.` : `Provenance verification report verification failed with ${count(result.issues.length)}.`);
  } catch (error) {
    root.dataset.bundleImportedArchiveProvenanceVerificationReportVerificationStatus = "error";
    root.dataset.bundleImportedArchiveProvenanceVerificationReportVerificationValid = "false";
    root.dataset.bundleImportedArchiveProvenanceVerificationReportVerificationTrust = "untrusted";
    details.hidden = false; details.open = true;
    const summary = document.createElement("summary"); summary.textContent = "Provenance verification report verification error";
    const message = document.createElement("small"); message.textContent = formatError(error); message.style.color = "#ffb4b4"; message.style.overflowWrap = "anywhere";
    details.replaceChildren(summary, message);
    options.onStatus?.(`Provenance verification report verification error: ${formatError(error)}`);
  } finally { button.disabled = false; }
}

function applyDataset(root: HTMLElement, result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationResult): void {
  root.dataset.bundleImportedArchiveProvenanceVerificationReportVerificationStatus = result.valid ? "verified" : "failed";
  root.dataset.bundleImportedArchiveProvenanceVerificationReportVerificationValid = String(result.valid);
  root.dataset.bundleImportedArchiveProvenanceVerificationReportVerificationTrust = result.trust;
  root.dataset.bundleImportedArchiveProvenanceVerificationReportVerificationIssueCount = String(result.issues.length);
  if (result.document) {
    root.dataset.bundleImportedArchiveProvenanceVerificationReportVerificationSchemaVersion = String(result.document.schemaVersion);
    root.dataset.bundleImportedArchiveProvenanceVerificationReportVerificationResultValid = String(result.document.result.valid);
    root.dataset.bundleImportedArchiveProvenanceVerificationReportVerificationResultTrust = result.document.result.trust;
  }
  if (result.checksumHex) root.dataset.bundleImportedArchiveProvenanceVerificationReportVerificationChecksum = result.checksumHex;
}

function render(details: HTMLDetailsElement, result: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationResult): void {
  details.hidden = false; details.open = !result.valid;
  details.style.border = result.valid ? "1px solid rgba(112, 214, 151, 0.28)" : "1px solid rgba(255, 93, 93, 0.32)";
  details.style.background = result.valid ? "rgba(112, 214, 151, 0.05)" : "rgba(255, 93, 93, 0.055)";
  const summary = document.createElement("summary");
  summary.textContent = result.valid ? `Verification report · passed · ${result.trust}` : `Verification report · failed · ${count(result.issues.length)}`;
  Object.assign(summary.style, { cursor:"pointer", fontSize:"10px", fontWeight:"750", overflowWrap:"anywhere" });
  const body = document.createElement("div"); Object.assign(body.style, { display:"grid", gap:"5px", marginTop:"6px" });
  const lines = result.document ? [
    `schema/version ${result.document.schema} / ${result.document.schemaVersion}`,
    `recorded result ${result.document.result.valid} / ${result.document.result.trust}`,
    `canonical JSON ${status(result.checks.canonical)}`,
    `issue evidence ${status(result.checks.issues)}`,
    `text report ${status(result.checks.textReport)}`,
    `artifact envelope ${status(result.checks.artifactEnvelope)}`,
    `JSON SHA-256 ${result.checksumHex ?? "unavailable"}`,
    `issues ${result.issues.length}`,
  ] : [`canonical JSON ${status(result.checks.canonical)}`, `issues ${result.issues.length}`];
  for (const line of lines) { const item = document.createElement("small"); item.textContent = line; item.style.overflowWrap = "anywhere"; body.append(item); }
  if (result.issues.length > 0) {
    const list = document.createElement("ul"); Object.assign(list.style, { display:"grid", gap:"4px", margin:"0", padding:"0", listStyle:"none" });
    for (const issue of result.issues) {
      const item = document.createElement("li"); Object.assign(item.style, { display:"grid", gap:"2px", padding:"5px 6px", border:"1px solid rgba(255, 93, 93, 0.28)", borderRadius:"6px", background:"rgba(255, 93, 93, 0.07)" });
      const heading = document.createElement("b"); heading.textContent = `${issue.code} ${issue.path}`; heading.style.fontSize = "9px";
      const message = document.createElement("small"); message.textContent = issue.message; message.style.fontSize = "9px"; message.style.overflowWrap = "anywhere";
      item.append(heading, message); list.append(item);
    }
    body.append(list);
  }
  details.replaceChildren(summary, body);
}

function actionButton(labelText: string, previewText: string): HTMLButtonElement {
  const button = document.createElement("button"); button.type = "button";
  Object.assign(button.style, { display:"grid", width:"100%", gap:"2px", textAlign:"left" });
  const label = document.createElement("span"); label.textContent = labelText;
  const preview = document.createElement("small"); preview.textContent = previewText; preview.style.fontSize = "9px"; preview.style.opacity = "0.66"; preview.style.overflowWrap = "anywhere";
  button.title = previewText; button.setAttribute("aria-label", `${labelText}. ${previewText}`); button.append(label, preview); return button;
}
function count(value: number): string { return `${value} verification issue${value === 1 ? "" : "s"}`; }
function status(value: boolean): string { return value ? "verified" : "failed"; }
function formatError(error: unknown): string { return error instanceof Error ? error.message : String(error); }
