import type {RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceResult as Provenance} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenance.js";
import type {RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationResult as ProvenanceVerification} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerification.js";
import type {RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceResult as Source} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceContract.js";
import type {RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResult as Verification} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationContract.js";
import {
  createRuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceWorkflow as createVerifiedWorkflow,
} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceWorkflow.js";
import type {RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceWorkflowOptions as VerifiedOptions} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceWorkflow.js";
import {createRuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResult as createResult} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultArtifacts.js";
import {createRuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultResultActions as createActions} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultActions.js";
import type {
  RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultActionsOptions as ResultOptions,
  RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultEvidence as Result,
} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultContract.js";

type ParentOptions = Omit<VerifiedOptions, "onVerificationResultArtifactVerifierEvidenceVerify">;

export type RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultWorkflowOptions =
  ParentOptions &
  Omit<ResultOptions, "maxPreviewCharacters" | "onCreate" | "onArtifactDownload" | "onDownloadAll" | "onArtifactCopy"> & {
    maxArtifactVerifierEvidenceVerificationResultPreviewCharacters?: number;
    onArtifactVerifierEvidenceVerificationResultCreate?: (result: Result, verification: Verification, source: Source) => void;
    onArtifactVerifierEvidenceVerificationResultArtifactDownload?: ResultOptions["onArtifactDownload"];
    onArtifactVerifierEvidenceVerificationResultDownloadAll?: ResultOptions["onDownloadAll"];
    onArtifactVerifierEvidenceVerificationResultArtifactCopy?: ResultOptions["onArtifactCopy"];
    onVerificationResultArtifactVerifierEvidenceVerify?: (result: Verification, evidence: Source) => void;
    onArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerify?: (result: Verification, evidence: Source) => void;
  };

export function createRuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultWorkflow(
  verification: ProvenanceVerification,
  provenance: Provenance,
  options: RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultWorkflowOptions = {},
): HTMLElement {
  const root = document.createElement("section");
  Object.assign(root.style, {display: "grid", gap: "5px", minWidth: "0"});
  let sequence = 0;
  const {
    onVerificationResultArtifactVerifierEvidenceVerify: currentVerify,
    onArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerify: stageVerify,
    ...parentOptions
  } = options;
  const workflow = createVerifiedWorkflow(verification, provenance, {
    ...parentOptions,
    onVerificationResultArtifactVerifierEvidenceVerify: (value: Verification, source: Source) => {
      currentVerify?.(value, source);
      stageVerify?.(value, source);
      const current = ++sequence;
      root.dataset.artifactVerifierEvidenceVerificationResultSequence = String(current);
      void render(root, current, value, source, options);
    },
  });
  root.append(workflow);
  return root;
}

async function render(
  root: HTMLElement,
  sequence: number,
  verification: Verification,
  source: Source,
  options: RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultWorkflowOptions,
): Promise<void> {
  const result = await createResult(verification, source);
  if (sequence !== Number(root.dataset.artifactVerifierEvidenceVerificationResultSequence)) return;
  root.querySelector<HTMLElement>("[data-artifact-verifier-evidence-verification-result-actions]")?.remove();
  options.onArtifactVerifierEvidenceVerificationResultCreate?.(result, verification, source);
  const actions = createActions(result, {
    ...(options.maxArtifactVerifierEvidenceVerificationResultPreviewCharacters === undefined ? {} : {maxPreviewCharacters: options.maxArtifactVerifierEvidenceVerificationResultPreviewCharacters}),
    ...(options.onArtifactVerifierEvidenceVerificationResultArtifactDownload === undefined ? {} : {onArtifactDownload: options.onArtifactVerifierEvidenceVerificationResultArtifactDownload}),
    ...(options.onArtifactVerifierEvidenceVerificationResultDownloadAll === undefined ? {} : {onDownloadAll: options.onArtifactVerifierEvidenceVerificationResultDownloadAll}),
    ...(options.onArtifactVerifierEvidenceVerificationResultArtifactCopy === undefined ? {} : {onArtifactCopy: options.onArtifactVerifierEvidenceVerificationResultArtifactCopy}),
    ...(options.onStatus === undefined ? {} : {onStatus: options.onStatus}),
  });
  actions.dataset.artifactVerifierEvidenceVerificationResultActions = "true";
  root.append(actions);
}
