# Splat World Engine — Mission Diagnostics Verified Import Provenance

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.80 在 0.79 的 verified imported ZIP artifact extraction 之上增加确定性 provenance report workflow：只有外部 ZIP 完整通过 archive verification、entry extraction 与 trusted artifact relationship 复核后，Runtime 才会生成 provenance text、canonical JSON 与 JSON SHA-256 artifact。

```text
Validation artifact bundle
  ├── exact-text bundle verification
  ├── trusted artifact extraction
  ├── deterministic ZIP creation
  ├── generated ZIP verification
  ├── bounded external ZIP import
  ├── independent ZIP verification
  ├── verified imported entry extraction
  └── deterministic provenance artifacts
      ├── source archive SHA-256
      ├── ZIP verification checks
      ├── trusted artifact metadata
      ├── imported entry data ranges
      ├── CRC-32 relationships
      ├── entry SHA-256 relationships
      ├── exact text relationships
      ├── canonical provenance JSON
      └── provenance JSON SHA-256
```

## Runtime/Builder 0.80 能力

新增：

```text
src/large/
└── NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenance.ts
```

更新：

```text
src/large/NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImport.ts
src/large/NavMissionDiagnosticsManifestHudValidationArtifactBundleExtraction.ts
```

## Provenance creation gate

核心 API：

```ts
createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenance(
  entryExtraction,
)
```

该 API 同时要求：

```text
importResult.status === "verified"
importResult.verification.valid === true
importResult.verification.issues.length === 0
importResult.verification.archiveChecksumHex !== null
importResult.data !== null
entryExtraction.status === "extracted"
entryExtraction.extraction.status === "extracted"
```

任何未验证 ZIP、缺少 exact ZIP bytes、ZIP verification issue、entry extraction failure 或 trusted extraction failure 都不会产生 provenance artifacts。

## 生成前重新验证

Provenance builder 不会直接复制 0.77、0.78 或 0.79 返回的 metadata。

生成前会重新执行：

1. 对 exact source ZIP bytes 重新计算 SHA-256。
2. 核对 source ZIP SHA-256 与 archive verifier 结果。
3. 核对 verified entries、imported artifacts 与 trusted artifacts 数量均为三项。
4. 核对固定 artifact kind 和 entry order。
5. 核对 filename、MIME type 与 byte size。
6. 核对 imported `dataEnd - dataOffset` 与 artifact byte size。
7. 对 copied imported entry bytes 重新计算 CRC-32。
8. 对 copied imported entry bytes 重新计算 SHA-256。
9. 核对 verifier、imported artifact 与 trusted artifact checksums。
10. 将 trusted artifact text 重新编码为 UTF-8，并逐字节比较 imported data。
11. 核对 imported text 与 trusted text 完全一致。

任一关系发生变化时，provenance result 返回 `relationship-invalid`，且 artifact 数量为零。

## Provenance schema

```text
splat-world-engine/
mission-diagnostics-policy-manifest-verified-imported-archive-provenance
```

Schema version：

```text
1
```

Document 结构：

```ts
{
  schema,
  schemaVersion,
  target,
  sourceArchive: {
    filename,
    reportedMimeType,
    reportedBytes,
    exactBytes,
    checksum: {
      algorithm: "SHA-256",
      input: "archive-bytes",
      hex,
    },
  },
  verification: {
    valid: true,
    issueCount: 0,
    archiveBytes,
    entryCount,
    totalUncompressedBytes,
    checks: {
      archiveChecksum: true,
      eocd: true,
      centralDirectory: true,
      entryOrder: true,
      localHeadersVerified,
      deterministicMetadataVerified,
      crc32Verified,
      sha256Verified,
    },
  },
  trustedExtraction: {
    status: "extracted",
    bundleStatus,
    artifactCount,
    totalBytes,
    artifacts,
  },
  importedExtraction: {
    status: "extracted",
    sourceArchiveFilename,
    artifactCount,
    totalBytes,
    artifacts,
  },
  relationships,
}
```

## Relationship records

每个固定顺序 artifact 都生成一条 relationship：

```ts
{
  index,
  kind,
  filenameMatches: true,
  mimeTypeMatches: true,
  byteSizeMatches: true,
  dataRangeMatches: true,
  crc32Matches: true,
  checksumMatches: true,
  exactTextMatches: true,
}
```

Imported artifact metadata 包含：

```text
kind
filename
mimeType
bytes
dataOffset
dataEnd
CRC-32
SHA-256
```

Trusted artifact metadata 包含：

```text
kind
filename
mimeType
bytes
artifact-text UTF-8 SHA-256
```

Provenance 报告只记录审计 metadata，不嵌入 validation report 原始内容。

## Deterministic serialization

Provenance JSON 使用：

```text
recursive object-key ordering
array order preserved
2-space JSON formatting
one trailing newline
```

报告不会包含：

