# Splat World Engine — Mission Diagnostics External Verified Artifacts ZIP Import

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.78 在 0.77 的独立 ZIP archive verifier 之上增加外部文件导入闭环：author 可以从本地选择一个 ZIP 文件，读取 exact bytes，执行有界输入检查，再使用同一套 raw ZIP verifier 对 ZIP32 结构、确定性 metadata、CRC-32、entry SHA-256 和当前 verified extraction 的 exact artifact bytes 进行完整验证。

```text
Validation artifact bundle
  ├── exact-text verification
  ├── verified artifact extraction
  ├── deterministic ZIP creation
  ├── generated ZIP verification
  └── external ZIP import / verification
      ├── bounded File import
      ├── exact ArrayBuffer bytes
      ├── raw ZIP parser
      ├── deterministic ZIP metadata
      ├── CRC-32
      ├── entry SHA-256
      ├── exact artifact byte comparison
      └── archive SHA-256
```

## Runtime/Builder 0.78 能力

新增：

```text
src/large/
└── NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImport.ts
```

### File import API

```ts
importRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveFile(
  file,
  extraction,
  options,
)
```

输入：

- 浏览器 `File`
- 已通过 bundle verification 的 `extraction`
- 可选 `maxFileBytes`

默认导入上限：

```text
32 MiB
```

导入流程同时检查：

```text
File.size
ArrayBuffer.byteLength
```

扩展名与 reported MIME type 只用于 file picker hint 和结果展示，不作为可信信号。即使文件名不是 `.zip` 或 MIME type 不标准，也不会跳过 ZIP verifier。

文件内容通过：

```ts
const data = new Uint8Array(await file.arrayBuffer());
```

读取为 exact bytes，不进行文本解码、换行转换、JSON parsing 或浏览器解压。

### Import status

```text
verified
verification-failed
rejected
read-failed
verification-error
```

语义：

- `verified`：文件读取成功，ZIP 结构、metadata 与可信 artifacts 全部通过。
- `verification-failed`：文件读取成功，但 verifier 返回结构化 issues。
- `rejected`：文件大小超过输入边界。
- `read-failed`：`File.arrayBuffer()` 失败。
- `verification-error`：verifier 发生非普通 verification issue 的异常。

### Import result

```ts
{
  status,
  file: {
    filename,
    mimeType,
    bytes,
  },
  archiveBytes,
  data,
  verification,
  error,
}
```

`data` 保留读取到的 exact `Uint8Array`，为后续 verified imported ZIP entry inspection / extraction workflow 提供稳定输入。本版本不会从该数据提取文件，也不会自动创建 Blob URL 或下载。

## 外部 ZIP 验证范围

0.78 调用 0.77 的 raw bytes API：

```ts
verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveBytes(
  data,
  {
    expectedExtraction: extraction,
  },
)
```

验证内容包括：

### ZIP container

- EOCD signature 与完整范围
- single-disk layout
- archive comment 为空
- EOCD 后无 trailing bytes
- central-directory offset、size 与 entry count
- central-directory records 完整消费
- local-header offsets 与连续 entry order

### Deterministic metadata

```text
ZIP version 20
UTF-8 flag only
Store compression method
DOS timestamp 1980-01-01 00:00:00
empty extra fields
empty file comments
empty archive comment
zero disk number
zero internal/external attributes
compressed bytes == uncompressed bytes
```

### Artifact identity

固定 entry 顺序：

```text
validation-report-text
validation-report-json
validation-report-json-sha256
```

每项必须与当前 extraction 一致：

- kind
- filename
- byte size
- CRC-32
- SHA-256
- exact stored bytes

完整 archive 还会重新计算 SHA-256。

## HUD control

新增：

```ts
createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportControl(
  extraction,
  options,
)
```

控件行为：

- 隐藏 `<input type="file">`
- picker hint：`.zip`、`application/zip`、`application/x-zip-compressed`
- 支持重复选择同一个文件
- 读取与验证期间禁用 action button
- 成功 details 默认折叠
- 失败 details 自动展开
- 显示完整 issue code、JSON-style path 与 message
- 不把导入内容写入 `innerHTML`
- 不解压到文件系统
- 不创建 object URL
- 不自动触发下载

### Callbacks

```ts
{
  onImport(result, extraction),
  onVerify(verification, result, extraction),
  onStatus(message),
}
```

Extraction action options 同时增加：

```ts
onArchiveImport
onArchiveImportVerify
```

## HUD workflow

Verified extraction 区域现在包含：

