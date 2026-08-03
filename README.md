# Splat World Engine — Mission Diagnostics Verified Extraction Archive Verification

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.77 在 0.76 的确定性 ZIP archive 之上补齐反向解析与验证闭环：Runtime、Builder 或 CI 可以直接读取 ZIP bytes，重新检查 EOCD、central directory、local headers、固定 metadata、entry 顺序、CRC-32、entry SHA-256 与整个 archive SHA-256，而不是信任 archive creator 返回的 metadata。

```text
External validation artifact bundle
  ├── exact-text bundle verification
  ├── verified artifact extraction
  ├── deterministic ZIP archive creation
  └── ZIP archive verification
      ├── EOCD
      ├── central directory
      ├── local file headers
      ├── fixed entry order
      ├── UTF-8 flag + Store method
      ├── fixed DOS timestamp
      ├── offsets + byte sizes
      ├── per-entry CRC-32
      ├── per-entry SHA-256
      └── complete archive SHA-256
```

## Runtime/Builder 0.77 能力

新增：

```text
src/large/
└── NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveVerification.ts
```

### Typed archive verification

```ts
verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveArtifact(
  artifact,
  extraction,
)
```

该入口验证 0.76 创建的 typed archive artifact，并同时核对：

- `filename`
- `mimeType`
- declared archive byte size
- declared archive SHA-256
- declared entry count
- declared total uncompressed bytes
- declared entry filename、bytes、CRC-32 与 artifact SHA-256
- 原始 verified extraction 中的 exact artifact text、filename、bytes 与 SHA-256

### Raw ZIP bytes verification

```ts
verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveBytes(
  data,
  options,
)
```

`data` 是任意 `Uint8Array`。该入口不会要求 bytes 来自 archive creator，可供：

- Runtime 外部 ZIP 文件导入
- Builder verification
- CI artifact verification
- Remote artifact service
- 测试损坏或篡改样本

可选 expected metadata：

```ts
{
  expectedExtraction,
  expectedFilename,
  expectedArchiveBytes,
  expectedArchiveChecksumHex,
  declaredEntries,
  declaredEntryCount,
  declaredTotalUncompressedBytes,
  declaredMimeType,
  declaredCompressionMethod,
  declaredFixedTimestamp,
}
```

## ZIP parser 验证范围

### EOCD

- 从 ZIP 末尾向前搜索 EOCD signature。
- 验证 single-disk archive。
- 验证 disk entry count 与 total entry count 一致。
- 验证 archive comment length 为零。
- 验证 ZIP bytes 在 EOCD 后立即结束。
- 验证 central-directory offset 与 size 均在 archive bounds 内。
- 验证 central directory 在 EOCD 前立即结束。

### Central directory

- 验证每个 central-directory signature。
- 验证所有 variable-length filename、extra field 和 comment 范围。
- 使用 fatal UTF-8 decoder 验证 filename。
- 验证 entry count 严格为三项。
- 验证 central directory 被所有 entry records 精确消费，不允许隐藏尾部数据。

### Deterministic entry metadata

每个 entry 必须满足：

```text
version made by: 20
version needed: 20
flags: 0x0800 only
compression method: 0 / Store
DOS time: 0
DOS date: 0x0021
extra field length: 0
file comment length: 0
disk start: 0
internal attributes: 0
external attributes: 0
compressed bytes == uncompressed bytes
```

固定 entry 顺序：

```text
validation-report-text
validation-report-json
validation-report-json-sha256
```

### Local file headers

- 验证 local-header signature。
- 验证 local version、flags、Store method、固定时间戳和空 extra field。
- 验证 local metadata 与 central-directory entry 完全一致。
- 验证 local records 从 offset `0` 开始、连续排列并保持固定顺序。
- 验证最后一个 local record 在 central-directory offset 处精确结束。
- 验证 entry data range 不越过 central directory 或 archive bounds。

### Integrity

每个 entry：

```text
exact stored bytes
  ├── CRC-32 → local header
  ├── CRC-32 → central directory
  ├── SHA-256 → declared archive entry metadata
  ├── SHA-256 → verified extraction artifact metadata
  └── byte-for-byte comparison → verified extraction text UTF-8 bytes
```

完整 ZIP：

```text
exact ZIP bytes
  └── SHA-256 → archive artifact checksumHex
```

Web Crypto 不可用时，结构与 CRC-32 仍会继续解析，但 verification 会返回 `crypto-unavailable` issue，不会把未验证 SHA-256 的 archive 标记为 valid。

## Verification result

```ts
{
  valid: true,
  archiveChecksumHex: "...",
  archiveBytes: 1842,
  entryCount: 3,
  totalUncompressedBytes: 1320,
  issues: [],
  checks: {
    archiveChecksum: true,
    eocd: true,
    centralDirectory: true,
    entryOrder: true,
    localHeadersVerified: 3,
    deterministicMetadataVerified: 3,
    crc32Verified: 3,
    sha256Verified: 3,
  },
  entries: [
    {
      kind: "validation-report-text",
      filename: "...txt",
      bytes: 420,
      compressedBytes: 420,
      crc32Hex: "...",
      checksumHex: "...",
      localHeaderOffset: 0,
    },
    // JSON report
    // JSON SHA-256 artifact
  ],
}
```

