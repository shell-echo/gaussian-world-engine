# Splat World Engine — Runtime Nav Agent Events

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.32 在 0.31 的 agent registry 上新增事件与回调：agent 到达、阻塞、状态变化、创建和移除都会产生 registry event，也可以在创建 agent 时绑定回调。

```text
RuntimeNavAgent
  ├── onStatusChange(change)
  ├── onArrive(snapshot)
  └── onBlocked(snapshot)

RuntimeNavAgentRegistry
  ├── subscribe(listener)
  ├── peekEvents()
  ├── drainEvents()
  └── clearEvents()
```

## Runtime/Builder 0.32 能力

- `RuntimeNavAgentOptions` 新增：
  - `onStatusChange(change)`
  - `onArrive(snapshot)`
  - `onBlocked(snapshot)`
- `RuntimeNavAgent` 在状态变化时触发回调
- `RuntimeNavAgentRegistry` 新增事件类型：
  - `created`
  - `removed`
  - `status-change`
  - `arrived`
  - `blocked`
- registry 新增：
  - `subscribe(listener)`
  - `peekEvents()`
  - `drainEvents()`
  - `clearEvents()`
- `RuntimeNavGameplayApi` 暴露：
  - `subscribeAgentEvents(listener)`
  - `peekAgentEvents()`
  - `drainAgentEvents()`
  - `clearAgentEvents()`
- agent registry snapshot 新增 `pendingEvents`
- HUD 显示 pending event 数：`agents <count> m<moving>/b<blocked>/e<events>`
- package version 更新为 `0.32.0`
- Runtime label 更新为 `runtime 0.32`

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

## Agent 回调

创建 agent 时可以直接传入回调：

```js
const agent = window.splatWorld.navMesh.createAgent({
  id: "npc-001",
  position: [0, 0, 0],
  onArrive: (snapshot) => {
    console.log("arrived", snapshot.id)
  },
  onBlocked: (snapshot) => {
    console.warn("blocked", snapshot.id)
  },
  onStatusChange: (change) => {
    console.log(change.agentId, change.previousStatus, "→", change.status)
  }
})

agent.setDestination([130, 0, 0])
```

## Registry 事件

订阅所有 agent 事件：

```js
const unsubscribe = window.splatWorld.navMesh.subscribeAgentEvents((event) => {
  console.log(event.type, event.agentId, event.status)
})
```

读取但不清空 pending events：

```js
window.splatWorld.navMesh.peekAgentEvents()
```

读取并清空 pending events：

```js
window.splatWorld.navMesh.drainAgentEvents()
```

手动清空：

```js
window.splatWorld.navMesh.clearAgentEvents()
```

事件对象示例：

```json
{
  "type": "arrived",
  "agentId": "npc-001",
  "status": "arrived",
  "snapshot": {
    "id": "npc-001",
    "status": "arrived",
    "position": [130, 0, 0],
    "destination": [130, 0, 0],
    "routeStatus": "success",
    "remainingDistance": 0
  }
}
```

## 已知边界

- 0.32 只提供事件、回调和 pending event queue，不做任务系统。
- 事件队列没有大小限制；后续可增加 ring buffer 或 max event count。
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
- [ ] Agent event buffer limits / mission hook scaffold

## 依赖与许可证

- Spark：MIT
- Three.js：MIT
- Rapier：Apache-2.0

项目本身使用 MIT License。导入场景、GLB、音频、训练模型与数据集仍需分别确认授权。
