# Splat World Engine — Mission Diagnostics Policy Manifest Validation JSON Report

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.68 在 0.67 的纯文本 validation report download 之上，新增机器可消费的 JSON report：同一份 validation result 可以以稳定 schema、明确 target 和确定性 issue 顺序导出，供 CI、审查工具、问题追踪系统或后续自动修复流程读取。

```text
Mission diagnostics manifest validation JSON report
  ├── schema metadata
  │   ├── schema identifier
  │   └── schemaVersion = 1
  ├── target metadata
  │   ├── manifest / mission-package
  │   ├── packageIndex
  │   └── JSON path
  ├── validation result
  │   ├── valid
  │   ├── summary counts
  │   └── ordered issues
  └── HUD actions
      ├── text report download
      ├── JSON report download
      └── issue copy workflow
```

## Runtime/Builder 0.68 能力

- 新增 `src/large/NavMissionDiagnosticsManifestHudValidationJsonReport.ts`。
- 新增稳定 JSON schema：
  - identifier：`splat-world-engine/mission-diagnostics-policy-manifest-validation`
  - `schemaVersion: 1`
- 新增 `createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportTarget(packageIndex)`：
  - 顶层 policy target：`$.severityPolicy`
  - package policy target：`$.missionPackages[n].severityPolicy`
- 新增 `createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportDocument(validation, packageIndex)`。
- 新增 `createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportArtifact(...)`：
  - filename
  - `application/json;charset=utf-8`
  - parsed document
  - serialized text
  - UTF-8 byte size
  - error / warning / issue counts
- 新增浏览器下载 helper 与 `Download validation JSON` HUD button。
- JSON report 在 validation passed、warnings-only 和 blocking-error 三种状态下都可下载。
- JSON 输出不包含 source manifest、editor policy 或生成时间，保证同一输入产生稳定、可 diff 的内容。
- issues 始终按 errors → warnings 排序，同一 severity 内保持 validator 原始顺序。
- package version 更新为 `0.68.0`。
- Runtime label 更新为 `runtime 0.68`。

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
- [ ] Mission diagnostics policy manifest validation JSON report copy workflow

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

## JSON document API

```ts
import {
  createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportDocument,
  RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_JSON_REPORT_SCHEMA,
  RUNTIME_NAV_MISSION_DIAGNOSTICS_MANIFEST_VALIDATION_JSON_REPORT_SCHEMA_VERSION,
} from "./large/NavMissionDiagnosticsManifestHudValidationJsonReport";

const document = createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportDocument(
  validation,
  packageIndex,
);
```

Document 示例：

```json
{
  "schema": "splat-world-engine/mission-diagnostics-policy-manifest-validation",
  "schemaVersion": 1,
  "target": {
    "scope": "mission-package",
    "packageIndex": 0,
    "path": "$.missionPackages[0].severityPolicy"
  },
  "valid": false,
  "summary": {
    "issueCount": 2,
    "errors": 1,
    "warnings": 1
  },
  "issues": [
    {
      "severity": "error",
      "code": "mission_packages.not_array",
      "path": "$.missionPackages",
      "message": "missionPackages must be an array."
    },
    {
      "severity": "warning",
      "code": "mission_package.url_missing",
      "path": "$.missionPackages[0].url",
      "message": "url is missing and will default to ./mission-package.json."
    }
  ]
}
```

## JSON artifact API

```ts
import {
  createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportArtifact,
  downloadRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportArtifact,
} from "./large/NavMissionDiagnosticsManifestHudValidationJsonReport";

const artifact = createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportArtifact(
  validation,
  packageIndex,
);

downloadRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportArtifact(artifact);
```

Artifact 结构：

```ts
{
  filename,
  mimeType: "application/json;charset=utf-8",
  document,
  text,
  bytes,
  issueCount,
  errors,
  warnings,
}
```

Serialized JSON 使用两个空格缩进并以换行结束，方便命令行工具、版本控制与 snapshot comparison。

## Target 与文件命名

顶层 `severityPolicy`：

```text
path: $.severityPolicy
filename: large-world-manifest.diagnostics-policy.validation-report.json
```

Package target：

```text
path: $.missionPackages[0].severityPolicy
filename: mission-package-0.diagnostics-policy.validation-report.json
```

自定义 filename 会进行安全归一化，并自动补充 `.json` 后缀。

## HUD integration

`createRuntimeNavMissionDiagnosticsManifestHudDownloadButton(options)` 会在现有 validation details 后挂载一个全宽 JSON download action：

```text
manifest actions
  ├── Download manifest
  ├── ...
  ├── Manifest validation details
  │   ├── Copy all issues
  │   └── Download report
  └── Download validation JSON
      └── filename · schema v1 · issue count · byte size
```

JSON button 使用同一个 validation result 和 `onStatus` callback。成功时：

```text
Downloaded mission-package-0.diagnostics-policy.validation-report.json with 2 validation issues.
```

失败时：

```text
Validation JSON report download failed: <error message>
```

## 确定性与兼容边界

- JSON report 不写入生成时间、随机 ID 或浏览器信息。
- 同一 validation result 与 package target 会生成相同 document text。
- issue 对象只包含 `severity`、`code`、`path` 和 `message`。
- JSON document 不包含 source manifest 或 editor policy，避免把完整 authoring 内容复制到诊断报告。
- `schemaVersion` 用于未来演进；当前消费者应校验 schema identifier 与 version。
- Blocking validation errors 仍会阻止 JSON Patch、patched manifest 与 manifest artifact，但不会阻止 text / JSON failure report 下载。
- JSON action 使用 `type="button"`，不会触发 manifest artifact download。
- Object URL 在 anchor download 触发后释放。
- 当前 JSON report 支持下载；直接复制 JSON 是下一项 checklist。
