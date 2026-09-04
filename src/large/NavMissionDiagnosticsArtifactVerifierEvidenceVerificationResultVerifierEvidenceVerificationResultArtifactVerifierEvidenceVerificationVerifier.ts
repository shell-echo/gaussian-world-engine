import {RUNTIME_NAV_MISSION_DIAGNOSTICS_ARTIFACT_VERIFIER_EVIDENCE_VERIFICATION_RESULT_VERIFIER_EVIDENCE_VERIFICATION_RESULT_ARTIFACT_VERIFIER_EVIDENCE_ORDER as ORDER} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceContract.js";
import type {
  RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceArtifact as Artifact,
  RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceResult as Evidence,
} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceContract.js";
import type {RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultVerificationResult as Verification} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultVerificationContract.js";
import type {RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultEvidence as ExpectedSource} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultContract.js";
import type {
  RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceAnchoredVerificationOptions as Options,
  RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResult as Result,
} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationContract.js";
import {verifyRuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceTextAnchored as verifyText} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationVerification.js";
import {
  JSON_MIME,
  TEXT_MIME,
  add,
  anchors,
  checks,
  digest,
  equal,
  finalize,
  result,
  safe,
} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationSupport.js";

export async function verifyRuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceArtifact(
  evidence:Evidence,
  expectedVerification?:Verification,
  expectedSource?:ExpectedSource,
  expectedInputResultChecksumHex?:string,
):Promise<Result>{
  const hasExpectedVerification=expectedVerification!==undefined;
  const hasExpectedSource=expectedSource!==undefined;
  const hasExpectedChecksum=expectedInputResultChecksumHex!==undefined;
  if(evidence.status!=="created")return failure("expected-source-mismatch",evidence.error??"Artifact-verifier evidence artifacts are unavailable.",hasExpectedVerification,hasExpectedSource,hasExpectedChecksum);
  if(!Array.isArray(evidence.artifacts)||evidence.artifacts.length!==3)return failure("artifact-count-mismatch","Artifact-verifier evidence must contain exactly three artifacts.",hasExpectedVerification,hasExpectedSource,hasExpectedChecksum);
  const [plain,json,sum]=evidence.artifacts;
  if(!plain||!json||!sum||plain.kind!==ORDER[0]||json.kind!==ORDER[1]||sum.kind!==ORDER[2])return failure("artifact-order-mismatch","Artifact-verifier evidence artifacts are not in fixed order.",hasExpectedVerification,hasExpectedSource,hasExpectedChecksum);
  const options:Options={
    jsonFilename:json.filename,
    checksumArtifactText:sum.text,
    checksumArtifactFilename:sum.filename,
    textEvidenceText:plain.text,
    textEvidenceFilename:plain.filename,
    ...(expectedVerification?{expectedVerification}:{}),
    ...(expectedSource?{expectedSource}:{}),
    ...(expectedInputResultChecksumHex?{expectedInputResultChecksumHex}:{}),
  };
  const output=await verifyText(json.text,options);
  await verifyEnvelope(evidence,output);
  finalize(output);
  return output;
}

async function verifyEnvelope(evidence:Evidence,output:Result):Promise<void>{
  const subtle=globalThis.crypto?.subtle;
  const start=output.issues.length;
  if(!subtle){output.checks.artifactEnvelope=false;return}
  if(evidence.artifactCount!==3||evidence.artifacts.length!==3)add(output.issues,"artifact-count-mismatch","$.artifacts","Artifact-verifier evidence artifact count must be three.");
  let total=0;
  for(let index=0;index<evidence.artifacts.length;index++){
    const artifact=evidence.artifacts[index];
    const kind=ORDER[index];
    const path=`$.artifacts[${index}]`;
    if(!artifact||artifact.kind!==kind){
      add(output.issues,"artifact-order-mismatch",path,"Artifact-verifier evidence artifact kind is out of order.");
      continue;
    }
    const bytes=new TextEncoder().encode(artifact.text).byteLength;
    const hash=await digest(artifact.text,subtle);
    const mime=kind===ORDER[1]?JSON_MIME:TEXT_MIME;
    total+=bytes;
    if(!safe(artifact.filename)||artifact.mimeType!==mime||artifact.bytes!==bytes)add(output.issues,"artifact-metadata-mismatch",path,"Artifact filename, MIME type, or byte size is invalid.");
    if(artifact.checksumHex!==hash)add(output.issues,"sha256-mismatch",`${path}.checksumHex`,"Artifact SHA-256 does not match exact UTF-8 text.");
  }
  verifyFilenames(evidence.artifacts,output);
  if(evidence.totalBytes!==total)add(output.issues,"artifact-metadata-mismatch","$.totalBytes","Artifact-verifier evidence totalBytes does not match exact artifact bytes.");
  if(output.document&&evidence.document&&!equal(output.document,evidence.document))add(output.issues,"expected-source-mismatch","$.document","Artifact-verifier evidence document does not match its JSON artifact.");
  output.checks.artifactEnvelope=output.issues.length===start;
}

function verifyFilenames(artifacts:Artifact[],output:Result):void{
  const [plain,json,sum]=artifacts;
  if(!plain||!json||!sum||!json.filename.endsWith(".json")){
    add(output.issues,"artifact-metadata-mismatch","$.artifacts","Artifact-verifier evidence artifact filenames are invalid.");
    return;
  }
  const base=json.filename.slice(0,-5);
  if(plain.filename!==`${base}.txt`||sum.filename!==`${json.filename}.sha256`)add(output.issues,"artifact-metadata-mismatch","$.artifacts","Artifact-verifier evidence artifact filenames are inconsistent.");
}

function failure(
  code:Result["issues"][number]["code"],
  message:string,
  expectedVerification:boolean,
  expectedSource:boolean,
  inputChecksum:boolean,
):Result{
  const verificationChecks=checks(true,true);
  verificationChecks.artifactEnvelope=false;
  const verificationAnchors=anchors(expectedVerification,expectedSource,inputChecksum,true,true);
  const issues:Result["issues"]=[];
  add(issues,code,"$",message);
  return result(null,null,0,null,issues,verificationChecks,verificationAnchors);
}
