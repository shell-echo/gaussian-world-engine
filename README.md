# Splat World Engine — Mission Diagnostics Policy Shareable URL Export

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.54 在 0.53 的 Mission diagnostics policy apply / reload workflow 之上，给 Mission editor / debug HUD 增加 shareable URL export：editor 里当前选择的 preset 和 custom code overrides 可以导出成 URL 参数，方便复制、分享和复现 diagnostics policy。

```text
NavMissionDebugPanel
  └── Package diagnostics
      ├── Diagnostics preset <select>
      ├── known diagnostic code <select>
      ├── severity <select>
      ├── generated merged severityPolicy preview
      ├── Shareable URL
      │   ├── Copy URL
      │   └── Update address
      └── Apply + reload

Shareable policy URL
  ├── missionDiagnosticsPreset=<preset>
  └── missionDiagnosticSeverity=<code>:<severity>
```

## Runtime/Builder 0.54 能力

- 在 `src/large/NavMissionDebugPanel.ts` 新增 shareable URL export UI。
- 根据当前 editor selection 生成 URL：
  - 非 `default` preset 写入 `missionDiagnosticsPreset=<preset>`
  - custom overrides 写入重复的 `missionDiagnosticSeverity=<code>:<severity>`
- 生成 URL 前会清理旧的 diagnostics policy 参数：
  - `missionDiagnosticsPreset`
  - `missionDiagnosticSeverity`
  - `missionDiagnosticsStrict`
  - `missionDiagnosticsNoInfo`
- 支持 `Copy URL`：把当前 policy URL 复制到剪贴板。
- 支持 `Update address`：用当前 policy URL 更新浏览器地址栏，方便继续复制或刷新复现。
- share URL 不写入 manifest / package authoring 文件，只编码当前 editor policy。
- package version 更新为 `0.54.0`。
- Runtime label 更新为 `runtime 0.54`。

## Checklist

- [x] Mission diagnostics policy editor presets
- [x] Mission diagnostics editor preset picker UI
- [x] Mission diagnostics policy editor custom overrides UI
- [x] Mission diagnostics policy editor apply / reload workflow
- [x] Mission diagnostics policy editor shareable URL export
- [ ] Mission diagnostics policy manifest export scaffold

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

使用 quiet preset：

```text
http://localhost:5173?world=/worlds/large-demo/world.json&missionDebug=1&missionDiagnosticsPreset=quiet
```

使用 gameplay-strict preset：

```text
http://localhost:5173?world=/worlds/large-demo/world.json&missionDebug=1&missionDiagnosticsPreset=gameplay-strict
```

基于 preset 继续通过 URL 覆盖某个 diagnostic code：

```text
http://localhost:5173?world=/worlds/large-demo/world.json&missionDebug=1&missionDiagnosticsPreset=gameplay-strict&missionDiagnosticSeverity=gameplay_source.missing_trigger:warning
```

查看完整 diagnostics report：

```js
window.splatWorld.missionPackages
```

验证：

```bash
npm run typecheck
npm run build
npm run preview
```

## Shareable URL 行为

Policy editor 生成的 selection 结构：

```ts
export interface RuntimeNavMissionDiagnosticsPolicyEditorSelection {
  preset: RuntimeNavMissionDiagnosticsPolicyEditorPresetSelection;
  overrides: Partial<Record<string, RuntimeNavMissionPackageDiagnosticSeverity>>;
  policy: RuntimeNavMissionDiagnosticsSeverityPolicy | null;
}
```

Shareable URL export 使用 selection 的 `preset.id` 和 `overrides` 生成 URL 参数：

```text
missionDiagnosticsPreset=gameplay-strict
missionDiagnosticSeverity=gameplay_source.missing_trigger:warning
```

例如 editor 中选择 `gameplay-strict`，并把 `gameplay_source.missing_trigger` 覆盖回 `warning`，会生成类似：

```text
http://localhost:5173?world=/worlds/large-demo/world.json&missionDebug=1&missionDiagnosticsPreset=gameplay-strict&missionDiagnosticSeverity=gameplay_source.missing_trigger%3Awarning
```

`Copy URL` 会把这个链接写入 clipboard；`Update address` 会用 `history.replaceState` 更新地址栏。刷新页面后，loader 会重新按 URL policy 解析顺序加载 diagnostics policy。

## Apply / reload 行为

点击 `Apply + reload` 后，HUD 会把当前 selection 传给 bootstrap：

```ts
onDiagnosticsPolicyApply: (selection) => installMissionPackages(navApi, manifest, selection.policy)
```

bootstrap 会重新执行：

```ts
loadRuntimeNavMissionPackages({
  nav: navApi,
  packages,
  severityPolicy: selection.policy,
  gameplaySources,
  fetcher: nativeFetch
});
```

reload 成功后会回填 report：

```ts
missionDebugPanel?.setMissionPackages(report);
window.splatWorld.missionPackages = report;
```

## Policy editor 行为

picker 从内置 preset 列表生成选项：

