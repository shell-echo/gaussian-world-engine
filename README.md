# Splat World Engine — Mission Diagnostics Editor Preset Picker

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.51 在 0.50 的 Mission diagnostics policy presets 之上，给 Mission editor / debug HUD 增加一个轻量 preset picker：editor 区域可以直接从内置 presets 选择策略，并生成对应的 `severityPolicy` scaffold，后续再继续扩展 custom overrides UI。

```text
NavMissionDebugPanel
  └── Package diagnostics
      ├── Diagnostics preset <select>
      ├── preset description
      └── generated severityPolicy preview

NavMissionDiagnosticsPolicyPresets
  ├── RUNTIME_NAV_MISSION_DIAGNOSTICS_POLICY_PRESETS
  ├── RUNTIME_NAV_MISSION_DIAGNOSTICS_POLICY_PRESET_IDS
  ├── isRuntimeNavMissionDiagnosticsPolicyPresetId(id)
  ├── getRuntimeNavMissionDiagnosticsPolicyPreset(id)
  └── createRuntimeNavMissionDiagnosticsPolicyFromPreset(id)
```

## Runtime/Builder 0.51 能力

- 在 `src/large/NavMissionDebugPanel.ts` 的 `Package diagnostics` 区域新增 Mission diagnostics editor preset picker UI。
- picker 使用 `RUNTIME_NAV_MISSION_DIAGNOSTICS_POLICY_PRESETS` 渲染选项。
- 支持内置 presets：
  - `default`：使用内置 severity，不隐藏 info
  - `quiet`：隐藏 info diagnostics
  - `strict`：把所有 warning 当作 error
  - `gameplay-strict`：把 gameplay source 相关 warning 提升为 error
  - `authoring-strict`：把 package authoring 引用问题提升为 error，并隐藏 info
- 选择 preset 后使用 `createRuntimeNavMissionDiagnosticsPolicyFromPreset(id)` 生成对应 policy。
- UI 保持 scaffold 简单：一个 `<select>`、说明文本、当前 preset description、生成后的 `severityPolicy` 预览。
- package version 更新为 `0.51.0`。
- Runtime label 更新为 `runtime 0.51`。

## Checklist

- [x] Mission diagnostics policy editor presets
- [x] Mission diagnostics editor preset picker UI
- [ ] Mission diagnostics policy editor custom overrides UI

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

打开 Mission diagnostics preset picker：

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

基于 preset 继续覆盖某个 diagnostic code：

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

## Preset picker 行为

picker 从内置 preset 列表生成选项：

```ts
import { RUNTIME_NAV_MISSION_DIAGNOSTICS_POLICY_PRESETS } from "./large/NavMissionDiagnosticsPolicyPresets";

for (const preset of RUNTIME_NAV_MISSION_DIAGNOSTICS_POLICY_PRESETS) {
  console.log(preset.id, preset.label, preset.description);
}
```

选择某个 preset 后生成 policy：

```ts
const policy = createRuntimeNavMissionDiagnosticsPolicyFromPreset("gameplay-strict");
```

`default` preset 会生成 `null` policy，表示使用 Runtime 内置 diagnostic severity：

```text
severityPolicy: <built-in defaults>
```

`gameplay-strict` 会生成类似：

```json
{
  "severityPolicy": {
    "codes": {
      "gameplay_source.missing_trigger": "error",
      "gameplay_source.missing_interaction": "error",
      "gameplay_source.missing_source_id": "error",
      "gameplay_source.trigger_event_mismatch": "error",
      "gameplay_source.interaction_event_mismatch": "error"
    }
  }
}
```

## URL preset 合并顺序

Runtime URL 仍然支持：

```text
missionDiagnosticsPreset=quiet|strict|gameplay-strict|authoring-strict
```

URL 解析顺序：

1. preset 先生成 base policy
2. `missionDiagnosticSeverity=code:severity` 可以覆盖 preset 的 code
3. `missionDiagnosticsStrict=1` / `missionDiagnosticsNoInfo=1` 可以继续叠加

## Known-code registry 示例

列出全部已知 code：

```ts
import { RUNTIME_NAV_MISSION_KNOWN_DIAGNOSTIC_CODE_ENTRIES } from "./large/NavMissionDiagnosticsCodeRegistry";

for (const entry of RUNTIME_NAV_MISSION_KNOWN_DIAGNOSTIC_CODE_ENTRIES) {
  console.log(entry.code, entry.defaultSeverity, entry.description);
}
```

严格解析 policy：

```ts
const policy = parseRuntimeNavMissionDiagnosticsSeverityPolicy(input, {
  allowUnknownCodes: false
});
```

## Shared defaults 合并示例

URL 作为 shared defaults：

```text
?missionDiagnosticsStrict=1&missionDiagnosticSeverity=gameplay_source.missing_trigger:error
```

如果某个 package entry 只想覆盖一个 code：

```json
{
  "missionPackages": [
    {
      "url": "./mission-extra.json",
      "merge": true,
      "severityPolicy": {
        "codes": {
          "gameplay_source.missing_trigger": "warning"
        }
      }
    }
  ]
}
```

最终这个 package 会继承 URL 的 `warningAsError`，同时把 `gameplay_source.missing_trigger` 从 URL default 的 `error` 覆盖回 `warning`。

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

- 0.51 是 Mission diagnostics editor preset picker scaffold，不是完整可视化 policy editor。
- picker 目前生成 preset policy 预览，不会热重载已经完成加载的 mission package diagnostics；实际 Runtime loader policy 仍通过 URL / manifest / loader options 生效。
- custom code override UI 还没有实现，下一步是 `Mission diagnostics policy editor custom overrides UI`。
- presets 目前是内置静态列表，还没有从外部 manifest 或 editor plugin 注册自定义 preset。
- URL 未知 preset 会被忽略，并回退到普通 URL policy 解析。
- `missionDiagnosticsPreset=strict` 会把 warning 升级为 error，因此可能阻止 package apply。
- `missionDiagnosticsPreset=quiet` 会移除 info diagnostics，因此 info summary 不会出现在 report / HUD 中。
- registry 目前覆盖 Runtime 内置 diagnostics；插件或扩展 diagnostics 仍可以通过默认 `allowUnknownCodes=true` 使用自定义 code。
- strict authoring 只校验 code 是否注册，不校验某个 code 是否适合被提升或降级。
- large world manifest 顶层共享字段还没有独立 schema；当前 manifest 侧仍通过 `missionPackages[]` entry 做局部配置。
- package 目前只支持 JSON authoring document，不支持压缩包、签名、版本依赖解析或远程 registry。
- authoring document 仍只保存任务设计内容，不保存 player / agent / world object runtime state。
- package 可以包含 runner rules，但仍没有专门的可视化规则编辑器。
- HUD 只在 large world 且 NavMesh gameplay API 可用时安装。
