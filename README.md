# Splat World Engine — Gaussian Runtime + Gameplay Authoring

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Gaussian Splats 负责照片级视觉，代理几何负责碰撞，Trigger 与 Interactable 组件负责最小游戏逻辑。

```text
World manifest
  ├── Gaussian visual assets (Spark)
  ├── Proxy colliders (Rapier)
  │     ├── Box
  │     ├── Capsule
  │     └── TriMesh
  ├── Trigger behavior
  └── Interactable component
        ↓
First-person playable world + browser editor
```

## 当前能力

- Spark 2.1 Gaussian Splat 渲染
- 支持 `.ply`、`.spz`、`.splat`、`.ksplat`、`.sog`、`.zip`、`.rad`
- Rapier 第一人称角色控制、冲刺、跳跃、台阶和斜坡
- Box、Capsule 与 TriMesh Collider
- Collider 可切换为 Trigger Sensor（Box / Capsule）
- Collider 可附加 Interactable 组件，游玩时按 `E` 触发
- 左侧场景对象树显示形状、Trigger 与 Interactable 状态
- Orbit 编辑相机、Transform Gizmo、数值 Inspector
- 新增、复制、删除、聚焦碰撞体
- Undo / Redo 覆盖形状、行为组件和对象增删
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

## Collider 数据

### Box Trigger

```json
{
  "id": "welcome-zone",
  "type": "box",
  "position": [0, 1, 2],
  "size": [3, 2, 3],
  "behavior": {
    "mode": "trigger",
    "event": "zone:enter",
    "message": "Entered the zone",
    "once": true
  }
}
```

### Interactable Capsule

```json
{
  "id": "pillar",
  "type": "capsule",
  "position": [2, 1.2, 0],
  "radius": 0.4,
  "halfHeight": 0.8,
  "behavior": { "mode": "solid" },
  "interactable": {
    "prompt": "检查柱体",
    "event": "pillar:inspect",
    "message": "A capsule collider",
    "maxDistance": 3
  }
}
```

### Mesh Collider

```json
{
  "id": "ramp",
  "type": "mesh",
  "position": [0, 0, -2],
  "scale3": [1, 1, 1],
  "vertices": [
    [-1, 0, -1], [1, 0, -1], [1, 0, 1], [-1, 0, 1],
    [-1, 1, -1], [1, 1, -1]
  ],
  "indices": [0, 2, 1, 0, 3, 2, 4, 5, 2, 4, 2, 3],
  "behavior": { "mode": "solid" }
}
```

Mesh Collider 使用静态 Rapier TriMesh。当前编辑器内置 `+ Mesh` 会创建一个可缩放的斜坡模板；后续会支持从 GLB 自动提取代理网格。

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
| 游玩交互 | `E` |

## 代码结构

```text
src/
  core/Engine.ts                  主循环、历史、场景树与系统编排
  editor/EditorController.ts      Orbit、Gizmo、选择与创建工具
  gameplay/GameplaySystem.ts      Trigger 检测与 Interactable 运行时
  render/GaussianWorld.ts         Spark / Splat 视觉层
  physics/PhysicsWorld.ts         Rapier Box / Capsule / TriMesh 世界
  player/FirstPersonController.ts 第一人称角色控制
  types/world.ts                  Manifest、Collider 与行为组件类型
```

## 架构原则

```text
看见的世界  = Gaussian Splats
碰撞的世界  = Proxy Geometry
空间事件    = Trigger Sensor
主动交互    = Interactable Component
动态对象    = Mesh + Rigid Body（下一阶段）
```

## 路线图

### M1 — Runtime vertical slice

- [x] 高斯加载
- [x] 第一人称漫游
- [x] 代理碰撞
- [x] 世界清单

### M2 — Playable scene authoring

- [x] 场景对象树
- [x] Transform Gizmo 与数值 Inspector
- [x] Undo / Redo
- [x] Box / Capsule / Mesh Collider
- [x] Trigger Volume
- [x] Interactable Component
- [x] 导出世界清单
- [ ] 从 GLB 自动提取 Mesh Collider
- [ ] Audio、动态 Mesh 与脚本组件

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
