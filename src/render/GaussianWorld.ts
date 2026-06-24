import { SparkRenderer, SplatMesh } from "@sparkjsdev/spark";
import * as THREE from "three";
import type { ColorTriplet } from "../large/ExposurePlanTypes";
import type { SplatAsset } from "../types/world";
import { applyTransform } from "../utils/transform";

export interface LoadProgress {
  id: string;
  loaded: number;
  total?: number;
}

export interface AssetColorAdjustment {
  exposureStops: number;
  gain: ColorTriplet;
  bias: ColorTriplet;
}

type MaterialLike = THREE.Material | THREE.Material[];
type ColorMaterial = THREE.Material & { color?: THREE.Color; emissive?: THREE.Color };

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
    if (asset.opacity !== undefined) setObjectOpacity(mesh, asset.opacity);
    this.root.add(mesh);
    this.splats.set(asset.id, mesh);
    await mesh.initialized;
    return mesh;
  }

  removeAsset(id: string): boolean {
    const mesh = this.splats.get(id);
    if (!mesh) return false;
    this.root.remove(mesh);
    mesh.dispose();
    this.splats.delete(id);
    return true;
  }

  hasAsset(id: string): boolean {
    return this.splats.has(id);
  }

  setAssetOpacity(id: string, opacity: number): boolean {
    const mesh = this.splats.get(id);
    if (!mesh) return false;
    setObjectOpacity(mesh, opacity);
    return true;
  }

  setAssetColorAdjustment(id: string, adjustment: AssetColorAdjustment): boolean {
    const mesh = this.splats.get(id);
    if (!mesh) return false;
    setObjectColorAdjustment(mesh, adjustment);
    return true;
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
    if (asset.opacity !== undefined) setObjectOpacity(mesh, asset.opacity);
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

function setObjectOpacity(object: THREE.Object3D, value: number): void {
  const opacity = clamp01(value);
  object.visible = opacity > 0;
  setUnknownOpacity(object, opacity);
  object.traverse((child) => {
    const material = (child as { material?: MaterialLike }).material;
    if (material) setMaterialOpacity(material, opacity);
    setUnknownOpacity(child, opacity);
  });
}

function setObjectColorAdjustment(object: THREE.Object3D, adjustment: AssetColorAdjustment): void {
  const multiplier = Math.pow(2, adjustment.exposureStops);
  const gain: ColorTriplet = [
    Math.max(0, adjustment.gain[0] * multiplier),
    Math.max(0, adjustment.gain[1] * multiplier),
    Math.max(0, adjustment.gain[2] * multiplier),
  ];
  object.userData["exposureAdjustment"] = {
    exposureStops: adjustment.exposureStops,
    gain,
    bias: adjustment.bias,
  };
  object.traverse((child) => {
    child.userData["exposureAdjustment"] = object.userData["exposureAdjustment"];
    const material = (child as { material?: MaterialLike }).material;
    if (material) setMaterialColorAdjustment(material, gain, adjustment.bias);
  });
}

function setMaterialOpacity(material: MaterialLike, opacity: number): void {
  const materials = Array.isArray(material) ? material : [material];
  for (const item of materials) {
    item.transparent = opacity < 1;
    item.opacity = opacity;
    item.depthWrite = opacity >= 1;
    item.needsUpdate = true;
  }
}

function setMaterialColorAdjustment(material: MaterialLike, gain: ColorTriplet, bias: ColorTriplet): void {
  const materials = Array.isArray(material) ? material : [material];
  for (const item of materials) {
    const colorMaterial = item as ColorMaterial;
    if (colorMaterial.color) {
      const base = getBaseColor(item, colorMaterial.color);
      colorMaterial.color.setRGB(
        Math.max(0, base.r * gain[0] + bias[0]),
        Math.max(0, base.g * gain[1] + bias[1]),
        Math.max(0, base.b * gain[2] + bias[2]),
      );
      item.needsUpdate = true;
    }
    if (colorMaterial.emissive) {
      const base = getBaseEmissive(item, colorMaterial.emissive);
      colorMaterial.emissive.setRGB(
        Math.max(0, base.r * gain[0] + bias[0]),
        Math.max(0, base.g * gain[1] + bias[1]),
        Math.max(0, base.b * gain[2] + bias[2]),
      );
      item.needsUpdate = true;
    }
  }
}

function getBaseColor(material: THREE.Material, color: THREE.Color): THREE.Color {
  const cached = material.userData["baseColor"];
  if (cached instanceof THREE.Color) return cached;
  const base = color.clone();
  material.userData["baseColor"] = base;
  return base;
}

function getBaseEmissive(material: THREE.Material, color: THREE.Color): THREE.Color {
  const cached = material.userData["baseEmissive"];
  if (cached instanceof THREE.Color) return cached;
  const base = color.clone();
  material.userData["baseEmissive"] = base;
  return base;
}

function setUnknownOpacity(object: object, opacity: number): void {
  const target = object as { opacity?: unknown };
  if (typeof target.opacity === "number") target.opacity = opacity;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(0, Math.min(1, value));
}
