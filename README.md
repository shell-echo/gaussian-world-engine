# Splat World Engine — Nav Mission Hooks

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.33 在 0.32 的 agent events 上补齐 event buffer 上限和 mission hook scaffold：事件队列默认只保留最近 128 条，任务系统可以用 hook 监听指定 agent 的 arrived / blocked / status-change 等事件。

```text
RuntimeNavAgentRegistry
  ├── maxEvents / droppedEvents
  ├── setMaxEvents(maxEvents)
  ├── peekEvents()
  └── drainEvents()

RuntimeNavMissionHooks
  ├── addHook(hook)
  ├── removeHook(id)
  ├── clearHooks()
  └── snapshot()
```

## Runtime/Builder 0.33 能力

- `RuntimeNavAgentRegistry` 新增 event buffer limit
- 默认最多保留最近 128 条 agent events
- 超过上限时丢弃最旧事件，并累计 `droppedEvents`
- `RuntimeNavAgentRegistrySnapshot` 新增：
  - `maxEvents`
  - `droppedEvents`
- registry 新增：
  - `setMaxEvents(maxEvents)`
  - `maxEvents`
  - `droppedEvents`
- 新增 `src/large/NavMissionHooks.ts`
- 新增 `RuntimeNavMissionHooks`
- mission hook 支持按：
  - `agentId`
  - `type`
  - `once`
  过滤 registry event
- `RuntimeNavGameplayApi` 新增：
  - `missions`
  - `setAgentEventLimit(maxEvents)`
  - `addMissionHook(hook)`
  - `removeMissionHook(id)`
  - `clearMissionHooks()`
  - `snapshotMissionHooks()`
- package version 更新为 `0.33.0`
- Runtime label 更新为 `runtime 0.33`

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

## 已知边界

- 0.33 只是 mission hook scaffold，不包含完整任务图、任务状态存储或保存/恢复。
- hook 在当前 Runtime 生命周期内有效，刷新页面后不会持久化。
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
- [ ] Mission state persistence scaffold

## 依赖与许可证

- Spark：MIT
- Three.js：MIT
- Rapier：Apache-2.0

项目本身使用 MIT License。导入场景、GLB、音频、训练模型与数据集仍需分别确认授权。
