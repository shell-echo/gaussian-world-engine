# Splat World Engine — Imported ZIP Provenance Verification

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime / Builder 原型。Runtime/Builder 0.81 在 0.80 的 deterministic verified imported ZIP provenance artifacts 之上增加独立 provenance verifier：它直接解析 provenance JSON、验证 canonical bytes、重新锚定 source ZIP 与 trusted/imported extraction，并验证 provenance JSON SHA-256 artifact；不会调用 provenance creator 重新生成结果后做简单字符串比较。

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
  └── independent provenance verification
      ├── strict JSON parsing and bounded values
      ├── recursive canonical JSON verification
      ├── schema and schemaVersion verification
      ├── source ZIP checksum anchoring
      ├── trusted extraction anchoring
      ├── imported byte-range / CRC-32 / SHA-256 verification
      ├── relationship verification
      ├── provenance JSON checksum artifact verification
      └── anchored / self-consistent / untrusted trust classification
```

## Runtime/Builder 0.81 能力

新增：

```text
src/large/
└── NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenanceVerification.ts
```

更新：

```text
src/large/NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchiveImportedArtifactProvenance.ts
```

## Core APIs

验证已创建的完整 provenance artifact result，并使用当前 trusted entry extraction 锚定：

```ts
verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceArtifact(
  provenance,
  entryExtraction,
)
```

验证独立 provenance JSON text：

```ts
verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceText(
  text,
  options,
)
```

`options` 可提供：

```ts
{
  jsonFilename,
  checksumArtifactText,
  checksumArtifactFilename,
  expectedProvenance,
  expectedEntryExtraction,
  expectedSourceArchiveChecksumHex,
  maxTextBytes,
  maxStringCharacters,
  maxArrayEntries,
  maxObjectFields,
  maxDepth,
}
```

Text API 不要求 trusted anchor。一个结构和校验关系完全自洽、但未提供可信外部锚点的 document 可以通过验证，但 trust 只能是 `self-consistent`。

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
}
```

Trust 语义：

```text
anchored
  document 有效，并且至少一个 trusted anchor 存在，所有已提供 trusted anchors 均匹配

self-consistent
  document 有效，但没有 trusted provenance / entry extraction / source ZIP checksum anchor

untrusted
  document、checksum artifact 或任何已提供 trusted anchor 验证失败
```

JSON checksum artifact 证明 JSON bytes 与 checksum claim 自洽，但它本身不构成外部 trusted anchor。

## Strict document verification

Verifier 会验证：

1. 输入必须是 bounded UTF-8 text，byte size 不超过配置上限。
2. JSON 必须严格解析成功，顶层只能是 plain object。
3. 顶层与所有固定 schema object 禁止未知字段。
4. schema 必须精确匹配：

```text
splat-world-engine/mission-diagnostics-policy-manifest-verified-imported-archive-provenance
```

5. schemaVersion 必须精确为 `1`。
6. Canonical JSON 必须满足：

```text
recursive object-key ordering
array order preserved
two-space indentation
exactly one trailing newline
```

7. `sourceArchive` 验证 filename、reported MIME、reported/exact bytes 与 SHA-256 descriptor。
8. `verification` 必须声明 `valid: true`、`issueCount: 0`、`entryCount: 3`，所有 archive checks 必须完成三项验证。
9. `trustedExtraction` 与 `importedExtraction` 必须为 `extracted`，并验证 artifact count、total bytes、固定顺序、filename、MIME、bytes 与 SHA-256。
10. Imported artifacts 还必须验证 ordered/non-overlapping source ranges、`dataEnd - dataOffset`、CRC-32 与 SHA-256 descriptor。
11. 三条 relationship 必须保持固定顺序，所有 relationship booleans 必须为 `true`。
12. Provenance JSON SHA-256 artifact 必须使用严格语法：

```text
<64 lowercase hex>  <provenance-json-filename>\n
```

## Trusted anchor verification

提供 `expectedEntryExtraction` 后，verifier 会重新计算并比较：

