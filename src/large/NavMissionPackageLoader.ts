import type { RuntimeNavGameplayApi } from "./NavGameplayApi.js";
import type {
  RuntimeNavMissionAuthoringApplyOptions,
  RuntimeNavMissionAuthoringApplyResult,
  RuntimeNavMissionAuthoringDocument,
  RuntimeNavMissionAuthoringMetadata,
} from "./NavMissionAuthoring.js";
import { parseRuntimeNavMissionAuthoringDocument } from "./NavMissionAuthoring.js";

export interface RuntimeNavMissionPackageReference {
  url: string;
  merge?: boolean;
}

export interface RuntimeNavMissionPackageLoadOptions {
  nav: RuntimeNavGameplayApi;
  packages: RuntimeNavMissionPackageReference[];
  fetcher?: typeof fetch;
  merge?: boolean;
  onStatus?: (message: string) => void;
}

export interface RuntimeNavMissionPackageLoadResult {
  url: string;
  metadata: RuntimeNavMissionAuthoringMetadata;
  apply: RuntimeNavMissionAuthoringApplyResult;
}

export async function loadRuntimeNavMissionPackages(
  options: RuntimeNavMissionPackageLoadOptions,
): Promise<RuntimeNavMissionPackageLoadResult[]> {
  const fetcher = options.fetcher ?? fetch;
  const packages = normalizePackages(options.packages);
  const results: RuntimeNavMissionPackageLoadResult[] = [];
  for (const [index, packageRef] of packages.entries()) {
    options.onStatus?.(`Loading mission package ${index + 1}/${packages.length}`);
    const document = await fetchMissionPackage(fetcher, packageRef.url);
    const applyOptions: RuntimeNavMissionAuthoringApplyOptions = {
      merge: packageRef.merge ?? options.merge ?? index > 0,
    };
    const apply = options.nav.restoreMissionAuthoring(document, applyOptions);
    results.push({
      url: packageRef.url,
      metadata: document.metadata,
      apply,
    });
  }
  if (results.length > 0) options.onStatus?.(`Loaded ${results.length} mission package(s)`);
  return results;
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
