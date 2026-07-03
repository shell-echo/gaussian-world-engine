# Splat World Engine — Mission Authoring Format

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.39 在 0.38 的 gameplay trigger bridge 之上新增 Mission authoring save format scaffold：可以把 mission state seed、objective graph 和 mission runner rules 打包成一个 authoring document，用于导出、导入、复用任务设计内容。

```text
RuntimeNavMissionState
  ├── createMission(draft)
  ├── completeMission(id)
  ├── exportState()
  └── restoreState(save)

RuntimeNavMissionGraph
  ├── createObjective(draft)
  ├── completeObjective(id)
  ├── snapshot(missionState)
  ├── exportGraph()
  └── restoreGraph(graph)

RuntimeNavMissionRunner
  ├── handleAgentEvent(event)
  ├── handleGameplayEvent(event)
  ├── run()
  └── snapshot()

RuntimeNavMissionAuthoringDocument
  ├── metadata
  ├── missions
  ├── objectives
  └── runnerRules
```

## Runtime/Builder 0.39 能力

- 新增 `src/large/NavMissionAuthoring.ts`
- 新增 `RUNTIME_NAV_MISSION_AUTHORING_SCHEMA_VERSION = 1`
- 新增 `RuntimeNavMissionAuthoringDocument`
- authoring document 字段：
  - `schemaVersion`
  - `savedAt`
  - `metadata`
  - `missions`
  - `objectives`
  - `runnerRules`
- metadata 支持：
  - `id`
  - `title`
  - `description`
  - `version`
  - `tags`
- authoring helper：
  - `createRuntimeNavMissionAuthoringDocument(draft)`
  - `exportRuntimeNavMissionAuthoringDocument(source, metadata)`
  - `parseRuntimeNavMissionAuthoringDocument(input)`
  - `applyRuntimeNavMissionAuthoringDocument(target, input, options)`
- `RuntimeNavGameplayApi` 新增：
  - `exportMissionAuthoring(metadata)`
  - `restoreMissionAuthoring(input, options)`
- `restoreMissionAuthoring(input, { merge: true })` 支持增量合并
- 默认 restore 会清空当前 missions、objectives、runner rules，再导入 authoring document
- authoring format 只保存任务设计内容，不保存 agent 位置、事件计数、`completedAt` / `failedAt` 等运行时状态
- package version 更新为 `0.39.0`
- Runtime label 更新为 `runtime 0.39`

## 运行 Runtime

```bash
npm install
npm run dev
```

大场景 click-to-move 示例：

```text
http://localhost:5173?world=/worlds/large-demo/world.json&clickToMove=1
```

打开 Mission HUD：

```text
http://localhost:5173?world=/worlds/large-demo/world.json&clickToMove=1&missionDebug=1
```

验证：

```bash
npm run typecheck
npm run build
npm run preview
```

## Event buffer limit

默认最多保留最近 128 条 agent event。可以在运行时调整：

```js
window.splatWorld.navMesh.setAgentEventLimit(32)
```

查看状态：

```js
window.splatWorld.navMesh.snapshotAgents()
```

读取并清空 pending events：

```js
const events = window.splatWorld.navMesh.drainAgentEvents()
```

## Mission state persistence scaffold

创建一个任务：

```js
window.splatWorld.navMesh.createMission({
  id: "quest-arrive-home",
  status: "active",
  progress: 0,
  data: {
    title: "走到安全屋",
    targetAgentId: "npc-001"
  }
})
```

导出并保存 runtime save：

```js
const save = window.splatWorld.navMesh.exportMissionState()
localStorage.setItem("swe:mission-state", JSON.stringify(save))
```

恢复 runtime save：

```js
const save = localStorage.getItem("swe:mission-state")
if (save) window.splatWorld.navMesh.restoreMissionState(save)
```

## Mission graph / objective dependency scaffold

创建一个 mission 和两个 objective：

```js
window.splatWorld.navMesh.createMission({
  id: "escape-house",
  status: "active",
  data: {
    title: "逃出房子"
  }
})

window.splatWorld.navMesh.createObjective({
  id: "find-key",
  missionId: "escape-house",
  title: "找到钥匙"
})

window.splatWorld.navMesh.createObjective({
  id: "open-door",
  missionId: "escape-house",
  title: "打开大门",
  dependsOn: ["find-key"]
})
```

完成第一个 objective 后，第二个 objective 会进入 ready：