```text
current timestamp
random ID
browser user agent
machine path
session ID
locale-dependent formatting
```

相同 verified import 和 trusted extraction 会产生逐字节一致的 provenance artifacts。

## Provenance artifacts

固定顺序：

```text
1. provenance-report-text
2. provenance-report-json
3. provenance-report-json-sha256
```

Target-specific filenames：

```text
large-world-manifest.diagnostics-policy.verified-import-provenance.txt
large-world-manifest.diagnostics-policy.verified-import-provenance.json
large-world-manifest.diagnostics-policy.verified-import-provenance.json.sha256
```

Mission package 使用：

```text
mission-package-<index>.diagnostics-policy.verified-import-provenance.*
```

Checksum artifact 内容：

```text
<SHA-256>  <provenance-json-filename>
```

每个 provenance artifact 自身也记录 SHA-256。

## Provenance result

```ts
{
  status: "created",
  entryExtraction,
  importResult,
  document,
  artifactCount: 3,
  totalBytes,
  artifacts: [
    {
      kind: "provenance-report-text",
      filename,
      mimeType,
      bytes,
      checksumHex,
      text,
    },
    // provenance JSON
    // provenance JSON SHA-256
  ],
  error: null,
}
```

状态：

```text
created
import-unavailable
verification-unavailable
entry-extraction-unavailable
relationship-invalid
crypto-unavailable
provenance-error
```

失败结果不会包含部分 provenance artifacts。

## HUD integration

External ZIP 成功导入并提取后，details 中显示：

```text
Verified imported ZIP entries
  ├── imported artifact inspection / copy / download
  └── Verified import provenance
      ├── Download all provenance artifacts
      ├── provenance text preview / copy / download
      ├── canonical provenance JSON preview / copy / download
      └── provenance JSON SHA-256 preview / copy / download
```

Provenance 生成是异步且独立的：

- Provenance failure 不会撤销已验证 imported artifact inspection。
- 新导入结果替换整个 details，不会遗留旧 provenance actions。
- Preview 使用 `textContent`。
- Preview 默认最多显示 4096 个字符。
- 截断仅影响 UI，不修改 artifact text。
- Clipboard API 不可用时返回明确错误。
- Blob URL 仅在显式下载时创建，并始终回收。

## Data attributes

Provenance root：

```text
data-bundle-imported-archive-provenance-status
data-bundle-imported-archive-provenance-schema
data-bundle-imported-archive-provenance-schema-version
data-bundle-imported-archive-provenance-artifact-count
data-bundle-imported-archive-provenance-total-bytes
data-bundle-imported-archive-provenance-source-checksum
data-bundle-imported-archive-provenance-json-checksum
```

Artifact details：

```text
data-bundle-imported-archive-provenance-artifact-kind
data-bundle-imported-archive-provenance-artifact-filename
data-bundle-imported-archive-provenance-artifact-bytes
data-bundle-imported-archive-provenance-artifact-checksum
```

## Callbacks

Archive import control：

```ts
onProvenanceCreate
onProvenanceArtifactDownload
onProvenanceDownloadAll
onProvenanceArtifactCopy
```

顶层 extraction actions：

```ts
onArchiveImportedProvenanceCreate
onArchiveImportedProvenanceArtifactDownload
onArchiveImportedProvenanceDownloadAll
onArchiveImportedProvenanceArtifactCopy
```

## Security boundary

- 未验证 ZIP 不会产生 provenance。
- Provenance 生成前重新计算 source ZIP SHA-256。
- Provenance 生成前重新计算 entry CRC-32 和 SHA-256。
- Imported bytes 与 trusted artifact UTF-8 bytes 再次逐字节比较。
- Report 不包含原始 artifact text。
- Source filename 和 reported MIME type 仅作为审计 metadata。
- JSON serialization 不执行 imported text。
- UI 使用 `textContent`，不使用 `innerHTML`。
- 生成过程不访问文件系统、不执行 ZIP 内容、不发送网络请求。

## 版本

```text
package version: 0.80.0
runtime label: runtime 0.80
```

## Mission diagnostics roadmap

- [x] Validation artifact bundle creation
- [x] Bundle import verification
- [x] Verified artifact extraction
- [x] Deterministic ZIP archive creation
- [x] ZIP archive verification
- [x] External ZIP import verification
- [x] Verified imported entry inspection / extraction
- [x] Verified imported archive provenance report workflow
- [ ] Verified imported archive provenance report verification workflow

## Next

```text
Mission diagnostics policy manifest validation artifact bundle
verified imported archive provenance report verification workflow
```

下一版将从 provenance JSON text 反向解析并验证：

```text
schema / schemaVersion
canonical JSON serialization
source archive checksum relationship
verification check counts
trusted extraction metadata
imported data ranges
CRC-32 relationships
entry SHA-256 relationships
exact-text relationship declarations
provenance JSON SHA-256 artifact
```
