# Splat World Engine — Runtime Nav Gameplay API

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.28 在 0.27 的 `RuntimeNavMeshQuery` 上增加稳定的 gameplay API：大场景加载完成后，游戏逻辑可以通过 `window.splatWorld.navMesh` 查询当前位置所在 tile、最近 walkable tile 和 route。

```text
splat-navmesh
  ├── tiles
  ├── links
  ↓
RuntimeNavMeshQuery
  ↓
RuntimeNavGameplayApi
  ├── findTileContaining(point)
  ├── findNearestTile(point)
  └── findRoute(start, goal)
```

## Runtime/Builder 0.28 能力

- 新增 `src/large/NavGameplayApi.ts`
- 新增 `RuntimeNavGameplayApi`
- `LargeWorldBootstrap` 在 navmesh 加载成功后暴露：
  - `window.splatWorld.navMesh.findTileContaining(point)`
  - `window.splatWorld.navMesh.findNearestTile(point)`
  - `window.splatWorld.navMesh.findRoute(start, goal)`
- gameplay API 接受 `THREE.Vector3` 或 `[x, y, z]`
- tile 查询返回稳定 summary，不直接暴露内部 tile 引用
- route 查询复用 0.27 的 `RuntimeNavMeshQuery.findRoute`
- URL route debug 仍然保留：`navRoute` / `navFrom` / `navTo`
- HUD 显示 nav gameplay API 可用 tile 数：`nav-api <count>`
- package version 更新为 `0.28.0`
- Runtime label 更新为 `runtime 0.28`

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

## Gameplay API

大场景和 navmesh 加载完成后：

```js
window.splatWorld.navMesh.findTileContaining([0, 0, 0])
window.splatWorld.navMesh.findNearestTile([130, 0, 0])
window.splatWorld.navMesh.findRoute([0, 0, 0], [130, 0, 0])
```

`findTileContaining` / `findNearestTile` 返回：

```json
{
  "tileId": "corridor-000",
  "walkable": true,
  "layer": "ground",
  "bounds": { "min": [-18, -0.05, -6], "max": [18, 0.1, 6] }
}
```

`findRoute` 返回 0.27 的 `NavRouteResult`：

```json
{
  "status": "success",
  "startTileId": "corridor-000",
  "goalTileId": "corridor-003",
  "tileIds": ["corridor-000", "corridor-001", "corridor-002", "corridor-003"],
  "points": [[0, 0, 0], [20, 0.025, 0], [60, 0.025, 0], [100, 0.025, 0], [130, 0, 0]],
  "distance": 130
}
```

## URL route debug

0.27 的 URL debug 仍然可用：

```text
http://localhost:5173?world=/worlds/large-demo/world.json&navRoute=1
http://localhost:5173?world=/worlds/large-demo/world.json&navFrom=-10,0,0&navTo=130,0,0
```

## 已知边界

- 0.28 只提供 gameplay 调用入口，不做 NPC movement controller。
- 当前 API 仍基于 tile/link route，不是完整 Recast/Detour polygon corridor。
- 暂未提供事件总线或 ECS system 注入点。
- 后续可以在这个 API 之上接 NPC agent、任务导航、交互提示和点击寻路。

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
- [ ] NPC agent movement controller scaffold

## 依赖与许可证

- Spark：MIT
- Three.js：MIT
- Rapier：Apache-2.0

项目本身使用 MIT License。导入场景、GLB、音频、训练模型与数据集仍需分别确认授权。
