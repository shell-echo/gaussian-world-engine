# Splat World Engine — Nav Mission Graph

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.35 在 0.34 的 mission state persistence scaffold 之上新增 mission graph / objective dependency scaffold：任务可以继续保存状态，objective 可以声明依赖其他 objective 或 mission 状态，并在 snapshot 时得到 resolved status 与 readyObjectiveIds。

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
```

## Runtime/Builder 0.35 能力

- 新增 `src/large/NavMissionGraph.ts`
- 新增 `RuntimeNavMissionGraph`
- objective 支持：
  - `locked`
  - `active`
  - `completed`
  - `failed`
- objective record 包含：
  - `id`
  - `missionId`
  - `title`
  - `description`
  - `status`
  - `autoActivate`
  - `dependsOn`
  - `requiredMissions`
  - `conditions`
  - `data`
  - `updatedAt`
  - `completedAt`
  - `failedAt`
- dependency resolver 支持：
  - objective 依赖 objective 完成
  - objective 依赖 mission 完成
  - condition 指定 objective 或 mission 的目标状态
  - 简单 cycle blocking 标记
- graph snapshot 新增：
  - `resolvedStatus`
  - `dependenciesSatisfied`
  - `blockedBy`
  - `readyObjectiveIds`
- 支持 graph JSON export/restore：
  - `exportGraph()`
  - `restoreGraph(graph)`
- `RuntimeNavGameplayApi` 新增：
  - `missionGraph`
  - `createObjective(draft)`
  - `upsertObjective(draft)`
  - `getObjective(id)`
  - `updateObjective(id, patch)`
  - `activateObjective(id)`
  - `completeObjective(id)`
  - `failObjective(id)`
  - `resetObjective(id)`
  - `setObjectiveData(id, key, value)`
  - `removeObjective(id)`
  - `clearObjectives()`
  - `snapshotMissionGraph()`
  - `exportMissionGraph()`
  - `restoreMissionGraph(graph, options)`
- package version 更新为 `0.35.0`
- Runtime label 更新为 `runtime 0.35`

## 运行 Runtime

```bash
npm install
npm run dev
```

大场景 click-to-move 示例：

```text
http://localhost:5173?world=/worlds/large-demo/world.json&clickToMove=1
```

验证：

```bash
npm run typecheck
npm run build
npm run preview
```

## Event buffer limit

默认最多保留最近 128 条 event。可以在运行时调整：

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

用 hook 推进任务状态：

```js
window.splatWorld.navMesh.addMissionHook({
  id: "complete-arrive-home",
  agentId: "npc-001",
  type: "arrived",
  once: true,
  onEvent: () => {
    window.splatWorld.navMesh.completeMission("quest-arrive-home")
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

初始 snapshot 中，`find-key` 会因为 `autoActivate` 默认开启而解析为 `active`，`open-door` 会被 `objective:find-key` 阻塞：

```js
window.splatWorld.navMesh.snapshotMissionGraph()
```

完成第一个 objective 后，第二个 objective 会进入 ready：

```js
window.splatWorld.navMesh.completeObjective("find-key")
window.splatWorld.navMesh.snapshotMissionGraph().readyObjectiveIds
// ["open-door"]
```

依赖 mission 状态：

```js
window.splatWorld.navMesh.createObjective({
  id: "bonus-room",
  title: "进入隐藏房间",
  requiredMissions: ["escape-house"]
})

window.splatWorld.navMesh.completeMission("escape-house")
window.splatWorld.navMesh.snapshotMissionGraph().readyObjectiveIds
// ["open-door", "bonus-room"]
```

也可以用 condition 指定目标状态：

```js
window.splatWorld.navMesh.createObjective({
  id: "retry-door",
  title: "门打不开时触发提示",
  conditions: [
    {
      kind: "objective",
      id: "open-door",
      status: "failed"
    }
  ]
})
```

导出 graph 定义：

```js
const graph = window.splatWorld.navMesh.exportMissionGraph()
localStorage.setItem("swe:mission-graph", JSON.stringify(graph))
```

恢复 graph 定义：

```js
const graph = localStorage.getItem("swe:mission-graph")
if (graph) window.splatWorld.navMesh.restoreMissionGraph(graph)
```

## 已知边界

- 0.35 仍然只是 mission graph / objective dependency scaffold，不包含任务编辑器 UI、任务脚本 DSL、自动奖励发放或自动 HUD 展示。
- graph save payload 保存 objective 定义和状态，不保存 hook 回调、agent 实例、玩家位置或世界对象状态。
- graph snapshot 会解析依赖，但不会自动改写 objective record；调用方可以根据 `readyObjectiveIds` 决定是否显式 `activateObjective()`。
- hook 在当前 Runtime 生命周期内有效，刷新页面后需要重新注册。
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
- [ ] Mission runtime runner / auto-progress hooks

## 依赖与许可证

- Spark：MIT
- Three.js：MIT
- Rapier：Apache-2.0

项目本身使用 MIT License。导入场景、GLB、音频、训练模型与数据集仍需分别确认授权。
