# Splat World Engine — Mission Diagnostics Policy Manifest Save / Authoring

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.60 在 0.59 的 manifest patch copy/apply polish 之上，新增 Mission diagnostics policy manifest authoring save helper：可以把当前 manifest、目标 package 和 editor policy 组合成可保存的 authoring artifact，并提供浏览器下载入口。

```text
Mission diagnostics manifest authoring
  ├── source large world manifest JSON
  ├── selected target
  │   ├── top-level severityPolicy
  │   └── missionPackages[index].severityPolicy
  ├── editor severityPolicy
  ├── JSON Patch-style operations
  ├── full patched manifest JSON
  └── downloadable authoring artifact
```

## Runtime/Builder 0.60 能力

- 新增 `src/large/NavMissionDiagnosticsManifestAuthoring.ts`。
- 新增 `createRuntimeNavMissionDiagnosticsManifestAuthoringArtifact(input)`：
  - 解析 source manifest JSON。
  - 根据 `packageIndex` 定位顶层 `severityPolicy` 或 `missionPackages[index].severityPolicy`。
  - 根据当前 editor `policy` 生成 `add` / `replace` / `remove` / `noop` 操作。
  - 输出 reviewable `jsonPatch`。
  - 输出完整 patched manifest JSON。
  - 输出适合保存的文件名。
- 新增 `downloadRuntimeNavMissionDiagnosticsManifestArtifact(artifact)`：
  - 使用浏览器 `Blob` + object URL 下载 authoring JSON。
  - 下载文件名格式为 `*.diagnostics-policy.manifest.json`。
- 继续保留：
  - shareable URL export
  - manifest export scaffold
  - manifest import / apply workflow
  - package target picker
  - patch preview
  - patch copy / apply polish
- package version 更新为 `0.60.0`。
- Runtime label 更新为 `runtime 0.60`。

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
- [ ] Mission diagnostics policy manifest HUD download integration

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

## Authoring save helper

0.60 的 authoring save workflow 以可复用 helper 形式落地：

```ts
import {
  createRuntimeNavMissionDiagnosticsManifestAuthoringArtifact,
  downloadRuntimeNavMissionDiagnosticsManifestArtifact,
} from "./large/NavMissionDiagnosticsManifestAuthoring";

const artifact = createRuntimeNavMissionDiagnosticsManifestAuthoringArtifact({
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
});

downloadRuntimeNavMissionDiagnosticsManifestArtifact(artifact);
```

生成的 artifact 结构：

```ts
export interface RuntimeNavMissionDiagnosticsManifestAuthoringArtifact {
  filename: string;
  target: string;
  operation: "add" | "replace" | "remove" | "noop";
  jsonPatch: RuntimeNavMissionDiagnosticsManifestJsonPatchOperation[];
  manifestText: string;
}
```

## Save operation 语义

当目标 manifest 没有 `severityPolicy`，当前 editor policy 非空：

```text
operation: add
path: /missionPackages/0/severityPolicy
```

当目标 manifest 已有 `severityPolicy`，当前 editor policy 非空：

```text
operation: replace
path: /missionPackages/0/severityPolicy
```

当目标 manifest 已有 `severityPolicy`，当前 editor policy 为空：

```text
operation: remove
path: /missionPackages/0/severityPolicy
```

当目标 manifest 没有 `severityPolicy`，当前 editor policy 也为空：

```text
operation: noop
jsonPatch: []
```

顶层 policy 使用路径：

```text
/severityPolicy
```

package-level policy 使用路径：

```text
/missionPackages/{index}/severityPolicy
```

## 文件名规则

如果目标是 package entry，文件名从 package `url` 推导：

```text
./mission-package.json
→ mission-package.diagnostics-policy.manifest.json
```

如果目标是顶层 `severityPolicy`，文件名为：

```text
large-world-manifest.diagnostics-policy.manifest.json
```

## 已知边界

- 0.60 是 authoring save helper，不是远程 registry 写入能力。
- 浏览器下载使用 `Blob` + object URL；不会自动写回项目源码文件。
- HUD 目前已有 patch preview / copy / apply-to-textarea workflow；直接 HUD download button 是下一步。
- helper 会在 source manifest JSON 无效或为空时回退到默认 `missionPackages[0]` scaffold。
- package entry 缺少 `url` 或 `merge` 时会补默认值，保证保存 artifact 可读。
- Import + apply 仍只 reload 当前 runtime mission packages，不会保存 policy。
- shareable URL 仍只导出 preset 和 code overrides，不完整表达 manifest authoring artifact。
- presets 目前是内置静态列表，还没有从外部 manifest 或 editor plugin 注册自定义 preset。
- package 目前只支持 JSON authoring document，不支持压缩包、签名、版本依赖解析或远程 registry。
- authoring document 仍只保存任务设计内容，不保存 player / agent / world object runtime state。
