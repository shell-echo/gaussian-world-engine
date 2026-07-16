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

  const summary = document.createElement("summary");
  summary.className = "mission-debug-diagnostics-manifest-validation-summary";
  summary.textContent = formatValidationSummary(validation);

  const body = document.createElement("div");
  body.className = "mission-debug-diagnostics-manifest-validation-body";

  if (validation.issues.length === 0) {
    const empty = document.createElement("small");
    empty.className = "mission-debug-diagnostics-manifest-validation-empty";
    empty.textContent = "No manifest authoring validation issues.";
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

  const title = document.createElement("strong");
  title.textContent = formatIssueCount(matchingIssues.length, severity);

  const list = document.createElement("ul");
  list.className = "mission-debug-diagnostics-manifest-validation-list";
  for (const issue of matchingIssues) list.append(createIssueRow(issue));

  group.append(title, list);
  body.append(group);
}

function createIssueRow(issue: RuntimeNavMissionDiagnosticsManifestAuthoringValidationIssue): HTMLLIElement {
  const row = document.createElement("li");
  row.className = `mission-debug-diagnostics-manifest-validation-issue ${issue.severity}`;

  const heading = document.createElement("span");
  heading.className = "mission-debug-diagnostics-manifest-validation-issue-heading";

  const code = document.createElement("b");
  code.textContent = issue.code;

  const path = document.createElement("code");
  path.textContent = issue.path;

  const message = document.createElement("small");
  message.textContent = issue.message;

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
