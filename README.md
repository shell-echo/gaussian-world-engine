# Splat World Engine — Seam / Exposure Scaffold

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.20 补上离线 Builder 侧的 seam / exposure optimizer scaffold：`swe-builder plan-seams` 会基于 `splatworld-large` 的 tile 邻接关系生成接缝优化任务、曝光校正占位表和报告契约。

```text
trained Gaussian tiles
  ├── large-world/world.json
  ├── chunks/training-jobs.json
  ↓
swe-builder plan-seams
  ├── seams/seam-job.json
  ├── seams/exposure-plan.json
  ├── seams/seam-report.json
  └── large-world/world.adjusted.json target
       ↓
future seam / exposure optimizer
       ↓
browser runtime loads adjusted large world
```

## Runtime/Builder 0.20 能力

- `splat-world` 小世界继续兼容
- `.splatworld` 世界包继续兼容
- `splatworld-large` 大场景 Manifest 继续作为浏览器 Runtime 输入
- 新增 `src/builder/SeamOptimizerTypes.ts`
- 新增 `splat-seam-optimization-job` v1
- 新增 `splat-exposure-plan` v1
- 新增 `splat-seam-report` v1
- 新增 `swe-builder plan-seams`
- 根据 tile `neighbors` 生成 seam pair
- 能计算相邻 tile 的 overlap bounds hint
- 生成 neutral exposure placeholder：gain `[1,1,1]`，bias `[0,0,0]`
- package version 更新为 `0.20.0`
- Runtime label 更新为 `runtime 0.20`

## 运行 Runtime

```bash
npm install
npm run dev
```

普通世界：

```text
http://localhost:5173
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
```

`plan-seams` 会写：

```text
seams/seam-job.json
seams/exposure-plan.json
seams/seam-report.json
```

如果 `large-world/world.json` 还不存在，命令会先根据当前 chunk plan 生成一个大世界 manifest skeleton。

## Seam job

`seam-job.json` 包含：

- session path
- large-world manifest path
- training job index path
- tile inputs
- neighbor seam pairs
- overlap bounds hint
- optimizer options
- expected outputs

示例：

```json
{
  "format": "splat-seam-optimization-job",
  "version": 1,
  "inputs": {
    "pairs": [
      {
        "id": "tile_0000__tile_0001",
        "tileA": "tile_0000",
        "tileB": "tile_0001",
        "weight": 1
      }
    ]
  }
}
```

## Exposure plan

`exposure-plan.json` 当前是占位输出，每个 tile 默认中性校正：

```json
{
  "tileId": "tile_0000",
  "exposureStops": 0,
  "gain": [1, 1, 1],
  "bias": [0, 0, 0]
}
```

后续真实 optimizer 应该根据相邻 tile overlap 区域估计 exposure / color gain，并写回 `exposure-plan.json` 和 `large-world/world.adjusted.json`。

## 已知边界

- 0.20 只生成 seam/exposure job，不执行真实优化。
- 当前 exposure plan 还没有被 Runtime 自动应用。
- 真实 seam optimizer 需要读取训练后的 splat/tile 统计或额外 overlap samples。
- 多天气、多曝光、强动态物体仍需要更复杂的外观建模。

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
- [ ] Apply exposure plan in Runtime
- [ ] NavMesh 与大场景分块碰撞

## 依赖与许可证

- Spark：MIT
- Three.js：MIT
- Rapier：Apache-2.0

项目本身使用 MIT License。导入场景、GLB、音频、训练模型与数据集仍需分别确认授权。
