# Large Gaussian Tile Streaming

This folder contains the Runtime-side foundation for large Gaussian scenes.

It intentionally does not train or generate Gaussian Splats in the browser. Offline builders should output a `splatworld-large` manifest plus tiled `.spz` or compatible Spark assets.

## Design

- Small worlds keep using `splat-world` and `.splatworld`.
- Large worlds use `splatworld-large`.
- `LargeWorldBootstrap` detects large manifests before the normal app bootstraps.
- The large manifest is converted into a lightweight `splat-world` manifest so the existing Engine can initialize physics, interaction and editor systems.
- `LargeSplatTileManager` then handles Splat tile loading, LOD switching and eviction.

## Current runtime policy

- Linear tile scan
- Distance + frustum selection
- LOD by `maxDistance`
- Concurrent load limit
- Estimated byte budget
- Far-tile eviction
- Debug bounds

## Future upgrades

- Spatial index: grid, BVH or octree
- LOD hysteresis
- Cross-fade between LODs
- Worker-based manifest/index parsing
- Builder CLI integration
