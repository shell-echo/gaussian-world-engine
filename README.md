# Splat World Engine — Outdoor Capture Builder Contract

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime 0.13 在大场景 Tile Streaming 基础上加入了户外连续视频采集的 Builder 契约：运动相机跑一圈得到的视频不会在浏览器里训练，而是通过离线 Builder 转成 `splatworld-large` Tile 世界。

```text
mounted wide camera video
  ├── GPS / IMU sidecars optional
  ├── capture session manifest
  ↓
offline builder
  ├── frame selection
  ├── pose solving + loop closure
  ├── spatial chunk planning
  ├── per-chunk 3DGS training
  ├── LOD export
  └── splatworld-large manifest
       ↓
browser runtime
  ├── tile spatial index
  ├── LOD hysteresis
  ├── streaming budget
  └── playable Gaussian world
```

## Runtime 0.13 能力

- `splat-world` 小世界继续兼容
- `.splatworld` 世界包继续兼容
- `splatworld-large` 大场景 Manifest 继续作为浏览器 Runtime 输入
- 新增 `splat-capture-session` version 1 类型契约
- 新增 Capture Builder stage / report 类型
- 新增户外 loop capture 示例
- 新增户外采集指南
- 固化视频、相机、GPS、IMU、抽帧、pose、chunk、训练和导出策略字段
- 为后续 `swe-builder` CLI 预留输入输出格式

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

## 户外跑圈采集

你的目标可以表示成一个 Capture Session：

```text
我戴上运动相机，在户外跑一圈
  ↓
得到一段连续视频 + 可选 GPS/IMU
  ↓
Builder 选关键帧、求相机轨迹、切分空间块
  ↓
每块训练 Gaussian Tile
  ↓
输出 large-world/world.json
  ↓
浏览器 Runtime 流式加载
```

推荐采集路线：

```text
A -> B -> C -> D -> A
```

更好的路线：

```text
A -> B -> C -> B -> D -> A
```

因为中途回看可识别区域更有利于 loop closure 和降低轨迹漂移。

## Capture Session Manifest

示例文件：

```text
public/captures/outdoor-loop/session.json
```

核心结构：

```json
{
  "format": "splat-capture-session",
  "version": 1,
  "name": "Outdoor Loop Capture",
  "coordinateSystem": "y-up",
  "route": {
    "kind": "loop"
  },
  "sources": [
    {
      "id": "loop-main",
      "url": "video/outdoor-loop.mp4",
      "camera": {
        "model": "Wide Camera",
        "lens": "wide",
        "width": 3840,
        "height": 2160,
        "fps": 30,
        "rollingShutter": true
      },
      "gpsTrack": "tracks/outdoor-loop.gpx",
      "imuTrack": "tracks/outdoor-loop-imu.csv"
    }
  ],
  "policy": {
    "frames": {
      "targetFps": 2,
      "minDistanceMeters": 0.75,
      "minYawDegrees": 8
    },
    "poses": {
      "method": "hybrid",
      "loopClosure": true,
      "gpsPrior": true,
      "imuPrior": true
    },
    "chunks": {
      "strategy": "distance",
      "chunkMeters": 25,
      "overlapRatio": 0.18
    },
    "training": {
      "trainer": "external-3dgs",
      "appearanceNormalization": true
    },
    "export": {
      "lodLevels": 3,
      "outputFormat": "spz"
    }
  },
  "expectedOutput": {
    "largeWorldManifest": "large-world/world.json",
    "assetRoot": "large-world/"
  }
}
```

## Builder Pipeline

第一版 Builder 不需要直接训练 Gaussian，可以先做文件夹、抽帧、分块和 manifest：

```bash
swe-builder init-capture ./capture/session.json
swe-builder extract-frames ./capture/session.json
swe-builder plan-chunks ./capture/session.json
swe-builder export-large-world ./capture/session.json
```

外部训练器填入每个 chunk 的 `.spz` 输出后，Builder 再生成：

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

## 大场景 Runtime

浏览器仍然消费 `splatworld-large`：

```text
src/
  large/
    LargeWorldTypes.ts          splatworld-large schema and streaming config
    TileSpatialIndex.ts         uniform grid index for tile candidates
    LargeSplatTileManager.ts    tile query, LOD, loading, cache, eviction
    LargeWorldBootstrap.ts      large manifest interception and Engine hook
  builder/
    CaptureSessionTypes.ts      outdoor capture / builder contract
```

## 拍摄建议

- 保持移动平稳，避免突然大幅转向
- 尽量绕回起点或中途回看关键区域
- 重要区域多角度扫一遍
- 避免长时间面对纯白墙、玻璃、镜子、水面
- 避免大量动态人群占满画面
- 画面尽量少运动模糊
- 尽量保留 GPS / IMU sidecar
- 固定曝光和白平衡更利于外观统一

## 已知边界

- 浏览器 Runtime 不训练 3DGS。
- Capture Session 是 Builder 输入契约，不是训练实现。
- 户外大场景的 pose drift、rolling shutter、动态物体、曝光变化需要离线 Builder 处理。
- Tile 色彩统一、接缝优化、外观补偿仍属于离线阶段。
- 当前 Runtime 的 Tile LOD 还没有 cross-fade。

## 下一阶段

- [x] `.splatworld` 世界包
- [x] Web Worker 代理生成
- [x] QEM Mesh Simplification
- [x] Compound Convex Decomposition
- [x] Large Gaussian Tile Streaming Runtime
- [x] Tile Spatial Index + LOD Hysteresis
- [x] Outdoor Capture Builder Contract
- [ ] `swe-builder` CLI scaffold
- [ ] Builder frame extraction and chunk planning
- [ ] Tile cross-fade
- [ ] 离线 seam optimizer 与 exposure matching
- [ ] NavMesh 与大场景分块碰撞

## 依赖与许可证

- Spark：MIT
- Three.js：MIT
- Rapier：Apache-2.0

项目本身使用 MIT License。导入场景、GLB、音频、训练模型与数据集仍需分别确认授权。
