import "./NavMissionDebugPanel.css";
import type { GameplayEvent } from "../gameplay/GameplaySystem.js";
import type { RuntimeNavGameplayApi } from "./NavGameplayApi.js";
import {
  createRuntimeNavMissionDiagnosticsPolicyFromPreset,
  getRuntimeNavMissionDiagnosticsPolicyPreset,
  RUNTIME_NAV_MISSION_DIAGNOSTICS_POLICY_PRESETS,
} from "./NavMissionDiagnosticsPolicyPresets.js";
import type { RuntimeNavMissionDiagnosticsPolicyPresetId } from "./NavMissionDiagnosticsPolicyPresets.js";
import type {
  RuntimeNavMissionDiagnosticsSeverityPolicy,
  RuntimeNavMissionPackageDiagnosticsReport,
  RuntimeNavMissionPackageDiagnostic,
} from "./NavMissionPackageLoader.js";
import type { RuntimeNavMissionRunnerEvent } from "./NavMissionRunner.js";

export interface RuntimeNavMissionDiagnosticsPolicyEditorPresetSelection {
  id: RuntimeNavMissionDiagnosticsPolicyPresetId;
  label: string;
  description: string;
  policy: RuntimeNavMissionDiagnosticsSeverityPolicy | null;
}

export interface RuntimeNavMissionDebugPanelOptions {
  nav: RuntimeNavGameplayApi;
  initiallyVisible?: boolean;
  maxEvents?: number;
  maxDiagnostics?: number;
  missionPackages?: RuntimeNavMissionPackageDiagnosticsReport | null;
  initialDiagnosticsPresetId?: string | null;
  onDiagnosticsPolicyPresetChange?: (selection: RuntimeNavMissionDiagnosticsPolicyEditorPresetSelection) => void;
}

export class RuntimeNavMissionDebugPanel {
  private readonly root = document.createElement("aside");
  private readonly toggleButton = document.createElement("button");
  private readonly stateSummary = document.createElement("div");
  private readonly graphSummary = document.createElement("div");
  private readonly runnerSummary = document.createElement("div");
  private readonly diagnosticsPresetEditor = document.createElement("div");
  private readonly diagnosticsSummary = document.createElement("div");
  private readonly diagnosticsList = document.createElement("div");
  private readonly eventsList = document.createElement("div");
  private readonly unsubscribe: () => void;
  private readonly maxEvents: number;
  private readonly maxDiagnostics: number;
  private visible: boolean;
  private selectedDiagnosticsPresetId: RuntimeNavMissionDiagnosticsPolicyPresetId;
  private readonly events: RuntimeNavMissionRunnerEvent[] = [];

  constructor(private readonly options: RuntimeNavMissionDebugPanelOptions) {
    this.visible = options.initiallyVisible ?? true;
    this.maxEvents = normalizeMaxEvents(options.maxEvents);
    this.maxDiagnostics = normalizeMaxDiagnostics(options.maxDiagnostics);
    this.selectedDiagnosticsPresetId = normalizeDiagnosticsPresetId(options.initialDiagnosticsPresetId);
    this.root.className = "mission-debug-panel panel";
    this.toggleButton.type = "button";
    this.toggleButton.className = "mission-debug-toggle";
    this.toggleButton.textContent = "Mission HUD";
    this.toggleButton.addEventListener("click", () => this.setVisible(!this.visible));
    document.body.append(this.toggleButton, this.root);
    this.unsubscribe = options.nav.subscribeAgentEvents((event) => {
      this.pushEvent(event);
      this.refresh();
    });
    this.renderShell();
    this.setVisible(this.visible);
    this.refresh();
  }

  dispose(): void {
    this.unsubscribe();
    this.root.remove();
    this.toggleButton.remove();
  }

  recordGameplayEvent(event: GameplayEvent): void {
    this.pushEvent({ ...event, source: "gameplay", type: "gameplay" });
    this.refresh();
  }

