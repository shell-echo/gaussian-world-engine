# Splat World Engine — Large Gaussian Tile Streaming

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime 0.12 在 0.11 的大场景 Tile Streaming 基础上加入了 **Tile Spatial Index** 与 **LOD Hysteresis**，用于支撑长视频重建后生成的大量 Gaussian Tiles。

```text
splatworld-large manifest
  ├── tiles[]
  │     ├── bounds
  │     ├── lod0 high spz
  │     ├── lod1 medium spz
  │     └── lod2 low spz
  └── streaming
        ├── tileIndexCellSize
        ├── lodHysteresisRatio
        └── minLodDwellSeconds
             ↓
LargeSplatTileManager
  ├── uniform grid spatial index
  ├── camera sphere candidate query
  ├── frustum test
  ├── LOD selection
  ├── LOD hysteresis
  ├── minimum LOD dwell time
  ├── concurrent loading limit
  ├── GPU memory budget
  ├── far tile eviction
  └── debug bounds
```

## Runtime 0.12 能力

- `splat-world` 小世界继续兼容
- `.splatworld` 世界包继续兼容
- `splatworld-large` 大场景 Manifest
- Tile uniform grid spatial index
- 按相机位置和 `preloadRadius` 查询候选 Tile
- 按视锥和距离选择需要加载的 Tile
- 每个 Tile 支持多个 LOD
- LOD hysteresis，避免边界抖动反复切换
- 最短 LOD 停留时间，避免快速移动时频繁卸载/重载
- 限制并发加载数量
- 基于 `bytes` 估算 GPU 预算
- 超预算时优先卸载远处 Tile
- 离开 `unloadRadius` 后卸载 Tile
- Tile Bounds Debug 可视化
- 状态栏显示 loaded / visible / candidate / loading / memory budget

## 运行

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

## 大场景 Manifest

```json
{
  "format": "splatworld-large",
  "version": 1,
  "name": "Large Tile Streaming Demo",
  "spawn": {
    "position": [0, 0.05, 6],
    "yawDeg": 0
  },
  "streaming": {
    "loadRadius": 45,
    "unloadRadius": 75,
    "preloadRadius": 90,
    "gpuBudgetBytes": 160000000,
    "maxConcurrentLoads": 2,
    "debugBounds": true,
    "tileIndexCellSize": 40,
    "lodHysteresisRatio": 0.14,
    "minLodDwellSeconds": 1.2
  },
  "tiles": [
    {
      "id": "tile_000",
      "bounds": {
        "min": [-20, -2, -18],
        "max": [20, 12, 18]
      },
      "lods": [
        {
          "level": 0,
          "url": "splats/tile_000_lod0.spz",
          "maxDistance": 35,
          "bytes": 18000000
        },
        {
          "level": 1,
          "url": "splats/tile_000_lod1.spz",
          "maxDistance": 90,
          "bytes": 6000000
        }
      ]
    }
  ]
}
```

### Streaming 字段

| 字段 | 作用 |
|---|---|
| `loadRadius` | 视锥外但足够近时仍可加载 |
| `preloadRadius` | Spatial index 查询半径 |
| `unloadRadius` | 超过距离后卸载已加载 Tile |
| `gpuBudgetBytes` | 近似 GPU 预算上限 |
| `maxConcurrentLoads` | 最大并发加载数 |
| `tileIndexCellSize` | uniform grid cell size，不填则用 Tile 尺寸中位数估算 |
| `lodHysteresisRatio` | LOD 切换阈值缓冲比例 |
| `minLodDwellSeconds` | 同一个 Tile 的最短 LOD 停留时间 |

## Spatial Index

0.11 是线性扫描：

```text
for every tile:
  distance + frustum + lod
```

0.12 改成：

```text
camera position + preloadRadius
  ↓
uniform grid query
  ↓
candidate tiles only
  ↓
frustum + distance + lod
```

状态栏中的 `cand` 表示本帧 spatial index 返回的候选 Tile 数。大世界中它应该显著小于总 Tile 数。

## LOD Hysteresis

没有 hysteresis 时，玩家站在 LOD 分界附近会出现：

```text
LOD0 → LOD1 → LOD0 → LOD1 ...
```

0.12 使用两层保护：

1. `lodHysteresisRatio`：切换到更高或更低 LOD 时需要越过额外阈值。
2. `minLodDwellSeconds`：一个 Tile 刚完成 LOD 切换后，短时间内不允许再次切换。

这能减少加载抖动、网络请求抖动和显存抖动。

## 和长视频重建的关系

浏览器 Runtime 仍然只负责“跑世界”，不负责训练。离线 Builder 需要输出：

```text
large-world/
  world.json
  splats/
    tile_000_lod0.spz
    tile_000_lod1.spz
    tile_001_lod0.spz
  proxy/
    collision_000.glb
```

推荐 Builder Pipeline：

```text
video.mp4
  ↓ 抽关键帧
pose / depth / sparse points
  ↓ 空间分块
per-tile 3DGS training
  ↓ LOD / prune / quantize
large-world manifest
  ↓
Browser tile streaming
```

## 代码结构

```text
src/
  large/
    LargeWorldTypes.ts          splatworld-large schema and streaming config
    TileSpatialIndex.ts         uniform grid index for tile candidates
    LargeSplatTileManager.ts    tile query, LOD, loading, cache, eviction
    LargeWorldBootstrap.ts      large manifest interception and Engine hook
  render/GaussianWorld.ts       add/remove individual splat assets
  RuntimeBootstrap.ts           composed runtime startup
```

## 已知边界

- 当前 Spatial Index 是 uniform grid，不是 BVH / octree。
- LOD 切换仍是替换旧 LOD，没有 cross-fade。
- GPU 预算基于 Manifest `bytes` 估算，不是 WebGL 实际显存查询。
- `.splatworld` 适合小世界；超大世界推荐目录或 CDN 分片。
- Tile 色彩统一、接缝优化和曝光补偿属于离线 Builder 范围。

## 下一阶段

- [x] `.splatworld` 世界包
- [x] Web Worker 代理生成
- [x] QEM Mesh Simplification
- [x] Compound Convex Decomposition
- [x] Large Gaussian Tile Streaming Runtime
- [x] Tile Spatial Index + LOD Hysteresis
- [ ] Tile cross-fade
- [ ] Builder CLI：视频抽帧、分块、Manifest 生成
- [ ] 离线 seam optimizer 与 exposure matching
- [ ] NavMesh 与大场景分块碰撞

## 依赖与许可证

- Spark：MIT
- Three.js：MIT
- Rapier：Apache-2.0

项目本身使用 MIT License。导入场景、GLB、音频、训练模型与数据集仍需分别确认授权。
