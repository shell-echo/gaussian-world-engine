import type { RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceResult as Provenance } from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenance.js";
import type { RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationResult as ProvenanceVerification } from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerification.js";
import type { RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportResult as Report } from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReport.js";
import type { RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationResult as ReportVerification } from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerification.js";
import { createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerifiedActions as createVerifiedActions } from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerificationControl.js";
import type { RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerifiedActionsOptions as VerifiedOptions } from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerificationControl.js";
import { createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationEvidence as createEvidence } from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerificationEvidenceArtifacts.js";
import { createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationEvidenceResultActions as createEvidenceActions } from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerificationEvidenceActions.js";
import type { RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationEvidenceActionsOptions as EvidenceOptions, RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationEvidenceResult as Evidence } from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerificationEvidenceContract.js";

export type RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationEvidenceWorkflowOptions =
  VerifiedOptions &
  Omit<
    EvidenceOptions,
    "maxPreviewCharacters" | "onCreate" | "onArtifactDownload" | "onDownloadAll" | "onArtifactCopy"
  > & {
    maxEvidencePreviewCharacters?: number;
    onEvidenceCreate?: (evidence: Evidence, verification: ReportVerification, report: Report) => void;
    onEvidenceArtifactDownload?: EvidenceOptions["onArtifactDownload"];
    onEvidenceDownloadAll?: EvidenceOptions["onDownloadAll"];
    onEvidenceArtifactCopy?: EvidenceOptions["onArtifactCopy"];
  };

export function createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationEvidenceWorkflow(
  verification: ProvenanceVerification,
  provenance: Provenance,
  options: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationEvidenceWorkflowOptions = {},
): HTMLElement {
  const root = document.createElement("section");
  root.className = "mission-debug-diagnostics-manifest-validation-imported-archive-provenance-verification-report-verification-evidence-workflow";
  Object.assign(root.style, { display: "grid", gap: "5px", minWidth: "0" });
  let sequence = 0;
  const actions = createVerifiedActions(verification, provenance, {
    ...options,
    onReportVerify: (result, report) => {
      options.onReportVerify?.(result, report);
      const current = ++sequence;
      root.dataset.verifierEvidenceSequence = String(current);
      void renderEvidence(root, current, result, report, options);
    },
  });
  root.append(actions);
  return root;
}

async function renderEvidence(
  root: HTMLElement,
  sequence: number,
  verification: ReportVerification,
  report: Report,
  options: RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationEvidenceWorkflowOptions,
): Promise<void> {
  const evidence = await createEvidence(verification, report);
  if (sequence !== Number(root.dataset.verifierEvidenceSequence)) return;
  root.querySelector<HTMLElement>("[data-verifier-evidence-actions]")?.remove();
  options.onEvidenceCreate?.(evidence, verification, report);
  const actions = createEvidenceActions(evidence, {
    ...(options.maxEvidencePreviewCharacters === undefined ? {} : { maxPreviewCharacters: options.maxEvidencePreviewCharacters }),
    ...(options.onEvidenceArtifactDownload === undefined ? {} : { onArtifactDownload: options.onEvidenceArtifactDownload }),
    ...(options.onEvidenceDownloadAll === undefined ? {} : { onDownloadAll: options.onEvidenceDownloadAll }),
    ...(options.onEvidenceArtifactCopy === undefined ? {} : { onArtifactCopy: options.onEvidenceArtifactCopy }),
    ...(options.onStatus === undefined ? {} : { onStatus: options.onStatus }),
  });
  actions.dataset.verifierEvidenceActions = "true";
  root.append(actions);
}