  getDiagnosticsPolicyPresetSelection(): RuntimeNavMissionDiagnosticsPolicyEditorPresetSelection {
    const preset =
      getRuntimeNavMissionDiagnosticsPolicyPreset(this.selectedDiagnosticsPresetId) ??
      getRuntimeNavMissionDiagnosticsPolicyPreset("default");
    if (!preset) {
      return {
        id: "default",
        label: "Default",
        description: "Use built-in diagnostic severities and include info summaries.",
        policy: null,
      };
    }
    return {
      id: preset.id,
      label: preset.label,
      description: preset.description,
      policy: createRuntimeNavMissionDiagnosticsPolicyFromPreset(preset.id),
    };
  }

  refresh(): void {
    const state = this.options.nav.snapshotMissionState();
    const graph = this.options.nav.snapshotMissionGraph();
    const runner = this.options.nav.snapshotMissionRunner();
    this.stateSummary.replaceChildren(
      createMetric("Missions", state.count),
      createMetric("Active", state.active),
      createMetric("Done", state.completed),
      createMetric("Failed", state.failed),
    );
    this.graphSummary.replaceChildren(
      createMetric("Objectives", graph.count),
      createMetric("Ready", graph.readyObjectiveIds.length),
      createMetric("Active", graph.active),
      createMetric("Done", graph.completed),
    );
    this.runnerSummary.replaceChildren(
      createMetric("Rules", runner.ruleCount),
      createMetric("Agent", runner.handledAgentEvents),
      createMetric("Game", runner.handledGameplayEvents),
      createMetric("Fired", runner.firedRules),
    );
    this.renderDiagnostics(this.options.missionPackages ?? null);
    this.renderEvents();
    this.renderObjectiveRows(graph.objectives.slice(0, 6));
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
    this.root.classList.toggle("hidden", !visible);
    this.toggleButton.classList.toggle("active", visible);
  }

  private renderShell(): void {
    const heading = document.createElement("div");
    heading.className = "mission-debug-heading";
    const title = document.createElement("div");
    title.innerHTML = `<span class="eyebrow">MISSION DEBUG</span><strong>Runtime Runner</strong>`;
    const refreshButton = createButton("Refresh", () => this.refresh());
    const runButton = createButton("Run", () => {
      const result = this.options.nav.runMissionRunner();
      this.refresh();
      console.info("Mission runner result", result);
    });
    const seedButton = createButton("Seed Demo", () => {
      this.seedDemo();
      this.refresh();
    });
    const buttons = document.createElement("div");
    buttons.className = "mission-debug-actions";
    buttons.append(refreshButton, runButton, seedButton);
    heading.append(title, buttons);

    this.stateSummary.className = "mission-debug-metrics";
    this.graphSummary.className = "mission-debug-metrics";
    this.runnerSummary.className = "mission-debug-metrics";
    this.diagnosticsPresetEditor.className = "mission-debug-diagnostics-preset";
    this.diagnosticsSummary.className = "mission-debug-metrics";
    this.diagnosticsList.className = "mission-debug-diagnostics";
    this.eventsList.className = "mission-debug-events";

    const diagnosticsBody = document.createElement("div");
    diagnosticsBody.className = "mission-debug-diagnostics-body";
    diagnosticsBody.append(this.diagnosticsPresetEditor, this.diagnosticsSummary, this.diagnosticsList);

    this.renderDiagnosticsPresetEditor();

    this.root.replaceChildren(
      heading,
      createSection("State", this.stateSummary),
      createSection("Graph", this.graphSummary),
      createSection("Runner", this.runnerSummary),
      createSection("Package diagnostics", diagnosticsBody),
      createSection("Recent mission events", this.eventsList),
    );
  }

