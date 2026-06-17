import * as THREE from "three";
import type { PhysicsWorld } from "../physics/PhysicsWorld";
import type { AudioSourceData } from "../types/world";

interface AudioRecord {
  key: string;
  source: THREE.PositionalAudio;
}

export class AudioSystem {
  readonly listener = new THREE.AudioListener();
  readonly root = new THREE.Group();

  private readonly loader = new THREE.AudioLoader();
  private readonly records = new Map<string, AudioRecord>();
  private enabled = true;

  constructor(
    camera: THREE.Camera,
    private readonly physics: PhysicsWorld,
  ) {
    this.root.name = "Positional Audio Sources";
    camera.add(this.listener);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  async resume(): Promise<void> {
    if (this.listener.context.state !== "running") {
      await this.listener.context.resume();
    }
  }

  update(): void {
    const activeIds = new Set<string>();
    for (const collider of this.physics.getAllColliderData()) {
      const data = collider.audio;
      if (!data?.url) continue;
      activeIds.add(collider.id);
      const key = JSON.stringify(data);
      let record = this.records.get(collider.id);
      if (!record || record.key !== key) {
        if (record) this.removeRecord(collider.id, record);
        record = this.createRecord(collider.id, data, key);
      }
      const position = collider.position ?? [0, 0, 0];
      record.source.position.set(position[0], position[1], position[2]);
    }

    for (const [id, record] of this.records) {
      if (!activeIds.has(id)) this.removeRecord(id, record);
    }
  }

  play(id: string): boolean {
    if (!this.enabled) return false;
    const record = this.records.get(id);
    if (!record?.source.buffer) return false;
    try {
      if (record.source.isPlaying) record.source.stop();
      record.source.play();
      return true;
    } catch (error) {
      console.warn(`Unable to play audio source ${id}.`, error);
      return false;
    }
  }

  dispose(): void {
    for (const [id, record] of this.records) {
      this.removeRecord(id, record);
    }
    this.listener.parent?.remove(this.listener);
  }

  private createRecord(id: string, data: AudioSourceData, key: string): AudioRecord {
    const source = new THREE.PositionalAudio(this.listener);
    source.name = `Audio: ${id}`;
    source.setLoop(data.loop ?? false);
    source.setVolume(data.volume ?? 1);
    source.setRefDistance(data.refDistance ?? 2);
    this.root.add(source);

    const record = { key, source };
    this.records.set(id, record);
    this.loader.load(
      data.url,
      (buffer) => {
        const current = this.records.get(id);
        if (current !== record) return;
        source.setBuffer(buffer);
        source.setLoop(data.loop ?? false);
        source.setVolume(data.volume ?? 1);
        source.setRefDistance(data.refDistance ?? 2);
        if (data.autoplay && this.enabled) {
          this.play(id);
        }
      },
      undefined,
      (error) => console.warn(`Failed to load audio source ${id}.`, error),
    );
    return record;
  }

  private removeRecord(id: string, record: AudioRecord): void {
    if (record.source.isPlaying) record.source.stop();
    this.root.remove(record.source);
    this.records.delete(id);
  }
}
