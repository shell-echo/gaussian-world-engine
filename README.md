# Splat World Engine — Mission Diagnostics Policy Manifest Validation Report Download

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.67 在 0.66 的 validation issue copy workflow 之上，将同一份确定性纯文本 report 封装为浏览器可下载 artifact，使 author 能把校验结果保存到本地、附加到 issue / PR，或纳入外部审查记录。

```text
Mission diagnostics manifest validation report download
  ├── structured validation result
  │   ├── errors
  │   ├── warnings
  │   └── ordered issues
  ├── validation report artifact
  │   ├── filename
  │   ├── text/plain MIME type
  │   ├── report text
  │   ├── byte size
  │   └── issue counts
  └── HUD actions
      ├── Copy all issues
      ├── Download report
      └── per-issue Copy
```

## Runtime/Builder 0.67 能力

- 扩展 `src/large/NavMissionDiagnosticsManifestHudValidationDetails.ts`。
- 新增 `RuntimeNavMissionDiagnosticsManifestHudValidationReportArtifact`：
  - `filename`
  - `mimeType`
  - `text`
  - `bytes`
  - `issueCount`
  - `errors`
  - `warnings`
- 新增 `createRuntimeNavMissionDiagnosticsManifestHudValidationReportArtifact(validation, filename)`。
- 新增 `downloadRuntimeNavMissionDiagnosticsManifestHudValidationReportArtifact(artifact)`。
- 新增 `createRuntimeNavMissionDiagnosticsManifestHudValidationReportFilename(packageIndex)`。
- validation details 顶部新增 `Download report`：
  - 有 errors / warnings 时下载完整 issue report。
  - validation passed 时仍可下载明确的通过报告。
  - tooltip 显示文件名与格式化后的 byte size。
  - accessible label 包含目标文件名。
- 下载成功或失败继续通过现有 manifest `onStatus` 回调反馈。
- report 下载不依赖 manifest artifact authoring gate，因此 source JSON 无效时仍可导出 validation failure report。
- package version 更新为 `0.67.0`。
- Runtime label 更新为 `runtime 0.67`。

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
- [ ] Mission diagnostics policy manifest validation JSON report workflow

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

## Report artifact API

```ts
import {
  createRuntimeNavMissionDiagnosticsManifestHudValidationReportArtifact,
  downloadRuntimeNavMissionDiagnosticsManifestHudValidationReportArtifact,
} from "./large/NavMissionDiagnosticsManifestHudValidationDetails";

const artifact = createRuntimeNavMissionDiagnosticsManifestHudValidationReportArtifact(
  validation,
  "mission-package-0.diagnostics-policy.validation-report.txt",
);

downloadRuntimeNavMissionDiagnosticsManifestHudValidationReportArtifact(artifact);
```

Artifact 结构：

```ts
{
  filename: "mission-package-0.diagnostics-policy.validation-report.txt",
  mimeType: "text/plain;charset=utf-8",
  text: "Manifest validation · 1 error\n\n...\n",
  bytes: 148,
  issueCount: 1,
  errors: 1,
  warnings: 0,
}
```

Artifact text 始终以换行结束，便于命令行工具、日志系统和文本 diff 直接消费。

## 文件命名

Mission HUD 根据当前 target 生成稳定文件名。

顶层 `severityPolicy`：

```text
large-world-manifest.diagnostics-policy.validation-report.txt
```

Package target：

```text
mission-package-0.diagnostics-policy.validation-report.txt
mission-package-1.diagnostics-policy.validation-report.txt
```

独立调用 artifact factory 时若未传 filename，则使用：

```text
mission-diagnostics-policy-manifest.validation-report.txt
```

自定义 filename 会进行安全归一化，并自动补充 `.txt` 后缀。

## Report 内容

存在 issues 时：

```text
Manifest validation · 1 error · 1 warning

[ERROR] mission_packages.not_array
Path: $.missionPackages
missionPackages must be an array.

[WARNING] mission_package.url_missing
Path: $.missionPackages[0].url
url is missing and will default to ./mission-package.json.
```

Validation passed 时：

```text
Manifest validation · passed
```

Report 顺序与 copy workflow 保持一致：

- errors 排在 warnings 前面。
- 同一 severity 内保持 validator 的原始 issue 顺序。
- 每条 issue 包含 severity、code、JSON path 与 message。

## HUD download workflow

`createRuntimeNavMissionDiagnosticsManifestHudDownloadButton(options)` 会把 target-specific filename 传给 validation details：

```ts
const validationDetails = createRuntimeNavMissionDiagnosticsManifestHudValidationDetails(validation, {
  onStatus: options.onStatus,
  reportFilename: createRuntimeNavMissionDiagnosticsManifestHudValidationReportFilename(options.packageIndex),
});
```

下载成功时：

```text
Downloaded mission-package-0.diagnostics-policy.validation-report.txt with 2 validation issues.
```

通过报告下载成功时：

```text
Downloaded mission-package-0.diagnostics-policy.validation-report.txt with no validation issues.
```

下载失败时：

```text
Validation report download failed: <error message>
```

## 交互边界

- `Download report` 使用 `type="button"`，不会触发 manifest artifact download。
- Report download 使用浏览器 `Blob`、object URL 与 anchor download。
- Object URL 始终在下载触发后释放。
- Report 下载只读取 validation result，不修改 manifest textarea、selected target 或 editor policy。
- Blocking validation errors 仍会阻止 JSON Patch、patched manifest 与 manifest artifact 创建，但不会阻止 failure report 下载。
- 当前 report 是适合人工审阅的纯文本；结构化 JSON report 是下一项 checklist。
- 当前 validation 聚焦 diagnostics policy authoring 所需的 manifest target 与 policy shape，不替代完整 large world manifest schema validation。
- authoring document 只保存任务设计内容，不保存 player / agent / world object runtime state。
