# Splat World Engine — Evidence Verification Result Artifact Verification

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime / Builder 原型。Runtime/Builder 0.87 为 0.86 的 evidence-verification result 三件套增加独立 verifier，直接审计 result JSON、canonical bytes、recorded 0.85 result、trusted anchors、text result、artifact envelope 与 JSON SHA-256，不调用 0.86 creator 重新生成 expected output。

## Runtime/Builder 0.87

核心 API：

```ts
verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationEvidenceArtifactVerificationResultText(text, options)

verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationEvidenceArtifactVerificationResultTextAnchored(text, options)

verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationEvidenceArtifactVerificationResultArtifact(
  source,
  expectedVerification,
  expectedEvidence,
  expectedInputEvidenceChecksumHex,
)
```

HUD：

```text
Verify evidence verification result artifacts
```

Verifier 覆盖 fixed schema/version、unknown fields、recursive canonical JSON、0.84 evidence input exact bytes/SHA-256、recorded evidence metadata、0.85 verifier `valid/trust/checks/anchors/issues`、stable issue evidence、text result、fixed artifact order、safe filenames、MIME、UTF-8 byte sizes、per-artifact SHA-256 与 strict `.sha256` syntax。

Trust：

```text
anchored         result artifacts 有效，且全部已提供 trusted anchors 匹配
self-consistent  result artifacts 有效，但没有独立 trusted anchor
untrusted        schema、bytes、relationships、artifacts、checksum 或 anchor 失败
```

0.86 document 中的 `result.valid/result.trust` 是 0.85 evidence-verifier 的历史结论；0.87 返回值描述 0.86 verification-result artifact set 本身是否可信。因此，准确记录 `invalid / untrusted` 历史验证结果的 0.86 三件套仍可成为 anchored 或 self-consistent 的失败审计证据。

完整 workflow：

```text
0.82 report artifacts
  -> 0.83 report verification
  -> 0.84 report-verifier evidence artifacts
  -> 0.85 evidence verification
  -> 0.86 evidence-verification result artifacts
  -> 0.87 independent result-artifact verification
```

安全边界：verification 不调用 0.86 creator、不执行输入、不使用 `innerHTML`、不从 filename 创建路径、不自动下载或写 Clipboard；输入、字符串、数组、对象字段、嵌套深度与 issue 数量均有界；SHA-256 从 exact UTF-8 bytes 重算；text/checksum artifacts 只证明 envelope consistency，不作为 external authority。

```text
package version: 0.87.0
runtime label: runtime 0.87
```

## Roadmap

- [x] Report-verifier evidence artifacts
- [x] Report-verifier evidence artifact verification
- [x] Report-verifier evidence verification result artifacts
- [x] Report-verifier evidence verification-result artifact verification
- [ ] Evidence verification-result verifier evidence artifacts

下一版建议把 0.87 verifier result 固化为 deterministic text、canonical JSON 与 JSON SHA-256 artifacts，供 Runtime、Builder 与 CI 留存第三层独立 verification evidence。