- retained exact source ZIP bytes 的 SHA-256
- source ZIP filename、reported MIME、reported bytes 与 exact bytes
- archive verifier 的 valid / issue count / bytes / entry count / total bytes / checks
- trusted artifact text 的 exact UTF-8 bytes 与 SHA-256
- imported artifact copied bytes 的 CRC-32 与 SHA-256
- imported artifact 的 source ZIP `dataOffset` / `dataEnd` range
- retained source ZIP range 与 imported copied bytes
- imported bytes 与 trusted UTF-8 text bytes
- fixed artifact order、kind、filename、MIME 与 byte size

这使 verifier 与 provenance creator 保持职责独立：creator 负责生成审计 artifacts，verifier 负责从输入反向证明 document 自洽并验证可用 trusted anchors。

## Stable verification issues

每个失败项返回：

```ts
{
  code: string,
  path: string,
  message: string,
}
```

稳定 issue code 包括：

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
source-archive-mismatch
source-archive-checksum-mismatch
verification-check-mismatch
trusted-extraction-mismatch
imported-extraction-mismatch
relationship-count-mismatch
relationship-mismatch
artifact-order-mismatch
artifact-metadata-mismatch
crc32-mismatch
sha256-mismatch
checksum-artifact-invalid
expected-provenance-mismatch
crypto-unavailable
```

除 JSON 无法安全解析、root 类型错误或输入超过 hard limit 外，verifier 会尽可能一次返回所有可恢复 issues。

## HUD integration

Provenance artifacts 区域新增：

```text
Verify imported archive provenance report
```

成功后 details 显示：

```text
schema / schemaVersion
canonical JSON status
source ZIP SHA-256
trusted artifact count
imported artifact count
relationship count
provenance JSON SHA-256
issue count
trust classification
```

失败时：

- details 自动展开。
- 显示全部 issue `code / path / message`。
- 不移除 provenance preview、copy 或 download actions。
- 不修改输入 artifacts，允许保留损坏样本继续检查。

Provenance actions 新增 callback：

```ts
onVerify(verification, provenance)
```

## Data attributes

```text
data-bundle-imported-archive-provenance-verification-status
data-bundle-imported-archive-provenance-verification-valid
data-bundle-imported-archive-provenance-verification-trust
data-bundle-imported-archive-provenance-verification-issue-count
data-bundle-imported-archive-provenance-verification-schema-version
data-bundle-imported-archive-provenance-verification-checksum
```

## Security boundary

- Verifier 不调用 provenance creator 生成 expected document。
- 不执行 provenance、artifact text 或 filename。
- 不使用 `innerHTML`；所有 HUD 内容通过 `textContent` 写入。
- 不根据信任前的 source filename 创建路径。
- Verification 不创建 Blob URL、不触发下载、不写入 Clipboard。
- 输入 text、string、array、object field count 与 nesting depth 均有上限。
- 只有 plain JSON object 被接受，数组、class instance 与 prototype-bearing object 被拒绝。
- Web Crypto 不可用时返回 `crypto-unavailable`，不会把 SHA-256 标记为已验证。
- CRC-32 与 SHA-256 会从 trusted imported bytes 重新计算，而不是只相信 provenance metadata。
- JSON checksum artifact 只建立 byte-level self-consistency，不会被误报为完整可信。
- 失败不会撤销已完成的 imported ZIP verification、artifact inspection 或 provenance artifact preview/download。

## 版本

```text
package version: 0.81.0
runtime label: runtime 0.81
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
- [ ] Verified imported archive provenance verification report artifacts

## Next

```text
Mission diagnostics policy manifest validation artifact bundle
verified imported archive provenance verification report artifacts
```

下一版建议把 0.81 的结构化 verification result 固化为 deterministic text、canonical JSON 与 JSON SHA-256 artifacts，使 Runtime、Builder 与 CI 可以保存、复制、下载和比较 provenance verification evidence，而不是只保留内存结果。
