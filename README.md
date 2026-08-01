# Splat World Engine — Mission Diagnostics Policy Manifest Validation Artifact Bundle

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.72 在 0.71 的 validation JSON checksum download workflow 之上，将 text report、JSON report 与 JSON SHA-256 artifact 聚合为一个结构化、确定性、自包含的 validation artifact bundle。

当前版本不引入 ZIP 依赖。HUD 下载的是一个 bundle descriptor JSON：它既是可独立归档和传输的 bundle artifact，也可以作为未来 ZIP、Builder、CI 或远程 artifact service 的稳定 manifest。

```text
Mission diagnostics validation artifact bundle
  ├── bundle descriptor JSON
  │   ├── schema name + schema version
  │   ├── target metadata
  │   ├── validation status + summary
  │   ├── deterministic artifact order
  │   └── embedded exact artifact text
  └── artifacts
      ├── validation report text
      ├── validation report JSON
      └── validation report JSON SHA-256
```

## Runtime/Builder 0.72 能力

- 新增 `src/large/NavMissionDiagnosticsManifestHudValidationArtifactBundle.ts`。
- 新增稳定 schema：

```text
splat-world-engine/mission-diagnostics-policy-manifest-validation-artifact-bundle
schemaVersion: 1
```

- 新增 `createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleArtifact(...)`：
  - 聚合 plain-text validation report。
  - 聚合 deterministic JSON validation report。
  - 聚合 JSON report 的标准 `.sha256` artifact。
  - 保留每份 artifact 的 exact text、filename、MIME type 与 UTF-8 byte size。
  - 为每份 artifact 计算 `SHA-256` integrity metadata。
  - 在 checksum artifact 上记录明确的 `checksum-for` relationship。
- 固定 artifact 顺序：

```text
validation-report-text
validation-report-json
validation-report-json-sha256
```

- Bundle 状态支持：
  - `passed`
  - `warnings-only`
  - `blocking-error`
  - `invalid-target`
- 新增 `downloadRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleArtifact(...)`。
- 新增 HUD action：`Download validation artifact bundle`。
- 构建 bundle 期间按钮禁用，完成后暴露：
  - `data-bundle-schema`
  - `data-bundle-schema-version`
  - `data-bundle-status`
  - `data-bundle-artifact-count`
- 支持 `onDownload` 与 `onStatus` 回调。
- 不包含 timestamp、随机 ID、浏览器 metadata、source manifest 或 editor policy。
- 不修改原有 text/JSON/checksum artifact API，也不改变 manifest download 返回类型。
- package version 更新为 `0.72.0`。
- Runtime label 更新为 `runtime 0.72`。

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
- [x] Mission diagnostics policy manifest validation JSON report checksum workflow
- [x] Mission diagnostics policy manifest validation JSON checksum download workflow
- [x] Mission diagnostics policy manifest validation artifact bundle workflow
- [ ] Mission diagnostics policy manifest validation artifact bundle verification workflow

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

## Bundle artifact API

```ts
import {
  createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleArtifact,
  downloadRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleArtifact,
} from "./large/NavMissionDiagnosticsManifestHudValidationArtifactBundle";

const bundle =
  await createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleArtifact(
    validation,
    packageIndex,
  );

downloadRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleArtifact(
  bundle,
);
```

默认 bundle filename：

```text
large-world-manifest.diagnostics-policy.validation-artifacts.bundle.json
mission-package-0.diagnostics-policy.validation-artifacts.bundle.json
mission-diagnostics-policy-manifest.invalid-target.validation-artifacts.bundle.json
```

## Bundle descriptor

Bundle document 的稳定顶层结构：

