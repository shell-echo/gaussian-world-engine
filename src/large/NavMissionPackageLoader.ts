import type { ColliderData } from "../types/world.js";
import type { RuntimeNavGameplayApi } from "./NavGameplayApi.js";
import {
  parseRuntimeNavMissionDiagnosticSeverityOverride,
  parseRuntimeNavMissionDiagnosticsSeverityPolicy,
} from "./NavMissionDiagnosticsPolicySchema.js";
import type {
  RuntimeNavMissionAuthoringApplyOptions,
  RuntimeNavMissionAuthoringApplyResult,
  RuntimeNavMissionAuthoringDocument,
  RuntimeNavMissionAuthoringMetadata,
} from "./NavMissionAuthoring.js";
import { parseRuntimeNavMissionAuthoringDocument } from "./NavMissionAuthoring.js";
import type { RuntimeNavMissionRunnerRule } from "./NavMissionRunner.js";

export type RuntimeNavMissionPackageDiagnosticSeverity = "info" | "warning" | "error";

export interface RuntimeNavMissionPackageDiagnostic {
  severity: RuntimeNavMissionPackageDiagnosticSeverity;
  code: string;
  message: string;
  url?: string;
  id?: string;
}

export interface RuntimeNavMissionDiagnosticsSeverityPolicy {
  codes?: Partial<Record<string, RuntimeNavMissionPackageDiagnosticSeverity>>;
  warningAsError?: boolean;
  hideInfo?: boolean;
}

export interface RuntimeNavMissionGameplaySourceRegistry {
  triggers: string[];
  interactions: string[];
  triggerEvents: Record<string, string>;
  interactionEvents: Record<string, string>;
}

export interface RuntimeNavMissionPackageReference {
  url: string;
  merge?: boolean;
  severityPolicy?: RuntimeNavMissionDiagnosticsSeverityPolicy | null;
}

export interface RuntimeNavMissionPackageValidationOptions {
  gameplaySources?: RuntimeNavMissionGameplaySourceRegistry | null;
  severityPolicy?: RuntimeNavMissionDiagnosticsSeverityPolicy | null;
}

export interface RuntimeNavMissionPackageLoadOptions extends RuntimeNavMissionPackageValidationOptions {
  nav: RuntimeNavGameplayApi;
  packages: RuntimeNavMissionPackageReference[];
  fetcher?: typeof fetch;
  merge?: boolean;
  onStatus?: (message: string) => void;
}

export interface RuntimeNavMissionPackageCounts {
  missions: number;
  objectives: number;
  runnerRules: number;
}

export interface RuntimeNavMissionPackageDiagnosticsReport {
  ok: boolean;
  packageCount: number;
  loadedPackages: number;
  failedPackages: number;
  warnings: number;
  errors: number;
  diagnostics: RuntimeNavMissionPackageDiagnostic[];
  results: RuntimeNavMissionPackageLoadResult[];
}

export interface RuntimeNavMissionPackageLoadResult {
  url: string;
  ok: boolean;
  merge: boolean;
  metadata?: RuntimeNavMissionAuthoringMetadata;
  counts: RuntimeNavMissionPackageCounts;
  apply?: RuntimeNavMissionAuthoringApplyResult;
  diagnostics: RuntimeNavMissionPackageDiagnostic[];
}

export function createRuntimeNavMissionGameplaySourceRegistry(
  colliders: readonly ColliderData[],
): RuntimeNavMissionGameplaySourceRegistry {
  const triggers = new Set<string>();
  const interactions = new Set<string>();
  const triggerEvents: Record<string, string> = {};
  const interactionEvents: Record<string, string> = {};
  for (const collider of colliders) {
    if (collider.behavior?.mode === "trigger") {
      triggers.add(collider.id);
      triggerEvents[collider.id] = collider.behavior.event;
    }
    if (collider.interactable) {
      interactions.add(collider.id);
      interactionEvents[collider.id] = collider.interactable.event;
    }
  }
  return {
    triggers: Array.from(triggers).sort(),
    interactions: Array.from(interactions).sort(),
    triggerEvents,
    interactionEvents,
  };
}

