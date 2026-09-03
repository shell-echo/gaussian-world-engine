import {RUNTIME_NAV_MISSION_DIAGNOSTICS_VERIFIER_EVIDENCE_VERIFICATION_RESULT_VERIFIER_EVIDENCE_VERIFICATION_RESULT_ORDER as SOURCE_ORDER} from "./NavMissionDiagnosticsVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultContract.js";
import type {RuntimeNavMissionDiagnosticsVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifact as SourceArtifact,RuntimeNavMissionDiagnosticsVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultEvidence as Source} from "./NavMissionDiagnosticsVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultContract.js";
import type {RuntimeNavMissionDiagnosticsVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultVerificationResult as Verification} from "./NavMissionDiagnosticsVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultVerificationContract.js";
import type {RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceDocument as Document} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceContract.js";
import type {RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationAnchors as Anchors,RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceAnchoredVerificationOptions as AnchoredOptions,RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationChecks as Checks,RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationIssue as Issue,RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationOptions as Options,RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResult as Result} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationContract.js";
import {verifyRuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceDocument as verifyDocument} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationDocument.js";
import {JSON_MIME,add,anchors,canonical,checks,digest,equal,expectedText,finalize,isRecord,normalizedChecksum,normalizedInteger,normalizedIssue,normalizedString,result,safe,sha,target,type Limits} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationSupport.js";

export * from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationContract.js";
const DEFAULTS={maxTextBytes:4*1024*1024,maxStringCharacters:1024*1024,maxArrayEntries:512,maxObjectFields:64,maxDepth:32};
const MAX_ISSUES=512;

export async function verifyRuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceText(text:string,options:Options={}):Promise<Result>{
  const verificationChecks=checks(options.checksumArtifactText!==undefined,options.textEvidenceText!==undefined);
  const verificationAnchors=anchors(false,false,options.expectedInputResultChecksumHex!==undefined,options.checksumArtifactText!==undefined,options.textEvidenceText!==undefined);
  if(typeof text!=="string")return early("text-invalid","$","Verifier-evidence input must be a string.",verificationChecks,verificationAnchors);
  const bytes=new TextEncoder().encode(text).byteLength,limits=normalize(options);
  if(bytes>limits.maxTextBytes)return early("text-size-invalid","$",`Verifier-evidence exceeds ${limits.maxTextBytes} bytes.`,verificationChecks,verificationAnchors,bytes);
  let parsed:unknown;
  try{parsed=JSON.parse(text);verificationChecks.parsed=true}catch{return early("json-parse-failed","$","Verifier-evidence text is not valid JSON.",verificationChecks,verificationAnchors,bytes)}
  if(!isRecord(parsed))return early("document-type-invalid","$","Verifier-evidence root must be a plain object.",verificationChecks,verificationAnchors,bytes);
  const issues:Issue[]=[];
  const canonicalText=`${JSON.stringify(canonical(parsed),null,2)}\n`;
  verificationChecks.canonical=canonicalText===text;
  if(!verificationChecks.canonical)add(issues,"canonical-json-mismatch","$","Verifier-evidence JSON is not canonical.");
  const document=verifyDocument(parsed,limits,issues,verificationChecks);
  verificationChecks.textEvidence=verifyTextArtifact(document,options,issues,verificationAnchors);
  inputAnchor(document,options.expectedInputResultChecksumHex,issues,verificationAnchors);
  let checksumHex:string|null=null;
  const subtle=globalThis.crypto?.subtle;
  if(!subtle)add(issues,"crypto-unavailable","$","Web Crypto SHA-256 is unavailable.");
  else{checksumHex=await digest(text,subtle);verificationChecks.jsonChecksum=verifyChecksumArtifact(checksumHex,options,issues,verificationAnchors)}
  const output=result(document,canonicalText,bytes,checksumHex,issues,verificationChecks,verificationAnchors);
  finalize(output);
  return output;
}

