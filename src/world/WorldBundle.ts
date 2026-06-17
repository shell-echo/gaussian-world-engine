import { assertWorldManifest, type WorldManifest } from "../types/world";
import { createZip, readZip, type ZipEntryInput } from "./ZipArchive";

const BUNDLE_FORMAT = "splatworld";
const BUNDLE_VERSION = 1;
const BUNDLE_PREFIX = "bundle:///";
const BUNDLE_MIME = "application/vnd.splatworld+zip";
const DATABASE_NAME = "splat-world-engine";
const DATABASE_VERSION = 1;
const STAGING_STORE = "staged-world-bundles";
const MAX_STAGED_BYTES = 512 * 1024 * 1024;

export type BundleAssetKind = "splat" | "visual" | "audio";

export interface BundleAssetRecord {
  path: string;
  kind: BundleAssetKind;
  objectId: string;
  mediaType: string;
  bytes: number;
  sourceName?: string;
}

export interface ExternalAssetRecord {
  kind: BundleAssetKind;
  objectId: string;
  url: string;
  reason: string;
}

export interface WorldBundleMetadata {
  format: typeof BUNDLE_FORMAT;
  version: typeof BUNDLE_VERSION;
  entry: "world.json";
  worldName: string;
  createdAt: string;
  storage: "zip-store";
  assets: BundleAssetRecord[];
  externalAssets: ExternalAssetRecord[];
}

export interface WorldBundleExport {
  blob: Blob;
  metadata: WorldBundleMetadata;
  fileName: string;
}

export interface LoadedWorldBundle {
  manifest: WorldManifest;
  metadata: WorldBundleMetadata;
  sourceName: string;
  totalAssetBytes: number;
  dispose(): void;
}

export type BundleProgress = (message: string) => void;

interface CollectedAsset {
  record: BundleAssetRecord;
  bytes: Uint8Array;
}

interface StagedBundleRecord {
  blob: Blob;
  name: string;
  createdAt: number;
}

export async function exportWorldBundle(
  sourceManifest: WorldManifest,
  onProgress?: BundleProgress,
): Promise<WorldBundleExport> {
  const manifest = structuredClone(sourceManifest);
  const collector = new AssetCollector(onProgress);

  for (const splat of manifest.splats) {
    splat.url = await collector.collect(splat.url, "splat", splat.id, fileNameFromUrl(splat.url));
  }

  for (const collider of manifest.colliders) {
    if (collider.visual) {
      collider.visual.url = await collector.collect(
        collider.visual.url,
        "visual",
        collider.id,
        collider.visual.sourceName ?? fileNameFromUrl(collider.visual.url),
      );
    }
    if (collider.audio) {
      collider.audio.url = await collector.collect(
        collider.audio.url,
        "audio",
        collider.id,
        fileNameFromUrl(collider.audio.url),
      );
    }
  }

  const metadata: WorldBundleMetadata = {
    format: BUNDLE_FORMAT,
    version: BUNDLE_VERSION,
    entry: "world.json",
    worldName: manifest.name,
    createdAt: new Date().toISOString(),
    storage: "zip-store",
    assets: collector.assets.map((asset) => asset.record),
    externalAssets: collector.externalAssets,
  };

  onProgress?.("写入 world.json 与资产索引");
  const entries: ZipEntryInput[] = [
    {
      name: "bundle.json",
      data: encodeJson(metadata),
    },
    {
      name: "world.json",
      data: encodeJson(manifest),
    },
    ...collector.assets.map((asset) => ({
      name: asset.record.path,
      data: asset.bytes,
    })),
  ];
  const archive = createZip(entries);
  const fileName = `${safeStem(manifest.name || "world")}.splatworld`;
  onProgress?.(`世界包已生成 · ${formatBytes(archive.byteLength)}`);
  return {
    blob: new Blob([archive], { type: BUNDLE_MIME }),
    metadata,
    fileName,
  };
}

export async function loadWorldBundle(
  input: Blob | ArrayBuffer | Uint8Array,
  sourceName = "world.splatworld",
): Promise<LoadedWorldBundle> {
  const bytes = await toBytes(input);
  const entries = await readZip(bytes);
  const metadata = parseMetadata(requiredEntry(entries, "bundle.json").data);
  const manifestEntry = requiredEntry(entries, metadata.entry);
  const parsedManifest: unknown = JSON.parse(new TextDecoder().decode(manifestEntry.data));
  assertWorldManifest(parsedManifest);
  const manifest = structuredClone(parsedManifest);

  const assetRecords = new Map(metadata.assets.map((asset) => [asset.path, asset]));
  const objectUrls = new Map<string, string>();
  const resolveAssetUrl = (url: string): string => {
    if (!url.startsWith(BUNDLE_PREFIX)) return url;
    const path = normalizeBundlePath(url.slice(BUNDLE_PREFIX.length));
    const entry = entries.get(path);
    if (!entry) throw new Error(`World bundle asset is missing: ${path}`);
    let objectUrl = objectUrls.get(path);
    if (!objectUrl) {
      const mediaType = assetRecords.get(path)?.mediaType ?? mediaTypeFromPath(path);
      objectUrl = URL.createObjectURL(new Blob([entry.data], { type: mediaType }));
      objectUrls.set(path, objectUrl);
    }
    return objectUrl;
  };

  for (const splat of manifest.splats) {
    splat.url = resolveAssetUrl(splat.url);
  }
  for (const collider of manifest.colliders) {
    if (collider.visual) collider.visual.url = resolveAssetUrl(collider.visual.url);
    if (collider.audio) collider.audio.url = resolveAssetUrl(collider.audio.url);
  }
  assertWorldManifest(manifest);

  const totalAssetBytes = metadata.assets.reduce((sum, asset) => sum + asset.bytes, 0);
  let disposed = false;
  return {
    manifest,
    metadata,
    sourceName,
    totalAssetBytes,
    dispose(): void {
      if (disposed) return;
      disposed = true;
      for (const url of objectUrls.values()) URL.revokeObjectURL(url);
      objectUrls.clear();
    },
  };
}