export async function loadRuntimeNavMissionPackages(
  options: RuntimeNavMissionPackageLoadOptions,
): Promise<RuntimeNavMissionPackageDiagnosticsReport> {
  const fetcher = options.fetcher ?? fetch;
  const packages = normalizePackages(options.packages);
  const sharedSeverityPolicy = mergeRuntimeNavMissionDiagnosticsSeverityPolicies(
    readRuntimeNavMissionPackageUrlSeverityPolicy(),
    options.severityPolicy,
  );
  const results: RuntimeNavMissionPackageLoadResult[] = [];
  const diagnostics: RuntimeNavMissionPackageDiagnostic[] = [];
  for (const [index, packageRef] of packages.entries()) {
    options.onStatus?.(`Loading mission package ${index + 1}/${packages.length}`);
    const merge = packageRef.merge ?? options.merge ?? index > 0;
    const result = await loadSingleRuntimeNavMissionPackage({
      fetcher,
      nav: options.nav,
      packageRef,
      merge,
      gameplaySources: options.gameplaySources,
      severityPolicy: mergeRuntimeNavMissionDiagnosticsSeverityPolicies(sharedSeverityPolicy, packageRef.severityPolicy),
    });
    results.push(result);
    diagnostics.push(...result.diagnostics);
  }
  const report = createReport(results, diagnostics);
  if (report.loadedPackages > 0) {
    options.onStatus?.(`Loaded ${report.loadedPackages}/${report.packageCount} mission package(s)`);
  }
  return report;
}

export function normalizeRuntimeNavMissionPackageReferences(
  packages: Array<string | RuntimeNavMissionPackageReference>,
  baseUrl: string,
): RuntimeNavMissionPackageReference[] {
  return normalizePackages(
    packages.map((item) => {
      if (typeof item === "string") return { url: new URL(item, baseUrl).href };
      return {
        url: new URL(item.url, baseUrl).href,
        merge: item.merge,
        severityPolicy: parseRuntimeNavMissionDiagnosticsSeverityPolicy(item.severityPolicy),
      };
    }),
  );
}

