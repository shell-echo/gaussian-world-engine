# Splat World Engine — Provenance Verification Report Verification

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime / Builder 原型。Runtime/Builder 0.83 在 0.82 的 deterministic provenance verification evidence artifacts 之上增加独立 verification-report verifier：它直接解析 report JSON、验证 canonical bytes、固定 artifact envelope、text report、JSON SHA-256 artifact，并可使用原 provenance verification result 与 provenance result 作为 trusted anchors；不会调用 0.82 report creator 重新生成结果后做字符串比较。

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
  ├── deterministic provenance verification reports
  └── independent verification-report verification
      ├── strict JSON parsing and bounded values
      ├── exact schema and schemaVersion
      ├── recursive canonical JSON verification
      ├── recorded result / trust relationship verification
      ├── verification checks and anchors verification
      ├── stable issue evidence verification
      ├── exact provenance input anchoring
      ├── text report verification
      ├── fixed artifact order and envelope verification
      ├── report JSON SHA-256 artifact verification
      └── anchored / self-consistent / untrusted verifier trust
```

## Runtime/Builder 0.83 能力

新增：

```text
src/large/
├── NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerificationContract.ts
├── NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerificationSupport.ts
├── NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerificationEvidence.ts
├── NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerificationDocument.ts
├── NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerification.ts
├── NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportAnchorVerification.ts
├── NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportArtifactVerification.ts
└── NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerificationReportVerificationControl.ts
```

这些模块把 fixed contract、stable formatting、issue evidence、document audit、trusted-anchor audit、artifact envelope audit 与 HUD control 分离。它们只依赖 0.81 verifier 与 0.82 report contracts，不修改 report creator 的输出，也不把 creator 当作验证器。

## Core APIs

验证完整的 0.82 verification report artifact result：

```ts
verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportArtifact(
  report,
  expectedVerification,
  expectedProvenance,
)
```

验证独立的 verification report JSON text：

```ts
verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportText(
  text,
  options,
)
```

`options` 支持：

```ts
{
  jsonFilename,
  checksumArtifactText,
  checksumArtifactFilename,
  textReportText,
  textReportFilename,
  expectedReport,
  expectedVerification,
  expectedProvenance,
  maxTextBytes,
  maxStringCharacters,
  maxArrayEntries,
  maxObjectFields,
  maxDepth,
}
```

仅提供 canonical report JSON 时，可以验证 document 自洽性，但 verifier trust 只能是 `self-consistent`。

提供独立可信的 `expectedVerification`、`expectedProvenance` 或 `expectedReport` 后，所有已提供 anchors 都匹配时，verifier trust 为 `anchored`。

## 两层 trust 语义

Verification report document 内部记录的是 0.81 provenance verifier 的结果：

```text
document.result.valid
document.result.trust
```

0.83 verifier 返回的是“该 verification report 本身是否可信”的独立结果：

```text
verification.valid
verification.trust
```

两者不能混为一层：

```text
recorded result
  描述 provenance report 在 0.81 中是否通过验证

report verifier result
  描述 0.82 evidence report 的 schema、bytes、artifacts 和 anchors 是否可信
```

例如，一个记录 `invalid / untrusted` provenance 结果的 report，只要它准确、canonical、未被篡改，0.83 report verifier 仍可返回：

```text
valid: true
trust: anchored | self-consistent
```

失败证据本身仍然可以是有效审计证据。

## Verification result

```ts
{
  valid,
  trust: "anchored" | "self-consistent" | "untrusted",
  document,
  canonicalText,
  bytes,
  checksumHex,
  issues,
  checks: {
    parsed,
    schema,
    canonical,
    input,
    sourceArchive,
    result,
    verificationChecks,
    anchors,
    evidence,
    issues,
    jsonChecksum,
    textReport,
    artifactEnvelope,
  },
  anchors: {
    expectedReport,
    verification,
    provenance,
    jsonChecksumArtifact,
    textReportArtifact,
  },
}
```

Trust 规则：

```text
anchored
  report 有效，并且至少一个独立 trusted anchor 被提供，所有已提供 trusted anchors 都匹配

self-consistent
  report 有效，但未提供 expected report / verification / provenance trusted anchor

untrusted
  report schema、canonical bytes、artifact envelope、checksum、text report 或任一 trusted anchor 验证失败