export async function stageWorldBundle(file: File): Promise<string> {
  if (file.size > MAX_STAGED_BYTES) {
    throw new Error(`World bundle exceeds ${formatBytes(MAX_STAGED_BYTES)}.`);
  }
  const key = crypto.randomUUID();
  const record: StagedBundleRecord = {
    blob: file,
    name: file.name || "world.splatworld",
    createdAt: Date.now(),
  };
  const database = await openDatabase();
  await runRequest(database, "readwrite", (store) => store.put(record, key));
  database.close();
  return key;
}

export async function consumeStagedWorldBundle(key: string): Promise<LoadedWorldBundle> {
  const database = await openDatabase();
  const record = await runRequest<StagedBundleRecord | undefined>(
    database,
    "readonly",
    (store) => store.get(key),
  );
  if (!record) {
    database.close();
    throw new Error("Staged world bundle was not found. Please choose the file again.");
  }
  await runRequest(database, "readwrite", (store) => store.delete(key));
  database.close();
  return loadWorldBundle(record.blob, record.name);
}

class AssetCollector {
  readonly assets: CollectedAsset[] = [];
  readonly externalAssets: ExternalAssetRecord[] = [];

  private readonly pathByUrl = new Map<string, string>();
  private readonly usedPaths = new Set<string>();
  private totalBytes = 0;

  constructor(private readonly onProgress?: BundleProgress) {}