export function validateRuntimeNavMissionPackageDocument(
  document: RuntimeNavMissionAuthoringDocument,
  url?: string,
  options: RuntimeNavMissionPackageValidationOptions = {},
): RuntimeNavMissionPackageDiagnostic[] {
  const diagnostics: RuntimeNavMissionPackageDiagnostic[] = [];
  const missionIds = new Set<string>();
  const objectiveIds = new Set<string>();
  const runnerRuleIds = new Set<string>();

  if (document.missions.length === 0 && document.objectives.length === 0 && document.runnerRules.length === 0) {
    diagnostics.push(createDiagnostic("warning", "package.empty", "Mission package does not contain missions, objectives or runner rules.", url));
  }

  for (const mission of document.missions) {
    if (missionIds.has(mission.id)) diagnostics.push(createDiagnostic("error", "mission.duplicate_id", `Duplicate mission id: ${mission.id}`, url, mission.id));
    missionIds.add(mission.id);
  }

  for (const objective of document.objectives) {
    if (objectiveIds.has(objective.id)) diagnostics.push(createDiagnostic("error", "objective.duplicate_id", `Duplicate objective id: ${objective.id}`, url, objective.id));
    objectiveIds.add(objective.id);
    if (objective.missionId && !missionIds.has(objective.missionId)) diagnostics.push(createDiagnostic("warning", "objective.missing_mission", `Objective ${objective.id} references missing mission ${objective.missionId}.`, url, objective.id));
    for (const dependencyId of objective.dependsOn ?? []) {
      if (!objectiveIds.has(dependencyId)) diagnostics.push(createDiagnostic("warning", "objective.missing_dependency", `Objective ${objective.id} depends on missing objective ${dependencyId}.`, url, objective.id));
    }
    for (const missionId of objective.requiredMissions ?? []) {
      if (!missionIds.has(missionId)) diagnostics.push(createDiagnostic("warning", "objective.missing_required_mission", `Objective ${objective.id} requires missing mission ${missionId}.`, url, objective.id));
    }
    for (const condition of objective.conditions ?? []) {
      if (condition.kind === "mission" && !missionIds.has(condition.id)) diagnostics.push(createDiagnostic("warning", "objective.condition_missing_mission", `Objective ${objective.id} condition references missing mission ${condition.id}.`, url, objective.id));
      if (condition.kind === "objective" && !objectiveIds.has(condition.id)) diagnostics.push(createDiagnostic("warning", "objective.condition_missing_objective", `Objective ${objective.id} condition references missing objective ${condition.id}.`, url, objective.id));
    }
  }

  for (const rule of document.runnerRules) {
    if (runnerRuleIds.has(rule.id)) diagnostics.push(createDiagnostic("error", "runner_rule.duplicate_id", `Duplicate runner rule id: ${rule.id}`, url, rule.id));
    runnerRuleIds.add(rule.id);
    if (!rule.event || ((rule.event.source ?? "any") === "any" && (rule.event.type ?? "any") === "any")) diagnostics.push(createDiagnostic("warning", "runner_rule.broad_event", `Runner rule ${rule.id} has a broad event filter.`, url, rule.id));
    if (rule.enabled === false) diagnostics.push(createDiagnostic("info", "runner_rule.disabled", `Runner rule ${rule.id} is disabled.`, url, rule.id));
    if (rule.action.kind === "mission" && !missionIds.has(rule.action.id)) diagnostics.push(createDiagnostic("error", "runner_rule.missing_mission_action_target", `Runner rule ${rule.id} targets missing mission ${rule.action.id}.`, url, rule.id));
    if (rule.action.kind === "objective" && !objectiveIds.has(rule.action.id)) diagnostics.push(createDiagnostic("error", "runner_rule.missing_objective_action_target", `Runner rule ${rule.id} targets missing objective ${rule.action.id}.`, url, rule.id));
    diagnostics.push(...validateGameplaySourceRule(rule, options.gameplaySources ?? null, url));
  }

  diagnostics.push(createDiagnostic("info", "package.summary", `Mission package contains ${document.missions.length} mission(s), ${document.objectives.length} objective(s), and ${document.runnerRules.length} runner rule(s).`, url));
  return applyRuntimeNavMissionPackageDiagnosticsSeverityPolicy(diagnostics, options.severityPolicy ?? null);
}

export function applyRuntimeNavMissionPackageDiagnosticsSeverityPolicy(
  diagnostics: readonly RuntimeNavMissionPackageDiagnostic[],
  policy: RuntimeNavMissionDiagnosticsSeverityPolicy | null | undefined,
): RuntimeNavMissionPackageDiagnostic[] {
  const normalizedPolicy = parseRuntimeNavMissionDiagnosticsSeverityPolicy(policy);
  if (!normalizedPolicy) return diagnostics.map((diagnostic) => ({ ...diagnostic }));
  const result: RuntimeNavMissionPackageDiagnostic[] = [];
  for (const diagnostic of diagnostics) {
    let severity = normalizedPolicy.codes?.[diagnostic.code] ?? diagnostic.severity;
    if (normalizedPolicy.warningAsError && severity === "warning") severity = "error";
    if (normalizedPolicy.hideInfo && severity === "info") continue;
    result.push({ ...diagnostic, severity });
  }
  return result;
}

export function mergeRuntimeNavMissionDiagnosticsSeverityPolicies(
  base: RuntimeNavMissionDiagnosticsSeverityPolicy | null | undefined,
  override: RuntimeNavMissionDiagnosticsSeverityPolicy | null | undefined,
): RuntimeNavMissionDiagnosticsSeverityPolicy | null {
  const normalizedBase = parseRuntimeNavMissionDiagnosticsSeverityPolicy(base);
  const normalizedOverride = parseRuntimeNavMissionDiagnosticsSeverityPolicy(override);
  if (!normalizedBase && !normalizedOverride) return null;
  const codes = {
    ...(normalizedBase?.codes ?? {}),
    ...(normalizedOverride?.codes ?? {}),
  };
  return {
    ...(Object.keys(codes).length > 0 ? { codes } : {}),
    warningAsError: normalizedOverride?.warningAsError ?? normalizedBase?.warningAsError,
    hideInfo: normalizedOverride?.hideInfo ?? normalizedBase?.hideInfo,
  };
}

