# Splat World Engine — Mission Diagnostics Verified Imported ZIP Artifacts

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.79 在 0.78 的外部 ZIP 导入与验证能力之上补齐 verified imported entry inspection / extraction：只有外部 ZIP 完整通过结构、CRC-32、SHA-256 与当前可信 extraction 的 exact byte comparison 后，Runtime 才会从已验证的 local-header data ranges 构造 typed imported artifacts，并允许安全预览、复制和下载。

```text
Validation artifact bundle
  ├── exact-text bundle verification
  ├── trusted artifact extraction
  ├── deterministic ZIP creation
  ├── generated ZIP verification
  ├── bounded external ZIP import
  ├── independent ZIP verification
  └── verified imported entry extraction
      ├── local-header range revalidation
      ├── exact stored-byte copy
      ├── CRC-32 revalidation
      ├── SHA-256 revalidation
      ├── trusted artifact byte comparison
      ├── safe text inspection
      ├── clipboard copy
      └── single / fixed-order download
```

## Runtime/Builder 0.79 能力

新增：

```text
src/large/
└── NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactExtraction.ts
```

更新：

```text
src/large/NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImport.ts
src/large/NavMissionDiagnosticsManifestHudValidationArtifactBundleExtraction.ts
```

## Verified import extraction gate

核心 API：

```ts
extractRuntimeNavMissionDiagnosticsManifestHudValidationArtifactsFromVerifiedArchiveImport(
  importResult,
  extraction,
)
```

该 API 同时要求：

```text
importResult.status === "verified"
importResult.verification.valid === true
importResult.verification.issues.length === 0
importResult.data !== null
extraction.status === "extracted"
```

任何 verification-failed、rejected、read-failed、verification-error 或缺少 exact ZIP bytes 的结果都不会暴露 entry 内容。

## 二次完整性检查

0.79 不会因为 0.78 已经验证成功就直接返回 `Uint8Array.subarray()`。

每个 imported entry 都重新执行：

1. 从 verifier 返回的 `localHeaderOffset` 读取 local file header。
2. 重新验证 local-header signature。
3. 重新验证 UTF-8 flag、Store method 与 empty extra field。
4. 重新计算 filename、data offset 与 data end。
5. 验证所有 byte ranges 仍在 exact ZIP bounds 内。
6. 使用 fatal UTF-8 decoder 重新读取 filename。
7. 核对 verified entry、trusted artifact 与 local header 的 filename / byte size。
8. 对 exact stored bytes 重新计算 CRC-32。
9. 对 exact stored bytes 重新计算 SHA-256。
10. 与 trusted artifact text 的 UTF-8 bytes 逐字节比较。
11. 重新进行 fatal UTF-8 text decoding。
12. 复制 exact bytes 到独立 `Uint8Array` 后才返回 artifact。

因此，即使调用方在 verification 后修改 import result、原 ZIP buffer 或 metadata，也无法绕过 extraction gate。

## Extraction 状态

```text
extracted
import-unavailable
verification-unavailable
verification-failed
archive-data-unavailable
artifact-set-invalid
crypto-unavailable
extraction-error
```

失败结果始终满足：

```ts
{
  artifactCount: 0,
  totalBytes: 0,
  artifacts: [],
  error: "...",
}
```

## Typed imported artifact

```ts
{
  kind,
  filename,
  mimeType,
  bytes,
  crc32Hex,
  checksumHex,
  dataOffset,
  dataEnd,
  data: Uint8Array,
  text,
}
```

`data` 是从 verified ZIP entry bytes 复制出的独立 buffer，不与原始 imported ZIP `Uint8Array` 共享可变内存。

固定 artifact 顺序：

```text
1. validation-report-text
2. validation-report-json
3. validation-report-json-sha256
```

## Import API result

0.78 import result 新增：

```ts
entryExtraction:
  RuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveExtractionResult
  | null
```

Import 状态新增：

```text
entry-extraction-failed
```

完整成功条件：

```text
ZIP verification passed
AND imported artifact extraction passed
```

只有两个阶段都成功，最终 import status 才是：

```text
verified
```

## Inspection UI

外部 ZIP 验证并提取成功后，HUD 显示：

```text
Verified imported ZIP entries · 3 artifacts
  ├── Download all verified imported artifacts
  ├── validation report text
  │   ├── metadata
  │   ├── safe text preview
  │   ├── Copy verified imported text
  │   └── Download verified imported artifact
  ├── validation report JSON
  │   └── ...
  └── validation report JSON SHA-256
      └── ...
```

