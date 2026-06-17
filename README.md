# Splat World Engine — Gaussian Runtime + Physics Authoring

一个 **Gaussian-first、Mesh-assisted** 的浏览器游戏 Runtime 原型。Gaussian Splats 负责照片级视觉，代理几何、动态刚体和组件系统负责可玩的世界。

```text
World manifest
  ├── Gaussian visual assets (Spark)
  ├── Proxy colliders (Rapier)
  │     ├── Box
  │     ├── Capsule
  │     └── TriMesh / imported GLB
  ├── Fixed / Dynamic rigid body
  ├── Trigger / Interactable
  └── Positional Audio Source
        ↓
First-person playable world + browser editor
```

## Runtime 0.6 能力

- Spark 2.1 Gaussian Splat 渲染
- 支持 `.ply`、`.spz`、`.splat`、`.ksplat`、`.sog`、`.zip`、`.rad`
- Rapier 第一人称角色控制、冲刺、跳跃、台阶和斜坡
- Box、Capsule 与 TriMesh Collider
- 从本地 `.glb` 自动提取所有三角网格，合并节点变换并生成 Mesh Collider
- Box / Capsule 可切换为 Dynamic Rigid Body
- 动态刚体位姿实时同步回场景对象和导出的 Manifest
- Box / Capsule Trigger Sensor
- Interactable 组件与 `E` 键交互
- Collider 可附加 Web Audio 位置音频
- 音频支持 URL、音量、循环、自动播放和 Reference Distance
- 交互或 Trigger 事件会尝试播放同一对象的 Audio Source
- 场景对象树、Transform Gizmo、数值 Inspector
- Undo / Redo 覆盖几何、刚体、音频和游戏组件
- 导出更新后的 `world.json`

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

## GLB → Mesh Collider

进入编辑模式后点击 **导入 GLB 碰撞**。处理流程：

1. 使用 Three.js `GLTFLoader` 解析二进制 GLB。
2. 遍历所有 Mesh 节点。
3. 将节点的世界变换烘焙到顶点。
4. 合并顶点与三角形索引。
5. 将几何中心移到 Collider 原点。
6. 创建 Rapier 静态 TriMesh。

当前限制为 100,000 个三角形。游戏场景中的代理碰撞应当使用低模，而不是直接导入渲染高模。

```json
{
  "id": "building-proxy",
  "type": "mesh",
  "position": [0, 0, 0],
  "rotationDeg": [0, 0, 0],
  "scale3": [1, 1, 1],
  "sourceName": "building-collision.glb",
  "vertices": [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  "indices": [0, 1, 2],
  "behavior": { "mode": "solid" },
  "body": { "mode": "fixed" }
}
```

## Dynamic Rigid Body

只有 Box 和 Capsule 可以成为动态刚体。Trigger 与 TriMesh 会强制保持 Fixed。

```json
{
  "id": "crate",
  "type": "box",
  "position": [0, 3, 0],
  "size": [0.8, 0.8, 0.8],
  "behavior": { "mode": "solid" },
  "body": {
    "mode": "dynamic",
    "gravityScale": 1,
    "linearDamping": 0.15,
    "angularDamping": 0.25
  }
}
```

动态物体由 Rapier 驱动。每个物理帧之后，Runtime 会把平移与旋转同步回编辑代理和 Manifest 数据，因此导出时会保存当前姿态。

## Positional Audio Source

Audio Source 直接附加在 Collider 上，并跟随动态对象移动。

```json
{
  "id": "radio",
  "type": "box",
  "position": [2, 0.5, 0],
  "size": [0.5, 0.5, 0.5],
  "body": { "mode": "fixed" },
  "audio": {
    "url": "/audio/radio.ogg",
    "volume": 0.8,
    "refDistance": 2,
    "loop": true,
    "autoplay": true
  },
  "interactable": {
    "prompt": "打开收音机",
    "event": "radio:play",
    "message": "Radio activated",
    "maxDistance": 3
  }
}
```

浏览器要求用户手势后才能启动 AudioContext，因此 Runtime 会在玩家点击“进入世界”时解锁音频。

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
  assets/GLBColliderExtractor.ts  GLB 三角网格提取与合并
  audio/AudioSystem.ts            Three.js 位置音频运行时
  core/Engine.ts                  主循环、历史与系统编排
  editor/EditorController.ts      Orbit、Gizmo、创建与 GLB 导入
  gameplay/GameplaySystem.ts      Trigger 检测与 Interactable
  render/GaussianWorld.ts         Spark / Splat 视觉层
  physics/PhysicsWorld.ts         Fixed / Dynamic Rapier 世界
  player/FirstPersonController.ts 第一人称角色控制
  types/world.ts                  Manifest 与组件类型
```

## 架构原则

```text
看见的世界  = Gaussian Splats
静态碰撞    = Low-poly TriMesh / Box / Capsule
动态对象    = Box / Capsule + Dynamic Rigid Body
空间事件    = Trigger Sensor
主动交互    = Interactable Component
声音        = Positional Audio Source
```

## 下一阶段

- [ ] 将 GLB 可视模型与碰撞代理同时导入
- [ ] Convex Hull 与自动低模简化
- [ ] 动态 Mesh 可视对象和材质
- [ ] Audio Zone、混响和环境音频
- [ ] 事件图 / 简单脚本组件
- [ ] 自动生成 NavMesh
- [ ] 大场景分块与流式加载

## 依赖与许可证

- Spark：MIT
- Three.js：MIT
- Rapier：Apache-2.0

项目本身使用 MIT License。导入场景、音频、训练模型与数据集仍需分别确认授权。
