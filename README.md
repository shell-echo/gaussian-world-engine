# Splat World Engine — Mission Package Diagnostics

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.41 在 0.40 的 Mission package loader 之上新增 Mission package validation / diagnostics report：mission package 加载不再只是成功或失败，而是会产出结构化诊断报告，用于定位 package schema、引用关系和 runner rule 配置问题。

```text
RuntimeNavMissionPackageLoader
  ├── normalizeRuntimeNavMissionPackageReferences(refs, baseUrl)
  ├── validateRuntimeNavMissionPackageDocument(document, url)
  └── loadRuntimeNavMissionPackages(options)

RuntimeNavMissionPackageDiagnosticsReport
  ├── ok
  ├── packageCount
  ├── loadedPackages
  ├── failedPackages
  ├── warnings
  ├── errors
  ├── diagnostics[]
  └── results[]

LargeWorldBootstrap
  ├── window.splatWorld.navMesh
  └── window.splatWorld.missionPackages
```

## Runtime/Builder 0.41 能力

- `src/large/NavMissionPackageLoader.ts` 新增 diagnostics report
- 新增 diagnostic severity：
  - `info`
  - `warning`
  - `error`
- 新增 `RuntimeNavMissionPackageDiagnostic`
- 新增 `RuntimeNavMissionPackageDiagnosticsReport`
- 新增 `validateRuntimeNavMissionPackageDocument(document, url)`
- package loader 现在会检查：
  - empty package
  - duplicate mission id
  - duplicate objective id
  - duplicate runner rule id
  - objective 引用缺失 mission
  - objective 引用缺失 objective dependency
  - objective 引用缺失 required mission
  - objective condition 引用缺失 mission / objective
  - runner rule action target 缺失 mission / objective
  - runner rule broad event filter
  - disabled runner rule
- 单个 package 失败不会直接中断所有 package 加载
- 有 `error` 的 package 不会被 apply，但 report 会保留失败原因
- `LargeWorldBootstrap` 会把 report 暴露到：
  - `window.splatWorld.missionPackages`
- Runtime status / ready toast 会显示：
  - loaded package count
  - warning count
  - error count
- package diagnostics 会 `console.info("Mission package diagnostics", report)` 输出完整报告
- package version 更新为 `0.41.0`
- Runtime label 更新为 `runtime 0.41`

## 运行 Runtime

```bash
npm install
npm run dev
```

大场景 click-to-move + Mission HUD 示例：

```text
http://localhost:5173?world=/worlds/large-demo/world.json&clickToMove=1&missionDebug=1
```

通过 URL 加载额外 mission package：

```text
http://localhost:5173?world=/worlds/large-demo/world.json&mission=/worlds/large-demo/mission-package.json&missionDebug=1
```

多个 URL package 可以重复传参：

```text
http://localhost:5173?world=/worlds/large-demo/world.json&mission=/missions/base.json&mission=/missions/extra.json&missionDebug=1
```

查看 diagnostics report：

```js
window.splatWorld.missionPackages
```

查看 warning / error：

```js
window.splatWorld.missionPackages.diagnostics.filter((item) => item.severity !== "info")
```

验证：

```bash
npm run typecheck
npm run build
npm run preview
```

## Mission package manifest hook

在 large world manifest 里挂一个 package：

```json
{
  "format": "splatworld-large",
  "version": 1,
  "name": "Large Tile Streaming Demo",
  "navigation": "./navmesh.json",
  "missionPackage": "./mission-package.json"
}
```

挂多个 package：

```json
{
  "missionPackages": [
    "./mission-base.json",
    {
      "url": "./mission-extra.json",
      "merge": true
    }
  ]
}
```

一个 package 本质上就是 0.39 的 authoring document：

