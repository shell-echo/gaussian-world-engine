import type { ColliderData } from "../types/world.js";
import type { RuntimeNavGameplayApi } from "./NavGameplayApi.js";
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

export interface RuntimeNavMissionGameplaySourceRegistry {
  triggers: string[];
  interactions: string[];
}

export interface RuntimeNavMissionPackageReference {
  url: string;
  merge?: boolean;
}

export interface RuntimeNavMissionPackageValidationOptions {
  gameplaySources?: RuntimeNavMissionGameplaySourceRegistry | null;
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
  for (const collider of colliders) {
    if (collider.behavior?.mode === "trigger") triggers.add(collider.id);
    if (collider.interactable) interactions.add(collider.id);
  }
  return {
    triggers: Array.from(triggers).sort(),
    interactions: Array.from(interactions).sort(),
  };
}

export async function loadRuntimeNavMissionPackages(
  options: RuntimeNavMissionPackageLoadOptions,
): Promise<RuntimeNavMissionPackageDiagnosticsReport> {
  const fetcher = options.fetcher ?? fetch;
  const packages = normalizePackages(options.packages);
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
    if (missionIds.has(mission.id)) {
      diagnostics.push(createDiagnostic("error", "mission.duplicate_id", `Duplicate mission id: ${mission.id}`, url, mission.id));
    }
    missionIds.add(mission.id);
  }

  for (const objective of document.objectives) {
    if (objectiveIds.has(objective.id)) {
      diagnostics.push(createDiagnostic("error", "objective.duplicate_id", `Duplicate objective id: ${objective.id}`, url, objective.id));
    }
    objectiveIds.add(objective.id);
    if (objective.missionId && !missionIds.has(objective.missionId)) {
      diagnostics.push(createDiagnostic("warning", "objective.missing_mission", `Objective ${objective.id} references missing mission ${objective.missionId}.`, url, objective.id));
    }
    for (const dependencyId of objective.dependsOn ?? []) {
      if (!objectiveIds.has(dependencyId)) {
        diagnostics.push(createDiagnostic("warning", "objective.missing_dependency", `Objective ${objective.id} depends on missing objective ${dependencyId}.`, url, objective.id));
      }
    }
    for (const missionId of objective.requiredMissions ?? []) {
      if (!missionIds.has(missionId)) {
        diagnostics.push(createDiagnostic("warning", "objective.missing_required_mission", `Objective ${objective.id} requires missing mission ${missionId}.`, url, objective.id));
      }
    }
    for (const condition of objective.conditions ?? []) {
      if (condition.kind === "mission" && !missionIds.has(condition.id)) {
        diagnostics.push(createDiagnostic("warning", "objective.condition_missing_mission", `Objective ${objective.id} condition references missing mission ${condition.id}.`, url, objective.id));
      }
      if (condition.kind === "objective" && !objectiveIds.has(condition.id)) {
        diagnostics.push(createDiagnostic("warning", "objective.condition_missing_objective", `Objective ${objective.id} condition references missing objective ${condition.id}.`, url, objective.id));
      }
    }
  }

  for (const rule of document.runnerRules) {
    if (runnerRuleIds.has(rule.id)) {
      diagnostics.push(createDiagnostic("error", "runner_rule.duplicate_id", `Duplicate runner rule id: ${rule.id}`, url, rule.id));
    }
    runnerRuleIds.add(rule.id);
    if (!rule.event || ((rule.event.source ?? "any") === "any" && (rule.event.type ?? "any") === "any")) {
      diagnostics.push(createDiagnostic("warning", "runner_rule.broad_event", `Runner rule ${rule.id} has a broad event filter.`, url, rule.id));
    }
    if (rule.enabled === false) {
      diagnostics.push(createDiagnostic("info", "runner_rule.disabled", `Runner rule ${rule.id} is disabled.`, url, rule.id));
    }
    if (rule.action.kind === "mission" && !missionIds.has(rule.action.id)) {
      diagnostics.push(createDiagnostic("error", "runner_rule.missing_mission_action_target", `Runner rule ${rule.id} targets missing mission ${rule.action.id}.`, url, rule.id));
    }
    if (rule.action.kind === "objective" && !objectiveIds.has(rule.action.id)) {
      diagnostics.push(createDiagnostic("error", "runner_rule.missing_objective_action_target", `Runner rule ${rule.id} targets missing objective ${rule.action.id}.`, url, rule.id));
    }
    diagnostics.push(...validateGameplaySourceRule(rule, options.gameplaySources ?? null, url));
  }

  diagnostics.push(createDiagnostic("info", "package.summary", `Mission package contains ${document.missions.length} mission(s), ${document.objectives.length} objective(s), and ${document.runnerRules.length} runner rule(s).`, url));
  return diagnostics;
}

