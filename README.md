# Splat World Engine — Gameplay Mission Bridge

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.38 在 0.37 的 Mission debug HUD 之上新增 Gameplay trigger event bridge for mission runner：世界里的 trigger / interactable gameplay event 现在可以直接驱动 mission runner rule，让任务系统不再只依赖 agent arrived / blocked 事件。

```text
RuntimeNavMissionState
  ├── createMission(draft)
  ├── completeMission(id)
  ├── exportState()
  └── restoreState(save)

RuntimeNavMissionGraph
  ├── createObjective(draft)
  ├── completeObjective(id)
  ├── snapshot(missionState)
  ├── exportGraph()
  └── restoreGraph(graph)

RuntimeNavMissionRunner
  ├── handleAgentEvent(event)
  ├── handleGameplayEvent(event)
  ├── run()
  └── snapshot()

RuntimeNavMissionDebugPanel
  ├── Refresh
  ├── Run
  └── Seed Demo
```

## Runtime/Builder 0.38 能力

- mission runner 新增 gameplay event 支持
- runner event 现在支持两类 source：
  - `agent`
  - `gameplay`
- gameplay event filter 支持：
  - `source: "gameplay"`
  - `type: "gameplay"`
  - `type: "trigger"`
  - `type: "interaction"`
  - `kind: "trigger" | "interaction"`
  - `sourceId`
  - `event`
- agent event filter 继续兼容：
  - `type: "arrived" | "blocked" | "created" | "removed" | "status-change"`
  - `agentId`
  - `status`
  - `previousStatus`
- `RuntimeNavGameplayApi` 新增：
  - `handleMissionRunnerGameplayEvent(event)`
- `LargeWorldBootstrap` 会包装 Engine `onGameplayEvent`：
  - 先保留原有 UI toast / status 逻辑
  - 再桥接到 mission runner
  - 最后刷新 Mission HUD
- Mission HUD 最近 event 列表现在能展示 agent event 和 gameplay event
- runner snapshot 新增：
  - `handledAgentEvents`
  - `handledGameplayEvents`
- package version 更新为 `0.38.0`
- Runtime label 更新为 `runtime 0.38`

## 运行 Runtime

```bash
npm install
npm run dev
```

大场景 click-to-move 示例：

```text
http://localhost:5173?world=/worlds/large-demo/world.json&clickToMove=1
```

打开 Mission HUD：

```text
http://localhost:5173?world=/worlds/large-demo/world.json&clickToMove=1&missionDebug=1
```

打开时默认折叠：

```text
http://localhost:5173?world=/worlds/large-demo/world.json&clickToMove=1&missionDebug=1&missionDebugCollapsed=1
```

调整最近 event 数量：

```text
http://localhost:5173?world=/worlds/large-demo/world.json&clickToMove=1&missionDebug=1&missionDebugEvents=16
```

验证：

```bash
npm run typecheck
npm run build
npm run preview
```

## Event buffer limit

默认最多保留最近 128 条 agent event。可以在运行时调整：

```js
window.splatWorld.navMesh.setAgentEventLimit(32)
```

查看状态：

```js
window.splatWorld.navMesh.snapshotAgents()
```

返回中会包含：

```json
{
  "pendingEvents": 12,
  "maxEvents": 32,
  "droppedEvents": 4
}
```

读取并清空 pending events：

```js
const events = window.splatWorld.navMesh.drainAgentEvents()
```

## Mission hook scaffold

监听某个 agent 到达：

```js
const removeHook = window.splatWorld.navMesh.addMissionHook({
  id: "quest-arrive-home",
  agentId: "npc-001",
  type: "arrived",
  once: true,
  onEvent: (event) => {
    console.log("mission progressed", event.agentId)
  }
})
```

监听所有 blocked 事件：

```js
window.splatWorld.navMesh.addMissionHook({
  id: "debug-blocked",
  type: "blocked",
  onEvent: (event) => {
    console.warn("blocked", event.agentId)
  }
})
```

查看 hooks：

```js
window.splatWorld.navMesh.snapshotMissionHooks()
```

移除 hook：

```js
removeHook()
// or
window.splatWorld.navMesh.removeMissionHook("quest-arrive-home")
```

## Mission state persistence scaffold

创建一个任务：

```js
window.splatWorld.navMesh.createMission({
  id: "quest-arrive-home",
  status: "active",
  progress: 0,
  data: {
    title: "走到安全屋",
    targetAgentId: "npc-001"
  }
})
```

查看任务状态：

```js
window.splatWorld.navMesh.snapshotMissionState()
```

更新任务自定义数据：

```js
window.splatWorld.navMesh.setMissionData("quest-arrive-home", "clueCount", 3)
```

导出并保存：

```js
const save = window.splatWorld.navMesh.exportMissionState()
localStorage.setItem("swe:mission-state", JSON.stringify(save))
```

恢复：

```js
const save = localStorage.getItem("swe:mission-state")
if (save) window.splatWorld.navMesh.restoreMissionState(save)
```

