# Splat World Engine — Runtime + Collider Editor

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。

第一条垂直链路已经跑通：

```text
World manifest
  ├── Gaussian visual assets (Spark)
  ├── Proxy collision boxes (Rapier)
  └── Player spawn
        ↓
First-person playable world
```

## 当前能力

- 使用 Spark 2.1 加载 `.ply`、`.spz`、`.splat`、`.ksplat`、`.sog`、`.zip`、`.rad`
- Gaussian Splats 与 Three.js 场景共存
- Rapier 运动学角色控制器
- WASD、冲刺、跳跃、台阶与斜坡处理
- Gaussian 视觉层和代理碰撞层分离
- JSON 世界清单
- 浏览器本地导入 Splat 文件
- 碰撞代理可视化开关
- Orbit 编辑模式与 Transform Gizmo
- 数值化 Position / Rotation / Size Inspector
- Undo / Redo、复制与删除碰撞体
- 导出更新后的 `world.json`
- 自适应分辨率与基础运行指标

## 运行

要求 Node.js 20+。

```bash
npm install
npm run dev
```

打开：

```text
http://localhost:5173
```

生产构建：

```bash
npm run build
npm run preview
```

## 世界格式

默认世界位于 `public/worlds/demo/world.json`：

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
    }
  ]
}
```

也可以通过 URL 指定另一份世界清单：

```text
http://localhost:5173/?world=/worlds/my-world/world.json
```

## 代码结构

```text
src/
  core/Engine.ts                  主循环与系统编排
  editor/EditorController.ts      Orbit、Gizmo 与编辑快捷键
  render/GaussianWorld.ts         Spark / Splat 视觉层
  physics/PhysicsWorld.ts         Rapier 代理碰撞世界
  player/FirstPersonController.ts 第一人称角色控制
  types/world.ts                  世界清单及运行时校验
  utils/transform.ts              坐标变换工具
```

## 架构原则

```text
看见的世界  = Gaussian Splats
碰撞的世界  = Proxy Geometry
动态的对象  = Mesh + Rigid Body
游戏的逻辑  = ECS / Scripts（下一阶段）
```

不要直接把几百万个高斯当作实时物理碰撞体。高斯适合表达外观；稳定、低复杂度的代理几何更适合碰撞、导航、阴影和射线查询。

## 接下来三步

### M1 — Runtime vertical slice

- [x] 高斯加载
- [x] 第一人称漫游
- [x] 代理碰撞
- [x] 世界清单
- [x] 本地导入

### M2 — Playable scene authoring（当前）

- [x] Orbit 编辑模式
- [x] Transform Gizmo
- [x] 数值 Inspector
- [x] Undo / Redo
- [x] 新增、复制、删除 Box Collider
- [x] 导出世界清单
- [ ] Capsule / Mesh Collider
- [ ] Trigger、Audio、Interactable
- [ ] 简单脚本组件

### M3 — Scan-to-Playable pipeline

- [ ] 从深度/点云提取地面与墙面
- [ ] 自动生成代理 Mesh
- [ ] NavMesh
- [ ] 大场景分块与流式加载
- [ ] Splat 与动态 Mesh 的深度、阴影和色调融合

## 已知边界

- 默认示例从 Spark 官方资源服务器加载示例 SPZ，离线使用时请替换成本地资源。
- 当前代理碰撞只支持 Box；下一阶段加入 Capsule / Mesh Collider。
- 本地导入的 Splat 会放在玩家前方，但尚未进入资产 Inspector。
- 移动端还没有触屏摇杆。
- 尚未实现存档、ECS、音频、触发器和动态 Mesh 物理。

## 依赖与许可证

- Spark：MIT
- Three.js：MIT
- Rapier：Apache-2.0

项目本身使用 MIT License。导入到项目中的场景、训练模型与数据集仍需分别确认其授权。
