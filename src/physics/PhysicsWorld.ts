import RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import type { BoxColliderData, Vec3Tuple } from "../types/world";
import { quaternionFromDegrees } from "../utils/transform";

export interface CharacterHandle {
  body: RAPIER.RigidBody;
  collider: RAPIER.Collider;
  controller: RAPIER.KinematicCharacterController;
  height: number;
  eyeHeight: number;
}

interface ColliderRecord {
  data: BoxColliderData;
  body: RAPIER.RigidBody;
  collider: RAPIER.Collider;
  mesh: THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>;
}

export type ColliderTransformPatch = Partial<
  Pick<BoxColliderData, "position" | "rotationDeg" | "size">
>;

const DEFAULT_COLLIDER_COLOR = new THREE.Color(0x6bd4ff);
const SELECTED_COLLIDER_COLOR = new THREE.Color(0xffc857);

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

  addBoxCollider(input: BoxColliderData): THREE.Mesh {
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

  removeBoxCollider(id: string): boolean {
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

  replaceAllBoxColliders(colliders: readonly BoxColliderData[]): void {
    for (const id of Array.from(this.records.keys())) {
      this.removeBoxCollider(id);
    }
    for (const collider of colliders) {
      this.addBoxCollider(collider);
    }
  }

  updateBoxCollider(id: string, patch: ColliderTransformPatch): BoxColliderData | null {
    const record = this.records.get(id);
    if (!record) return null;

    const data: BoxColliderData = {
      ...cloneCollider(record.data),
      ...(patch.position ? { position: cloneVec3(patch.position) } : {}),
      ...(patch.rotationDeg ? { rotationDeg: cloneVec3(patch.rotationDeg) } : {}),
      ...(patch.size ? { size: patch.size.map(clampSize) as Vec3Tuple } : {}),
    };

    record.data = data;
    record.mesh.position.fromArray(data.position ?? [0, 0, 0]);
    record.mesh.quaternion.copy(quaternionFromDegrees(data.rotationDeg));
    record.mesh.scale.fromArray(data.size);
    return this.commitColliderTransform(id);
  }

  commitColliderTransform(id: string): BoxColliderData | null {
    const record = this.records.get(id);
    if (!record) return null;

    const data = this.readMeshTransform(record);
    this.world.removeRigidBody(record.body);
    const next = this.createRapierCollider(data);
    record.body = next.body;
    record.collider = next.collider;
    record.data = data;
    return cloneCollider(data);
  }

  previewColliderTransform(id: string): BoxColliderData | null {
    const record = this.records.get(id);
    return record ? this.readMeshTransform(record) : null;
  }

  getColliderMesh(id: string): THREE.Mesh | null {
    return this.records.get(id)?.mesh ?? null;
  }

  getColliderMeshes(): THREE.Mesh[] {
    return Array.from(this.records.values(), (record) => record.mesh);
  }

  getColliderData(id: string): BoxColliderData | null {
    const record = this.records.get(id);
    return record ? cloneCollider(record.data) : null;
  }

  getAllColliderData(): BoxColliderData[] {
    return Array.from(this.records.values(), (record) => cloneCollider(record.data));
  }

  setSelectedCollider(id: string | null): void {
    this.selectedColliderId = id;
    for (const [recordId, record] of this.records) {
      const selected = recordId === id;
      record.mesh.material.color.copy(
        selected ? SELECTED_COLLIDER_COLOR : DEFAULT_COLLIDER_COLOR,
      );
      record.mesh.material.opacity = selected ? 0.28 : 0.12;
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
    data: BoxColliderData,
  ): THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial> {
    const position = data.position ?? [0, 0, 0];
    const rotation = quaternionFromDegrees(data.rotationDeg);
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({
      color: DEFAULT_COLLIDER_COLOR,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      wireframe: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `Collider: ${data.id}`;
    mesh.userData.colliderId = data.id;
    mesh.position.fromArray(position);
    mesh.quaternion.copy(rotation);
    mesh.scale.fromArray(data.size);
    mesh.visible = data.debugVisible ?? true;
    return mesh;
  }

  private createRapierCollider(data: BoxColliderData): {
    body: RAPIER.RigidBody;
    collider: RAPIER.Collider;
  } {
    const position = data.position ?? [0, 0, 0];
    const rotation = quaternionFromDegrees(data.rotationDeg);
    const half = data.size.map((value) => value / 2) as Vec3Tuple;
    const bodyDesc = RAPIER.RigidBodyDesc.fixed()
      .setTranslation(position[0], position[1], position[2])
      .setRotation({ x: rotation.x, y: rotation.y, z: rotation.z, w: rotation.w });
    const body = this.world.createRigidBody(bodyDesc);
    const collider = this.world.createCollider(
      RAPIER.ColliderDesc.cuboid(half[0], half[1], half[2])
        .setFriction(1)
        .setRestitution(0),
      body,
    );
    return { body, collider };
  }

  private readMeshTransform(record: ColliderRecord): BoxColliderData {
    const euler = new THREE.Euler().setFromQuaternion(record.mesh.quaternion, "XYZ");
    const size: Vec3Tuple = [
      clampSize(record.mesh.scale.x),
      clampSize(record.mesh.scale.y),
      clampSize(record.mesh.scale.z),
    ];
    record.mesh.scale.fromArray(size);

    return {
      ...record.data,
      position: record.mesh.position.toArray() as Vec3Tuple,
      rotationDeg: [
        THREE.MathUtils.radToDeg(euler.x),
        THREE.MathUtils.radToDeg(euler.y),
        THREE.MathUtils.radToDeg(euler.z),
      ],
      size,
    };
  }
}

function cloneCollider(data: BoxColliderData): BoxColliderData {
  return {
    ...data,
    position: cloneVec3(data.position ?? [0, 0, 0]),
    rotationDeg: cloneVec3(data.rotationDeg ?? [0, 0, 0]),
    size: cloneVec3(data.size),
  };
}

function cloneVec3(value: readonly number[]): Vec3Tuple {
  return [value[0] ?? 0, value[1] ?? 0, value[2] ?? 0];
}

function clampSize(value: number): number {
  return Math.max(Math.abs(value), 0.05);
}