export async function verifyRuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceTextAnchored(text:string,options:AnchoredOptions={}):Promise<Result>{
  const core:Options={
    ...(options.maxTextBytes===undefined?{}:{maxTextBytes:options.maxTextBytes}),
    ...(options.maxStringCharacters===undefined?{}:{maxStringCharacters:options.maxStringCharacters}),
    ...(options.maxArrayEntries===undefined?{}:{maxArrayEntries:options.maxArrayEntries}),
    ...(options.maxObjectFields===undefined?{}:{maxObjectFields:options.maxObjectFields}),
    ...(options.maxDepth===undefined?{}:{maxDepth:options.maxDepth}),
    ...(options.jsonFilename===undefined?{}:{jsonFilename:options.jsonFilename}),
    ...(options.checksumArtifactText===undefined?{}:{checksumArtifactText:options.checksumArtifactText}),
    ...(options.checksumArtifactFilename===undefined?{}:{checksumArtifactFilename:options.checksumArtifactFilename}),
    ...(options.textEvidenceText===undefined?{}:{textEvidenceText:options.textEvidenceText}),
    ...(options.textEvidenceFilename===undefined?{}:{textEvidenceFilename:options.textEvidenceFilename}),
    ...(options.expectedInputResultChecksumHex===undefined?{}:{expectedInputResultChecksumHex:options.expectedInputResultChecksumHex})
  };
  const output=await verifyRuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceText(text,core);
  if(output.document)await verifyTrustedAnchors(output.document,options,output);else{if(options.expectedVerification)output.anchors.expectedVerification=false;if(options.expectedSource)output.anchors.expectedSource=false}
  finalize(output);
  return output;
}

function verifyChecksumArtifact(hash:string,options:Options,issues:Issue[],verificationAnchors:Anchors):boolean{
  if(options.checksumArtifactText===undefined)return true;
  const name=options.jsonFilename;
  let valid=typeof name==="string"&&safe(name)&&options.checksumArtifactText===`${hash}  ${name}\n`;
  if(options.checksumArtifactFilename!==undefined)valid=valid&&options.checksumArtifactFilename===`${name}.sha256`;
  if(!valid)add(issues,"checksum-artifact-invalid","$.artifacts","Verifier-evidence JSON SHA-256 artifact is invalid.");
  verificationAnchors.jsonChecksumArtifact=valid;
  return valid;
}

function verifyTextArtifact(document:Document|null,options:Options,issues:Issue[],verificationAnchors:Anchors):boolean{
  if(options.textEvidenceText===undefined)return true;
  let valid=document!==null&&options.textEvidenceText===expectedText(document);
  if(options.textEvidenceFilename!==undefined&&options.jsonFilename!==undefined)valid=valid&&options.jsonFilename.endsWith(".json")&&options.textEvidenceFilename===`${options.jsonFilename.slice(0,-5)}.txt`;
  if(!valid)add(issues,"text-evidence-mismatch","$.artifacts","Verifier-evidence text artifact does not match the JSON document.");
  verificationAnchors.textEvidenceArtifact=valid;
  return valid;
}

function inputAnchor(document:Document|null,expected:string|undefined,issues:Issue[],verificationAnchors:Anchors):void{
  if(expected===undefined)return;
  const valid=sha(expected)&&document?.input.exactChecksum.hex===expected;
  if(!valid)add(issues,"expected-input-checksum-mismatch","$.input.exactChecksum.hex","Input artifact-verifier evidence verification-result checksum does not match the trusted anchor.");
  verificationAnchors.inputResultChecksum=valid;
}

async function verifyTrustedAnchors(document:Document,options:AnchoredOptions,output:Result):Promise<void>{
  await verifyExpectedVerification(document,options.expectedVerification,options.expectedSource,output);
  await verifyExpectedSource(document,options.expectedSource,output);
}

async function verifyExpectedVerification(document:Document,expected:Verification|undefined,source:Source|undefined,output:Result):Promise<void>{
  if(!expected)return;
  const sourceIssues=Array.isArray(expected.issues)?expected.issues:[],expectedIssues=sourceIssues.slice(0,MAX_ISSUES).map(normalizedIssue),subtle=globalThis.crypto?.subtle;
  let canonicalMatches=false;
  if(typeof expected.canonicalText==="string"&&subtle)canonicalMatches=await digest(expected.canonicalText,subtle)===document.input.exactChecksum.hex;
  const expectedEvidence={documentAvailable:expected.document!==null,canonicalTextAvailable:typeof expected.canonicalText==="string",canonicalTextMatchesInput:canonicalMatches,verificationChecksumAvailable:typeof expected.checksumHex==="string",verificationChecksumMatchesInput:typeof expected.checksumHex==="string"&&expected.checksumHex===document.input.exactChecksum.hex,issuesTruncated:sourceIssues.length>MAX_ISSUES};
  const recorded=source?.document??expected.document;
  const expectedRecorded={schema:typeof recorded?.schema==="string"?recorded.schema:null,schemaVersion:Number.isSafeInteger(recorded?.schemaVersion)?recorded!.schemaVersion:null,artifactVerifierEvidenceVerificationValid:typeof recorded?.result?.valid==="boolean"?recorded.result.valid:null,artifactVerifierEvidenceVerificationTrust:recorded?.result?.trust??null};
  const expectedTarget=target(expected.document?.target??source?.document?.target??null);
  const valid=document.result.valid===expected.valid&&document.result.trust===expected.trust&&document.result.issueCount===sourceIssues.length&&equal(document.checks,expected.checks)&&equal(document.anchors,expected.anchors)&&equal(document.evidence,expectedEvidence)&&equal(document.issues,expectedIssues)&&equal(document.recordedResult,expectedRecorded)&&equal(document.target,expectedTarget)&&(expected.checksumHex===null||expected.checksumHex===document.input.exactChecksum.hex);
  if(!valid)add(output.issues,"expected-verification-mismatch","$","Verifier-evidence does not match the expected 0.99 artifact verification result.");
  output.anchors.expectedVerification=valid;
}

