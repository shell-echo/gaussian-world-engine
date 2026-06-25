# Navigation / collision planning

After exporting a large-world manifest, generate navigation and collision planning files:

```bash
npm run builder -- plan-navigation ./capture/outdoor-loop/session.json
```

Outputs:

```text
navigation/navmesh-plan.json
navigation/collision-plan.json
navigation/navigation-report.json
```

`navmesh-plan.json` contains per-tile navigation inputs and neighbor portal links.

`collision-plan.json` starts with conservative tile bounds as box collider plans. Future builders can replace these with heightfields, meshes or compound colliders.
