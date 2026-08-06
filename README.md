# Splat World Engine — Provenance Verification Report Verifier Evidence Artifacts

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime / Builder 原型。Runtime/Builder 0.84 在 0.83 的独立 verification-report verifier 之上增加 deterministic verifier evidence artifacts：每次验证完成后，Runtime 可以把 verifier result 固化为 text、canonical JSON 与 JSON SHA-256 三件套，供 Runtime、Builder 和 CI 保存、复制、下载与比较。

```text
Validation artifact bundle
  ├── exact-text bundle verification
  ├── trusted artifact extraction
  ├── deterministic ZIP creation
  ├── generated / external ZIP verification
  ├── verified imported entry extraction
  ├── deterministic provenance artifacts
  ├── independent provenance verification
  ├── deterministic provenance verification reports
  ├── independent provenance verification-report verification
  └── deterministic report-verifier evidence artifacts
      ├── exact verification-report JSON SHA-256
      ├── report artifact envelope relationships
      ├── report-verifier valid / trust / issue count
      ├── verifier checks and trusted anchors
      ├── canonical/checksum availability relationships
      ├── stable normalized verifier issues
      ├── canonical evidence JSON
      └── evidence JSON SHA-256 artifact
```

## Runtime/Builder 0.84 能力

新增：

```text
src/large/
├── NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerificationEvidenceContract.ts
├── NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerificationEvidenceIssue.ts
├── NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerificationEvidenceSupport.ts
├── NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerificationEvidenceSerialization.ts
├── NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerificationEvidenceArtifacts.ts
├── NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerificationEvidenceArtifactActions.ts
├── NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerificationEvidenceActions.ts
└── NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerificationEvidenceWorkflow.ts
```

0.84 通过 additive workflow 组合现有 0.82 report actions 与 0.83 verifier control，不修改旧模块的验证职责。

## Core API

```ts
createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationEvidence(
  verification,
  report,
)
```

该 API 接收 0.83 已完成的 verification result 与 0.82 report artifact result。它不会：

- 调用 0.83 verifier 再次验证。
- 调用 0.82 report creator 重新生成 expected report。
- 修改 verifier 的 `valid`、`trust`、checks、anchors 或 issues。
- 把失败验证改写成成功。

## Evidence creation boundary

只有以下基础条件满足时才生成完整三件套：

```text
report.status === "created"
exactly one provenance-verification-report-json artifact exists
exact report JSON UTF-8 bytes <= 4 MiB
Web Crypto SHA-256 is available
serialization completes successfully
```

不满足时返回：

```text
report-unavailable
input-too-large
crypto-unavailable
evidence-error
```

失败不会返回部分 artifact set：

```text
artifactCount: 0
totalBytes: 0
artifacts: []
```

## Failure evidence is first-class

以下 verifier result 都可生成 evidence：

```text
valid / anchored
valid / self-consistent
invalid / untrusted
```

因此，0.84 evidence 证明的是“0.83 verifier 当时产生了什么结果”，而不是自行声明被验证 report 一定可信。

```text
recorded report result
  provenance verification report 内记录的上一层 provenance 结果

report-verifier result
  0.83 对 report artifact set 的独立验证结果

0.84 evidence artifacts
  对 report-verifier result 的确定性留存
```

## Evidence schema

```text
splat-world-engine/
mission-diagnostics-policy-manifest-provenance-verification-report-verification-evidence
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
    verificationReportJsonFilename,
    verificationReportJsonMimeType,
    declaredBytes,
    exactBytes,
    declaredChecksumHex,
    exactChecksum: {
      algorithm: "SHA-256",
      input: "verification-report-json-utf8",
      hex,
    },
    envelope: {
      filenameSafe,
      mimeTypeMatches,
      byteSizeMatches,
      checksumMatches,
    },
  },
  recordedReport: {
    schema,
    schemaVersion,
    provenanceResultValid,
    provenanceResultTrust,
  },
  result: {
    valid,
    trust,
    issueCount,
  },
  checks,
  anchors,
  evidence: {
    documentAvailable,
    canonicalTextAvailable,
    canonicalTextMatchesInput,
    verificationChecksumAvailable,
    verificationChecksumMatchesInput,
    issuesTruncated,
  },
  issues,
}
```

Evidence 不嵌入：

- 原始 provenance JSON。
- verification-report JSON 原文。
- ZIP bytes。
- validation report 内容。
- imported artifact text。
- browser、session 或 machine metadata。

## Exact input relationship

Creator 会对 retained verification-report JSON text 重新计算：

```text
UTF-8 exact bytes
SHA-256 of exact UTF-8 bytes
```

并记录 artifact envelope 是否匹配：

```text
filenameSafe
mimeTypeMatches
byteSizeMatches
checksumMatches
```

即使 envelope 被损坏，也可以生成用于调查的失败证据；evidence 会如实记录这些关系，而不会修复输入 artifact。

## Stable verifier issues

0.83 的 issue 使用：

```ts
{
  code,
  path,
  message,
}
```

0.84 只保留 bounded issue evidence：

```text
maximum issues: 512
maximum issue path: 2048 characters
```

`message` 根据 issue code 转换为稳定文本，不复制 JavaScript engine、browser 或运行时产生的原始错误文案。因此相同 verifier failure 在不同环境中仍可生成逐字节一致的 evidence JSON。

覆盖的 verifier issue code 包括：

