# Splat World Engine — Evidence Verification Result Artifacts

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime / Builder 原型。Runtime/Builder 0.86 将 0.85 对 report-verifier evidence 的独立验证结果固化为 deterministic text、canonical JSON 与 JSON SHA-256 三件套，供 Runtime、Builder 与 CI 留存第二层验证证据。

## Runtime/Builder 0.86

核心 API：

```ts
createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportedArchiveProvenanceVerificationReportVerificationEvidenceArtifactVerificationResult(
  verification,
  evidence,
)
```

Creator 只记录已经完成的 0.85 verifier result，不重新运行 verifier，也不调用 0.84 evidence creator 作为 authority。以下结果都可以生成完整三件套：

```text
valid / anchored
valid / self-consistent
invalid / untrusted
```

固定 artifact 顺序：

```text
1. report-verifier-evidence-verification-result-text
2. report-verifier-evidence-verification-result-json
3. report-verifier-evidence-verification-result-json-sha256
```

Evidence document 记录：被验证的 0.84 evidence JSON exact UTF-8 bytes/SHA-256、input envelope、recorded evidence metadata、0.85 verifier `valid/trust/issueCount`、checks、anchors、canonical/checksum relationships，以及 bounded stable normalized issues。它不嵌入原始 provenance JSON、verification report JSON、ZIP bytes、validation report 或 imported artifact text。

失败状态：

```text
evidence-unavailable
input-too-large
crypto-unavailable
result-error
```

失败不会返回部分 artifact set。输入 evidence JSON 限制为 4 MiB；没有 Web Crypto 时不会生成缺少 checksum 的 artifact。

完整 HUD workflow：

```text
0.82 provenance verification report artifacts
  -> 0.83 independent report verification
  -> 0.84 report-verifier evidence artifacts
  -> 0.85 independent evidence verification
  -> 0.86 deterministic evidence-verification result artifacts
```

安全边界：不执行输入、不使用 `innerHTML`、不从 filename 创建路径、creator 不自动下载/写 Clipboard、Blob URL 仅显式下载时创建并 revoke、issue message 按 code 稳定化、无 timestamp/random/session/browser/machine/locale 字段。

```text
package version: 0.86.0
runtime label: runtime 0.86
```

## Roadmap

- [x] Report-verifier evidence artifacts
- [x] Report-verifier evidence artifact verification
- [x] Report-verifier evidence verification result artifacts
- [ ] Report-verifier evidence verification-result artifact verification

下一版建议为 0.86 三件套增加独立 verifier，验证 fixed schema、canonical JSON、exact input evidence checksum、recorded 0.85 checks/anchors/issues、text artifact、artifact envelope 与 result JSON SHA-256，而不是调用 0.86 creator 重新生成 expected output。
