import * as THREE from "three";
import type { TransformControlsMode } from "three/addons/controls/TransformControls.js";
import type { GLBImportOptions } from "../assets/GLBColliderExtractor";
import { AudioSystem } from "../audio/AudioSystem";
import { EditorController } from "../editor/EditorController";
import {
  GameplaySystem,
  type GameplayEvent,
  type InteractionPrompt,
} from "../gameplay/GameplaySystem";
import { FirstPersonController } from "../player/FirstPersonController";
import {
  PhysicsWorld,
  type ColliderTransformPatch,
} from "../physics/PhysicsWorld";
import { GaussianWorld, type LoadProgress } from "../render/GaussianWorld";
import { VisualModelSystem } from "../render/VisualModelSystem";
import type {
  BoxColliderData,
  CapsuleColliderData,
  ColliderData,
  ColliderType,
  ConvexColliderData,
  MeshColliderData,
  WorldManifest,
} from "../types/world";

export interface SceneTreeState {
  splats: Array<{ id: string }>;
  colliders: Array<{
    id: string;
    type: ColliderType;
    mode: "solid" | "trigger";
    bodyMode: "fixed" | "dynamic";
    interactable: boolean;
    audio: boolean;
    visual: boolean;
    sourceName?: string;
  }>;
  selectedId: string | null;
}

export interface EngineEvents {
  onStatus?: (message: string) => void;
  onProgress?: (progress: LoadProgress) => void;
  onFrame?: (fps: number, feetPosition: THREE.Vector3) => void;
  onPointerLock?: (locked: boolean) => void;
  onEditorMode?: (enabled: boolean) => void;
  onEditorSelection?: (collider: ColliderData | null) => void;
  onTransformMode?: (mode: TransformControlsMode) => void;
  onHistoryChange?: (canUndo: boolean, canRedo: boolean) => void;
  onSceneTreeChange?: (state: SceneTreeState) => void;
  onGameplayPrompt?: (prompt: InteractionPrompt | null) => void;
  onGameplayEvent?: (event: GameplayEvent) => void;
}

interface EditorSnapshot {
  colliders: ColliderData[];
  selectedId: string | null;
}

const HISTORY_LIMIT = 100;

export class Engine {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(62, 1, 0.03, 1500);
  readonly renderer: THREE.WebGLRenderer;
  readonly gaussianWorld: GaussianWorld;
  readonly physics: PhysicsWorld;
  readonly player: FirstPersonController;
  readonly editor: EditorController;
  readonly gameplay: GameplaySystem;
  readonly audio: AudioSystem;
  readonly visuals: VisualModelSystem;

  private readonly clock = new THREE.Clock();
  private readonly events: EngineEvents;
  private readonly feet = new THREE.Vector3();
  private readonly manifest: WorldManifest;
  private readonly playCameraQuaternion = new THREE.Quaternion();
  private readonly undoStack: EditorSnapshot[] = [];
  private readonly redoStack: EditorSnapshot[] = [];
  private pendingHistorySnapshot: EditorSnapshot | null = null;
  private animationFrame = 0;
  private fpsElapsed = 0;
  private fpsFrames = 0;
  private fpsValue = 0;
  private running = false;
  private editorEnabled = false;
  private debugVisibleBeforeEditor = true;
  private restoringHistory = false;

  private constructor(
    canvas: HTMLCanvasElement,
    manifest: WorldManifest,
    physics: PhysicsWorld,
    events: EngineEvents,
  ) {
    this.events = events;
    this.physics = physics;
    this.manifest = structuredClone(manifest);
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const background = manifest.environment?.background ?? "#090b10";
    this.scene.background = new THREE.Color(background);
    if (manifest.environment?.fogNear && manifest.environment?.fogFar) {
      this.scene.fog = new THREE.Fog(
        background,
        manifest.environment.fogNear,
        manifest.environment.fogFar,
      );
    }

    this.gaussianWorld = new GaussianWorld(this.renderer);
    this.scene.add(this.gaussianWorld.sparkRenderer);
    this.scene.add(this.gaussianWorld.root);
    this.scene.add(physics.debugGroup);

    this.visuals = new VisualModelSystem({
      onStatus: (message) => events.onStatus?.(message),
    });
    this.scene.add(this.visuals.root);

    this.addLighting();
    const character = physics.createCharacter(manifest.spawn.position);
    this.player = new FirstPersonController(
      this.camera,
      canvas,
      physics,
      character,
      manifest.spawn,
    );
    this.audio = new AudioSystem(this.camera, physics);
    this.scene.add(this.audio.root);
    this.gameplay = new GameplaySystem(this.camera, physics, {
      onPrompt: (prompt) => events.onGameplayPrompt?.(prompt),
      onEvent: (event) => {
        this.audio.play(event.sourceId);
        events.onGameplayEvent?.(event);
      },
    });
    this.editor = new EditorController(this.camera, canvas, this.scene, physics, {
      onSelectionChange: (collider) => {
        events.onEditorSelection?.(collider);
        this.emitSceneTree();
      },
      onColliderChange: () => {
        this.syncObjectSystems();
        events.onStatus?.("对象已更新");
        this.emitSceneTree();
      },
      onTransformModeChange: (mode) => events.onTransformMode?.(mode),
      onMutationStart: () => this.beginHistoryMutation(),
      onMutationEnd: () => this.commitHistoryMutation(),
      onDeleteRequested: () => this.deleteSelectedCollider(),
      onDuplicateRequested: () => this.duplicateSelectedCollider(),
      onUndoRequested: () => this.undo(),
      onRedoRequested: () => this.redo(),
    });

    this.player.controls.addEventListener("lock", () => events.onPointerLock?.(true));
    this.player.controls.addEventListener("unlock", () => events.onPointerLock?.(false));

    window.addEventListener("resize", this.resize);
    this.resize();
  }

