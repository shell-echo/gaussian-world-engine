# Splat World Engine — Mission Diagnostics Policy Manifest Validation Artifact Bundle Verification

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.73 在 0.72 的 deterministic validation artifact bundle 之上补齐验证闭环：Runtime、Builder 或 CI 可以验证 bundle descriptor、内嵌 artifacts、UTF-8 byte size、SHA-256 integrity、JSON report metadata 与 `checksum-for` relationship 是否一致。

```text
Mission diagnostics validation artifact bundle verification
  ├── bundle descriptor
  │   ├── canonical JSON text
  │   ├── schema + schemaVersion
  │   ├── target + status + summary
  │   └── deterministic artifact order
  ├── embedded artifacts
  │   ├── exact UTF-8 byte size
  │   ├── exact SHA-256 checksum
  │   ├── filename + MIME type
  │   └── unique deterministic entry kind
  └── cross-artifact relationships
      ├── JSON report metadata matches bundle
      ├── .sha256 verifies JSON report
      └── sha256sum-style text matches metadata
```

## Runtime/Builder 0.73 能力

- 新增 `src/large/NavMissionDiagnosticsManifestHudValidationArtifactBundleVerification.ts`。
- 新增可复用异步 verifier：

```ts
verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleText(text)
verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleArtifact(artifact)
```

- 验证 bundle descriptor：
  - JSON root 必须是 object。
  - 使用 `JSON.stringify(document, null, 2) + "\n"` canonical text。
  - schema 必须是：

```text
splat-world-engine/mission-diagnostics-policy-manifest-validation-artifact-bundle
schemaVersion: 1
```

  - target metadata 必须与 `manifest`、`mission-package` 或 `invalid` scope 一致。
  - `passed`、`warnings-only`、`blocking-error`、`invalid-target` 必须与 target、valid 和 summary 一致。
  - `issueCount` 必须等于 `errors + warnings`。
  - `valid` 必须与 blocking error count 一致。
- 验证固定 artifact 顺序：

```text
validation-report-text
validation-report-json
validation-report-json-sha256
```

- 对每个 artifact 验证：
  - kind 与固定位置。
  - filename 是安全 basename 且 bundle 内唯一。
  - MIME type 与 artifact kind 一致。
  - `bytes` 等于 exact `text` UTF-8 byte length。
  - checksum algorithm 为 `SHA-256`。
  - checksum input 为 `artifact-text-utf8`。
  - checksum hex 为 64 位小写 hexadecimal。
  - checksum 与 exact artifact text 的 UTF-8 bytes 一致。
- 验证 JSON report：
  - report schema 与 schemaVersion。
  - target、valid、summary 与 bundle descriptor 一致。
  - embedded issues length 与 issueCount 一致。
- 验证 `.sha256` entry：
  - `verifies.relation` 必须为 `checksum-for`。
  - filename、bytes、checksum metadata 必须与 JSON report entry 一致。
  - artifact text 必须严格为：

```text
<64-character lowercase SHA-256 hex>  <JSON report filename>\n
```

- verifier 返回结构化 result：
  - `valid`
  - bundle schema/version/status
  - artifact count
  - verification checks count
  - typed verification issues
  - 验证成功后的 typed bundle document
- 每个 verification issue 包含：
  - stable `code`
  - JSON path
  - message
- 新增 HUD action：`Verify validation artifact bundle`。
- HUD 验证期间禁用按钮，成功后暴露：
  - `data-bundle-verification-valid`
  - `data-bundle-verification-issue-count`
  - `data-bundle-verification-checksum-count`
- 支持 `onVerify` 与 `onStatus` callbacks。
- passed、warnings-only、blocking-error、invalid-target bundles 均可验证。
- package version 更新为 `0.73.0`。
- Runtime label 更新为 `runtime 0.73`。

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
- [x] Mission diagnostics policy manifest validation artifact bundle verification workflow
- [ ] Mission diagnostics policy manifest validation artifact bundle import / verification workflow

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

## Verification API

验证 Runtime 创建的 bundle artifact：