```text
Verified artifact extraction
  ├── Deterministic ZIP archive
  │   ├── Download verified artifacts ZIP
  │   └── Verify verified artifacts ZIP
  ├── Import and verify external artifacts ZIP
  ├── Download all verified artifacts
  ├── Download verified validation text report
  ├── Download verified validation JSON report
  └── Download verified validation JSON SHA-256
```

外部 ZIP 验证成功：

```text
<filename> · verified · 3 entries · <bytes> · 0 issues
```

验证失败时展示：

```text
archive SHA-256
EOCD
central directory
entry order
local header count
CRC-32 count
SHA-256 count
all structured issues
```

## Data attributes

Import control：

```text
data-bundle-extraction-archive-import-status
data-bundle-extraction-archive-import-filename
data-bundle-extraction-archive-import-mime-type
data-bundle-extraction-archive-import-file-bytes
data-bundle-extraction-archive-import-bytes
data-bundle-extraction-archive-import-verification-valid
data-bundle-extraction-archive-import-verification-issue-count
data-bundle-extraction-archive-import-verification-entry-count
data-bundle-extraction-archive-import-verification-crc32-count
data-bundle-extraction-archive-import-verification-sha256-count
data-bundle-extraction-archive-import-verification-checksum
```

## Security boundary

- File extension 和 MIME type 不决定可信度。
- 在读取前检查 reported `File.size`。
- 在读取后检查 actual `ArrayBuffer.byteLength`。
- ZIP verifier 不向文件系统提取内容。
- 所有 ZIP offset 和 length 在访问前检查 bounds。
- 拒绝路径型 filename、控制字符和非法 UTF-8。
- 拒绝 compression、encryption、data descriptor、ZIP64、multi-disk、extra fields、comments 与 trailing data。
- CRC-32 用于 ZIP container integrity。
- SHA-256 与 exact bytes comparison 用于可信 artifact identity。
- 新导入会替换控件中的旧结果，不保留旧 verification UI 状态。

## 版本

```text
package version: 0.78.0
runtime label: runtime 0.78
```

## Checklist

- [x] Mission diagnostics policy editor presets
- [x] Mission diagnostics editor preset picker UI
- [x] Mission diagnostics policy editor custom overrides UI
- [x] Mission diagnostics policy editor apply / reload workflow
- [x] Mission diagnostics policy editor shareable URL export
- [x] Mission diagnostics policy manifest export scaffold
- [x] Mission diagnostics policy manifest import / apply workflow
- [x] Mission diagnostics policy manifest package target picker
- [x] Mission diagnostics policy manifest package patch preview
- [x] Mission diagnostics policy manifest package patch copy/apply polish
- [x] Mission diagnostics policy manifest save / authoring workflow
- [x] Mission diagnostics policy manifest HUD download integration
- [x] Mission diagnostics policy manifest HUD panel wiring
- [x] Mission diagnostics policy manifest download summary preview
- [x] Mission diagnostics policy manifest authoring validation
- [x] Mission diagnostics policy manifest validation HUD issue details
- [x] Mission diagnostics policy manifest validation issue copy workflow
- [x] Mission diagnostics policy manifest validation report download workflow
- [x] Mission diagnostics policy manifest validation JSON report workflow
- [x] Mission diagnostics policy manifest validation JSON report copy workflow
- [x] Mission diagnostics policy manifest validation JSON report checksum workflow
- [x] Mission diagnostics policy manifest validation JSON checksum download workflow
- [x] Mission diagnostics policy manifest validation artifact bundle workflow
- [x] Mission diagnostics policy manifest validation artifact bundle verification workflow
- [x] Mission diagnostics policy manifest validation artifact bundle import / verification workflow
- [x] Mission diagnostics policy manifest validation artifact bundle verified artifact extraction workflow
- [x] Mission diagnostics policy manifest validation artifact bundle verified extraction archive workflow
- [x] Mission diagnostics policy manifest validation artifact bundle verified extraction archive verification workflow
- [x] Mission diagnostics policy manifest validation artifact bundle verified extraction archive import / verification workflow
- [ ] Mission diagnostics policy manifest validation artifact bundle verified imported archive entry inspection / extraction workflow

## 运行 Runtime

```bash
npm install
npm run dev
```

打开大场景 Mission HUD：

```text
http://localhost:5173?world=/worlds/large-demo/world.json&clickToMove=1&missionDebug=1
```

验证：

```bash
npm run typecheck
npm run build
npm run preview
```

## 下一项 roadmap

```text
Mission diagnostics policy manifest validation artifact bundle
verified imported archive entry inspection / extraction workflow
```

下一版将只在 external ZIP verification 成功后，从已验证 local-header data ranges 创建 typed imported artifacts，保留 exact bytes、filename、kind、CRC-32 与 SHA-256，并提供安全的 preview / copy / download 能力。
