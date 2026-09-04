import type {RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceResult as Provenance} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenance.js";
import type {RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationResult as ProvenanceVerification} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerification.js";
import type {RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultEvidence as Source} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultContract.js";
import type {RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultVerificationResult as Verification} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultVerificationContract.js";
import {
  createRuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultWorkflow as createVerifiedWorkflow,
} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultWorkflow.js";
import type {RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultWorkflowOptions as VerifiedOptions} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultWorkflow.js";
import {createRuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidence as createEvidence} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceArtifacts.js";
import {createRuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceResultActions as createActions} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceActions.js";
import type {
  RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceActionsOptions as EvidenceOptions,
  RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceResult as Evidence,
} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceContract.js";

type ParentOptions = Omit<VerifiedOptions, "onVerificationResultVerifierEvidenceVerificationResultVerify">;

export type RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceWorkflowOptions =
  ParentOptions &
  Omit<EvidenceOptions, "maxPreviewCharacters" | "onCreate" | "onArtifactDownload" | "onDownloadAll" | "onArtifactCopy"> & {
    maxVerificationResultArtifactVerifierEvidencePreviewCharacters?: number;
    onVerificationResultArtifactVerifierEvidenceCreate?: (evidence: Evidence, verification: Verification, source: Source) => void;
    onVerificationResultArtifactVerifierEvidenceArtifactDownload?: EvidenceOptions["onArtifactDownload"];
    onVerificationResultArtifactVerifierEvidenceDownloadAll?: EvidenceOptions["onDownloadAll"];
    onVerificationResultArtifactVerifierEvidenceArtifactCopy?: EvidenceOptions["onArtifactCopy"];
    onVerificationResultVerifierEvidenceVerificationResultVerify?: (result: Verification, source: Source) => void;
    onArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultVerify?: (result: Verification, source: Source) => void;
  };

export function createRuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceWorkflow(
  verification: ProvenanceVerification,
  provenance: Provenance,
  options: RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceWorkflowOptions = {},
): HTMLElement {
  const root = document.createElement("section");
  Object.assign(root.style, {display: "grid", gap: "5px", minWidth: "0"});
  let sequence = 0;
  const {
    onVerificationResultVerifierEvidenceVerificationResultVerify: currentVerify,
    onArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultVerify: stageVerify,
    ...parentOptions
  } = options;
  const workflow = createVerifiedWorkflow(verification, provenance, {
    ...parentOptions,
    onVerificationResultVerifierEvidenceVerificationResultVerify: (result: Verification, source: Source) => {
      currentVerify?.(result, source);
      stageVerify?.(result, source);
      const current = ++sequence;
      root.dataset.verificationResultArtifactVerifierEvidenceSequence = String(current);
      void render(root, current, result, source, options);
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
  options: RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceWorkflowOptions,
): Promise<void> {
  const evidence = await createEvidence(verification, source);
  if (sequence !== Number(root.dataset.verificationResultArtifactVerifierEvidenceSequence)) return;
  root.querySelector<HTMLElement>("[data-verification-result-artifact-verifier-evidence-actions]")?.remove();
  options.onVerificationResultArtifactVerifierEvidenceCreate?.(evidence, verification, source);
  const actions = createActions(evidence, {
    ...(options.maxVerificationResultArtifactVerifierEvidencePreviewCharacters === undefined ? {} : {maxPreviewCharacters: options.maxVerificationResultArtifactVerifierEvidencePreviewCharacters}),
    ...(options.onVerificationResultArtifactVerifierEvidenceArtifactDownload === undefined ? {} : {onArtifactDownload: options.onVerificationResultArtifactVerifierEvidenceArtifactDownload}),
    ...(options.onVerificationResultArtifactVerifierEvidenceDownloadAll === undefined ? {} : {onDownloadAll: options.onVerificationResultArtifactVerifierEvidenceDownloadAll}),
    ...(options.onVerificationResultArtifactVerifierEvidenceArtifactCopy === undefined ? {} : {onArtifactCopy: options.onVerificationResultArtifactVerifierEvidenceArtifactCopy}),
    ...(options.onStatus === undefined ? {} : {onStatus: options.onStatus}),
  });
  actions.dataset.verificationResultArtifactVerifierEvidenceActions = "true";
  root.append(actions);
}
