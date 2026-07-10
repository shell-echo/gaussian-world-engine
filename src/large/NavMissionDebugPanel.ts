import "./NavMissionDebugPanel.css";
import type { GameplayEvent } from "../gameplay/GameplaySystem.js";
import type { RuntimeNavGameplayApi } from "./NavGameplayApi.js";
import {
  getRuntimeNavMissionKnownDiagnosticCodeEntry,
  RUNTIME_NAV_MISSION_KNOWN_DIAGNOSTIC_CODE_ENTRIES,
} from "./NavMissionDiagnosticsCodeRegistry.js";
import {
  createRuntimeNavMissionDiagnosticsPolicyFromPreset,
  getRuntimeNavMissionDiagnosticsPolicyPreset,
  RUNTIME_NAV_MISSION_DIAGNOSTICS_POLICY_PRESETS,
} from "./NavMissionDiagnosticsPolicyPresets.js";
import type { RuntimeNavMissionDiagnosticsPolicyPresetId } from "./NavMissionDiagnosticsPolicyPresets.js";
import type {
  RuntimeNavMissionDiagnosticsSeverityPolicy,
  RuntimeNavMissionPackageDiagnosticSeverity,
  RuntimeNavMissionPackageDiagnosticsReport,
  RuntimeNavMissionPackageDiagnostic,
} from "./NavMissionPackageLoader.js";
import type { RuntimeNavMissionRunnerEvent } from "./NavMissionRunner.js";

const RUNTIME_NAV_MISSION_DIAGNOSTIC_SEVERITIES: readonly RuntimeNavMissionPackageDiagnosticSeverity[] = [
  "info",
  "warning",
  "error",
];

export interface RuntimeNavMissionDiagnosticsPolicyEditorPresetSelection {
  id: RuntimeNavMissionDiagnosticsPolicyPresetId;
  label: string;
  description: string;
  policy: RuntimeNavMissionDiagnosticsSeverityPolicy | null;
}

export interface RuntimeNavMissionDiagnosticsPolicyEditorSelection {
  preset: RuntimeNavMissionDiagnosticsPolicyEditorPresetSelection;
  overrides: Partial<Record<string, RuntimeNavMissionPackageDiagnosticSeverity>>;
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
  onDiagnosticsPolicyChange?: (selection: RuntimeNavMissionDiagnosticsPolicyEditorSelection) => void;
  onDiagnosticsPolicyApply?: (
    selection: RuntimeNavMissionDiagnosticsPolicyEditorSelection,
  ) => RuntimeNavMissionPackageDiagnosticsReport | null | Promise<RuntimeNavMissionPackageDiagnosticsReport | null>;
}

export class RuntimeNavMissionDebugPanel {
  private readonly root = document.createElement("aside");
  private readonly toggleButton = document.createElement("button");
  private readonly stateSummary = document.createElement("div");
  private readonly graphSummary = document.createElement("div");
  private readonly runnerSummary = document.createElement("div");
  private readonly diagnosticsPolicyEditor = document.createElement("div");
  private readonly diagnosticsSummary = document.createElement("div");
  private readonly diagnosticsList = document.createElement("div");
  private readonly eventsList = document.createElement("div");
  private readonly unsubscribe: () => void;
  private readonly maxEvents: number;
  private readonly maxDiagnostics: number;
  private visible: boolean;
  private missionPackages: RuntimeNavMissionPackageDiagnosticsReport | null;
  private selectedDiagnosticsPresetId: RuntimeNavMissionDiagnosticsPolicyPresetId;
  private readonly customDiagnosticSeverityOverrides = new Map<string, RuntimeNavMissionPackageDiagnosticSeverity>();
  private applyingDiagnosticsPolicy = false;
  private diagnosticsPolicyApplyMessage = "";
  private diagnosticsPolicyShareMessage = "";
  private diagnosticsPolicyManifestMessage = "";
  private diagnosticsPolicyManifestInputValue = "";
  private diagnosticsPolicyUsesManifestImport = false;
  private importedDiagnosticsPolicy: RuntimeNavMissionDiagnosticsSeverityPolicy | null = null;
  private readonly events: RuntimeNavMissionRunnerEvent[] = [];

