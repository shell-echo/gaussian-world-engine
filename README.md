# Splat World Engine — Verification Result Artifact-Verifier Evidence Verification-Result Artifact Verification

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime / Builder 原型。Runtime/Builder 0.99 为 0.98 verification-result 三件套增加独立 verifier，直接审计 result JSON、canonical bytes、recorded 0.97 verifier result、trusted anchors、text result、artifact envelope 与 JSON SHA-256，不调用 0.98 creator 重新生成 expected output。

## Runtime/Builder 0.99

核心 API：

```ts
verifyRuntimeNavMissionDiagnosticsVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultText(text, options)
verifyRuntimeNavMissionDiagnosticsVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultTextAnchored(text, options)
verifyRuntimeNavMissionDiagnosticsVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultArtifact(
  source,
  expectedVerification,
  expectedSource,
  expectedInputEvidenceChecksumHex,
)
```

HUD：

```text
Verify artifact-verifier evidence verification-result artifacts
```

Verifier 覆盖 fixed 0.98 schema/version、unknown fields、recursive canonical JSON、0.96 artifact-verifier evidence input exact UTF-8 bytes/SHA-256、recorded 0.96 schema/version 与 historical 0.95 verification-result artifact verifier result、recorded 0.97 `valid/trust/checks/anchors/issues`、stable issue evidence、text result、fixed artifact order、safe filenames、MIME、UTF-8 byte sizes、per-artifact SHA-256、totalBytes 与 strict `.sha256` syntax。

Trust：

```text
anchored         verification-result artifacts 有效，且全部已提供 trusted anchors 匹配
self-consistent  verification-result artifacts 有效，但没有独立 trusted anchor
untrusted        schema、bytes、relationships、artifacts、checksum 或 anchor 失败
```

0.98 document 中的 `result.valid/result.trust` 是 0.97 artifact-verifier evidence verifier 的历史结论；0.99 返回值描述 0.98 verification-result artifact set 本身是否可信。因此，准确记录 `invalid / untrusted` 历史验证结果的 0.98 三件套仍可成为 anchored 或 self-consistent 的失败审计证据。

Trusted authority 仅来自：

```text
expectedVerification
expectedSource
expectedInputEvidenceChecksumHex
```

其中分别绑定 completed 0.97 verification、actual 0.96 artifact-verifier evidence source，以及 trusted exact 0.96 evidence JSON SHA-256。0.98 text 与 `.sha256` artifacts 只证明 envelope consistency，不作为 external authority。

默认边界：输入 JSON 最大 4 MiB；字符串最大 1 MiB；array 最大 512 entries；object 最大 64 fields；嵌套深度最大 32。SHA-256 始终从 exact UTF-8 bytes 重算；Web Crypto 不可用时返回 `crypto-unavailable`。

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
  -> 0.90 deterministic result-verifier evidence verification-result artifacts
  -> 0.91 independent verification-result artifact verification
  -> 0.92 deterministic verification-result verifier evidence artifacts
  -> 0.93 independent verification-result verifier-evidence verification
  -> 0.94 deterministic verifier-evidence verification-result artifacts
  -> 0.95 independent verifier-evidence verification-result artifact verification
  -> 0.96 deterministic verification-result artifact-verifier evidence artifacts
  -> 0.97 independent verification-result artifact-verifier evidence verification
  -> 0.98 deterministic artifact-verifier evidence verification-result artifacts
  -> 0.99 independent artifact-verifier evidence verification-result artifact verification
```

安全边界：verification 不调用 0.98 creator、不重新运行 0.97 verifier、不执行输入、不使用 `innerHTML`、不从 filename 创建路径、不自动下载、创建 Blob URL 或写 Clipboard。0.99 继续使用短内部 module filename family `NavMissionDiagnosticsVerifierEvidenceVerificationResultVerifierEvidenceVerificationResultVerification*`，同时保留完整公开 API 与 schema 语义。

```text
package version: 0.99.0
runtime label: runtime 0.99
```

## Roadmap

- [x] Report-verifier evidence artifacts
- [x] Report-verifier evidence artifact verification
- [x] Report-verifier evidence verification result artifacts
- [x] Report-verifier evidence verification-result artifact verification
- [x] Evidence verification-result verifier evidence artifacts
- [x] Evidence verification-result verifier evidence artifact verification
- [x] Result-verifier evidence verification result artifacts
- [x] Result-verifier evidence verification-result artifact verification
- [x] Result-verifier evidence verification-result verifier evidence artifacts
- [x] Result-verifier evidence verification-result verifier evidence artifact verification
- [x] Verification-result verifier-evidence verification result artifacts
- [x] Verification-result verifier-evidence verification-result artifact verification
- [x] Verification-result artifact-verifier evidence artifacts
- [x] Verification-result artifact-verifier evidence artifact verification
- [x] Verification-result artifact-verifier evidence verification result artifacts
- [x] Verification-result artifact-verifier evidence verification-result artifact verification
- [ ] Artifact-verifier evidence verification-result verifier evidence artifacts

下一版建议把 0.99 verifier result 固化为 deterministic text、canonical JSON 与 JSON SHA-256 verifier-evidence artifacts；creator 只记录已完成 verifier 结论，不重新执行 0.99 verifier，也不调用 0.98 creator 作为 authority。