  async collect(
    url: string,
    kind: BundleAssetKind,
    objectId: string,
    sourceName?: string,
  ): Promise<string> {
    const previousPath = this.pathByUrl.get(url);
    if (previousPath) return toBundleUrl(previousPath);
    if (url.startsWith(BUNDLE_PREFIX)) {
      throw new Error(`Unresolved bundle URL cannot be exported: ${url}`);
    }

    this.onProgress?.(`收集 ${kind} · ${objectId}`);
    try {
      const response = await fetch(url, { cache: "force-cache", credentials: "same-origin" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      const mediaType = normalizeMediaType(response.headers.get("content-type")) || mediaTypeFromPath(sourceName ?? url);
      this.totalBytes += bytes.byteLength;
      if (this.totalBytes > MAX_STAGED_BYTES) {
        throw new Error(`Packaged assets exceed ${formatBytes(MAX_STAGED_BYTES)}.`);
      }
      const path = this.createPath(kind, objectId, sourceName, url, mediaType);
      const record: BundleAssetRecord = {
        path,
        kind,
        objectId,
        mediaType,
        bytes: bytes.byteLength,
        ...(sourceName ? { sourceName } : {}),
      };
      this.assets.push({ record, bytes });
      this.pathByUrl.set(url, path);
      return toBundleUrl(path);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.externalAssets.push({ kind, objectId, url, reason });
      return url;
    }
  }

  private createPath(
    kind: BundleAssetKind,
    objectId: string,
    sourceName: string | undefined,
    url: string,
    mediaType: string,
  ): string {
    const directory = kind === "splat" ? "splats" : kind === "visual" ? "models" : "audio";
    const preferred = sourceName ?? fileNameFromUrl(url);
    const extension = extensionFromName(preferred) || extensionFromMediaType(mediaType) || defaultExtension(kind);
    const sourceStem = preferred ? preferred.replace(/\.[^.]+$/, "") : `${objectId}-${kind}`;
    const base = `${directory}/${safeStem(sourceStem || objectId)}.${extension}`;
    let path = base;
    let index = 2;
    while (this.usedPaths.has(path)) {
      path = base.replace(`.${extension}`, `-${index}.${extension}`);
      index += 1;
    }
    this.usedPaths.add(path);
    return path;
  }
}

function parseMetadata(bytes: Uint8Array): WorldBundleMetadata {
  const value: unknown = JSON.parse(new TextDecoder().decode(bytes));
  if (!value || typeof value !== "object") throw new Error("Invalid bundle.json metadata.");
  const metadata = value as Partial<WorldBundleMetadata>;
  if (
    metadata.format !== BUNDLE_FORMAT ||
    metadata.version !== BUNDLE_VERSION ||
    metadata.entry !== "world.json" ||
    typeof metadata.worldName !== "string" ||
    typeof metadata.createdAt !== "string" ||
    metadata.storage !== "zip-store" ||
    !Array.isArray(metadata.assets) ||
    !Array.isArray(metadata.externalAssets)
  ) {
    throw new Error("Unsupported .splatworld metadata format.");
  }
  const paths = new Set<string>();
  for (const asset of metadata.assets) {
    if (
      !asset ||
      typeof asset.path !== "string" ||
      !isAssetKind(asset.kind) ||
      typeof asset.objectId !== "string" ||
      typeof asset.mediaType !== "string" ||
      typeof asset.bytes !== "number" ||
      asset.bytes < 0
    ) {
      throw new Error("Invalid asset record in bundle.json.");
    }
    const path = normalizeBundlePath(asset.path);
    if (paths.has(path)) throw new Error(`Duplicate asset path in bundle.json: ${path}`);
    paths.add(path);
  }
  return metadata as WorldBundleMetadata;
}

function requiredEntry(
  entries: ReadonlyMap<string, { data: Uint8Array }>,
  path: string,
): { data: Uint8Array } {
  const entry = entries.get(normalizeBundlePath(path));
  if (!entry) throw new Error(`World bundle is missing ${path}.`);
  return entry;
}

function isAssetKind(value: unknown): value is BundleAssetKind {
  return value === "splat" || value === "visual" || value === "audio";
}

function toBundleUrl(path: string): string {
  return `${BUNDLE_PREFIX}${normalizeBundlePath(path)}`;
}

function normalizeBundlePath(value: string): string {
  const normalized = value.replaceAll("\\", "/").replace(/^\/+/, "");
  if (!normalized || normalized.split("/").some((segment) => segment === "." || segment === "..")) {
    throw new Error(`Unsafe world bundle path: ${value}`);
  }
  return normalized;
}

function encodeJson(value: unknown): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(value, null, 2)}\n`);
}

async function toBytes(input: Blob | ArrayBuffer | Uint8Array): Promise<Uint8Array> {
  if (input instanceof Uint8Array) return input;
  if (input instanceof Blob) return new Uint8Array(await input.arrayBuffer());
  return new Uint8Array(input);
}

function safeStem(value: string): string {
  const normalized = value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return normalized || "world";
}

function fileNameFromUrl(value: string): string | undefined {
  if (value.startsWith("data:") || value.startsWith("blob:")) return undefined;
  try {
    const pathname = new URL(value, window.location.href).pathname;
    const name = pathname.split("/").pop();
    return name ? decodeURIComponent(name) : undefined;
  } catch {
    return undefined;
  }
}

function extensionFromName(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const match = value.toLowerCase().match(/\.([a-z0-9]{1,8})(?:[?#].*)?$/);
  return match?.[1];
}

function extensionFromMediaType(mediaType: string): string | undefined {
  const normalized = normalizeMediaType(mediaType);
  const extensions: Record<string, string> = {
    "model/gltf-binary": "glb",
    "application/octet-stream": "bin",
    "application/zip": "zip",
    "audio/mpeg": "mp3",
    "audio/ogg": "ogg",
    "audio/wav": "wav",
    "audio/webm": "webm",
    "audio/mp4": "m4a",
  };
  return extensions[normalized];
}

function mediaTypeFromPath(value: string): string {
  const extension = extensionFromName(value);
  const mediaTypes: Record<string, string> = {
    glb: "model/gltf-binary",
    spz: "application/octet-stream",
    ply: "application/octet-stream",
    splat: "application/octet-stream",
    ksplat: "application/octet-stream",
    sog: "application/octet-stream",
    rad: "application/octet-stream",
    zip: "application/zip",
    mp3: "audio/mpeg",
    ogg: "audio/ogg",
    wav: "audio/wav",
    webm: "audio/webm",
    m4a: "audio/mp4",
  };
  return (extension && mediaTypes[extension]) || "application/octet-stream";
}

function normalizeMediaType(value: string | null): string {
  return value?.split(";", 1)[0]?.trim().toLowerCase() ?? "";
}

function defaultExtension(kind: BundleAssetKind): string {
  if (kind === "visual") return "glb";
  if (kind === "audio") return "ogg";
  return "spz";
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 ** 2).toFixed(1)} MB`;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.addEventListener("upgradeneeded", () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STAGING_STORE)) {
        database.createObjectStore(STAGING_STORE);
      }
    });
    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () => reject(request.error ?? new Error("Unable to open IndexedDB.")));
  });
}

function runRequest<T = IDBValidKey>(
  database: IDBDatabase,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STAGING_STORE, mode);
    const request = operation(transaction.objectStore(STAGING_STORE));
    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () => reject(request.error ?? new Error("IndexedDB request failed.")));
    transaction.addEventListener("abort", () => reject(transaction.error ?? new Error("IndexedDB transaction aborted.")));
  });
}