async function loadSingleRuntimeNavMissionPackage(options: {
  fetcher: typeof fetch;
  nav: RuntimeNavGameplayApi;
  packageRef: RuntimeNavMissionPackageReference;
  merge: boolean;
  gameplaySources?: RuntimeNavMissionGameplaySourceRegistry | null;
}): Promise<RuntimeNavMissionPackageLoadResult> {
  const diagnostics: RuntimeNavMissionPackageDiagnostic[] = [];
  try {
    const document = await fetchMissionPackage(options.fetcher, options.packageRef.url);
    diagnostics.push(...validateRuntimeNavMissionPackageDocument(document, options.packageRef.url, {
      gameplaySources: options.gameplaySources,
    }));
    const hasErrors = diagnostics.some((diagnostic) => diagnostic.severity === "error");
    if (hasErrors) {
      return {
        url: options.packageRef.url,
        ok: false,
        merge: options.merge,
        metadata: document.metadata,
        counts: countDocument(document),
        diagnostics,
      };
    }
    const applyOptions: RuntimeNavMissionAuthoringApplyOptions = { merge: options.merge };
    const apply = options.nav.restoreMissionAuthoring(document, applyOptions);
    return {
      url: options.packageRef.url,
      ok: true,
      merge: options.merge,
      metadata: document.metadata,
      counts: countDocument(document),
      apply,
      diagnostics,
    };
  } catch (error) {
    diagnostics.push(createDiagnostic("error", "package.load_failed", error instanceof Error ? error.message : String(error), options.packageRef.url));
    return {
      url: options.packageRef.url,
      ok: false,
      merge: options.merge,
      counts: { missions: 0, objectives: 0, runnerRules: 0 },
      diagnostics,
    };
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
    result.push({ url, merge: packageRef.merge });
  }
  return result;
}

function validateGameplaySourceRule(
  rule: RuntimeNavMissionRunnerRule,
  registry: RuntimeNavMissionGameplaySourceRegistry | null,
  url?: string,
): RuntimeNavMissionPackageDiagnostic[] {
  if (!registry || !rule.event || rule.event.source === "agent") return [];
  const sourceId = rule.event.sourceId;
  if (!sourceId || !isGameplayEventFilter(rule.event)) return [];
  const kind = readGameplayKind(rule.event);
  const triggerIds = new Set(registry.triggers);
  const interactionIds = new Set(registry.interactions);
  if (kind === "trigger" && !triggerIds.has(sourceId)) {
    return [createDiagnostic("warning", "gameplay_source.missing_trigger", `Runner rule ${rule.id} references missing trigger sourceId ${sourceId}.`, url, rule.id)];
  }
  if (kind === "interaction" && !interactionIds.has(sourceId)) {
    return [createDiagnostic("warning", "gameplay_source.missing_interaction", `Runner rule ${rule.id} references missing interaction sourceId ${sourceId}.`, url, rule.id)];
  }
  if (!kind && !triggerIds.has(sourceId) && !interactionIds.has(sourceId)) {
    return [createDiagnostic("warning", "gameplay_source.missing_source_id", `Runner rule ${rule.id} references missing gameplay sourceId ${sourceId}.`, url, rule.id)];
  }
  return [];
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

function createReport(
  results: RuntimeNavMissionPackageLoadResult[],
  diagnostics: RuntimeNavMissionPackageDiagnostic[],
): RuntimeNavMissionPackageDiagnosticsReport {
  const warnings = diagnostics.filter((diagnostic) => diagnostic.severity === "warning").length;
  const errors = diagnostics.filter((diagnostic) => diagnostic.severity === "error").length;
  const loadedPackages = results.filter((result) => result.ok).length;
  const failedPackages = results.length - loadedPackages;
  return {
    ok: errors === 0,
    packageCount: results.length,
    loadedPackages,
    failedPackages,
    warnings,
    errors,
    diagnostics,
    results,
  };
}

function countDocument(document: RuntimeNavMissionAuthoringDocument): RuntimeNavMissionPackageCounts {
  return {
    missions: document.missions.length,
    objectives: document.objectives.length,
    runnerRules: document.runnerRules.length,
  };
}

function createDiagnostic(
  severity: RuntimeNavMissionPackageDiagnosticSeverity,
  code: string,
  message: string,
  url?: string,
  id?: string,
): RuntimeNavMissionPackageDiagnostic {
  return { severity, code, message, url, id };
}
