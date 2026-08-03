# Splat World Engine — Mission Diagnostics Verified Extraction Archive

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.76 在 0.75 的 verified artifact extraction 之上增加确定性 ZIP archive workflow：只有完整通过 bundle verifier 并成功提取的 validation text report、JSON report 与 JSON SHA-256 artifact，才可以被打包为标准 ZIP。

```text
External validation artifact bundle
  ├── bounded local file import
  ├── exact-text verification
  ├── verified artifact extraction
  │   ├── validation report text
  │   ├── validation report JSON
  │   └── validation report JSON SHA-256
  └── deterministic ZIP archive
      ├── fixed entry order
      ├── ZIP Store, no compression
      ├── UTF-8 filenames
      ├── fixed DOS timestamp
      ├── per-entry CRC-32
      └── archive SHA-256
```

## Runtime/Builder 0.76 能力

新增：

```text
src/large/NavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchive.ts
```

### Archive API

```ts
createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchive(
  extraction,
  options,
)
```

该 API 只接受 `status: "extracted"` 的可信 extraction result。未经验证、验证失败、document 不可用或 artifact set 不完整的输入不会产生 ZIP bytes。

返回状态：

```text
created
extraction-unavailable
filename-invalid
zip64-required
crypto-unavailable
archive-error
```

成功 artifact：

```ts
{
  filename,
  mimeType: "application/zip",
  bytes,
  checksumHex,
  entryCount: 3,
  totalUncompressedBytes,
  compressionMethod: "store",
  fixedTimestamp: "1980-01-01T00:00:00",
  entries: [
    {
      kind,
      filename,
      bytes,
      crc32Hex,
      checksumHex,
    },
  ],
  data: Uint8Array,
}
```

### Deterministic ZIP contract

Archive 使用标准 ZIP32 结构：

```text
local file headers
file data
central directory
end of central directory
```

固定约束：

- Entry 顺序严格为：

```text
validation-report-text
validation-report-json
validation-report-json-sha256
```

- Compression method 为 `0`：ZIP Store，不压缩。
- General purpose bit flag 启用 UTF-8 filename。
- DOS timestamp 固定为 `1980-01-01 00:00:00`。
- 不写入 extra fields。
- 不写入 file comments。
- 不写入 archive comment。
- 不使用 data descriptor。
- 每个 entry 写入 exact UTF-8 bytes 和真实 CRC-32。
- Central directory 与 local header 使用同一 metadata。
- 最终 ZIP 使用 Web Crypto 计算完整 SHA-256。
- 相同 extraction、相同 archive filename 将生成逐字节一致的 ZIP。

当前版本有意不启用 ZIP64。任何需要 64-bit entry size、offset 或 central-directory field 的输入都会返回 `zip64-required`，不会截断数值或输出损坏 archive。

### Archive filename

默认 filename 根据 verified target 生成：

```text
large-world-manifest.diagnostics-policy.verified-validation-artifacts.zip
mission-package-<index>.diagnostics-policy.verified-validation-artifacts.zip
mission-diagnostics-policy-manifest.invalid-target.verified-validation-artifacts.zip
```

调用者可以传入自定义 filename，但必须是安全的 `.zip` basename，不能包含路径分隔符或控制字符。

### Download API

```ts
downloadRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchive(
  artifact,
)
```

下载 exact ZIP bytes，使用 `application/zip` Blob，并在点击后立即释放 object URL。

### HUD archive action

0.75 的 extraction actions 现在会异步准备 archive：

```text
Verified artifact extraction
  ├── Preparing deterministic verified artifacts ZIP…
  ├── Download verified artifacts ZIP
  ├── Download all verified artifacts
  ├── Download verified validation text report
  ├── Download verified validation JSON report
  └── Download verified validation JSON SHA-256
```

Archive 成功后按钮 preview 包含：

```text
archive filename
entry count
ZIP byte size
Store compression method
archive SHA-256 prefix
```

Archive 失败不会影响三个已验证 artifact 的单项下载或原有 download-all workflow。

### Machine-readable HUD state

Extraction root 暴露：

```text
data-bundle-extraction-archive-status
data-bundle-extraction-archive-filename
data-bundle-extraction-archive-bytes
data-bundle-extraction-archive-entry-count
data-bundle-extraction-archive-checksum
```

