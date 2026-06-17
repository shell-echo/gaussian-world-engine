import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import type { CharacterHandle, PhysicsWorld } from "../physics/PhysicsWorld";
import type { SpawnPoint } from "../types/world";

export class FirstPersonController {
  readonly controls: PointerLockControls;

  private readonly keys = new Set<string>();
  private readonly forward = new THREE.Vector3();
  private readonly right = new THREE.Vector3();
  private readonly movement = new THREE.Vector3();
  private readonly up = new THREE.Vector3(0, 1, 0);
  private verticalVelocity = 0;
  private grounded = false;
  private jumpQueued = false;
  private enabled = true;

  constructor(
    private readonly camera: THREE.PerspectiveCamera,
    canvas: HTMLCanvasElement,
    private readonly physics: PhysicsWorld,
    private readonly character: CharacterHandle,
    spawn: SpawnPoint,
  ) {
    this.controls = new PointerLockControls(camera, canvas);
    this.controls.pointerSpeed = 0.82;
    camera.rotation.order = "YXZ";
    camera.rotation.y = -((spawn.yawDeg ?? 0) * Math.PI) / 180;

    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.clearInput);
    this.syncCamera();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.clearInput();
      if (this.controls.isLocked) this.controls.unlock();
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  updateBeforePhysics(deltaSeconds: number): void {
    if (!this.enabled) return;

    const dt = Math.min(deltaSeconds, 1 / 30);
    const speed = this.keys.has("ShiftLeft") || this.keys.has("ShiftRight") ? 7.2 : 4.2;

    this.camera.getWorldDirection(this.forward);
    this.forward.y = 0;
    if (this.forward.lengthSq() < 1e-6) {
      this.forward.set(0, 0, -1);
    } else {
      this.forward.normalize();
    }
    this.right.crossVectors(this.forward, this.up).normalize();

    this.movement.set(0, 0, 0);
    if (this.keys.has("KeyW")) this.movement.add(this.forward);
    if (this.keys.has("KeyS")) this.movement.sub(this.forward);
    if (this.keys.has("KeyD")) this.movement.add(this.right);
    if (this.keys.has("KeyA")) this.movement.sub(this.right);
    if (this.movement.lengthSq() > 1) this.movement.normalize();
    this.movement.multiplyScalar(speed * dt);

    if (this.grounded) {
      if (this.jumpQueued) {
        this.verticalVelocity = 5.4;
        this.grounded = false;
      } else {
        this.verticalVelocity = -0.35;
      }
    } else {
      this.verticalVelocity = Math.max(this.verticalVelocity - 18.5 * dt, -24);
    }
    this.jumpQueued = false;
    this.movement.y = this.verticalVelocity * dt;

    this.grounded = this.physics.moveCharacter(this.character, this.movement);
    if (this.grounded && this.verticalVelocity < 0) {
      this.verticalVelocity = 0;
    }
  }

  syncCamera(): void {
    const position = this.character.body.translation();
    const eyeOffset = this.character.eyeHeight - this.character.height / 2;
    this.camera.position.set(position.x, position.y + eyeOffset, position.z);
  }

  getFeetPosition(target = new THREE.Vector3()): THREE.Vector3 {
    const position = this.character.body.translation();
    return target.set(position.x, position.y - this.character.height / 2, position.z);
  }

  dispose(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.clearInput);
    this.controls.dispose();
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (!this.enabled) return;
    this.keys.add(event.code);
    if (event.code === "Space" && !event.repeat) {
      event.preventDefault();
      this.jumpQueued = true;
    }
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    this.keys.delete(event.code);
  };

  private readonly clearInput = (): void => {
    this.keys.clear();
    this.jumpQueued = false;
  };
}
