# Splat World Engine — Report Verifier Evidence Artifact Verification

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime / Builder 原型。Runtime/Builder 0.85 为 0.84 的 report-verifier evidence 三件套增加独立 verifier。它直接验证 evidence JSON、canonical bytes、recorded result、trusted anchors、text evidence、artifact envelope 与 JSON SHA-256，不调用 evidence creator 重新生成 expected output。

## Runtime/Builder 0.85

新增模块位于 `src/large/`，按 contract、support、fields、relationships、document、core、anchors、artifact envelope、render 与 control/workflow 分层。

核心 API：

```ts
verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationEvidenceText(text, options)

verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationEvidenceTextAnchored(text, options)

verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationEvidenceArtifact(
  evidence,
  expectedVerification,
  expectedReport,
  expectedInputReportChecksumHex,
)
```

HUD：

```text
Verify report verifier evidence artifacts
```

Verifier 覆盖 fixed schema/version、unknown fields、recursive canonical JSON、input report exact bytes/SHA-256、recorded verifier checks/anchors/issues、stable issue evidence、fixed artifact order、safe filenames、MIME、UTF-8 byte sizes、per-artifact SHA-256、text evidence 与 strict `.sha256` syntax。

Trust：

```text
anchored         evidence 有效，且全部已提供 trusted anchors 匹配
self-consistent  evidence 有效，但没有独立 trusted anchor
untrusted        schema、bytes、relationships、artifacts、checksum 或 anchor 失败
```

Evidence 中记录的 `document.result` 是 0.83 report-verifier 的历史结论；0.85 返回值描述 evidence 本身是否可信。因此，准确记录 `invalid / untrusted` 历史结果的 evidence 仍可成为 anchored 或 self-consistent 的失败审计证据。

安全边界：不执行输入、不使用 `innerHTML`、不从 filename 创建路径、verification 不下载或写 Clipboard、所有输入有界、SHA-256 从 exact UTF-8 bytes 重算、Web Crypto 不可用时返回 `crypto-unavailable`，text/checksum artifacts 不作为 external authority。

```text
package version: 0.85.0
runtime label: runtime 0.85
```

## Roadmap

- [x] Report-verifier evidence artifacts
- [x] Report-verifier evidence artifact verification
- [ ] Report-verifier evidence verification result artifacts

下一版建议把 0.85 verifier result 固化为 deterministic text、canonical JSON 与 JSON SHA-256 artifacts，供 Runtime、Builder 与 CI 留存第二层 evidence verification 结果。
