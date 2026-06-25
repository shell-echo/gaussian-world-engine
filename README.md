# Splat World Engine — Runtime NavMesh Loader

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.23 把 0.22 生成的导航规划往 Runtime 推进一步：`splatworld-large` 可以声明 `navigation`，Runtime 会加载 `splat-navmesh`，校验 tile / link，并以调试线框展示 nav tiles、portal links 和 portal bounds。

```text
splatworld-large world.json
  ├── exposurePlan
  ├── navigation
  ↓
Runtime bootstrap
  ├── load exposure plan
  ├── load navmesh manifest
  ├── stream gaussian tiles
  └── draw navmesh debug group
```

## Runtime/Builder 0.23 能力

- 新增 `src/large/NavMeshTypes.ts`
- 新增运行时 `splat-navmesh` v1 格式
- `splatworld-large` 新增可选 `navigation`
- `LargeWorldBootstrap` 会按 world manifest 相对路径加载 navigation manifest
- navigation 加载失败只 warning，不阻塞大场景 tile streaming
- Runtime 会创建 NavMesh debug group
- nav tile 用绿色/红色 bounds 显示 walkable 状态
- nav link 用蓝色连线显示
- portal bounds 用黄色线框显示
- HUD 显示 nav tile/link 数量
- `public/worlds/large-demo/world.json` 引用 `./navmesh.json`
- 新增 `public/worlds/large-demo/navmesh.json`
- package version 更新为 `0.23.0`
- Runtime label 更新为 `runtime 0.23`

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

## navigation 配置

在 `splatworld-large` manifest 中添加：

```json
{
  "format": "splatworld-large",
  "version": 1,
  "navigation": "./navmesh.json"
}
```

`navmesh.json` 使用运行时格式：

```json
{
  "format": "splat-navmesh",
  "version": 1,
  "tiles": [
    {
      "tileId": "corridor-000",
      "bounds": { "min": [-18, -0.05, -6], "max": [18, 0.1, 6] },
      "walkable": true,
      "layer": "ground"
    }
  ],
  "links": [
    {
      "fromTileId": "corridor-000",
      "toTileId": "corridor-001",
      "bidirectional": true
    }
  ]
}
```

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

- 0.23 只加载并调试显示 navmesh，不做真正寻路。
- Runtime 尚未加载 collision tile plan。
- `splat-navmesh` 目前是轻量 bounds/links 表达，不是 Recast/Detour 多边形网格。

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
- [ ] Runtime collision tile streaming

## 依赖与许可证

- Spark：MIT
- Three.js：MIT
- Rapier：Apache-2.0

项目本身使用 MIT License。导入场景、GLB、音频、训练模型与数据集仍需分别确认授权。
