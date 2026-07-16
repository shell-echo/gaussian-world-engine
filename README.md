# Splat World Engine — Mission Diagnostics Policy Manifest Validation HUD Issue Details

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.65 在 0.64 的结构化 manifest authoring validation 之上，将全部 validation issues 接入 Mission HUD：author 不再只能看到 compact error count，而可以直接检查每条 error / warning 的 code、JSON path 与修复说明。

```text
Mission diagnostics manifest validation HUD details
  ├── structured validation result
  │   ├── valid
  │   ├── error count
  │   ├── warning count
  │   └── issues[]
  ├── HUD validation details
  │   ├── compact summary
  │   ├── error group
  │   ├── warning group
  │   └── per-issue code / path / message
  └── authoring actions
      ├── summary preview
      ├── JSON Patch generation
      └── manifest download
```

## Runtime/Builder 0.65 能力

- 新增 `src/large/NavMissionDiagnosticsManifestHudValidationDetails.ts`。
- 新增 `createRuntimeNavMissionDiagnosticsManifestHudValidationDetails(validation)`：
  - 返回语义化 `HTMLDetailsElement`。
  - 显示 validation passed、error count 与 warning count。
  - 按 severity 分组展示全部 issues。
  - 每条 issue 显示 `code`、`path` 和 `message`。
  - blocking error 存在时默认展开。
  - validation passed 或只有 warning 时默认折叠，保留 compact summary。
- `createRuntimeNavMissionDiagnosticsManifestHudDownloadButton(options)` 现在会：
  - 继续创建原有 `Download manifest` button。
  - 继续显示 artifact 与 compact validation summary。
  - 创建完整 validation details。
  - 在 button 进入 manifest actions DOM 后，将 details 作为全宽 sibling 挂载。
- 不改变现有 download button 的返回类型与 click API。
- 不在 `NavMissionDebugPanel` 内复制 validation rendering 逻辑。
- validation details 会随 manifest textarea change、target change 或 editor policy rerender 更新。
- package version 更新为 `0.65.0`。
- Runtime label 更新为 `runtime 0.65`。

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
- [ ] Mission diagnostics policy manifest validation issue copy workflow

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

## Validation details API

```ts
import { validateRuntimeNavMissionDiagnosticsManifestAuthoringInput } from "./large/NavMissionDiagnosticsManifestAuthoringValidation";
import { createRuntimeNavMissionDiagnosticsManifestHudValidationDetails } from "./large/NavMissionDiagnosticsManifestHudValidationDetails";

const validation = validateRuntimeNavMissionDiagnosticsManifestAuthoringInput({
  sourceManifestText,
  packageIndex,
  policy,
});

const details = createRuntimeNavMissionDiagnosticsManifestHudValidationDetails(validation);
container.append(details);
```

Validation passed 时：

```text
Manifest validation · passed
```

存在 warning 时：

```text
Manifest validation · 2 warnings
```

存在 blocking error 时，details 默认展开：

```text
Manifest validation · 1 error · 1 warning

ERROR
mission_packages.not_array
$.missionPackages
missionPackages must be an array.

WARNING
mission_package.url_missing
$.missionPackages[0].url
url is missing and will default to ./mission-package.json.
```

## HUD integration

`createRuntimeNavMissionDiagnosticsManifestHudDownloadButton(options)` 仍返回 `HTMLButtonElement`：

```ts
const downloadButton = createRuntimeNavMissionDiagnosticsManifestHudDownloadButton({
  sourceManifestText,
  packageIndex,
  policy,
  onArtifact,
  onStatus,
});
```

Button factory 在同一次 render cycle 中创建 validation details，并在 button 被加入 DOM 后将 details 追加到相同 actions 容器：

```text
manifest actions
  ├── Copy manifest
  ├── Copy patch
  ├── Copy patched manifest
  ├── Download manifest
  ├── Apply patch to textarea
  ├── Import policy
  ├── Import + apply
  └── Manifest validation details
```

Details 使用 `flex: 1 0 100%`，因此在 actions flex layout 中占据完整一行，不会嵌套到 download button 内。

## Issue presentation

每条 issue 保留 validator 产生的结构化字段：

```ts
{
  severity: "error" | "warning",
  code: string,
  path: string,
  message: string,
}
```

展示规则：

- errors 始终排在 warnings 前面。
- 同一 severity 内保持 validator 的原始 issue 顺序。
- error 使用 blocking visual treatment。
- warning 使用 normalization visual treatment。
- path 使用 monospace code 样式。
- 长 code、path 与 message 支持换行，不撑破 HUD 宽度。

## 已知边界

- 当前 details 提供 issue 阅读能力，不提供单条 issue 的复制按钮；issue copy workflow 是下一项 checklist。
- 当前 validation 聚焦 diagnostics policy authoring 所需的 manifest target 与 policy shape，不替代完整 large world manifest schema validation。
- validation details 在 panel render cycle 后挂载；被替换或已断开连接的 button 不会追加过期 details。
- warnings 不阻止 artifact generation。
- blocking errors 仍由 authoring validation gate 阻止 JSON Patch、patched manifest 与下载 artifact 创建。
- 下载是浏览器侧 authoring artifact，不会直接写回仓库、package authoring 文件或远程 registry。
- authoring document 只保存任务设计内容，不保存 player / agent / world object runtime state。
