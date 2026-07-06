# Splat World Engine — Mission Package Loader

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.40 在 0.39 的 Mission authoring format 之上新增 Mission package loader / URL manifest hook：large world manifest 和 URL 参数现在可以自动加载 mission authoring document，让任务设计内容能随世界启动一起注入 Runtime。

```text
RuntimeNavMissionAuthoringDocument
  ├── metadata
  ├── missions
  ├── objectives
  └── runnerRules

RuntimeNavMissionPackageLoader
  ├── normalizeRuntimeNavMissionPackageReferences(refs, baseUrl)
  └── loadRuntimeNavMissionPackages(options)

LargeWorldBootstrap
  ├── manifest.missionPackage
  ├── manifest.missionPackages[]
  ├── ?mission=/path/to/package.json
  └── ?missionPackage=/path/to/package.json
```

## Runtime/Builder 0.40 能力

- 新增 `src/large/NavMissionPackageLoader.ts`
- large world manifest 新增：
  - `missionPackage?: string`
  - `missionPackages?: Array<string | { url: string, merge?: boolean }>`
- URL 参数新增：
  - `mission=/path/to/mission-package.json`
  - `missionPackage=/path/to/mission-package.json`
- 支持多个 mission package：
  - manifest package 先加载
  - URL package 后加载
  - 第一个 package 默认 replace 当前 mission authoring 内容
  - 后续 package 默认 merge
  - manifest entry 可以用 `{ "url": "...", "merge": true }` 显式指定
- `LargeWorldBootstrap` 会在 NavMesh gameplay API 创建后自动加载 mission package
- Mission HUD 安装在 package 加载之后，因此打开 HUD 能直接看到导入后的 missions / objectives / runner rules
- large demo 新增：
  - `public/worlds/large-demo/mission-package.json`
  - `world.json` 挂载 `missionPackage: "./mission-package.json"`
- Runtime status / ready toast 会显示 mission package 数量
- package version 更新为 `0.40.0`
- Runtime label 更新为 `runtime 0.40`

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

验证：

```bash
npm run typecheck
npm run build
npm run preview
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

- 0.40 仍然只是 Mission package loader / URL manifest hook scaffold，不是完整任务包发布系统。
- package 目前只支持 JSON authoring document，不支持压缩包、签名、版本依赖解析或远程 registry。
- package 加载失败会被跳过并显示 toast，不会阻止 world runtime 启动。
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
- [ ] Mission package validation / diagnostics report

## 依赖与许可证

- Spark：MIT
- Three.js：MIT
- Rapier：Apache-2.0

项目本身使用 MIT License。导入场景、GLB、音频、训练模型与数据集仍需分别确认授权。
