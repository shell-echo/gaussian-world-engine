# Splat World Engine — Mission Diagnostics Severity Policy

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.45 在 0.44 的 gameplay event-name validation 之上新增 Mission package diagnostics severity policy：diagnostics 不再只能使用内置 severity，调用方可以按 diagnostic code 调整 severity、把 warning 统一升级为 error，或者隐藏 info 级诊断。

```text
RuntimeNavMissionPackageLoader
  ├── validateRuntimeNavMissionPackageDocument(document, url, { severityPolicy })
  ├── loadRuntimeNavMissionPackages({ severityPolicy })
  └── applyRuntimeNavMissionPackageDiagnosticsSeverityPolicy(diagnostics, policy)

RuntimeNavMissionDiagnosticsSeverityPolicy
  ├── codes{diagnosticCode:severity}
  ├── warningAsError
  └── hideInfo
```

## Runtime/Builder 0.45 能力

- 新增 `RuntimeNavMissionDiagnosticsSeverityPolicy`
- `RuntimeNavMissionPackageValidationOptions` 新增：
  - `severityPolicy?: RuntimeNavMissionDiagnosticsSeverityPolicy | null`
- `RuntimeNavMissionPackageLoadOptions` 同样支持 `severityPolicy`
- 新增 helper：
  - `applyRuntimeNavMissionPackageDiagnosticsSeverityPolicy(diagnostics, policy)`
- policy 支持：
  - `codes`：按 diagnostic code 覆盖 severity
  - `warningAsError`：把所有 warning 升级为 error
  - `hideInfo`：从 report 中移除 info diagnostics
- package 是否 apply 现在会基于 policy 后的 severity 判断
- report 的 `warnings` / `errors` / `ok` 统计也基于 policy 后的 diagnostics
- package version 更新为 `0.45.0`
- Runtime label 更新为 `runtime 0.45`

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

查看完整 diagnostics report：

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

## Severity policy 示例

把某个 warning 提升为 error：

```ts
await loadRuntimeNavMissionPackages({
  nav,
  packages,
  gameplaySources,
  severityPolicy: {
    codes: {
      "gameplay_source.missing_trigger": "error"
    }
  }
});
```

把所有 warning 视为 error：

```ts
await loadRuntimeNavMissionPackages({
  nav,
  packages,
  severityPolicy: {
    warningAsError: true
  }
});
```

隐藏 info diagnostics：

```ts
const diagnostics = applyRuntimeNavMissionPackageDiagnosticsSeverityPolicy(rawDiagnostics, {
  hideInfo: true
});
```

注意：如果 policy 把某个 diagnostic 调整为 `error`，对应 package 会被视为 failed package，不会 apply 到 runtime mission graph。

## Gameplay sourceId + event validation

world 里的 trigger collider：

```json
{
  "id": "lobby-trigger",
  "type": "box",
  "size": [4, 2, 4],
  "behavior": {
    "mode": "trigger",
    "event": "lobby:enter",
    "message": "Entered lobby"
  }
}
```

world 里的 interactable collider：

```json
{
  "id": "note-001",
  "type": "box",
  "size": [0.4, 0.4, 0.4],
  "interactable": {
    "prompt": "Read note",
    "event": "note:read",
    "message": "Read the note"
  }
}
```

mission package 里的 runner rule 会被校验：

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

## Mission diagnostics HUD panel

HUD 会展示四个诊断指标：

```text
Packages · Loaded · Warn · Errors
```

诊断列表展示策略：

```text
1. 优先显示 warning / error
2. 如果没有 warning / error，显示 info summary
3. 最多显示 missionDiagnostics 指定数量，默认 6 条
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
gameplay_source.missing_trigger
gameplay_source.missing_interaction
gameplay_source.missing_source_id
gameplay_source.trigger_event_mismatch
gameplay_source.interaction_event_mismatch
package.load_failed
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

## 已知边界

- 0.45 是 severity policy scaffold，不是完整 policy authoring UI。
- policy 目前在 loader API 层生效，Runtime URL / manifest 级 policy hook 会在下一阶段补上。
- `hideInfo` 会移除 info diagnostics，因此 info summary 不会出现在 report / HUD 中。
- 如果 policy 把 warning 升级为 error，package 会被阻止 apply。
- package 目前只支持 JSON authoring document，不支持压缩包、签名、版本依赖解析或远程 registry。
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
- [x] Mission diagnostics HUD panel
- [x] Mission package sourceId validation against world gameplay objects
- [x] Mission package gameplay event-name validation
- [x] Mission package diagnostics severity policy
- [ ] Mission diagnostics policy URL / manifest hook

## 依赖与许可证

- Spark：MIT
- Three.js：MIT
- Rapier：Apache-2.0

项目本身使用 MIT License。导入场景、GLB、音频、训练模型与数据集仍需分别确认授权。
