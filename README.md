# Splat World Engine — Mission Diagnostics Verified Artifact Extraction

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.75 在 0.74 的外部 validation artifact bundle 导入与验证能力之上补齐可信提取闭环：只有通过完整 verifier 的 bundle 才能暴露内嵌 validation text report、JSON report 与 JSON SHA-256 artifact，并按固定顺序进行单项或批量下载。

```text
External validation artifact bundle
  ├── bounded local file import
  ├── exact bundle text
  ├── canonical descriptor verification
  ├── artifact byte-size verification
  ├── SHA-256 verification
  ├── checksum-for relationship verification
  └── verified extraction gate
      ├── validation report text
      ├── validation report JSON
      └── validation report JSON SHA-256
```

## Runtime/Builder 0.75 能力

- 新增：

```text
src/large/NavMissionDiagnosticsManifestHudValidationArtifactBundleExtraction.ts
```

- 新增可信文本入口：

```ts
extractRuntimeNavMissionDiagnosticsManifestHudValidationArtifactsFromBundleText(text)
```

该 API 首先调用现有 bundle verifier，然后才尝试提取 artifacts。返回值同时保留完整 verification result，不存在“跳过验证直接解析”的路径。

- 新增已验证结果入口：

```ts
extractRuntimeNavMissionDiagnosticsManifestHudValidationArtifactsFromVerification(
  verification,
)
```

该入口要求：

```text
verification.valid === true
verification.issues.length === 0
verification.document !== null
```

并再次检查：

- `artifactOrder` 与固定 extraction order 一致。
- `artifacts[]` 数量严格为 3。
- 每个 entry 的 kind 与索引一致。
- 每个 entry 的 exact text UTF-8 byte size 仍与声明值一致。

- 固定提取顺序：

```text
validation-report-text
validation-report-json
validation-report-json-sha256
```

- Extraction status：

```text
extracted
verification-failed
document-unavailable
artifact-set-invalid
```

- 每个 extracted artifact 保留：

```ts
{
  kind,
  filename,
  mimeType,
  bytes,
  checksumHex,
  text,
}
```

- Extraction result 保留：

```ts
{
  status,
  verification,
  bundleStatus,
  artifactCount,
  totalBytes,
  artifacts,
  error,
}
```

- 新增下载 API：

```ts
downloadRuntimeNavMissionDiagnosticsManifestHudValidationExtractedArtifact(
  artifact,
)

downloadRuntimeNavMissionDiagnosticsManifestHudValidationExtractedArtifacts(
  extraction,
)
```

- 单项下载严格使用 bundle 中已通过 checksum 与 byte-size 验证的 exact text。
- 批量下载严格沿固定 bundle order 触发三个下载。
- 非 `extracted` 状态调用下载 API 会抛出错误，不会静默输出不可信内容。
- 新增 HUD extraction actions：

```ts
createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleExtractionActions(
  extraction,
  options,
)
```

- HUD 提供：
  - `Download all verified artifacts`
  - `Download verified validation text report`
  - `Download verified validation JSON report`
  - `Download verified validation JSON SHA-256`
- 每个 artifact action 显示 filename、byte size 与 checksum prefix。
- 支持 callbacks：

```text
onExtract
onArtifactDownload
onDownloadAll
onStatus
```

- 0.74 import result 新增：

```text
extraction
```

- 验证通过时，import details 内渲染 extraction actions。
- 验证失败、文件拒绝、读取失败或 verifier 异常时，不渲染 extraction download actions。
- 新增 machine-readable attributes：

```text
data-bundle-extraction-status
data-bundle-extraction-artifact-count
data-bundle-extraction-total-bytes
data-bundle-extraction-action
data-bundle-extraction-artifact-kind
data-bundle-extraction-artifact-filename
data-bundle-extraction-artifact-bytes
data-bundle-extraction-artifact-checksum
```

- package version 更新为 `0.75.0`。
- Runtime label 更新为 `runtime 0.75`。

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
- [ ] Mission diagnostics policy manifest validation artifact bundle verified extraction archive workflow

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

## Extraction API

从外部 bundle text 验证并提取：

```ts
import {
  extractRuntimeNavMissionDiagnosticsManifestHudValidationArtifactsFromBundleText,
} from "./large/NavMissionDiagnosticsManifestHudValidationArtifactBundleExtraction";

const extraction =
  await extractRuntimeNavMissionDiagnosticsManifestHudValidationArtifactsFromBundleText(
    bundleText,
  );

if (extraction.status === "extracted") {
  console.log(extraction.artifacts);
}
```

