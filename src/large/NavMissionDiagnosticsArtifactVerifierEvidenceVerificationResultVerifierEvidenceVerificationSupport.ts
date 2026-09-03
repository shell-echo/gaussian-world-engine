import type {RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceDocument as Document} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceContract.js";
import type {RuntimeNavMissionDiagnosticsVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultVerificationIssue as SourceIssue,RuntimeNavMissionDiagnosticsVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultVerificationIssueCode as SourceIssueCode} from "./NavMissionDiagnosticsVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultVerificationContract.js";
import type {RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationAnchors as Anchors,RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationChecks as Checks,RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationIssue as Issue,RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationIssueCode as Code,RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResult as Result} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationContract.js";

const SAFE = /^[a-zA-Z0-9._-]+$/;
const SHA = /^[0-9a-f]{64}$/;
export const JSON_MIME = "application/json;charset=utf-8" as const;
export const TEXT_MIME = "text/plain;charset=utf-8" as const;
export const SOURCE_CHECK_FIELDS = ["parsed","schema","canonical","input","recordedEvidence","result","verificationChecks","anchors","evidence","issues","jsonChecksum","textResult","artifactEnvelope"] as const;
export const SOURCE_ANCHOR_FIELDS = ["expectedVerification","expectedSource","inputEvidenceChecksum","jsonChecksumArtifact","textResultArtifact"] as const;
export const SOURCE_EVIDENCE_FIELDS = ["documentAvailable","canonicalTextAvailable","canonicalTextMatchesInput","verificationChecksumAvailable","verificationChecksumMatchesInput","issuesTruncated"] as const;

const ISSUE_MESSAGE: Record<SourceIssueCode,string> = {
  "text-invalid":"Artifact-verifier evidence verification-result text input is invalid.",
  "text-size-invalid":"Artifact-verifier evidence verification-result text exceeds the configured size limit.",
  "json-parse-failed":"Artifact-verifier evidence verification-result text is not valid JSON.",
  "document-type-invalid":"Artifact-verifier evidence verification-result root is not a plain JSON object.",
  "field-type-invalid":"A required verification-result field has an invalid type or is missing.",
  "field-value-invalid":"A verification-result field contains an invalid value.",
  "array-size-invalid":"A verification-result array exceeds the configured entry limit.",
  "string-size-invalid":"A verification-result string exceeds the configured character limit.",
  "schema-mismatch":"Verification-result schema does not match the required schema.",
  "schema-version-mismatch":"Verification-result schema version does not match the required version.",
  "unknown-field":"Verification-result contains a field not allowed by the fixed schema.",
  "canonical-json-mismatch":"Verification-result JSON is not canonical.",
  "input-envelope-mismatch":"Verification-result input envelope is inconsistent.",
  "recorded-evidence-mismatch":"Recorded artifact-verifier evidence metadata is inconsistent.",
  "result-mismatch":"Recorded verification-result relationship is inconsistent.",
  "verification-check-mismatch":"Recorded verification-result checks are inconsistent.",
  "anchor-mismatch":"Recorded verification-result anchors are inconsistent.",
  "evidence-mismatch":"Recorded verification-result evidence relationships are inconsistent.",
  "issue-count-mismatch":"Recorded verification-result issue count is inconsistent.",
  "issue-evidence-mismatch":"Recorded verification-result issue evidence is inconsistent.",
  "artifact-count-mismatch":"Verification-result artifact count is invalid.",
  "artifact-order-mismatch":"Verification-result artifacts are not in fixed order.",
  "artifact-metadata-mismatch":"Verification-result artifact metadata is inconsistent.",
  "text-result-mismatch":"Verification-result text artifact does not match the document.",
  "checksum-artifact-invalid":"Verification-result JSON SHA-256 artifact is invalid.",
  "expected-verification-mismatch":"Verification-result does not match the expected artifact-verifier evidence verification.",
  "expected-source-mismatch":"Verification-result does not match the expected artifact-verifier evidence source.",
  "expected-input-checksum-mismatch":"Verification-result input checksum does not match the trusted anchor.",
  "sha256-mismatch":"A verification-result SHA-256 value does not match exact text.",
  "crypto-unavailable":"Web Crypto SHA-256 was unavailable during verification-result artifact verification."
};

export interface Limits {maxTextBytes:number;maxStringCharacters:number;maxArrayEntries:number;maxObjectFields:number;maxDepth:number}
export type RecordValue = Record<string,unknown>;

