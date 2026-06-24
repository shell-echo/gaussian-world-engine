# swe-builder

`swe-builder` is the offline CLI scaffold for turning an outdoor capture session into a browser-loadable large Gaussian world.

It does not train Gaussian splats yet. Runtime/Builder 0.18 adds a COLMAP text model converter: `convert-colmap-poses` reads COLMAP `images.txt` / `points3D.txt` and writes the standard `splat-pose-result` outputs consumed by chunk training jobs.

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
swe-builder plan-poses ./capture/outdoor-loop/session.json
swe-builder write-colmap-runner ./capture/outdoor-loop/session.json
swe-builder convert-colmap-poses ./capture/outdoor-loop/session.json
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
  poses/
    pose-job.json
    poses.json
    sparse-points.json
    pose-report.json
    colmap/
      colmap-runner.json
      run-colmap.sh
      colmap-report.placeholder.json
      sparse/
      model-text/
        images.txt
        points3D.txt
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

`extract-frames` writes:

```text
frames/extract-commands.json
frames/extract-frames.sh
```

The shell script is meant to be run from the capture project root. It contains deterministic ffmpeg commands such as:

```bash
ffmpeg -y -i 'video/outdoor-loop.mp4' -vf 'fps=2' -q:v 2 'frames/loop-main/frame_%06d.jpg'
```

## Pose solver adapter

`plan-poses` writes:

```text
poses/pose-job.json
poses/poses.placeholder.json
```

`pose-job.json` describes selected frame globs, camera metadata, GPS/IMU sidecars, pose method and expected outputs.

## COLMAP runner scaffold

`write-colmap-runner` writes:

```text
poses/colmap/colmap-runner.json
poses/colmap/run-colmap.sh
poses/colmap/colmap-report.placeholder.json
```

The generated script includes:

```text
colmap feature_extractor
colmap exhaustive_matcher
colmap mapper
colmap model_converter
```

For long outdoor videos, replace exhaustive matching with sequential or vocabulary-tree matching before running at scale.

## COLMAP pose converter

After running the COLMAP script, export a text model into:

```text
poses/colmap/model-text/images.txt
poses/colmap/model-text/points3D.txt
```

Then run:

```bash
swe-builder convert-colmap-poses ./capture/outdoor-loop/session.json
```

This writes:

```text
poses/poses.json
poses/sparse-points.json
poses/pose-report.json
```

The converter maps COLMAP world-to-camera quaternions and translations into camera-center poses in the shared `splat-pose-result` format.

## Training job manifests

`write-training-jobs` writes one job per planned chunk:

```text
chunks/jobs/chunk_0000/job.json
```

Each training job references the shared pose output:

```text
poses/poses.json
```

External training tools can consume these job files and write `.spz` outputs into `large-world/splats/`.

## Future work

- Sequential matching preset for long videos
- SLAM adapter runner
- Per-tile trainer integration
- LOD pruning and compression
- Seam normalization and exposure matching
