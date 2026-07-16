import type {
  RuntimeNavMissionDiagnosticsManifestAuthoringValidationIssue,
  RuntimeNavMissionDiagnosticsManifestAuthoringValidationResult,
  RuntimeNavMissionDiagnosticsManifestAuthoringValidationSeverity,
} from "./NavMissionDiagnosticsManifestAuthoringValidation.js";

export function createRuntimeNavMissionDiagnosticsManifestHudValidationDetails(
  validation: RuntimeNavMissionDiagnosticsManifestAuthoringValidationResult,
): HTMLDetailsElement {
  const details = document.createElement("details");
  details.className = "mission-debug-diagnostics-manifest-validation";
  details.open = !validation.valid;
  details.dataset.valid = String(validation.valid);
  details.dataset.errors = String(validation.errors);
  details.dataset.warnings = String(validation.warnings);
  Object.assign(details.style, {
    flex: "1 0 100%",
    minWidth: "0",
    padding: "7px 8px",
    border: createValidationBorder(validation),
    borderRadius: "8px",
    background: createValidationBackground(validation),
    color: "rgba(255, 255, 255, 0.76)",
  });

  const summary = document.createElement("summary");
  summary.className = "mission-debug-diagnostics-manifest-validation-summary";
  summary.textContent = formatValidationSummary(validation);
  Object.assign(summary.style, {
    cursor: "pointer",
    fontSize: "10px",
    fontWeight: "750",
    lineHeight: "1.35",
    overflowWrap: "anywhere",
  });

  const body = document.createElement("div");
  body.className = "mission-debug-diagnostics-manifest-validation-body";
  Object.assign(body.style, {
    display: "grid",
    gap: "7px",
    marginTop: "7px",
  });

  if (validation.issues.length === 0) {
    const empty = document.createElement("small");
    empty.className = "mission-debug-diagnostics-manifest-validation-empty";
    empty.textContent = "No manifest authoring validation issues.";
    empty.style.color = "rgba(255, 255, 255, 0.52)";
    body.append(empty);
  } else {
    appendIssueGroup(body, "error", validation.issues);
    appendIssueGroup(body, "warning", validation.issues);
  }

  details.append(summary, body);
  return details;
}

function appendIssueGroup(
  body: HTMLElement,
  severity: RuntimeNavMissionDiagnosticsManifestAuthoringValidationSeverity,
  issues: RuntimeNavMissionDiagnosticsManifestAuthoringValidationIssue[],
): void {
  const matchingIssues = issues.filter((issue) => issue.severity === severity);
  if (matchingIssues.length === 0) return;

  const group = document.createElement("section");
  group.className = `mission-debug-diagnostics-manifest-validation-group ${severity}`;
  Object.assign(group.style, {
    display: "grid",
    gap: "5px",
  });

  const title = document.createElement("strong");
  title.textContent = formatIssueCount(matchingIssues.length, severity);
  Object.assign(title.style, {
    color: severity === "error" ? "#ff9b9b" : "#ffe2a2",
    fontSize: "9px",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  });

  const list = document.createElement("ul");
  list.className = "mission-debug-diagnostics-manifest-validation-list";
  Object.assign(list.style, {
    display: "grid",
    gap: "5px",
    margin: "0",
    padding: "0",
    listStyle: "none",
  });
  for (const issue of matchingIssues) list.append(createIssueRow(issue));

  group.append(title, list);
  body.append(group);
}

function createIssueRow(issue: RuntimeNavMissionDiagnosticsManifestAuthoringValidationIssue): HTMLLIElement {
  const row = document.createElement("li");
  row.className = `mission-debug-diagnostics-manifest-validation-issue ${issue.severity}`;
  Object.assign(row.style, {
    display: "grid",
    gap: "3px",
    minWidth: "0",
    padding: "6px 7px",
    border: issue.severity === "error" ? "1px solid rgba(255, 93, 93, 0.28)" : "1px solid rgba(255, 200, 87, 0.24)",
    borderRadius: "7px",
    background: issue.severity === "error" ? "rgba(255, 93, 93, 0.07)" : "rgba(255, 200, 87, 0.06)",
  });

  const heading = document.createElement("span");
  heading.className = "mission-debug-diagnostics-manifest-validation-issue-heading";
  Object.assign(heading.style, {
    display: "flex",
    flexWrap: "wrap",
    gap: "3px 6px",
    alignItems: "baseline",
    minWidth: "0",
  });

  const code = document.createElement("b");
  code.textContent = issue.code;
  Object.assign(code.style, {
    minWidth: "0",
    fontSize: "9px",
    overflowWrap: "anywhere",
  });

  const path = document.createElement("code");
  path.textContent = issue.path;
  Object.assign(path.style, {
    color: "rgba(255, 255, 255, 0.48)",
    fontSize: "9px",
    overflowWrap: "anywhere",
  });

  const message = document.createElement("small");
  message.textContent = issue.message;
  Object.assign(message.style, {
    color: "rgba(255, 255, 255, 0.62)",
    fontSize: "9px",
    lineHeight: "1.35",
    overflowWrap: "anywhere",
  });

  heading.append(code, path);
  row.append(heading, message);
  return row;
}

function formatValidationSummary(validation: RuntimeNavMissionDiagnosticsManifestAuthoringValidationResult): string {
  if (validation.issues.length === 0) return "Manifest validation · passed";
  const labels: string[] = [];
  if (validation.errors > 0) labels.push(formatIssueCount(validation.errors, "error"));
  if (validation.warnings > 0) labels.push(formatIssueCount(validation.warnings, "warning"));
  return `Manifest validation · ${labels.join(" · ")}`;
}

function formatIssueCount(
  count: number,
  severity: RuntimeNavMissionDiagnosticsManifestAuthoringValidationSeverity,
): string {
  return `${count} ${severity}${count === 1 ? "" : "s"}`;
}

function createValidationBorder(validation: RuntimeNavMissionDiagnosticsManifestAuthoringValidationResult): string {
  if (!validation.valid) return "1px solid rgba(255, 93, 93, 0.32)";
  if (validation.warnings > 0) return "1px solid rgba(255, 200, 87, 0.28)";
  return "1px solid rgba(118, 190, 255, 0.2)";
}

function createValidationBackground(validation: RuntimeNavMissionDiagnosticsManifestAuthoringValidationResult): string {
  if (!validation.valid) return "rgba(255, 93, 93, 0.055)";
  if (validation.warnings > 0) return "rgba(255, 200, 87, 0.045)";
  return "rgba(118, 190, 255, 0.035)";
}
