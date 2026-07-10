# Splat World Engine — Mission Diagnostics Policy Patch Preview

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.58 在 0.57 的 Mission diagnostics policy manifest package target picker 之上，给 Mission editor / debug HUD 增加 manifest package patch preview：可以针对选中的 `missionPackages[]` target 预览即将写入或移除的 `severityPolicy` patch，并复制 patch 供人工写回 manifest。

```text
NavMissionDebugPanel
  └── Package diagnostics
      ├── Diagnostics preset <select>
      ├── known diagnostic code <select>
      ├── severity <select>
      ├── generated merged severityPolicy preview
      ├── Shareable URL
      │   ├── Copy URL
      │   └── Update address
      ├── Manifest snippet
      │   ├── missionPackages[] target <select>
      │   ├── focused manifest snippet preview
      │   ├── Patch preview
      │   ├── paste/import textarea
      │   ├── Copy manifest
      │   ├── Copy patch
      │   ├── Import policy
      │   └── Import + apply
      └── Apply + reload

Manifest package patch preview
  └── selected package target
      ├── operation: add / replace / remove / noop
      ├── before severityPolicy
      ├── after severityPolicy
      └── patched package entry preview
```

## Runtime/Builder 0.58 能力

- 在 `src/large/NavMissionDebugPanel.ts` 新增 manifest package patch preview。
- Manifest snippet 区域现在会同时展示：
  - selected `missionPackages[] target`
  - focused manifest snippet
  - patch preview
- patch preview 会根据当前 editor policy 和选中 target 生成：
  - `target`
  - `operation`
  - `before`
  - `after`
  - patched `package`
- `operation` 语义：
  - `add`：目标原本没有 `severityPolicy`，当前 editor policy 非空
  - `replace`：目标已有 `severityPolicy`，当前 editor policy 非空
  - `remove`：目标已有 `severityPolicy`，当前 editor policy 为空
  - `noop`：目标没有 `severityPolicy`，当前 editor policy 也为空
- 新增 `Copy patch`：把 patch preview 复制到 clipboard。
- 继续保留：
  - shareable URL export
  - manifest export scaffold
  - manifest import / apply workflow
  - package target picker
  - direct `Apply + reload`
- package version 更新为 `0.58.0`。
- Runtime label 更新为 `runtime 0.58`。

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
- [ ] Mission diagnostics policy manifest package patch copy/apply polish

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

使用 gameplay-strict preset：

```text
http://localhost:5173?world=/worlds/large-demo/world.json&missionDebug=1&missionDiagnosticsPreset=gameplay-strict
```

基于 preset 继续通过 URL 覆盖某个 diagnostic code：

```text
http://localhost:5173?world=/worlds/large-demo/world.json&missionDebug=1&missionDiagnosticsPreset=gameplay-strict&missionDiagnosticSeverity=gameplay_source.missing_trigger:warning
```

查看完整 diagnostics report：

```js
window.splatWorld.missionPackages
```

验证：

```bash
npm run typecheck
npm run build
npm run preview
```

## Manifest package patch preview 行为

可以粘贴一个包含多个 `missionPackages[]` entry 的 large world manifest：

```json
{
  "missionPackages": [
    {
      "url": "./mission-package-a.json",
      "merge": true
    },
    {
      "url": "./mission-package-b.json",
      "merge": true,
      "severityPolicy": {
        "codes": {
          "gameplay_source.missing_trigger": "warning"
        }
      }
    }
  ]
}
```

HUD 会生成 target 选项：

```text
#0 · ./mission-package-a.json · built-in
#1 · ./mission-package-b.json · severityPolicy
```

选择 `#1` 后，如果当前 editor policy 非空，patch preview 会类似：

```json
{
  "target": "missionPackages[1]",
  "operation": "replace",
  "before": {
    "codes": {
      "gameplay_source.missing_trigger": "warning"
    }
  },
  "after": {
    "codes": {
      "gameplay_source.missing_trigger": "warning",
      "gameplay_source.missing_interaction": "error"
    }
  },
  "package": {
    "url": "./mission-package-b.json",
    "merge": true,
    "severityPolicy": {
      "codes": {
        "gameplay_source.missing_trigger": "warning",
        "gameplay_source.missing_interaction": "error"
      }
    }
  }
}
```

如果当前 editor policy 是 built-in defaults，而目标 package 已有 `severityPolicy`，patch preview 会显示 `operation: "remove"`，并在 patched package entry 中移除 `severityPolicy`。