  private renderDiagnosticsPresetEditor(): void {
    const selection = this.getDiagnosticsPolicyPresetSelection();
    const label = document.createElement("label");
    label.className = "mission-debug-diagnostics-preset-label";
    label.textContent = "Diagnostics preset";

    const select = document.createElement("select");
    select.value = selection.id;
    for (const preset of RUNTIME_NAV_MISSION_DIAGNOSTICS_POLICY_PRESETS) {
      const option = document.createElement("option");
      option.value = preset.id;
      option.textContent = `${preset.label} (${preset.id})`;
      select.append(option);
    }
    select.addEventListener("change", () => {
      this.selectedDiagnosticsPresetId = normalizeDiagnosticsPresetId(select.value);
      this.renderDiagnosticsPresetEditor();
      const nextSelection = this.getDiagnosticsPolicyPresetSelection();
      this.options.onDiagnosticsPolicyPresetChange?.(nextSelection);
      console.info("Mission diagnostics preset policy", nextSelection);
    });
    label.append(select);

    const hint = document.createElement("small");
    hint.textContent = "Pick an editor preset to generate a severityPolicy scaffold for mission package diagnostics.";

    const description = document.createElement("small");
    description.className = "mission-debug-diagnostics-preset-description";
    description.textContent = selection.description;

    const policyPreview = document.createElement("code");
    policyPreview.className = "mission-debug-diagnostics-preset-policy";
    policyPreview.textContent = formatDiagnosticsPolicyPreview(selection.policy);

    this.diagnosticsPresetEditor.replaceChildren(label, hint, description, policyPreview);
  }

  private renderDiagnostics(report: RuntimeNavMissionPackageDiagnosticsReport | null): void {
    if (!report) {
      this.diagnosticsSummary.replaceChildren(
        createMetric("Packages", 0),
        createMetric("Loaded", 0),
        createMetric("Warn", 0),
        createMetric("Errors", 0),
      );
      const empty = document.createElement("small");
      empty.textContent = "No mission package diagnostics.";
      this.diagnosticsList.replaceChildren(empty);
      return;
    }

    this.diagnosticsSummary.replaceChildren(
      createMetric("Packages", report.packageCount),
      createMetric("Loaded", report.loadedPackages),
      createMetric("Warn", report.warnings),
      createMetric("Errors", report.errors),
    );

    const visibleDiagnostics = selectVisibleDiagnostics(report.diagnostics, this.maxDiagnostics);
    if (visibleDiagnostics.length === 0) {
      const empty = document.createElement("small");
      empty.textContent = report.ok ? "Mission packages passed diagnostics." : "No visible diagnostics.";
      this.diagnosticsList.replaceChildren(empty);
      return;
    }

    this.diagnosticsList.replaceChildren(
      ...visibleDiagnostics.map((diagnostic) => createDiagnosticRow(diagnostic)),
    );
  }

  private renderEvents(): void {
    if (this.events.length === 0) {
      const empty = document.createElement("small");
      empty.textContent = "No mission events yet.";
      this.eventsList.replaceChildren(empty);
      return;
    }
    this.eventsList.replaceChildren(
      ...this.events.slice().reverse().map((event) => {
        const row = document.createElement("div");
        row.className = "mission-debug-event";
        const title = document.createElement("b");
        const detail = document.createElement("small");
        if (isGameplayEvent(event)) {
          title.textContent = `${event.kind} · ${event.event}`;
          detail.textContent = `${event.sourceId} · ${event.message}`;
        } else {
          title.textContent = `${event.type} · ${event.agentId}`;
          detail.textContent = event.previousStatus ? `${event.previousStatus} → ${event.status}` : event.status;
        }
        row.append(title, detail);
        return row;
      }),
    );
  }

  private renderObjectiveRows(objectives: Array<{ id: string; resolvedStatus: string; blockedBy: string[] }>): void {
    const section = this.root.querySelector<HTMLElement>('[data-section="objectives"]') ?? createSection("Objectives", document.createElement("div"));
    section.dataset.section = "objectives";
    const body = section.querySelector<HTMLElement>(".mission-debug-section-body");
    if (!body) return;
    if (objectives.length === 0) {
      const empty = document.createElement("small");
      empty.textContent = "No objectives.";
      body.replaceChildren(empty);
    } else {
      body.replaceChildren(
        ...objectives.map((objective) => {
          const row = document.createElement("div");
          row.className = "mission-debug-objective";
          const title = document.createElement("b");
          title.textContent = objective.id;
          const status = document.createElement("small");
          status.textContent = objective.blockedBy.length
            ? `${objective.resolvedStatus} · blocked by ${objective.blockedBy.join(", ")}`
            : objective.resolvedStatus;
          row.append(title, status);
          return row;
        }),
      );
    }
    if (!section.parentElement) this.root.append(section);
  }