async function verifyExpectedSource(document:Document,expected:Source|undefined,output:Result):Promise<void>{
  if(!expected)return;
  const artifact=oneSourceJson(expected.artifacts),subtle=globalThis.crypto?.subtle;
  if(!artifact||!subtle){add(output.issues,"expected-source-mismatch","$.input","Expected 0.98 verification-result JSON artifact is unavailable.");output.anchors.expectedSource=false;return}
  const text=typeof artifact.text==="string"?artifact.text:"",hash=await digest(text,subtle),name=typeof artifact.filename==="string"?artifact.filename:"",mime=typeof artifact.mimeType==="string"?artifact.mimeType:"",declaredBytes=typeof artifact.bytes==="number"?artifact.bytes:-1,declaredHash=typeof artifact.checksumHex==="string"?artifact.checksumHex:"",exactBytes=new TextEncoder().encode(text).byteLength,safeName=safe(name),recorded=expected.document;
  const expectedRecorded={schema:typeof recorded?.schema==="string"?recorded.schema:null,schemaVersion:Number.isSafeInteger(recorded?.schemaVersion)?recorded!.schemaVersion:null,artifactVerifierEvidenceVerificationValid:typeof recorded?.result?.valid==="boolean"?recorded.result.valid:null,artifactVerifierEvidenceVerificationTrust:recorded?.result?.trust??null};
  const valid=document.input.verificationResultJsonFilename===(safeName?name:"mission-diagnostics-policy-manifest.artifact-verifier-evidence.verification-result.json")&&document.input.verificationResultJsonMimeType===normalizedString(mime,255,"application/octet-stream")&&document.input.declaredBytes===normalizedInteger(declaredBytes)&&document.input.exactBytes===exactBytes&&document.input.declaredChecksumHex===normalizedChecksum(declaredHash)&&document.input.exactChecksum.hex===hash&&document.input.envelope.filenameSafe===safeName&&document.input.envelope.mimeTypeMatches===(mime===JSON_MIME)&&document.input.envelope.byteSizeMatches===(declaredBytes===exactBytes)&&document.input.envelope.checksumMatches===(declaredHash===hash)&&equal(document.recordedResult,expectedRecorded)&&equal(document.target,target(expected.document?.target??null));
  if(!valid)add(output.issues,"expected-source-mismatch","$.input","Verifier-evidence input does not match the expected 0.98 verification-result artifact set.");
  output.anchors.expectedSource=valid;
}

function oneSourceJson(artifacts:SourceArtifact[]|undefined):SourceArtifact|null{if(!Array.isArray(artifacts))return null;const found=artifacts.filter(artifact=>artifact?.kind===SOURCE_ORDER[1]);return found.length===1?found[0]??null:null}
function early(code:Issue["code"],path:string,message:string,verificationChecks:Checks,verificationAnchors:Anchors,bytes=0):Result{const issues:Issue[]=[];add(issues,code,path,message);return result(null,null,bytes,null,issues,verificationChecks,verificationAnchors)}
function normalize(options:Options):Limits{return {maxTextBytes:positive(options.maxTextBytes,DEFAULTS.maxTextBytes,"maxTextBytes"),maxStringCharacters:positive(options.maxStringCharacters,DEFAULTS.maxStringCharacters,"maxStringCharacters"),maxArrayEntries:positive(options.maxArrayEntries,DEFAULTS.maxArrayEntries,"maxArrayEntries"),maxObjectFields:positive(options.maxObjectFields,DEFAULTS.maxObjectFields,"maxObjectFields"),maxDepth:positive(options.maxDepth,DEFAULTS.maxDepth,"maxDepth")}}
function positive(value:number|undefined,fallback:number,label:string):number{if(value===undefined)return fallback;if(!Number.isSafeInteger(value)||value<=0)throw new Error(`${label} must be a positive safe integer.`);return value}
