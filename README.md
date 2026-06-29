# Splat World Engine — Click-to-Move Agent Demo

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.30 在 0.29 的 `RuntimeNavAgent` 上新增可交互 debug demo：启用 `clickToMove` 后，Runtime 会创建 agent marker、目标 marker、route line，并允许在 canvas 上左键点击设置 agent 目的地。

```text
RuntimeNavGameplayApi
  └── createAgent(options)
        ↓
RuntimeNavAgentDebugDemo
  ├── agent marker
  ├── target marker
  ├── route debug line
  ├── click → ground plane hit
  └── per-frame agent.update(deltaSeconds)
```

## Runtime/Builder 0.30 能力

- 新增 `src/large/NavAgentDebugDemo.ts`
- 新增 `RuntimeNavAgentDebugDemo`
- 通过 URL 参数启用 click-to-move：
  - `clickToMove=1`
  - `navAgentDemo=1`
  - `agentFrom=x,y,z`
  - `agentTo=x,y,z`
- demo 会创建：
  - agent marker
  - target marker
  - route debug line
- 左键点击 canvas 会把鼠标射线投到 `y=0` 地面平面，并调用 agent `setDestination()`
- Runtime 主循环会自动调用 `agent.update(deltaSeconds)`
- HUD 显示 agent 状态和 moving 时的剩余距离
- dispose 时会清理事件监听、marker、route line 和材质/geometry
- package version 更新为 `0.30.0`
- Runtime label 更新为 `runtime 0.30`

## 运行 Runtime

```bash
npm install
npm run dev
```

大场景 click-to-move 示例：

```text
http://localhost:5173?world=/worlds/large-demo/world.json&clickToMove=1
```

带初始点和目标：

```text
http://localhost:5173?world=/worlds/large-demo/world.json&clickToMove=1&agentFrom=0,0,0&agentTo=130,0,0
```

验证：

```bash
npm run typecheck
npm run build
npm run preview
```

## Click-to-move 行为

启用 `clickToMove` 后：

1. Runtime 创建一个绿色 agent marker。
2. 左键点击 canvas 时，Runtime 将鼠标射线投到 `y=0` 平面。
3. 点击点会成为黄色 target marker。
4. agent 使用 `window.splatWorld.navMesh.createAgent(...)` 创建的 controller 寻路。
5. 如果 route 成功，agent 沿 `NavRouteResult.points` 移动。
6. HUD 显示：

```text
agent moving 42.8m
```

route 失败时：

```text
agent blocked
```

## 仍然保留手动 API

0.29 的手动 API 仍可用：

```js
const agent = window.splatWorld.navMesh.createAgent({
  id: "npc-001",
  position: [0, 0, 0],
  speed: 3
})

agent.setDestination([130, 0, 0])
agent.update(deltaSeconds)
agent.snapshot()
```

## 已知边界

- 0.30 的点击目标目前投影到固定 `y=0` 平面，不是 mesh / depth / collider picking。
- 当前 demo 不处理 pointer-lock 状态下的点击。
- 当前 agent 仍沿 route points 直线移动，没有 funnel smoothing。
- 当前没有局部避障、动态障碍、动画状态机或多 agent registry。

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
- [ ] Agent registry / automatic engine-loop integration

## 依赖与许可证

- Spark：MIT
- Three.js：MIT
- Rapier：Apache-2.0

项目本身使用 MIT License。导入场景、GLB、音频、训练模型与数据集仍需分别确认授权。