  private pushEvent(event: RuntimeNavMissionRunnerEvent): void {
    this.events.push(event);
    while (this.events.length > this.maxEvents) this.events.shift();
  }

  private seedDemo(): void {
    this.options.nav.upsertMission({
      id: "debug-mission",
      status: "active",
      data: { title: "Mission HUD Demo" },
    });
    this.options.nav.upsertObjective({
      id: "debug-arrive",
      missionId: "debug-mission",
      title: "Arrive with debug-click-agent or trigger bridge",
    });
    this.options.nav.upsertMissionRunnerRule({
      id: "debug-arrive-on-agent-arrived",
      event: { source: "agent", type: "arrived", agentId: "debug-click-agent" },
      action: { kind: "objective", id: "debug-arrive", status: "completed", data: { source: "mission-debug-panel" } },
      once: true,
    });
  }
}

function createSection(title: string, body: HTMLElement): HTMLElement {
  const section = document.createElement("section");
  section.className = "mission-debug-section";
  const heading = document.createElement("div");
  heading.className = "mission-debug-section-title";
  heading.textContent = title;
  body.classList.add("mission-debug-section-body");
  section.append(heading, body);
  return section;
}

function createMetric(label: string, value: number): HTMLElement {
  const metric = document.createElement("div");
  metric.className = "mission-debug-metric";
  const valueElement = document.createElement("b");
  valueElement.textContent = String(value);
  const labelElement = document.createElement("span");
  labelElement.textContent = label;
  metric.append(valueElement, labelElement);
  return metric;
}

function createButton(label: string, onClick: () => void): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function createDiagnosticRow(diagnostic: RuntimeNavMissionPackageDiagnostic): HTMLElement {
  const row = document.createElement("div");
  row.className = `mission-debug-diagnostic ${diagnostic.severity}`;
  const title = document.createElement("b");
  title.textContent = `${diagnostic.severity.toUpperCase()} · ${diagnostic.code}`;
  const detail = document.createElement("small");
  const suffix = [diagnostic.id, diagnostic.url].filter(Boolean).join(" · ");
  detail.textContent = suffix ? `${diagnostic.message} · ${suffix}` : diagnostic.message;
  row.append(title, detail);
  return row;
}

function selectVisibleDiagnostics(
  diagnostics: RuntimeNavMissionPackageDiagnostic[],
  maxDiagnostics: number,
): RuntimeNavMissionPackageDiagnostic[] {
  const actionable = diagnostics.filter((diagnostic) => diagnostic.severity !== "info");
  return (actionable.length > 0 ? actionable : diagnostics).slice(0, maxDiagnostics);
}

function isGameplayEvent(event: RuntimeNavMissionRunnerEvent): event is Extract<RuntimeNavMissionRunnerEvent, { source: "gameplay" }> {
  return "source" in event && event.source === "gameplay";
}

function normalizeMaxEvents(value: number | undefined): number {
  if (!value || !Number.isFinite(value)) return 8;
  return Math.max(1, Math.min(64, Math.floor(value)));
}

function normalizeMaxDiagnostics(value: number | undefined): number {
  if (!value || !Number.isFinite(value)) return 6;
  return Math.max(1, Math.min(32, Math.floor(value)));
}

function normalizeDiagnosticsPresetId(value: string | null | undefined): RuntimeNavMissionDiagnosticsPolicyPresetId {
  const preset = getRuntimeNavMissionDiagnosticsPolicyPreset(value ?? "");
  return preset?.id ?? "default";
}

function formatDiagnosticsPolicyPreview(policy: RuntimeNavMissionDiagnosticsSeverityPolicy | null): string {
  if (!policy) return "severityPolicy: <built-in defaults>";
  return JSON.stringify({ severityPolicy: policy }, null, 2);
}