```ts
import {
  createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleArtifact,
} from "./large/NavMissionDiagnosticsManifestHudValidationArtifactBundle";
import {
  verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleArtifact,
} from "./large/NavMissionDiagnosticsManifestHudValidationArtifactBundleVerification";

const bundle =
  await createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleArtifact(
    validation,
    packageIndex,
  );

const verification =
  await verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleArtifact(
    bundle,
  );
```

验证来自文件、网络、Builder 或 CI 的 bundle JSON text：

```ts
import {
  verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleText,
} from "./large/NavMissionDiagnosticsManifestHudValidationArtifactBundleVerification";

const verification =
  await verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleText(
    bundleText,
  );
```

成功 result：

```ts
{
  valid: true,
  bundleSchema: "splat-world-engine/mission-diagnostics-policy-manifest-validation-artifact-bundle",
  bundleSchemaVersion: 1,
  bundleStatus: "passed",
  artifactCount: 3,
  issues: [],
  checks: {
    canonicalBundleText: true,
    artifactOrder: true,
    byteSizesVerified: 3,
    checksumsVerified: 3,
    checksumRelationshipsVerified: 1,
    jsonReportMetadataVerified: true,
  },
  document: bundleDocument,
}
```

失败 result 示例：

```ts
{
  valid: false,
  issues: [
    {
      code: "artifact-checksum-mismatch",
      path: "$.artifacts[1].checksum.hex",
      message: "Artifact checksum does not match the exact UTF-8 bytes of ...",
    },
  ],
}
```

Verifier 不在第一处错误后停止。只要输入 JSON root 可读取，就会尽量返回全部可确定的结构、metadata、byte size、checksum 和 relationship issues。

## Verification issue codes

当前稳定 issue code 包括：

```text
invalid-json
invalid-root
non-canonical-bundle-text
schema-mismatch
schema-version-mismatch
target-invalid
status-invalid
status-mismatch
validity-invalid
validity-mismatch
summary-invalid
summary-mismatch
artifact-order-invalid
artifact-count-mismatch
artifact-invalid
artifact-kind-mismatch
artifact-filename-invalid
artifact-filename-duplicate
artifact-mime-type-mismatch
artifact-byte-size-mismatch
artifact-checksum-invalid
artifact-checksum-mismatch
checksum-reference-invalid
checksum-reference-mismatch
checksum-text-mismatch
json-report-invalid
json-report-mismatch
crypto-unavailable
```

这些 code 可供 HUD details、Builder diagnostics、CI annotation 或远程 artifact service 直接消费。

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
  ├── Download validation artifact bundle
  └── Verify validation artifact bundle
```

验证前 preview：

```text
canonical JSON · artifact order · UTF-8 byte sizes · SHA-256 · checksum-for
```

验证成功后：

```text
mission-package-0.diagnostics-policy.validation-artifacts.bundle.json · verified · 3 artifacts · 3 checksums
```

Status：

```text
Verified validation artifact bundle mission-package-0.diagnostics-policy.validation-artifacts.bundle.json with 3 artifacts.
```

验证失败：

```text
Validation artifact bundle verification failed with 2 verification issues.
```

## 确定性与安全边界

- Verifier 不信任 bundle descriptor 中声明的 byte size 或 checksum，会重新编码 exact artifact text 并重新计算。
- Artifact order 同时验证 `artifactOrder` 和 `artifacts[]` 实际顺序。
- Bundle text 不是 canonical two-space JSON 或缺少最后换行时验证失败。
- JSON report 与 bundle descriptor 的 target、valid、summary 必须一致。
- `.sha256` entry 的 metadata、reference 和文本三者必须同时一致。
- Bundle 中任意 artifact text、filename、MIME type、bytes、checksum 或 relationship 被修改都会产生 verification issue。
- Verifier 不执行 bundle 内容，不创建 object URL，不触发下载，也不修改 manifest editor state。
- SHA-256 验证依赖安全上下文中的 Web Crypto API；不可用时返回 `crypto-unavailable` issue。
- 下一项将增加外部 bundle 文件导入和验证 UI，使 author 可以选择本地 bundle descriptor 并查看验证结果。
