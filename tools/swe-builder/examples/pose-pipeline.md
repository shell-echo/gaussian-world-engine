# Pose adapter pipeline

```bash
npm run builder -- init-capture ./capture/outdoor-loop --name "Outdoor Loop" --video video/outdoor-loop.mp4 --duration 900
npm run builder -- extract-frames ./capture/outdoor-loop/session.json
npm run builder -- plan-poses ./capture/outdoor-loop/session.json
npm run builder -- plan-chunks ./capture/outdoor-loop/session.json
npm run builder -- write-training-jobs ./capture/outdoor-loop/session.json
npm run builder -- export-large-world ./capture/outdoor-loop/session.json
```

`plan-poses` writes:

```text
poses/pose-job.json
poses/poses.placeholder.json
```

A real adapter should consume `pose-job.json` and write:

```text
poses/poses.json
poses/sparse-points.json
poses/pose-report.json
```

Training jobs reference `poses/poses.json`, so all chunks share one globally consistent trajectory.
