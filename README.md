# Splat World Engine — Provenance Verification Evidence Artifacts

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime / Builder 原型。Runtime/Builder 0.82 在 0.81 独立 imported ZIP provenance verifier 之上增加 deterministic verification evidence artifacts：每次 provenance verification 完成后，Runtime 可以把结构化结果固化为 text、canonical JSON 与 JSON SHA-256 三件套，供 Runtime、Builder 与 CI 保存、复制、下载和逐字节比较。

```text
Validation artifact bundle
  ├── exact-text bundle verification
  ├── trusted artifact extraction
  ├── deterministic ZIP creation
  ├── generated ZIP verification
  ├── bounded external ZIP import
  ├── independent ZIP verification
  ├── verified imported entry extraction
  ├── deterministic provenance artifacts
  ├── independent provenance verification
  └── deterministic verification evidence artifacts
      ├── exact provenance JSON input SHA-256
      ├── artifact envelope checks
      ├── valid / trust / issue count
      ├── verification checks
      ├── trusted anchor outcomes
      ├── stable normalized issues
      ├── canonical verification report JSON
      └── verification report JSON SHA-256
```

## Runtime/Builder 0.82 能力

新增：

```text
src/large/
└── NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReport.ts
```

更新：

```text
src/large/NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenance.ts
```

## Core API

```ts
createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReport(
  verification,
  provenance,
)
```

该 API 接收 0.81 的 verification result 和实际 provenance artifact result。

报告生成不会重新运行 provenance creator，也不会改变 verification 的 `valid` 或 `trust` 结论。它只固化已经完成的验证证据，并对 exact provenance JSON artifact envelope 重新计算：

```text
UTF-8 byte size
SHA-256
filename safety
MIME type
declared byte size relationship
declared checksum relationship
```

## Report creation policy

以下 verification 结果都可以生成报告：

```text
valid / anchored
valid / self-consistent
invalid / untrusted
```

失败验证同样是需要保留的 evidence，因此 issue 不会阻止报告创建。

以下情况不会生成部分 artifacts：

```text
provenance result 不是 created
缺少唯一 provenance-report-json artifact
exact provenance JSON 超过 4 MiB report limit
Web Crypto 不可用
report serialization failure
```

状态：

```text
created
provenance-unavailable
input-too-large
crypto-unavailable
report-error
```

失败结果始终满足：

```ts
{
  document: null,
  artifactCount: 0,
  totalBytes: 0,
  artifacts: [],
  error: string,
}
```

## Verification report schema

```text
splat-world-engine/
mission-diagnostics-policy-manifest-verified-imported-archive-provenance-verification-report
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
  input: {
    provenanceJsonFilename,
    provenanceJsonMimeType,
    declaredBytes,
    exactBytes,
    declaredChecksumHex,
    exactChecksum: {
      algorithm: "SHA-256",
      input: "provenance-json-utf8",
      hex,
    },
    envelope: {
      filenameSafe,
      mimeTypeMatches,
      byteSizeMatches,
      checksumMatches,
    },
  },
  sourceArchive: {
    filename,
    exactBytes,
    checksumHex,
  },
  result: {
    valid,
    trust: "anchored" | "self-consistent" | "untrusted",
    issueCount,
  },
  checks: {
    parsed,
    schema,
    canonical,
    sourceArchive,
    verification,
    trustedExtraction,
    importedExtraction,
    relationships,
    jsonChecksum,
  },
  anchors: {
    expectedProvenance,
    entryExtraction,
    sourceArchiveChecksum,
    jsonChecksumArtifact,
  },
  evidence: {
    documentAvailable,
    canonicalTextAvailable,
    canonicalTextMatchesInput,
    verificationChecksumAvailable,
    issuesTruncated,
  },
  issues,
}
```

报告不会包含原始 provenance JSON text、validation report text、ZIP bytes 或 imported artifact 内容。

## Stable issue evidence

Verification result 中的 issue 保留：

```ts
{
  code,
  path,
  message,
}
```

其中：

- `code` 保留 0.81 verifier 的稳定 issue code。
- `path` 保留 bounded JSON path，最多 2048 个字符。
- `message` 使用按 issue code 定义的稳定规范化消息。
- 最多固化 512 条 issue。
- 超出时设置 `evidence.issuesTruncated = true`。
- `result.issueCount` 仍记录 verifier 返回的完整 issue 数量。

规范化不会把 JavaScript engine 的原始 `JSON.parse` 错误文本写入报告，因此相同输入不会因为浏览器或 Node.js 错误文案差异产生不同 report bytes。

## Target and source metadata safety

Report builder 不会递归复制任意 target object。

Target 被规范化为：

```ts
{
  scope: string | null,
  packageIndex: number | null,
}
```

Source archive 只记录：

```text
safe basename
non-negative exact byte size
lowercase SHA-256 hex
```

未知字段、prototype、循环引用或其他任意对象内容不会进入 verification report document。

## Deterministic serialization

Verification report JSON 使用：

```text
recursive object-key ordering
array order preserved
two-space indentation
exactly one trailing newline
```

报告不包含：

