# Splat World Engine — Gaussian Runtime + Portable World Bundles

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Gaussian Splats 负责照片级世界，GLB 可视模型、代理碰撞、Rapier 刚体、Trigger、交互和位置音频负责可玩性。

Runtime 0.8 增加了 `.splatworld` 世界包：一个文件即可携带 Manifest、Splat、GLB 和音频资产。

```text
world.splatworld (ZIP)
  ├── bundle.json
  ├── world.json
  ├── splats/*
  ├── models/*
  └── audio/*
        ↓
  Browser Runtime
  ├── Blob URL asset lifecycle
  ├── Gaussian renderer
  ├── GLB visuals
  ├── Rapier physics
  └── Gameplay components
```

## Runtime 0.8 能力

- Spark 2.1 Gaussian Splat 渲染
- 支持 `.ply`、`.spz`、`.splat`、`.ksplat`、`.sog`、`.zip`、`.rad`
- Box、Capsule、TriMesh 与 Convex Hull Collider
- 本地 GLB 同时导入可视模型与碰撞代理
- GLB 可选择 TriMesh 或 Convex 代理
- 浏览器端顶点聚类简化：100%、50%、25%、10%
- 动态 Box、Capsule、Convex 刚体
- Trigger、Interactable、位置音频
- 场景对象树、Transform Gizmo、数值 Inspector
- Undo / Redo
- `world.json` 导入数据兼容
- `.splatworld` 世界包导入与导出
- Data URL、Blob URL、同源和允许 CORS 的远程资产自动打包
- ZIP Store 导出，ZIP Store / Deflate 导入
- CRC32、路径穿越、压缩炸弹和体积限制校验
- IndexedDB 暂存 + 整页干净重启 Runtime

## 运行

要求 Node.js 20.19+ 或 22.12+。

```bash
npm install
npm run dev
```

打开 `http://localhost:5173`。

```bash
npm run typecheck
npm run build
npm run preview
```

## `.splatworld` 世界包

顶部工具栏提供：

- **打开 .splatworld**：载入完整世界包并重新初始化 Runtime。
- **导出 .splatworld**：导出当前编辑状态和可访问资产。
- **导出 world.json**：只导出 Manifest，保留原有轻量工作流。

### 包结构

```text
my-world.splatworld
  bundle.json
  world.json
  splats/
    environment.spz
  models/
    radio.glb
  audio/
    ambience.ogg
```

`bundle.json` 示例：

```json
{
  "format": "splatworld",
  "version": 1,
  "entry": "world.json",
  "worldName": "My World",
  "createdAt": "2026-06-17T00:00:00.000Z",
  "storage": "zip-store",
  "assets": [
    {
      "path": "models/radio.glb",
      "kind": "visual",
      "objectId": "radio",
      "mediaType": "model/gltf-binary",
      "bytes": 123456,
      "sourceName": "radio.glb"
    }
  ],
  "externalAssets": []
}
```

打包后的 `world.json` 使用内部 URL：

```json
{
  "visual": {
    "url": "bundle:///models/radio.glb",
    "sourceName": "radio.glb",
    "visible": true
  }
}
```

载入时 Runtime 会将这些内部 URL 转换成 Blob URL，并在页面退出时统一释放。

### 资产收集规则

导出会尝试内置：

- Data URL
- Blob URL
- 同源资源
- 允许浏览器 CORS 读取的远程资源

无法读取的远程资源不会阻止导出，而是保留原始 URL，并记录在 `externalAssets` 中。这样的世界包仍可运行，但不是完全离线包。

### 安全与体积限制

- 最多 1,024 个 ZIP 条目
- 单条目最大 256 MB
- 解压后总大小最大 512 MB
- 暂存世界包最大 512 MB
- 拒绝加密 ZIP
- 拒绝多磁盘 ZIP
- 拒绝 `../` 等不安全路径
- 校验每个条目的 CRC32
- 当前导出不压缩，优先保证确定性与零依赖

## GLB 世界对象

进入编辑模式，在顶部选择代理模式与细节：

```text
GLB → TriMesh  + 细节 25%
GLB → Convex   + 细节 50%
```

处理流程：

1. `GLTFLoader` 读取本地 `.glb`。
2. 遍历全部 Mesh 节点。
3. 将节点世界变换烘焙到顶点。
4. 按细节档位进行顶点聚类。
5. TriMesh 路径重建三角形并移除退化面。
6. Convex 路径由 Rapier 创建 Convex Hull。
7. 原始 GLB 作为 Visual Component 附加到同一对象。
8. 可视模型与代理共享位置、旋转和缩放。

| 代理 | 适合 | 动态刚体 | Trigger |
|---|---|---:|---:|
| TriMesh | 建筑、地面、复杂静态结构 | 否 | 否 |
| Convex | 道具、岩石、箱体、可推动对象 | 是 | 是 |

## 代码结构

```text
src/
  world/ZipArchive.ts             零依赖 ZIP Store/Deflate 读写与校验
  world/WorldBundle.ts            .splatworld 打包、解包与 IndexedDB 暂存
  world/BundleBootstrap.ts        世界包启动链路与 UI 集成
  assets/GLBColliderExtractor.ts  GLB 解析与代理简化
  render/VisualModelSystem.ts     GLB Visual Component
  physics/PhysicsWorld.ts         Box / Capsule / TriMesh / Convex
  core/Engine.ts                  Runtime 与编辑系统编排
  editor/EditorController.ts      对象编辑和 GLB 导入
  audio/AudioSystem.ts            位置音频
  gameplay/GameplaySystem.ts      Trigger 与 Interactable
  render/GaussianWorld.ts         Gaussian Splat 视觉层
  types/world.ts                  Manifest 与组件联合类型
```

## 架构原则

```text
照片级背景       = Gaussian Splats
导入道具外观     = GLB Visual Component
复杂静态碰撞     = Simplified TriMesh
动态道具碰撞     = Convex Hull
简单空间代理     = Box / Capsule
游戏行为         = Trigger / Interactable / Audio
分发单元         = .splatworld bundle
```

## 已知边界

- ZIP 导出使用 Store 模式，不压缩资产。
- 第三方远程资产受 CORS 限制，可能保留为外部 URL。
- Data URL 可继续兼容，但推荐通过 `.splatworld` 抽离为二进制文件。
- 当前代理生成仍在主线程。
- 顶点聚类不保证保留薄壁和小孔洞。
- Convex Hull 无法表达凹形结构。
- GLB 动画、材质 Inspector 和独立 Visual Transform 尚未实现。

## 下一阶段

- [x] `.splatworld` 资产包导入与导出
- [ ] Web Worker 代理生成与世界包处理
- [ ] QEM Mesh Simplification
- [ ] Convex Decomposition
- [ ] GLB 动画和材质控制
- [ ] 事件图 / 脚本组件
- [ ] NavMesh 与大场景分块

## 依赖与许可证

- Spark：MIT
- Three.js：MIT
- Rapier：Apache-2.0

项目本身使用 MIT License。导入场景、GLB、音频、训练模型与数据集仍需分别确认授权。
