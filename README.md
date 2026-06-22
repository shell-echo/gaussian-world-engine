# Splat World Engine — swe-builder CLI Scaffold

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.14 把户外连续视频采集契约推进成可执行的 `swe-builder` CLI 脚手架：它不会在浏览器里训练 3DGS，而是为离线构建流程生成目录、计划文件和 `splatworld-large` 世界骨架。

```text
mounted wide camera video
  ├── GPS / IMU sidecars optional
  ├── capture session manifest
  ↓
swe-builder CLI scaffold
  ├── validate session
  ├── frame plan
  ├── chunk plan
  ├── large-world manifest skeleton
  └── folders for splats / proxy assets
       ↓
external reconstruction / training tools
       ↓
browser runtime
  ├── tile spatial index
  ├── LOD hysteresis
  ├── streaming budget
  └── playable Gaussian world
```

## Runtime/Builder 0.14 能力

- `splat-world` 小世界继续兼容
- `.splatworld` 世界包继续兼容
- `splatworld-large` 大场景 Manifest 继续作为浏览器 Runtime 输入
- `splat-capture-session` version 1 继续作为 Builder 输入契约
- 新增 `swe-builder` CLI 脚手架
- 新增独立 `tsconfig.builder.json`
- 主 `npm run typecheck` 覆盖浏览器 Runtime、Vite 配置和 Builder CLI
- 主 `npm run build` 会先编译 CLI，再执行 Vite 生产构建
- CLI 支持初始化采集目录、校验 session、生成 frame plan、生成 chunk plan、导出 large-world skeleton

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

## 使用 swe-builder

先构建 CLI：

```bash
npm run builder:build
```

创建一个户外 loop capture 项目：

```bash
npm run builder -- init-capture ./capture/outdoor-loop --name "Outdoor Loop" --video video/outdoor-loop.mp4 --duration 900
```

校验采集契约：

```bash
npm run builder -- validate ./capture/outdoor-loop/session.json
```

生成抽帧计划：

```bash
npm run builder -- plan-frames ./capture/outdoor-loop/session.json
```

生成空间分块计划：

```bash
npm run builder -- plan-chunks ./capture/outdoor-loop/session.json
```

导出浏览器可消费的大场景骨架：

```bash
npm run builder -- export-large-world ./capture/outdoor-loop/session.json
```

输出结构：

```text
capture/outdoor-loop/
  session.json
  video/
  tracks/
  frames/
    frame-plan.json
  chunks/
    chunk-plan.json
  large-world/
    world.json
    splats/
    proxy/
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

0.14 的 Builder 还不调用 ffmpeg、COLMAP、SLAM 或 3DGS 训练器。它先做工程地基：

```bash
swe-builder init-capture ./capture/outdoor-loop
swe-builder validate ./capture/outdoor-loop/session.json
swe-builder plan-frames ./capture/outdoor-loop/session.json
swe-builder plan-chunks ./capture/outdoor-loop/session.json
swe-builder export-large-world ./capture/outdoor-loop/session.json
```

外部训练器填入每个 chunk 的 `.spz` 输出后，Builder 生成的 `large-world/world.json` 可以直接给浏览器 Runtime 使用：

```text
large-world/
  world.json
  splats/
    tile_0000_lod0.spz
    tile_0000_lod1.spz
    tile_0001_lod0.spz
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

tools/
  swe-builder/
    cli.ts                      Node CLI scaffold
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
- CLI 当前是 scaffold，不实际抽帧、不解算 pose、不训练 Gaussian。
- 户外大场景的 pose drift、rolling shutter、动态物体、曝光变化仍需要离线 Builder 后续阶段处理。
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
- [x] `swe-builder` CLI scaffold
- [ ] Builder frame extraction adapter
- [ ] Builder chunk job manifests for external trainers
- [ ] Tile cross-fade
- [ ] 离线 seam optimizer 与 exposure matching
- [ ] NavMesh 与大场景分块碰撞

## 依赖与许可证

- Spark：MIT
- Three.js：MIT
- Rapier：Apache-2.0

项目本身使用 MIT License。导入场景、GLB、音频、训练模型与数据集仍需分别确认授权。
