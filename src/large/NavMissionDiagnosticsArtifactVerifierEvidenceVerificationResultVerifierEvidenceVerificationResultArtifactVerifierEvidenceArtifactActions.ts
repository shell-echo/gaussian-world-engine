import type {
  RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceActionsOptions as Options,
  RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceArtifact as Artifact,
  RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceResult as Result,
} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceContract.js";

export function downloadArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceArtifact(artifact: Artifact): void {
  const blob = new Blob([artifact.text], {type: artifact.mimeType});
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = artifact.filename;
    link.rel = "noopener";
    document.body.append(link);
    link.click();
    link.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function downloadArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceArtifacts(result: Result): number {
  if (result.status !== "created") throw new Error(result.error ?? "Verification-result artifact-verifier evidence artifacts are unavailable.");
  for (const artifact of result.artifacts) {
    downloadArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceArtifact(artifact);
  }
  return result.artifacts.length;
}

export async function copyArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceArtifact(artifact: Artifact): Promise<void> {
  const clipboard = globalThis.navigator?.clipboard;
  if (!clipboard) throw new Error("Clipboard API is unavailable.");
  await clipboard.writeText(artifact.text);
}

export function artifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceInspection(
  artifact: Artifact,
  result: Result,
  max: number,
  options: Options,
): HTMLElement {
  const details = document.createElement("details");
  details.dataset.verificationResultArtifactVerifierEvidenceArtifactKind = artifact.kind;
  Object.assign(details.style, {minWidth: "0", padding: "6px 7px", border: "1px solid rgba(126, 231, 173, 0.24)", borderRadius: "7px"});
  const summary = document.createElement("summary");
  summary.textContent = `${artifact.filename} · ${bytes(artifact.bytes)} · SHA-256 ${artifact.checksumHex.slice(0, 12)}…`;
  const preview = document.createElement("pre");
  preview.textContent = artifact.text.length > max ? `${artifact.text.slice(0, max)}\n… preview truncated after ${max} characters` : artifact.text;
  Object.assign(preview.style, {maxHeight: "220px", overflow: "auto", whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontSize: "9px"});
  const actions = document.createElement("div");
  const copy = button("Copy artifact-verifier evidence artifact");
  const download = button("Download artifact-verifier evidence artifact");
  Object.assign(actions.style, {display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "4px"});
  copy.addEventListener("click", () => void copyArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceArtifact(artifact)
    .then(() => {
      options.onArtifactCopy?.(artifact, result);
      options.onStatus?.(`Copied artifact-verifier evidence artifact ${artifact.filename}.`);
    })
    .catch((error: unknown) => options.onStatus?.(`Artifact-verifier evidence copy failed: ${format(error)}`)));
  download.addEventListener("click", () => {
    try {
      downloadArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceArtifact(artifact);
      options.onArtifactDownload?.(artifact, result);
      options.onStatus?.(`Downloaded artifact-verifier evidence artifact ${artifact.filename}.`);
    } catch (error) {
      options.onStatus?.(`Artifact-verifier evidence download failed: ${format(error)}`);
    }
  });
  actions.append(copy, download);
  details.append(summary, preview, actions);
  return details;
}

export function button(label: string): HTMLButtonElement {
  const value = document.createElement("button");
  value.type = "button";
  value.textContent = label;
  value.style.textAlign = "left";
  return value;
}

export function bytes(value: number): string {
  return value < 1024 ? `${value} B` : `${(value / 1024).toFixed(value >= 10240 ? 0 : 1)} KB`;
}

export function format(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