```

JSON checksum artifact 与 text report artifact 属于 report 自身 envelope，不单独构成外部 trusted anchor。

## Strict report schema verification

Verifier 验证固定顶层字段：

```text
schema
schemaVersion
target
input
sourceArchive
result
checks
anchors
evidence
issues
```

固定 schema：

```text
splat-world-engine/
mission-diagnostics-policy-manifest-verified-imported-archive-provenance-verification-report
```

固定 schema version：

```text
1
```

所有固定 schema object：

- 必须是 plain JSON object。
- 必须包含全部 required fields。
- 禁止 unknown fields。
- 不接受 class instance、array root 或 prototype-bearing object。

## Canonical JSON verification

Report JSON 必须满足：

```text
recursive object-key ordering
array order preserved
two-space indentation
exactly one trailing newline
```

Verifier 直接对输入 bytes 重新 canonicalize 并比较，不调用 report creator。

## Result relationship verification

Verifier 验证：

- `result.valid` 必须是 boolean。
- `result.trust` 只能是 `anchored`、`self-consistent` 或 `untrusted`。
- valid result 不得记录 `untrusted`。
- invalid result 必须记录 `untrusted`。
- valid result 的 issue count 必须为零。
- invalid result 必须保留至少一条 issue。
- valid result 要求所有 provenance verification checks 为 true。
- recorded `anchored` 必须存在至少一个 trusted provenance / extraction / source checksum anchor，且全部为 true。
- recorded `self-consistent` 不得声称存在 trusted provenance / extraction / source checksum anchor。

这里验证的是 report 对 0.81 result 的准确记录，不重新运行 0.81 creator。

## Stable issue evidence

每条 report issue evidence 必须包含：

```ts
{
  code,
  path,
  message,
}
```

Verifier 验证：

- issue code 必须属于 0.81 固定 issue code 集合。
- path 必须从 `$` 开始。
- path 最长 2048 characters。
- message 必须与 issue code 对应的稳定规范化 message 完全一致。
- 未截断时，`issues.length` 必须等于 `result.issueCount`。
- 截断时，必须正好保留 512 条，并且原 issue count 必须更大。

这会拒绝 engine-specific JSON parse message、动态异常文本和被修改的审计文案。

## Exact provenance anchor

提供 `expectedProvenance` 后，verifier 会重新计算并比较：

- exact provenance JSON UTF-8 bytes
- exact provenance JSON SHA-256
- source artifact filename normalization
- source MIME normalization
- declared / exact byte relationships
- declared / exact checksum relationships
- input envelope booleans
- normalized target
- source archive filename
- source archive exact bytes
- source archive SHA-256

Report 不嵌入 provenance 原文，但可以通过 SHA-256 与独立 provenance result 建立 byte-level anchor。

## Expected verification anchor

提供 `expectedVerification` 后，verifier 会比较：

- `valid`
- `trust`
- full issue count
- all verification checks
- all provenance verifier anchors
- document / canonical text / checksum availability evidence
- issues truncation state
- normalized stable issue evidence

若同时提供 `expectedProvenance`，还会验证 `canonicalTextMatchesInput` 与 exact provenance JSON text 的关系。

## Artifact envelope verification

完整 artifact result 固定顺序：

```text
1. provenance-verification-report-text
2. provenance-verification-report-json
3. provenance-verification-report-json-sha256
```

每个 artifact 都验证：

- fixed kind order
- safe basename
- expected MIME type
- exact UTF-8 byte size
- exact artifact SHA-256
- total artifact bytes

JSON SHA-256 artifact 必须使用严格语法：

```text
<64 lowercase hex>  <verification-report-json-filename>\n
```

Checksum filename 必须为：

```text
<verification-report-json-filename>.sha256
```

## Independent text report verification

Verifier 不信任 text report，也不会只验证它自己的 SHA-256。

它会根据 parsed report document 和固定字段顺序独立格式化 expected text report，并验证：

- exact text bytes
- fixed heading
- schema / version
- target
- result / trust / issue count
- provenance input metadata
- source archive metadata
- verification checks order
- trusted anchors order
- stable issue evidence order
- final result line
- filename 与 JSON basename relationship

## Workflow UI

独立 verification control：

```ts
createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationControl(
  report,
  options,
)
```

按钮：

```text
Verify provenance verification report artifacts
```

Composite workflow helper：

```ts
createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerifiedActions(
  verification,
  provenance,
  options,
)
```

该 helper 组合：

```text
0.82 report creation / preview / copy / download actions
                         ↓
0.83 independent report verification control
```

它保留 0.82 原 actions API，允许现有调用方逐步迁移，不强制破坏旧集成。

## Data attributes

```text
data-bundle-imported-archive-provenance-verification-report-verification-status
data-bundle-imported-archive-provenance-verification-report-verification-valid
data-bundle-imported-archive-provenance-verification-report-verification-trust
data-bundle-imported-archive-provenance-verification-report-verification-issue-count
data-bundle-imported-archive-provenance-verification-report-verification-schema-version
data-bundle-imported-archive-provenance-verification-report-verification-result-valid
data-bundle-imported-archive-provenance-verification-report-verification-result-trust
data-bundle-imported-archive-provenance-verification-report-verification-checksum
```

## Stable verifier issues

0.83 report verifier issue codes：

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

除输入无法安全解析、超过 hard limit 或 Web Crypto 不可用外，verifier 会尽量返回全部可恢复 issues。

## Security boundary

- Verifier 不调用 0.82 report creator。
- 不执行 report、provenance、issue、artifact text 或 filename。
- 不使用 `innerHTML`；所有 HUD 内容通过 `textContent`。
- 不从 untrusted filename 创建目录或路径。
- Verification 本身不下载、不创建 Blob URL、不写 Clipboard。
- Report JSON 默认上限为 4 MiB。
- String、array、object field count 与 nesting depth 均有 hard limits。
- Issue evidence 最多 512 条，path 最长 2048 characters。
- 只接受 plain JSON objects。
- SHA-256 始终基于 exact retained UTF-8 bytes 重新计算。
- Web Crypto 不可用时返回 `crypto-unavailable`，不会声称 checksum 已验证。
- Checksum artifact 和 text artifact 只证明 report envelope 自洽，不会被误报为外部 trusted anchor。
- `invalid / untrusted` recorded result 不会被改写为 provenance verification success。
- Verification 失败不会移除现有 report preview、copy 或 download artifacts。

## 版本

```text
package version: 0.83.0
runtime label: runtime 0.83
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
- [x] Verified imported archive provenance verification report artifact verification
- [ ] Verification-report verification evidence artifacts

## Next

```text
Mission diagnostics policy manifest validation artifact bundle
provenance verification-report verification evidence artifacts
```

下一版建议把 0.83 verifier result 固化为 deterministic text、canonical JSON 与 JSON SHA-256 artifacts，使 Runtime、Builder 和 CI 可以保留“verification report 已被独立验证”的第二层 evidence，并继续避免递归地把 creator 当作 authority。