  static async create(
    canvas: HTMLCanvasElement,
    manifest: WorldManifest,
    events: EngineEvents = {},
  ): Promise<Engine> {
    events.onStatus?.("初始化物理世界");
    const physics = await PhysicsWorld.create();
    for (const collider of manifest.colliders) {
      physics.addCollider(collider);
    }

    const engine = new Engine(canvas, manifest, physics, events);
    events.onStatus?.("加载 Gaussian 场景");
    await Promise.all(
      manifest.splats.map(async (asset) => {
        try {
          await engine.gaussianWorld.addAsset(asset, events.onProgress);
        } catch (error) {
          console.warn(`Failed to load ${asset.id}; using procedural fallback.`, error);
          events.onStatus?.(`${asset.id} 加载失败，启用离线 Gaussian 场景`);
          engine.gaussianWorld.addProceduralFallback(asset);
        }
      }),
    );
    events.onStatus?.("世界已就绪");
    events.onHistoryChange?.(false, false);
    engine.syncObjectSystems();
    engine.emitSceneTree();
    return engine;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.clock.start();
    this.animationFrame = requestAnimationFrame(this.frame);
  }

  lockPointer(): void {
    if (!this.editorEnabled) this.player.controls.lock();
  }

  async resumeAudio(): Promise<void> {
    await this.audio.resume();
  }

  isEditorEnabled(): boolean {
    return this.editorEnabled;
  }

  setEditorMode(enabled: boolean): void {
    if (enabled === this.editorEnabled) return;
    this.commitHistoryMutation();
    this.editorEnabled = enabled;

    if (enabled) {
      this.playCameraQuaternion.copy(this.camera.quaternion);
      this.debugVisibleBeforeEditor = this.physics.isDebugVisible();
      this.physics.setDebugVisible(true);
      this.player.setEnabled(false);
      this.gameplay.setEnabled(false);
      this.audio.setEnabled(false);
      this.editor.setEnabled(true);
      this.events.onStatus?.("编辑模式：TriMesh、Convex 与 Compound Hull 可用");
    } else {
      this.editor.setEnabled(false);
      this.editor.select(null);
      this.physics.setDebugVisible(this.debugVisibleBeforeEditor);
      this.camera.quaternion.copy(this.playCameraQuaternion);
      this.player.syncCamera();
      this.player.setEnabled(true);
      this.gameplay.setEnabled(true);
      this.audio.setEnabled(true);
      this.syncObjectSystems();
      this.events.onStatus?.("游玩模式已就绪");
    }
    this.events.onEditorMode?.(enabled);
    this.emitSceneTree();
  }

  toggleEditorMode(): boolean {
    this.setEditorMode(!this.editorEnabled);
    return this.editorEnabled;
  }

  toggleColliderDebug(): boolean {
    return this.physics.toggleDebugVisible();
  }

  selectCollider(id: string | null): void {
    if (this.editorEnabled) this.editor.select(id);
  }

  addBoxCollider(): BoxColliderData | null {
    if (!this.editorEnabled) return null;
    this.beginHistoryMutation();
    const collider = this.editor.addBoxCollider();
    this.commitHistoryMutation();
    return collider;
  }

  addCapsuleCollider(): CapsuleColliderData | null {
    if (!this.editorEnabled) return null;
    this.beginHistoryMutation();
    const collider = this.editor.addCapsuleCollider();
    this.commitHistoryMutation();
    return collider;
  }

