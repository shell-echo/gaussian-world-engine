# Splat World Engine — Mission Diagnostics Policy Manifest Authoring Validation

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.64 在 0.63 的 manifest download summary preview 之上，新增结构化 Mission diagnostics policy manifest authoring validation：在生成 JSON Patch、patched manifest 或浏览器下载 artifact 前验证 source manifest、selected target 与 editor policy，避免静默覆盖结构异常的 authoring 数据。

```text
Mission diagnostics manifest authoring validation
  ├── source manifest JSON
  │   ├── valid JSON
  │   └── object root
  ├── selected target
  │   ├── packageIndex >= -1
  │   ├── missionPackages array
  │   └── object package entry
  ├── severityPolicy
  │   ├── known fields only
  │   ├── valid diagnostic severities
  │   └── boolean policy flags
  ├── validation result
  │   ├── blocking errors
  │   └── normalization warnings
  └── authoring action
      ├── validated summary preview
      ├── JSON Patch generation
      └── patched manifest download
```

## Runtime/Builder 0.64 能力

- 新增 `src/large/NavMissionDiagnosticsManifestAuthoringValidation.ts`。
- 新增 `validateRuntimeNavMissionDiagnosticsManifestAuthoringInput(input)`：
  - 返回 `valid`、`errors`、`warnings` 和结构化 `issues`。
  - 每个 issue 包含 `severity`、`code`、`path` 和 `message`。
- 新增 `assertRuntimeNavMissionDiagnosticsManifestAuthoringInput(input)`：
  - validation 存在 blocking error 时抛出可读错误。
  - 已接入 `createRuntimeNavMissionDiagnosticsManifestAuthoringArtifact`，因此 patch、summary 和 download 使用同一 validation gate。
- 新增 `formatRuntimeNavMissionDiagnosticsManifestAuthoringValidation(result)`：
  - 输出适合 HUD status / summary 的 compact validation 文本。
- authoring validation 会阻止：
  - 无效 JSON。
  - 非 object manifest root。
  - 非法 `packageIndex`。
  - 非 array `missionPackages`。
  - 非 object selected package entry。
  - 非 object、空对象或包含未知字段的 `severityPolicy`。
  - 非法 diagnostic severity。
  - 非 boolean `warningAsError` / `hideInfo`。
- authoring validation 会警告但允许安全归一化：
  - 缺失 `missionPackages`。
  - 缺失或 null selected package entry。
  - 缺失或无效 package `url`。
  - 缺失或无效 package `merge`。
- HUD download summary 现在同时显示 validation 状态。
- package version 更新为 `0.64.0`。
- Runtime label 更新为 `runtime 0.64`。

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
- [ ] Mission diagnostics policy manifest validation HUD issue details

## 运行 Runtime

```bash
npm install
npm run dev
```

大场景 click-to-move + Mission HUD 示例：

```text
http://localhost:5173?world=/worlds/large-demo/world.json&clickToMove=1&missionDebug=1
```

打开 Mission diagnostics policy editor：

```text
http://localhost:5173?world=/worlds/large-demo/world.json&missionDebug=1
```

验证：

```bash
npm run typecheck
npm run build
npm run preview
```

## Validation API

```ts
import {
  assertRuntimeNavMissionDiagnosticsManifestAuthoringInput,
  formatRuntimeNavMissionDiagnosticsManifestAuthoringValidation,
  validateRuntimeNavMissionDiagnosticsManifestAuthoringInput,
} from "./large/NavMissionDiagnosticsManifestAuthoringValidation";

const input = {
  sourceManifestText,
  packageIndex,
  policy,
};

const validation = validateRuntimeNavMissionDiagnosticsManifestAuthoringInput(input);
console.log(formatRuntimeNavMissionDiagnosticsManifestAuthoringValidation(validation));

assertRuntimeNavMissionDiagnosticsManifestAuthoringInput(input);
```

结构化 result：

```ts
{
  valid: false,
  errors: 1,
  warnings: 0,
  issues: [
    {
      severity: "error",
      code: "mission_packages.not_array",
      path: "$.missionPackages",
      message: "missionPackages must be an array.",
    },
  ],
}
```

## Error 与 warning 边界

Blocking error 表示继续 authoring 可能丢失或错误解释 source manifest 数据。例如：

```text
Validation failed · 1 error · mission_packages.not_array: missionPackages must be an array.
```

Warning 表示现有 authoring helper 可以安全创建或归一化缺失字段。例如：

```text
Validation passed · 2 warnings
```

Warnings 不阻止 artifact generation，但会被保留在 download summary 的 `validation` result 中。

## HUD download integration

`createRuntimeNavMissionDiagnosticsManifestHudDownloadSummary(input)` 现在返回：

```ts
{
  filename,
  target,
  operation,
  jsonPatchCount,
  bytes,
  validation,
}
```

有效输入的 summary 示例：

```text
mission-package.diagnostics-policy.manifest.json · missionPackages[0] · add · 1 JSON patch · 1.4 KB · Validation passed
```

无效输入不会创建 authoring artifact。HUD button preview 会显示 compact validation error；用户点击 download action 时，原有 manifest status 区域会显示：

```text
Download failed: Validation failed · <error count> · <first issue>
```

## 已知边界

- 当前 validation 聚焦 diagnostics policy authoring 所需的 manifest target 与 policy shape，不替代完整 large world manifest schema validation。
- 当前 HUD 只显示 compact validation summary；逐条 issue details 是下一项 checklist。
- Warnings 允许 authoring helper补充默认 package URL 与 merge flag。
- 下载是浏览器侧 authoring artifact，不会直接写回仓库、package authoring 文件或远程 registry。
- 文件名继续使用 `*.diagnostics-policy.manifest.json`。
- authoring document 只保存任务设计内容，不保存 player / agent / world object runtime state。
