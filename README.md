# Splat World Engine — Builder Frame Jobs

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.15 在 `swe-builder` CLI scaffold 基础上继续推进离线构建流水线：从户外连续视频采集契约生成 ffmpeg 抽帧脚本，并为每个空间 chunk 生成训练任务 JSON。

```text
mounted wide camera video
  ├── GPS / IMU sidecars optional
  ├── capture session manifest
  ↓
swe-builder
  ├── validate session
  ├── frame plan
  ├── ffmpeg extraction script
  ├── chunk plan
  ├── per-chunk training job manifests
  └── large-world manifest skeleton
       ↓
external reconstruction / training tools
       ↓
browser runtime
  ├── tile spatial index
  ├── LOD hysteresis
  ├── streaming budget
  └── playable Gaussian world
```

## Runtime/Builder 0.15 能力

- `splat-world` 小世界继续兼容
- `.splatworld` 世界包继续兼容
- `splatworld-large` 大场景 Manifest 继续作为浏览器 Runtime 输入
- `splat-capture-session` version 1 继续作为 Builder 输入契约
- `swe-builder` CLI 继续可独立编译
- 新增 `extract-frames`：生成 ffmpeg 命令 JSON 和 shell 脚本
- 新增 `write-training-jobs`：为每个 chunk 写 `job.json`
- 主 `npm run typecheck` 覆盖浏览器 Runtime、Vite 配置和 Builder CLI
- 主 `npm run build` 会先编译 CLI，再执行 Vite 生产构建

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

生成 ffmpeg 抽帧脚本：

```bash
npm run builder -- extract-frames ./capture/outdoor-loop/session.json
```

生成空间分块计划：

```bash
npm run builder -- plan-chunks ./capture/outdoor-loop/session.json
```

为外部训练器生成每个 chunk 的训练任务：

```bash
npm run builder -- write-training-jobs ./capture/outdoor-loop/session.json
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
    extract-commands.json
    extract-frames.sh
    loop-main/
  chunks/
    chunk-plan.json
    training-jobs.json
    jobs/
      chunk_0000/
        job.json
  large-world/
    world.json
    splats/
    proxy/
```

## Frame extraction adapter

`extract-frames` 不直接运行 ffmpeg，而是写出可审查、可复现的命令：

```bash
ffmpeg -y -i 'video/outdoor-loop.mp4' -vf 'fps=2' -q:v 2 'frames/loop-main/frame_%06d.jpg'
```

后续可以在本机、服务器或队列 worker 里执行 `frames/extract-frames.sh`。

## Training job manifests

`write-training-jobs` 为每个 chunk 写：

```text
chunks/jobs/chunk_0000/job.json
```

每个 job 包含：

- `chunkId` / `tileId`
- `frameRange`
- `frameGlob`
- `poseFile`
- `output.lods`
- `bounds`
- `training` policy

外部训练器只需要消费这些 job，输出对应 `.spz` 文件到 `large-world/splats/`，然后浏览器 Runtime 继续加载 `large-world/world.json`。

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
- CLI 当前生成 ffmpeg 脚本，但不自动执行 ffmpeg。
- CLI 当前生成训练 job，但不直接运行 COLMAP、SLAM 或 Gaussian trainer。
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
- [x] Builder frame extraction adapter
- [x] Builder chunk job manifests for external trainers
- [ ] Pose solver adapter contract
- [ ] Tile cross-fade
- [ ] 离线 seam optimizer 与 exposure matching
- [ ] NavMesh 与大场景分块碰撞

## 依赖与许可证

- Spark：MIT
- Three.js：MIT
- Rapier：Apache-2.0

项目本身使用 MIT License。导入场景、GLB、音频、训练模型与数据集仍需分别确认授权。