```text
timestamp
random ID
session ID
browser user agent
machine path
locale-dependent formatting
raw engine-specific error messages
```

相同 provenance bytes、verification result、checks、anchors 和 issue codes/paths 会产生 byte-for-byte 相同的 artifacts。

## Verification report artifacts

固定顺序：

```text
1. provenance-verification-report-text
2. provenance-verification-report-json
3. provenance-verification-report-json-sha256
```

Manifest target 示例：

```text
large-world-manifest.diagnostics-policy.verified-import-provenance.verification-report.txt
large-world-manifest.diagnostics-policy.verified-import-provenance.verification-report.json
large-world-manifest.diagnostics-policy.verified-import-provenance.verification-report.json.sha256
```

Mission package 示例：

```text
mission-package-<index>.diagnostics-policy.verified-import-provenance.verification-report.*
```

Checksum artifact：

```text
<SHA-256>  <verification-report-json-filename>
```

结尾严格包含一个换行。

每个 verification report artifact 自身也记录 SHA-256。

## Result

```ts
{
  status: "created",
  verification,
  provenance,
  document,
  artifactCount: 3,
  totalBytes,
  artifacts,
  error: null,
}
```

## HUD integration

用户点击：

```text
Verify imported archive provenance report
```

完成 verification 后，provenance 区域自动增加：

```text
Provenance verification evidence
  ├── trust / issue count / artifact count
  ├── Download all verification report artifacts
  ├── verification text preview / copy / download
  ├── canonical verification JSON preview / copy / download
  └── verification JSON SHA-256 preview / copy / download
```

报告生成不会自动下载、复制或覆盖原 provenance artifacts。

重新执行 verification 时：

- 旧 report actions 会被新 verification result 替换。
- 异步 module load 使用 sequence guard，旧请求不会覆盖较新的 verification。
- 原 provenance preview、copy 和 download 始终保留。

## APIs

单项下载：

```ts
downloadRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportArtifact(
  artifact,
)
```

固定顺序批量下载：

```ts
downloadRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportArtifacts(
  result,
)
```

Clipboard：

```ts
copyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportArtifact(
  artifact,
)
```

HUD actions：

```ts
createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportActions(
  verification,
  provenance,
  options,
)
```

## Callbacks

Provenance actions 新增：

```ts
onVerificationReportCreate
onVerificationReportArtifactDownload
onVerificationReportDownloadAll
onVerificationReportArtifactCopy
```

现有 callback 保持不变：

```ts
onCreate
onVerify
onArtifactDownload
onDownloadAll
onArtifactCopy
onStatus
```

## Data attributes

Verification report root：

```text
data-bundle-imported-archive-provenance-verification-report-status
data-bundle-imported-archive-provenance-verification-report-valid
data-bundle-imported-archive-provenance-verification-report-trust
data-bundle-imported-archive-provenance-verification-report-issue-count
data-bundle-imported-archive-provenance-verification-report-artifact-count
data-bundle-imported-archive-provenance-verification-report-total-bytes
data-bundle-imported-archive-provenance-verification-report-input-checksum
data-bundle-imported-archive-provenance-verification-report-json-checksum
```

Artifact details：

```text
data-bundle-imported-archive-provenance-verification-report-artifact-kind
data-bundle-imported-archive-provenance-verification-report-artifact-filename
data-bundle-imported-archive-provenance-verification-report-artifact-bytes
data-bundle-imported-archive-provenance-verification-report-artifact-checksum
```

Actions：

```text
data-bundle-imported-archive-provenance-verification-report-action
```

## Security boundary

- 不执行 provenance、verification issue 或 artifact 内容。
- 不使用 `innerHTML`；所有 HUD 内容通过 `textContent`。
- 不从未信任 filename 创建目录或路径。
- 只有 safe basename 可以影响输出文件名前缀。
- 无效 filename 使用固定 fallback。
- exact provenance JSON 输入上限为 4 MiB。
- issue evidence 上限为 512 条。
- issue path 上限为 2048 个字符。
- arbitrary target object 不会被递归复制。
- report 不包含原始 provenance JSON 或 imported artifact text。
- report 创建不自动下载、不写 Clipboard。
- Web Crypto 不可用时不生成缺少 checksum 的部分三件套。
- Blob URL 只在显式下载时创建，并始终回收。
- 失败 verification 可以生成 evidence，但不会被重新描述为 trusted。
- report builder 不改变 0.81 verifier 的 `valid`、`trust`、checks 或 anchors。

## 版本

```text
package version: 0.82.0
runtime label: runtime 0.82
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
- [x] Verified imported archive provenance report verification workflow
- [x] Verified imported archive provenance verification report artifacts
- [ ] Verified imported archive provenance verification report artifact verification workflow

## Next

```text
Mission diagnostics policy manifest validation artifact bundle
verified imported archive provenance verification report artifact verification workflow
```

下一版建议新增独立 verification-report verifier，验证 report schema、canonical JSON、exact input checksum、checks、anchors、stable issues、artifact fixed order 与 report JSON SHA-256，而不是调用 report creator 重新生成后比较。
