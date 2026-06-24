# COLMAP pose converter

After generating and running the COLMAP runner script, export a text model into:

```text
poses/colmap/model-text/images.txt
poses/colmap/model-text/points3D.txt
```

Then convert the COLMAP text model into the Builder pose result contract:

```bash
npm run builder -- convert-colmap-poses ./capture/outdoor-loop/session.json
```

Custom model directory:

```bash
npm run builder -- convert-colmap-poses ./capture/outdoor-loop/session.json --model-dir poses/colmap/model-text
```

Outputs:

```text
poses/poses.json
poses/sparse-points.json
poses/pose-report.json
```

`poses/poses.json` is consumed by chunk training jobs.
