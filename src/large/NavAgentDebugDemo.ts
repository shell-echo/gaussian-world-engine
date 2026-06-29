import * as THREE from "three";
import type { RuntimeNavAgent, RuntimeNavAgentSnapshot } from "./NavAgentController.js";
import type { RuntimeNavGameplayApi, RuntimeNavPoint } from "./NavGameplayApi.js";
import type { NavRouteResult } from "./NavMeshQuery.js";

export interface RuntimeNavAgentDebugDemoOptions {
  scene: THREE.Scene;
  camera: THREE.Camera;
  domElement: HTMLElement;
  nav: RuntimeNavGameplayApi;
  initialPosition?: RuntimeNavPoint;
  initialDestination?: RuntimeNavPoint;
  onStatus?: (message: string) => void;
}

export class RuntimeNavAgentDebugDemo {
  readonly group = new THREE.Group();

  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private readonly agentObject: THREE.Mesh;
  private readonly targetObject: THREE.Mesh;
  private readonly agent: RuntimeNavAgent;
  private routeLine: THREE.Line | null = null;
  private lastSnapshot: RuntimeNavAgentSnapshot | null = null;
  private disposed = false;

  constructor(private readonly options: RuntimeNavAgentDebugDemoOptions) {
    this.group.name = "Runtime Nav Agent Debug Demo";
    this.agentObject = createAgentMarker();
    this.targetObject = createTargetMarker();
    this.targetObject.visible = false;
    this.group.add(this.agentObject, this.targetObject);

    this.agent = options.nav.createAgent({
      id: "debug-click-agent",
      object: this.agentObject,
      position: options.initialPosition ?? [0, 0.28, 0],
      speed: 6,
      arriveDistance: 0.35,
    });
    this.options.scene.add(this.group);
    this.options.domElement.addEventListener("pointerdown", this.handlePointerDown);

    if (options.initialDestination) this.setDestination(options.initialDestination);
    options.onStatus?.("Click-to-move agent demo ready");
  }

  update(deltaSeconds: number): RuntimeNavAgentSnapshot {
    this.lastSnapshot = this.agent.update(deltaSeconds);
    return this.lastSnapshot;
  }

  snapshot(): RuntimeNavAgentSnapshot {
    this.lastSnapshot = this.agent.snapshot();
    return this.lastSnapshot;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.options.domElement.removeEventListener("pointerdown", this.handlePointerDown);
    disposeLine(this.routeLine);
    this.routeLine = null;
    this.options.scene.remove(this.group);
    disposeObject(this.group);
    this.group.clear();
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (this.disposed || event.button !== 0 || document.pointerLockElement) return;
    const destination = this.pickGroundPoint(event);
    if (!destination) return;
    this.setDestination(destination);
  };

  private setDestination(destination: RuntimeNavPoint): void {
    const target = toVector3(destination);
    this.targetObject.visible = true;
    this.targetObject.position.copy(target);
    this.targetObject.position.y += 0.06;
    const route = this.agent.setDestination(target);
    this.installRouteLine(route);
    this.options.onStatus?.(
      route.status === "success"
        ? `Click-to-move route · ${route.tileIds.length} tiles · ${route.distance.toFixed(1)}m`
        : `Click-to-move blocked · ${route.status}`,
    );
  }

  private pickGroundPoint(event: PointerEvent): THREE.Vector3 | null {
    const rect = this.options.domElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    this.raycaster.setFromCamera(this.pointer, this.options.camera);
    const hit = new THREE.Vector3();
    return this.raycaster.ray.intersectPlane(this.groundPlane, hit) ? hit : null;
  }

  private installRouteLine(route: NavRouteResult): void {
    disposeLine(this.routeLine);
    this.routeLine = null;
    if (route.status !== "success" || route.points.length < 2) return;
    const geometry = new THREE.BufferGeometry().setFromPoints(
      route.points.map((point) => new THREE.Vector3(point[0], point[1] + 0.32, point[2])),
    );
    const material = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
    this.routeLine = new THREE.Line(geometry, material);
    this.routeLine.name = "Click-to-move route";
    this.group.add(this.routeLine);
  }
}

function createAgentMarker(): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(0.45, 16, 12);
  const material = new THREE.MeshBasicMaterial({ color: 0x66ff99, transparent: true, opacity: 0.9 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "Click-to-move agent";
  return mesh;
}

function createTargetMarker(): THREE.Mesh {
  const geometry = new THREE.RingGeometry(0.45, 0.72, 32);
  const material = new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "Click-to-move target";
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

function disposeObject(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      disposeMaterial(child.material);
    }
  });
}

function disposeLine(line: THREE.Line | null): void {
  if (!line) return;
  line.parent?.remove(line);
  line.geometry.dispose();
  disposeMaterial(line.material);
}

function disposeMaterial(material: THREE.Material | THREE.Material[]): void {
  if (Array.isArray(material)) {
    material.forEach((item) => item.dispose());
  } else {
    material.dispose();
  }
}

function toVector3(point: RuntimeNavPoint): THREE.Vector3 {
  return point instanceof THREE.Vector3 ? point.clone() : new THREE.Vector3(point[0], point[1], point[2]);
}