export function isRecord(v:unknown):v is RecordValue{return v!==null&&typeof v==="object"&&!Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype}
export function canonical(v:unknown):unknown{if(Array.isArray(v))return v.map(canonical);if(isRecord(v)){const out:RecordValue={};for(const key of Object.keys(v).sort())out[key]=canonical(v[key]);return out}return v}
export function equal(a:unknown,b:unknown):boolean{return JSON.stringify(canonical(a))===JSON.stringify(canonical(b))}
export function safe(v:unknown):v is string{return typeof v==="string"&&v.length>0&&v.length<=255&&SAFE.test(v)}
export function sha(v:unknown):v is string{return typeof v==="string"&&SHA.test(v)}
export async function digest(text:string,subtle:SubtleCrypto):Promise<string>{const bytes=new TextEncoder().encode(text),copy=new Uint8Array(bytes.byteLength);copy.set(bytes);return Array.from(new Uint8Array(await subtle.digest("SHA-256",copy.buffer)),value=>value.toString(16).padStart(2,"0")).join("")}
export function add(issues:Issue[],code:Code,path:string,message:string):void{issues.push({code,path,message})}
export function checks(hasChecksum:boolean,hasText:boolean):Checks{return {parsed:false,schema:false,canonical:false,input:false,recordedResult:false,result:false,verificationChecks:false,anchors:false,evidence:false,issues:false,jsonChecksum:!hasChecksum,textEvidence:!hasText,artifactEnvelope:true}}
export function anchors(expectedVerification:boolean,expectedSource:boolean,inputChecksum:boolean,hasChecksum:boolean,hasText:boolean):Anchors{return {expectedVerification:expectedVerification?false:null,expectedSource:expectedSource?false:null,inputResultChecksum:inputChecksum?false:null,jsonChecksumArtifact:hasChecksum?false:null,textEvidenceArtifact:hasText?false:null}}
export function result(document:Result["document"],canonicalText:string|null,bytes:number,checksumHex:string|null,issues:Issue[],verificationChecks:Checks,verificationAnchors:Anchors):Result{return {valid:false,trust:"untrusted",document,canonicalText,bytes,checksumHex,issues,checks:verificationChecks,anchors:verificationAnchors}}
export function finalize(value:Result):void{value.valid=value.issues.length===0;if(!value.valid){value.trust="untrusted";return}const trusted=[value.anchors.expectedVerification,value.anchors.expectedSource,value.anchors.inputResultChecksum].filter((item):item is boolean=>item!==null);value.trust=trusted.length>0&&trusted.every(Boolean)?"anchored":"self-consistent"}

export function record(v:unknown,path:string,issues:Issue[]):RecordValue|null{if(isRecord(v))return v;add(issues,"field-type-invalid",path,"Value must be a plain object.");return null}
export function exact(v:RecordValue,fields:readonly string[],path:string,issues:Issue[]):void{const allowed=new Set(fields);for(const key of Object.keys(v))if(!allowed.has(key))add(issues,"unknown-field",`${path}.${key}`,`Unknown field ${key}.`);for(const field of fields)if(!Object.hasOwn(v,field))add(issues,"field-type-invalid",`${path}.${field}`,`Missing field ${field}.`)}
export function booleanField(v:unknown,path:string,issues:Issue[]):boolean|null{if(typeof v==="boolean")return v;add(issues,"field-type-invalid",path,"Value must be boolean.");return null}
export function integerField(v:unknown,path:string,issues:Issue[]):number|null{if(typeof v==="number"&&Number.isSafeInteger(v)&&v>=0)return v;add(issues,"field-type-invalid",path,"Value must be a non-negative safe integer.");return null}
export function stringField(v:unknown,path:string,max:number,issues:Issue[]):string|null{if(typeof v==="string"&&v.length>0&&v.length<=max)return v;add(issues,"field-value-invalid",path,`Value must be a string of 1-${max} characters.`);return null}
export function filenameField(v:unknown,path:string,issues:Issue[]):string|null{const value=stringField(v,path,255,issues);if(value&&!safe(value)){add(issues,"field-value-invalid",path,"Filename must be a safe basename.");return null}return value}
export function checksumField(v:unknown,path:string,issues:Issue[]):string|null{if(sha(v))return v;add(issues,"field-value-invalid",path,"Value must be lowercase SHA-256 hex.");return null}
export function trustField(v:unknown,path:string,issues:Issue[]):"anchored"|"self-consistent"|"untrusted"|null{if(v==="anchored"||v==="self-consistent"||v==="untrusted")return v;add(issues,"field-value-invalid",path,"Invalid trust value.");return null}
export function boolRecord(v:RecordValue|null,fields:readonly string[],path:string,issues:Issue[],nullable=false):boolean{if(!v)return false;const start=issues.length;exact(v,fields,path,issues);for(const field of fields)if(!(nullable&&v[field]===null))booleanField(v[field],`${path}.${field}`,issues);return issues.length===start}
export function bounds(v:unknown,path:string,depth:number,limits:Limits,issues:Issue[]):void{if(depth>limits.maxDepth){add(issues,"field-value-invalid",path,"Maximum nesting depth exceeded.");return}if(typeof v==="string"){if(v.length>limits.maxStringCharacters)add(issues,"string-size-invalid",path,"String limit exceeded.");return}if(Array.isArray(v)){if(v.length>limits.maxArrayEntries){add(issues,"array-size-invalid",path,"Array limit exceeded.");return}v.forEach((item,index)=>bounds(item,`${path}[${index}]`,depth+1,limits,issues));return}if(isRecord(v)){const keys=Object.keys(v);if(keys.length>limits.maxObjectFields){add(issues,"field-value-invalid",path,"Object field limit exceeded.");return}keys.forEach(key=>bounds(v[key],`${path}.${key}`,depth+1,limits,issues))}}

