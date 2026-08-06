import type { RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportDocument as ReportDocument } from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReport.js";
import type { RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportTrust as Trust, RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationAnchors as Anchors, RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationChecks as Checks } from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerification.js";
import type { RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationEvidenceDocument as Document } from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerificationEvidenceContract.js";
export const JSON_MIME="application/json;charset=utf-8" as const;
export const TEXT_MIME="text/plain;charset=utf-8" as const;
const safe=/^[a-zA-Z0-9._-]+$/;
export const checkFields=["parsed","schema","canonical","input","sourceArchive","result","verificationChecks","anchors","evidence","issues","jsonChecksum","textReport","artifactEnvelope"] as const;
export const anchorFields=["expectedReport","verification","provenance","jsonChecksumArtifact","textReportArtifact"] as const;
export const evidenceFields=["documentAvailable","canonicalTextAvailable","canonicalTextMatchesInput","verificationChecksumAvailable","verificationChecksumMatchesInput","issuesTruncated"] as const;
export function copyChecks(v:Checks):Checks{return {...v};}
export function copyAnchors(v:Anchors):Anchors{return {...v};}
export function recorded(v:ReportDocument|null):Document["recordedReport"]{return v?{schema:typeof v.schema==="string"&&v.schema.length<=512?v.schema:null,schemaVersion:Number.isSafeInteger(v.schemaVersion)?v.schemaVersion:null,provenanceResultValid:typeof v.result?.valid==="boolean"?v.result.valid:null,provenanceResultTrust:isTrust(v.result?.trust)?v.result.trust:null}:{schema:null,schemaVersion:null,provenanceResultValid:null,provenanceResultTrust:null};}
export function readTarget(v:unknown):unknown{return record(v)&&Object.hasOwn(v,"target")?v.target:null;}
export function target(v:unknown):unknown{if(!record(v))return null;const scope=typeof v.scope==="string"&&v.scope.length<=64?v.scope:null;const packageIndex=v.packageIndex===null||(typeof v.packageIndex==="number"&&Number.isSafeInteger(v.packageIndex)&&v.packageIndex>=0)?v.packageIndex:null;return {packageIndex,scope};}
export function filenames(source:string){let base="mission-diagnostics-policy-manifest.provenance-verification-report";if(isSafe(source)&&source.endsWith(".json"))base=source.slice(0,-5);base+= ".verification-evidence";return {text:`${base}.txt`,json:`${base}.json`,checksum:`${base}.json.sha256`};}
export function isSafe(v:string):boolean{return v.length>0&&v.length<=255&&safe.test(v);}
export function string(v:string,n:number,f:string):string{return v.length>0&&v.length<=n?v:f;}
export function integer(v:number):number{return Number.isSafeInteger(v)&&v>=0?v:0;}
export function checksum(v:string):string{return /^[0-9a-f]{64}$/.test(v)?v:"0".repeat(64);}
function isTrust(v:unknown):v is Trust{return v==="anchored"||v==="self-consistent"||v==="untrusted";}
function record(v:unknown):v is Record<string,unknown>{return v!==null&&typeof v==="object"&&!Array.isArray(v);}