## Manifest package target picker 行为

`missionPackages[] target` 下拉会从粘贴 JSON 中解析：

- package index
- package `url`
- 当前 target 是否包含 `severityPolicy`

`Copy manifest` 会输出 focused snippet，只包含选中的 package entry。`Copy patch` 会输出 patch preview，便于人工审阅要写回 manifest 的变化。

## Manifest import / apply 行为

Policy editor 生成的 selection 结构仍然是：

```ts
export interface RuntimeNavMissionDiagnosticsPolicyEditorSelection {
  preset: RuntimeNavMissionDiagnosticsPolicyEditorPresetSelection;
  overrides: Partial<Record<string, RuntimeNavMissionPackageDiagnosticSeverity>>;
  policy: RuntimeNavMissionDiagnosticsSeverityPolicy | null;
}
```

Manifest import 支持顶层 `severityPolicy`：

```json
{
  "severityPolicy": {
    "warningAsError": true,
    "hideInfo": true,
    "codes": {
      "gameplay_source.missing_trigger": "error"
    }
  }
}
```

也支持 package-level `severityPolicy`，并由 target picker 决定具体读取哪个 `missionPackages[index]`。

`Import policy` 只导入到当前 HUD editor，不会 reload package；`Import + apply` 会先导入，再执行现有 reload callback：

```ts
onDiagnosticsPolicyApply: (selection) => installMissionPackages(navApi, manifest, selection.policy)
```

reload 成功后会回填 report：

```ts
missionDebugPanel?.setMissionPackages(report);
window.splatWorld.missionPackages = report;
```

## Shareable URL 行为

Shareable URL export 使用 selection 的 `preset.id` 和 `overrides` 生成 URL 参数：

```text
missionDiagnosticsPreset=gameplay-strict
missionDiagnosticSeverity=gameplay_source.missing_trigger:warning
```

`Copy URL` 会把这个链接写入 clipboard；`Update address` 会用 `history.replaceState` 更新地址栏。刷新页面后，loader 会重新按 URL policy 解析顺序加载 diagnostics policy。

## URL preset 合并顺序

Runtime URL 仍然支持：

```text
missionDiagnosticsPreset=quiet|strict|gameplay-strict|authoring-strict
```

URL 解析顺序：

1. preset 先生成 base policy
2. `missionDiagnosticSeverity=code:severity` 可以覆盖 preset 的 code
3. `missionDiagnosticsStrict=1` / `missionDiagnosticsNoInfo=1` 可以继续叠加

Shareable URL export 会优先使用 `missionDiagnosticsPreset` 和 `missionDiagnosticSeverity`，不主动导出 legacy shorthand `missionDiagnosticsStrict` / `missionDiagnosticsNoInfo`。

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
package.summary
package.load_failed
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
```

## 已知边界

- 0.58 是 Mission diagnostics policy manifest package patch preview，不是完整 manifest authoring / save workflow。
- Patch preview 只生成审阅用 JSON；不会直接写回 manifest 文件、package authoring 文件或远程 registry。
- `Copy patch` 依赖浏览器 clipboard API；不可用时可以手动选择 patch preview 文本。
- `Copy manifest` 输出的是 focused snippet，不是完整 large world manifest。
- 如果粘贴 JSON 无效或没有 `missionPackages[]`，target picker 会回退到默认 `./mission-package.json` scaffold。
- 顶层 `severityPolicy` 仍可导入；package patch preview 主要面向 `missionPackages[]` entry。
- Import + apply 会 reload 当前 runtime mission packages，但不会保存 policy。
- 导入的 `warningAsError` / `hideInfo` 可以保留在 editor policy 和 apply workflow 中，但 shareable URL 仍只导出 preset 和 code overrides。
- 手动修改 preset / custom overrides 会退出 manifest imported exact-policy 模式。
- `default` preset 且没有 custom overrides 时 snippet 会省略 `severityPolicy`，表示使用 Runtime 内置 diagnostics severity。
- presets 目前是内置静态列表，还没有从外部 manifest 或 editor plugin 注册自定义 preset。
- package 目前只支持 JSON authoring document，不支持压缩包、签名、版本依赖解析或远程 registry。
- authoring document 仍只保存任务设计内容，不保存 player / agent / world object runtime state。
- package 可以包含 runner rules，但仍没有专门的可视化规则编辑器。
- HUD 只在 large world 且 NavMesh gameplay API 可用时安装。
