# swe-builder

`swe-builder` is the offline CLI scaffold for turning an outdoor capture session into a browser-loadable large Gaussian world.

It does not train Gaussian splats yet. Runtime/Builder 0.22 adds navigation and collision planning: `plan-navigation` writes NavMesh tile plans, cross-tile links, conservative collision plans and a navigation report contract.

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
swe-builder plan-seams ./capture/outdoor-loop/session.json
swe-builder plan-navigation ./capture/outdoor-loop/session.json
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
  poses/
    pose-job.json
    poses.json
    sparse-points.json
    pose-report.json
  chunks/
    chunk-plan.json
    training-jobs.json
    jobs/
      chunk_0000/job.json
  seams/
    seam-job.json
    exposure-plan.json
    seam-report.json
  navigation/
    navmesh-plan.json
    collision-plan.json
    navigation-report.json
    navmesh/
    colliders/
  large-world/
    world.json
    splats/
    proxy/
```

## Navigation planning

`plan-navigation` writes:

```text
navigation/navmesh-plan.json
navigation/collision-plan.json
navigation/navigation-report.json
```

The NavMesh plan contains one tile plan per large world tile:

```json
{
  "tileId": "tile_0000",
  "source": "tile-bounds",
  "agent": {
    "radius": 0.35,
    "height": 1.7,
    "maxSlopeDeg": 42,
    "stepHeight": 0.35
  },
  "output": "navigation/navmesh/tile_0000.navtile.json"
}
```

The collision plan starts with conservative box colliders derived from tile bounds. Future builders can replace those with heightfields, meshes or compound colliders.

## Future work

- Runtime NavMesh loader
- Runtime collision tile streaming
- Real NavMesh generation
- Heightfield / mesh collider generation
- Sequential matching preset for long videos
- SLAM adapter runner
- Per-tile trainer integration
- LOD pruning and compression