Archive download button 暴露：

```text
data-bundle-extraction-archive-action
data-bundle-extraction-archive-status
data-bundle-extraction-archive-filename
data-bundle-extraction-archive-bytes
data-bundle-extraction-archive-entry-count
data-bundle-extraction-archive-checksum
data-bundle-extraction-archive-compression
```

新增 extraction action callbacks：

```ts
onArchive(result, extraction)
onArchiveDownload(artifact, result)
```

## Security boundary

- Raw bundle JSON 不能直接进入 archive writer。
- Archive writer 只接受 `extracted` result。
- Entry filename 必须是安全 basename，阻止 ZIP path traversal。
- Entry exact text 会重新编码并核对 UTF-8 byte size。
- CRC-32 用于标准 ZIP entry integrity；原始 SHA-256 metadata 同时保留在 archive result 中。
- Archive SHA-256 对最终完整 ZIP bytes 计算。
- Web Crypto 不可用时不输出缺少完整性 metadata 的 archive。
- 失败流程不创建 Blob、object URL、anchor 或下载。
- 无时间戳、随机 ID、浏览器 metadata 或压缩器差异进入 ZIP bytes。

## Version

```text
package version: 0.76.0
runtime label: runtime 0.76
```

## Checklist

- [x] Mission diagnostics policy editor presets
- [x] Mission diagnostics editor preset picker UI
- [x] Mission diagnostics policy editor custom overrides UI
- [x] Mission diagnostics policy editor apply / reload workflow
- [x] Mission diagnostics policy editor shareable URL export
- [x] Mission diagnostics policy manifest export scaffold
- [x] Mission diagnostics policy manifest import / apply workflow
- [x] Mission diagnostics policy manifest package target picker
- [x] Mission diagnostics policy manifest package patch preview
- [x] Mission diagnostics policy manifest package patch copy/apply polish
- [x] Mission diagnostics policy manifest save / authoring workflow
- [x] Mission diagnostics policy manifest HUD download integration
- [x] Mission diagnostics policy manifest HUD panel wiring
- [x] Mission diagnostics policy manifest download summary preview
- [x] Mission diagnostics policy manifest authoring validation
- [x] Mission diagnostics policy manifest validation HUD issue details
- [x] Mission diagnostics policy manifest validation issue copy workflow
- [x] Mission diagnostics policy manifest validation report download workflow
- [x] Mission diagnostics policy manifest validation JSON report workflow
- [x] Mission diagnostics policy manifest validation JSON report copy workflow
- [x] Mission diagnostics policy manifest validation JSON report checksum workflow
- [x] Mission diagnostics policy manifest validation JSON checksum download workflow
- [x] Mission diagnostics policy manifest validation artifact bundle workflow
- [x] Mission diagnostics policy manifest validation artifact bundle verification workflow
- [x] Mission diagnostics policy manifest validation artifact bundle import / verification workflow
- [x] Mission diagnostics policy manifest validation artifact bundle verified artifact extraction workflow
- [x] Mission diagnostics policy manifest validation artifact bundle verified extraction archive workflow
- [ ] Mission diagnostics policy manifest validation artifact bundle verified extraction archive verification workflow

## 运行 Runtime

```bash
npm install
npm run dev
```

打开大场景 Mission HUD：

```text
http://localhost:5173?world=/worlds/large-demo/world.json&clickToMove=1&missionDebug=1
```

验证：

```bash
npm run typecheck
npm run build
npm run preview
```

## Archive example

```ts
const extraction =
  await extractRuntimeNavMissionDiagnosticsManifestHudValidationArtifactsFromBundleText(
    bundleText,
  );

const archive =
  await createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchive(
    extraction,
  );

if (archive.status === "created" && archive.artifact) {
  console.log(
    archive.artifact.filename,
    archive.artifact.bytes,
    archive.artifact.checksumHex,
  );

  downloadRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionArchive(
    archive.artifact,
  );
}
```

## Next

下一项：

```text
Mission diagnostics policy manifest validation artifact bundle
verified extraction archive verification workflow
```

下一版将从 ZIP bytes 重新解析 local headers、central directory 与 EOCD，验证固定时间戳、Store method、UTF-8 flag、entry order、CRC-32、entry SHA-256 与 archive SHA-256，形成 archive 自验证闭环。
