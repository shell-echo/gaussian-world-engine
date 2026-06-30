import * as THREE from "three";
import type { Vec3Tuple } from "../types/world.js";
import type { RuntimeNavPoint } from "./NavGameplayApi.js";
import type { NavRouteResult } from "./NavMeshQuery.js";

export type RuntimeNavAgentStatus = "idle" | "moving" | "arrived" | "blocked";

export interface RuntimeNavAgentSnapshot {
  id: string;
  status: RuntimeNavAgentStatus;
  position: Vec3Tuple;
  velocity: Vec3Tuple;
  destination: Vec3Tuple | null;
  routeStatus: NavRouteResult["status"] | null;
  routeTileIds: string[];
  currentPointIndex: number;
  remainingDistance: number;
}

export interface RuntimeNavAgentStatusChange {
  agentId: string;
  previousStatus: RuntimeNavAgentStatus;
  status: RuntimeNavAgentStatus;
  snapshot: RuntimeNavAgentSnapshot;
}

export interface RuntimeNavAgentCallbacks {
  onStatusChange?: (change: RuntimeNavAgentStatusChange) => void;
  onArrive?: (snapshot: RuntimeNavAgentSnapshot) => void;
  onBlocked?: (snapshot: RuntimeNavAgentSnapshot) => void;
}

export interface RuntimeNavAgentOptions extends RuntimeNavAgentCallbacks {
  id?: string;
  position?: RuntimeNavPoint;
  speed?: number;
  arriveDistance?: number;
  object?: THREE.Object3D;
}

export interface RuntimeNavRouteProvider {
  findRoute: (start: RuntimeNavPoint, goal: RuntimeNavPoint) => NavRouteResult;
}

export class RuntimeNavAgent {
  private readonly idValue: string;
  private readonly position = new THREE.Vector3();
  private readonly velocity = new THREE.Vector3();
  private readonly object: THREE.Object3D | null;
  private readonly callbacks: RuntimeNavAgentCallbacks;
  private speedValue: number;
  private arriveDistanceValue: number;
  private statusValue: RuntimeNavAgentStatus = "idle";
  private route: NavRouteResult | null = null;
  private destination: THREE.Vector3 | null = null;
  private routePointIndex = 0;

  constructor(
    private readonly nav: RuntimeNavRouteProvider,
    options: RuntimeNavAgentOptions = {},
  ) {
    this.idValue = options.id ?? `nav-agent-${Math.random().toString(36).slice(2, 9)}`;
    this.speedValue = positiveOr(options.speed, 2.5);
    this.arriveDistanceValue = positiveOr(options.arriveDistance, 0.25);
    this.object = options.object ?? null;
    this.callbacks = {
      onStatusChange: options.onStatusChange,
      onArrive: options.onArrive,
      onBlocked: options.onBlocked,
    };
    const initialPosition = options.position ? toVector3(options.position) : this.object?.position.clone() ?? new THREE.Vector3();
    this.position.copy(initialPosition);
    if (this.object) this.object.position.copy(this.position);
  }

  get id(): string {
    return this.idValue;
  }

  get status(): RuntimeNavAgentStatus {
    return this.statusValue;
  }

  setSpeed(speed: number): void {
    this.speedValue = positiveOr(speed, this.speedValue);
  }

  setArriveDistance(distance: number): void {
    this.arriveDistanceValue = positiveOr(distance, this.arriveDistanceValue);
  }

  setPosition(position: RuntimeNavPoint): void {
    this.position.copy(toVector3(position));
    this.velocity.set(0, 0, 0);
    if (this.object) this.object.position.copy(this.position);
  }

  setDestination(destination: RuntimeNavPoint): NavRouteResult {
    this.destination = toVector3(destination);
    this.route = this.nav.findRoute(this.position, this.destination);
    this.routePointIndex = 1;
    this.velocity.set(0, 0, 0);
    if (this.route.status !== "success" || this.route.points.length < 2) {
      this.setStatus("blocked");
      return this.route;
    }
    this.setStatus("moving");
    return this.route;
  }

  stop(): void {
    this.velocity.set(0, 0, 0);
    this.destination = null;
    this.route = null;
    this.routePointIndex = 0;
    this.setStatus("idle");
  }

  update(deltaSeconds: number): RuntimeNavAgentSnapshot {
    if (this.statusValue !== "moving" || !this.route) return this.snapshot();
    const delta = Math.max(0, Math.min(deltaSeconds, 0.2));
    let remainingStep = this.speedValue * delta;

    while (remainingStep > 0 && this.statusValue === "moving") {
      const target = this.currentTarget();
      if (!target) {
        this.arrive();
        break;
      }
      const offset = target.clone().sub(this.position);
      const distance = offset.length();
      if (distance <= this.arriveDistanceValue) {
        this.routePointIndex += 1;
        continue;
      }
      const move = Math.min(distance, remainingStep);
      const direction = offset.normalize();
      this.position.addScaledVector(direction, move);
      this.velocity.copy(direction).multiplyScalar(move / Math.max(delta, 0.0001));
      remainingStep -= move;
      if (this.object) this.object.position.copy(this.position);
      if (distance - move <= this.arriveDistanceValue) this.routePointIndex += 1;
    }

    if (!this.currentTarget()) this.arrive();
    return this.snapshot();
  }

  snapshot(): RuntimeNavAgentSnapshot {
    return {
      id: this.idValue,
      status: this.statusValue,
      position: toTuple(this.position),
      velocity: toTuple(this.velocity),
      destination: this.destination ? toTuple(this.destination) : null,
      routeStatus: this.route?.status ?? null,
      routeTileIds: [...(this.route?.tileIds ?? [])],
      currentPointIndex: this.routePointIndex,
      remainingDistance: this.remainingDistance(),
    };
  }

  private currentTarget(): THREE.Vector3 | null {
    const point = this.route?.points[this.routePointIndex];
    return point ? toVector3(point) : null;
  }

  private arrive(): void {
    this.velocity.set(0, 0, 0);
    if (this.destination) this.position.copy(this.destination);
    if (this.object) this.object.position.copy(this.position);
    this.setStatus("arrived");
  }

  private setStatus(status: RuntimeNavAgentStatus): void {
    const previousStatus = this.statusValue;
    if (previousStatus === status) return;
    this.statusValue = status;
    const snapshot = this.snapshot();
    this.callbacks.onStatusChange?.({
      agentId: this.idValue,
      previousStatus,
      status,
      snapshot,
    });
    if (status === "arrived") this.callbacks.onArrive?.(snapshot);
    if (status === "blocked") this.callbacks.onBlocked?.(snapshot);
  }

  private remainingDistance(): number {
    if (!this.route || this.statusValue === "idle") return 0;
    let distance = 0;
    let previous = this.position;
    for (let index = this.routePointIndex; index < this.route.points.length; index += 1) {
      const point = this.route.points[index];
      if (!point) continue;
      const current = toVector3(point);
      distance += previous.distanceTo(current);
      previous = current;
    }
    return distance;
  }
}

function toVector3(point: RuntimeNavPoint): THREE.Vector3 {
  return point instanceof THREE.Vector3 ? point.clone() : new THREE.Vector3(point[0], point[1], point[2]);
}

function toTuple(point: THREE.Vector3): Vec3Tuple {
  return [point.x, point.y, point.z];
}

function positiveOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
}