```ts
{
  schema: "splat-world-engine/mission-diagnostics-policy-manifest-validation-artifact-bundle",
  schemaVersion: 1,
  target: {
    scope: "manifest" | "mission-package" | "invalid",
    packageIndex: number | null,
    requestedPackageIndex: number | string,
    path: string,
  },
  status: "passed" | "warnings-only" | "blocking-error" | "invalid-target",
  valid: boolean,
  summary: {
    issueCount: number,
    errors: number,
    warnings: number,
    artifactCount: 3,
  },
  artifactOrder: [
    "validation-report-text",
    "validation-report-json",
    "validation-report-json-sha256",
  ],
  artifacts: [
    {
      kind: "validation-report-text",
      filename: "...validation-report.txt",
      mimeType: "text/plain;charset=utf-8",
      bytes: 256,
      checksum: {
        algorithm: "SHA-256",
        input: "artifact-text-utf8",
        hex: "<64 lowercase hex characters>",
      },
      text: "<exact artifact text>",
    },
    {
      kind: "validation-report-json",
      filename: "...validation-report.json",
      mimeType: "application/json;charset=utf-8",
      bytes: 684,
      checksum: {
        algorithm: "SHA-256",
        input: "artifact-text-utf8",
        hex: "<64 lowercase hex characters>",
      },
      text: "<exact artifact text>",
    },
    {
      kind: "validation-report-json-sha256",
      filename: "...validation-report.json.sha256",
      mimeType: "text/plain;charset=utf-8",
      bytes: 134,
      checksum: {
        algorithm: "SHA-256",
        input: "artifact-text-utf8",
        hex: "<checksum artifact integrity digest>",
      },
      verifies: {
        relation: "checksum-for",
        filename: "...validation-report.json",
        bytes: 684,
        checksum: {
          algorithm: "SHA-256",
          input: "artifact-text-utf8",
          hex: "<JSON report digest>",
        },
      },
      text: "<JSON digest>  <JSON report filename>\n",
    },
  ],
}
```

Bundle artifact 自身使用：

```text
application/json;charset=utf-8
JSON.stringify(document, null, 2) + "\n"
```

因此相同 validation result、target、schema version 和 artifact factories 会生成相同的 bundle text。

## HUD integration

`createRuntimeNavMissionDiagnosticsManifestHudDownloadButton(options)` 会按顺序挂载：

```text
manifest actions
  ├── Download manifest
  ├── ...
  ├── Manifest validation details
  ├── Copy validation JSON
  ├── Download validation JSON
  ├── Copy validation JSON checksum
  ├── Download validation JSON checksum
  └── Download validation artifact bundle
```

初始 preview：

```text
mission-package-0.diagnostics-policy.validation-artifacts.bundle.json · schema v1 · 3 artifacts · passed
```

下载成功后：

```text
mission-package-0.diagnostics-policy.validation-artifacts.bundle.json · passed · 3 artifacts · 3.4 KB
```

Status：

```text
Downloaded validation artifact bundle mission-package-0.diagnostics-policy.validation-artifacts.bundle.json with 3 artifacts.
```

失败：

```text
Validation artifact bundle download failed: Web Crypto SHA-256 is unavailable.
```

## 确定性与安全边界

- Artifact 顺序由 bundle factory 固定，不依赖对象枚举、异步完成顺序或 UI 顺序。
- 所有 byte size 都来自 exact artifact text 的 UTF-8 bytes。
- 所有 integrity checksum 都覆盖 exact artifact text 的 UTF-8 bytes。
- JSON report checksum 继续复用 0.70 的 checksum artifact factory。
- `.sha256` entry 的 `verifies` metadata 与 checksum 文件内容指向同一份 JSON report digest。
- Bundle descriptor 内嵌 artifact text，因此当前不需要 ZIP 也能完整归档和传输。
- Bundle 不包含时间戳、随机 ID、source manifest、editor policy 或浏览器 metadata。
- Blocking validation errors 与 invalid target 不阻止 failure artifacts 的 bundle 生成。
- SHA-256 依赖安全上下文中的 Web Crypto API。
- 下一项将验证 bundle 中的 byte size、artifact checksum、顺序和 `checksum-for` relationship，为 Builder/CI 消费建立闭环。
