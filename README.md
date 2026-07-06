# Splat World Engine — Mission Diagnostics HUD

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.42 在 0.41 的 diagnostics report 之上新增 Mission diagnostics HUD panel：Mission HUD 现在会直接展示 package diagnostics 指标和诊断列表，不需要只依赖 console 查看 package 问题。

```text
RuntimeNavMissionPackageDiagnosticsReport
  ├── ok
  ├── packageCount
  ├── loadedPackages
  ├── warnings
  ├── errors
  └── diagnostics[]

RuntimeNavMissionDebugPanel
  ├── State
  ├── Graph
  ├── Runner
  ├── Package diagnostics
  ├── Recent mission events
  └── Objectives

LargeWorldBootstrap
  ├── window.splatWorld.missionPackages
  ├── missionDebug=1
  └── missionDiagnostics=6
```

## Runtime/Builder 0.42 能力

- Mission HUD 新增 `Package diagnostics` section
- diagnostics section 显示：
  - package count
  - loaded package count
  - warning count
  - error count
- diagnostics list 优先展示 warning / error
- 如果没有 warning / error，会展示 info summary
- 新增 `maxDiagnostics` HUD 配置
- URL 参数新增：
  - `missionDiagnostics=6`
- `LargeWorldBootstrap` 会把 `missionPackageReport` 传入 `RuntimeNavMissionDebugPanel`
- diagnostics rows 按 severity 增加基础样式：
  - error
  - warning
  - info
- `window.splatWorld.missionPackages` 仍保留完整 report，HUD 只做摘要展示
- package version 更新为 `0.42.0`
- Runtime label 更新为 `runtime 0.42`

## 运行 Runtime

```bash
npm install
npm run dev
```

大场景 click-to-move + Mission HUD 示例：

```text
http://localhost:5173?world=/worlds/large-demo/world.json&clickToMove=1&missionDebug=1
```

控制 HUD 展示的 diagnostics 条数：

```text
http://localhost:5173?world=/worlds/large-demo/world.json&missionDebug=1&missionDiagnostics=12
```

通过 URL 加载额外 mission package：

```text
http://localhost:5173?world=/worlds/large-demo/world.json&mission=/worlds/large-demo/mission-package.json&missionDebug=1
```

查看完整 diagnostics report：

```js
window.splatWorld.missionPackages
```

查看 warning / error：

```js
window.splatWorld.missionPackages.diagnostics.filter((item) => item.severity !== "info")
```

验证：

```bash
npm run typecheck
npm run build
npm run preview
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

示例 row：

```text
WARNING · objective.missing_mission
Objective intro-door references missing mission intro-mission.
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
package.load_failed
```

## Mission package manifest hook

在 large world manifest 里挂一个 package：

```json
{
  "format": "splatworld-large",
  "version": 1,
  "name": "Large Tile Streaming Demo",
  "navigation": "./navmesh.json",
  "missionPackage": "./mission-package.json"
}
```

挂多个 package：

```json
{
  "missionPackages": [
    "./mission-base.json",
    {
      "url": "./mission-extra.json",
      "merge": true
    }
  ]
}
```

一个 package 本质上就是 authoring document：

```json
{
  "schemaVersion": 1,
  "savedAt": 0,
  "metadata": {
    "id": "large-demo-mission-pack",
    "title": "Large Demo Mission Pack",
    "version": "0.1.0"
  },
  "missions": [
    {
      "id": "large-demo-mission",
      "status": "active",
      "progress": 0,
      "data": {
        "title": "Large Demo Mission"
      }
    }
  ],
  "objectives": [
    {
      "id": "large-demo-arrive",
      "missionId": "large-demo-mission",
      "title": "Move debug-click-agent to a destination"
    }
  ],
  "runnerRules": [
    {
      "id": "large-demo-arrive-on-agent-arrived",
      "event": {
        "source": "agent",
        "type": "arrived",
        "agentId": "debug-click-agent"
      },
      "action": {
        "kind": "objective",
        "id": "large-demo-arrive",
        "status": "completed"
      },
      "once": true,
      "enabled": true
    }
  ]
}
```

## Gameplay trigger / interaction bridge

世界对象的 trigger 和 interactable 会发出 `GameplayEvent`：

```ts
{
  sourceId: string,
  event: string,
  message: string,
  kind: "trigger" | "interaction"
}
```

mission package 里的 runner rule 可以直接监听这些事件：

```json
{
  "id": "complete-enter-lobby-trigger",
  "event": {
    "source": "gameplay",
    "kind": "trigger",
    "sourceId": "lobby-trigger",
    "event": "lobby:enter"
  },
  "action": {
    "kind": "objective",
    "id": "enter-lobby",
    "status": "completed"
  },
  "once": true,
  "enabled": true
}
```

## 已知边界

- 0.42 仍然只是 Mission diagnostics HUD panel scaffold，不是完整诊断工作台。
- HUD 只展示摘要和前 N 条诊断，完整 report 仍通过 `window.splatWorld.missionPackages` 查看。
- diagnostics 目前主要检查 authoring document 内部引用关系，不检查世界对象、trigger sourceId 是否真实存在。
- package 目前只支持 JSON authoring document，不支持压缩包、签名、版本依赖解析或远程 registry。
- 有 error 的 package 不会 apply；warning 不会阻止 apply。
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
- [ ] Mission package sourceId validation against world gameplay objects

## 依赖与许可证

- Spark：MIT
- Three.js：MIT
- Rapier：Apache-2.0

项目本身使用 MIT License。导入场景、GLB、音频、训练模型与数据集仍需分别确认授权。
