import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  TransformControls,
  type TransformControlsMode,
} from "three/addons/controls/TransformControls.js";
import type { ColliderTransformPatch, PhysicsWorld } from "../physics/PhysicsWorld";
import type { BoxColliderData, Vec3Tuple } from "../types/world";

export interface EditorEvents {
  onSelectionChange?: (collider: BoxColliderData | null) => void;
  onColliderChange?: (collider: BoxColliderData) => void;
  onTransformModeChange?: (mode: TransformControlsMode) => void;
  onMutationStart?: () => void;
  onMutationEnd?: () => void;
  onDeleteRequested?: () => void;
  onDuplicateRequested?: () => void;
  onUndoRequested?: () => void;
  onRedoRequested?: () => void;
}

export class EditorController {
  readonly orbit: OrbitControls;
  readonly transform: TransformControls;

  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly cameraDirection = new THREE.Vector3();
  private selectedId: string | null = null;
  private active = false;

  constructor(
    private readonly camera: THREE.PerspectiveCamera,
    private readonly canvas: HTMLCanvasElement,
    private readonly scene: THREE.Scene,
    private readonly physics: PhysicsWorld,
    private readonly events: EditorEvents = {},
  ) {
    this.orbit = new OrbitControls(camera, canvas);
    this.orbit.enabled = false;
    this.orbit.enableDamping = true;
    this.orbit.dampingFactor = 0.08;
    this.orbit.screenSpacePanning = true;
    this.orbit.minDistance = 0.2;
    this.orbit.maxDistance = 400;

    this.transform = new TransformControls(camera, canvas);
    this.transform.enabled = false;
    this.transform.setMode("translate");
    this.transform.setTranslationSnap(0.05);
    this.transform.setRotationSnap(THREE.MathUtils.degToRad(5));
    this.transform.setScaleSnap(0.05);
    const helper = this.transform.getHelper();
    helper.name = "Collider transform gizmo";
    helper.visible = false;
    scene.add(helper);

    this.transform.addEventListener("dragging-changed", (event) => {
      this.orbit.enabled = this.active && !Boolean(event.value);
    });
    this.transform.addEventListener("mouseDown", this.onTransformStart);
    this.transform.addEventListener("objectChange", this.onObjectChange);
    this.transform.addEventListener("mouseUp", this.onTransformCommit);

    canvas.addEventListener("pointerdown", this.onPointerDown);
    window.addEventListener("keydown", this.onKeyDown);
  }

  setEnabled(enabled: boolean): void {
    this.active = enabled;
    this.orbit.enabled = enabled;
    this.transform.enabled = enabled;
    this.transform.getHelper().visible = enabled && this.selectedId !== null;

    if (enabled) {
      this.camera.getWorldDirection(this.cameraDirection);
      this.orbit.target.copy(this.camera.position).addScaledVector(this.cameraDirection, 4);
      this.orbit.update();
    }
  }

  isEnabled(): boolean {
    return this.active;
  }

  update(): void {
    if (this.active) this.orbit.update();
  }

  getSelectedId(): string | null {
    return this.selectedId;
  }

  select(id: string | null): void {
    if (id === this.selectedId && id !== null) {
      this.refreshSelection();
      return;
    }

    this.selectedId = id;
    this.physics.setSelectedCollider(id);

    if (!id) {
      this.transform.detach();
      this.transform.getHelper().visible = false;
      this.events.onSelectionChange?.(null);
      return;
    }

    const mesh = this.physics.getColliderMesh(id);
    if (!mesh) {
      this.select(null);
      return;
    }
    this.transform.attach(mesh);
    this.transform.getHelper().visible = this.active;
    this.events.onSelectionChange?.(this.physics.previewColliderTransform(id));
  }

  refreshSelection(): void {
    if (!this.selectedId) {
      this.events.onSelectionChange?.(null);
      return;
    }
    this.events.onSelectionChange?.(this.physics.previewColliderTransform(this.selectedId));
  }

  updateSelectedCollider(patch: ColliderTransformPatch): BoxColliderData | null {
    if (!this.selectedId) return null;
    const collider = this.physics.updateBoxCollider(this.selectedId, patch);
    if (!collider) return null;
    this.refreshSelection();
    this.events.onColliderChange?.(collider);
    return collider;
  }