  addMeshCollider(): MeshColliderData | null {
    if (!this.editorEnabled) return null;
    this.beginHistoryMutation();
    const collider = this.editor.addMeshCollider();
    this.commitHistoryMutation();
    return collider;
  }

  addConvexCollider(): ConvexColliderData | null {
    if (!this.editorEnabled) return null;
    this.beginHistoryMutation();
    const collider = this.editor.addConvexCollider();
    this.commitHistoryMutation();
    return collider;
  }

  async importGLBWorldObject(
    file: File,
    options: GLBImportOptions,
  ): Promise<ColliderData | null> {
    if (!this.editorEnabled) return null;
    this.beginHistoryMutation();
    try {
      const collider = await this.editor.importGLBWorldObject(file, options);
      this.commitHistoryMutation();
      this.syncObjectSystems();
      const detail = Math.round(options.detail * 100);
      if (collider.type === "mesh") {
        this.events.onStatus?.(
          `已从 ${file.name} 创建 TriMesh · ${collider.indices.length / 3} 三角形 · ${detail}% 细节`,
        );
      } else if (collider.type === "compound") {
        const points = collider.parts.reduce((sum, part) => sum + part.vertices.length, 0);
        this.events.onStatus?.(
          `已从 ${file.name} 创建 Compound · ${collider.parts.length} Hulls · ${points} 点 · ${detail}% 细节`,
        );
      } else {
        this.events.onStatus?.(
          `已从 ${file.name} 创建 Convex Hull · ${collider.vertices.length} 点 · ${detail}% 细节`,
        );
      }
      return collider;
    } catch (error) {
      this.cancelHistoryMutation();
      throw error;
    }
  }

  duplicateSelectedCollider(): ColliderData | null {
    if (!this.editorEnabled) return null;
    this.beginHistoryMutation();
    const collider = this.editor.duplicateSelected();
    if (!collider) {
      this.cancelHistoryMutation();
      return null;
    }
    this.commitHistoryMutation();
    this.syncObjectSystems();
    this.events.onStatus?.(`已复制为 ${collider.id}`);
    return collider;
  }

  deleteSelectedCollider(): string | null {
    if (!this.editorEnabled) return null;
    this.beginHistoryMutation();
    const id = this.editor.deleteSelected();
    if (!id) {
      this.cancelHistoryMutation();
      return null;
    }
    this.commitHistoryMutation();
    this.syncObjectSystems();
    this.events.onStatus?.(`已删除对象 ${id}`);
    this.emitSceneTree();
    return id;
  }

  updateSelectedCollider(patch: ColliderTransformPatch): ColliderData | null {
    if (!this.editorEnabled || !this.editor.getSelectedId()) return null;
    this.beginHistoryMutation();
    const collider = this.editor.updateSelectedCollider(patch);
    if (!collider) {
      this.cancelHistoryMutation();
      return null;
    }
    this.commitHistoryMutation();
    this.syncObjectSystems();
    return collider;
  }

  setTransformMode(mode: TransformControlsMode): void {
    if (this.editorEnabled) this.editor.setTransformMode(mode);
  }

  focusSelectedCollider(): void {
    if (this.editorEnabled) this.editor.focusSelection();
  }

  undo(): boolean {
    if (!this.editorEnabled) return false;
    this.cancelHistoryMutation();
    const target = this.undoStack.pop();
    if (!target) return false;

    this.redoStack.push(this.captureEditorSnapshot());
    this.restoreEditorSnapshot(target);
    this.events.onStatus?.("已撤销");
    this.emitHistoryState();
    return true;
  }

  redo(): boolean {
    if (!this.editorEnabled) return false;
    this.cancelHistoryMutation();
    const target = this.redoStack.pop();
    if (!target) return false;

    this.undoStack.push(this.captureEditorSnapshot());
    this.restoreEditorSnapshot(target);
    this.events.onStatus?.("已重做");
    this.emitHistoryState();
    return true;
  }

  exportWorldManifest(): WorldManifest {
    return {
      ...structuredClone(this.manifest),
      colliders: this.physics.getAllColliderData(),
    };
  }

