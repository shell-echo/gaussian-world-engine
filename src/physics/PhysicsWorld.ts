import RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import type {
  BoxColliderData,
  CapsuleColliderData,
  ColliderBehavior,
  ColliderData,
  InteractableData,
  MeshColliderData,
  Vec3Tuple,
} from "../types/world";
import { quaternionFromDegrees } from "../utils/transform";

export interface CharacterHandle {
  body: RAPIER.RigidBody;
  collider: RAPIER.Collider;
  controller: RAPIER.KinematicCharacterController;
  height: number;
  eyeHeight: number;
}

interface ColliderRecord {
  data: ColliderData;
  body: RAPIER.RigidBody;
  collider: RAPIER.Collider;
  mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
}

export interface ColliderTransformPatch {
  position?: Vec3Tuple;
  rotationDeg?: Vec3Tuple;
  size?: Vec3Tuple;
  radius?: number;
  halfHeight?: number;
  scale3?: Vec3Tuple;
  behavior?: ColliderBehavior;
  interactable?: InteractableData | null;
}

const SOLID_COLOR = new THREE.Color(0x6bd4ff);
const TRIGGER_COLOR = new THREE.Color(0x6fffb0);
const INTERACTABLE_COLOR = new THREE.Color(0xc79cff);
const SELECTED_COLOR = new THREE.Color(0xffc857);
const MIN_DIMENSION = 0.05;

export class PhysicsWorld {
  readonly world: RAPIER.World;
  readonly debugGroup = new THREE.Group();

  private readonly records = new Map<string, ColliderRecord>();
  private collidersVisible = true;
  private selectedColliderId: string | null = null;

  private constructor() {
    this.world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
    this.debugGroup.name = "Proxy collision debug";
  }

  static async create(): Promise<PhysicsWorld> {
    await RAPIER.init();
    return new PhysicsWorld();
  }

  addCollider(input: ColliderData): THREE.Mesh {
    if (this.records.has(input.id)) {
      throw new Error(`Duplicate collider id: ${input.id}`);
    }

    const data = cloneCollider(input);
    const mesh = this.createDebugMesh(data);
    const { body, collider } = this.createRapierCollider(data);
    this.debugGroup.add(mesh);
    this.records.set(data.id, { data, body, collider, mesh });
    return mesh;
  }

  addBoxCollider(input: BoxColliderData): THREE.Mesh {
    return this.addCollider(input);
  }

  addCapsuleCollider(input: CapsuleColliderData): THREE.Mesh {
    return this.addCollider(input);
  }

  addMeshCollider(input: MeshColliderData): THREE.Mesh {
    return this.addCollider(input);
  }

  removeCollider(id: string): boolean {
    const record = this.records.get(id);
    if (!record) return false;

    if (this.selectedColliderId === id) this.selectedColliderId = null;
    this.world.removeRigidBody(record.body);
    this.debugGroup.remove(record.mesh);
    record.mesh.geometry.dispose();
    record.mesh.material.dispose();
    this.records.delete(id);
    return true;
  }

  replaceAllColliders(colliders: readonly ColliderData[]): void {
    for (const id of Array.from(this.records.keys())) {
      this.removeCollider(id);
    }
    for (const collider of colliders) {
      this.addCollider(collider);
    }
  }

  updateCollider(id: string, patch: ColliderTransformPatch): ColliderData | null {
    const record = this.records.get(id);
    if (!record) return null;

    const common = {
      ...(patch.position ? { position: cloneVec3(patch.position) } : {}),
      ...(patch.rotationDeg ? { rotationDeg: cloneVec3(patch.rotationDeg) } : {}),
      ...(patch.behavior ? { behavior: cloneBehavior(patch.behavior) } : {}),
      ...(patch.interactable === null
        ? { interactable: undefined }
        : patch.interactable
          ? { interactable: cloneInteractable(patch.interactable) }
          : {}),
    };

    let data: ColliderData;
    if (record.data.type === "box") {
      data = {
        ...cloneCollider(record.data),
        ...common,
        ...(patch.size ? { size: patch.size.map(clampDimension) as Vec3Tuple } : {}),
      };
    } else if (record.data.type === "capsule") {
      data = {
        ...cloneCollider(record.data),
        ...common,
        ...(patch.radius !== undefined ? { radius: clampDimension(patch.radius) } : {}),
        ...(patch.halfHeight !== undefined
          ? { halfHeight: clampDimension(patch.halfHeight) }
          : {}),
      };
    } else {
      data = {
        ...cloneCollider(record.data),
        ...common,
        behavior: { mode: "solid" },
        ...(patch.scale3 ? { scale3: patch.scale3.map(clampDimension) as Vec3Tuple } : {}),
      };
    }

    record.data = data;
    this.applyDataToMesh(record.mesh, data);
    this.updateMaterial(record);
    return this.commitColliderTransform(id);
  }

  commitColliderTransform(id: string): ColliderData | null {
    const record = this.records.get(id);
    if (!record) return null;

    const data = this.readMeshTransform(record);
    this.world.removeRigidBody(record.body);
    const next = this.createRapierCollider(data);
    record.body = next.body;
    record.collider = next.collider;
    record.data = data;
    this.updateMaterial(record);
    return cloneCollider(data);
  }

