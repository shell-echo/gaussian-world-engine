# Splat World Engine — Runtime Nav Agent Controller

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.29 在 0.28 的 `window.splatWorld.navMesh` gameplay API 上新增轻量 NPC agent movement controller：agent 可以设置目的地、沿 route points 逐帧移动，并输出状态快照。

```text
RuntimeNavGameplayApi
  ├── findTileContaining(point)
  ├── findNearestTile(point)
  ├── findRoute(start, goal)
  └── createAgent(options)
        ├── setDestination(goal)
        ├── update(deltaSeconds)
        ├── stop()
        └── snapshot()
```

## Runtime/Builder 0.29 能力

- 新增 `src/large/NavAgentController.ts`
- 新增 `RuntimeNavAgent`
- `RuntimeNavGameplayApi` 新增 `createAgent(options)`
- agent 支持：
  - `setDestination(goal)`
  - `update(deltaSeconds)`
  - `stop()`
  - `snapshot()`
  - `setPosition(point)`
  - `setSpeed(speed)`
  - `setArriveDistance(distance)`
- agent 可以绑定 `THREE.Object3D`，update 时自动同步 object position
- agent 状态包含：`idle` / `moving` / `arrived` / `blocked`
- route 失败时进入 `blocked`
- route 成功时沿 `NavRouteResult.points` 移动
- package version 更新为 `0.29.0`
- Runtime label 更新为 `runtime 0.29`

## 运行 Runtime

```bash
npm install
npm run dev
```

大场景示例：

```text
http://localhost:5173?world=/worlds/large-demo/world.json
```

验证：

```bash
npm run typecheck
npm run build
npm run preview
```

## 创建 agent

大场景和 navmesh 加载完成后：

```js
const agent = window.splatWorld.navMesh.createAgent({
  id: "npc-001",
  position: [0, 0, 0],
  speed: 3,
  arriveDistance: 0.25
})

agent.setDestination([130, 0, 0])
```

每帧更新：

```js
agent.update(deltaSeconds)
```

读取状态：

```js
agent.snapshot()
```

返回示例：

```json
{
  "id": "npc-001",
  "status": "moving",
  "position": [12.5, 0, 0],
  "velocity": [3, 0, 0],
  "destination": [130, 0, 0],
  "routeStatus": "success",
  "routeTileIds": ["corridor-000", "corridor-001", "corridor-002", "corridor-003"],
  "currentPointIndex": 1,
  "remainingDistance": 117.5
}
```

## 绑定 THREE.Object3D

```js
const npcObject = new THREE.Object3D()
scene.add(npcObject)

const agent = window.splatWorld.navMesh.createAgent({
  id: "npc-visual",
  object: npcObject,
  speed: 2.2
})

agent.setDestination([130, 0, 0])
agent.update(deltaSeconds)
```

## 已知边界

- 0.29 是 movement controller scaffold，不包含动画状态机。
- 当前 agent 沿 route point 直线移动，没有 funnel smoothing。
- 当前没有局部避障、队列、动态障碍或 agent-agent avoidance。
- 暂未内置到主循环；调用方需要自己在每帧执行 `agent.update(deltaSeconds)`。

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
- [ ] Agent debug visualizer / click-to-move demo

## 依赖与许可证

- Spark：MIT
- Three.js：MIT
- Rapier：Apache-2.0

项目本身使用 MIT License。导入场景、GLB、音频、训练模型与数据集仍需分别确认授权。
