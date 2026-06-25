# Splat World Engine — NavMesh / Collision Scaffold

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.22 补上离线 Builder 侧的 NavMesh / 大场景碰撞规划：`swe-builder plan-navigation` 会基于 `splatworld-large` 的 tile bounds 与 neighbors 输出导航网格计划、碰撞计划和导航报告占位。

```text
large-world/world.json
  ├── tiles
  ├── bounds
  ├── neighbors
  ↓
swe-builder plan-navigation
  ├── navigation/navmesh-plan.json
  ├── navigation/collision-plan.json
  └── navigation/navigation-report.json
```

## Runtime/Builder 0.22 能力

- 新增 `src/builder/NavigationPlanTypes.ts`
- 新增 `splat-navmesh-plan` v1
- 新增 `splat-collision-plan` v1
- 新增 `splat-navigation-report` v1
- 新增 `swe-builder plan-navigation <session.json>`
- 基于 tile bounds 生成每 tile navmesh tile plan
- 基于 tile neighbors 生成跨 tile nav links
- 基于 tile bounds 生成 conservative collision tile plan
- package version 更新为 `0.22.0`
- Runtime label 更新为 `runtime 0.22`

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

## Builder 链路

完整离线 Builder 骨架：

```bash
npm run builder -- init-capture ./capture/outdoor-loop --name "Outdoor Loop" --video video/outdoor-loop.mp4 --duration 900
npm run builder -- extract-frames ./capture/outdoor-loop/session.json
npm run builder -- plan-poses ./capture/outdoor-loop/session.json
npm run builder -- write-colmap-runner ./capture/outdoor-loop/session.json
npm run builder -- convert-colmap-poses ./capture/outdoor-loop/session.json
npm run builder -- plan-chunks ./capture/outdoor-loop/session.json
npm run builder -- write-training-jobs ./capture/outdoor-loop/session.json
npm run builder -- export-large-world ./capture/outdoor-loop/session.json
npm run builder -- plan-seams ./capture/outdoor-loop/session.json
npm run builder -- plan-navigation ./capture/outdoor-loop/session.json
```

`plan-navigation` 会写：

```text
navigation/navmesh-plan.json
navigation/collision-plan.json
navigation/navigation-report.json
```

如果 `large-world/world.json` 不存在，命令会先根据当前 chunk plan 生成一个大世界 manifest skeleton。

## NavMesh plan

`navmesh-plan.json` 包含：

- 每个 tile 的 bounds
- agent radius / height / slope / stepHeight
- 每 tile navmesh 输出路径
- 基于 neighbors 的 portal links
- overlap bounds hint

## Collision plan

`collision-plan.json` 当前生成 conservative box collision plan：

```json
{
  "tileId": "tile_0000",
  "colliderId": "collision:tile_0000",
  "type": "box",
  "output": "navigation/colliders/tile_0000.collider.json"
}
```

后续真实 builder 可以把这些 box plan 替换为 heightfield / mesh / compound collider 输出。

## 已知边界

- 0.22 只生成规划文件，不构建真实 navmesh。
- Runtime 尚未加载 `navigation/navmesh.json`。
- 当前 collision plan 是保守 bounds box，不是精确几何。

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
- [ ] Runtime NavMesh loader
- [ ] Runtime collision tile streaming

## 依赖与许可证

- Spark：MIT
- Three.js：MIT
- Rapier：Apache-2.0

项目本身使用 MIT License。导入场景、GLB、音频、训练模型与数据集仍需分别确认授权。
