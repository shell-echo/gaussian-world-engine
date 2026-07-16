# Splat World Engine — Mission Diagnostics Policy Manifest Validation JSON Report Checksum

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Runtime/Builder 0.70 在 0.69 的 deterministic validation JSON copy workflow 之上，为 JSON artifact 增加 SHA-256 checksum：author 可以复制标准 checksum 文本，在 issue、PR、CI 或外部系统之间确认 report 内容是否完全一致。

```text
Mission diagnostics validation JSON checksum
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
      ├── Copy validation JSON
      ├── Copy validation JSON checksum
      └── Download validation JSON
```

## Runtime/Builder 0.70 能力

- 新增 `src/large/NavMissionDiagnosticsManifestHudValidationJsonReportChecksum.ts`。
- 新增 `createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumArtifact(report, filename)`：
  - 使用 Web Crypto `SHA-256`。
  - 对完整 `artifact.text` 的 UTF-8 bytes 计算摘要。
  - 保留 JSON indentation 与末尾换行对摘要的影响。
  - 生成 64 位小写 hexadecimal digest。
- Checksum text 使用兼容常见 checksum 工具的格式：

```text
<64-character sha256 hex>  <validation report filename>\n
```

- 新增 `copyRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumArtifact(checksum)`。
- 新增 `createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumButton(...)`：
  - label：`Copy validation JSON checksum`。
  - 计算期间禁用按钮，防止重复提交。
  - 计算成功后在 preview 中显示完整 SHA-256。
  - 将 algorithm 与 digest 写入 `data-checksum-algorithm` 和 `data-checksum-hex`。
  - 支持 `onCopy` 与 `onStatus` 回调。
- validation passed、warnings-only、blocking-error 和非法 package target 均可以计算 checksum。
- package version 更新为 `0.70.0`。
- Runtime label 更新为 `runtime 0.70`。

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
- [ ] Mission diagnostics policy manifest validation JSON checksum download workflow

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

`reportBytes` 来自重新编码后的实际 `report.text`，因此 checksum 明确覆盖完整 JSON artifact，而不是 parsed document 或删去空白后的 JSON。

## Checksum filename

默认 checksum filename 在 report filename 后追加 `.sha256`：

```text
large-world-manifest.diagnostics-policy.validation-report.json.sha256
mission-package-0.diagnostics-policy.validation-report.json.sha256
mission-diagnostics-policy-manifest.invalid-target.validation-report.json.sha256
```

自定义 checksum filename 会进行安全归一化，并自动补充 `.sha256` 后缀。

## Copy checksum API

```ts
import {
  copyRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumArtifact,
} from "./large/NavMissionDiagnosticsManifestHudValidationJsonReportChecksum";

await copyRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumArtifact(
  checksum,
);
```

复制内容示例：

```text
2d711642b726b04401627ca9fbac32f5c8530fb1903cc4db02258717921a4881  mission-package-0.diagnostics-policy.validation-report.json
```

文件名前使用两个空格，文本最后保留换行。

## Checksum button API

```ts
import {
  createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumButton,
} from "./large/NavMissionDiagnosticsManifestHudValidationJsonReportChecksum";

const button = createRuntimeNavMissionDiagnosticsManifestHudValidationJsonReportChecksumButton(
  validation,
  packageIndex,
  {
    onCopy: (checksum, report) => {
      console.log(checksum.hex, report.filename);
    },
    onStatus: (message) => {
      manifestStatus.textContent = message;
    },
  },
);
```

`onCopy` 仅在 SHA-256 计算和 Clipboard 写入都成功后调用。

## HUD integration

`createRuntimeNavMissionDiagnosticsManifestHudDownloadButton(options)` 会挂载：

```text
manifest actions
  ├── Download manifest
  ├── ...
  ├── Manifest validation details
  ├── Copy validation JSON
  ├── Copy validation JSON checksum
  │   └── checksum filename · SHA-256 · exact report byte size
  └── Download validation JSON
```

按钮首次显示：

```text
mission-package-0.diagnostics-policy.validation-report.json.sha256 · SHA-256 · exact 684 B JSON artifact
```

计算并复制成功后，preview 显示完整 digest：

```text
SHA-256 <64-character hex> · mission-package-0.diagnostics-policy.validation-report.json
```

Status 使用短 digest，避免占满 panel：

```text
Copied SHA-256 2d711642b726… for mission-package-0.diagnostics-policy.validation-report.json.
```

失败时：

```text
Validation JSON report checksum failed: Web Crypto SHA-256 is unavailable.
Validation JSON report checksum failed: Clipboard API is unavailable.
```

## 确定性与安全边界

- SHA-256 输入是 `TextEncoder().encode(report.text)` 的完整结果。
- JSON 空格、字段顺序、issue 顺序和末尾换行发生变化时 checksum 也会变化。
- 相同 validation result、target 和 schema version 会产生相同 report text 与 checksum。
- Checksum artifact 不包含 source manifest、editor policy、时间戳、随机 ID 或浏览器 metadata。
- SHA-256 依赖安全上下文中的 Web Crypto API。
- Copy 依赖安全上下文中的 Clipboard API。
- Web Crypto 或 Clipboard API 不可用时不会调用 `onCopy`。
- Checksum action 使用 `type="button"`，不会触发 manifest artifact download。
- Blocking validation errors 不会阻止 failure report checksum 的计算和复制。
- 当前 checksum 支持计算和复制；独立 `.sha256` 文件下载是下一项 checklist。
