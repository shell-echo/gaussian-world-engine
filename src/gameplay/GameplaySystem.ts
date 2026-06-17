import * as THREE from "three";
import type { PhysicsWorld } from "../physics/PhysicsWorld";
import type { ColliderData } from "../types/world";
import { quaternionFromDegrees } from "../utils/transform";

export interface GameplayEvent {
  sourceId: string;
  event: string;
  message: string;
  kind: "trigger" | "interaction";
}

export interface InteractionPrompt {
  sourceId: string;
  prompt: string;
}

export interface GameplayEvents {
  onEvent?: (event: GameplayEvent) => void;
  onPrompt?: (prompt: InteractionPrompt | null) => void;
}

export class GameplaySystem {
  private readonly activeTriggers = new Set<string>();
  private readonly firedOnce = new Set<string>();
  private readonly cameraDirection = new THREE.Vector3();
  private readonly toObject = new THREE.Vector3();
  private enabled = true;
  private currentInteractionId: string | null = null;

  constructor(
    private readonly camera: THREE.PerspectiveCamera,
    private readonly physics: PhysicsWorld,
    private readonly events: GameplayEvents = {},
  ) {
    window.addEventListener("keydown", this.onKeyDown);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.setCurrentInteraction(null);
  }

  update(playerPoint: THREE.Vector3): void {
    if (!this.enabled) return;
    const colliders = this.physics.getAllColliderData();
    this.updateTriggers(colliders, playerPoint);
    this.updateInteraction(colliders);
  }

  interact(): boolean {
    if (!this.enabled || !this.currentInteractionId) return false;
    const collider = this.physics.getColliderData(this.currentInteractionId);
    const interactable = collider?.interactable;
    if (!collider || !interactable) return false;
    this.events.onEvent?.({
      sourceId: collider.id,
      event: interactable.event,
      message: interactable.message,
      kind: "interaction",
    });
    return true;
  }

  dispose(): void {
    window.removeEventListener("keydown", this.onKeyDown);
  }

  private updateTriggers(colliders: readonly ColliderData[], playerPoint: THREE.Vector3): void {
    const present = new Set<string>();
    for (const collider of colliders) {
      if (collider.behavior?.mode !== "trigger" || collider.type === "mesh") continue;
      const inside = containsPoint(collider, playerPoint);
      if (!inside) continue;
      present.add(collider.id);
      if (this.activeTriggers.has(collider.id)) continue;
      if (collider.behavior.once && this.firedOnce.has(collider.id)) continue;

      this.events.onEvent?.({
        sourceId: collider.id,
        event: collider.behavior.event,
        message: collider.behavior.message,
        kind: "trigger",
      });
      if (collider.behavior.once) this.firedOnce.add(collider.id);
    }

    this.activeTriggers.clear();
    for (const id of present) this.activeTriggers.add(id);
  }

  private updateInteraction(colliders: readonly ColliderData[]): void {
    this.camera.getWorldDirection(this.cameraDirection).normalize();
    let bestId: string | null = null;
    let bestScore = Number.POSITIVE_INFINITY;

    for (const collider of colliders) {
      const interactable = collider.interactable;
      if (!interactable) continue;
      const position = collider.position ?? [0, 0, 0];
      this.toObject.set(position[0], position[1], position[2]).sub(this.camera.position);
      const distance = this.toObject.length();
      const maxDistance = interactable.maxDistance ?? 3;
      if (distance <= 0.001 || distance > maxDistance) continue;
      const facing = this.cameraDirection.dot(this.toObject.normalize());
      if (facing < 0.86) continue;
      const score = distance / Math.max(facing * facing, 0.01);
      if (score < bestScore) {
        bestScore = score;
        bestId = collider.id;
      }
    }

    this.setCurrentInteraction(bestId);
  }

  private setCurrentInteraction(id: string | null): void {
    if (id === this.currentInteractionId) return;
    this.currentInteractionId = id;
    if (!id) {
      this.events.onPrompt?.(null);
      return;
    }
    const collider = this.physics.getColliderData(id);
    const prompt = collider?.interactable?.prompt;
    this.events.onPrompt?.(prompt ? { sourceId: id, prompt } : null);
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (!this.enabled || event.repeat || event.code !== "KeyE") return;
    const tag = (event.target as HTMLElement | null)?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    if (this.interact()) event.preventDefault();
  };
}

function containsPoint(collider: Exclude<ColliderData, { type: "mesh" }>, point: THREE.Vector3): boolean {
  const position = collider.position ?? [0, 0, 0];
  const local = point
    .clone()
    .sub(new THREE.Vector3(position[0], position[1], position[2]))
    .applyQuaternion(quaternionFromDegrees(collider.rotationDeg).invert());

  if (collider.type === "box") {
    return (
      Math.abs(local.x) <= collider.size[0] / 2 &&
      Math.abs(local.y) <= collider.size[1] / 2 &&
      Math.abs(local.z) <= collider.size[2] / 2
    );
  }

  const closestY = THREE.MathUtils.clamp(local.y, -collider.halfHeight, collider.halfHeight);
  const dx = local.x;
  const dy = local.y - closestY;
  const dz = local.z;
  return dx * dx + dy * dy + dz * dz <= collider.radius * collider.radius;
}
