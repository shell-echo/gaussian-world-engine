import type {RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceResult as Provenance} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenance.js";
import type {RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationResult as ProvenanceVerification} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerification.js";
import type {RuntimeNavMissionDiagnosticsVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultEvidence as Source} from "./NavMissionDiagnosticsVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultContract.js";
import type {RuntimeNavMissionDiagnosticsVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultVerificationResult as Verification} from "./NavMissionDiagnosticsVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultVerificationContract.js";
import {createRuntimeNavMissionDiagnosticsVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultVerifiedWorkflow as createVerifiedWorkflow} from "./NavMissionDiagnosticsVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultVerificationControl.js";
import type {RuntimeNavMissionDiagnosticsVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultVerifiedWorkflowOptions as VerifiedOptions} from "./NavMissionDiagnosticsVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultVerificationControl.js";
import {createRuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidence as createEvidence} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceArtifacts.js";
import {createRuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceResultActions as createActions} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceActions.js";
import type {RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceActionsOptions as EvidenceOptions,RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceResult as Evidence} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceContract.js";
import {createRuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationControl as createVerificationControl} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationControl.js";
import type {RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResult as EvidenceVerification} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationContract.js";

type ParentOptions=Omit<VerifiedOptions,"onVerificationResultVerifierEvidenceVerify">;
export type RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceWorkflowOptions=ParentOptions&Omit<EvidenceOptions,"maxPreviewCharacters"|"onCreate"|"onArtifactDownload"|"onDownloadAll"|"onArtifactCopy">&{
  maxVerificationResultVerifierEvidencePreviewCharacters?:number;
  onVerificationResultVerifierEvidenceCreate?:(evidence:Evidence,verification:Verification,source:Source)=>void;
  onVerificationResultVerifierEvidenceArtifactDownload?:EvidenceOptions["onArtifactDownload"];
  onVerificationResultVerifierEvidenceDownloadAll?:EvidenceOptions["onDownloadAll"];
  onVerificationResultVerifierEvidenceArtifactCopy?:EvidenceOptions["onArtifactCopy"];
  expectedVerificationResultVerifierEvidenceVerification?:Verification;
  expectedVerificationResultVerifierEvidenceSource?:Source;
  expectedVerificationResultVerifierEvidenceInputChecksumHex?:string;
  onVerificationResultVerifierEvidenceVerify?:(result:EvidenceVerification,evidence:Evidence)=>void;
  onArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerify?:(result:EvidenceVerification,evidence:Evidence)=>void;
};

export function createRuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceWorkflow(verification:ProvenanceVerification,provenance:Provenance,options:RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceWorkflowOptions={}):HTMLElement{
  const root=document.createElement("section");Object.assign(root.style,{display:"grid",gap:"5px",minWidth:"0"});let sequence=0;
  const {onVerificationResultVerifierEvidenceVerify:currentVerify,onArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerify:stageVerify,...parentOptions}=options;
  const workflow=createVerifiedWorkflow(verification,provenance,{...parentOptions,onArtifactVerifierEvidenceVerificationResultVerify:(value:Verification,source:Source)=>{parentOptions.onArtifactVerifierEvidenceVerificationResultVerify?.(value,source);const current=++sequence;root.dataset.verificationResultVerifierEvidenceSequence=String(current);void render(root,current,value,source,options,currentVerify,stageVerify)}});
  root.append(workflow);return root;
}

async function render(root:HTMLElement,sequence:number,verification:Verification,source:Source,options:RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceWorkflowOptions,currentVerify:((result:EvidenceVerification,evidence:Evidence)=>void)|undefined,stageVerify:((result:EvidenceVerification,evidence:Evidence)=>void)|undefined):Promise<void>{
  const evidence=await createEvidence(verification,source);
  if(sequence!==Number(root.dataset.verificationResultVerifierEvidenceSequence))return;
  root.querySelector<HTMLElement>("[data-verification-result-verifier-evidence-actions]")?.remove();
  root.querySelector<HTMLElement>("[data-verification-result-verifier-evidence-verifier]")?.remove();
  options.onVerificationResultVerifierEvidenceCreate?.(evidence,verification,source);
  const actions=createActions(evidence,{...(options.maxVerificationResultVerifierEvidencePreviewCharacters===undefined?{}:{maxPreviewCharacters:options.maxVerificationResultVerifierEvidencePreviewCharacters}),...(options.onVerificationResultVerifierEvidenceArtifactDownload===undefined?{}:{onArtifactDownload:options.onVerificationResultVerifierEvidenceArtifactDownload}),...(options.onVerificationResultVerifierEvidenceDownloadAll===undefined?{}:{onDownloadAll:options.onVerificationResultVerifierEvidenceDownloadAll}),...(options.onVerificationResultVerifierEvidenceArtifactCopy===undefined?{}:{onArtifactCopy:options.onVerificationResultVerifierEvidenceArtifactCopy}),...(options.onStatus===undefined?{}:{onStatus:options.onStatus})});
  actions.dataset.verificationResultVerifierEvidenceActions="true";root.append(actions);
  if(evidence.status!=="created")return;
  const control=createVerificationControl(evidence,{expectedVerification:options.expectedVerificationResultVerifierEvidenceVerification??verification,expectedSource:options.expectedVerificationResultVerifierEvidenceSource??source,...(options.expectedVerificationResultVerifierEvidenceInputChecksumHex===undefined?{}:{expectedInputResultChecksumHex:options.expectedVerificationResultVerifierEvidenceInputChecksumHex}),onVerify:(result,artifactSet)=>{currentVerify?.(result,artifactSet);stageVerify?.(result,artifactSet)},...(options.onStatus===undefined?{}:{onStatus:options.onStatus})});
  control.dataset.verificationResultVerifierEvidenceVerifier="true";root.append(control);
}