  addBoxCollider(): BoxColliderData {
    const id = this.createUniqueColliderId("box");
    const position = this.orbit.target.toArray() as Vec3Tuple;
    position[1] = Math.max(position[1], 0.5);
    const data: BoxColliderData = {
      id,
      type: "box",
      position,
      rotationDeg: [0, 0, 0],
      size: [1, 1, 1],
    };
    this.physics.addBoxCollider(data);
    this.select(id);
    this.events.onColliderChange?.(data);
    return data;
  }

  duplicateSelected(): BoxColliderData | null {
    if (!this.selectedId) return null;
    const source = this.physics.getColliderData(this.selectedId);
    if (!source) return null;

    const position = source.position ?? [0, 0, 0];
    const data: BoxColliderData = {
      ...source,
      id: this.createUniqueColliderId(`${source.id}-copy`),
      position: [position[0] + 0.25, position[1] + 0.25, position[2] + 0.25],
      rotationDeg: source.rotationDeg ? [...source.rotationDeg] : [0, 0, 0],
      size: [...source.size],
    };
    this.physics.addBoxCollider(data);
    this.select(data.id);
    this.events.onColliderChange?.(data);
    return data;
  }

  deleteSelected(): string | null {
    if (!this.selectedId) return null;
    const id = this.selectedId;
    this.select(null);
    this.physics.removeBoxCollider(id);
    return id;
  }

  setTransformMode(mode: TransformControlsMode): void {
    this.transform.setMode(mode);
    this.events.onTransformModeChange?.(mode);
  }

  focusSelection(): void {
    if (!this.selectedId) return;
    const mesh = this.physics.getColliderMesh(this.selectedId);
    if (!mesh) return;
    this.orbit.target.copy(mesh.position);
    const radius = Math.max(mesh.scale.x, mesh.scale.y, mesh.scale.z, 1);
    const direction = this.camera.position.clone().sub(this.orbit.target).normalize();
    this.camera.position.copy(this.orbit.target).addScaledVector(direction, radius * 3.2);
    this.orbit.update();
  }

  dispose(): void {
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    window.removeEventListener("keydown", this.onKeyDown);
    this.transform.removeEventListener("mouseDown", this.onTransformStart);
    this.transform.removeEventListener("objectChange", this.onObjectChange);
    this.transform.removeEventListener("mouseUp", this.onTransformCommit);
    this.transform.detach();
    this.scene.remove(this.transform.getHelper());
    this.transform.dispose();
    this.orbit.dispose();
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (!this.active || event.button !== 0 || this.transform.axis !== null) return;
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.intersectObjects(this.physics.getColliderMeshes(), false)[0];
    const id = hit?.object.userData.colliderId;
    this.select(typeof id === "string" ? id : null);
  };

  private readonly onTransformStart = (): void => {
    if (this.selectedId) this.events.onMutationStart?.();
  };

  private readonly onObjectChange = (): void => {
    if (!this.selectedId) return;
    const collider = this.physics.previewColliderTransform(this.selectedId);
    if (collider) this.events.onSelectionChange?.(collider);
  };

  private readonly onTransformCommit = (): void => {
    if (!this.selectedId) return;
    const collider = this.physics.commitColliderTransform(this.selectedId);
    if (collider) {
      this.events.onSelectionChange?.(collider);
      this.events.onColliderChange?.(collider);
    }
    this.events.onMutationEnd?.();
  };

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (!this.active) return;
    const tag = (event.target as HTMLElement | null)?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;

    const modifier = event.metaKey || event.ctrlKey;
    if (modifier && event.code === "KeyZ") {
      event.preventDefault();
      if (event.shiftKey) this.events.onRedoRequested?.();
      else this.events.onUndoRequested?.();
      return;
    }
    if (modifier && event.code === "KeyD") {
      event.preventDefault();
      this.events.onDuplicateRequested?.();
      return;
    }

    switch (event.code) {
      case "KeyW":
        this.setTransformMode("translate");
        break;
      case "KeyE":
        this.setTransformMode("rotate");
        break;
      case "KeyR":
        this.setTransformMode("scale");
        break;
      case "KeyF":
        this.focusSelection();
        break;
      case "Escape":
        this.select(null);
        break;
      case "Delete":
      case "Backspace":
        if (this.selectedId) {
          event.preventDefault();
          this.events.onDeleteRequested?.();
        }
        break;
    }
  };

  private createUniqueColliderId(base: string): string {
    let id = base;
    let index = 2;
    while (this.physics.getColliderData(id)) {
      id = `${base}-${index}`;
      index += 1;
    }
    return id;
  }
}
