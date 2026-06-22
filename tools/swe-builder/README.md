# swe-builder

`swe-builder` is the offline CLI scaffold for turning an outdoor capture session into a browser-loadable large Gaussian world.

It does not run video decoding, COLMAP, SLAM or Gaussian training yet. The current scope is to prepare folders, validate the capture contract, generate frame and chunk plans, and export a `splatworld-large` manifest skeleton.

## Build

```bash
npm run builder:build
```

## Commands

```bash
swe-builder init-capture ./capture/outdoor-loop --name "Outdoor Loop" --video video/outdoor-loop.mp4 --duration 900
swe-builder validate ./capture/outdoor-loop/session.json
swe-builder plan-frames ./capture/outdoor-loop/session.json
swe-builder plan-chunks ./capture/outdoor-loop/session.json
swe-builder export-large-world ./capture/outdoor-loop/session.json
```

When using npm scripts locally:

```bash
npm run build
npm run builder -- validate ./capture/outdoor-loop/session.json
```

## Outputs

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

The generated `large-world/world.json` can be served and opened by the browser runtime:

```text
http://localhost:5173?world=/path/to/large-world/world.json
```

## Future work

- Real frame extraction via ffmpeg
- Pose solving adapters
- Chunk training job manifests
- Per-tile trainer integration
- LOD pruning and compression
- Seam normalization and exposure matching
