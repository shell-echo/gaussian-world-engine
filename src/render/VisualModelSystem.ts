import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import type { ColliderData, VisualModelData } from "../types/world";
import { quaternionFromDegrees } from "../utils/transform";

interface VisualRecord {
  key: string;
  root: THREE.Group;
  content: THREE.Object3D | null;
}

export interface VisualModelEvents {
  onStatus?: (message: string) => void;
}

export class VisualModelSystem {
  readonly root = new THREE.Group();

  private readonly loader = new GLTFLoader();
  private readonly records = new Map<string, VisualRecord>();

  constructor(private readonly events: VisualModelEvents = {}) {
    this.root.name = "GLB Visual Models";
  }

  update(colliders: readonly ColliderData[]): void {
    const active = new Set<string>();
    for (const collider of colliders) {
      const visual = collider.visual;
      if (!visual) continue;
      active.add(collider.id);
      const key = visualKey(visual);
      let record = this.records.get(collider.id);
      if (!record || record.key !== key) {
        if (record) this.removeRecord(collider.id, record);
        record = this.createRecord(collider.id, visual, key);
      }
      this.applyTransform(record.root, collider);
      record.root.visible = visual.visible ?? true;
    }

    for (const [id, record] of this.records) {
      if (!active.has(id)) this.removeRecord(id, record);
    }
  }

  dispose(): void {
    for (const [id, record] of this.records) {
      this.removeRecord(id, record);
    }
  }

  private createRecord(id: string, visual: VisualModelData, key: string): VisualRecord {
    const root = new THREE.Group();
    root.name = `Visual: ${id}`;
    this.root.add(root);
    const record: VisualRecord = { key, root, content: null };
    this.records.set(id, record);
    this.events.onStatus?.(`加载可视模型 ${visual.sourceName ?? id}`);

    this.loader.load(
      visual.url,
      (gltf) => {
        if (this.records.get(id) !== record) {
          disposeObject(gltf.scene);
          return;
        }
        gltf.scene.updateMatrixWorld(true);
        const bounds = new THREE.Box3().setFromObject(gltf.scene);
        if (!bounds.isEmpty()) {
          const center = bounds.getCenter(new THREE.Vector3());
          gltf.scene.position.sub(center);
        }
        gltf.scene.name = visual.sourceName ?? id;
        root.add(gltf.scene);
        record.content = gltf.scene;
        this.events.onStatus?.(`可视模型已加载：${visual.sourceName ?? id}`);
      },
      undefined,
      (error) => {
        if (this.records.get(id) === record) {
          this.events.onStatus?.(`可视模型加载失败：${visual.sourceName ?? id}`);
        }
        console.warn(`Failed to load visual model ${id}.`, error);
      },
    );
    return record;
  }

  private applyTransform(root: THREE.Group, collider: ColliderData): void {
    root.position.fromArray(collider.position ?? [0, 0, 0]);
    root.quaternion.copy(quaternionFromDegrees(collider.rotationDeg));
    if (
      collider.type === "mesh" ||
      collider.type === "convex" ||
      collider.type === "compound"
    ) {
      root.scale.fromArray(collider.scale3 ?? [1, 1, 1]);
    } else {
      root.scale.set(1, 1, 1);
    }
  }

  private removeRecord(id: string, record: VisualRecord): void {
    this.root.remove(record.root);
    if (record.content) disposeObject(record.content);
    this.records.delete(id);
  }
}

function visualKey(visual: VisualModelData): string {
  return JSON.stringify({
    url: visual.url,
    sourceName: visual.sourceName,
  });
}

function disposeObject(root: THREE.Object3D): void {
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      disposeMaterial(material);
      material.dispose();
    }
  });
}

function disposeMaterial(material: THREE.Material): void {
  for (const value of Object.values(material)) {
    if (value instanceof THREE.Texture) value.dispose();
  }
}
