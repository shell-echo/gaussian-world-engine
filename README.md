# Splat World Engine — Mission Diagnostics Policy Presets

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.50 在 0.49 的 known-code registry 之上新增 Mission diagnostics policy editor presets：editor、URL 调试和 manifest authoring 可以复用同一组预设策略，而不是每次手写完整 `severityPolicy`。

```text
NavMissionDiagnosticsPolicyPresets
  ├── RUNTIME_NAV_MISSION_DIAGNOSTICS_POLICY_PRESETS
  ├── RUNTIME_NAV_MISSION_DIAGNOSTICS_POLICY_PRESET_IDS
  ├── isRuntimeNavMissionDiagnosticsPolicyPresetId(id)
  ├── getRuntimeNavMissionDiagnosticsPolicyPreset(id)
  └── createRuntimeNavMissionDiagnosticsPolicyFromPreset(id)

URL
  └── missionDiagnosticsPreset=quiet|strict|gameplay-strict|authoring-strict
```

## Runtime/Builder 0.50 能力

- 新增 `src/large/NavMissionDiagnosticsPolicyPresets.ts`
- 新增内置 presets：
  - `default`：使用内置 severity，不隐藏 info
  - `quiet`：隐藏 info diagnostics
  - `strict`：把所有 warning 当作 error
  - `gameplay-strict`：把 gameplay source 相关 warning 提升为 error
  - `authoring-strict`：把 package authoring 引用问题提升为 error，并隐藏 info
- 新增 helper：
  - `isRuntimeNavMissionDiagnosticsPolicyPresetId(id)`
  - `getRuntimeNavMissionDiagnosticsPolicyPreset(id)`
  - `createRuntimeNavMissionDiagnosticsPolicyFromPreset(id)`
  - `cloneRuntimeNavMissionDiagnosticsSeverityPolicy(policy)`
- Runtime URL 新增：
  - `missionDiagnosticsPreset=quiet`
  - `missionDiagnosticsPreset=strict`
  - `missionDiagnosticsPreset=gameplay-strict`
  - `missionDiagnosticsPreset=authoring-strict`
- URL 解析顺序：
  - preset 先生成 base policy
  - `missionDiagnosticSeverity=code:severity` 可以覆盖 preset 的 code
  - `missionDiagnosticsStrict=1` / `missionDiagnosticsNoInfo=1` 可以继续叠加
- package version 更新为 `0.50.0`
- Runtime label 更新为 `runtime 0.50`

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

## Preset 示例

列出全部 presets：

```ts
import { RUNTIME_NAV_MISSION_DIAGNOSTICS_POLICY_PRESETS } from "./large/NavMissionDiagnosticsPolicyPresets";

for (const preset of RUNTIME_NAV_MISSION_DIAGNOSTICS_POLICY_PRESETS) {
  console.log(preset.id, preset.label, preset.description);
}
```

从 preset 创建 policy：

```ts
const policy = createRuntimeNavMissionDiagnosticsPolicyFromPreset("gameplay-strict");
```

查找单个 preset：

```ts
const preset = getRuntimeNavMissionDiagnosticsPolicyPreset("authoring-strict");
```

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

- 0.50 是 policy preset scaffold，不是完整可视化 policy editor UI。
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
- event buffer 只按条数限制，不按内存大小限制。
- 仍然没有局部避障、动态障碍或 agent-agent avoidance。
- agent 仍沿 route points 直线移动，没有 funnel smoothing。

## 下一阶段

- [x] `.splatworld` 世界包
- [x] Web Worker 代理生成
- [x] QEM Mesh Simplification
- [x] Compound Convex Decomposition
- [x] Large Gaussian Tile Streaming Runtime
- [x] Tile Spatial Index + LOD Hysteresis
- [x] Outdoor Capture Builder Contract
- [x] `swe-builder` CLI scaffold
- [x] Builder frame extraction adapter
- [x] Builder chunk job manifests for external trainers
- [x] Pose solver adapter contract
- [x] COLMAP adapter runner
- [x] COLMAP model-to-pose-result converter
- [x] Large Tile LOD cross-fade
- [x] Seam / exposure optimizer scaffold
- [x] Apply exposure plan in Runtime
- [x] NavMesh / 大场景碰撞规划 scaffold
- [x] Runtime NavMesh loader
- [x] Runtime collision tile streaming
- [x] Heightfield / mesh collision artifacts scaffold
- [x] Collider file cache / LRU
- [x] Recast/Detour-style runtime path query scaffold
- [x] Route query API for gameplay systems
- [x] NPC agent movement controller scaffold
- [x] Agent debug visualizer / click-to-move demo
- [x] Agent registry / automatic engine-loop integration
- [x] Agent events / arrival callbacks
- [x] Agent event buffer limits / mission hook scaffold
- [x] Mission state persistence scaffold
- [x] Mission graph / objective dependency scaffold
- [x] Mission runtime runner / auto-progress hooks
- [x] Mission editor panel / debug HUD scaffold
- [x] Gameplay trigger event bridge for mission runner
- [x] Mission authoring save format scaffold
- [x] Mission package loader / URL manifest hook
- [x] Mission package validation / diagnostics report
- [x] Mission diagnostics HUD panel
- [x] Mission package sourceId validation against world gameplay objects
- [x] Mission package gameplay event-name validation
- [x] Mission package diagnostics severity policy
- [x] Mission diagnostics policy URL / manifest hook
- [x] Mission diagnostics policy top-level shared defaults
- [x] Mission diagnostics policy authoring schema
- [x] Mission diagnostics known-code registry
- [x] Mission diagnostics policy editor presets
- [ ] Mission diagnostics editor preset picker UI

## 依赖与许可证

- Spark：MIT
- Three.js：MIT
- Rapier：Apache-2.0

项目本身使用 MIT License。导入场景、GLB、音频、训练模型与数据集仍需分别确认授权。
