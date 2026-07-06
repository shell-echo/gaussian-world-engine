# Splat World Engine — Mission Gameplay Source Validation

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.43 在 0.42 的 Mission diagnostics HUD 之上新增 Mission package sourceId validation against world gameplay objects：mission package 里的 gameplay runner rule 现在会根据当前 world 的 trigger / interactable collider 做 `sourceId` 校验。

```text
WorldManifest.colliders
  ├── behavior.mode = "trigger"      -> gameplay trigger sourceId
  └── interactable                   -> gameplay interaction sourceId

RuntimeNavMissionGameplaySourceRegistry
  ├── triggers[]
  └── interactions[]

RuntimeNavMissionPackageLoader
  ├── createRuntimeNavMissionGameplaySourceRegistry(colliders)
  ├── validateRuntimeNavMissionPackageDocument(document, url, { gameplaySources })
  └── loadRuntimeNavMissionPackages({ gameplaySources })

RuntimeNavMissionDebugPanel
  └── Package diagnostics
```

## Runtime/Builder 0.43 能力

- `NavMissionPackageLoader` 新增 `RuntimeNavMissionGameplaySourceRegistry`
- 新增 helper：
  - `createRuntimeNavMissionGameplaySourceRegistry(colliders)`
- `RuntimeNavMissionPackageValidationOptions` 新增：
  - `gameplaySources?: RuntimeNavMissionGameplaySourceRegistry | null`
- `RuntimeNavMissionPackageLoadOptions` 支持传入 `gameplaySources`
- `validateRuntimeNavMissionPackageDocument(document, url, options)` 会校验 gameplay rule 的 `sourceId`
- `LargeWorldBootstrap` 会从 `manifest.colliders` 自动生成 source registry 并传给 package loader
- 支持区分：
  - `kind: "trigger"` / `type: "trigger"` -> 必须存在 trigger collider
  - `kind: "interaction"` / `type: "interaction"` -> 必须存在 interactable collider
  - 未指定 kind 但写了 `sourceId` -> 必须存在 trigger 或 interactable 任意一种
- 新增 diagnostics code：
  - `gameplay_source.missing_trigger`
  - `gameplay_source.missing_interaction`
  - `gameplay_source.missing_source_id`
- sourceId 缺失目前是 `warning`，不会阻止 package apply
- Mission HUD 的 `Package diagnostics` section 会直接显示这些 warning
- 完整 report 仍保留在：
  - `window.splatWorld.missionPackages`
- package version 更新为 `0.43.0`
- Runtime label 更新为 `runtime 0.43`

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

## Gameplay sourceId validation

world 里的 trigger collider：

```json
{
  "id": "lobby-trigger",
  "type": "box",
  "size": [4, 2, 4],
  "behavior": {
    "mode": "trigger",
    "event": "lobby:enter",
    "message": "Entered lobby"
  }
}
```

world 里的 interactable collider：

```json
{
  "id": "note-001",
  "type": "box",
  "size": [0.4, 0.4, 0.4],
  "interactable": {
    "prompt": "Read note",
    "event": "note:read",
    "message": "Read the note"
  }
}
```

mission package 里的 runner rule 会被校验：

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

如果 `sourceId` 不存在于当前 world 的 gameplay objects 中，diagnostics 会输出：

```text
WARNING · gameplay_source.missing_trigger
Runner rule complete-enter-lobby-trigger references missing trigger sourceId lobby-trigger.
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

## 已知边界

- 0.43 仍然只是 sourceId validation scaffold，不是完整 world gameplay authoring validator。
- 当前只检查 `sourceId` 是否存在于 trigger / interactable collider，不检查事件名是否匹配 collider 的 `behavior.event` 或 `interactable.event`。
- sourceId 缺失目前是 warning，不会阻止 package apply。
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
- [ ] Mission package gameplay event-name validation

## 依赖与许可证

- Spark：MIT
- Three.js：MIT
- Rapier：Apache-2.0

项目本身使用 MIT License。导入场景、GLB、音频、训练模型与数据集仍需分别确认授权。