Preview 使用 `textContent` 写入，不执行 imported text，也不使用 `innerHTML`。

默认 preview 上限：

```text
4096 characters
```

超过上限只截断 UI preview，不修改 artifact 的 `text` 或 `data`。

可通过以下参数调整：

```ts
{
  maxPreviewCharacters: 8192,
}
```

## Download API

单项下载：

```ts
downloadRuntimeNavMissionDiagnosticsManifestHudValidationImportedArchiveArtifact(
  artifact,
)
```

固定顺序批量下载：

```ts
downloadRuntimeNavMissionDiagnosticsManifestHudValidationImportedArchiveArtifacts(
  result,
)
```

下载流程：

```text
copied Uint8Array
  → isolated ArrayBuffer
  → MIME-aware Blob
  → temporary object URL
  → anchor download
  → guaranteed URL revocation
```

未提取成功的 result 无法触发批量下载。

## Clipboard API

```ts
copyRuntimeNavMissionDiagnosticsManifestHudValidationImportedArchiveArtifactText(
  artifact,
)
```

仅复制 already-verified `artifact.text`。Clipboard API 不可用或写入失败时返回明确错误，不会使用隐藏 textarea 或 DOM command fallback。

## Callbacks

Archive import control 新增：

```ts
{
  onExtract(entryExtraction, importResult, extraction),
  onImportedArtifactDownload(artifact, entryExtraction),
  onImportedDownloadAll(entryExtraction),
  onImportedArtifactCopy(artifact, entryExtraction),
}
```

顶层 extraction actions 透传：

```ts
{
  onArchiveImportExtract,
  onArchiveImportedArtifactDownload,
  onArchiveImportedDownloadAll,
  onArchiveImportedArtifactCopy,
}
```

## HUD data attributes

Import root：

```text
data-bundle-imported-archive-extraction-status
data-bundle-imported-archive-extraction-artifact-count
data-bundle-imported-archive-extraction-total-bytes
data-bundle-imported-archive-extraction-source-filename
```

Imported artifact details：

```text
data-bundle-imported-archive-artifact-kind
data-bundle-imported-archive-artifact-filename
data-bundle-imported-archive-artifact-bytes
data-bundle-imported-archive-artifact-crc32
data-bundle-imported-archive-artifact-checksum
data-bundle-imported-archive-artifact-data-offset
data-bundle-imported-archive-artifact-data-end
```

Actions：

```text
data-bundle-imported-archive-action="copy"
data-bundle-imported-archive-action="download"
data-bundle-imported-archive-action="download-all"
```

## Security boundary

- 不信任 file extension 或 reported MIME type。
- 不从 verification-failed ZIP 暴露任何 entry bytes。
- 不向文件系统解压 ZIP。
- 不解释或执行 imported text。
- 不使用 `innerHTML` 渲染 preview。
- 所有 offset 与 length 在读取前验证。
- Entry filename 必须与 trusted extraction 完全一致。
- Entry bytes 必须通过 CRC-32、SHA-256 与 exact byte comparison。
- 公开 artifact 使用 copied bytes，不共享原 import buffer。
- Blob URL 只在用户显式下载时创建，并在点击后立即回收。

## Version

```text
package version: 0.79.0
runtime label: runtime 0.79
```

## Roadmap

- [x] Mission diagnostics manifest validation text report
- [x] Mission diagnostics manifest validation JSON report
- [x] Mission diagnostics manifest validation JSON SHA-256
- [x] Mission diagnostics manifest validation artifact bundle
- [x] Mission diagnostics validation artifact bundle import / verification
- [x] Mission diagnostics verified artifact extraction
- [x] Mission diagnostics deterministic verified artifact ZIP archive
- [x] Mission diagnostics verified artifact ZIP archive verification
- [x] Mission diagnostics external verified artifact ZIP import / verification
- [x] Mission diagnostics verified imported ZIP artifact inspection / extraction
- [ ] Mission diagnostics verified imported archive provenance report workflow

## Next

```text
Mission diagnostics policy manifest validation artifact bundle
verified imported archive provenance report workflow
```

下一阶段将基于 verified import 与 imported artifacts 生成 canonical provenance text/JSON artifact，记录 source ZIP SHA-256、entry order、local data ranges、CRC-32、entry SHA-256、trusted extraction relationship 与完整 verification checks。
