# Splat World Engine — Mission Diagnostics Policy Package Target Picker

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.57 在 0.56 的 Mission diagnostics policy manifest import / apply workflow 之上，给 Mission editor / debug HUD 增加 `missionPackages[]` target picker：可以从粘贴的 large world manifest 中选择具体 package entry，并针对该 package 导入 / 导出 / apply diagnostics `severityPolicy`。

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
      │   ├── paste/import textarea
      │   ├── Copy manifest
      │   ├── Import policy
      │   └── Import + apply
      └── Apply + reload

Manifest package target picker
  └── missionPackages[index]
      ├── url label
      ├── built-in / severityPolicy status
      ├── copy selected target snippet
      └── import selected target severityPolicy
```

## Runtime/Builder 0.57 能力

- 在 `src/large/NavMissionDebugPanel.ts` 新增 manifest package target picker。
- Manifest snippet 区域现在会从粘贴的 JSON 中解析 `missionPackages[]`。
- target picker 会展示：
  - package index
  - package `url`
  - 当前 target 是否包含 `severityPolicy`
- `Copy manifest` 会基于当前选中的 target 生成 focused snippet。
- `Import policy` 会导入选中 `missionPackages[index].severityPolicy`。
- `Import + apply` 会导入选中 target policy，并复用现有 `Apply + reload` callback。
- 如果选中的 package 没有 `severityPolicy`，会导入 built-in diagnostics policy。
- 继续保留：
  - shareable URL export
  - manifest export scaffold
  - manifest import / apply workflow
  - direct `Apply + reload`
- package version 更新为 `0.57.0`。
- Runtime label 更新为 `runtime 0.57`。

## Checklist

- [x] Mission diagnostics policy editor presets
- [x] Mission diagnostics editor preset picker UI
- [x] Mission diagnostics policy editor custom overrides UI
- [x] Mission diagnostics policy editor apply / reload workflow
- [x] Mission diagnostics policy editor shareable URL export
- [x] Mission diagnostics policy manifest export scaffold
- [x] Mission diagnostics policy manifest import / apply workflow
- [x] Mission diagnostics policy manifest package target picker
- [ ] Mission diagnostics policy manifest package patch preview

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

使用 quiet preset：

```text
http://localhost:5173?world=/worlds/large-demo/world.json&missionDebug=1&missionDiagnosticsPreset=quiet
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

## Manifest package target picker 行为

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
          "gameplay_source.missing_trigger": "warning",
          "gameplay_source.missing_interaction": "error"
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

选择 `#1` 后：

- `Copy manifest` 会输出 focused snippet，只包含选中的 package entry。
- 如果当前 editor policy 非空，会写入该 package 的 `severityPolicy`。
- 如果当前 editor policy 为空，会移除该 package 的 `severityPolicy`，表示使用 built-in diagnostics severity。
- `Import policy` 会读取 `missionPackages[1].severityPolicy` 并导入 editor。
- `Import + apply` 会导入后直接 reload 当前 runtime mission packages。

## Manifest import / apply 行为

Policy editor 生成的 selection 结构仍然是：

```ts
export interface RuntimeNavMissionDiagnosticsPolicyEditorSelection {
  preset: RuntimeNavMissionDiagnosticsPolicyEditorPresetSelection;
  overrides: Partial<Record<string, RuntimeNavMissionPackageDiagnosticSeverity>>;
  policy: RuntimeNavMissionDiagnosticsSeverityPolicy | null;
}
```

Manifest import 仍支持顶层 `severityPolicy`：

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

也支持 package-level `severityPolicy`，并由 target picker 决定具体读取哪个 `missionPackages[index]`：

