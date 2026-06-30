# Splat World Engine — Nav Mission State Persistence

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.34 在 0.33 的 mission hook scaffold 之上新增轻量 mission state persistence scaffold：任务可以被创建、激活、完成、失败、重置，并导出为可 JSON 序列化的 save payload，再在下次进入 Runtime 时 restore。

```text
RuntimeNavMissionHooks
  ├── addHook(hook)
  ├── removeHook(id)
  ├── clearHooks()
  └── snapshot()

RuntimeNavMissionState
  ├── createMission(draft)
  ├── updateMission(id, patch)
  ├── completeMission(id)
  ├── failMission(id)
  ├── snapshot()
  ├── exportState()
  └── restoreState(save)
```

## Runtime/Builder 0.34 能力

- 新增 `src/large/NavMissionState.ts`
- 新增 `RuntimeNavMissionState`
- mission state 支持：
  - `inactive`
  - `active`
  - `completed`
  - `failed`
- mission record 包含：
  - `id`
  - `status`
  - `progress`
  - `data`
  - `updatedAt`
  - `completedAt`
  - `failedAt`
- 支持 JSON save/restore scaffold：
  - `exportState()`
  - `restoreState(save)`
- `RuntimeNavGameplayApi` 新增：
  - `missionState`
  - `createMission(draft)`
  - `upsertMission(draft)`
  - `getMission(id)`
  - `updateMission(id, patch)`
  - `activateMission(id)`
  - `completeMission(id)`
  - `failMission(id)`
  - `resetMission(id)`
  - `removeMission(id)`
  - `clearMissions()`
  - `snapshotMissionState()`
  - `exportMissionState()`
  - `restoreMissionState(save, options)`
- package version 更新为 `0.34.0`
- Runtime label 更新为 `runtime 0.34`

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

返回示例：

```json
{
  "schemaVersion": 1,
  "count": 1,
  "inactive": 0,
  "active": 0,
  "completed": 1,
  "failed": 0,
  "missions": [
    {
      "id": "quest-arrive-home",
      "status": "completed",
      "progress": 1,
      "data": {
        "title": "走到安全屋",
        "targetAgentId": "npc-001"
      },
      "updatedAt": 1790000000000,
      "completedAt": 1790000000000,
      "failedAt": null
    }
  ]
}
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

合并式恢复：

```js
window.splatWorld.navMesh.restoreMissionState(save, { merge: true })
```

## 已知边界

- 0.34 仍然只是 mission state persistence scaffold，不包含完整任务图、任务依赖、任务编辑器 UI 或自动 localStorage 策略。
- hook 在当前 Runtime 生命周期内有效，刷新页面后需要重新注册。
- save payload 只保存任务状态，不保存 hook 回调、agent 实例、玩家位置或世界对象状态。
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
- [ ] Mission graph / objective dependency scaffold

## 依赖与许可证

- Spark：MIT
- Three.js：MIT
- Rapier：Apache-2.0

项目本身使用 MIT License。导入场景、GLB、音频、训练模型与数据集仍需分别确认授权。