Verifier 尽量在一个 pass 中返回所有可恢复的问题。只有无法定位 EOCD 或无法继续安全读取结构时才提前结束。

## HUD integration

Verified extraction archive 区域现在包含：

```text
Deterministic ZIP archive
  ├── Download verified artifacts ZIP
  └── Verify verified artifacts ZIP
      ├── EOCD
      ├── central directory
      ├── local headers
      ├── CRC-32
      └── SHA-256
```

验证前 preview：

```text
EOCD · central directory · local headers · CRC-32 · SHA-256
```

验证成功：

```text
<archive filename> · verified · 3 entries · 3 CRC-32 · 3 SHA-256
```

验证失败时 details 自动展开，逐项显示：

```text
issue code
JSON-style path
message
```

### HUD data attributes

Archive verification control：

```text
data-bundle-extraction-archive-verification-status
data-bundle-extraction-archive-verification-valid
data-bundle-extraction-archive-verification-issue-count
data-bundle-extraction-archive-verification-entry-count
data-bundle-extraction-archive-verification-crc32-count
data-bundle-extraction-archive-verification-sha256-count
data-bundle-extraction-archive-verification-checksum
```

Extraction root 同步暴露：

```text
data-bundle-extraction-archive-verification-status
data-bundle-extraction-archive-verification-valid
data-bundle-extraction-archive-verification-issue-count
data-bundle-extraction-archive-verification-entry-count
data-bundle-extraction-archive-verification-crc32-count
data-bundle-extraction-archive-verification-sha256-count
```

新增 callback：

```ts
onArchiveVerify(verification, artifact, archiveResult)
```

## Stable archive verification issue codes

```text
archive-empty
archive-filename-invalid
archive-mime-type-mismatch
archive-byte-size-mismatch
archive-checksum-invalid
archive-checksum-mismatch
archive-metadata-mismatch
crypto-unavailable
eocd-not-found
eocd-invalid
multi-disk-unsupported
archive-comment-not-empty
archive-trailing-data
central-directory-range-invalid
central-directory-size-mismatch
central-directory-count-mismatch
central-directory-signature-mismatch
central-directory-entry-truncated
central-directory-trailing-data
entry-count-mismatch
entry-order-mismatch
entry-filename-invalid
entry-filename-mismatch
entry-utf8-flag-mismatch
entry-compression-method-mismatch
entry-version-mismatch
entry-timestamp-mismatch
entry-extra-field-not-empty
entry-comment-not-empty
entry-disk-number-mismatch
entry-attributes-mismatch
entry-size-mismatch
entry-crc32-mismatch
entry-sha256-mismatch
entry-content-mismatch
local-header-offset-invalid
local-header-signature-mismatch
local-header-truncated
local-header-metadata-mismatch
local-central-mismatch
local-entry-order-mismatch
entry-data-range-invalid
local-data-central-directory-gap
```

这些 code 可直接用于 HUD details、Builder diagnostics、CI annotations 或远程 artifact validation service。

## 安全边界

- Verifier 不解压到文件系统。
- Verifier 不创建 Blob、object URL 或下载。
- 所有 offset、length 和 data range 在访问前进行 bounds 验证。
- ZIP filename 必须是安全 basename，不允许 `/`、`\\`、`.`、`..` 或控制字符。
- 不支持 multi-disk ZIP。
- 不支持 ZIP64。
- 不支持 compression、encryption 或 data descriptor。
- 不允许 extra fields、file comments、archive comments 或 archive trailing data。
- CRC-32 只用于 ZIP 结构一致性，可信内容完整性仍以 SHA-256 和 exact bytes comparison 为准。
- Archive verification 与 archive creation 使用独立实现，避免 creator 和 verifier 共享同一个序列化路径而隐藏错误。

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
- [ ] Mission diagnostics policy manifest validation artifact bundle verified extraction archive import / verification workflow

## 运行与验证

```bash
npm install
npm run dev
```

打开大场景 Mission HUD：

```text
http://localhost:5173?world=/worlds/large-demo/world.json&clickToMove=1&missionDebug=1
```

工程验证：

```bash
npm run typecheck
npm run build
npm run preview
```

## Version

```text
package version: 0.77.0
runtime label: runtime 0.77
```

## Next

```text
Mission diagnostics policy manifest validation artifact bundle
verified extraction archive import / verification workflow
```

下一项将增加外部 `.zip` 文件选择、文件大小限制、exact bytes 读取、archive verifier 调用和结构化 HUD issue details，使 0.77 的 raw ZIP bytes verifier 可以用于真实导入场景。
