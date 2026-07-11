# Splat World Engine — Mission Diagnostics Policy HUD Download Action

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.61 在 0.60 的 manifest save / authoring workflow helper 之上，新增 Mission diagnostics policy manifest HUD download action：把 authoring artifact 封装成 HUD 可挂载的 `Download manifest` 按钮逻辑，方便后续直接接入 `NavMissionDebugPanel` 的 manifest actions 区域。

```text
Mission diagnostics manifest HUD download
  ├── source large world manifest JSON
  ├── selected manifest target
  ├── editor severityPolicy
  ├── authoring artifact
  │   ├── filename
  │   ├── target
  │   ├── operation
  │   ├── jsonPatch
  │   └── manifestText
  └── HUD download action
      ├── create button
      ├── download artifact
      ├── emit artifact callback
      └── emit status callback
```

## Runtime/Builder 0.61 能力

- 新增 `src/large/NavMissionDiagnosticsManifestHudDownload.ts`。
- 新增 `createRuntimeNavMissionDiagnosticsManifestHudDownloadArtifact(input)`：
  - 复用 0.60 的 manifest authoring artifact helper。
  - 支持顶层 `severityPolicy` 和 `missionPackages[index].severityPolicy` target。
  - 输出可保存的完整 patched manifest artifact。
- 新增 `createRuntimeNavMissionDiagnosticsManifestHudDownloadSummary(input)`：
  - 输出 `filename`、`target`、`operation`、`jsonPatchCount`、`bytes`。
  - 适合 HUD 预览下载结果。
- 新增 `createRuntimeNavMissionDiagnosticsManifestHudDownloadButton(options)`：
  - 创建可挂载到 HUD 的 `Download manifest` button。
  - 点击后生成 artifact 并触发浏览器下载。
  - 支持 `onArtifact` 和 `onStatus` callback。
  - 下载失败时回传错误状态。
- 继续保留：
  - shareable URL export
  - manifest export scaffold
  - manifest import / apply workflow
  - package target picker
  - patch preview
  - patch copy / apply polish
  - manifest save / authoring workflow helper
- package version 更新为 `0.61.0`。
- Runtime label 更新为 `runtime 0.61`。

## Checklist

- [x] Mission diagnostics policy editor presets
- [x] Mission diagnostics editor preset picker UI
- [x] Mission diagnostics policy editor custom overrides UI
- [x] Mission diagnostics policy editor apply / reload workflow
- [x] Mission diagnostics policy editor shareable URL export
- [x] Mission diagnostics policy manifest export scaffold
- [x] Mission diagnostics policy manifest import / apply workflow
- [x] Mission diagnostics policy manifest package target picker
- [x] Mission diagnostics policy manifest package patch preview
- [x] Mission diagnostics policy manifest package patch copy/apply polish
- [x] Mission diagnostics policy manifest save / authoring workflow
- [x] Mission diagnostics policy manifest HUD download integration
- [ ] Mission diagnostics policy manifest HUD panel wiring

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

打开 Mission diagnostics policy editor：

```text
http://localhost:5173?world=/worlds/large-demo/world.json&missionDebug=1
```

验证：

```bash
npm run typecheck
npm run build
npm run preview
```

## HUD download action 用法

0.61 把 manifest save helper 包装成 HUD action，可以直接创建按钮：

```ts
import { createRuntimeNavMissionDiagnosticsManifestHudDownloadButton } from "./large/NavMissionDiagnosticsManifestHudDownload";

const button = createRuntimeNavMissionDiagnosticsManifestHudDownloadButton({
  sourceManifestText: JSON.stringify({
    missionPackages: [
      {
        url: "./mission-package.json",
        merge: true,
      },
    ],
  }),
  packageIndex: 0,
  policy: {
    codes: {
      "gameplay_source.missing_trigger": "warning",
      "gameplay_source.missing_interaction": "error",
    },
  },
  onStatus: (message) => console.info(message),
});

container.append(button);
```

也可以先生成 summary，用于 HUD 小提示：

```ts
import { createRuntimeNavMissionDiagnosticsManifestHudDownloadSummary } from "./large/NavMissionDiagnosticsManifestHudDownload";

const summary = createRuntimeNavMissionDiagnosticsManifestHudDownloadSummary({
  sourceManifestText,
  packageIndex,
  policy,
});

console.log(summary.filename, summary.operation, summary.bytes);
```

## 回调行为

`createRuntimeNavMissionDiagnosticsManifestHudDownloadButton` 支持两个回调：

```ts
onArtifact?: (artifact) => void;
onStatus?: (message) => void;
```

下载成功时：

```text
Downloaded mission-package.diagnostics-policy.manifest.json for missionPackages[0].
```

下载失败时：

```text
Download failed: <error message>
```

## 已知边界

- 0.61 提供 HUD download action 和可挂载按钮工厂；`NavMissionDebugPanel` 主面板接线会在下一步完成。
- 下载仍是浏览器侧 authoring artifact，不会直接写回仓库、package authoring 文件或远程 registry。
- `Download manifest` 依赖浏览器 `Blob`、object URL 和 anchor download 行为。
- 如果 source manifest JSON 无效，底层 authoring helper 会抛出错误，并通过 `onStatus` 返回失败信息。
- 文件名仍使用 `*.diagnostics-policy.manifest.json`。
- authoring document 仍只保存任务设计内容，不保存 player / agent / world object runtime state。
