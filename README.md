# Splat World Engine — Artifact-Verifier Evidence Verification-Result Verifier Evidence Artifact Verification

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime / Builder 原型。Runtime/Builder 0.101 为 0.100 verification-result verifier-evidence 三件套增加独立 verifier，直接审计 fixed schema、canonical JSON、exact 0.98 verification-result bytes/SHA-256、recorded 0.99 verifier result、checks/anchors/issues、text evidence、artifact envelope 与 JSON SHA-256，不调用 0.100 creator 重新生成 expected output。

## Runtime/Builder 0.101

核心 API：

```ts
verifyRuntimeNavMissionDiagnosticsArtifactVerifierEvidenceVerificationResultVerifierEvidenceArtifact(
  evidence,
  expectedVerification?,
  expectedSource?,
  expectedInputResultChecksumHex?,
)
```

Verifier 覆盖：

```text
0.100 fixed schema / schemaVersion
recursive canonical JSON
exact JSON UTF-8 bytes / SHA-256
0.98 verification-result input envelope
recorded 0.98 schema / schemaVersion
recorded historical 0.97 valid / trust
recorded completed 0.99 valid / trust / issueCount
all recorded 0.99 checks / anchors
stable normalized 0.99 issue evidence
text / JSON relationship
fixed three-artifact order
safe filenames / MIME / UTF-8 byte sizes
per-artifact SHA-256 / totalBytes
strict .sha256 relationship
trusted expected verification / source / input checksum anchors
```

固定 0.100 artifact 顺序：

```text
1. result-verifier-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence-text
2. result-verifier-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence-json
3. result-verifier-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence-json-sha256
```

0.100 schema 保持不变：

```text
splat-world-engine/mission-diagnostics-policy-manifest-provenance-verification-report-verification-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence-verification-result-verifier-evidence
schema version: 1
```

0.101 不新增 artifact schema；新增的是 verifier contract。验证结果继续使用：

```text
valid / anchored
valid / self-consistent
invalid / untrusted
```

`anchored` 只来自调用方显式提供、且匹配的 trusted inputs：completed 0.99 verification、actual 0.98 verification-result source、或 trusted exact 0.98 JSON SHA-256。0.100 text / JSON / `.sha256` 之间的内部一致性只能支持 `self-consistent`，不能自行提升为 external authority。

历史失败语义保持不变：0.100 正确记录的 `invalid / untrusted` 0.99 verifier result 可以作为有效、可锚定的失败审计证据；0.101 不会把历史失败改写成 success。

Determinism / limits：JSON object keys 递归排序、array order 保持、2-space indentation、exactly one trailing newline；默认 JSON 最大 4 MiB、string 最大 1 MiB、array 最大 512 entries、object 最大 64 fields、depth 最大 32。SHA-256 从 exact UTF-8 text 重算。

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
  -> 0.101 independent verification-result verifier-evidence artifact verification
```

HUD 在 0.100 verifier-evidence 创建后追加显式 verification control。Verification 不自动下载、不自动写 Clipboard、不创建下载路径、不执行 provenance/input content、不使用 `innerHTML`；没有 Web Crypto 时验证失败为 `untrusted`，不会伪造 checksum authority。

```text
package version: 0.101.0
runtime label: runtime 0.101
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
- [x] Artifact-verifier evidence verification-result verifier evidence artifact verification
- [ ] Artifact-verifier evidence verification-result verifier-evidence verification result artifacts

下一版建议把 0.101 independent verifier result 固化为 deterministic verification-result text、canonical JSON 与 JSON SHA-256；creator 只记录已经完成的 0.101 结论，不重新执行 0.101 verifier，也不调用 0.100 creator 作为 authority。