async function loadSingleRuntimeNavMissionPackage(options: {
  fetcher: typeof fetch;
  nav: RuntimeNavGameplayApi;
  packageRef: RuntimeNavMissionPackageReference;
  merge: boolean;
  gameplaySources?: RuntimeNavMissionGameplaySourceRegistry | null;
  severityPolicy?: RuntimeNavMissionDiagnosticsSeverityPolicy | null;
}): Promise<RuntimeNavMissionPackageLoadResult> {
  try {
    const document = await fetchMissionPackage(options.fetcher, options.packageRef.url);
    const diagnostics = validateRuntimeNavMissionPackageDocument(document, options.packageRef.url, { gameplaySources: options.gameplaySources, severityPolicy: options.severityPolicy });
    const hasErrors = diagnostics.some((diagnostic) => diagnostic.severity === "error");
    if (hasErrors) return { url: options.packageRef.url, ok: false, merge: options.merge, metadata: document.metadata, counts: countDocument(document), diagnostics };
    const applyOptions: RuntimeNavMissionAuthoringApplyOptions = { merge: options.merge };
    const apply = options.nav.restoreMissionAuthoring(document, applyOptions);
    return { url: options.packageRef.url, ok: true, merge: options.merge, metadata: document.metadata, counts: countDocument(document), apply, diagnostics };
  } catch (error) {
    const diagnostics = applyRuntimeNavMissionPackageDiagnosticsSeverityPolicy([
      createDiagnostic("error", "package.load_failed", error instanceof Error ? error.message : String(error), options.packageRef.url),
    ], options.severityPolicy ?? null);
    return { url: options.packageRef.url, ok: false, merge: options.merge, counts: { missions: 0, objectives: 0, runnerRules: 0 }, diagnostics };
  }
}

async function fetchMissionPackage(fetcher: typeof fetch, url: string): Promise<RuntimeNavMissionAuthoringDocument> {
  const response = await fetcher(url, { cache: "no-cache" });
  if (!response.ok) throw new Error(`Failed to load mission package ${url}: ${response.status}`);
  const value: unknown = await response.json();
  return parseRuntimeNavMissionAuthoringDocument(value as RuntimeNavMissionAuthoringDocument);
}

function normalizePackages(packages: RuntimeNavMissionPackageReference[]): RuntimeNavMissionPackageReference[] {
  const result: RuntimeNavMissionPackageReference[] = [];
  const seen = new Set<string>();
  for (const packageRef of packages) {
    const url = packageRef.url.trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    result.push({ url, merge: packageRef.merge, severityPolicy: parseRuntimeNavMissionDiagnosticsSeverityPolicy(packageRef.severityPolicy) });
  }
  return result;
}

function validateGameplaySourceRule(rule: RuntimeNavMissionRunnerRule, registry: RuntimeNavMissionGameplaySourceRegistry | null, url?: string): RuntimeNavMissionPackageDiagnostic[] {
  if (!registry || !rule.event || rule.event.source === "agent") return [];
  const sourceId = rule.event.sourceId;
  if (!sourceId || !isGameplayEventFilter(rule.event)) return [];
  const diagnostics: RuntimeNavMissionPackageDiagnostic[] = [];
  const kind = readGameplayKind(rule.event);
  const triggerIds = new Set(registry.triggers);
  const interactionIds = new Set(registry.interactions);
  if (kind === "trigger") {
    if (!triggerIds.has(sourceId)) return [createDiagnostic("warning", "gameplay_source.missing_trigger", `Runner rule ${rule.id} references missing trigger sourceId ${sourceId}.`, url, rule.id)];
    diagnostics.push(...validateGameplayEventName(rule, registry.triggerEvents[sourceId], "trigger", url));
    return diagnostics;
  }
  if (kind === "interaction") {
    if (!interactionIds.has(sourceId)) return [createDiagnostic("warning", "gameplay_source.missing_interaction", `Runner rule ${rule.id} references missing interaction sourceId ${sourceId}.`, url, rule.id)];
    diagnostics.push(...validateGameplayEventName(rule, registry.interactionEvents[sourceId], "interaction", url));
    return diagnostics;
  }
  if (!triggerIds.has(sourceId) && !interactionIds.has(sourceId)) return [createDiagnostic("warning", "gameplay_source.missing_source_id", `Runner rule ${rule.id} references missing gameplay sourceId ${sourceId}.`, url, rule.id)];
  if (triggerIds.has(sourceId)) diagnostics.push(...validateGameplayEventName(rule, registry.triggerEvents[sourceId], "trigger", url));
  if (interactionIds.has(sourceId)) diagnostics.push(...validateGameplayEventName(rule, registry.interactionEvents[sourceId], "interaction", url));
  return diagnostics;
}

