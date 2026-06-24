# Seam / exposure planning

After chunk planning, training job creation and large-world manifest export, generate seam optimization inputs:

```bash
npm run builder -- plan-seams ./capture/outdoor-loop/session.json
```

Outputs:

```text
seams/seam-job.json
seams/exposure-plan.json
seams/seam-report.json
```

`seam-job.json` contains tile inputs and neighbor pairs derived from `large-world/world.json`.

`exposure-plan.json` starts with neutral adjustments for every tile:

```json
{
  "exposureStops": 0,
  "gain": [1, 1, 1],
  "bias": [0, 0, 0]
}
```

A future optimizer should replace those values and write `large-world/world.adjusted.json`.
