# Splat World Engine — Mission Gameplay Event Validation

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.44 在 0.43 的 gameplay `sourceId` validation 之上新增 Mission package gameplay event-name validation：mission package 里的 gameplay runner rule 现在会继续检查 `event` 名是否和当前 world trigger / interactable collider 配置匹配。

```text
WorldManifest.colliders
  ├── behavior.mode = "trigger"
  │   ├── id        -> gameplay trigger sourceId
  │   └── event     -> gameplay trigger event name
  └── interactable
      ├── collider.id          -> gameplay interaction sourceId
      └── interactable.event   -> gameplay interaction event name

RuntimeNavMissionGameplaySourceRegistry
  ├── triggers[]
  ├── interactions[]
  ├── triggerEvents{sourceId:event}
  └── interactionEvents{sourceId:event}

RuntimeNavMissionPackageLoader
  ├── createRuntimeNavMissionGameplaySourceRegistry(colliders)
  ├── validateRuntimeNavMissionPackageDocument(document, url, { gameplaySources })
  └── loadRuntimeNavMissionPackages({ gameplaySources })
```

## Runtime/Builder 0.44 能力

- `RuntimeNavMissionGameplaySourceRegistry` 扩展为同时保存：
  - `triggers[]`
  - `interactions[]`
  - `triggerEvents`
  - `interactionEvents`
- `createRuntimeNavMissionGameplaySourceRegistry(colliders)` 会从 world colliders 提取：
  - trigger sourceId + `behavior.event`
  - interaction sourceId + `interactable.event`
- `validateRuntimeNavMissionPackageDocument(document, url, options)` 现在会继续校验 gameplay rule 的 `event` 名称
- 校验规则：
  - `kind: "trigger"` / `type: "trigger"`：`event` 必须匹配 trigger collider 的 `behavior.event`
  - `kind: "interaction"` / `type: "interaction"`：`event` 必须匹配 interactable collider 的 `interactable.event`
  - 未指定 kind 但 sourceId 同时存在于 trigger / interaction 时，会分别检查可匹配的 event
- 新增 diagnostics code：
  - `gameplay_source.trigger_event_mismatch`
  - `gameplay_source.interaction_event_mismatch`
- event mismatch 当前是 `warning`，不会阻止 package apply
- Mission HUD 的 `Package diagnostics` section 会直接显示这些 warning
- 完整 report 仍保留在：
  - `window.splatWorld.missionPackages`
- package version 更新为 `0.44.0`
- Runtime label 更新为 `runtime 0.44`

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

## Gameplay sourceId + event validation

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

如果 `sourceId` 存在，但 event name 不匹配，diagnostics 会输出：

```text
WARNING · gameplay_source.trigger_event_mismatch
Runner rule complete-enter-lobby-trigger listens for trigger event lobby:wrong, but world sourceId lobby-trigger emits lobby:enter.
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

- 0.44 仍然只是 gameplay event-name validation scaffold，不是完整 world gameplay authoring validator。
- 当前只检查 runner rule 中明确写出的 `event` 名称；没写 `event` 的 broad gameplay rule 不会做 event-name mismatch 诊断。
- event mismatch 目前是 warning，不会阻止 package apply。
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
- [ ] Mission package diagnostics severity policy

## 依赖与许可证

- Spark：MIT
- Three.js：MIT
- Rapier：Apache-2.0

项目本身使用 MIT License。导入场景、GLB、音频、训练模型与数据集仍需分别确认授权。
