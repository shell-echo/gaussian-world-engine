# Splat World Engine — Runtime Exposure Plan

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.21 把 0.20 生成的 exposure plan 接到浏览器 Runtime：`splatworld-large` 可以声明 `exposurePlan`，Runtime 会加载并校验 `splat-exposure-plan`，然后在 tile LOD asset 加载后按 tile 应用 exposure / gain / bias。

## Runtime/Builder 0.21 能力

- `splatworld-large` 大场景 Manifest 新增可选 `exposurePlan`
- 新增 `src/large/ExposurePlanTypes.ts`
- Runtime 会校验 `splat-exposure-plan` v1
- Runtime 会把 exposure plan 传给 `LargeSplatTileManager`
- `GaussianWorld` 新增 `setAssetColorAdjustment(id, adjustment)`
- Tile LOD 加载完成后会应用对应 tile 的 exposure / gain / bias
- `public/worlds/large-demo/world.json` 已引用示例 exposure plan
- package version 更新为 `0.21.0`
- Runtime label 更新为 `runtime 0.21`

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

## exposurePlan 配置

在 `splatworld-large` manifest 中添加：

```json
{
  "format": "splatworld-large",
  "version": 1,
  "exposurePlan": "./exposure-plan.json"
}
```

`exposure-plan.json` 使用：

```json
{
  "format": "splat-exposure-plan",
  "version": 1,
  "session": "large-demo",
  "adjustments": [
    {
      "tileId": "tile_0000",
      "exposureStops": 0.12,
      "gain": [1.02, 1, 0.98],
      "bias": [0, 0, 0]
    }
  ]
}
```

Runtime 会把 `exposureStops` 转成亮度倍数，叠加到 gain 上，并尽量作用到 Three material color；同时会把调整值写入 `userData.exposureAdjustment`，方便后续 renderer adapter 使用。

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
```

`plan-seams` 会写：

```text
seams/seam-job.json
seams/exposure-plan.json
seams/seam-report.json
```

## 已知边界

- Runtime 只应用 exposure plan，不运行优化器。
- 对 splat 的真实颜色校正效果取决于底层 renderer 是否暴露颜色调节 hook。
- exposure plan 加载失败时不会阻塞大场景 streaming。

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
- [ ] NavMesh 与大场景分块碰撞

## 依赖与许可证

- Spark：MIT
- Three.js：MIT
- Rapier：Apache-2.0

项目本身使用 MIT License。导入场景、GLB、音频、训练模型与数据集仍需分别确认授权。
