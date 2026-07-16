# Splat World Engine — Mission Diagnostics Policy Manifest Validation JSON Report Copy

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.69 在 0.68 的 deterministic validation JSON report 之上，新增直接复制完整 JSON artifact 的 workflow：author 可以将与下载文件完全一致的 schema v1 JSON 粘贴到 issue、PR、聊天、CI 输入或外部诊断工具中。

```text
Mission diagnostics validation JSON copy
  ├── deterministic JSON artifact
  │   ├── schema identifier
  │   ├── schemaVersion = 1
  │   ├── target metadata
  │   ├── summary counts
  │   └── ordered issues
  ├── copy workflow
  │   ├── exact artifact.text
  │   ├── trailing newline preserved
  │   ├── Clipboard API validation
  │   └── optional onCopy callback
  └── HUD actions
      ├── Manifest validation details
      ├── Copy validation JSON
      └── Download validation JSON
```

## Runtime/Builder 0.69 能力

- 新增 `src/large/NavMissionDiagnosticsManifestHudValidationJsonReportCopy.ts`。
- 新增 `copyRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportArtifact(artifact)`：
  - 复制完整 `artifact.text`。
  - 保留两个空格缩进和末尾换行。
  - Clipboard API 不可用时抛出明确错误。
- 新增 `createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportCopyButton(...)`：
  - label：`Copy validation JSON`。
  - preview 显示 filename、schema version、issue count 与 UTF-8 byte size。
  - accessible label 包含完整 preview。
  - 支持 `onCopy` 和 `onStatus` 回调。
- Copy 与 Download 使用相同的 JSON artifact factory，因此相同 validation result 和 target 会产生完全相同的 JSON 文本。
- validation passed、warnings-only、blocking-error 与非法 package target 均可复制。
- HUD manifest actions 现在会依次挂载 validation details、JSON copy action 和 JSON download action。
- sibling 挂载改为逐个检查并补挂；某个节点已连接不会阻止其他 action 挂载。
- package version 更新为 `0.69.0`。
- Runtime label 更新为 `runtime 0.69`。

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
- [x] Mission diagnostics policy manifest download summary preview
- [x] Mission diagnostics policy manifest authoring validation
- [x] Mission diagnostics policy manifest validation HUD issue details
- [x] Mission diagnostics policy manifest validation issue copy workflow
- [x] Mission diagnostics policy manifest validation report download workflow
- [x] Mission diagnostics policy manifest validation JSON report workflow
- [x] Mission diagnostics policy manifest validation JSON report copy workflow
- [ ] Mission diagnostics policy manifest validation JSON report checksum workflow

## 运行 Runtime

```bash
npm install
npm run dev
```

打开大场景 Mission HUD：

```text
http://localhost:5173?world=/worlds/large-demo/world.json&clickToMove=1&missionDebug=1
```

验证：

```bash
npm run typecheck
npm run build
npm run preview
```

## Copy artifact API

```ts
import {
  copyRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportArtifact,
} from "./large/NavMissionDiagnosticsManifestHudValidationJsonReportCopy";
import {
  createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportArtifact,
} from "./large/NavMissionDiagnosticsManifestHudValidationJsonReport";

const artifact = createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportArtifact(
  validation,
  packageIndex,
);

await copyRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportArtifact(artifact);
```

复制内容与下载文件完全一致：

```json
{
  "schema": "splat-world-engine/mission-diagnostics-policy-manifest-validation",
  "schemaVersion": 1,
  "target": {
    "scope": "mission-package",
    "packageIndex": 0,
    "requestedPackageIndex": 0,
    "path": "$.missionPackages[0].severityPolicy"
  },
  "valid": false,
  "summary": {
    "issueCount": 1,
    "errors": 1,
    "warnings": 0
  },
  "issues": [
    {
      "severity": "error",
      "code": "mission_packages.not_array",
      "path": "$.missionPackages",
      "message": "missionPackages must be an array."
    }
  ]
}
```

Artifact text 使用两个空格缩进，并在最后一个 `}` 后保留一个换行字符。

## Copy button API

```ts
import {
  createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportCopyButton,
} from "./large/NavMissionDiagnosticsManifestHudValidationJsonReportCopy";

const copyButton = createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportCopyButton(
  validation,
  packageIndex,
  {
    onCopy: (artifact) => {
      console.log(artifact.filename, artifact.bytes);
    },
    onStatus: (message) => {
      manifestStatus.textContent = message;
    },
  },
);
```

`onCopy` 仅在 Clipboard 写入成功后调用，并接收已复制的完整 artifact。

## HUD integration

`createRuntimeNavMissionDiagnosticsManifestHudDownloadButton(options)` 会复用同一个 validation result 创建 copy 与 download action：

```text
manifest actions
  ├── Download manifest
  ├── ...
  ├── Manifest validation details
  │   ├── Copy all issues
  │   └── Download report
  ├── Copy validation JSON
  │   └── filename · schema v1 · issue count · byte size
  └── Download validation JSON
      └── filename · schema v1 · issue count · byte size
```

复制成功：

```text
Copied mission-package-0.diagnostics-policy.validation-report.json with 2 validation issues.
```

Validation passed：

```text
Copied mission-package-0.diagnostics-policy.validation-report.json with no validation issues.
```

复制失败：

```text
Validation JSON report copy failed: Clipboard API is unavailable.
```

## Copy 与 download 一致性

对相同的 `validation` 和 `packageIndex`：

```ts
const artifact = createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportArtifact(
  validation,
  packageIndex,
);
```

以下两个操作消费同一个字段：

```text
Copy     -> navigator.clipboard.writeText(artifact.text)
Download -> new Blob([artifact.text], { type: artifact.mimeType })
```

因此复制内容和下载内容在以下方面保持一致：

- schema identifier 与 version。
- target scope、package index 和 JSON path。
- valid 与 summary counts。
- error-first issue 顺序。
- JSON indentation。
- trailing newline。

## 交互与安全边界

- Copy button 使用 `type="button"`，不会触发 manifest artifact download。
- Clipboard workflow 依赖安全上下文中的浏览器 Clipboard API。
- Clipboard API 不可用或拒绝写入时不会调用 `onCopy`。
- Copy 不读取 source manifest text，也不会把 editor policy 内容附加到 report。
- Copy 不修改 manifest textarea、selected target、editor policy 或 validation result。
- JSON report 不包含时间戳、随机 ID 或浏览器信息，因此同一输入仍产生稳定文本。
- Blocking validation errors 会阻止 manifest authoring artifact，但不会阻止 JSON failure report 的复制或下载。
- 下一项将为 deterministic JSON report 增加 checksum，便于跨系统确认内容一致性。
