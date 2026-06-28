# Splat World Engine — Runtime NavMesh Path Query

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.27 在 `splat-navmesh` loader 之上新增轻量 path query scaffold：Runtime 会把 walkable nav tiles 和 portal links 转成 tile graph，并提供 `window.splatNavMesh.queryPath(start, goal)` 查询 tile path 与 portal waypoints。

```text
splat-navmesh
  ├── walkable tiles
  ├── portal links
  ↓
RuntimeNavMeshQuery
  ├── point → containing / nearest tile
  ├── Dijkstra tile graph query
  ├── portal waypoint extraction
  └── debug path line
```

## Runtime/Builder 0.27 能力

- 新增 `src/large/NavMeshQuery.ts`
- 新增 `RuntimeNavMeshQuery`
- 基于 walkable tile + links 构建 query graph
- 支持单向 / 双向 link
- 支持点不在 tile 内时 snap 到最近 walkable tile
- 查询结果包含：
  - `status`
  - `startTileId`
  - `goalTileId`
  - `tileIds`
  - `waypoints`
  - `distance`
- `LargeWorldBootstrap` 暴露 `window.splatNavMesh.queryPath(...)`
- 最近一次查询结果会用白色 debug line 显示
- HUD 显示 walkable query tile 数：`q <count>`
- package version 更新为 `0.27.0`
- Runtime label 更新为 `runtime 0.27`

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

## 查询路径

打开大场景后，可以在浏览器控制台执行：

```js
window.splatNavMesh.queryPath([0, 0, 0], [130, 0, 0])
```

返回示例：

```json
{
  "status": "ok",
  "startTileId": "corridor-000",
  "goalTileId": "corridor-003",
  "tileIds": ["corridor-000", "corridor-001", "corridor-002", "corridor-003"],
  "waypoints": [[0, 0, 0], [20, 0.025, 0], [60, 0.025, 0], [100, 0.025, 0], [130, 0, 0]],
  "distance": 130
}
```

清除 debug path：

```js
window.splatNavMesh.clearPathDebug()
```

## 已知边界

- 0.27 是 tile graph / portal waypoint scaffold，不是完整 Recast/Detour polygon pathfinding。
- 当前没有 funnel algorithm / path smoothing。
- 当前不会避开 tile 内部动态障碍。
- 后续可把 `RuntimeNavMeshQuery` 替换为真正的 poly navmesh query，同时保持 `queryPath` API 不变。

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
- [ ] Funnel smoothing / off-mesh links

## 依赖与许可证

- Spark：MIT
- Three.js：MIT
- Rapier：Apache-2.0

项目本身使用 MIT License。导入场景、GLB、音频、训练模型与数据集仍需分别确认授权。
