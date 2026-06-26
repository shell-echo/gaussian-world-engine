# Splat World Engine — Collider File Cache

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.26 给 collision tile streaming 增加 collider file cache / LRU：非 box tile 首次进入 `loadRadius` 时加载并校验 `splat-collider-tile`，后续重复进出半径时复用已解析 collider blueprints，减少重复 fetch / parse。

```text
camera enters collision tile
  ├── cache hit: clone cached collider blueprints
  └── cache miss: fetch collider file → validate → convert → cache
       ↓
add Rapier colliders
       ↓
camera leaves unloadRadius
       ↓
remove active colliders, keep cached file up to LRU budget
```

## Runtime/Builder 0.26 能力

- `LargeCollisionTileManager` 新增 collider file cache
- cache key 使用 `plan.output` 的 resolved URL
- cache 存储已解析后的 collider blueprints
- 每次激活 tile 时 clone cached collider，避免重复 fetch / parse
- 默认最多缓存 24 个 collider tile files
- 超过预算按最近使用帧 LRU 淘汰
- manager dispose 时清空 cache
- HUD 显示 `ccache <size> h<hits>/m<misses>`
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

## 缓存行为

Collision tile streaming 继续复用大场景 streaming 半径：

- `loadRadius` 内启用 tile collider
- box tile 直接使用 bounds box，不走文件缓存
- 非 box tile 使用 `plan.output` 作为 cache key
- cache hit 时 clone cached collider blueprints
- cache miss 时 fetch + validate + convert，然后写入 cache
- 超过 `unloadRadius` 后移除 active colliders，但保留 cached file
- 超过 cache budget 后按 LRU 淘汰最久未使用的 collider file

## HUD 指标

```text
ccache 1 h3/m1
```

含义：

- `1`：当前缓存的 collider file 数量
- `h3`：cache hit 次数
- `m1`：cache miss 次数

## 已知边界

- 0.26 的 cache budget 仍是内部默认值，还没有暴露到 `splatworld-large.streaming`。
- cache 基于文件级别，不做 collider geometry 字节预算。
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