  constructor(private readonly options: RuntimeNavMissionDebugPanelOptions) {
    this.visible = options.initiallyVisible ?? true;
    this.missionPackages = options.missionPackages ?? null;
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

  setMissionPackages(report: RuntimeNavMissionPackageDiagnosticsReport | null): void {
    this.missionPackages = report;
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

  getDiagnosticsPolicyEditorSelection(): RuntimeNavMissionDiagnosticsPolicyEditorSelection {
    const preset = this.getDiagnosticsPolicyPresetSelection();
    const overrides = createDiagnosticsPolicyOverrideRecord(this.customDiagnosticSeverityOverrides);
    return {
      preset,
      overrides,
      policy: this.diagnosticsPolicyUsesManifestImport
        ? this.importedDiagnosticsPolicy
        : mergeDiagnosticsPolicy(preset.policy, this.customDiagnosticSeverityOverrides),
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
    this.renderDiagnostics(this.missionPackages);
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
    this.diagnosticsPolicyEditor.className = "mission-debug-diagnostics-policy-editor";
    this.diagnosticsSummary.className = "mission-debug-metrics";
    this.diagnosticsList.className = "mission-debug-diagnostics";
    this.eventsList.className = "mission-debug-events";

    const diagnosticsBody = document.createElement("div");
    diagnosticsBody.className = "mission-debug-diagnostics-body";
    diagnosticsBody.append(this.diagnosticsPolicyEditor, this.diagnosticsSummary, this.diagnosticsList);

    this.renderDiagnosticsPolicyEditor();

    this.root.replaceChildren(
      heading,
      createSection("State", this.stateSummary),
      createSection("Graph", this.graphSummary),
      createSection("Runner", this.runnerSummary),
      createSection("Package diagnostics", diagnosticsBody),
      createSection("Recent mission events", this.eventsList),
    );
  }

  private renderDiagnosticsPolicyEditor(): void {
    const editorSelection = this.getDiagnosticsPolicyEditorSelection();
    const presetSelection = editorSelection.preset;
    const presetLabel = document.createElement("label");
    presetLabel.className = "mission-debug-diagnostics-policy-label";
    presetLabel.textContent = "Diagnostics preset";

    const presetSelect = document.createElement("select");
    presetSelect.value = presetSelection.id;
    for (const preset of RUNTIME_NAV_MISSION_DIAGNOSTICS_POLICY_PRESETS) {
      const option = document.createElement("option");
      option.value = preset.id;
      option.textContent = `${preset.label} (${preset.id})`;
      presetSelect.append(option);
    }
    presetSelect.addEventListener("change", () => {
      this.selectedDiagnosticsPresetId = normalizeDiagnosticsPresetId(presetSelect.value);
      this.clearImportedDiagnosticsPolicy();
      this.clearDiagnosticsPolicyFeedback();
      this.renderDiagnosticsPolicyEditor();
      const nextPresetSelection = this.getDiagnosticsPolicyPresetSelection();
      this.options.onDiagnosticsPolicyPresetChange?.(nextPresetSelection);
      this.emitDiagnosticsPolicyChange();
      console.info("Mission diagnostics policy editor selection", this.getDiagnosticsPolicyEditorSelection());
    });
    presetLabel.append(presetSelect);

    const presetHint = document.createElement("small");
    presetHint.textContent = "Pick an editor preset, then override individual known diagnostic codes as needed.";

    const presetDescription = document.createElement("small");
    presetDescription.className = "mission-debug-diagnostics-policy-description";
    presetDescription.textContent = presetSelection.description;

    const overrideTitle = document.createElement("small");
    overrideTitle.className = "mission-debug-diagnostics-override-title";
    overrideTitle.textContent = "Custom code overrides";

    const overrideForm = this.createDiagnosticsPolicyOverrideForm();
    const overrideList = this.createDiagnosticsPolicyOverrideList();

    const policyPreviewTitle = document.createElement("small");
    policyPreviewTitle.className = "mission-debug-diagnostics-override-title";
    policyPreviewTitle.textContent = this.diagnosticsPolicyUsesManifestImport
      ? "Generated severityPolicy · imported from manifest"
      : "Generated severityPolicy";

    const policyPreview = document.createElement("code");
    policyPreview.className = "mission-debug-diagnostics-policy-preview";
    policyPreview.textContent = formatDiagnosticsPolicyPreview(editorSelection.policy);

    const shareControls = this.createDiagnosticsPolicyShareControls(editorSelection);
    const manifestControls = this.createDiagnosticsPolicyManifestControls(editorSelection);
    const applyControls = this.createDiagnosticsPolicyApplyControls();

    this.diagnosticsPolicyEditor.replaceChildren(
      presetLabel,
      presetHint,
      presetDescription,
      overrideTitle,
      overrideForm,
      overrideList,
      policyPreviewTitle,
      policyPreview,
      shareControls,
      manifestControls,
      applyControls,
    );
  }

  private createDiagnosticsPolicyOverrideForm(): HTMLElement {
    const form = document.createElement("div");
    form.className = "mission-debug-diagnostics-override-form";

    const codeLabel = document.createElement("label");
    codeLabel.textContent = "Code";
    const codeSelect = document.createElement("select");
    for (const entry of RUNTIME_NAV_MISSION_KNOWN_DIAGNOSTIC_CODE_ENTRIES) {
      const option = document.createElement("option");
      option.value = entry.code;
      option.textContent = `${entry.code} · ${entry.defaultSeverity}`;
      option.title = `${entry.category} · ${entry.description}`;
      codeSelect.append(option);
    }
    codeLabel.append(codeSelect);

    const severityLabel = document.createElement("label");
    severityLabel.textContent = "Severity";
    const severitySelect = document.createElement("select");
    for (const severity of RUNTIME_NAV_MISSION_DIAGNOSTIC_SEVERITIES) {
      const option = document.createElement("option");
      option.value = severity;
      option.textContent = severity;
      severitySelect.append(option);
    }
    severityLabel.append(severitySelect);

    const syncSeverityFromCode = (): void => {
      const entry = getRuntimeNavMissionKnownDiagnosticCodeEntry(codeSelect.value);
      severitySelect.value = this.customDiagnosticSeverityOverrides.get(codeSelect.value) ?? entry?.defaultSeverity ?? "warning";
    };
    codeSelect.addEventListener("change", syncSeverityFromCode);
    syncSeverityFromCode();

    const setButton = createButton("Set override", () => {
      const code = codeSelect.value.trim();
      if (!code) return;
      this.clearImportedDiagnosticsPolicy();
      this.customDiagnosticSeverityOverrides.set(code, normalizeDiagnosticSeverity(severitySelect.value));
      this.clearDiagnosticsPolicyFeedback();
      this.renderDiagnosticsPolicyEditor();
      this.emitDiagnosticsPolicyChange();
      console.info("Mission diagnostics policy editor selection", this.getDiagnosticsPolicyEditorSelection());
    });
    const resetButton = createButton("Reset", () => {
      this.clearImportedDiagnosticsPolicy();
      this.customDiagnosticSeverityOverrides.clear();
      this.clearDiagnosticsPolicyFeedback();
      this.renderDiagnosticsPolicyEditor();
      this.emitDiagnosticsPolicyChange();
      console.info("Mission diagnostics policy editor selection", this.getDiagnosticsPolicyEditorSelection());
    });
    resetButton.disabled = this.customDiagnosticSeverityOverrides.size === 0 && !this.diagnosticsPolicyUsesManifestImport;

    const actions = document.createElement("div");
    actions.className = "mission-debug-diagnostics-override-actions";
    actions.append(setButton, resetButton);

    form.append(codeLabel, severityLabel, actions);
    return form;
  }

  private createDiagnosticsPolicyOverrideList(): HTMLElement {
    const list = document.createElement("div");
    list.className = "mission-debug-diagnostics-override-list";
    if (this.customDiagnosticSeverityOverrides.size === 0) {
      const empty = document.createElement("small");
      empty.textContent = this.diagnosticsPolicyUsesManifestImport
        ? "Imported manifest policy has no custom code overrides."
        : "No custom code overrides. The generated policy currently follows the selected preset.";
      list.append(empty);
      return list;
    }

    const overrides = [...this.customDiagnosticSeverityOverrides.entries()].sort(([left], [right]) => left.localeCompare(right));
    for (const [code, severity] of overrides) {
      const entry = getRuntimeNavMissionKnownDiagnosticCodeEntry(code);
      const row = document.createElement("div");
      row.className = "mission-debug-diagnostics-override-row";
      const title = document.createElement("b");
      title.textContent = `${code} → ${severity}`;
      const detail = document.createElement("small");
      detail.textContent = entry
        ? `Default ${entry.defaultSeverity} · ${entry.description}`
        : "Custom diagnostic code override.";
      const removeButton = createButton("Remove", () => {
        this.clearImportedDiagnosticsPolicy();
        this.customDiagnosticSeverityOverrides.delete(code);
        this.clearDiagnosticsPolicyFeedback();
        this.renderDiagnosticsPolicyEditor();
        this.emitDiagnosticsPolicyChange();
        console.info("Mission diagnostics policy editor selection", this.getDiagnosticsPolicyEditorSelection());
      });
      row.append(title, detail, removeButton);
      list.append(row);
    }
    return list;
  }

  private createDiagnosticsPolicyShareControls(selection: RuntimeNavMissionDiagnosticsPolicyEditorSelection): HTMLElement {
    const container = document.createElement("div");
    container.className = "mission-debug-diagnostics-share";
    const shareUrl = createDiagnosticsPolicyShareUrl(window.location.href, selection);

    const title = document.createElement("small");
    title.className = "mission-debug-diagnostics-override-title";
    title.textContent = "Shareable URL";

    const urlPreview = document.createElement("code");
    urlPreview.className = "mission-debug-diagnostics-share-url";
    urlPreview.textContent = shareUrl;

    const copyButton = createButton("Copy URL", () => {
      void this.copyDiagnosticsPolicyShareUrl(shareUrl);
    });
    const updateButton = createButton("Update address", () => {
      window.history.replaceState(window.history.state, document.title, shareUrl);
      this.diagnosticsPolicyShareMessage = "Address bar updated with the current policy.";
      this.renderDiagnosticsPolicyEditor();
    });
    const actions = document.createElement("div");
    actions.className = "mission-debug-diagnostics-share-actions";
    actions.append(copyButton, updateButton);

    container.append(title, urlPreview, actions);
    if (this.diagnosticsPolicyShareMessage) {
      const status = document.createElement("small");
      status.className = "mission-debug-diagnostics-share-status";
      status.textContent = this.diagnosticsPolicyShareMessage;
      container.append(status);
    }
    return container;
  }

  private async copyDiagnosticsPolicyShareUrl(shareUrl: string): Promise<void> {
    try {
      await navigator.clipboard?.writeText(shareUrl);
      this.diagnosticsPolicyShareMessage = "Shareable URL copied.";
    } catch (error) {
      console.warn("Mission diagnostics policy URL copy failed.", error);
      this.diagnosticsPolicyShareMessage = "Copy failed. Select the URL preview manually.";
    }
    this.renderDiagnosticsPolicyEditor();
  }

  private createDiagnosticsPolicyManifestControls(selection: RuntimeNavMissionDiagnosticsPolicyEditorSelection): HTMLElement {
    const container = document.createElement("div");
    container.className = "mission-debug-diagnostics-manifest";
    const manifestSnippet = createDiagnosticsPolicyManifestSnippet(selection);

    const title = document.createElement("small");
    title.className = "mission-debug-diagnostics-override-title";
    title.textContent = "Manifest snippet";

    const hint = document.createElement("small");
    hint.textContent = "Copy this scaffold into a large world manifest, or paste a manifest snippet below and import its first severityPolicy.";

    const preview = document.createElement("code");
    preview.className = "mission-debug-diagnostics-manifest-snippet";
    preview.textContent = manifestSnippet;

    const importInput = document.createElement("textarea");
    importInput.className = "mission-debug-diagnostics-manifest-input";
    importInput.rows = 6;
    importInput.spellcheck = false;
    importInput.placeholder = "Paste a large world manifest or { missionPackages: [...] } snippet here.";
    importInput.value = this.diagnosticsPolicyManifestInputValue || manifestSnippet;
    importInput.addEventListener("input", () => {
      this.diagnosticsPolicyManifestInputValue = importInput.value;
    });

    const copyButton = createButton("Copy manifest", () => {
      void this.copyDiagnosticsPolicyManifestSnippet(manifestSnippet);
    });
    const importButton = createButton("Import policy", () => {
      this.importDiagnosticsPolicyManifest(importInput.value, true);
    });
    const importApplyButton = createButton("Import + apply", () => {
      void this.importAndApplyDiagnosticsPolicyManifest(importInput.value);
    });
    importApplyButton.disabled = !this.options.onDiagnosticsPolicyApply || this.applyingDiagnosticsPolicy;

    const actions = document.createElement("div");
    actions.className = "mission-debug-diagnostics-manifest-actions";
    actions.append(copyButton, importButton, importApplyButton);

    container.append(title, hint, preview, importInput, actions);
    if (this.diagnosticsPolicyManifestMessage) {
      const status = document.createElement("small");
      status.className = "mission-debug-diagnostics-manifest-status";
      status.textContent = this.diagnosticsPolicyManifestMessage;
      container.append(status);
    }
    return container;
  }

  private async copyDiagnosticsPolicyManifestSnippet(manifestSnippet: string): Promise<void> {
    try {
      await navigator.clipboard?.writeText(manifestSnippet);
      this.diagnosticsPolicyManifestMessage = "Manifest snippet copied.";
    } catch (error) {
      console.warn("Mission diagnostics policy manifest copy failed.", error);
      this.diagnosticsPolicyManifestMessage = "Copy failed. Select the manifest snippet manually.";
    }
    this.renderDiagnosticsPolicyEditor();
  }

  private importDiagnosticsPolicyManifest(manifestText: string, render: boolean): boolean {
    try {
      const policy = readDiagnosticsPolicyFromManifestText(manifestText);
      if (policy === undefined) {
        this.diagnosticsPolicyManifestMessage = "No severityPolicy found in manifest JSON.";
        if (render) this.renderDiagnosticsPolicyEditor();
        return false;
      }
      this.selectedDiagnosticsPresetId = "default";
      this.customDiagnosticSeverityOverrides.clear();
      for (const [code, severity] of Object.entries(policy?.codes ?? {})) {
        this.customDiagnosticSeverityOverrides.set(code, severity);
      }
      this.importedDiagnosticsPolicy = policy;
      this.diagnosticsPolicyUsesManifestImport = true;
      this.diagnosticsPolicyManifestInputValue = manifestText;
      this.diagnosticsPolicyManifestMessage = policy
        ? "Imported manifest severityPolicy into the editor."
        : "Imported empty manifest policy; built-in diagnostics severity will be used.";
      this.diagnosticsPolicyApplyMessage = "";
      this.diagnosticsPolicyShareMessage = "";
      this.emitDiagnosticsPolicyChange();
      console.info("Mission diagnostics policy imported from manifest", this.getDiagnosticsPolicyEditorSelection());
      if (render) this.renderDiagnosticsPolicyEditor();
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.diagnosticsPolicyManifestMessage = `Import failed: ${message}`;
      if (render) this.renderDiagnosticsPolicyEditor();
      return false;
    }
  }

  private async importAndApplyDiagnosticsPolicyManifest(manifestText: string): Promise<void> {
    const imported = this.importDiagnosticsPolicyManifest(manifestText, false);
    if (!imported) {
      this.renderDiagnosticsPolicyEditor();
      return;
    }
    await this.applyDiagnosticsPolicy();
  }

  private createDiagnosticsPolicyApplyControls(): HTMLElement {
    const container = document.createElement("div");
    container.className = "mission-debug-diagnostics-apply";
    const applyButton = createButton(this.applyingDiagnosticsPolicy ? "Applying..." : "Apply + reload", () => {
      void this.applyDiagnosticsPolicy();
    });
    applyButton.disabled = this.applyingDiagnosticsPolicy || !this.options.onDiagnosticsPolicyApply;

    const hint = document.createElement("small");
    hint.textContent = this.options.onDiagnosticsPolicyApply
      ? "Apply the generated policy and reload mission packages to refresh diagnostics and package apply decisions."
      : "No mission package reload callback is available in this runtime.";

    container.append(applyButton, hint);
    if (this.diagnosticsPolicyApplyMessage) {
      const status = document.createElement("small");
      status.className = "mission-debug-diagnostics-apply-status";
      status.textContent = this.diagnosticsPolicyApplyMessage;
      container.append(status);
    }
    return container;
  }

  private async applyDiagnosticsPolicy(): Promise<void> {
    const apply = this.options.onDiagnosticsPolicyApply;
    if (!apply || this.applyingDiagnosticsPolicy) return;
    this.applyingDiagnosticsPolicy = true;
    this.diagnosticsPolicyApplyMessage = "Reloading mission packages with generated policy...";
    this.renderDiagnosticsPolicyEditor();
    try {
      const selection = this.getDiagnosticsPolicyEditorSelection();
      const report = await apply(selection);
      this.missionPackages = report;
      this.diagnosticsPolicyApplyMessage = report ? formatMissionPackageApplyMessage(report) : "No mission packages were available to reload.";
      console.info("Mission diagnostics policy applied", { selection, report });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.diagnosticsPolicyApplyMessage = `Apply failed: ${message}`;
      console.warn("Mission diagnostics policy apply failed.", error);
    } finally {
      this.applyingDiagnosticsPolicy = false;
      this.renderDiagnosticsPolicyEditor();
      this.refresh();
    }
  }

  private clearImportedDiagnosticsPolicy(): void {
    this.diagnosticsPolicyUsesManifestImport = false;
    this.importedDiagnosticsPolicy = null;
  }

  private clearDiagnosticsPolicyFeedback(): void {
    this.diagnosticsPolicyApplyMessage = "";
    this.diagnosticsPolicyShareMessage = "";
    this.diagnosticsPolicyManifestMessage = "";
  }

  private emitDiagnosticsPolicyChange(): void {
    this.options.onDiagnosticsPolicyChange?.(this.getDiagnosticsPolicyEditorSelection());
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

function normalizeDiagnosticSeverity(value: string): RuntimeNavMissionPackageDiagnosticSeverity {
  return RUNTIME_NAV_MISSION_DIAGNOSTIC_SEVERITIES.includes(value as RuntimeNavMissionPackageDiagnosticSeverity)
    ? value as RuntimeNavMissionPackageDiagnosticSeverity
    : "warning";
}

function createDiagnosticsPolicyOverrideRecord(
  overrides: Map<string, RuntimeNavMissionPackageDiagnosticSeverity>,
): Partial<Record<string, RuntimeNavMissionPackageDiagnosticSeverity>> {
  const codes: Partial<Record<string, RuntimeNavMissionPackageDiagnosticSeverity>> = {};
  for (const [code, severity] of overrides) codes[code] = severity;
  return codes;
}

function mergeDiagnosticsPolicy(
  presetPolicy: RuntimeNavMissionDiagnosticsSeverityPolicy | null,
  overrides: Map<string, RuntimeNavMissionPackageDiagnosticSeverity>,
): RuntimeNavMissionDiagnosticsSeverityPolicy | null {
  const policy: RuntimeNavMissionDiagnosticsSeverityPolicy = {};
  if (presetPolicy?.codes) policy.codes = { ...presetPolicy.codes };
  if (presetPolicy?.warningAsError !== undefined) policy.warningAsError = presetPolicy.warningAsError;
  if (presetPolicy?.hideInfo !== undefined) policy.hideInfo = presetPolicy.hideInfo;

  const overrideCodes = createDiagnosticsPolicyOverrideRecord(overrides);
  if (Object.keys(overrideCodes).length > 0) policy.codes = { ...(policy.codes ?? {}), ...overrideCodes };

  const hasCodes = policy.codes ? Object.keys(policy.codes).length > 0 : false;
  return hasCodes || policy.warningAsError !== undefined || policy.hideInfo !== undefined ? policy : null;
}

function createDiagnosticsPolicyShareUrl(
  sourceUrl: string,
  selection: RuntimeNavMissionDiagnosticsPolicyEditorSelection,
): string {
  const url = new URL(sourceUrl);
  clearDiagnosticsPolicySearchParams(url.searchParams);
  if (selection.preset.id !== "default") url.searchParams.set("missionDiagnosticsPreset", selection.preset.id);
  const overrides = Object.entries(selection.overrides)
    .filter((entry): entry is [string, RuntimeNavMissionPackageDiagnosticSeverity] => Boolean(entry[0]) && Boolean(entry[1]))
    .sort(([left], [right]) => left.localeCompare(right));
  for (const [code, severity] of overrides) url.searchParams.append("missionDiagnosticSeverity", `${code}:${severity}`);
  return url.href;
}

function clearDiagnosticsPolicySearchParams(searchParams: URLSearchParams): void {
  searchParams.delete("missionDiagnosticsPreset");
  searchParams.delete("missionDiagnosticSeverity");
  searchParams.delete("missionDiagnosticsStrict");
  searchParams.delete("missionDiagnosticsNoInfo");
}

function createDiagnosticsPolicyManifestSnippet(selection: RuntimeNavMissionDiagnosticsPolicyEditorSelection): string {
  const packageEntry: {
    url: string;
    merge: boolean;
    severityPolicy?: RuntimeNavMissionDiagnosticsSeverityPolicy;
  } = {
    url: "./mission-package.json",
    merge: true,
  };
  if (selection.policy) packageEntry.severityPolicy = selection.policy;
  return JSON.stringify({ missionPackages: [packageEntry] }, null, 2);
}

function readDiagnosticsPolicyFromManifestText(text: string): RuntimeNavMissionDiagnosticsSeverityPolicy | null | undefined {
  const parsed: unknown = JSON.parse(text);
  return readDiagnosticsPolicyFromManifestValue(parsed);
}

function readDiagnosticsPolicyFromManifestValue(value: unknown): RuntimeNavMissionDiagnosticsSeverityPolicy | null | undefined {
  if (!isRecord(value)) return undefined;

  const directPolicy = readDiagnosticsSeverityPolicy(value["severityPolicy"]);
  if (directPolicy !== undefined) return directPolicy;

  const missionPackages = value["missionPackages"];
  if (!Array.isArray(missionPackages)) return undefined;
  for (const missionPackage of missionPackages) {
    if (!isRecord(missionPackage)) continue;
    const packagePolicy = readDiagnosticsSeverityPolicy(missionPackage["severityPolicy"]);
    if (packagePolicy !== undefined) return packagePolicy;
  }
  return undefined;
}

function readDiagnosticsSeverityPolicy(value: unknown): RuntimeNavMissionDiagnosticsSeverityPolicy | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (!isRecord(value)) return undefined;

  const policy: RuntimeNavMissionDiagnosticsSeverityPolicy = {};
  const codes = readDiagnosticsSeverityPolicyCodes(value["codes"]);
  if (codes) policy.codes = codes;
  if (typeof value["warningAsError"] === "boolean") policy.warningAsError = value["warningAsError"];
  if (typeof value["hideInfo"] === "boolean") policy.hideInfo = value["hideInfo"];

  const hasCodes = policy.codes ? Object.keys(policy.codes).length > 0 : false;
  return hasCodes || policy.warningAsError !== undefined || policy.hideInfo !== undefined ? policy : null;
}

function readDiagnosticsSeverityPolicyCodes(value: unknown): Partial<Record<string, RuntimeNavMissionPackageDiagnosticSeverity>> | null {
  if (!isRecord(value)) return null;
  const codes: Partial<Record<string, RuntimeNavMissionPackageDiagnosticSeverity>> = {};
  for (const [code, severity] of Object.entries(value)) {
    if (!code || typeof severity !== "string") continue;
    codes[code] = normalizeDiagnosticSeverity(severity);
  }
  return Object.keys(codes).length > 0 ? codes : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatDiagnosticsPolicyPreview(policy: RuntimeNavMissionDiagnosticsSeverityPolicy | null): string {
  if (!policy) return "severityPolicy: <built-in defaults>";
  return JSON.stringify({ severityPolicy: policy }, null, 2);
}

function formatMissionPackageApplyMessage(report: RuntimeNavMissionPackageDiagnosticsReport): string {
  return report.errors > 0
    ? `Reloaded ${report.loadedPackages}/${report.packageCount} package(s) · ${report.errors} error(s) · ${report.warnings} warning(s)`
    : `Reloaded ${report.loadedPackages}/${report.packageCount} package(s) · ${report.warnings} warning(s)`;
}
