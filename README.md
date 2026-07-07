# Splat World Engine — Mission Diagnostics Config Hooks

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.46 在 0.45 的 loader-level diagnostics severity policy 之上新增 Runtime URL / manifest 配置入口：不需要手写 loader option，也可以从 URL 参数或 mission package manifest entry 里控制 diagnostics severity policy。

```text
RuntimeNavMissionPackageLoader
  ├── loadRuntimeNavMissionPackages(options)
  ├── URL default severity policy
  └── per-package manifest severity policy

URL parameters
  ├── missionDiagnosticSeverity=code:severity
  ├── missionDiagnosticsStrict=1
  └── missionDiagnosticsNoInfo=1

missionPackages[] entry
  └── severityPolicy
      ├── codes{diagnosticCode:severity}
      ├── warningAsError
      └── hideInfo
```

## Runtime/Builder 0.46 能力

- `RuntimeNavMissionPackageReference` 新增：
  - `severityPolicy?: RuntimeNavMissionDiagnosticsSeverityPolicy | null`
- `normalizeRuntimeNavMissionPackageReferences(...)` 会保留 package entry 上的 `severityPolicy`
- `loadRuntimeNavMissionPackages(...)` 会读取 URL 默认 policy
- URL 默认 policy 会在没有显式 loader `severityPolicy` 时生效
- 单个 package entry 的 `severityPolicy` 优先级高于 URL 默认 policy
- 新增 URL 参数：
  - `missionDiagnosticSeverity=diagnostic.code:error`
  - `missionDiagnosticsStrict=1`
  - `missionDiagnosticsNoInfo=1`
- package version 更新为 `0.46.0`
- Runtime label 更新为 `runtime 0.46`

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

把某个 diagnostic code 提升为 error：

```text
http://localhost:5173?world=/worlds/large-demo/world.json&missionDebug=1&missionDiagnosticSeverity=gameplay_source.missing_trigger:error
```

严格 diagnostics：把所有 warning 视为 error：

```text
http://localhost:5173?world=/worlds/large-demo/world.json&missionDebug=1&missionDiagnosticsStrict=1
```

隐藏 info diagnostics：

```text
http://localhost:5173?world=/worlds/large-demo/world.json&missionDebug=1&missionDiagnosticsNoInfo=1
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

## Manifest severity policy hook

在 large world manifest 里挂多个 package，并给单个 package 配置 severity policy：

```json
{
  "missionPackages": [
    "./mission-base.json",
    {
      "url": "./mission-extra.json",
      "merge": true,
      "severityPolicy": {
        "codes": {
          "gameplay_source.missing_trigger": "error",
          "gameplay_source.trigger_event_mismatch": "warning"
        },
        "hideInfo": true
      }
    }
  ]
}
```

优先级：

```text
package entry severityPolicy > explicit loader severityPolicy > URL default severityPolicy > built-in severity
```

如果 policy 把某个 diagnostic 调整为 `error`，对应 package 会被视为 failed package，不会 apply 到 runtime mission graph。

## Severity policy API

仍然可以直接通过 loader API 传入 policy：

```ts
await loadRuntimeNavMissionPackages({
  nav,
  packages,
  gameplaySources,
  severityPolicy: {
    codes: {
      "gameplay_source.missing_trigger": "error"
    },
    warningAsError: true,
    hideInfo: true
  }
});
```

也可以单独处理 diagnostics：

```ts
const diagnostics = applyRuntimeNavMissionPackageDiagnosticsSeverityPolicy(rawDiagnostics, {
  hideInfo: true
});
```

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
package.load_failed
```

## 已知边界

- 0.46 是 diagnostics config hook scaffold，不是完整 policy authoring UI。
- manifest hook 目前落在 `missionPackages[]` entry 上，还没有 top-level shared policy merge。
- URL policy 是 Runtime 默认值；如果 package entry 自带 `severityPolicy`，会覆盖 URL 默认值。
- `missionDiagnosticsStrict=1` 会把 warning 升级为 error，因此可能阻止 package apply。
- `missionDiagnosticsNoInfo=1` 会移除 info diagnostics，因此 info summary 不会出现在 report / HUD 中。
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
- [ ] Mission diagnostics policy top-level shared defaults

## 依赖与许可证

- Spark：MIT
- Three.js：MIT
- Rapier：Apache-2.0

项目本身使用 MIT License。导入场景、GLB、音频、训练模型与数据集仍需分别确认授权。
