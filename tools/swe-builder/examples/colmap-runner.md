# COLMAP runner scaffold

```bash
npm run builder -- init-capture ./capture/outdoor-loop --name "Outdoor Loop" --video video/outdoor-loop.mp4 --duration 900
npm run builder -- extract-frames ./capture/outdoor-loop/session.json
npm run builder -- plan-poses ./capture/outdoor-loop/session.json
npm run builder -- write-colmap-runner ./capture/outdoor-loop/session.json
```

`write-colmap-runner` writes:

```text
poses/colmap/colmap-runner.json
poses/colmap/run-colmap.sh
poses/colmap/colmap-report.placeholder.json
```

Run the generated shell script from the capture project root after frame extraction:

```bash
bash poses/colmap/run-colmap.sh
```

For long outdoor videos, replace exhaustive matching with sequential or vocabulary-tree matching before running at scale.
