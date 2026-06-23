# Splat World Engine — Builder COLMAP Runner

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.17 在 pose adapter 契约后继续补上 COLMAP runner scaffold：`swe-builder` 现在可以生成 COLMAP 命令计划和 shell 脚本，用于把抽帧后的户外视频送进 COLMAP 稀疏重建流程。

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
  ├── COLMAP runner script
  ├── chunk plan
  ├── per-chunk training job manifests
  └── large-world manifest skeleton
       ↓
external COLMAP / pose conversion / training tools
       ↓
browser runtime
  ├── tile spatial index
  ├── LOD hysteresis
  ├── streaming budget
  └── playable Gaussian world
```

## Runtime/Builder 0.17 能力

- `splat-world` 小世界继续兼容
- `.splatworld` 世界包继续兼容
- `splatworld-large` 大场景 Manifest 继续作为浏览器 Runtime 输入
- `splat-capture-session` version 1 继续作为 Builder 输入契约
- `swe-builder` CLI 继续可独立编译
- 新增 `splat-colmap-runner-plan` version 1
- 新增 `splat-colmap-runner-report` version 1
- 新增 `swe-builder write-colmap-runner`
- 生成 `colmap feature_extractor / exhaustive_matcher / mapper / model_converter` 脚本
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

完整离线流水线骨架：

```bash
npm run builder -- init-capture ./capture/outdoor-loop --name "Outdoor Loop" --video video/outdoor-loop.mp4 --duration 900
npm run builder -- validate ./capture/outdoor-loop/session.json
npm run builder -- plan-frames ./capture/outdoor-loop/session.json
npm run builder -- extract-frames ./capture/outdoor-loop/session.json
npm run builder -- plan-poses ./capture/outdoor-loop/session.json
npm run builder -- write-colmap-runner ./capture/outdoor-loop/session.json
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
    colmap/
      colmap-runner.json
      run-colmap.sh
      colmap-report.placeholder.json
      database.db
      sparse/
      model-text/
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

## COLMAP runner scaffold

`write-colmap-runner` 会写：

```text
poses/colmap/colmap-runner.json
poses/colmap/run-colmap.sh
poses/colmap/colmap-report.placeholder.json
```

脚本包含保守默认命令：

```text
colmap feature_extractor
colmap exhaustive_matcher
colmap mapper
colmap model_converter
```

对于真正的长视频户外采集，后续应该把 `exhaustive_matcher` 替换成 sequential matching 或 vocabulary-tree matching，否则帧数多时会非常慢。

COLMAP 运行后，下一阶段 adapter 需要把 `poses/colmap/model-text/` 转成：

```text
poses/poses.json
poses/sparse-points.json
poses/pose-report.json
```

其中 `poses/poses.json` 使用 `splat-pose-result` 格式。

## Training job manifests

`write-training-jobs` 为每个 chunk 写：

```text
chunks/jobs/chunk_0000/job.json
```

每个 training job 引用全局 pose 文件：

```text
poses/poses.json
```

也就是说 Builder 链路变成：

```text
frames -> COLMAP -> poses/poses.json -> chunks/jobs/*/job.json -> splat tiles -> large-world/world.json
```

## 已知边界

- 浏览器 Runtime 不训练 3DGS。
- CLI 当前生成 COLMAP 脚本，但不自动运行 COLMAP。
- CLI 当前不把 COLMAP text model 转成 `splat-pose-result`，这是下一阶段。
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
- [x] COLMAP adapter runner
- [ ] COLMAP model-to-pose-result converter
- [ ] Tile cross-fade
- [ ] 离线 seam optimizer 与 exposure matching
- [ ] NavMesh 与大场景分块碰撞

## 依赖与许可证

- Spark：MIT
- Three.js：MIT
- Rapier：Apache-2.0

项目本身使用 MIT License。导入场景、GLB、音频、训练模型与数据集仍需分别确认授权。
