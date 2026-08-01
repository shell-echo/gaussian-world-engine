# Splat World Engine — Mission Diagnostics Policy Manifest Validation Checksum Download

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.71 在 0.70 的 deterministic validation JSON SHA-256 checksum 之上，增加独立 `.sha256` 文件下载：author 现在可以对同一份 JSON report 复制 checksum，也可以下载标准 checksum artifact，用于 issue、PR、CI、归档和跨系统完整性校验。

```text
Mission diagnostics validation checksum download
  ├── deterministic JSON artifact
  │   ├── exact artifact.text
  │   ├── UTF-8 bytes
  │   └── trailing newline preserved
  ├── checksum artifact
  │   ├── SHA-256
  │   ├── 64-character lowercase hex
  │   ├── report filename
  │   └── sha256sum-style text
  └── HUD actions
      ├── Manifest validation details
      ├── Copy validation JSON
      ├── Download validation JSON
      ├── Copy validation JSON checksum
      └── Download validation JSON checksum
```

## Runtime/Builder 0.71 能力

- 新增 `src/large/NavMissionDiagnosticsManifestHudValidationJsonReportChecksumDownload.ts`。
- 新增 `createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumDownloadArtifact(checksum)`：
  - 保留 checksum filename。
  - 保留 `text/plain;charset=utf-8` MIME type。
  - 保留完整 sha256sum-style checksum text。
  - 保留 checksum artifact 与 byte size。
- 新增 `downloadRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumArtifact(artifact)`：
  - 使用浏览器 `Blob` 与 object URL。
  - 通过 anchor download 下载 `.sha256` 文件。
  - 下载触发后始终释放 object URL。
- 新增 `createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumDownloadButton(...)`：
  - label：`Download validation JSON checksum`。
  - 点击时基于 exact JSON report bytes 重新计算 SHA-256。
  - 计算期间禁用按钮。
  - 成功后 preview 显示 checksum filename、algorithm 与完整 digest。
  - 将 algorithm 与 digest 写入 `data-checksum-algorithm` / `data-checksum-hex`。
  - 支持 `onDownload` 与 `onStatus` 回调。
- validation passed、warnings-only、blocking-error 与非法 package target 均可下载 checksum。
- JSON schema v1、JSON copy/download API、checksum copy API 与 manifest download 返回类型保持不变。
- package version 更新为 `0.71.0`。
- Runtime label 更新为 `runtime 0.71`。

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
- [ ] Mission diagnostics policy manifest validation artifact bundle workflow

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

## Checksum artifact API

```ts
import {
  createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportArtifact,
} from "./large/NavMissionDiagnosticsManifestHudValidationJsonReport";
import {
  createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumArtifact,
} from "./large/NavMissionDiagnosticsManifestHudValidationJsonReportChecksum";

const report = createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportArtifact(
  validation,
  packageIndex,
);

const checksum = await createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumArtifact(
  report,
);
```

Checksum artifact：

```ts
{
  filename: "mission-package-0.diagnostics-policy.validation-report.json.sha256",
  mimeType: "text/plain;charset=utf-8",
  algorithm: "SHA-256",
  hex: "<64 lowercase hex characters>",
  reportFilename: "mission-package-0.diagnostics-policy.validation-report.json",
  reportBytes: 684,
  text: "<hex>  mission-package-0.diagnostics-policy.validation-report.json\n",
  bytes: 134,
}
```

`reportBytes` 来自 `TextEncoder().encode(report.text)`，因此 checksum 覆盖完整 JSON artifact，包括 indentation、字段顺序、issue 顺序与最后的换行。

## Checksum download API

```ts
import {
  createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumDownloadArtifact,
  downloadRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumArtifact,
} from "./large/NavMissionDiagnosticsManifestHudValidationJsonReportChecksumDownload";

const checksumDownload =
  createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumDownloadArtifact(
    checksum,
  );

downloadRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumArtifact(
  checksumDownload,
);
```

下载文件：

```text
mission-package-0.diagnostics-policy.validation-report.json.sha256
```

内容保持标准 sha256sum 风格：

```text
2d711642b726b04401627ca9fbac32f5c8530fb1903cc4db02258717921a4881  mission-package-0.diagnostics-policy.validation-report.json
```

文件名前使用两个空格，最后保留换行。

## Checksum download button API

```ts
import {
  createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumDownloadButton,
} from "./large/NavMissionDiagnosticsManifestHudValidationJsonReportChecksumDownload";

const button =
  createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumDownloadButton(
    validation,
    packageIndex,
    {
      onDownload: (artifact, report) => {
        console.log(artifact.filename, artifact.checksum.hex, report.filename);
      },
      onStatus: (message) => {
        manifestStatus.textContent = message;
      },
    },
  );
```

`onDownload` 仅在 SHA-256 计算与浏览器 download trigger 都成功后调用。

## HUD integration

`createRuntimeNavMissionDiagnosticsManifestHudDownloadButton(options)` 会挂载：

```text
manifest actions
  ├── Download manifest
  ├── ...
  ├── Manifest validation details
  ├── Copy validation JSON
  ├── Download validation JSON
  ├── Copy validation JSON checksum
  └── Download validation JSON checksum
```

Checksum download 初始 preview：

```text
SHA-256 · exact 684 B JSON artifact
```

计算并下载成功后：

```text
mission-package-0.diagnostics-policy.validation-report.json.sha256 · SHA-256 <64-character hex>
```

Status：

```text
Downloaded SHA-256 checksum mission-package-0.diagnostics-policy.validation-report.json.sha256.
```

失败：

```text
Validation JSON checksum download failed: Web Crypto SHA-256 is unavailable.
```

## 确定性与安全边界

- SHA-256 输入仍是完整 `report.text` UTF-8 bytes。
- Copy checksum 与 Download checksum 使用同一个 checksum artifact factory。
- 下载 checksum 不修改 JSON report、manifest textarea、selected target 或 editor policy。
- Checksum artifact 不包含 source manifest、editor policy、时间戳、随机 ID 或浏览器 metadata。
- SHA-256 依赖安全上下文中的 Web Crypto API。
- Download 本身不依赖 Clipboard API。
- Checksum download button 使用 `type="button"`，不会触发 manifest artifact download。
- Blocking validation errors 不会阻止 failure report checksum 的计算、复制或下载。
- 下一项将把 text report、JSON report 与 checksum 组织为统一 validation artifact bundle。
