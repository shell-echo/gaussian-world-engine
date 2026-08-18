# Splat World Engine — Verification Result Artifact-Verifier Evidence Artifacts

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime / Builder 原型。Runtime/Builder 0.96 把 0.95 对 0.94 verifier-evidence verification-result 三件套的独立 verifier 结论固化为 deterministic text、canonical JSON 与 JSON SHA-256 verifier-evidence artifacts，供 Runtime、Builder 与 CI 留存下一层审计证据。

## Runtime/Builder 0.96

核心 API：

```ts
createRuntimeNavMissionDiagnosticsVerifierEvidenceVerificationResultVerifierEvidence(
  verification,
  source,
)
```

Creator 只记录已经完成的 0.95 verifier result，不重新运行 0.95 verifier，也不调用 0.94 creator 作为 authority。以下历史结果都可以生成完整三件套：

```text
valid / anchored
valid / self-consistent
invalid / untrusted
```

固定 artifact 顺序：

```text
1. result-verifier-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence-text
2. result-verifier-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence-json
3. result-verifier-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence-json-sha256
```

Schema：

```text
splat-world-engine/mission-diagnostics-policy-manifest-provenance-verification-report-verification-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence
schema version: 1
```

Verifier-evidence document 记录：0.94 verification-result JSON exact UTF-8 bytes/SHA-256、input envelope、recorded 0.94 schema/version 与 historical 0.93 verifier result、0.95 verifier `valid/trust/issueCount`、全部 checks/anchors、canonical/checksum relationships，以及 bounded stable normalized 0.95 issues。

失败状态：

```text
result-unavailable
input-too-large
crypto-unavailable
evidence-error
```

失败不会返回部分 artifact set。输入 0.94 verification-result JSON 限制为 4 MiB；没有 Web Crypto 时不会生成缺少 checksum 的 artifact。

Determinism：object keys 递归排序、array order 保持、JSON 使用 2-space indentation 与 exactly one trailing newline；issue message 按 0.95 issue code 稳定化，最多保留 512 条 issue，path 最长 2048 characters；不记录 timestamp、random ID、session、browser/machine metadata、locale-dependent values 或 raw runtime error message。

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
```

HUD 在 0.95 verification 完成后追加 verifier-evidence 区域，支持 deterministic preview、copy、individual download 与 fixed-order download-all；sequence guard 防止旧异步 evidence creation 覆盖新的 verifier result。

安全边界：creator 不重新运行 verifier、不执行输入、不使用 `innerHTML`、不从 filename 创建路径、不自动下载或写 Clipboard；Blob URL 仅显式下载时创建并 revoke；checksum artifact 不作为 external authority。0.96 继续使用短内部 module filename family `NavMissionDiagnosticsVerifierEvidenceVerificationResultVerifierEvidence*`，避免递归链重新引入常见 255-byte 单文件名限制风险，同时保留完整 schema 与公开 API 语义。

```text
package version: 0.96.0
runtime label: runtime 0.96
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
- [ ] Verification-result artifact-verifier evidence artifact verification

下一版建议为 0.96 verifier-evidence 三件套增加独立 verifier，直接验证 fixed schema、canonical JSON、exact 0.94 verification-result checksum、recorded 0.95 checks/anchors/issues、text evidence、artifact envelope 与 evidence JSON SHA-256，而不是调用 0.96 creator 重新生成 expected output。