成功结果：

```ts
{
  status: "extracted",
  verification: {
    valid: true,
    issues: [],
    document: bundleDocument,
  },
  bundleStatus: "passed",
  artifactCount: 3,
  totalBytes: 1074,
  artifacts: [
    {
      kind: "validation-report-text",
      filename: "mission-package-0.diagnostics-policy.validation-report.txt",
      mimeType: "text/plain;charset=utf-8",
      bytes: 256,
      checksumHex: "...",
      text: "...",
    },
    {
      kind: "validation-report-json",
      filename: "mission-package-0.diagnostics-policy.validation-report.json",
      mimeType: "application/json;charset=utf-8",
      bytes: 684,
      checksumHex: "...",
      text: "...",
    },
    {
      kind: "validation-report-json-sha256",
      filename: "mission-package-0.diagnostics-policy.validation-report.json.sha256",
      mimeType: "text/plain;charset=utf-8",
      bytes: 134,
      checksumHex: "...",
      text: "...",
    },
  ],
  error: null,
}
```

验证失败时：

```ts
{
  status: "verification-failed",
  artifactCount: 0,
  totalBytes: 0,
  artifacts: [],
  verification: {
    valid: false,
    issues: [
      {
        code: "artifact-checksum-mismatch",
        path: "$.artifacts[1].checksum.hex",
        message: "...",
      },
    ],
  },
}
```

## Import result integration

0.75 的 file import result：

```ts
{
  status: "verified",
  file: {
    filename: "mission-package-0.diagnostics-policy.validation-artifacts.bundle.json",
    mimeType: "application/json",
    bytes: 3480,
  },
  textBytes: 3480,
  verification: verifiedResult,
  extraction: {
    status: "extracted",
    artifactCount: 3,
    totalBytes: 1074,
    artifacts: [textReport, jsonReport, jsonChecksum],
  },
  error: null,
}
```

Import control callbacks：

```ts
const control =
  createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportControl({
    onImport: (result) => {
      console.log(result.status);
    },
    onExtract: (extraction, result) => {
      console.log(result.file.filename, extraction.artifactCount);
    },
    onArtifactDownload: (artifact) => {
      console.log(artifact.kind, artifact.filename);
    },
    onDownloadAll: (extraction) => {
      console.log(extraction.artifactCount);
    },
    onStatus: (message) => {
      manifestStatus.textContent = message;
    },
  });
```

## HUD integration

`createRuntimeNavMissionDiagnosticsManifestHudDownloadButton(options)` 继续按顺序挂载：

```text
manifest actions
  ├── Download manifest
  ├── ...
  ├── Manifest validation details
  ├── Copy validation JSON
  ├── Download validation JSON
  ├── Copy validation JSON checksum
  ├── Download validation JSON checksum
  ├── Download validation artifact bundle
  ├── Verify validation artifact bundle
  └── Import and verify validation artifact bundle
      └── verified result details
          ├── Download all verified artifacts
          ├── Download verified validation text report
          ├── Download verified validation JSON report
          └── Download verified validation JSON SHA-256
```

验证通过后的 import preview：

```text
mission-package-0...bundle.json · verified · passed · 3 artifacts · 3 artifacts ready · 3.4 KB
```

Status：

```text
Imported and verified validation artifact bundle ...; 3 artifacts are ready for extraction.
Downloaded verified artifact ...validation-report.json.
Downloaded 3 verified validation artifacts.
```

## 确定性与安全边界

- Extraction 不接受未验证的 raw bundle document。
- 外部 text 入口始终先调用完整 verifier。
- `verification.valid`、issues、typed document、artifact count、order、kind 和 byte size 必须全部满足要求。
- 提取时不执行 artifact text，不解析 artifact 内的 HTML、脚本或 URL。
- 下载内容是已验证 entry 的 exact text，不重新格式化 JSON、不改变换行符。
- 单项与批量下载均使用 entry 中已验证的 filename 与 MIME type。
- Object URL 在每次下载后立即释放。
- 失败 extraction 不创建 Blob、object URL、anchor 或下载动作。
- 当前版本仍保持 bundle descriptor + 独立 artifact 下载，不引入 ZIP 依赖。
- 下一项将把三个 verified artifacts 聚合为一个可传输的 archive artifact，同时保留确定性顺序与完整性 metadata。
