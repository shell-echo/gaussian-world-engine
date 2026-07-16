# Splat World Engine — Mission Diagnostics Policy Manifest Validation Issue Copy Workflow

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.66 在 0.65 的 manifest validation HUD details 之上，为完整 validation report 和每条 validation issue 增加 clipboard workflow，方便 author 将结构化问题直接粘贴到 issue、PR、聊天或修复记录中。

```text
Mission diagnostics manifest validation issue copy
  ├── structured validation result
  │   ├── errors
  │   ├── warnings
  │   └── ordered issues
  ├── HUD validation details
  │   ├── Copy all issues
  │   └── per-issue Copy
  ├── clipboard payload
  │   ├── severity
  │   ├── code
  │   ├── JSON path
  │   └── message
  └── manifest status feedback
      ├── copy success
      └── clipboard failure
```

## Runtime/Builder 0.66 能力

- 扩展 `src/large/NavMissionDiagnosticsManifestHudValidationDetails.ts`。
- 新增 `formatRuntimeNavMissionDiagnosticsManifestHudValidationIssue(issue)`：
  - 生成单条 issue 的可粘贴纯文本。
  - 包含 severity、code、JSON path 与 message。
- 新增 `formatRuntimeNavMissionDiagnosticsManifestHudValidationIssues(validation)`：
  - 生成完整 validation report。
  - errors 排在 warnings 前面。
  - 同一 severity 内保持 validator 的原始顺序。
- validation details 在存在 issues 时新增 `Copy all issues`。
- 每条 issue 新增独立 `Copy` 按钮和 accessible label。
- Clipboard API 不可用或写入失败时不会静默成功。
- copy result 通过已有 `onStatus` 回调显示在 manifest status 区域。
- `createRuntimeNavMissionDiagnosticsManifestHudDownloadButton(options)` 将现有 `onStatus` 传入 validation details，不新增 `NavMissionDebugPanel` 状态字段。
- package version 更新为 `0.66.0`。
- Runtime label 更新为 `runtime 0.66`。

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
- [ ] Mission diagnostics policy manifest validation report download workflow

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

## Copy formatting API

单条 issue：

```ts
import { formatRuntimeNavMissionDiagnosticsManifestHudValidationIssue } from "./large/NavMissionDiagnosticsManifestHudValidationDetails";

const text = formatRuntimeNavMissionDiagnosticsManifestHudValidationIssue(issue);
```

输出：

```text
[ERROR] mission_packages.not_array
Path: $.missionPackages
missionPackages must be an array.
```

完整 report：

```ts
import { formatRuntimeNavMissionDiagnosticsManifestHudValidationIssues } from "./large/NavMissionDiagnosticsManifestHudValidationDetails";

const report = formatRuntimeNavMissionDiagnosticsManifestHudValidationIssues(validation);
```

输出示例：

```text
Manifest validation · 1 error · 1 warning

[ERROR] mission_packages.not_array
Path: $.missionPackages
missionPackages must be an array.

[WARNING] mission_package.url_missing
Path: $.missionPackages[0].url
url is missing and will default to ./mission-package.json.
```

## HUD copy workflow

Validation details 接受可选 status callback：

```ts
const details = createRuntimeNavMissionDiagnosticsManifestHudValidationDetails(validation, {
  onStatus: (message) => {
    manifestStatus.textContent = message;
  },
});
```

Mission HUD 中不需要额外 wiring。Download button factory 会复用已有 callback：

```ts
const validationDetails = createRuntimeNavMissionDiagnosticsManifestHudValidationDetails(validation, {
  onStatus: options.onStatus,
});
```

复制全部 issues 成功时：

```text
Copied 2 manifest validation issues.
```

复制单条 issue 成功时：

```text
Copied manifest validation issue mission_packages.not_array.
```

Clipboard API 不可用或写入失败时：

```text
Copy validation issue failed: <error message>
```

## Copy order 与交互规则

- `Copy all issues` 仅在 validation result 含有 issues 时显示。
- errors 始终排在 warnings 前面。
- 单条 `Copy` 只复制当前 issue，不附带其他 validation 内容。
- Copy button 使用 `type="button"`，不会触发 manifest download。
- 每条 Copy button 的 accessible label 包含 issue code 与 JSON path。
- copy 操作不修改 manifest textarea、selected target 或 editor policy。
- `onStatus` 触发 panel rerender 后，validation details 会根据当前输入重新创建。

## 已知边界

- Clipboard workflow 依赖安全上下文中的浏览器 Clipboard API。
- 当前提供纯文本复制，不生成独立 validation report 文件；report download workflow 是下一项 checklist。
- 当前 validation 聚焦 diagnostics policy authoring 所需的 manifest target 与 policy shape，不替代完整 large world manifest schema validation。
- warnings 不阻止 artifact generation。
- blocking errors 仍由 authoring validation gate 阻止 JSON Patch、patched manifest 与下载 artifact 创建。
- 下载是浏览器侧 authoring artifact，不会直接写回仓库、package authoring 文件或远程 registry。
- authoring document 只保存任务设计内容，不保存 player / agent / world object runtime state。