```json
{
  "schemaVersion": 1,
  "savedAt": 0,
  "metadata": {
    "id": "large-demo-mission-pack",
    "title": "Large Demo Mission Pack",
    "version": "0.1.0"
  },
  "missions": [
    {
      "id": "large-demo-mission",
      "status": "active",
      "progress": 0,
      "data": {
        "title": "Large Demo Mission"
      }
    }
  ],
  "objectives": [
    {
      "id": "large-demo-arrive",
      "missionId": "large-demo-mission",
      "title": "Move debug-click-agent to a destination"
    }
  ],
  "runnerRules": [
    {
      "id": "large-demo-arrive-on-agent-arrived",
      "event": {
        "source": "agent",
        "type": "arrived",
        "agentId": "debug-click-agent"
      },
      "action": {
        "kind": "objective",
        "id": "large-demo-arrive",
        "status": "completed"
      },
      "once": true,
      "enabled": true
    }
  ]
}
```

## Diagnostics report 示例

```json
{
  "ok": true,
  "packageCount": 1,
  "loadedPackages": 1,
  "failedPackages": 0,
  "warnings": 0,
  "errors": 0,
  "diagnostics": [
    {
      "severity": "info",
      "code": "package.summary",
      "message": "Mission package contains 1 mission(s), 1 objective(s), and 1 runner rule(s)."
    }
  ],
  "results": [
    {
      "url": "http://localhost:5173/worlds/large-demo/mission-package.json",
      "ok": true,
      "merge": false,
      "counts": {
        "missions": 1,
        "objectives": 1,
        "runnerRules": 1
      }
    }
  ]
}
```

常见 warning / error code：

```text
package.empty
mission.duplicate_id
objective.duplicate_id
objective.missing_mission
objective.missing_dependency
objective.missing_required_mission
objective.condition_missing_mission
objective.condition_missing_objective
runner_rule.duplicate_id
runner_rule.broad_event
runner_rule.disabled
runner_rule.missing_mission_action_target
runner_rule.missing_objective_action_target
package.load_failed
```

## Gameplay trigger / interaction bridge

世界对象的 trigger 和 interactable 会发出 `GameplayEvent`：

```ts
{
  sourceId: string,
  event: string,
  message: string,
  kind: "trigger" | "interaction"
}
```

mission package 里的 runner rule 可以直接监听这些事件：

```json
{
  "id": "complete-enter-lobby-trigger",
  "event": {
    "source": "gameplay",
    "kind": "trigger",
    "sourceId": "lobby-trigger",
    "event": "lobby:enter"
  },
  "action": {
    "kind": "objective",
    "id": "enter-lobby",
    "status": "completed"
  },
  "once": true,
  "enabled": true
}
```

## 已知边界

- 0.41 仍然只是 Mission package validation / diagnostics report scaffold，不是完整诊断 UI。
- diagnostics 目前主要检查 authoring document 内部引用关系，不检查世界对象、trigger sourceId 是否真实存在。
- package 目前只支持 JSON authoring document，不支持压缩包、签名、版本依赖解析或远程 registry。
- 有 error 的 package 不会 apply；warning 不会阻止 apply。
- authoring document 仍只保存任务设计内容，不保存 player / agent / world object runtime state。
- package 可以包含 runner rules，但仍没有专门的可视化规则编辑器。
- HUD 只在 large world 且 NavMesh gameplay API 可用时安装。
- event buffer 只按条数限制，不按内存大小限制。
- 仍然没有局部避障、动态障碍或 agent-agent avoidance。
- agent 仍沿 route points 直线移动，没有 funnel smoothing。

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
- [x] Recast/Detour-style runtime path query scaffold
- [x] Route query API for gameplay systems
- [x] NPC agent movement controller scaffold
- [x] Agent debug visualizer / click-to-move demo
- [x] Agent registry / automatic engine-loop integration
- [x] Agent events / arrival callbacks
- [x] Agent event buffer limits / mission hook scaffold
- [x] Mission state persistence scaffold
- [x] Mission graph / objective dependency scaffold
- [x] Mission runtime runner / auto-progress hooks
- [x] Mission editor panel / debug HUD scaffold
- [x] Gameplay trigger event bridge for mission runner
- [x] Mission authoring save format scaffold
- [x] Mission package loader / URL manifest hook
- [x] Mission package validation / diagnostics report
- [ ] Mission diagnostics HUD panel

## 依赖与许可证

- Spark：MIT
- Three.js：MIT
- Rapier：Apache-2.0

项目本身使用 MIT License。导入场景、GLB、音频、训练模型与数据集仍需分别确认授权。