```text
text-invalid
text-size-invalid
json-parse-failed
document-type-invalid
field-type-invalid
field-value-invalid
array-size-invalid
string-size-invalid
schema-mismatch
schema-version-mismatch
unknown-field
canonical-json-mismatch
input-envelope-mismatch
source-archive-mismatch
result-mismatch
verification-check-mismatch
anchor-mismatch
evidence-mismatch
issue-count-mismatch
issue-evidence-mismatch
artifact-count-mismatch
artifact-order-mismatch
artifact-metadata-mismatch
text-report-mismatch
checksum-artifact-invalid
expected-report-mismatch
expected-verification-mismatch
expected-provenance-mismatch
sha256-mismatch
crypto-unavailable
```

## Deterministic serialization

Evidence JSON 使用：

```text
recursive object-key ordering
array order preserved
2-space JSON formatting
exactly one trailing newline
```

不包含：

```text
timestamp
random ID
session ID
browser user agent
machine path
locale-dependent formatting
engine-specific error message
```

相同 report JSON 与相同 verifier result 会生成逐字节一致的 evidence artifacts。

## Fixed artifact order

```text
1. provenance-verification-report-verification-evidence-text
2. provenance-verification-report-verification-evidence-json
3. provenance-verification-report-verification-evidence-json-sha256
```

Checksum artifact 使用严格格式：

```text
<64 lowercase hex>  <evidence-json-filename>\n
```

核心 artifact API：

```ts
createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationEvidenceActions(
  verification,
  report,
  options,
)
```

```ts
createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationEvidenceResultActions(
  evidence,
  options,
)
```

```ts
downloadRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationEvidenceArtifact(
  artifact,
)
```

```ts
downloadRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationEvidenceArtifacts(
  result,
)
```

```ts
copyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationEvidenceArtifact(
  artifact,
)
```

## HUD integration

执行：

```text
Verify provenance verification report artifacts
```

完成后自动追加：

```text
Verification-report verifier evidence
  ├── verifier valid / trust / issue count
  ├── evidence artifact count / total bytes
  ├── exact input report JSON checksum
  ├── evidence JSON checksum
  ├── Download all verifier evidence artifacts
  ├── evidence text preview / copy / download
  ├── canonical evidence JSON preview / copy / download
  └── evidence JSON SHA-256 preview / copy / download
```

重新执行 verifier 时：

- 旧 evidence 区域先移除。
- 使用 sequence guard 阻止旧异步任务覆盖新结果。
- 原有 0.82 report preview、copy 和 download 保留。
- 原有 0.83 verification details 保留。

新增 callbacks：

```ts
onEvidenceCreate(evidence, verification, report)
onEvidenceArtifactDownload(artifact, evidence)
onEvidenceDownloadAll(evidence)
onEvidenceArtifactCopy(artifact, evidence)
```

## Data attributes

```text
data-bundle-imported-archive-provenance-verification-report-verification-evidence-status
data-bundle-imported-archive-provenance-verification-report-verification-evidence-valid
data-bundle-imported-archive-provenance-verification-report-verification-evidence-trust
data-bundle-imported-archive-provenance-verification-report-verification-evidence-issue-count
data-bundle-imported-archive-provenance-verification-report-verification-evidence-artifact-count
data-bundle-imported-archive-provenance-verification-report-verification-evidence-total-bytes
data-bundle-imported-archive-provenance-verification-report-verification-evidence-input-checksum
data-bundle-imported-archive-provenance-verification-report-verification-evidence-json-checksum
```

每个 artifact 还暴露：

```text
data-bundle-imported-archive-provenance-verification-report-verification-evidence-artifact-kind
data-bundle-imported-archive-provenance-verification-report-verification-evidence-artifact-filename
data-bundle-imported-archive-provenance-verification-report-verification-evidence-artifact-bytes
data-bundle-imported-archive-provenance-verification-report-verification-evidence-artifact-checksum
```

## Security boundary

- 不执行 report、verification result、issue 或 artifact 内容。
- 不使用 `innerHTML`；所有 UI 内容通过 `textContent`。
- 不从未信任 filename 创建目录或路径。
- 只有 safe basename 可以影响输出文件名。
- arbitrary target object 只规范化 `scope` 与 `packageIndex`。
- exact input JSON 限制为 4 MiB。
- issue evidence 与 path 均有 hard limit。
- Creator 不自动下载、不写 Clipboard、不创建 Blob URL。
- Blob URL 只在用户显式下载时创建，并始终 revoke。
- Web Crypto 不可用时不生成缺少 checksum 的部分三件套。
- Creator 不改变 verifier trust，也不把 checksum artifact 当作外部 authority。
- 失败 evidence creation 不撤销已有 report verification result。

## 版本

```text
package version: 0.84.0
runtime label: runtime 0.84
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
- [x] Provenance verification report artifact verification workflow
- [x] Provenance verification-report verifier evidence artifacts
- [ ] Provenance verification-report verifier evidence artifact verification

## Next

建议 Runtime/Builder `0.85`：

```text
Mission diagnostics policy manifest validation artifact bundle
provenance verification-report verifier evidence artifact verification
```

下一版建议为 0.84 evidence 三件套增加独立 verifier，直接验证 evidence schema、canonical JSON、exact input report checksum、recorded verifier checks/anchors/issues、固定 artifact order、artifact UTF-8 bytes 与 evidence JSON SHA-256；该 verifier 不应调用 0.84 creator 重新生成 expected evidence 后做字符串比较。