## Mission graph / objective dependency scaffold

创建一个 mission 和两个 objective：

```js
window.splatWorld.navMesh.createMission({
  id: "escape-house",
  status: "active",
  data: {
    title: "逃出房子"
  }
})

window.splatWorld.navMesh.createObjective({
  id: "find-key",
  missionId: "escape-house",
  title: "找到钥匙"
})

window.splatWorld.navMesh.createObjective({
  id: "open-door",
  missionId: "escape-house",
  title: "打开大门",
  dependsOn: ["find-key"]
})
```

完成第一个 objective 后，第二个 objective 会进入 ready：

```js
window.splatWorld.navMesh.completeObjective("find-key")
window.splatWorld.navMesh.snapshotMissionGraph().readyObjectiveIds
// ["open-door"]
```

## Mission runtime runner / auto-progress hooks

创建一个 objective，并让 debug agent 到达目标后自动完成它：

```js
window.splatWorld.navMesh.createObjective({
  id: "reach-safe-room",
  title: "走到安全屋"
})

window.splatWorld.navMesh.addMissionRunnerRule({
  id: "complete-safe-room-on-arrive",
  event: {
    source: "agent",
    type: "arrived",
    agentId: "debug-click-agent"
  },
  action: {
    kind: "objective",
    id: "reach-safe-room",
    status: "completed",
    data: {
      source: "agent-arrived"
    }
  },
  once: true
})
```

当 `debug-click-agent` 触发 `arrived` event 时，runner 会自动执行 rule，并把 `reach-safe-room` 标记为 completed。

查看 runner 状态：

```js
window.splatWorld.navMesh.snapshotMissionRunner()
```

手动运行一次 runner，用于激活当前已经 ready 的 objectives：

```js
window.splatWorld.navMesh.runMissionRunner()
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

现在可以用 gameplay event 自动推进任务：

```js
window.splatWorld.navMesh.createObjective({
  id: "enter-lobby",
  title: "进入大厅"
})

window.splatWorld.navMesh.addMissionRunnerRule({
  id: "complete-enter-lobby-trigger",
  event: {
    source: "gameplay",
    kind: "trigger",
    sourceId: "lobby-trigger",
    event: "lobby:enter"
  },
  action: {
    kind: "objective",
    id: "enter-lobby",
    status: "completed",
    data: {
      source: "gameplay-trigger"
    }
  },
  once: true
})
```

也可以监听交互事件：

```js
window.splatWorld.navMesh.addMissionRunnerRule({
  id: "complete-read-note",
  event: {
    source: "gameplay",
    kind: "interaction",
    sourceId: "note-001",
    event: "note:read"
  },
  action: {
    kind: "objective",
    id: "read-note",
    status: "completed"
  }
})
```

更宽松的 filter 也可以只按类型匹配：

```js
window.splatWorld.navMesh.addMissionRunnerRule({
  id: "fail-on-any-alarm-trigger",
  event: {
    source: "gameplay",
    type: "trigger",
    event: "alarm:enter"
  },
  action: {
    kind: "mission",
    id: "stealth-run",
    status: "failed"
  }
})
```

## Mission debug HUD scaffold

打开 HUD 后可以直接点 `Seed Demo`，它等价于：

```js
window.splatWorld.navMesh.upsertMission({
  id: "debug-mission",
  status: "active",
  data: {
    title: "Mission HUD Demo"
  }
})

window.splatWorld.navMesh.upsertObjective({
  id: "debug-arrive",
  missionId: "debug-mission",
  title: "Arrive with debug-click-agent or trigger bridge"
})

window.splatWorld.navMesh.upsertMissionRunnerRule({
  id: "debug-arrive-on-agent-arrived",
  event: {
    source: "agent",
    type: "arrived",
    agentId: "debug-click-agent"
  },
  action: {
    kind: "objective",
    id: "debug-arrive",
    status: "completed",
    data: {
      source: "mission-debug-panel"
    }
  },
  once: true
})
```

在 `clickToMove=1` 下点击场景，让 `debug-click-agent` 到达目标；HUD 会展示 agent event、runner fired 数、objective 状态变化。触发器和交互事件也会显示在同一个最近 event 列表里。

## 已知边界

- 0.38 仍然只是 gameplay trigger event bridge scaffold，不是完整任务脚本系统。
- gameplay bridge 目前只桥接 Engine `GameplayEvent`，不包含物品背包、奖励、对话、战斗等更高层 gameplay domain event。
- HUD 只在 large world 且 NavMesh gameplay API 可用时安装。
- HUD 目前只展示摘要、最近 event 和 objective 简表，不支持可视化拖拽编辑 graph。
- runner rule 仍不会持久化到 mission state / graph save payload；刷新页面后需要重新注册。
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
- [ ] Mission authoring save format scaffold

## 依赖与许可证

- Spark：MIT
- Three.js：MIT
- Rapier：Apache-2.0

项目本身使用 MIT License。导入场景、GLB、音频、训练模型与数据集仍需分别确认授权。
