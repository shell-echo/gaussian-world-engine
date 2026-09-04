import type {RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceResult as Evidence} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceContract.js";
import type {
  RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationControlOptions as Options,
  RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResult as Result,
} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationContract.js";
import {verifyRuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceArtifact as verifyEvidence} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationVerifier.js";

export function createRuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationControl(
  evidence:Evidence,
  options:Options={},
):HTMLElement{
  const root=document.createElement("section");
  root.className="mission-debug-diagnostics-verification-result-artifact-verifier-evidence-verification";
  Object.assign(root.style,{display:"grid",gap:"5px",minWidth:"0"});
  root.dataset.verificationResultArtifactVerifierEvidenceVerificationStatus="idle";
  const button=createButton(
    "Verify verification-result artifact-verifier evidence artifacts",
    "schema · canonical JSON · exact 0.102 verification-result bytes · recorded 0.103 result · text evidence · JSON SHA-256 · trust anchors",
  );
  const details=document.createElement("details");
  details.hidden=true;
  Object.assign(details.style,{minWidth:"0",padding:"6px 7px",borderRadius:"7px"});
  button.addEventListener("click",()=>void run(root,button,details,evidence,options));
  root.append(button,details);
  return root;
}

async function run(root:HTMLElement,button:HTMLButtonElement,details:HTMLDetailsElement,evidence:Evidence,options:Options):Promise<void>{
  button.disabled=true;
  root.dataset.verificationResultArtifactVerifierEvidenceVerificationStatus="verifying";
  try{
    const output=await verifyEvidence(evidence,options.expectedVerification,options.expectedSource,options.expectedInputResultChecksumHex);
    updateDataset(root,output);
    render(details,output);
    options.onVerify?.(output,evidence);
    options.onStatus?.(
      output.valid
        ? `Verification-result artifact-verifier evidence artifacts verified with ${output.trust} trust.`
        : `Verification-result artifact-verifier evidence verification failed with ${output.issues.length} issues.`,
    );
  }catch(error){
    root.dataset.verificationResultArtifactVerifierEvidenceVerificationStatus="error";
    details.hidden=false;
    details.open=true;
    const summary=document.createElement("summary");
    const message=document.createElement("small");
    summary.textContent="Verification-result artifact-verifier evidence verification error";
    message.textContent=error instanceof Error?error.message:String(error);
    details.replaceChildren(summary,message);
    options.onStatus?.(`Verification-result artifact-verifier evidence verification error: ${message.textContent}`);
  }finally{
    button.disabled=false;
  }
}

function createButton(label:string,tip:string):HTMLButtonElement{
  const button=document.createElement("button");
  button.type="button";
  Object.assign(button.style,{display:"grid",width:"100%",gap:"2px",textAlign:"left"});
  const title=document.createElement("span");
  const description=document.createElement("small");
  title.textContent=label;
  description.textContent=tip;
  description.style.fontSize="9px";
  description.style.opacity="0.66";
  button.title=tip;
  button.setAttribute("aria-label",`${label}. ${tip}`);
  button.append(title,description);
  return button;
}

function render(details:HTMLDetailsElement,value:Result):void{
  details.hidden=false;
  details.open=!value.valid;
  const summary=document.createElement("summary");
  summary.textContent=value.valid
    ? `Artifact-verifier evidence · passed · ${value.trust}`
    : `Artifact-verifier evidence · failed · ${value.issues.length} issues`;
  const body=document.createElement("div");
  Object.assign(body.style,{display:"grid",gap:"4px",marginTop:"6px"});
  const lines=value.document
    ? [
        `schema/version ${value.document.schema} / ${value.document.schemaVersion}`,
        `recorded 0.103 result ${value.document.result.valid} / ${value.document.result.trust}`,
        `canonical JSON ${value.checks.canonical}`,
        `input envelope ${value.checks.input}`,
        `recorded result ${value.checks.recordedResult}`,
        `verification checks ${value.checks.verificationChecks}`,
        `trust anchors ${value.checks.anchors}`,
        `issue evidence ${value.checks.issues}`,
        `text evidence ${value.checks.textEvidence}`,
        `artifact envelope ${value.checks.artifactEnvelope}`,
        `JSON SHA-256 ${value.checksumHex??"unavailable"}`,
        `issues ${value.issues.length}`,
      ]
    : [`canonical JSON ${value.checks.canonical}`,`issues ${value.issues.length}`];
  for(const line of lines){
    const item=document.createElement("small");
    item.textContent=line;
    item.style.overflowWrap="anywhere";
    body.append(item);
  }
  if(value.issues.length){
    const list=document.createElement("ul");
    Object.assign(list.style,{margin:"0",padding:"0",listStyle:"none",display:"grid",gap:"3px"});
    for(const issue of value.issues){
      const item=document.createElement("li");
      item.textContent=`${issue.code} ${issue.path} · ${issue.message}`;
      item.style.fontSize="9px";
      item.style.overflowWrap="anywhere";
      list.append(item);
    }
    body.append(list);
  }
  details.replaceChildren(summary,body);
}

function updateDataset(root:HTMLElement,value:Result):void{
  root.dataset.verificationResultArtifactVerifierEvidenceVerificationStatus=value.valid?"verified":"failed";
  root.dataset.verificationResultArtifactVerifierEvidenceVerificationValid=String(value.valid);
  root.dataset.verificationResultArtifactVerifierEvidenceVerificationTrust=value.trust;
  root.dataset.verificationResultArtifactVerifierEvidenceVerificationIssueCount=String(value.issues.length);
  if(value.document){
    root.dataset.verificationResultArtifactVerifierEvidenceVerificationSchemaVersion=String(value.document.schemaVersion);
    root.dataset.verificationResultArtifactVerifierEvidenceVerificationRecordedValid=String(value.document.result.valid);
    root.dataset.verificationResultArtifactVerifierEvidenceVerificationRecordedTrust=value.document.result.trust;
  }
  if(value.checksumHex)root.dataset.verificationResultArtifactVerifierEvidenceVerificationChecksum=value.checksumHex;
}
