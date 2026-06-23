# swe-builder

`swe-builder` is the offline CLI scaffold for turning an outdoor capture session into a browser-loadable large Gaussian world.

It does not run COLMAP, SLAM or Gaussian training yet. Runtime/Builder 0.15 adds concrete adapter outputs for frame extraction and per-chunk training jobs: ffmpeg commands are written as scripts, and each planned chunk receives a trainer-agnostic `job.json`.

## Build

```bash
npm run builder:build
```

## Commands

```bash
swe-builder init-capture ./capture/outdoor-loop --name "Outdoor Loop" --video video/outdoor-loop.mp4 --duration 900
swe-builder validate ./capture/outdoor-loop/session.json
swe-builder plan-frames ./capture/outdoor-loop/session.json
swe-builder extract-frames ./capture/outdoor-loop/session.json
swe-builder plan-chunks ./capture/outdoor-loop/session.json
swe-builder write-training-jobs ./capture/outdoor-loop/session.json
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

`extract-frames` writes two files:

```text
frames/extract-commands.json
frames/extract-frames.sh
```

The shell script is meant to be run from the capture project root. It contains deterministic ffmpeg commands such as:

```bash
ffmpeg -y -i 'video/outdoor-loop.mp4' -vf 'fps=2' -q:v 2 'frames/loop-main/frame_%06d.jpg'
```

The CLI writes the commands but does not run ffmpeg automatically.

## Training job manifests

`write-training-jobs` writes one job per planned chunk:

```text
chunks/jobs/chunk_0000/job.json
```

Each job includes:

- session path
- chunk id and tile id
- frame range
- frame glob
- expected pose file
- output LOD paths
- training policy copied from the capture session
- tile bounds

External training tools can consume these job files and write `.spz` outputs into `large-world/splats/`.

The generated `large-world/world.json` can be served and opened by the browser runtime:

```text
http://localhost:5173?world=/path/to/large-world/world.json
```

## Future work

- Real ffmpeg execution mode
- Pose solving adapters
- Per-tile trainer integration
- LOD pruning and compression
- Seam normalization and exposure matching
