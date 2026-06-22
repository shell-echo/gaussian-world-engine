# Splat World Engine — Gaussian Runtime + Compound Convex Physics

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Gaussian Splats 负责照片级世界，GLB 可视模型、碰撞代理、Rapier 刚体、Trigger、交互和位置音频负责可玩性。

Runtime 0.10 增加了 **Compound Convex Decomposition**：凹形 GLB 可以拆成多个凸包，并以一个世界对象、一个共享 Transform 和一个 Rapier 刚体运行。

```text
Concave GLB
  │
  ├── QEM / Cluster Worker
  │       ↓ simplified TriMesh
  │
  └── Decomposition Worker
          ├── recursive triangle partition
          ├── convex point reduction
          └── Hull 1 ... Hull N
                    ↓
        One world object / one rigid body
          ├── Rapier Convex Collider 1
          ├── Rapier Convex Collider 2
          └── Rapier Convex Collider N
```

## Runtime 0.10 能力

- Spark 2.1 Gaussian Splat 渲染
- Box、Capsule、TriMesh、Convex 和 Compound Collider
- GLB 可视模型与碰撞代理同时导入
- TriMesh 支持 QEM / Cluster 简化
- 单 Convex Hull 点聚类
- Compound Convex Decomposition
- 一个 Compound 对象挂载多个 Rapier Collider
- Compound 支持 Fixed / Dynamic 刚体
- Compound 支持 Trigger、Interactable、Audio 和 Visual Component
- Web Worker + TypedArray Transferable
- 代理生成与分解进度、取消和统计
- Scene Tree、Transform Gizmo、数值 Inspector
- Undo / Redo 和对象复制
- `world.json` 与 `.splatworld` 导入导出

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

## GLB 碰撞模式

进入编辑模式后可以选择三种 GLB 代理：

| 模式 | 适合 | 动态刚体 | 凹形表达 |
|---|---|---:|---:|
| TriMesh | 建筑、地面、静态场景 | 否 | 是 |
| Convex | 简单道具、岩石、箱体 | 是 | 否 |
| Compound | 凹形道具、家具、复杂动态物体 | 是 | 近似 |

### Compound 导入

顶部工具栏选择：

```text
GLB → Compound
简化 QEM
细节 25%
最多 8 Hulls
```

处理流程：

1. `GLTFLoader` 读取 GLB。
2. 将所有 Mesh 节点变换烘焙到统一顶点空间。
3. 第一阶段 Worker 使用 QEM 或 Cluster 生成简化 TriMesh。
4. 第二阶段 Worker递归分割三角形簇。
5. 每个簇提取并缩减为凸包点集。
6. 无体积或退化的 Part 被丢弃。
7. 所有有效 Part 挂到同一个 Rapier 刚体。
8. 原始 GLB 继续作为共享 Visual Component。

可选的最大 Hull 数：4、8、16、32。每个 Hull 默认最多保留 64 个点，Manifest 校验允许最多 256 个点预算。

## 分解算法

当前实现面向浏览器实时编辑，不声称是 VHACD。

算法步骤：

- 以全部三角形作为初始簇。
- 根据簇的三角形数量和包围盒表面积选择最值得继续拆分的簇。
- 计算三角形质心。
- 沿质心分布最长轴进行中位数切分。
- 重复切分，直到达到 Hull 上限或无法产生有效子簇。
- 对每个簇提取唯一顶点。
- 顶点过多时使用三维空间聚类压缩点集。
- 检查点集是否具有非零体积。
- 将结果交给 Rapier `convexHull` 创建真实碰撞体。

它比单个 Convex Hull 更能贴合凹形道具，同时比动态 TriMesh 更适合实时物理。

## Compound Manifest

```json
{
  "id": "chair-compound",
  "type": "compound",
  "position": [0, 1, 0],
  "rotationDeg": [0, 0, 0],
  "scale3": [1, 1, 1],
  "parts": [
    {
      "vertices": [
        [-0.5, -0.5, -0.5],
        [0.5, -0.5, -0.5],
        [0, 0.5, 0],
        [0, 0, 0.5]
      ]
    },
    {
      "vertices": [
        [-0.4, 0.2, -0.3],
        [0.4, 0.2, -0.3],
        [0, 1.2, -0.2],
        [0, 0.3, 0.3]
      ]
    }
  ],
  "body": {
    "mode": "dynamic",
    "gravityScale": 1,
    "linearDamping": 0.15,
    "angularDamping": 0.25
  },
  "behavior": { "mode": "solid" },
  "visual": {
    "url": "bundle:///models/chair.glb",
    "sourceName": "chair.glb",
    "visible": true
  }
}
```

Manifest 仍然使用：

```json
{
  "format": "splat-world",
  "version": 1
}
```

因此 0.9 及更早的 Box、Capsule、Mesh 和 Convex 世界无需迁移。

## Rapier 模型

```text
CompoundColliderData
  ├── shared position / rotation / scale
  ├── shared body settings
  ├── shared gameplay components
  ├── shared GLB visual
  └── parts[]
        ↓
Rapier RigidBody
  ├── Collider(convexHull(part 1))
  ├── Collider(convexHull(part 2))
  └── Collider(convexHull(part N))
```

编辑器只显示一个对象和一个 Transform Gizmo。修改 Transform 或 Scale 后，会重建该刚体的全部子 Collider。

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

Compound 数据直接保存在 `world.json`；GLB、Splat 和音频仍使用 `bundle:///...` 内部 URL，因此不需要升级世界包格式。

## 代码结构

```text
src/
  assets/decomposition/
    DecompositionProtocol.ts       Worker 协议与统计
    ConvexDecomposer.ts            递归三角簇分解
    DecompositionWorker.ts         后台 Worker
    DecompositionWorkerClient.ts   Transferable 与取消
    CompoundUiBootstrap.ts         导入控件和 Inspector 增强
  assets/proxy/
    ProxySimplifier.ts             QEM / Cluster
    ProxyWorker.ts                 简化 Worker
  physics/PhysicsWorld.ts          一个刚体挂载多个 Convex Collider
  assets/GLBColliderExtractor.ts   两阶段导入流水线
  types/world.ts                   Compound Manifest 联合类型
  world/WorldBundle.ts             `.splatworld` 世界包
```

## 已知边界

- 当前分解是基于空间递归分区的实时近似方案，不是 VHACD。
- Hull 之间可能重叠，也可能无法完全覆盖细小凹槽。
- Trigger 的 CPU 预检测使用各 Part 的局部 AABB 并集；最终物理碰撞仍由 Rapier Convex Collider 决定。
- GLTFLoader 解析与节点遍历仍在主线程。
- QEM 只处理碰撞几何，不保留 UV、法线、骨骼和材质属性。
- 复杂模型需要在 Hull 数量、代理精度和物理成本之间权衡。
- `.splatworld` ZIP 导出当前使用 Store 模式。

## 下一阶段

- [x] `.splatworld` 世界包
- [x] Web Worker 代理生成
- [x] QEM Mesh Simplification
- [x] Compound Convex Decomposition
- [ ] Hull 可视化、单 Part 选择与手工调整
- [ ] GLB 解析和世界包压缩迁移到 Worker
- [ ] GLB 动画和材质控制
- [ ] 事件图 / 脚本组件
- [ ] NavMesh 与大场景分块

## 依赖与许可证

- Spark：MIT
- Three.js：MIT
- Rapier：Apache-2.0

项目本身使用 MIT License。导入场景、GLB、音频、训练模型与数据集仍需分别确认授权。
