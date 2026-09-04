import type {RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultVerificationResult as Verification} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultVerificationContract.js";
import type {RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultEvidence as Source} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultContract.js";
import type {
  RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceActionsOptions as Options,
  RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceResult as Result,
} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceContract.js";
import {createRuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidence as createEvidence} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceArtifacts.js";
import {
  artifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceInspection,
  button,
  bytes,
  downloadArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceArtifacts,
} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceArtifactActions.js";

export function createRuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceActions(
  verification: Verification,
  source: Source,
  options: Options = {},
): HTMLElement {
  const root = document.createElement("section");
  Object.assign(root.style, {display: "grid", gap: "5px", minWidth: "0"});
  root.dataset.verificationResultArtifactVerifierEvidenceStatus = "idle";
  const create = button("Create verification-result artifact-verifier evidence artifacts");
  const slot = document.createElement("div");
  create.addEventListener("click", () => void createEvidence(verification, source)
    .then(result => render(root, slot, result, options))
    .catch(error => options.onStatus?.(`Artifact-verifier evidence creation failed: ${error instanceof Error ? error.message : String(error)}`)));
  root.append(create, slot);
  return root;
}

export function createRuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceResultActions(
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
  root.dataset.verificationResultArtifactVerifierEvidenceStatus = result.status;
  slot.replaceChildren();
  options.onCreate?.(result);
  if (result.status !== "created" || !result.document) {
    const message = document.createElement("small");
    message.textContent = result.error ?? `Artifact-verifier evidence creation failed: ${result.status}.`;
    slot.append(message);
    options.onStatus?.(message.textContent);
    return;
  }
  const max = options.maxPreviewCharacters ?? 12000;
  const heading = document.createElement("small");
  heading.textContent = `Artifact-verifier evidence · ${result.document.result.valid} / ${result.document.result.trust} · ${result.document.result.issueCount} issues · ${result.artifactCount} artifacts · ${bytes(result.totalBytes)}`;
  const input = document.createElement("small");
  input.textContent = `Input verification-result SHA-256 ${result.document.input.exactChecksum.hex}`;
  const json = document.createElement("small");
  json.textContent = `Artifact-verifier evidence JSON SHA-256 ${result.artifacts[1]?.checksumHex ?? "unavailable"}`;
  const downloadAll = button("Download all artifact-verifier evidence artifacts");
  downloadAll.addEventListener("click", () => {
    try {
      downloadArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceArtifacts(result);
      options.onDownloadAll?.(result);
      options.onStatus?.(`Downloaded ${result.artifactCount} artifact-verifier evidence artifacts.`);
    } catch (error) {
      options.onStatus?.(`Artifact-verifier evidence download failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
  slot.append(heading, input, json, downloadAll);
  for (const artifact of result.artifacts) {
    slot.append(artifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceInspection(artifact, result, max, options));
  }
  options.onStatus?.(`Created ${result.artifactCount} deterministic verification-result artifact-verifier evidence artifacts.`);
}
