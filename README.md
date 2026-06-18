# Splat World Engine — Gaussian Runtime + Background Proxy Pipeline

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Gaussian Splats 负责照片级世界，GLB 可视模型、代理碰撞、Rapier 刚体、Trigger、交互和位置音频负责可玩性。

Runtime 0.9 将 GLB 碰撞代理生成迁移到 Web Worker，并加入 QEM Mesh Simplification。

```text
GLB file
  ├── main thread
  │     ├── GLTFLoader parse
  │     ├── bake node transforms
  │     └── Float32Array / Uint32Array
  │                 │ Transferable
  │                 ▼
  └── Web Worker
        ├── QEM batch edge collapse
        ├── boundary preservation
        ├── spatial clustering fallback
        ├── cancellation + progress
        └── compact collision proxy
                   │ Transferable
                   ▼
             Rapier collider
```

## Runtime 0.9 能力

- Spark 2.1 Gaussian Splat 渲染
- Box、Capsule、TriMesh 与 Convex Hull Collider
- GLB 可视模型与碰撞代理同时导入
- TriMesh 可选择 QEM 或 Cluster 简化
- Convex 使用后台空间点聚类
- Web Worker 后台代理生成
- TypedArray Transferable，避免复制大规模顶点缓冲
- 进度、阶段、耗时与输出统计
- `AbortSignal` 取消任务
- 取消后不创建对象、不写入 Undo 历史
- 超大网格先聚类到 QEM 工作集，再执行边折叠
- QEM 边界保护与退化三角形清理
- 动态 Box、Capsule、Convex 刚体
- Trigger、Interactable、位置音频
- 场景对象树、Transform Gizmo、数值 Inspector
- Undo / Redo
- `.splatworld` 世界包导入与导出

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

## GLB 代理生成

进入编辑模式后，在顶部选择：

```text
GLB → TriMesh
简化 QEM
细节 25%
```

或者：

```text
GLB → TriMesh
简化 Cluster
细节 25%
```

Convex 模式会自动切换到空间点聚类，因为 QEM 面向带三角拓扑的网格。

### QEM 流程

1. 从每个三角面构建平面二次误差矩阵。
2. 将面误差累加到关联顶点。
3. 为每条边计算组合误差与最优折叠点。
4. 对边界点和非边界点之间的折叠施加高惩罚。
5. 按误差排序，批量选择互不共享顶点的边。
6. 折叠边、清理退化面和重复面。
7. 重新压缩顶点索引并进入下一轮。
8. 无法继续达到目标时，用聚类完成收尾。

QEM 工作集最多约 120,000 个三角形。更大的源网格会先进行一次空间预聚类，最终代理仍限制在 100,000 个三角形以内。

### Cluster 模式

Cluster 使用三维网格单元聚合顶点：

- 速度更快
- 内存占用更低
- 更适合快速预览和 Convex 点集
- 对薄壁、小孔洞和尖锐轮廓的保留弱于 QEM

### 后台任务 UI

代理任务面板会显示：

- 当前处理阶段
- 完成百分比
- 原始与输出三角形或点数量
- QEM / Cluster 算法
- Worker 执行状态
- 预聚类状态
- 实际耗时

点击“取消”会触发 `AbortSignal`。QEM 每轮边折叠之间会让出 Worker 事件循环，以便及时处理取消请求。

## `.splatworld` 世界包

`.splatworld` 是标准 ZIP 容器：

```text
world.splatworld
  bundle.json
  world.json
  splats/
  models/
  audio/
```

支持：

- Data URL、Blob URL、同源和 CORS 可读资产自动打包
- `bundle:///...` 内部资产 URL
- Blob URL 生命周期管理
- ZIP Store 导出
- ZIP Store / Deflate 导入
- CRC32 校验
- 路径穿越、压缩炸弹和体积限制保护
- IndexedDB 暂存后完整重启 Runtime

无法读取的第三方远程资源会保留为外部 URL，并记录在 `bundle.json.externalAssets` 中。

## 代码结构

```text
src/
  RuntimeBootstrap.ts                    Runtime bootstrap composition
  assets/GLBColliderExtractor.ts         GLB parse + worker dispatch
  assets/proxy/ProxyProtocol.ts          Worker message and statistics types
  assets/proxy/ProxySimplifier.ts        QEM and spatial clustering
  assets/proxy/ProxyWorker.ts            Background worker entry
  assets/proxy/ProxyWorkerClient.ts      Transferable client + cancellation
  assets/proxy/ProxyImportBootstrap.ts   Progress UI and Engine integration
  world/ZipArchive.ts                    Dependency-free ZIP codec
  world/WorldBundle.ts                   .splatworld import and export
  world/BundleBootstrap.ts               Bundle startup lifecycle
  physics/PhysicsWorld.ts                Box / Capsule / TriMesh / Convex
  editor/EditorController.ts             Object editing
  render/VisualModelSystem.ts            GLB visual components
  render/GaussianWorld.ts                Gaussian visual layer
```

## 架构原则

```text
照片级背景       = Gaussian Splats
导入道具外观     = GLB Visual Component
复杂静态碰撞     = QEM / Cluster TriMesh
动态道具碰撞     = Convex Hull
简单空间代理     = Box / Capsule
游戏行为         = Trigger / Interactable / Audio
分发单元         = .splatworld bundle
CPU 重任务        = Web Worker + Transferable
```

## 已知边界

- GLTFLoader 解析与节点遍历仍在主线程，网格简化在 Worker。
- QEM 采用批量互斥边折叠，不是逐边更新优先队列的离线工业实现。
- QEM 不保留 UV、法线、骨骼和材质属性，因为输出只用于碰撞。
- Cluster 模式不保证保留薄壁和小孔洞。
- Convex Hull 无法表达凹形结构。
- `.splatworld` ZIP 导出当前使用 Store 模式。
- GLB 动画、材质 Inspector 和独立 Visual Transform 尚未实现。

## 下一阶段

- [x] `.splatworld` 资产包导入与导出
- [x] Web Worker 代理生成
- [x] QEM Mesh Simplification
- [ ] 将 GLB 解析和世界包压缩也迁移到 Worker
- [ ] Convex Decomposition
- [ ] GLB 动画和材质控制
- [ ] 事件图 / 脚本组件
- [ ] NavMesh 与大场景分块

## 依赖与许可证

- Spark：MIT
- Three.js：MIT
- Rapier：Apache-2.0

项目本身使用 MIT License。导入场景、GLB、音频、训练模型与数据集仍需分别确认授权。