```js
window.splatWorld.navMesh.completeObjective("find-key")
window.splatWorld.navMesh.snapshotMissionGraph().readyObjectiveIds
// ["open-door"]
```

## Mission runtime runner / auto-progress hooks

创建一个 objective，并让 debug agent 到达目标后自动完成它：

```js
window.splatWorld.navMesh.createObjective({
  id: "reach-safe-room",
  title: "走到安全屋"
})

window.splatWorld.navMesh.addMissionRunnerRule({
  id: "complete-safe-room-on-arrive",
  event: {
    source: "agent",
    type: "arrived",
    agentId: "debug-click-agent"
  },
  action: {
    kind: "objective",
    id: "reach-safe-room",
    status: "completed",
    data: {
      source: "agent-arrived"
    }
  },
  once: true
})
```

手动运行一次 runner，用于激活当前已经 ready 的 objectives：

```js
window.splatWorld.navMesh.runMissionRunner()
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

现在可以用 gameplay event 自动推进任务：

```js
window.splatWorld.navMesh.createObjective({
  id: "enter-lobby",
  title: "进入大厅"
})

window.splatWorld.navMesh.addMissionRunnerRule({
  id: "complete-enter-lobby-trigger",
  event: {
    source: "gameplay",
    kind: "trigger",
    sourceId: "lobby-trigger",
    event: "lobby:enter"
  },
  action: {
    kind: "objective",
    id: "enter-lobby",
    status: "completed",
    data: {
      source: "gameplay-trigger"
    }
  },
  once: true
})
```

也可以监听交互事件：

```js
window.splatWorld.navMesh.addMissionRunnerRule({
  id: "complete-read-note",
  event: {
    source: "gameplay",
    kind: "interaction",
    sourceId: "note-001",
    event: "note:read"
  },
  action: {
    kind: "objective",
    id: "read-note",
    status: "completed"
  }
})
```

## Mission authoring save format scaffold

导出当前任务设计内容：

```js
const authoredMission = window.splatWorld.navMesh.exportMissionAuthoring({
  id: "escape-house-pack",
  title: "Escape House",
  version: "0.1.0",
  tags: ["demo", "indoor"]
})

localStorage.setItem("swe:mission-authoring", JSON.stringify(authoredMission))
```

导入任务设计内容：

```js
const authoredMission = localStorage.getItem("swe:mission-authoring")
if (authoredMission) {
  window.splatWorld.navMesh.restoreMissionAuthoring(authoredMission)
}
```

增量合并导入：

```js
window.splatWorld.navMesh.restoreMissionAuthoring(authoredMission, {
  merge: true
})
```

一个 authoring document 的形状：

```json
{
  "schemaVersion": 1,
  "savedAt": 1772520000000,
  "metadata": {
    "id": "escape-house-pack",
    "title": "Escape House",
    "version": "0.1.0",
    "tags": ["demo", "indoor"]
  },
  "missions": [
    {
      "id": "escape-house",
      "status": "active",
      "progress": 0,
      "data": {
        "title": "逃出房子"
      }
    }
  ],
  "objectives": [
    {
      "id": "find-key",
      "missionId": "escape-house",
      "title": "找到钥匙"
    }
  ],
  "runnerRules": [
    {
      "id": "complete-find-key",
      "event": {
        "source": "gameplay",
        "kind": "interaction",
        "sourceId": "key-001",
        "event": "item:collect"
      },
      "action": {
        "kind": "objective",
        "id": "find-key",
        "status": "completed"
      },
      "once": true,
      "enabled": true
    }
  ]
}
```

## Mission debug HUD scaffold

打开 HUD 后可以直接点 `Seed Demo`，它会创建一个 demo mission、objective 和 runner rule。触发器、交互事件和 agent event 都会显示在同一个最近 event 列表里。

## 已知边界

- 0.39 仍然只是 mission authoring save format scaffold，不是完整任务编辑器或任务包发布系统。
- authoring document 保存设计内容，不保存 player / agent / world object runtime state。
- authoring document 目前不包含 asset references、奖励、对话、背包、战斗或 trigger 可视化布局。
- runner rule 现在可以放进 authoring document，但仍没有专门的可视化规则编辑器。
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
- [ ] Mission package loader / URL manifest hook

## 依赖与许可证

- Spark：MIT
- Three.js：MIT
- Rapier：Apache-2.0

项目本身使用 MIT License。导入场景、GLB、音频、训练模型与数据集仍需分别确认授权。
