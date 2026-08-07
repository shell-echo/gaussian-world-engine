# Splat World Engine — Evidence Verification Result Verifier Evidence Artifacts

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime / Builder 原型。Runtime/Builder 0.88 把 0.87 对 0.86 evidence-verification result 三件套的独立 verifier 结论固化为 deterministic text、canonical JSON 与 JSON SHA-256 artifacts，供 Runtime、Builder 与 CI 留存第三层 verification evidence。

## Runtime/Builder 0.88

核心 API：

```ts
createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationEvidenceArtifactVerificationResultArtifactVerificationEvidence(
  verification,
  source,
)
```

Creator 只记录已经完成的 0.87 verifier result，不重新运行 0.87 verifier，也不调用 0.86 creator 作为 authority。以下结果都可以生成完整三件套：

```text
valid / anchored
valid / self-consistent
invalid / untrusted
```

固定 artifact 顺序：

```text
1. evidence-verification-result-verifier-evidence-text
2. evidence-verification-result-verifier-evidence-json
3. evidence-verification-result-verifier-evidence-json-sha256
```

Schema：

```text
splat-world-engine/mission-diagnostics-policy-manifest-provenance-verification-report-verification-evidence-verification-result-verifier-evidence
schema version: 1
```

Evidence document 记录：0.86 verification-result JSON exact UTF-8 bytes/SHA-256、input envelope、recorded 0.86 schema/version 与 0.85 evidence-verifier historical result、0.87 verifier `valid/trust/issueCount`、全部 checks/anchors、canonical/checksum relationships，以及 bounded stable normalized 0.87 issues。

失败状态：

```text
result-unavailable
input-too-large
crypto-unavailable
evidence-error
```

失败不会返回部分 artifact set。输入 0.86 result JSON 限制为 4 MiB；没有 Web Crypto 时不会生成缺少 checksum 的 artifact。

完整 workflow：

```text
0.82 report artifacts
  -> 0.83 report verification
  -> 0.84 report-verifier evidence artifacts
  -> 0.85 evidence verification
  -> 0.86 evidence-verification result artifacts
  -> 0.87 independent result-artifact verification
  -> 0.88 deterministic result-verifier evidence artifacts
```

HUD 在 0.87 verification 完成后追加 result-verifier evidence 区域，支持 deterministic preview、copy、individual download 与 fixed-order download-all；sequence guard 防止旧异步 evidence 覆盖新 verifier result。

安全边界：creator 不重新运行 verifier、不执行输入、不使用 `innerHTML`、不从 filename 创建路径、不自动下载或写 Clipboard；Blob URL 仅显式下载时创建并 revoke；issue message 按 code 稳定化；无 timestamp/random/session/browser/machine/locale 字段；checksum artifact 不作为 external authority。

```text
package version: 0.88.0
runtime label: runtime 0.88
```

## Roadmap

- [x] Report-verifier evidence artifacts
- [x] Report-verifier evidence artifact verification
- [x] Report-verifier evidence verification result artifacts
- [x] Report-verifier evidence verification-result artifact verification
- [x] Evidence verification-result verifier evidence artifacts
- [ ] Evidence verification-result verifier evidence artifact verification

下一版建议为 0.88 verifier-evidence 三件套增加独立 verifier，直接验证 schema、canonical JSON、exact 0.86 result checksum、recorded 0.87 checks/anchors/issues、text evidence、artifact envelope 与 evidence JSON SHA-256，而不是调用 0.88 creator 重新生成 expected output。
