# Splat World Engine — Runtime Collision Tile Streaming

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.24 把 0.22 的 `collision-plan.json` 接到浏览器 Runtime：`splatworld-large` 可以声明 `collisionPlan`，Runtime 会按 camera 距离动态启用/移除 tile collider。

```text
splatworld-large world.json
  ├── exposurePlan
  ├── navigation
  ├── collisionPlan
  ↓
Runtime bootstrap
  ├── load exposure plan
  ├── load navmesh manifest
  ├── load collision plan
  ├── stream gaussian tiles
  └── stream collision tiles
```

## Runtime/Builder 0.24 能力

- 新增 `src/large/CollisionPlanTypes.ts`
- 新增 `src/large/LargeCollisionTileManager.ts`
- `splatworld-large` 新增可选 `collisionPlan`
- Runtime 会加载并校验 `splat-collision-plan` v1
- collision plan 加载失败只 warning，不阻塞 Gaussian tile streaming
- Runtime 会根据 camera 与 tile bounds 的距离启用/移除 collider
- 目前以 conservative box collider 作为 Runtime scaffold
- HUD 显示 active/total collision tile 数量
- demo world 引用 `./collision-plan.json`
- 新增 `public/worlds/large-demo/collision-plan.json`
- package version 更新为 `0.24.0`
- Runtime label 更新为 `runtime 0.24`

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

## collisionPlan 配置

在 `splatworld-large` manifest 中添加：

```json
{
  "format": "splatworld-large",
  "version": 1,
  "collisionPlan": "./collision-plan.json"
}
```

`collision-plan.json` 使用 Builder 生成的格式：

```json
{
  "format": "splat-collision-plan",
  "version": 1,
  "tiles": [
    {
      "tileId": "corridor-000",
      "colliderId": "collision:corridor-000",
      "bounds": { "min": [-20, -0.5, -18], "max": [20, 0.1, 18] },
      "type": "box",
      "output": "navigation/colliders/corridor-000.collider.json"
    }
  ]
}
```

## Streaming 行为

Collision tile streaming 复用大场景 streaming 半径：

- `loadRadius` 内启用 tile collider
- 超过 `unloadRadius` 后移除 tile collider
- 当前支持 box scaffold；heightfield / mesh / compound collider 后续接入

## Builder 链路

完整离线 Builder 骨架仍然保留：

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

## 已知边界

- 0.24 只把 collision plan 转成 conservative box colliders。
- 还没有加载每 tile 的真实 collider artifact。
- heightfield / mesh / compound collider streaming 仍是后续工作。

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
- [ ] Heightfield / mesh collision artifacts

## 依赖与许可证

- Spark：MIT
- Three.js：MIT
- Rapier：Apache-2.0

项目本身使用 MIT License。导入场景、GLB、音频、训练模型与数据集仍需分别确认授权。
