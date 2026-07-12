# Splat World Engine — Mission Diagnostics Policy HUD Panel Wiring

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.62 将 0.61 的 Mission diagnostics policy manifest HUD download action 接入 `NavMissionDebugPanel`：Mission HUD 现在可以直接使用当前 manifest 文本、所选 package target 和 editor policy 下载完整 patched manifest artifact。

```text
Mission diagnostics manifest HUD panel wiring
  ├── source manifest textarea
  ├── selected manifest target
  ├── current editor severityPolicy
  ├── manifest actions
  │   ├── copy focused manifest
  │   ├── copy JSON patch
  │   ├── copy patched manifest
  │   ├── download patched manifest
  │   ├── apply patch to textarea
  │   ├── import policy
  │   └── import + apply
  └── HUD status feedback
      ├── downloaded filename + target
      └── download failure message
```

## Runtime/Builder 0.62 能力

- 在 `src/large/NavMissionDebugPanel.ts` 中接入 `createRuntimeNavMissionDiagnosticsManifestHudDownloadButton`。
- 在 manifest actions 区域新增 `Download manifest` 按钮。
- 下载 action 使用当前：
  - source manifest textarea 内容
  - selected manifest package target
  - editor 生成的 `severityPolicy`
- 点击按钮后：
  - 生成完整 patched manifest authoring artifact
  - 通过浏览器下载 artifact
  - 通过现有 manifest status 区域显示成功或失败信息
  - 通过 `onArtifact` 输出 artifact diagnostics 到 console
- 继续支持顶层 `severityPolicy` 和 `missionPackages[index].severityPolicy` target。
- 继续保留：
  - editor presets 与 custom overrides
  - apply / reload workflow
  - shareable URL export
  - manifest export / import workflow
  - package target picker
  - patch preview
  - patch copy / apply workflow
  - manifest save / authoring workflow
  - reusable HUD download action
- package version 更新为 `0.62.0`。
- Runtime label 更新为 `runtime 0.62`。

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
- [x] Mission diagnostics policy manifest HUD panel wiring
- [ ] Mission diagnostics policy manifest download summary preview

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

## HUD 下载流程

在 Mission HUD 的 manifest editor 中：

1. 将 large world manifest JSON 粘贴到 manifest textarea。
2. 通过 `manifest target` 选择顶层 policy 或目标 `missionPackages[index]`。
3. 使用 preset 和 custom overrides 生成当前 editor policy。
4. 点击 `Download manifest`。
5. 浏览器下载完整 patched manifest artifact。

成功状态示例：

```text
Downloaded mission-package.diagnostics-policy.manifest.json for missionPackages[0].
```

失败状态示例：

```text
Download failed: <error message>
```

下载成功时，panel 还会通过 `onArtifact` 将 artifact 输出到 console，方便检查：

```ts
{
  filename,
  target,
  operation,
  jsonPatch,
  manifestText,
}
```

## Panel wiring

`NavMissionDebugPanel` 使用当前 render cycle 中的值创建 download button：

```ts
const downloadButton = createRuntimeNavMissionDiagnosticsManifestHudDownloadButton({
  sourceManifestText,
  packageIndex,
  policy: selection.policy,
  onArtifact: (artifact) => {
    console.info("Mission diagnostics manifest downloaded", artifact);
  },
  onStatus: (message) => {
    this.diagnosticsPolicyManifestMessage = message;
    this.renderDiagnosticsPolicyEditor();
  },
});
```

该 wiring 复用已有 manifest status UI，不创建独立的下载状态容器。

## 已知边界

- 下载是浏览器侧 authoring artifact，不会直接写回仓库、package authoring 文件或远程 registry。
- `Download manifest` 依赖浏览器 `Blob`、object URL 和 anchor download 行为。
- 如果 source manifest JSON 无效，底层 authoring helper 会抛出错误，并在现有 manifest status 区域显示失败信息。
- source manifest 为空时，authoring helper 会生成包含默认 mission package entry 的 manifest。
- 文件名使用 `*.diagnostics-policy.manifest.json`。
- 当前 panel 只显示下载结果状态；artifact summary preview 是下一项 checklist。
- authoring document 只保存任务设计内容，不保存 player / agent / world object runtime state。
