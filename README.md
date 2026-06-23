# Splat World Engine — Builder Pose Adapter

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.16 把户外连续视频构建链路中最关键的 pose 阶段补上：`swe-builder` 现在可以生成 pose solver job，并定义统一的 `splat-pose-result` 输出格式，让 COLMAP、SLAM 或 hybrid adapter 都能接到同一条 Builder 流水线里。

```text
mounted wide camera video
  ├── GPS / IMU sidecars optional
  ├── capture session manifest
  ↓
swe-builder
  ├── validate session
  ├── frame plan
  ├── ffmpeg extraction script
  ├── pose solver job
  ├── chunk plan
  ├── per-chunk training job manifests
  └── large-world manifest skeleton
       ↓
external pose / reconstruction / training tools
       ↓
browser runtime
  ├── tile spatial index
  ├── LOD hysteresis
  ├── streaming budget
  └── playable Gaussian world
```

## Runtime/Builder 0.16 能力

- `splat-world` 小世界继续兼容
- `.splatworld` 世界包继续兼容
- `splatworld-large` 大场景 Manifest 继续作为浏览器 Runtime 输入
- `splat-capture-session` version 1 继续作为 Builder 输入契约
- `swe-builder` CLI 继续可独立编译
- 新增 `splat-pose-solver-job` version 1
- 新增 `splat-pose-result` version 1
- 新增 `swe-builder plan-poses`
- `write-training-jobs` 生成的训练 job 现在引用共享 `poses/poses.json`
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

完整离线流水线骨架：

```bash
npm run builder -- init-capture ./capture/outdoor-loop --name "Outdoor Loop" --video video/outdoor-loop.mp4 --duration 900
npm run builder -- validate ./capture/outdoor-loop/session.json
npm run builder -- plan-frames ./capture/outdoor-loop/session.json
npm run builder -- extract-frames ./capture/outdoor-loop/session.json
npm run builder -- plan-poses ./capture/outdoor-loop/session.json
npm run builder -- plan-chunks ./capture/outdoor-loop/session.json
npm run builder -- write-training-jobs ./capture/outdoor-loop/session.json
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
  poses/
    pose-job.json
    poses.placeholder.json
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

## Pose solver adapter

`plan-poses` 会写：

```text
poses/pose-job.json
poses/poses.placeholder.json
```

`pose-job.json` 包含：

- `method`: `colmap` / `slam` / `hybrid`
- selected frame globs
- camera metadata
- GPS / IMU sidecar paths
- loop closure option
- rolling shutter option
- expected output paths

真实 pose solver 应把结果写到：

```text
poses/poses.json
poses/sparse-points.json
poses/pose-report.json
```

其中 `poses/poses.json` 使用 `splat-pose-result` 格式：

```json
{
  "format": "splat-pose-result",
  "version": 1,
  "session": "session.json",
  "method": "hybrid",
  "coordinateSystem": "y-up",
  "scale": "metric",
  "poses": [
    {
      "frame": "frames/loop-main/frame_000001.jpg",
      "sourceId": "loop-main",
      "position": [0, 1.6, 0],
      "rotation": [0, 0, 0, 1]
    }
  ]
}
```

## Training job manifests

`write-training-jobs` 为每个 chunk 写：

```text
chunks/jobs/chunk_0000/job.json
```

每个 training job 现在引用全局 pose 文件：

```text
poses/poses.json
```

也就是说 Builder 链路变成：

```text
frames -> poses/poses.json -> chunks/jobs/*/job.json -> splat tiles -> large-world/world.json
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

## 已知边界

- 浏览器 Runtime 不训练 3DGS。
- CLI 当前生成 pose job，但不自动运行 COLMAP、SLAM 或 hybrid solver。
- `poses.placeholder.json` 只是格式占位，真实位姿需要外部 adapter 写入 `poses/poses.json`。
- 户外大场景的 pose drift、rolling shutter、动态物体、曝光变化仍需要离线 Builder 后续阶段处理。
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
- [x] Pose solver adapter contract
- [ ] COLMAP adapter runner
- [ ] Tile cross-fade
- [ ] 离线 seam optimizer 与 exposure matching
- [ ] NavMesh 与大场景分块碰撞

## 依赖与许可证

- Spark：MIT
- Three.js：MIT
- Rapier：Apache-2.0

项目本身使用 MIT License。导入场景、GLB、音频、训练模型与数据集仍需分别确认授权。