  previewColliderTransform(id: string): ColliderData | null {
    const record = this.records.get(id);
    return record ? this.readMeshTransform(record) : null;
  }

  getColliderMesh(id: string): THREE.Mesh | null {
    return this.records.get(id)?.mesh ?? null;
  }

  getColliderMeshes(): THREE.Mesh[] {
    return Array.from(this.records.values(), (record) => record.mesh);
  }

  getColliderData(id: string): ColliderData | null {
    const record = this.records.get(id);
    return record ? cloneCollider(record.data) : null;
  }

  getAllColliderData(): ColliderData[] {
    return Array.from(this.records.values(), (record) => cloneCollider(record.data));
  }

  setSelectedCollider(id: string | null): void {
    this.selectedColliderId = id;
    for (const record of this.records.values()) {
      this.updateMaterial(record);
    }
  }

  createCharacter(feetPosition: Vec3Tuple): CharacterHandle {
    const height = 1.8;
    const radius = 0.34;
    const halfHeight = (height - radius * 2) / 2;
    const eyeHeight = 1.62;
    const centerY = feetPosition[1] + height / 2;

    const bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
      feetPosition[0],
      centerY,
      feetPosition[2],
    );
    const body = this.world.createRigidBody(bodyDesc);
    const collider = this.world.createCollider(
      RAPIER.ColliderDesc.capsule(halfHeight, radius)
        .setFriction(0)
        .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),
      body,
    );

    const controller = this.world.createCharacterController(0.02);
    controller.setUp({ x: 0, y: 1, z: 0 });
    controller.setSlideEnabled(true);
    controller.enableAutostep(0.42, 0.18, false);
    controller.enableSnapToGround(0.25);
    controller.setMaxSlopeClimbAngle((46 * Math.PI) / 180);
    controller.setMinSlopeSlideAngle((52 * Math.PI) / 180);
    controller.setApplyImpulsesToDynamicBodies(true);
    controller.setCharacterMass(80);

    return { body, collider, controller, height, eyeHeight };
  }

  moveCharacter(character: CharacterHandle, desiredDelta: THREE.Vector3): boolean {
    character.controller.computeColliderMovement(character.collider, {
      x: desiredDelta.x,
      y: desiredDelta.y,
      z: desiredDelta.z,
    });

    const corrected = character.controller.computedMovement();
    const current = character.body.translation();
    character.body.setNextKinematicTranslation({
      x: current.x + corrected.x,
      y: current.y + corrected.y,
      z: current.z + corrected.z,
    });

    return character.controller.computedGrounded();
  }

  step(deltaSeconds: number): void {
    this.world.timestep = Math.min(deltaSeconds, 1 / 30);
    this.world.step();
  }

  setDebugVisible(visible: boolean): void {
    this.collidersVisible = visible;
    this.debugGroup.visible = visible;
  }

  isDebugVisible(): boolean {
    return this.collidersVisible;
  }

  toggleDebugVisible(): boolean {
    this.setDebugVisible(!this.collidersVisible);
    return this.collidersVisible;
  }

  private createDebugMesh(
    data: ColliderData,
  ): THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial> {
    let geometry: THREE.BufferGeometry;
    if (data.type === "box") {
      geometry = new THREE.BoxGeometry(1, 1, 1);
    } else if (data.type === "capsule") {
      geometry = new THREE.CapsuleGeometry(0.5, 1, 8, 16);
    } else {
      geometry = createMeshGeometry(data);
    }

    const material = new THREE.MeshBasicMaterial({
      color: colorFor(data),
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      wireframe: true,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `Collider: ${data.id}`;
    mesh.userData.colliderId = data.id;
    mesh.userData.colliderType = data.type;
    this.applyDataToMesh(mesh, data);
    mesh.visible = data.debugVisible ?? true;
    return mesh;
  }

  private applyDataToMesh(mesh: THREE.Mesh, data: ColliderData): void {
    mesh.position.fromArray(data.position ?? [0, 0, 0]);
    mesh.quaternion.copy(quaternionFromDegrees(data.rotationDeg));
    if (data.type === "box") {
      mesh.scale.fromArray(data.size);
    } else if (data.type === "capsule") {
      const diameter = data.radius * 2;
      mesh.scale.set(diameter, data.halfHeight + data.radius, diameter);
    } else {
      mesh.scale.fromArray(data.scale3 ?? [1, 1, 1]);
    }
  }

  private createRapierCollider(data: ColliderData): {
    body: RAPIER.RigidBody;
    collider: RAPIER.Collider;
  } {
    const position = data.position ?? [0, 0, 0];
    const rotation = quaternionFromDegrees(data.rotationDeg);
    const bodyDesc = RAPIER.RigidBodyDesc.fixed()
      .setTranslation(position[0], position[1], position[2])
      .setRotation({ x: rotation.x, y: rotation.y, z: rotation.z, w: rotation.w });
    const body = this.world.createRigidBody(bodyDesc);

    let shape: RAPIER.ColliderDesc;
    if (data.type === "box") {
      shape = RAPIER.ColliderDesc.cuboid(data.size[0] / 2, data.size[1] / 2, data.size[2] / 2);
    } else if (data.type === "capsule") {
      shape = RAPIER.ColliderDesc.capsule(data.halfHeight, data.radius);
    } else {
      const scale = data.scale3 ?? [1, 1, 1];
      const vertices = new Float32Array(
        data.vertices.flatMap((vertex) => [
          vertex[0] * scale[0],
          vertex[1] * scale[1],
          vertex[2] * scale[2],
        ]),
      );
      shape = RAPIER.ColliderDesc.trimesh(vertices, new Uint32Array(data.indices));
    }

    const isTrigger = data.behavior?.mode === "trigger";
    shape
      .setSensor(isTrigger)
      .setFriction(isTrigger ? 0 : 1)
      .setRestitution(0)
      .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
    const collider = this.world.createCollider(shape, body);
    return { body, collider };
  }

  private readMeshTransform(record: ColliderRecord): ColliderData {
    const euler = new THREE.Euler().setFromQuaternion(record.mesh.quaternion, "XYZ");
    const common = {
      ...record.data,
      position: record.mesh.position.toArray() as Vec3Tuple,
      rotationDeg: [
        THREE.MathUtils.radToDeg(euler.x),
        THREE.MathUtils.radToDeg(euler.y),
        THREE.MathUtils.radToDeg(euler.z),
      ] as Vec3Tuple,
    };

    if (record.data.type === "box") {
      const size: Vec3Tuple = [
        clampDimension(record.mesh.scale.x),
        clampDimension(record.mesh.scale.y),
        clampDimension(record.mesh.scale.z),
      ];
      record.mesh.scale.fromArray(size);
      return { ...common, type: "box", size };
    }

    if (record.data.type === "capsule") {
      const radius = clampDimension(
        Math.max(Math.abs(record.mesh.scale.x), Math.abs(record.mesh.scale.z)) / 2,
      );
      const halfHeight = clampDimension(Math.abs(record.mesh.scale.y) - radius);
      record.mesh.scale.set(radius * 2, halfHeight + radius, radius * 2);
      return { ...common, type: "capsule", radius, halfHeight };
    }

    const scale3: Vec3Tuple = [
      clampDimension(record.mesh.scale.x),
      clampDimension(record.mesh.scale.y),
      clampDimension(record.mesh.scale.z),
    ];
    record.mesh.scale.fromArray(scale3);
    return {
      ...common,
      type: "mesh",
      vertices: record.data.vertices.map(cloneVec3),
      indices: [...record.data.indices],
      scale3,
      behavior: { mode: "solid" },
    };
  }

  private updateMaterial(record: ColliderRecord): void {
    const selected = record.data.id === this.selectedColliderId;
    record.mesh.material.color.copy(selected ? SELECTED_COLOR : colorFor(record.data));
    record.mesh.material.opacity = selected ? 0.3 : record.data.behavior?.mode === "trigger" ? 0.18 : 0.12;
  }
}

export function cloneCollider(data: ColliderData): ColliderData {
  const common = {
    ...data,
    position: cloneVec3(data.position ?? [0, 0, 0]),
    rotationDeg: cloneVec3(data.rotationDeg ?? [0, 0, 0]),
    behavior: cloneBehavior(data.behavior ?? { mode: "solid" }),
    ...(data.interactable ? { interactable: cloneInteractable(data.interactable) } : {}),
  };
  if (data.type === "box") {
    return { ...common, type: "box", size: cloneVec3(data.size) };
  }
  if (data.type === "capsule") {
    return {
      ...common,
      type: "capsule",
      radius: data.radius,
      halfHeight: data.halfHeight,
    };
  }
  return {
    ...common,
    type: "mesh",
    vertices: data.vertices.map(cloneVec3),
    indices: [...data.indices],
    scale3: cloneVec3(data.scale3 ?? [1, 1, 1]),
    behavior: { mode: "solid" },
  };
}

function createMeshGeometry(data: MeshColliderData): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(data.vertices.flatMap((vertex) => vertex), 3),
  );
  geometry.setIndex(data.indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function colorFor(data: ColliderData): THREE.Color {
  if (data.behavior?.mode === "trigger") return TRIGGER_COLOR;
  if (data.interactable) return INTERACTABLE_COLOR;
  return SOLID_COLOR;
}

function cloneBehavior(behavior: ColliderBehavior): ColliderBehavior {
  return behavior.mode === "solid"
    ? { mode: "solid" }
    : {
        mode: "trigger",
        event: behavior.event,
        message: behavior.message,
        once: behavior.once,
      };
}

function cloneInteractable(value: InteractableData): InteractableData {
  return {
    prompt: value.prompt,
    event: value.event,
    message: value.message,
    maxDistance: value.maxDistance,
  };
}

function cloneVec3(value: readonly number[]): Vec3Tuple {
  return [value[0] ?? 0, value[1] ?? 0, value[2] ?? 0];
}

function clampDimension(value: number): number {
  return Math.max(Math.abs(value), MIN_DIMENSION);
}
