import type {
  RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultActionsOptions as Options,
  RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultArtifact as Artifact,
  RuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultEvidence as Result,
} from "./NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifactVerifierEvidenceVerificationResultContract.js";

export function downloadArtifactVerifierEvidenceVerificationResultArtifact(artifact: Artifact): void {
  const blob = new Blob([artifact.text], {type: artifact.mimeType});
  const url = URL.createObjectURL(blob);
  try {
    const element = document.createElement("a");
    element.href = url;
    element.download = artifact.filename;
    element.rel = "noopener";
    document.body.append(element);
    element.click();
    element.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function downloadArtifactVerifierEvidenceVerificationResultArtifacts(result: Result): number {
  if (result.status !== "created") throw new Error(result.error ?? "Artifact-verifier evidence verification-result artifacts are unavailable.");
  for (const artifact of result.artifacts) downloadArtifactVerifierEvidenceVerificationResultArtifact(artifact);
  return result.artifacts.length;
}

export async function copyArtifactVerifierEvidenceVerificationResultArtifact(artifact: Artifact): Promise<void> {
  const clipboard = globalThis.navigator?.clipboard;
  if (!clipboard) throw new Error("Clipboard API is unavailable.");
  await clipboard.writeText(artifact.text);
}

export function artifactVerifierEvidenceVerificationResultInspection(artifact: Artifact, result: Result, max: number, options: Options): HTMLElement {
  const details = document.createElement("details");
  details.dataset.artifactVerifierEvidenceVerificationResultArtifactKind = artifact.kind;
  Object.assign(details.style, {minWidth: "0", padding: "6px 7px", border: "1px solid rgba(126, 231, 173, 0.24)", borderRadius: "7px"});
  const summary = document.createElement("summary");
  summary.textContent = `${artifact.filename} · ${bytes(artifact.bytes)} · SHA-256 ${artifact.checksumHex.slice(0, 12)}…`;
  const preview = document.createElement("pre");
  preview.textContent = artifact.text.length > max ? `${artifact.text.slice(0, max)}\n… preview truncated after ${max} characters` : artifact.text;
  Object.assign(preview.style, {maxHeight: "220px", overflow: "auto", whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontSize: "9px"});
  const box = document.createElement("div");
  const copy = button("Copy verification result artifact");
  const download = button("Download verification result artifact");
  Object.assign(box.style, {display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "4px"});
  copy.addEventListener("click", () => void copyArtifactVerifierEvidenceVerificationResultArtifact(artifact).then(() => {
    options.onArtifactCopy?.(artifact, result);
    options.onStatus?.(`Copied verification result artifact ${artifact.filename}.`);
  }).catch((error: unknown) => options.onStatus?.(`Verification result copy failed: ${format(error)}`)));
  download.addEventListener("click", () => {
    try {
      downloadArtifactVerifierEvidenceVerificationResultArtifact(artifact);
      options.onArtifactDownload?.(artifact, result);
      options.onStatus?.(`Downloaded verification result artifact ${artifact.filename}.`);
    } catch (error) {
      options.onStatus?.(`Verification result download failed: ${format(error)}`);
    }
  });
  box.append(copy, download);
  details.append(summary, preview, box);
  return details;
}

export function button(label: string): HTMLButtonElement {
  const value = document.createElement("button");
  value.type = "button";
  value.textContent = label;
  value.style.textAlign = "left";
  return value;
}
export function bytes(value: number): string { return value < 1024 ? `${value} B` : `${(value / 1024).toFixed(value >= 10240 ? 0 : 1)} KB`; }
export function format(error: unknown): string { return error instanceof Error ? error.message : String(error); }
