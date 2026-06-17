import { SparkRenderer, SplatMesh } from "@sparkjsdev/spark";
import * as THREE from "three";
import type { SplatAsset } from "../types/world";
import { applyTransform } from "../utils/transform";

export interface LoadProgress {
  id: string;
  loaded: number;
  total?: number;
}

export class GaussianWorld {
  readonly root = new THREE.Group();
  readonly sparkRenderer: SparkRenderer;

  private readonly splats = new Map<string, SplatMesh>();

  constructor(renderer: THREE.WebGLRenderer) {
    this.root.name = "Gaussian World";
    this.sparkRenderer = new SparkRenderer({ renderer });
    this.sparkRenderer.name = "Spark Renderer";
  }

  async addAsset(
    asset: SplatAsset,
    onProgress?: (progress: LoadProgress) => void,
  ): Promise<SplatMesh> {
    if (this.splats.has(asset.id)) {
      throw new Error(`Duplicate splat asset id: ${asset.id}`);
    }

    const mesh = new SplatMesh({
      url: asset.url,
      lod: asset.lod ?? true,
      paged: asset.paged ?? false,
      onProgress: (event) => {
        onProgress?.({
          id: asset.id,
          loaded: event.loaded,
          total: event.lengthComputable ? event.total : undefined,
        });
      },
    });
    mesh.name = asset.id;
    applyTransform(mesh, asset);
    this.root.add(mesh);
    this.splats.set(asset.id, mesh);
    await mesh.initialized;
    return mesh;
  }

  addProceduralFallback(asset: SplatAsset): SplatMesh {
    const mesh = new SplatMesh({ maxSplats: 5200 });
    mesh.name = `${asset.id}:procedural-fallback`;

    const center = new THREE.Vector3();
    const scales = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    const color = new THREE.Color();

    for (let x = -24; x <= 24; x += 1) {
      for (let z = -24; z <= 24; z += 1) {
        center.set(x * 0.16, 0, z * 0.16);
        scales.set(0.105, 0.018, 0.105);
        const distance = Math.hypot(x, z) / 34;
        color.setHSL(0.56 + Math.min(distance, 1) * 0.08, 0.48, 0.32);
        mesh.pushSplat(center, scales, rotation, 0.82, color);
      }
    }

    for (let ring = 0; ring < 6; ring += 1) {
      const radius = 1.25 + ring * 0.08;
      for (let i = 0; i < 360; i += 1) {
        const angle = (i / 360) * Math.PI * 2;
        center.set(Math.cos(angle) * radius, 1.6 + Math.sin(angle) * radius, -3.6);
        scales.set(0.075, 0.075, 0.04);
        color.setHSL(0.53 + ring * 0.012, 0.82, 0.62);
        mesh.pushSplat(center, scales, rotation, 0.92, color);
      }
    }

    applyTransform(mesh, {
      position: asset.position,
      rotationDeg: asset.rotationDeg,
      scale: asset.scale,
    });
    this.root.add(mesh);
    this.splats.set(mesh.name, mesh);
    return mesh;
  }

  async addLocalFile(file: File): Promise<SplatMesh> {
    const id = `local:${file.name}:${crypto.randomUUID()}`;
    const bytes = await file.arrayBuffer();
    const mesh = new SplatMesh({
      fileBytes: bytes,
      fileName: file.name,
      lod: true,
    });
    mesh.name = id;
    mesh.quaternion.set(1, 0, 0, 0);
    this.root.add(mesh);
    this.splats.set(id, mesh);
    await mesh.initialized;
    return mesh;
  }

  dispose(): void {
    for (const mesh of this.splats.values()) {
      this.root.remove(mesh);
      mesh.dispose();
    }
    this.splats.clear();
  }
}
