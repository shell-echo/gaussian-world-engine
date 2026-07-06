import type { RuntimeNavMissionDiagnosticsSeverityPolicy, RuntimeNavMissionPackageDiagnosticSeverity } from "./NavMissionPackageLoader";

interface MissionDiagnosticsConfigHost {
  missionDiagnostics?: {
    severityPolicy?: RuntimeNavMissionDiagnosticsSeverityPolicy;
  };
}

export function readRuntimeNavMissionDiagnosticsSeverityPolicy(
  manifest: MissionDiagnosticsConfigHost,
  url: URL,
): RuntimeNavMissionDiagnosticsSeverityPolicy | null {
  const source = manifest.missionDiagnostics?.severityPolicy;
  const policy: RuntimeNavMissionDiagnosticsSeverityPolicy = {
    codes: source?.codes ? { ...source.codes } : undefined,
    warningAsError: source?.warningAsError,
    hideInfo: source?.hideInfo,
  };
  for (const value of url.searchParams.getAll("missionDiagnosticSeverity")) {
    const [code, severity] = value.split(":");
    if (code && isDiagnosticSeverity(severity)) policy.codes = { ...(policy.codes ?? {}), [code]: severity };
  }
  if (url.searchParams.has("missionDiagnosticsStrict")) policy.warningAsError = true;
  if (url.searchParams.has("missionDiagnosticsNoInfo")) policy.hideInfo = true;
  return policy.codes || policy.warningAsError || policy.hideInfo ? policy : null;
}

function isDiagnosticSeverity(value: string | undefined): value is RuntimeNavMissionPackageDiagnosticSeverity {
  return value === "info" || value === "warning" || value === "error";
}