```json
{
  "missionPackages": [
    {
      "url": "./mission-package.json",
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

`Import policy` 只导入到当前 HUD editor，不会 reload package；`Import + apply` 会先导入，再执行现有 reload callback：

```ts
onDiagnosticsPolicyApply: (selection) => installMissionPackages(navApi, manifest, selection.policy)
```

reload 成功后会回填 report：

```ts
missionDebugPanel?.setMissionPackages(report);
window.splatWorld.missionPackages = report;
```

## Manifest export 行为

Manifest snippet export 使用 selection 的 merged `policy` 生成 manifest scaffold：

```json
{
  "missionPackages": [
    {
      "url": "./mission-package.json",
      "merge": true,
      "severityPolicy": {
        "codes": {
          "gameplay_source.missing_trigger": "warning",
          "gameplay_source.missing_interaction": "error",
          "gameplay_source.missing_source_id": "error",
          "gameplay_source.trigger_event_mismatch": "error",
          "gameplay_source.interaction_event_mismatch": "error"
        }
      }
    }
  ]
}
```

如果当前 editor policy 是 built-in defaults，snippet 会省略 `severityPolicy`：

```json
{
  "missionPackages": [
    {
      "url": "./mission-package.json",
      "merge": true
    }
  ]
}
```

这个 snippet 是复制用 scaffold：需要把 `url` 替换成真实 mission package 地址，再合并到 large world manifest。

## Shareable URL 行为

Shareable URL export 使用 selection 的 `preset.id` 和 `overrides` 生成 URL 参数：

```text
missionDiagnosticsPreset=gameplay-strict
missionDiagnosticSeverity=gameplay_source.missing_trigger:warning
```

例如 editor 中选择 `gameplay-strict`，并把 `gameplay_source.missing_trigger` 覆盖回 `warning`，会生成类似：

```text
http://localhost:5173?world=/worlds/large-demo/world.json&missionDebug=1&missionDiagnosticsPreset=gameplay-strict&missionDiagnosticSeverity=gameplay_source.missing_trigger%3Awarning
```

`Copy URL` 会把这个链接写入 clipboard；`Update address` 会用 `history.replaceState` 更新地址栏。刷新页面后，loader 会重新按 URL policy 解析顺序加载 diagnostics policy。

## Policy editor 行为

picker 从内置 preset 列表生成选项：

```ts
import { RUNTIME_NAV_MISSION_DIAGNOSTICS_POLICY_PRESETS } from "./large/NavMissionDiagnosticsPolicyPresets";

for (const preset of RUNTIME_NAV_MISSION_DIAGNOSTICS_POLICY_PRESETS) {
  console.log(preset.id, preset.label, preset.description);
}
```

custom override code 列表来自 known-code registry：

```ts
import { RUNTIME_NAV_MISSION_KNOWN_DIAGNOSTIC_CODE_ENTRIES } from "./large/NavMissionDiagnosticsCodeRegistry";

for (const entry of RUNTIME_NAV_MISSION_KNOWN_DIAGNOSTIC_CODE_ENTRIES) {
  console.log(entry.code, entry.defaultSeverity, entry.description);
}
```

点击 `Apply + reload` 后，新的 policy 会重新决定 diagnostics severity 和 package apply decision。例如 strict policy 把 warning 升级为 error 后，存在 warning 的 package 可能不再 apply。

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

- 0.57 是 Mission diagnostics policy manifest package target picker，不是完整 manifest authoring / save workflow。
- Target picker 只在 HUD 内选择 `missionPackages[]` entry；不会写回 manifest 文件、package authoring 文件或远程 registry。
- `Copy manifest` 输出的是 focused snippet，不是完整 large world manifest patch。
- 如果粘贴 JSON 无效或没有 `missionPackages[]`，target picker 会回退到默认 `./mission-package.json` scaffold。
- 顶层 `severityPolicy` 仍可导入；这种情况下 target picker 只用于 package-level snippet export。
- Import + apply 会 reload 当前 runtime mission packages，但不会保存 policy。
- 导入的 `warningAsError` / `hideInfo` 可以保留在 editor policy 和 apply workflow 中，但 shareable URL 仍只导出 preset 和 code overrides。
- 手动修改 preset / custom overrides 会退出 manifest imported exact-policy 模式。
- Manifest snippet 使用 placeholder `./mission-package.json`；真实项目需要手动替换为实际 package URL。
- Copy manifest / Copy URL 依赖浏览器 clipboard API；不可用时可以手动选择 preview 文本。
- Shareable URL export 只导出 editor preset 和 custom overrides；不会写回 manifest、package authoring 文件或远程 registry。
- Apply / reload 重新执行 mission package loader；它不会自动把 editor policy 写回 URL，除非点击 `Update address`。
- 如果 stricter policy 让 package diagnostics 出现 error，该 package 不会 apply；已有 runtime mission state 不会被强制清空，避免一次错误编辑破坏当前调试现场。
- custom overrides 目前只覆盖 known-code registry 里的内置 diagnostic codes；插件自定义 code 暂时仍需要通过 JSON / URL / manifest 配置。
- presets 目前是内置静态列表，还没有从外部 manifest 或 editor plugin 注册自定义 preset。
- package 目前只支持 JSON authoring document，不支持压缩包、签名、版本依赖解析或远程 registry。
- authoring document 仍只保存任务设计内容，不保存 player / agent / world object runtime state。
- package 可以包含 runner rules，但仍没有专门的可视化规则编辑器。
- HUD 只在 large world 且 NavMesh gameplay API 可用时安装。