```ts
import { RUNTIME_NAV_MISSION_DIAGNOSTICS_POLICY_PRESETS } from "./large/NavMissionDiagnosticsPolicyPresets";

for (const preset of RUNTIME_NAV_MISSION_DIAGNOSTICS_POLICY_PRESETS) {
  console.log(preset.id, preset.label, preset.description);
}
```

custom override code 列表来自 known-code registry：

```ts
import { RUNTIME_NAV_MISSION_KNOWN_DIAGNOSTIC_CODE_ENTRIES } from "./large/NavMissionDiagnosticsCodeRegistry";

for (const entry of RUNTIME_NAV_MISSION_KNOWN_DIAGNOSTIC_CODE_ENTRIES) {
  console.log(entry.code, entry.defaultSeverity, entry.description);
}
```

如果选择 `gameplay-strict`，再把 `gameplay_source.missing_trigger` 改回 `warning`，editor preview 会生成类似：

```json
{
  "severityPolicy": {
    "codes": {
      "gameplay_source.missing_trigger": "warning",
      "gameplay_source.missing_interaction": "error",
      "gameplay_source.missing_source_id": "error",
      "gameplay_source.trigger_event_mismatch": "error",
      "gameplay_source.interaction_event_mismatch": "error"
    }
  }
}
```

点击 `Apply + reload` 后，新的 policy 会重新决定 diagnostics severity 和 package apply decision。例如 strict policy 把 warning 升级为 error 后，存在 warning 的 package 可能不再 apply。

## URL preset 合并顺序

Runtime URL 仍然支持：

```text
missionDiagnosticsPreset=quiet|strict|gameplay-strict|authoring-strict
```

URL 解析顺序：

1. preset 先生成 base policy
2. `missionDiagnosticSeverity=code:severity` 可以覆盖 preset 的 code
3. `missionDiagnosticsStrict=1` / `missionDiagnosticsNoInfo=1` 可以继续叠加

Shareable URL export 会优先使用 `missionDiagnosticsPreset` 和 `missionDiagnosticSeverity`，不主动导出 legacy shorthand `missionDiagnosticsStrict` / `missionDiagnosticsNoInfo`。

## Mission diagnostics HUD panel

HUD 会展示四个诊断指标：

```text
Packages · Loaded · Warn · Errors
```

诊断列表展示策略：

```text
1. 优先显示 warning / error
2. 如果没有 warning / error，显示 info summary
3. 最多显示 missionDiagnostics 指定数量，默认 6 条
```

常见 warning / error code：

```text
package.empty
package.summary
package.load_failed
mission.duplicate_id
objective.duplicate_id
objective.missing_mission
objective.missing_dependency
objective.missing_required_mission
objective.condition_missing_mission
objective.condition_missing_objective
runner_rule.duplicate_id
runner_rule.broad_event
runner_rule.disabled
runner_rule.missing_mission_action_target
runner_rule.missing_objective_action_target
gameplay_source.missing_trigger
gameplay_source.missing_interaction
gameplay_source.missing_source_id
gameplay_source.trigger_event_mismatch
gameplay_source.interaction_event_mismatch
```

## 已知边界

- 0.54 是 Mission diagnostics policy editor shareable URL export scaffold，不是完整 manifest authoring / save workflow。
- Shareable URL export 只导出 editor preset 和 custom overrides；不会写回 manifest、package authoring 文件或远程 registry。
- `default` preset 不会写入 `missionDiagnosticsPreset`，因此没有 custom overrides 时 URL 会回到内置 diagnostics policy。
- Copy URL 依赖浏览器 clipboard API；不可用时可以手动选择 preview URL。
- Apply / reload 重新执行 mission package loader；它不会自动把 editor policy 写回 URL，除非点击 `Update address`。
- 如果 stricter policy 让 package diagnostics 出现 error，该 package 不会 apply；已有 runtime mission state 不会被强制清空，避免一次错误编辑破坏当前调试现场。
- custom overrides 目前只覆盖 known-code registry 里的内置 diagnostic codes；插件自定义 code 暂时仍需要通过 JSON / URL / manifest 配置。
- presets 目前是内置静态列表，还没有从外部 manifest 或 editor plugin 注册自定义 preset。
- URL 未知 preset 会被忽略，并回退到普通 URL policy 解析。
- `missionDiagnosticsPreset=strict` 会把 warning 升级为 error，因此可能阻止 package apply。
- `missionDiagnosticsPreset=quiet` 会移除 info diagnostics，因此 info summary 不会出现在 report / HUD 中。
- registry 目前覆盖 Runtime 内置 diagnostics；插件或扩展 diagnostics 仍可以通过默认 `allowUnknownCodes=true` 使用自定义 code。
- large world manifest 顶层共享字段还没有独立 schema；当前 manifest 侧仍通过 `missionPackages[]` entry 做局部配置。
- package 目前只支持 JSON authoring document，不支持压缩包、签名、版本依赖解析或远程 registry。
- authoring document 仍只保存任务设计内容，不保存 player / agent / world object runtime state。
- package 可以包含 runner rules，但仍没有专门的可视化规则编辑器。
- HUD 只在 large world 且 NavMesh gameplay API 可用时安装。