function validateGameplayEventName(rule: RuntimeNavMissionRunnerRule, expectedEvent: string | undefined, kind: "trigger" | "interaction", url?: string): RuntimeNavMissionPackageDiagnostic[] {
  const eventName = rule.event?.event;
  if (!eventName || !expectedEvent || eventName === expectedEvent) return [];
  const code = kind === "trigger" ? "gameplay_source.trigger_event_mismatch" : "gameplay_source.interaction_event_mismatch";
  return [createDiagnostic("warning", code, `Runner rule ${rule.id} listens for ${kind} event ${eventName}, but world sourceId ${rule.event?.sourceId ?? "unknown"} emits ${expectedEvent}.`, url, rule.id)];
}

function readRuntimeNavMissionPackageUrlSeverityPolicy(): RuntimeNavMissionDiagnosticsSeverityPolicy | null {
  if (typeof window === "undefined") return null;
  const url = new URL(window.location.href);
  const policy: RuntimeNavMissionDiagnosticsSeverityPolicy = {};
  for (const value of url.searchParams.getAll("missionDiagnosticSeverity")) {
    const override = parseRuntimeNavMissionDiagnosticSeverityOverride(value);
    if (override) {
      const [code, severity] = override;
      policy.codes = { ...(policy.codes ?? {}), [code]: severity };
    }
  }
  if (url.searchParams.has("missionDiagnosticsStrict")) policy.warningAsError = true;
  if (url.searchParams.has("missionDiagnosticsNoInfo")) policy.hideInfo = true;
  return parseRuntimeNavMissionDiagnosticsSeverityPolicy(policy);
}

function isGameplayEventFilter(event: RuntimeNavMissionRunnerRule["event"]): boolean {
  if (!event) return false;
  if (event.source === "gameplay") return true;
  if (event.type === "gameplay" || event.type === "trigger" || event.type === "interaction") return true;
  if (event.kind === "trigger" || event.kind === "interaction") return true;
  return Boolean(event.sourceId && event.source !== "agent");
}

function readGameplayKind(event: RuntimeNavMissionRunnerRule["event"]): "trigger" | "interaction" | null {
  if (!event) return null;
  if (event.kind === "trigger" || event.kind === "interaction") return event.kind;
  if (event.type === "trigger" || event.type === "interaction") return event.type;
  return null;
}

function createReport(results: RuntimeNavMissionPackageLoadResult[], diagnostics: RuntimeNavMissionPackageDiagnostic[]): RuntimeNavMissionPackageDiagnosticsReport {
  const warnings = diagnostics.filter((diagnostic) => diagnostic.severity === "warning").length;
  const errors = diagnostics.filter((diagnostic) => diagnostic.severity === "error").length;
  const loadedPackages = results.filter((result) => result.ok).length;
  const failedPackages = results.length - loadedPackages;
  return { ok: errors === 0, packageCount: results.length, loadedPackages, failedPackages, warnings, errors, diagnostics, results };
}

function countDocument(document: RuntimeNavMissionAuthoringDocument): RuntimeNavMissionPackageCounts {
  return { missions: document.missions.length, objectives: document.objectives.length, runnerRules: document.runnerRules.length };
}

function createDiagnostic(severity: RuntimeNavMissionPackageDiagnosticSeverity, code: string, message: string, url?: string, id?: string): RuntimeNavMissionPackageDiagnostic {
  return { severity, code, message, url, id };
}
