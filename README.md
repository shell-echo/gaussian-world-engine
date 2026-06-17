# Splat World Engine — Gaussian Runtime + Scene Authoring

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Gaussian Splats 负责照片级视觉，稳定的代理几何负责碰撞、导航和游戏逻辑。

```text
World manifest
  ├── Gaussian visual assets (Spark)
  ├── Proxy colliders (Rapier)
  │     ├── Box
  │     └── Capsule
  └── Player spawn
        ↓
First-person playable world + browser editor
```

## 当前能力

- Spark 2.1 Gaussian Splat 渲染
- 支持 `.ply`、`.spz`、`.splat`、`.ksplat`、`.sog`、`.zip`、`.rad`
- Rapier 第一人称角色控制、冲刺、跳跃、台阶和斜坡
- Gaussian 视觉层与代理物理层分离
- Box Collider 与 Capsule Collider
- 左侧场景对象树：Splats 与 Colliders 分组
- Orbit 编辑相机与 Transform Gizmo
- Position / Rotation 数值编辑
- Box Size 与 Capsule Radius / Half Height 编辑
- 新增、复制、删除、聚焦碰撞体
- Undo / Redo，覆盖 Gizmo、数值编辑和对象增删
- 导出更新后的 `world.json`
- 浏览器本地导入 Splat 文件

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

## 世界格式

```json
{
  "format": "splat-world",
  "version": 1,
  "name": "My World",
  "spawn": {
    "position": [0, 0, 4],
    "yawDeg": 0
  },
  "splats": [
    {
      "id": "room",
      "url": "/assets/room.spz",
      "position": [0, 0, 0],
      "rotationDeg": [180, 0, 0],
      "scale": 1,
      "lod": true
    }
  ],
  "colliders": [
    {
      "id": "floor",
      "type": "box",
      "position": [0, -0.25, 0],
      "size": [20, 0.5, 20]
    },
    {
      "id": "pillar",
      "type": "capsule",
      "position": [2, 1.2, 0],
      "rotationDeg": [0, 0, 0],
      "radius": 0.4,
      "halfHeight": 0.8
    }
  ]
}
```

`halfHeight` 是 Capsule 中间圆柱部分的一半长度，不包含两端半球。

## 编辑快捷键

| 操作 | 快捷键 |
|---|---|
| 移动 | `W` |
| 旋转 | `E` |
| 缩放 | `R` |
| 聚焦 | `F` |
| 复制 | `Ctrl/Cmd + D` |
| 撤销 | `Ctrl/Cmd + Z` |
| 重做 | `Ctrl/Cmd + Shift + Z` |
| 删除 | `Delete` |
| 取消选择 | `Esc` |

## 代码结构

```text
src/
  core/Engine.ts                  主循环、历史和场景树状态
  editor/EditorController.ts      Orbit、Gizmo、选择与编辑快捷键
  render/GaussianWorld.ts         Spark / Splat 视觉层
  physics/PhysicsWorld.ts         Rapier Box / Capsule 代理碰撞世界
  player/FirstPersonController.ts 第一人称角色控制
  types/world.ts                  世界清单和 Collider 联合类型
  utils/transform.ts              坐标变换工具
```

## 架构原则

```text
看见的世界  = Gaussian Splats
碰撞的世界  = Proxy Geometry
动态的对象  = Mesh + Rigid Body
游戏的逻辑  = ECS / Scripts（下一阶段）
```

不要直接把数百万个高斯作为物理碰撞体。高斯适合表达外观；低复杂度的 Box、Capsule 与 Mesh Proxy 更适合碰撞、导航、阴影和射线查询。

## 路线图

### M1 — Runtime vertical slice

- [x] 高斯加载
- [x] 第一人称漫游
- [x] 代理碰撞
- [x] 世界清单
- [x] 本地导入

### M2 — Playable scene authoring（当前）

- [x] 场景对象树
- [x] Orbit 编辑模式
- [x] Transform Gizmo
- [x] 数值 Inspector
- [x] Undo / Redo
- [x] Box Collider
- [x] Capsule Collider
- [x] 导出世界清单
- [ ] Mesh Collider
- [ ] Trigger、Audio、Interactable
- [ ] 简单脚本组件

### M3 — Scan-to-Playable pipeline

- [ ] 从深度/点云提取地面与墙面
- [ ] 自动生成代理 Mesh
- [ ] NavMesh
- [ ] 大场景分块与流式加载
- [ ] Splat 与动态 Mesh 的深度、阴影和色调融合

## 依赖与许可证

- Spark：MIT
- Three.js：MIT
- Rapier：Apache-2.0

项目本身使用 MIT License。导入场景、训练模型与数据集仍需分别确认授权。
