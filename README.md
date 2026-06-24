# Splat World Engine — Large Tile LOD Cross-fade

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.19 聚焦大场景浏览器 Runtime：`splatworld-large` 的 LOD 切换现在支持 cross-fade，新 LOD 淡入，旧 LOD 短暂保留后移除，减少远近切换时的闪烁和突变。

```text
splatworld-large manifest
  ├── spatial tile index
  ├── distance/frustum streaming
  ├── LOD hysteresis
  ├── LOD cross-fade
  └── delayed old LOD removal
```

## Runtime/Builder 0.19 能力

- `splat-world` 小世界继续兼容
- `.splatworld` 世界包继续兼容
- `splatworld-large` 大场景 Manifest 继续作为浏览器 Runtime 输入
- `GaussianWorld` 新增 `setAssetOpacity(id, opacity)`
- `SplatAsset` 新增可选 `opacity`
- Large Tile Manager 新增 LOD cross-fade
- 新 LOD 加载后从 0 到 1 淡入
- 旧 LOD 作为 retained asset 保留一小段时间并淡出
- resident bytes 统计会计入 retained LOD
- `public/worlds/large-demo/world.json` 增加 fade 配置示例
- package version 更新为 `0.19.0`
- Runtime label 更新为 `runtime 0.19`

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

## LOD Cross-fade 配置

在 `splatworld-large` 的 `streaming` 段里可以配置：

```json
{
  "streaming": {
    "lodHysteresisRatio": 0.14,
    "minLodDwellSeconds": 1.2,
    "lodCrossFadeSeconds": 0.28,
    "lodRetainSeconds": 0.34
  }
}
```

字段含义：

- `lodCrossFadeSeconds`：新 LOD 淡入、旧 LOD 淡出的时间。
- `lodRetainSeconds`：旧 LOD 至少保留多久再移除。
- `lodHysteresisRatio`：控制 LOD 阈值回差，避免距离边界抖动。
- `minLodDwellSeconds`：控制同一个 tile 的最短 LOD 停留时间。

## 当前大场景 Runtime 链路

```text
camera position
  ↓
TileSpatialIndex query
  ↓
frustum / preload radius filter
  ↓
LOD selection + hysteresis
  ↓
load target LOD
  ↓
fade in target LOD
  ↓
fade out retained LOD
  ↓
remove old LOD
```

## Builder 链路仍然保留

离线 Builder 侧依旧支持：

```bash
npm run builder -- init-capture ./capture/outdoor-loop --name "Outdoor Loop" --video video/outdoor-loop.mp4 --duration 900
npm run builder -- extract-frames ./capture/outdoor-loop/session.json
npm run builder -- plan-poses ./capture/outdoor-loop/session.json
npm run builder -- write-colmap-runner ./capture/outdoor-loop/session.json
npm run builder -- convert-colmap-poses ./capture/outdoor-loop/session.json
npm run builder -- plan-chunks ./capture/outdoor-loop/session.json
npm run builder -- write-training-jobs ./capture/outdoor-loop/session.json
npm run builder -- export-large-world ./capture/outdoor-loop/session.json
```

## 已知边界

- Cross-fade 依赖 underlying splat renderer 对 opacity/material opacity 的支持；如果某些 splat 实现不支持透明度，仍会保留旧 LOD 到延迟移除时间。
- Cross-fade 会在短时间内同时保留两个 LOD，因此 resident bytes 会临时升高。
- 当前还没有 tile streaming 预取优先级的可视化 timeline。

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
- [ ] 离线 seam optimizer 与 exposure matching
- [ ] NavMesh 与大场景分块碰撞

## 依赖与许可证

- Spark：MIT
- Three.js：MIT
- Rapier：Apache-2.0

项目本身使用 MIT License。导入场景、GLB、音频、训练模型与数据集仍需分别确认授权。
