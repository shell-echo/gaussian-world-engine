import type {RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationIssue as SourceIssue} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerification.js";
import {normalizeIssue} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerificationEvidenceIssue.js";
import type {RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationEvidenceArtifactVerificationChecks as Checks,RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationEvidenceArtifactVerificationIssue as Issue} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerificationEvidenceArtifactVerificationContract.js";
import {ANCHOR_FIELDS,CHECK_FIELDS,add} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerificationEvidenceArtifactVerificationSupport.js";
import type {RecordValue} from "./NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerificationEvidenceArtifactVerificationFields.js";

const MAX=512;
export function relationships(result:RecordValue|null,checks:RecordValue|null,anchors:RecordValue|null,evidence:RecordValue|null,entries:unknown[]|null,verification:Checks,issues:Issue[]):void{
 if(!result||!checks||!anchors||!evidence||!entries)return;
 const valid=result.valid,trust=result.trust,count=result.issueCount;
 if(valid===true){for(const f of CHECK_FIELDS)if(checks[f]!==true){verification.verificationChecks=false;add(issues,"verification-check-mismatch",`$.checks.${f}`,"Recorded valid result requires every report-verifier check.")}}
 const trusted=ANCHOR_FIELDS.slice(0,3).map(f=>anchors[f]).filter((v):v is boolean=>typeof v==="boolean");
 if(trust==="anchored"&&(trusted.length===0||!trusted.every(Boolean))){verification.anchors=false;add(issues,"anchor-mismatch","$.anchors","Recorded anchored trust requires matching trusted anchors.")}
 if(trust==="self-consistent"&&trusted.length>0){verification.anchors=false;add(issues,"anchor-mismatch","$.anchors","Recorded self-consistent trust cannot claim trusted anchors.")}
 if(valid===true&&(evidence.documentAvailable!==true||evidence.canonicalTextAvailable!==true||evidence.canonicalTextMatchesInput!==true||evidence.verificationChecksumAvailable!==true||evidence.verificationChecksumMatchesInput!==true)){verification.evidence=false;add(issues,"evidence-mismatch","$.evidence","Recorded valid result requires complete canonical and checksum evidence.")}
 if(!evidence.issuesTruncated&&count!==entries.length)add(issues,"issue-count-mismatch","$.result.issueCount","Issue count does not match retained issues.");
 if(evidence.issuesTruncated&&(entries.length!==MAX||typeof count!=="number"||count<=entries.length))add(issues,"issue-count-mismatch","$.evidence.issuesTruncated","Truncated issue evidence is inconsistent.");
 entries.forEach((entry,index)=>{if(!entry||typeof entry!=="object"||Array.isArray(entry))return;const v=entry as Record<string,unknown>;if(typeof v.code!=="string"||typeof v.path!=="string"||typeof v.message!=="string")return;const normalized=normalizeIssue({code:v.code,path:v.path,message:""} as SourceIssue);if(v.path!==normalized.path||v.message!==normalized.message)add(issues,"issue-evidence-mismatch",`$.issues[${index}]`,"Issue path or normalized message is inconsistent.")});
}
