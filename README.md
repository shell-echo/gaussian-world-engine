# Splat World Engine — Large Gaussian Tile Streaming

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime 0.11 加入了超大 Gaussian 场景的基础运行时：大场景不再尝试一次性加载一个巨型 Splat，而是按 Tile、LOD 和 GPU 预算流式加载。

```text
splatworld-large manifest
  ├── tiles[]
  │     ├── bounds
  │     ├── lod0 high spz
  │     ├── lod1 medium spz
  │     └── lod2 low spz
  ├── optional colliders
  └── streaming budget
        ↓
LargeSplatTileManager
  ├── camera distance query
  ├── frustum test
  ├── LOD selection
  ├── concurrent loading limit
  ├── GPU memory budget
  ├── far tile eviction
  └── debug bounds
```

## Runtime 0.11 能力

- Spark 2.1 Gaussian Splat 渲染
- `splat-world` 小世界继续兼容
- `.splatworld` 世界包继续兼容
- 新增 `splatworld-large` 大场景 Manifest
- 按相机位置和视锥选择可见 Tile
- 每个 Tile 支持多个 LOD
- 限制并发加载数量
- 基于 `bytes` 估算 GPU 预算
- 超预算时优先卸载远处 Tile
- 离开 `unloadRadius` 后卸载 Tile
- Tile Bounds Debug 可视化
- 大场景仍可使用 Collider、Trigger、GLB Visual、Compound Convex 等已有系统
- 为未来视频重建 Builder 输出格式预留接口

## 运行

```bash
npm install
npm run dev
```

打开普通世界：

```text
http://localhost:5173
```

打开大场景示例：

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
    "debugBounds": true
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

### 字段说明

| 字段 | 作用 |
|---|---|
| `bounds` | Tile 的世界空间 AABB，用于视锥检测和距离计算 |
| `lods[].level` | LOD 等级，数字越小越精细 |
| `lods[].maxDistance` | 相机距离小于该值时可选择该 LOD |
| `lods[].bytes` | 预算估算，超预算时参与卸载策略 |
| `streaming.loadRadius` | 视锥外但足够近时仍可加载 |
| `streaming.preloadRadius` | 允许预取的最大距离 |
| `streaming.unloadRadius` | 超过距离后卸载已加载 Tile |
| `streaming.gpuBudgetBytes` | 近似 GPU 预算上限 |
| `streaming.maxConcurrentLoads` | 最大并发加载数 |

## 启动兼容策略

大场景不会改变原有 `Engine.create()` 入参。`LargeWorldBootstrap` 会先读取 URL 指向的 Manifest：

```text
如果 format === "splatworld-large"
  ↓
转换成一个空 splat 的普通 splat-world manifest
  ↓
让现有 Engine 正常启动物理、编辑器、音频和交互
  ↓
创建 LargeSplatTileManager 接管 splat tiles
```

这样：

- 小世界不受影响
- `.splatworld` 不受影响
- Engine 主类不需要知道大场景格式
- Tile Streaming 可以独立演进

## Runtime 调度

每帧 LargeSplatTileManager 会执行：

```text
camera world position
  ↓
更新 frustum
  ↓
计算每个 tile 到 camera 的距离
  ↓
选择目标 LOD
  ↓
按距离排序并发加载
  ↓
卸载远处 tile
  ↓
如果 residentBytes > gpuBudgetBytes，继续卸载最远 tile
```

Tile 状态：

```text
unloaded → loading → loaded
                  ↘ failed
```

Debug Bounds 颜色：

```text
灰色 = 未加载
蓝色 = 期望加载
黄色 = 加载中
绿色 = 已加载
```

## 和长视频重建的关系

浏览器 Runtime 不负责从长视频训练 Gaussian。建议离线 Builder 输出：

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

后续 Builder Pipeline：

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
    LargeWorldTypes.ts          splatworld-large schema and validation
    LargeSplatTileManager.ts    tile query, loading, LOD, cache, eviction
    LargeWorldBootstrap.ts      large manifest interception and Engine hook
  render/GaussianWorld.ts       add/remove individual splat assets
  RuntimeBootstrap.ts           composed runtime startup
```

已有系统继续保留：

```text
assets/proxy/                 QEM / Cluster worker
assets/decomposition/         Compound Convex worker
world/WorldBundle.ts          .splatworld bundle
physics/PhysicsWorld.ts       Rapier collision runtime
```

## 已知边界

- 当前 0.11 只实现 Runtime Streaming，不实现视频训练器。
- LOD 切换目前是卸载旧 LOD 后加载新 LOD，尚未 cross-fade。
- GPU 预算基于 Manifest `bytes` 估算，不是 WebGL 实际显存查询。
- Tile 查询是线性扫描，后续应升级为 BVH / grid / octree。
- `.splatworld` 适合小世界；超大世界推荐目录或 CDN 分片，而不是一个巨大 zip。
- Tile 之间的色彩统一、接缝优化、外观补偿属于离线 Builder 范围。

## 下一阶段

- [x] `.splatworld` 世界包
- [x] Web Worker 代理生成
- [x] QEM Mesh Simplification
- [x] Compound Convex Decomposition
- [x] Large Gaussian Tile Streaming Runtime
- [ ] Tile cross-fade 与 LOD hysteresis
- [ ] Tile spatial index：grid / BVH / octree
- [ ] Builder CLI：视频抽帧、分块、Manifest 生成
- [ ] 离线 seam optimizer 与 exposure matching
- [ ] NavMesh 与大场景分块碰撞

## 依赖与许可证

- Spark：MIT
- Three.js：MIT
- Rapier：Apache-2.0

项目本身使用 MIT License。导入场景、GLB、音频、训练模型与数据集仍需分别确认授权。
