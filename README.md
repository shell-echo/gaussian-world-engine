# Splat World Engine — Mission Diagnostics Policy Manifest Download Summary Preview

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.63 在 0.62 的 Mission diagnostics policy manifest HUD panel wiring 之上，为 `Download manifest` action 增加常驻 summary preview，让 author 在下载前即可确认输出文件名、目标、patch operation、JSON Patch 数量与 artifact 大小。

```text
Mission diagnostics manifest download summary preview
  ├── source manifest text
  ├── selected manifest target
  ├── current editor severityPolicy
  ├── authoring artifact summary
  │   ├── filename
  │   ├── target
  │   ├── operation
  │   ├── JSON Patch count
  │   └── formatted byte size
  └── HUD download button
      ├── visible summary preview
      ├── accessible label + tooltip
      ├── browser download
      └── success / failure status callback
```

## Runtime/Builder 0.63 能力

- 扩展 `src/large/NavMissionDiagnosticsManifestHudDownload.ts`。
- 新增 `formatRuntimeNavMissionDiagnosticsManifestHudDownloadSummary(summary)`：
  - 输出适合 HUD 展示的单行 summary。
  - 包含 `filename`、`target`、`operation`、JSON Patch 数量和格式化后的 artifact size。
- `createRuntimeNavMissionDiagnosticsManifestHudDownloadButton(options)` 现在会：
  - 创建原有 `Download manifest` action。
  - 在按钮内显示当前 artifact summary preview。
  - 将 summary 同步写入 button tooltip 和 accessible label。
  - source manifest 无法解析时显示 `Preview unavailable · <message>`。
  - 点击后仍使用当前 input 生成并下载完整 patched manifest artifact。
  - 下载成功或失败时继续通过 `onStatus` 更新 Mission HUD status。
- 继续支持：
  - top-level `severityPolicy`
  - `missionPackages[index].severityPolicy`
  - editor presets 与 custom overrides
  - apply / reload workflow
  - shareable URL export
  - manifest export / import workflow
  - package target picker
  - patch preview
  - patch copy / apply workflow
  - manifest save / authoring workflow
  - HUD download action 与 panel wiring
- package version 更新为 `0.63.0`。
- Runtime label 更新为 `runtime 0.63`。

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
- [ ] Mission diagnostics policy manifest authoring validation

## 运行 Runtime

```bash
npm install
npm run dev
```

大场景 click-to-move + Mission HUD 示例：

```text
http://localhost:5173?world=/worlds/large-demo/world.json&clickToMove=1&missionDebug=1
```

通过 URL 加载额外 mission package：

```text
http://localhost:5173?world=/worlds/large-demo/world.json&mission=/worlds/large-demo/mission-package.json&missionDebug=1
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

## Download summary preview

`createRuntimeNavMissionDiagnosticsManifestHudDownloadSummary(input)` 继续返回结构化 summary：

```ts
{
  filename,
  target,
  operation,
  jsonPatchCount,
  bytes,
}
```

0.63 新增格式化 helper：

```ts
const summary = createRuntimeNavMissionDiagnosticsManifestHudDownloadSummary({
  sourceManifestText,
  packageIndex,
  policy,
});

const preview = formatRuntimeNavMissionDiagnosticsManifestHudDownloadSummary(summary);
```

输出示例：

```text
mission-package.diagnostics-policy.manifest.json · missionPackages[0] · add · 1 JSON patch · 1.4 KB
```

Mission HUD 已经通过 0.62 的 panel wiring 使用 button factory，因此无需在 `NavMissionDebugPanel` 再维护一套 summary UI：

```ts
const downloadButton = createRuntimeNavMissionDiagnosticsManifestHudDownloadButton({
  sourceManifestText,
  packageIndex,
  policy: selection.policy,
  onArtifact: (artifact) => {
    console.info("Mission diagnostics manifest downloaded", artifact);
  },
  onStatus: (message) => {
    this.diagnosticsPolicyManifestMessage = message;
    this.renderDiagnosticsPolicyEditor();
  },
});
```

button factory 会自动把 summary preview 放在 action label 下方，并保持原有 click、artifact callback 和 status callback 行为。

## Preview failure behavior

source manifest JSON 无效时，summary creation 会失败。0.63 不会让 Mission HUD render cycle 抛出错误，而是在 button 内显示：

```text
Preview unavailable · <error message>
```

用户点击按钮后，原有 download action 仍会尝试生成 artifact，并通过 manifest status 区域显示：

```text
Download failed: <error message>
```

这使 preview failure 与 download failure 保持可见，同时为下一步完整 authoring validation workflow 保留清晰边界。

## 已知边界

- 下载是浏览器侧 authoring artifact，不会直接写回仓库、package authoring 文件或远程 registry。
- `Download manifest` 依赖浏览器 `Blob`、object URL 和 anchor download 行为。
- summary preview 在 button 创建时根据当前 render cycle 的 input 生成；manifest textarea change、target change 或 policy change 后会随 HUD rerender 更新。
- preview 当前提供 artifact metadata，不执行 schema-level manifest validation。
- 文件名使用 `*.diagnostics-policy.manifest.json`。
- authoring document 只保存任务设计内容，不保存 player / agent / world object runtime state。
