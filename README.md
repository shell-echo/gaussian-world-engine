# Splat World Engine — Verification Result Verifier Evidence Verification Result Artifacts

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime / Builder 原型。Runtime/Builder 0.94 把 0.93 对 0.92 verification-result verifier-evidence 三件套的独立验证结论固化为 deterministic text、canonical JSON 与 JSON SHA-256 verification-result artifacts，供 Runtime、Builder 与 CI 留存下一层审计结果。

## Runtime/Builder 0.94

核心 API：

```ts
createRuntimeNavMissionDiagnosticsResultVerificationVerifierEvidenceVerificationResult(
  verification,
  source,
)
```

Creator 只记录已经完成的 0.93 verifier result，不重新运行 0.93 verifier，也不调用 0.92 creator 作为 authority。以下结果都可以生成完整三件套：

```text
valid / anchored
valid / self-consistent
invalid / untrusted
```

固定 artifact 顺序：

```text
1. result-verifier-evidence-verification-result-verifier-evidence-verification-result-text
2. result-verifier-evidence-verification-result-verifier-evidence-verification-result-json
3. result-verifier-evidence-verification-result-verifier-evidence-verification-result-json-sha256
```

Schema：

```text
splat-world-engine/mission-diagnostics-policy-manifest-provenance-verification-report-verification-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence-verification-result
schema version: 1
```

Verification-result document 记录：0.92 verifier-evidence JSON exact UTF-8 bytes/SHA-256、input envelope、recorded 0.92 schema/version 与 historical 0.91 verification-result artifact verifier result、0.93 verifier `valid/trust/issueCount`、全部 checks/anchors、canonical/checksum relationships，以及 bounded stable normalized 0.93 issues。

失败状态：

```text
evidence-unavailable
input-too-large
crypto-unavailable
result-error
```

失败不会返回部分 artifact set。输入 0.92 verifier-evidence JSON 限制为 4 MiB；没有 Web Crypto 时不会生成缺少 checksum 的 artifact。

Determinism：object keys 递归排序、array order 保持、JSON 使用 2-space indentation 与 exactly one trailing newline；issue message 按 0.93 issue code 稳定化，最多保留 512 条 issue，path 最长 2048 characters；不记录 timestamp、random ID、session、browser/machine metadata、locale-dependent values 或 raw runtime error message。

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
```

HUD 在 0.93 verification 完成后追加 verification-result 区域，支持 deterministic preview、copy、individual download 与 fixed-order download-all；sequence guard 防止旧异步 result creation 覆盖新的 verifier result。

安全边界：creator 不重新运行 verifier、不执行输入、不使用 `innerHTML`、不从 filename 创建路径、不自动下载或写 Clipboard；Blob URL 仅显式下载时创建并 revoke；checksum artifact 不作为 external authority。0.94 继续使用短内部 module filename family，避免递归链重新引入常见 255-byte 单文件名限制风险，同时保留完整 schema 与公开语义。

```text
package version: 0.94.0
runtime label: runtime 0.94
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
- [ ] Verification-result verifier-evidence verification-result artifact verification

下一版建议为 0.94 verification-result 三件套增加独立 verifier，直接验证 fixed schema、canonical JSON、exact 0.92 verifier-evidence checksum、recorded 0.93 checks/anchors/issues、text result、artifact envelope 与 result JSON SHA-256，而不是调用 0.94 creator 重新生成 expected output。
