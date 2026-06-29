# Splat World Engine — Runtime NavMesh Route Query

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.27 在 `splat-navmesh` 的 tile/link 数据上增加轻量 route query scaffold：Runtime 可以从起点/终点找到最近 walkable tile，沿 tile links 搜索路线，并绘制调试路线线段。

```text
splat-navmesh
  ├── tiles
  ├── links
  ↓
RuntimeNavMeshQuery
  ├── nearest walkable tile
  ├── tile graph search
  ├── portal / tile-center route points
  └── debug route line
```

## Runtime/Builder 0.27 能力

- 新增 `src/large/NavMeshQuery.ts`
- 新增 `RuntimeNavMeshQuery`
- 支持 `findTileContaining(point)`
- 支持 `findNearestTile(point)`
- 支持 `findRoute(start, goal)`
- route 会使用 walkable tiles 和 `links`
- same-tile route 会直接连接起点/终点
- 跨 tile route 会经过 portal bounds center 或 tile center
- 新增 `createNavRouteDebugLine(result)`
- `LargeWorldBootstrap` 支持 URL 参数触发 route debug
- HUD 显示 route tile 数和距离
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

显示默认 nav route：

```text
http://localhost:5173?world=/worlds/large-demo/world.json&navRoute=1
```

指定起点和终点：

```text
http://localhost:5173?world=/worlds/large-demo/world.json&navFrom=-10,0,0&navTo=130,0,0
```

验证：

```bash
npm run typecheck
npm run build
npm run preview
```

## Route query 行为

`RuntimeNavMeshQuery` 当前是 tile/link 级别的 scaffold：

- 优先找包含 point 的 walkable tile
- 如果 point 不在任何 tile 内，使用最近 walkable tile
- 根据 `RuntimeNavMeshLink` 构建图
- `bidirectional` 缺省为 `true`
- route point 会使用 portal center；没有 portal 时使用目标 tile center
- 输出 `NavRouteResult.status / tileIds / points / distance`

## 已知边界

- 0.27 不是完整 Recast/Detour 多边形寻路。
- 当前路线粒度是 tile/link，不是 polygon corridor。
- 没有做 funnel smoothing / off-mesh link / dynamic obstacle。
- 后续可以把 `RuntimeNavMeshQuery` 的接口保留，底层替换成 Detour-style query。

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
- [ ] Route query API for gameplay systems

## 依赖与许可证

- Spark：MIT
- Three.js：MIT
- Rapier：Apache-2.0

项目本身使用 MIT License。导入场景、GLB、音频、训练模型与数据集仍需分别确认授权。
