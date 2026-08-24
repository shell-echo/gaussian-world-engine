# Splat World Engine — Artifact-Verifier Evidence Verification-Result Verifier Evidence Artifacts

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime / Builder 原型。Runtime/Builder 0.100 把 0.99 对 0.98 artifact-verifier evidence verification-result 三件套的独立验证结论固化为 deterministic verifier-evidence text、canonical JSON 与 JSON SHA-256，供 Runtime、Builder 与 CI 留存下一层可审计证据。

## Runtime/Builder 0.100

核心 API：

```ts
createRuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidence(
  verification,
  source,
)
```

Creator 只记录已经完成的 0.99 verifier result，不重新运行 0.99 verifier，也不调用 0.98 creator 作为 authority。以下结论都可以被完整固化：

```text
valid / anchored
valid / self-consistent
invalid / untrusted
```

固定 artifact 顺序：

```text
1. result-verifier-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence-text
2. result-verifier-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence-json
3. result-verifier-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence-json-sha256
```

Schema：

```text
splat-world-engine/mission-diagnostics-policy-manifest-provenance-verification-report-verification-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence
schema version: 1
```

Verifier-evidence document 记录：

```text
0.98 verification-result JSON
  exact UTF-8 bytes
  exact SHA-256
  filename / MIME
  declared bytes/checksum
  envelope relationships

recorded 0.98
  schema / schemaVersion
  historical 0.97 artifact-verifier evidence verification valid / trust

completed 0.99 verifier
  valid / trust / full issueCount
  all checks
  all anchors

canonical/checksum relationships
stable normalized 0.99 issues
```

失败状态：

```text
result-unavailable
input-too-large
crypto-unavailable
evidence-error
```

失败不会返回部分 artifact set。输入 0.98 verification-result JSON 最大 4 MiB；没有 Web Crypto 时不会生成不完整 checksum artifact。Issue 最多保留 512 条，path 最长 2048 characters。

Determinism：object keys 递归排序、array order 保持、JSON 使用 2-space indentation 与 exactly one trailing newline；issue message 按 0.99 issue code 稳定化，不记录 raw runtime message、timestamp、random ID、session、browser/machine metadata 或 locale-dependent values。`.sha256` 严格使用 `<64 lowercase hex>  <json filename>\n`。

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
  -> 0.100 deterministic verification-result verifier-evidence artifacts
```

HUD 在 0.99 verification 完成后追加 verifier-evidence 区域，支持 deterministic preview、copy、individual download 与 fixed-order download-all；sequence guard 防止旧异步 evidence creation 覆盖新的 verifier result。

安全边界：creator 不重新运行 verifier、不执行输入、不使用 `innerHTML`、不从 filename 创建路径、不自动下载或写 Clipboard；Blob URL 仅显式下载时创建并立即 revoke。0.100 使用短内部 module filename family `NavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidence*`，避免递归链重新引入常见 255-byte 单文件名限制风险，同时保留完整公开 API、artifact kind 与 schema 语义。

```text
package version: 0.100.0
runtime label: runtime 0.100
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
- [x] Artifact-verifier evidence verification-result verifier evidence artifacts
- [ ] Artifact-verifier evidence verification-result verifier evidence artifact verification

下一版建议为 0.100 verifier-evidence 三件套增加独立 verifier，直接验证 fixed schema、canonical JSON、exact 0.98 verification-result checksum、recorded 0.99 checks/anchors/issues、text evidence、artifact envelope 与 JSON SHA-256，而不是调用 0.100 creator 重新生成 expected output。