export function target(v:unknown):unknown{if(v===null||!isRecord(v))return null;const scope=typeof v.scope==="string"&&v.scope.length<=64?v.scope:null,packageIndex=v.packageIndex===null||(typeof v.packageIndex==="number"&&Number.isSafeInteger(v.packageIndex)&&v.packageIndex>=0)?v.packageIndex:null;return {packageIndex,scope}}
export function normalizedInteger(v:number):number{return Number.isSafeInteger(v)&&v>=0?v:0}
export function normalizedChecksum(v:string):string{return SHA.test(v)?v:"0".repeat(64)}
export function normalizedString(v:string,max:number,fallback:string):string{return v.length>0&&v.length<=max?v:fallback}
export function normalizedIssue(issue:SourceIssue):{code:SourceIssueCode;path:string;message:string}{const path=typeof issue.path==="string"&&issue.path.length?issue.path:"$";return {code:issue.code,path:path.slice(0,2048),message:ISSUE_MESSAGE[issue.code]}}
export function expectedIssueMessage(code:unknown):string|null{return typeof code==="string"&&Object.hasOwn(ISSUE_MESSAGE,code)?ISSUE_MESSAGE[code as SourceIssueCode]:null}

export function expectedText(document:Document):string{const lines=["Splat World Engine Artifact-Verifier Evidence Verification-Result Verifier Evidence","",`Schema: ${document.schema}`,`Schema version: ${document.schemaVersion}`,`Target: ${JSON.stringify(canonical(document.target))}`,"",`Verification-result artifact verification valid: ${document.result.valid}`,`Verification-result artifact verification trust: ${document.result.trust}`,`Verification-result artifact verification issue count: ${document.result.issueCount}`,"",`Artifact-verifier evidence verification-result JSON: ${document.input.verificationResultJsonFilename}`,`Artifact-verifier evidence verification-result exact bytes: ${document.input.exactBytes}`,`Artifact-verifier evidence verification-result exact SHA-256: ${document.input.exactChecksum.hex}`,`Envelope filename safe: ${document.input.envelope.filenameSafe}`,`Envelope MIME type matches: ${document.input.envelope.mimeTypeMatches}`,`Envelope byte size matches: ${document.input.envelope.byteSizeMatches}`,`Envelope checksum matches: ${document.input.envelope.checksumMatches}`,"",`Recorded result schema: ${document.recordedResult.schema??"unavailable"}`,`Recorded result schema version: ${document.recordedResult.schemaVersion??"unavailable"}`,`Recorded artifact-verifier evidence verification valid: ${document.recordedResult.artifactVerifierEvidenceVerificationValid??"unavailable"}`,`Recorded artifact-verifier evidence verification trust: ${document.recordedResult.artifactVerifierEvidenceVerificationTrust??"unavailable"}`,"","Verification checks"];
for(const field of SOURCE_CHECK_FIELDS)lines.push(`  ${field}: ${document.checks[field]}`);
lines.push("","Trusted anchors");
for(const field of SOURCE_ANCHOR_FIELDS){const value=document.anchors[field];lines.push(`  ${field}: ${value===null?"not-provided":value}`)}
lines.push("","Evidence relationships",`  documentAvailable: ${document.evidence.documentAvailable}`,`  canonicalTextAvailable: ${document.evidence.canonicalTextAvailable}`,`  canonicalTextMatchesInput: ${document.evidence.canonicalTextMatchesInput}`,`  verificationChecksumAvailable: ${document.evidence.verificationChecksumAvailable}`,`  verificationChecksumMatchesInput: ${document.evidence.verificationChecksumMatchesInput}`,`  issuesTruncated: ${document.evidence.issuesTruncated}`,"","Issues");
if(document.issues.length===0)lines.push("  none");else for(const issue of document.issues)lines.push(`  ${issue.code} ${issue.path}`,`    ${issue.message}`);
lines.push("",`Result: ${document.result.valid?"verification-result artifact verification passed":"verification-result artifact verification failed"}`);
return `${lines.join("\n")}\n`}
