# Splat World Engine — Collider File Reuse

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.26 为 collision tile streaming 增加 collider file 复用层：摄像机在 tile 边界来回移动时，Runtime 会复用已经加载并校验过的 `splat-collider-tile` JSON，减少重复 fetch / parse。

```text
splatworld-large world.json
  ├── streaming.colliderReuseEntries
  ├── collisionPlan
  ↓
collision-plan.json
  └── navigation/colliders/*.collider.json
       ↓
LargeCollisionTileManager
  ├── pending request de-dup
  ├── parsed file reuse
  └── oldest entry eviction
```

## Runtime/Builder 0.26 能力

- `splatworld-large.streaming` 新增 `colliderReuseEntries`
- `LargeCollisionTileManager` 会复用已加载的 collider tile file
- 相同 URL 的并发加载会复用同一个 pending request
- 命中后会刷新最近使用顺序
- 超过 `colliderReuseEntries` 后淘汰最旧 collider file
- `colliderReuseEntries: 0` 可关闭复用
- HUD 显示 collider file 复用统计：`cf <cached> h<hits>/m<misses>`
- demo world 配置 `colliderReuseEntries: 8`
- package version 更新为 `0.26.0`
- Runtime label 更新为 `runtime 0.26`

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

## colliderReuseEntries 配置

在 `splatworld-large` manifest 中：

```json
{
  "streaming": {
    "colliderReuseEntries": 24
  }
}
```

含义：

- `24`：最多保留最近 24 个已解析 collider tile file。
- `0`：关闭复用，每次激活非 box tile 都重新加载 `plan.output`。
- 最大值会被限制到 `256`，避免浏览器内存失控。

## Streaming 行为

Collision tile streaming 继续复用大场景 streaming 半径：

- `loadRadius` 内启用 tile collider
- 非 box tile 先查找已加载 file
- miss 时 fetch + validate + store
- hit 时直接把 file 转成当前 tile 的 collider id
- 超过 `unloadRadius` 后移除该 tile 的 active collider
- collider file 可继续留在复用池中，供下一次进入半径时使用

## 已知边界

- 复用池只存在于当前浏览器 session，不持久化到 IndexedDB。
- 当前按文件条目数限制，不按估算字节数限制。
- heightfield 当前仍转换为 mesh collider scaffold。

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
- [x] Collider file cache / LRU
- [ ] Recast/Detour-style runtime path query

## 依赖与许可证

- Spark：MIT
- Three.js：MIT
- Rapier：Apache-2.0

项目本身使用 MIT License。导入场景、GLB、音频、训练模型与数据集仍需分别确认授权。
