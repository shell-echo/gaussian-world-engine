# Splat World Engine — Mission Diagnostics Policy Manifest Validation Artifact Bundle Import / Verification

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.74 在 0.73 的 validation artifact bundle verifier 之上增加外部文件导入闭环：author 可以从本地选择 bundle descriptor JSON，读取 exact text，重新计算 UTF-8 byte size，并使用同一套 verifier 检查 descriptor、内嵌 artifacts、SHA-256 与 `checksum-for` relationship。

```text
Mission diagnostics validation artifact bundle import / verification
  ├── local file selection
  │   ├── JSON file picker
  │   ├── raw File.size limit
  │   └── decoded UTF-8 byte limit
  ├── exact text import
  │   ├── File.text()
  │   ├── no JSON normalization before verification
  │   └── no embedded content execution
  ├── bundle verification
  │   ├── canonical descriptor JSON
  │   ├── deterministic artifact order
  │   ├── UTF-8 byte sizes
  │   ├── SHA-256 checksums
  │   └── checksum-for relationship
  └── HUD result
      ├── verified summary
      ├── structured issue details
      ├── callback/status handling
      └── machine-readable data attributes
```

## Runtime/Builder 0.74 能力

- 新增 `src/large/NavMissionDiagnosticsManifestHudValidationArtifactBundleImport.ts`。
- 新增文件导入 API：

```ts
importRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleFile(file, options)
```

- 导入流程：
  - 接收浏览器 `File`。
  - 保留 filename、reported MIME type 与 raw `File.size` metadata。
  - 使用 `File.text()` 读取 exact bundle text。
  - 对解码后文本重新计算 UTF-8 byte size。
  - 调用 0.73 的 `verifyRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleText(text)`。
  - 不根据扩展名或 MIME type 跳过 verifier，也不信任文件声明的完整性信息。
- 默认导入上限：

```text
16 MiB
```

- 同时检查：
  - 原始 `File.size`。
  - 解码后 exact text 的 UTF-8 bytes。
- 支持自定义 `maxFileBytes`，但必须是正的有限数值。
- 返回稳定 import status：

```text
verified
verification-failed
rejected
read-failed
verification-error
```

- Import result 包含：
  - status
  - file metadata
  - decoded text byte size
  - 完整 verification result
  - read/rejection/unexpected verification error
- 新增格式化 API：

```ts
formatRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportResult(result)
```

- 新增 HUD control：

```ts
createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportControl(options)
```

- HUD control 提供：
  - 隐藏 file input 与可访问的显式 action button。
  - `.json` / JSON MIME picker hint。
  - 重复选择同一文件支持。
  - 文件读取与验证期间禁用按钮。
  - 成功、验证失败、文件拒绝和读取失败的独立 preview。
  - 验证失败时自动展开全部结构化 issues。
  - 每项 issue 显示 stable code、JSON path 与 message。
- 支持 `onImport` 与 `onStatus` callbacks。
- 导入结果暴露：

```text
data-bundle-import-status
data-bundle-import-filename
data-bundle-import-bytes
data-bundle-verification-valid
data-bundle-verification-issue-count
data-bundle-verification-checksum-count
data-bundle-verification-status
```

- passed、warnings-only、blocking-error 与 invalid-target bundles 均可导入和验证。
- package version 更新为 `0.74.0`。
- Runtime label 更新为 `runtime 0.74`。

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
- [x] Mission diagnostics policy manifest validation artifact bundle import / verification workflow
- [ ] Mission diagnostics policy manifest validation artifact bundle verified artifact extraction workflow

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

## File import API

```ts
import {
  importRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleFile,
} from "./large/NavMissionDiagnosticsManifestHudValidationArtifactBundleImport";

const input = document.querySelector<HTMLInputElement>("input[type=file]");
const file = input?.files?.item(0);

if (file) {
  const result =
    await importRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleFile(
      file,
      {
        maxFileBytes: 16 * 1024 * 1024,
      },
    );

  console.log(result.status, result.verification?.issues);
}
```

成功 result：

```ts
{
  status: "verified",
  file: {
    filename: "mission-package-0.diagnostics-policy.validation-artifacts.bundle.json",
    mimeType: "application/json",
    bytes: 3480,
  },
  textBytes: 3480,
  verification: {
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
  },
  error: null,
}
```

验证失败仍然是成功读取的 import：

```ts
{
  status: "verification-failed",
  verification: {
    valid: false,
    issues: [
      {
        code: "artifact-checksum-mismatch",
        path: "$.artifacts[1].checksum.hex",
        message: "Artifact checksum does not match the exact UTF-8 bytes of ...",
      },
    ],
  },
}
```

文件过大、文件读取失败与 verifier 的意外异常分别使用 `rejected`、`read-failed` 与 `verification-error`，不会伪装成普通 verification issue。

## Import control API

```ts
import {
  createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportControl,
} from "./large/NavMissionDiagnosticsManifestHudValidationArtifactBundleImport";

const control =
  createRuntimeNavMissionDiagnosticsManifestHudValidationArtifactBundleImportControl({
    onImport: (result) => {
      console.log(result.status, result.file.filename);
    },
    onStatus: (message) => {
      manifestStatus.textContent = message;
    },
  });

manifestActions.append(control);
```

Control 不把 file input 挂到全局 document，也不会创建 object URL。文件 input、button、preview 和 result details 都由 control 自己管理。

## HUD integration

`createRuntimeNavMissionDiagnosticsManifestHudDownloadButton(options)` 按顺序挂载：

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
  ├── Verify validation artifact bundle
  └── Import and verify validation artifact bundle
```

初始 preview：

```text
Select a bundle descriptor JSON file · max 16 MB
```

验证成功：

```text
mission-package-0.diagnostics-policy.validation-artifacts.bundle.json · verified · passed · 3 artifacts · 3.4 KB
```

Status：

```text
Imported and verified validation artifact bundle mission-package-0.diagnostics-policy.validation-artifacts.bundle.json with 3 artifacts.
```

验证失败：

```text
Imported mission-package-0.diagnostics-policy.validation-artifacts.bundle.json; validation artifact bundle verification failed with 2 verification issues.
```

失败 details 会自动展开，并按 verifier 返回顺序展示全部 issue：

```text
artifact-checksum-mismatch
$.artifacts[1].checksum.hex
Artifact checksum does not match the exact UTF-8 bytes of ...
```

## 安全与边界

- File picker 的 `accept` 仅用于浏览器选择提示，不作为可信验证条件。
- 导入 API 不依赖 filename 后缀或 reported MIME type 判断 bundle 是否可信。
- raw `File.size` 与 decoded UTF-8 bytes 都受导入上限约束。
- Verifier 接收未经重新序列化的 exact file text，因此非 canonical whitespace 或缺少末尾换行仍会被发现。
- 导入流程不执行 bundle 中的文本、脚本、URL 或 metadata。
- 导入流程不创建 object URL、不自动下载 artifacts，也不修改当前 manifest editor policy。
- 所有展示内容都通过 `textContent` 写入 DOM，不使用 imported HTML。
- SHA-256 验证依赖安全上下文中的 Web Crypto API；不可用时仍返回结构化 `crypto-unavailable` verification issue。
- 下一项将允许从验证通过的 imported bundle 中按确定顺序提取和下载 text report、JSON report 与 `.sha256` artifact。
