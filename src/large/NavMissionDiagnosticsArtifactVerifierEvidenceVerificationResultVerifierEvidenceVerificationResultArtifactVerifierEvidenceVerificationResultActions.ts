import type {RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResult as Verification} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationContract.js";
import type {RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceResult as Source} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceContract.js";
import type {
  RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultActionsOptions as Options,
  RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultEvidence as Result,
} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultContract.js";
import {createRuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResult as createResult} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultArtifacts.js";
import {
  artifactVerifierEvidenceVerificationResultInspection,
  button,
  bytes,
  downloadArtifactVerifierEvidenceVerificationResultArtifacts,
} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultArtifactActions.js";

export function createRuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultActions(
  verification: Verification,
  source: Source,
  options: Options = {},
): HTMLElement {
  const root = document.createElement("section");
  Object.assign(root.style, {display: "grid", gap: "5px", minWidth: "0"});
  root.dataset.artifactVerifierEvidenceVerificationResultStatus = "idle";
  const create = button("Create artifact-verifier evidence verification result artifacts");
  const slot = document.createElement("div");
  create.addEventListener("click", () => void createResult(verification, source).then(result => render(root, slot, result, options)).catch(error => options.onStatus?.(`Verification result creation failed: ${error instanceof Error ? error.message : String(error)}`)));
  root.append(create, slot);
  return root;
}

export function createRuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultResultActions(
  result: Result,
  options: Options = {},
): HTMLElement {
  const root = document.createElement("section");
  Object.assign(root.style, {display: "grid", gap: "5px", minWidth: "0"});
  const slot = document.createElement("div");
  root.append(slot);
  render(root, slot, result, options);
  return root;
}

function render(root: HTMLElement, slot: HTMLElement, result: Result, options: Options): void {
  root.dataset.artifactVerifierEvidenceVerificationResultStatus = result.status;
  slot.replaceChildren();
  options.onCreate?.(result);
  if (result.status !== "created" || !result.document) {
    const message = document.createElement("small");
    message.textContent = result.error ?? `Verification result creation failed: ${result.status}.`;
    slot.append(message);
    options.onStatus?.(message.textContent);
    return;
  }
  const max = options.maxPreviewCharacters ?? 12000;
  const heading = document.createElement("small");
  heading.textContent = `Verification result · ${result.document.result.valid} / ${result.document.result.trust} · ${result.document.result.issueCount} issues · ${result.artifactCount} artifacts · ${bytes(result.totalBytes)}`;
  const input = document.createElement("small");
  input.textContent = `Input artifact-verifier evidence SHA-256 ${result.document.input.exactChecksum.hex}`;
  const json = document.createElement("small");
  json.textContent = `Verification result JSON SHA-256 ${result.artifacts[1]?.checksumHex ?? "unavailable"}`;
  const all = button("Download all verification result artifacts");
  all.addEventListener("click", () => {
    try {
      downloadArtifactVerifierEvidenceVerificationResultArtifacts(result);
      options.onDownloadAll?.(result);
      options.onStatus?.(`Downloaded ${result.artifactCount} verification result artifacts.`);
    } catch (error) {
      options.onStatus?.(`Verification result download failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
  slot.append(heading, input, json, all);
  for (const artifact of result.artifacts) slot.append(artifactVerifierEvidenceVerificationResultInspection(artifact, result, max, options));
  options.onStatus?.(`Created ${result.artifactCount} deterministic artifact-verifier evidence verification-result artifacts.`);
}
