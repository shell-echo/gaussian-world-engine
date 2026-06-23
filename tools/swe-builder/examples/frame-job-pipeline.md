# Frame and training job pipeline

```bash
npm run builder -- init-capture ./capture/outdoor-loop --name "Outdoor Loop" --video video/outdoor-loop.mp4 --duration 900
npm run builder -- validate ./capture/outdoor-loop/session.json
npm run builder -- extract-frames ./capture/outdoor-loop/session.json
npm run builder -- plan-chunks ./capture/outdoor-loop/session.json
npm run builder -- write-training-jobs ./capture/outdoor-loop/session.json
npm run builder -- export-large-world ./capture/outdoor-loop/session.json
```

`extract-frames` writes ffmpeg commands but does not run them automatically.

`write-training-jobs` writes one trainer-agnostic `job.json` per chunk so external 3DGS tools can consume deterministic inputs and write `.spz` outputs.
