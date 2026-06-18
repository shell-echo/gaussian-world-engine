import RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import { ConvexGeometry } from "three/addons/geometries/ConvexGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type {
  AudioSourceData,
  BoxColliderData,
  CapsuleColliderData,
  ColliderBehavior,
  ColliderData,
  CompoundColliderData,
  ConvexColliderData,
  InteractableData,
  MeshColliderData,
  RigidBodyData,
  Vec3Tuple,
  VisualModelData,
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
  colliders: RAPIER.Collider[];
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
  body?: RigidBodyData;
  audio?: AudioSourceData | null;
  visual?: VisualModelData | null;
}

const SOLID_COLOR = new THREE.Color(0x6bd4ff);
const TRIGGER_COLOR = new THREE.Color(0x6fffb0);
const INTERACTABLE_COLOR = new THREE.Color(0xc79cff);
const DYNAMIC_COLOR = new THREE.Color(0xff9f6b);
const VISUAL_COLOR = new THREE.Color(0x8ef0d0);
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

    const data = normalizeCollider(input);
    const mesh = this.createDebugMesh(data);
    const { body, colliders } = this.createRapierColliders(data);
    this.debugGroup.add(mesh);
    this.records.set(data.id, { data, body, colliders, mesh });
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

  addConvexCollider(input: ConvexColliderData): THREE.Mesh {
    return this.addCollider(input);
  }

  addCompoundCollider(input: CompoundColliderData): THREE.Mesh {
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
      ...(patch.body ? { body: cloneBody(patch.body) } : {}),
      ...(patch.audio === null
        ? { audio: undefined }
        : patch.audio
          ? { audio: cloneAudio(patch.audio) }
          : {}),
      ...(patch.visual === null
        ? { visual: undefined }
        : patch.visual
          ? { visual: cloneVisual(patch.visual) }
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
    } else if (record.data.type === "mesh") {
      data = {
        ...cloneCollider(record.data),
        ...common,
        behavior: { mode: "solid" },
        body: { mode: "fixed" },
        ...(patch.scale3 ? { scale3: patch.scale3.map(clampDimension) as Vec3Tuple } : {}),
      };
    } else {
      data = {
        ...cloneCollider(record.data),
        ...common,
        ...(patch.scale3 ? { scale3: patch.scale3.map(clampDimension) as Vec3Tuple } : {}),
      };
    }

    data = normalizeCollider(data);
    record.data = data;
    this.applyDataToMesh(record.mesh, data);
    this.updateMaterial(record);
    return this.commitColliderTransform(id);
  }

  commitColliderTransform(id: string): ColliderData | null {
    const record = this.records.get(id);
    if (!record) return null;

    const data = normalizeCollider(this.readMeshTransform(record));
    this.world.removeRigidBody(record.body);
    const next = this.createRapierColliders(data);
    record.body = next.body;
    record.colliders = next.colliders;
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

  syncDynamicMeshes(): void {
    for (const record of this.records.values()) {
      if (!isDynamic(record.data)) continue;
      const position = record.body.translation();
      const rotation = record.body.rotation();
      record.mesh.position.set(position.x, position.y, position.z);
      record.mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
      const euler = new THREE.Euler().setFromQuaternion(record.mesh.quaternion, "XYZ");
      record.data.position = [position.x, position.y, position.z];
      record.data.rotationDeg = [
        THREE.MathUtils.radToDeg(euler.x),
        THREE.MathUtils.radToDeg(euler.y),
        THREE.MathUtils.radToDeg(euler.z),
      ];
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
    } else if (data.type === "mesh") {
      geometry = createMeshGeometry(data);
    } else if (data.type === "compound") {
      geometry = createCompoundGeometry(data);
    } else {
      geometry = createConvexGeometry(data.vertices, data.id);
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

  private createRapierColliders(data: ColliderData): {
    body: RAPIER.RigidBody;
    colliders: RAPIER.Collider[];
  } {
    const position = data.position ?? [0, 0, 0];
    const rotation = quaternionFromDegrees(data.rotationDeg);
    const dynamic = isDynamic(data);
    const bodyConfig = data.body ?? { mode: "fixed" as const };
    const bodyDesc = dynamic
      ? RAPIER.RigidBodyDesc.dynamic()
          .setTranslation(position[0], position[1], position[2])
          .setRotation({ x: rotation.x, y: rotation.y, z: rotation.z, w: rotation.w })
          .setGravityScale(bodyConfig.gravityScale ?? 1)
          .setLinearDamping(bodyConfig.linearDamping ?? 0.15)
          .setAngularDamping(bodyConfig.angularDamping ?? 0.25)
      : RAPIER.RigidBodyDesc.fixed()
          .setTranslation(position[0], position[1], position[2])
          .setRotation({ x: rotation.x, y: rotation.y, z: rotation.z, w: rotation.w });
    const body = this.world.createRigidBody(bodyDesc);

    try {
      const shapes = this.createShapeDescriptors(data);
      const isTrigger = data.behavior?.mode === "trigger";
      const colliders = shapes.map((shape) => {
        shape
          .setSensor(isTrigger)
          .setFriction(isTrigger ? 0 : 1)
          .setRestitution(dynamic ? 0.15 : 0)
          .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
        return this.world.createCollider(shape, body);
      });
      return { body, colliders };
    } catch (error) {
      this.world.removeRigidBody(body);
      throw error;
    }
  }

  private createShapeDescriptors(data: ColliderData): RAPIER.ColliderDesc[] {
    if (data.type === "box") {
      return [RAPIER.ColliderDesc.cuboid(data.size[0] / 2, data.size[1] / 2, data.size[2] / 2)];
    }
    if (data.type === "capsule") {
      return [RAPIER.ColliderDesc.capsule(data.halfHeight, data.radius)];
    }
    if (data.type === "mesh") {
      const scale = data.scale3 ?? [1, 1, 1];
      return [RAPIER.ColliderDesc.trimesh(scaledVertices(data.vertices, scale), new Uint32Array(data.indices))];
    }
    if (data.type === "convex") {
      const scale = data.scale3 ?? [1, 1, 1];
      return [createConvexDesc(data.vertices, scale, data.id)];
    }

    const scale = data.scale3 ?? [1, 1, 1];
    return data.parts.map((part, index) =>
      createConvexDesc(part.vertices, scale, `${data.id} part ${index + 1}`),
    );
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
    if (record.data.type === "mesh") {
      return {
        ...common,
        type: "mesh",
        vertices: record.data.vertices.map(cloneVec3),
        indices: [...record.data.indices],
        scale3,
        sourceName: record.data.sourceName,
        behavior: { mode: "solid" },
        body: { mode: "fixed" },
      };
    }
    if (record.data.type === "compound") {
      return {
        ...common,
        type: "compound",
        parts: record.data.parts.map((part) => ({ vertices: part.vertices.map(cloneVec3) })),
        scale3,
        sourceName: record.data.sourceName,
      };
    }
    return {
      ...common,
      type: "convex",
      vertices: record.data.vertices.map(cloneVec3),
      scale3,
      sourceName: record.data.sourceName,
    };
  }

  private updateMaterial(record: ColliderRecord): void {
    const selected = record.data.id === this.selectedColliderId;
    record.mesh.material.color.copy(selected ? SELECTED_COLOR : colorFor(record.data));
    record.mesh.material.opacity = selected
      ? 0.3
      : record.data.behavior?.mode === "trigger"
        ? 0.18
        : 0.12;
  }
}

export function cloneCollider(data: ColliderData): ColliderData {
  const common = {
    ...data,
    position: cloneVec3(data.position ?? [0, 0, 0]),
    rotationDeg: cloneVec3(data.rotationDeg ?? [0, 0, 0]),
    behavior: cloneBehavior(data.behavior ?? { mode: "solid" }),
    body: cloneBody(data.body ?? { mode: "fixed" }),
    ...(data.interactable ? { interactable: cloneInteractable(data.interactable) } : {}),
    ...(data.audio ? { audio: cloneAudio(data.audio) } : {}),
    ...(data.visual ? { visual: cloneVisual(data.visual) } : {}),
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
  if (data.type === "mesh") {
    return {
      ...common,
      type: "mesh",
      vertices: data.vertices.map(cloneVec3),
      indices: [...data.indices],
      scale3: cloneVec3(data.scale3 ?? [1, 1, 1]),
      sourceName: data.sourceName,
      behavior: { mode: "solid" },
      body: { mode: "fixed" },
    };
  }
  if (data.type === "compound") {
    return {
      ...common,
      type: "compound",
      parts: data.parts.map((part) => ({ vertices: part.vertices.map(cloneVec3) })),
      scale3: cloneVec3(data.scale3 ?? [1, 1, 1]),
      sourceName: data.sourceName,
    };
  }
  return {
    ...common,
    type: "convex",
    vertices: data.vertices.map(cloneVec3),
    scale3: cloneVec3(data.scale3 ?? [1, 1, 1]),
    sourceName: data.sourceName,
  };
}

function normalizeCollider(data: ColliderData): ColliderData {
  const cloned = cloneCollider(data);
  if (cloned.type === "mesh") {
    cloned.behavior = { mode: "solid" };
    cloned.body = { mode: "fixed" };
  } else if (cloned.behavior?.mode === "trigger") {
    cloned.body = { mode: "fixed" };
  }
  return cloned;
}

function isDynamic(data: ColliderData): boolean {
  return (
    data.type !== "mesh" &&
    data.behavior?.mode !== "trigger" &&
    data.body?.mode === "dynamic"
  );
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

function createCompoundGeometry(data: CompoundColliderData): THREE.BufferGeometry {
  const geometries = data.parts.map((part, index) =>
    createConvexGeometry(part.vertices, `${data.id} part ${index + 1}`),
  );
  const merged = mergeGeometries(geometries, false);
  for (const geometry of geometries) geometry.dispose();
  if (!merged) throw new Error(`Unable to merge compound debug geometry for ${data.id}.`);
  merged.computeBoundingSphere();
  return merged;
}

function createConvexGeometry(vertices: readonly Vec3Tuple[], label: string): THREE.BufferGeometry {
  try {
    return new ConvexGeometry(
      vertices.map((vertex) => new THREE.Vector3(vertex[0], vertex[1], vertex[2])),
    );
  } catch (error) {
    throw new Error(`Unable to build debug convex geometry for ${label}.`, { cause: error });
  }
}

function createConvexDesc(
  vertices: readonly Vec3Tuple[],
  scale: Vec3Tuple,
  label: string,
): RAPIER.ColliderDesc {
  const convex = RAPIER.ColliderDesc.convexHull(scaledVertices(vertices, scale));
  if (!convex) throw new Error(`Unable to build convex hull for ${label}.`);
  return convex;
}

function scaledVertices(vertices: readonly Vec3Tuple[], scale: Vec3Tuple): Float32Array {
  return new Float32Array(
    vertices.flatMap((vertex) => [
      vertex[0] * scale[0],
      vertex[1] * scale[1],
      vertex[2] * scale[2],
    ]),
  );
}

function colorFor(data: ColliderData): THREE.Color {
  if (data.behavior?.mode === "trigger") return TRIGGER_COLOR;
  if (data.body?.mode === "dynamic") return DYNAMIC_COLOR;
  if (data.interactable) return INTERACTABLE_COLOR;
  if (data.visual) return VISUAL_COLOR;
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

function cloneBody(value: RigidBodyData): RigidBodyData {
  return {
    mode: value.mode,
    gravityScale: value.gravityScale,
    linearDamping: value.linearDamping,
    angularDamping: value.angularDamping,
  };
}

function cloneAudio(value: AudioSourceData): AudioSourceData {
  return {
    url: value.url,
    loop: value.loop,
    autoplay: value.autoplay,
    volume: value.volume,
    refDistance: value.refDistance,
  };
}

function cloneVisual(value: VisualModelData): VisualModelData {
  return {
    url: value.url,
    sourceName: value.sourceName,
    visible: value.visible,
  };
}

function cloneVec3(value: readonly number[]): Vec3Tuple {
  return [value[0] ?? 0, value[1] ?? 0, value[2] ?? 0];
}

function clampDimension(value: number): number {
  return Math.max(Math.abs(value), MIN_DIMENSION);
}
