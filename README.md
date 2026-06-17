# Splat World Engine — Gaussian Runtime + GLB World Objects

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Gaussian Splats 负责照片级世界，GLB 可视模型、简化代理碰撞和 Rapier 刚体负责可玩性。

```text
GLB world object
  ├── embedded visual model
  ├── simplified TriMesh proxy
  │        or
  └── Convex Hull proxy
           ↓
Shared transform + Rapier physics + gameplay components
```

## Runtime 0.7 能力

- Spark 2.1 Gaussian Splat 渲染
- 支持 `.ply`、`.spz`、`.splat`、`.ksplat`、`.sog`、`.zip`、`.rad`
- Box、Capsule、TriMesh 与 Convex Hull Collider
- 本地 GLB 同时导入可视模型与碰撞代理
- GLB 可选择 `TriMesh` 或 `Convex` 代理
- 代理细节支持 100%、50%、25%、10%
- 基于顶点聚类的浏览器端代理简化
- GLB 节点变换会烘焙到碰撞顶点
- 导入模型会自动居中，并与碰撞代理共享 Transform
- GLB 以 Data URL 嵌入 `world.json`，导出后仍可独立加载
- Convex Collider 支持动态刚体与 Trigger
- TriMesh 保持静态，适合建筑和地形
- 动态 Box、Capsule、Convex 由 Rapier 驱动
- Trigger、Interactable、位置音频
- 场景对象树、Transform Gizmo、数值 Inspector
- Undo / Redo 覆盖几何、可视模型、物理和游戏组件

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

## 导入 GLB 世界对象

进入编辑模式，在顶部选择代理模式与细节：

```text
GLB → TriMesh  + 细节 25%
GLB → Convex   + 细节 50%
```

随后点击 **导入 GLB 世界对象**。

处理流程：

1. `GLTFLoader` 读取本地 `.glb`。
2. 遍历全部 Mesh 节点。
3. 将节点世界变换烘焙到顶点。
4. 按选择的细节档位进行顶点聚类。
5. TriMesh 路径重建三角形并移除退化面。
6. Convex 路径保留聚类点，由 Rapier 创建 Convex Hull。
7. 原始 GLB 作为可视组件嵌入对象。
8. 可视模型与代理共享位置、旋转和缩放。

### 选择 TriMesh 还是 Convex

| 代理 | 适合 | 动态刚体 | Trigger |
|---|---|---:|---:|
| TriMesh | 建筑、地面、复杂静态结构 | 否 | 否 |
| Convex | 道具、岩石、箱体、可推动对象 | 是 | 是 |

TriMesh 最多输出 100,000 个三角形，输入 GLB 最多接受 500,000 个三角形。嵌入式 GLB 文件上限为 25 MB。

## 数据格式

### 带可视模型的 Convex 对象

```json
{
  "id": "rock-convex",
  "type": "convex",
  "position": [0, 2, 0],
  "rotationDeg": [0, 0, 0],
  "scale3": [1, 1, 1],
  "vertices": [
    [-1, -1, -1],
    [1, -1, -1],
    [0, 1, 0],
    [0, 0, 1]
  ],
  "sourceName": "rock.glb",
  "visual": {
    "url": "data:model/gltf-binary;base64,...",
    "sourceName": "rock.glb",
    "visible": true
  },
  "behavior": { "mode": "solid" },
  "body": {
    "mode": "dynamic",
    "gravityScale": 1,
    "linearDamping": 0.15,
    "angularDamping": 0.25
  }
}
```

### 静态 TriMesh 对象

```json
{
  "id": "building-mesh",
  "type": "mesh",
  "position": [0, 0, 0],
  "scale3": [1, 1, 1],
  "vertices": [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  "indices": [0, 1, 2],
  "sourceName": "building.glb",
  "visual": {
    "url": "data:model/gltf-binary;base64,...",
    "sourceName": "building.glb",
    "visible": true
  },
  "behavior": { "mode": "solid" },
  "body": { "mode": "fixed" }
}
```

## 简化策略

当前简化器采用顶点聚类：

- 根据模型包围盒建立三维网格。
- 同一网格单元内的顶点合并为平均位置。
- TriMesh 重映射索引并删除退化、重复三角形。
- Convex 直接将聚类后的点集交给 Rapier Convex Hull。

它适合实时生成碰撞代理，不以保留渲染细节为目标。后续会加入 QEM、误差可视化与后台 Worker。

## 代码结构

```text
src/
  assets/GLBColliderExtractor.ts  GLB 解析、嵌入和代理简化
  render/VisualModelSystem.ts      GLB 可视组件加载与 Transform 同步
  physics/PhysicsWorld.ts          Box / Capsule / TriMesh / Convex
  core/Engine.ts                   Runtime 与编辑系统编排
  editor/EditorController.ts       GLB 导入和对象编辑
  audio/AudioSystem.ts             位置音频
  gameplay/GameplaySystem.ts       Trigger 与 Interactable
  render/GaussianWorld.ts          Gaussian Splat 视觉层
  types/world.ts                   Manifest 与组件联合类型
```

## 架构原则

```text
照片级背景       = Gaussian Splats
导入道具外观     = GLB Visual Component
复杂静态碰撞     = Simplified TriMesh
动态道具碰撞     = Convex Hull
简单空间代理     = Box / Capsule
游戏行为         = Trigger / Interactable / Audio
```

## 已知边界

- Data URL 会增大 `world.json`，适合原型和小型资产；正式管线应输出资产包并使用相对 URL。
- 当前聚类简化不保证保留薄壁和小孔洞。
- Convex Hull 无法表达凹形结构，凹形静态场景应使用 TriMesh。
- GLB 可视模型尚未提供材质 Inspector、动画和独立 Transform。
- 大文件解析仍运行在主线程。

## 下一阶段

- [ ] `.splatworld` 资产包导入与导出
- [ ] Web Worker 代理生成
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
