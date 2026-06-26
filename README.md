# Splat World Engine — Collider Tile Files

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.25 在 collision tile streaming 上继续推进：`collision-plan.json` 可以指向每个 tile 的 `splat-collider-tile` JSON 文件，Runtime 会按需加载并转成 Rapier collider。

```text
splatworld-large world.json
  ├── collisionPlan
  ↓
collision-plan.json
  ├── tile bounds fallback
  └── navigation/colliders/*.collider.json
       ├── box
       ├── mesh
       ├── heightfield
       └── compound
```

## Runtime/Builder 0.25 能力

- 新增 `src/large/CollisionTileArtifactTypes.ts`
- 新增运行时 `splat-collider-tile` v1 格式
- 支持 box / mesh / heightfield / compound collider tile file schema
- `LargeCollisionTileManager` 会在激活非 box tile 时加载 `plan.output`
- `plan.output` 会按 `collision-plan.json` 所在路径解析，支持相对路径
- heightfield 会被转换成 mesh collider scaffold
- collider file 加载失败时安全回退到 tile bounds box
- demo 的 `corridor-001` 使用 heightfield collider file
- package version 更新为 `0.25.0`
- Runtime label 更新为 `runtime 0.25`

## 运行 Runtime

```bash
npm install
npm run dev
```

大场景示例：

```text
http://localhost:5173?world=/worlds/large-demo/world.json
```

验证：

```bash
npm run typecheck
npm run build
npm run preview
```

## collider tile file

`collision-plan.json` 中非 box tile 可以指向 per-tile collider file：

```json
{
  "tileId": "corridor-001",
  "colliderId": "collision:corridor-001",
  "bounds": { "min": [20, -0.5, -18], "max": [60, 0.1, 18] },
  "type": "heightfield",
  "output": "navigation/colliders/corridor-001.collider.json"
}
```

对应 `splat-collider-tile`：

```json
{
  "format": "splat-collider-tile",
  "version": 1,
  "tileId": "corridor-001",
  "kind": "heightfield",
  "bounds": { "min": [20, -0.5, -18], "max": [60, 0.1, 18] },
  "heightfield": {
    "width": 4,
    "depth": 3,
    "min": [20, -0.05, -18],
    "max": [60, 0.05, 18],
    "heights": [0, 0.02, 0.01, 0]
  }
}
```

## Streaming 行为

Collision tile streaming 继续复用大场景 streaming 半径：

- `loadRadius` 内启用 tile collider
- 非 box tile 先加载 `output` collider file
- 加载成功后添加 file 中的 collider
- 加载失败时回退为 bounds box
- 超过 `unloadRadius` 后移除该 tile 的所有 collider

## 已知边界

- heightfield 当前转换为 mesh collider scaffold，而不是 Rapier 原生 heightfield。
- mesh / compound 需要 Builder 后续输出更精确的 geometry。
- Runtime 还没有 collider file cache / LRU。

## 下一阶段

- [x] `.splatworld` 世界包
- [x] Web Worker 代理生成
- [x] QEM Mesh Simplification
- [x] Compound Convex Decomposition
- [x] Large Gaussian Tile Streaming Runtime
- [x] Tile Spatial Index + LOD Hysteresis
- [x] Outdoor Capture Builder Contract
- [x] `swe-builder` CLI scaffold
- [x] Builder frame extraction adapter
- [x] Builder chunk job manifests for external trainers
- [x] Pose solver adapter contract
- [x] COLMAP adapter runner
- [x] COLMAP model-to-pose-result converter
- [x] Large Tile LOD cross-fade
- [x] Seam / exposure optimizer scaffold
- [x] Apply exposure plan in Runtime
- [x] NavMesh / 大场景碰撞规划 scaffold
- [x] Runtime NavMesh loader
- [x] Runtime collision tile streaming
- [x] Heightfield / mesh collision artifacts scaffold
- [ ] Collider file cache / LRU
- [ ] Recast/Detour-style runtime path query

## 依赖与许可证

- Spark：MIT
- Three.js：MIT
- Rapier：Apache-2.0

项目本身使用 MIT License。导入场景、GLB、音频、训练模型与数据集仍需分别确认授权。
