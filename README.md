# Splat World Engine — Result Verifier Evidence Artifact Verification

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime / Builder 原型。Runtime/Builder 0.89 为 0.88 的 result-verifier evidence 三件套增加独立 verifier，直接审计 evidence JSON、canonical bytes、recorded 0.87 verifier result、trusted anchors、text evidence、artifact envelope 与 JSON SHA-256，不调用 0.88 creator 重新生成 expected output。

## Runtime/Builder 0.89

核心 API：

```ts
verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationEvidenceArtifactVerificationResultArtifactVerificationEvidenceText(text, options)

verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationEvidenceArtifactVerificationResultArtifactVerificationEvidenceTextAnchored(text, options)

verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationEvidenceArtifactVerificationResultArtifactVerificationEvidenceArtifact(
  evidence,
  expectedVerification,
  expectedSource,
  expectedInputResultChecksumHex,
)
```

HUD：

```text
Verify result verifier evidence artifacts
```

Verifier 覆盖 fixed schema/version、unknown fields、recursive canonical JSON、0.86 verification-result input exact UTF-8 bytes/SHA-256、recorded 0.86 schema/version 与 historical 0.85 evidence-verifier result、recorded 0.87 `valid/trust/checks/anchors/issues`、stable issue evidence、text evidence、fixed artifact order、safe filenames、MIME、UTF-8 byte sizes、per-artifact SHA-256 与 strict `.sha256` syntax。

Trust：

```text
anchored         verifier evidence 有效，且全部已提供 trusted anchors 匹配
self-consistent  verifier evidence 有效，但没有独立 trusted anchor
untrusted        schema、bytes、relationships、artifacts、checksum 或 anchor 失败
```

0.88 document 中的 `result.valid/result.trust` 是 0.87 result-artifact verifier 的历史结论；0.89 返回值描述 0.88 verifier-evidence artifact set 本身是否可信。因此，准确记录 `invalid / untrusted` 历史验证结果的 0.88 三件套仍可成为 anchored 或 self-consistent 的失败审计证据。

Trusted authority 仅来自：

```text
expectedVerification
expectedSource
expectedInputResultChecksumHex
```

0.88 text 与 `.sha256` artifacts 只证明 envelope consistency，不作为 external authority。

完整 workflow：

```text
0.82 report artifacts
  -> 0.83 report verification
  -> 0.84 report-verifier evidence artifacts
  -> 0.85 evidence verification
  -> 0.86 evidence-verification result artifacts
  -> 0.87 independent result-artifact verification
  -> 0.88 deterministic result-verifier evidence artifacts
  -> 0.89 independent result-verifier evidence verification
```

安全边界：verification 不调用 0.88 creator、不执行输入、不使用 `innerHTML`、不从 filename 创建路径、不自动下载或写 Clipboard；输入、字符串、数组、对象字段、嵌套深度与 issue 数量均有界；SHA-256 从 exact UTF-8 bytes 重算；Web Crypto 不可用时返回 `crypto-unavailable`。

```text
package version: 0.89.0
runtime label: runtime 0.89
```

## Roadmap

- [x] Report-verifier evidence artifacts
- [x] Report-verifier evidence artifact verification
- [x] Report-verifier evidence verification result artifacts
- [x] Report-verifier evidence verification-result artifact verification
- [x] Evidence verification-result verifier evidence artifacts
- [x] Evidence verification-result verifier evidence artifact verification
- [ ] Result-verifier evidence verification result artifacts

下一版建议把 0.89 verifier result 固化为 deterministic text、canonical JSON 与 JSON SHA-256 artifacts，供 Runtime、Builder 与 CI 留存下一层独立 verification result；creator 仍只记录已完成 verifier 结论，不重新执行 0.89 verifier。
