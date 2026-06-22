# Outdoor Loop Capture Guide

This guide describes the capture contract for building a large Gaussian scene from a continuous outdoor loop video.

The browser runtime does not train 3D Gaussian Splats. The runtime consumes the output of an offline builder:

```text
outdoor video
  -> selected frames
  -> camera poses / sparse reconstruction
  -> spatial chunks
  -> per-chunk Gaussian training
  -> LOD export
  -> splatworld-large manifest
  -> browser tile streaming
```

## Capture goal

A good capture session is not just a video. It is a route with enough overlap, stable exposure and recoverable camera poses.

Recommended session shape:

```text
start area
  -> smooth loop
  -> revisit recognizable areas
  -> return to start area
```

A loop is preferred over an open path because it gives the pose solver a chance to correct accumulated drift.

## Camera setup

Recommended defaults:

| Setting | Recommendation |
|---|---|
| Resolution | 4K or higher |
| Frame rate | 30 fps source, 1-3 fps selected frames |
| Lens | Wide or linear wide |
| Stabilization | Prefer stable footage, but preserve original metadata if possible |
| Exposure | Lock exposure when the device supports it |
| White balance | Lock white balance when possible |
| GPS | Keep GPX sidecar when available |
| IMU | Keep gyro / accelerometer sidecar when available |

Avoid frequent sudden rotations. Prefer steady motion and repeated viewpoints of important areas.

## Capture path

Good path:

```text
A -> B -> C -> D -> A
```

Better path:

```text
A -> B -> C -> B -> D -> A
```

The second path revisits intermediate areas, which helps loop closure and reduces pose drift.

Avoid:

- pure straight lines with no return
- long featureless walls
- heavy glass / mirror surfaces
- fast turns
- strong motion blur
- large crowds blocking most static geometry
- abrupt exposure changes

## Frame selection

The builder should not train from every frame. It should select keyframes by time, distance and view change.

Recommended starting policy:

```json
{
  "targetFps": 2,
  "minDistanceMeters": 0.75,
  "minYawDegrees": 8,
  "blurThreshold": 0.55,
  "duplicateThreshold": 0.92
}
```

This keeps enough parallax while avoiding near-duplicate frames.

## Pose solving

Recommended policy for outdoor loop capture:

```json
{
  "method": "hybrid",
  "loopClosure": true,
  "gpsPrior": true,
  "imuPrior": true,
  "rollingShutterCompensation": true
}
```

The builder can implement this with different backends, for example:

- COLMAP / hloc for feature reconstruction
- SLAM for long trajectory initialization
- GPS / IMU priors for scale and drift control
- loop closure for final global consistency

The runtime only needs the final tile positions and bounds.

## Chunking

For a route-like outdoor capture, chunking by distance is a good first version:

```json
{
  "strategy": "distance",
  "chunkMeters": 25,
  "overlapRatio": 0.18
}
```

Each chunk should share frames with neighboring chunks. Overlap helps reduce seams and preserves continuity.

## Tile output

Each trained chunk should export multiple LOD files:

```text
tile_000_lod0.spz
tile_000_lod1.spz
tile_000_lod2.spz
```

The builder then writes a `splatworld-large` manifest:

```text
large-world/
  world.json
  splats/
    tile_000_lod0.spz
    tile_000_lod1.spz
    tile_001_lod0.spz
  proxy/
    collision_000.glb
```

## Builder contract

A capture session starts with:

```text
splat-capture-session version 1
```

The final browser-consumable result is:

```text
splatworld-large version 1
```

The builder may use any reconstruction backend as long as it produces the runtime contract.

## First implementation target

The first builder CLI should support:

```bash
swe-builder init-capture ./capture/session.json
swe-builder extract-frames ./capture/session.json
swe-builder plan-chunks ./capture/session.json
swe-builder export-large-world ./capture/session.json
```

Training can remain external at first. The builder should produce folders and manifests that other tools can fill.