  downloadWorldManifest(): void {
    const manifest = this.exportWorldManifest();
    const blob = new Blob([`${JSON.stringify(manifest, null, 2)}\n`], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "world.json";
    link.click();
    URL.revokeObjectURL(url);
    this.events.onStatus?.("已导出 world.json");
  }

  async importSplat(file: File): Promise<void> {
    this.events.onStatus?.(`导入 ${file.name}`);
    const mesh = await this.gaussianWorld.addLocalFile(file);
    mesh.position.copy(this.player.getFeetPosition()).add(new THREE.Vector3(0, 0, -4));
    this.events.onStatus?.(`已导入 ${file.name}`);
  }

  dispose(): void {
    this.running = false;
    cancelAnimationFrame(this.animationFrame);
    window.removeEventListener("resize", this.resize);
    this.editor.dispose();
    this.gameplay.dispose();
    this.audio.dispose();
    this.visuals.dispose();
    this.player.dispose();
    this.gaussianWorld.dispose();
    this.renderer.dispose();
  }

  private beginHistoryMutation(): void {
    if (this.restoringHistory || this.pendingHistorySnapshot) return;
    this.pendingHistorySnapshot = this.captureEditorSnapshot();
  }

  private commitHistoryMutation(): void {
    const before = this.pendingHistorySnapshot;
    this.pendingHistorySnapshot = null;
    if (!before || this.restoringHistory) return;

    const after = this.captureEditorSnapshot();
    if (snapshotsEqual(before, after)) return;
    this.undoStack.push(before);
    if (this.undoStack.length > HISTORY_LIMIT) this.undoStack.shift();
    this.redoStack.length = 0;
    this.emitHistoryState();
    this.emitSceneTree();
  }

  private cancelHistoryMutation(): void {
    this.pendingHistorySnapshot = null;
  }

  private captureEditorSnapshot(): EditorSnapshot {
    return {
      colliders: this.physics.getAllColliderData(),
      selectedId: this.editor.getSelectedId(),
    };
  }

  private restoreEditorSnapshot(snapshot: EditorSnapshot): void {
    this.restoringHistory = true;
    try {
      this.editor.select(null);
      this.physics.replaceAllColliders(snapshot.colliders);
      const selectedId =
        snapshot.selectedId && this.physics.getColliderData(snapshot.selectedId)
          ? snapshot.selectedId
          : null;
      this.editor.select(selectedId);
      this.syncObjectSystems();
      this.emitSceneTree();
    } finally {
      this.restoringHistory = false;
    }
  }

  private syncObjectSystems(): void {
    const colliders = this.physics.getAllColliderData();
    this.audio.update();
    this.visuals.update(colliders);
  }

  private emitHistoryState(): void {
    this.events.onHistoryChange?.(this.undoStack.length > 0, this.redoStack.length > 0);
  }

  private emitSceneTree(): void {
    this.events.onSceneTreeChange?.({
      splats: this.manifest.splats.map((asset) => ({ id: asset.id })),
      colliders: this.physics.getAllColliderData().map((collider) => ({
        id: collider.id,
        type: collider.type,
        mode: collider.behavior?.mode ?? "solid",
        bodyMode: collider.body?.mode ?? "fixed",
        interactable: Boolean(collider.interactable),
        audio: Boolean(collider.audio),
        visual: Boolean(collider.visual),
        sourceName:
          collider.type === "mesh" ||
          collider.type === "convex" ||
          collider.type === "compound"
            ? collider.sourceName
            : undefined,
      })),
      selectedId: this.editor.getSelectedId(),
    });
  }

  private addLighting(): void {
    const hemisphere = new THREE.HemisphereLight(0xd8e8ff, 0x151820, 1.15);
    this.scene.add(hemisphere);

    const directional = new THREE.DirectionalLight(0xffffff, 1.5);
    directional.position.set(4, 8, 3);
    this.scene.add(directional);
  }

  private readonly resize = (): void => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / Math.max(height, 1);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  };

  private readonly frame = (): void => {
    if (!this.running) return;
    const delta = Math.min(this.clock.getDelta(), 0.05);

    if (this.editorEnabled) {
      this.editor.update();
      this.visuals.update(this.physics.getAllColliderData());
    } else {
      this.player.updateBeforePhysics(delta);
      this.physics.step(delta);
      this.physics.syncDynamicMeshes();
      this.player.syncCamera();
      const colliders = this.physics.getAllColliderData();
      this.gameplay.update(this.player.getFeetPosition(this.feet));
      this.audio.update();
      this.visuals.update(colliders);
    }
    this.renderer.render(this.scene, this.camera);

    this.fpsElapsed += delta;
    this.fpsFrames += 1;
    if (this.fpsElapsed >= 0.35) {
      this.fpsValue = Math.round(this.fpsFrames / this.fpsElapsed);
      this.fpsFrames = 0;
      this.fpsElapsed = 0;
    }
    this.events.onFrame?.(this.fpsValue, this.player.getFeetPosition(this.feet));
    this.animationFrame = requestAnimationFrame(this.frame);
  };
}

function snapshotsEqual(left: EditorSnapshot, right: EditorSnapshot): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
