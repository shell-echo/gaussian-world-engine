# Splat World Engine — Runtime Nav Agent Registry

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.31 在 0.30 的 click-to-move demo 之下新增 agent registry：`window.splatWorld.navMesh.createAgent(...)` 创建的 agent 会被 registry 管理，Runtime 主循环会统一自动更新所有 agent。

```text
RuntimeNavGameplayApi
  ├── findRoute(start, goal)
  ├── createAgent(options)
  ├── getAgent(id)
  ├── removeAgent(id)
  ├── updateAgents(deltaSeconds)
  ├── snapshotAgents()
  └── agents: RuntimeNavAgentRegistry
        ├── createAgent(options)
        ├── getAgent(id)
        ├── removeAgent(id)
        ├── update(deltaSeconds)
        ├── snapshot()
        └── clear()
```

## Runtime/Builder 0.31 能力

- 新增 `src/large/NavAgentRegistry.ts`
- 新增 `RuntimeNavAgentRegistry`
- `RuntimeNavGameplayApi` 新增：
  - `agents`
  - `getAgent(id)`
  - `removeAgent(id)`
  - `updateAgents(deltaSeconds)`
  - `snapshotAgents()`
- `createAgent(options)` 现在会创建 registry-managed agent
- Runtime 主循环统一调用 `navGameplayApi.updateAgents(deltaSeconds)`
- click-to-move demo 不再自己推进 agent，只读取 registry 更新后的 snapshot
- dispose 时会从 registry 移除 debug agent，并在 runtime cleanup 时清空 registry
- HUD 显示 registry 汇总：`agents <count> m<moving>/b<blocked>`
- package version 更新为 `0.31.0`
- Runtime label 更新为 `runtime 0.31`

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

## Agent registry API

大场景和 navmesh 加载完成后：

```js
const agent = window.splatWorld.navMesh.createAgent({
  id: "npc-001",
  position: [0, 0, 0],
  speed: 3
})

agent.setDestination([130, 0, 0])
```

不需要手动 `agent.update(deltaSeconds)`；Runtime loop 会自动更新 registry 中的 agent。

查询：

```js
window.splatWorld.navMesh.getAgent("npc-001")
window.splatWorld.navMesh.snapshotAgents()
```

删除：

```js
window.splatWorld.navMesh.removeAgent("npc-001")
```

返回示例：

```json
{
  "count": 2,
  "moving": 1,
  "blocked": 0,
  "arrived": 1,
  "idle": 0,
  "agents": [
    {
      "id": "npc-001",
      "status": "moving",
      "position": [12.5, 0, 0],
      "destination": [130, 0, 0],
      "remainingDistance": 117.5
    }
  ]
}
```

## Click-to-move 行为变化

0.31 之后，click-to-move demo 的 debug agent 也会注册到 `RuntimeNavAgentRegistry`：

1. `RuntimeNavAgentDebugDemo` 创建 `debug-click-agent`。
2. agent 被加入 `window.splatWorld.navMesh.agents`。
3. Runtime loop 每帧统一调用 registry update。
4. demo 只负责 marker / target / route line / snapshot 展示。
5. demo dispose 时自动 `removeAgent("debug-click-agent")`。

## 已知边界

- 0.31 仍然没有局部避障、动态障碍或 agent-agent avoidance。
- registry 只负责生命周期和 update，不做调度优先级或分帧 budget。
- agent 仍沿 route points 直线移动，没有 funnel smoothing。
- 目前没有事件总线，调用方需要轮询 `snapshotAgents()`。

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
- [ ] Agent events / arrival callbacks

## 依赖与许可证

- Spark：MIT
- Three.js：MIT
- Rapier：Apache-2.0

项目本身使用 MIT License。导入场景、GLB、音频、训练模型与数据集仍需分别确认授权。
