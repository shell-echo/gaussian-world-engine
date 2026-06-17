import type { TransformControlsMode } from "three/addons/controls/TransformControls.js";
import "./styles.css";
import { Engine, type SceneTreeState } from "./core/Engine";
import type { ColliderData, Vec3Tuple, WorldManifest } from "./types/world";
import { assertWorldManifest } from "./types/world";

const canvas = requiredElement<HTMLCanvasElement>("viewport");
const launchPanel = requiredElement<HTMLElement>("launch-panel");
const sceneTreePanel = requiredElement<HTMLElement>("scene-tree-panel");
const editorPanel = requiredElement<HTMLElement>("editor-panel");
const enterButton = requiredElement<HTMLButtonElement>("enter-button");
const modeButton = requiredElement<HTMLButtonElement>("mode-button");
const toggleColliderButton = requiredElement<HTMLButtonElement>("toggle-colliders");
const importButton = requiredElement<HTMLButtonElement>("import-splat");
const fileInput = requiredElement<HTMLInputElement>("splat-file");
const addBoxButton = requiredElement<HTMLButtonElement>("add-box-collider");
const addCapsuleButton = requiredElement<HTMLButtonElement>("add-capsule-collider");
const duplicateColliderButton = requiredElement<HTMLButtonElement>("duplicate-collider");
const deleteColliderButton = requiredElement<HTMLButtonElement>("delete-collider");
const undoButton = requiredElement<HTMLButtonElement>("undo-button");
const redoButton = requiredElement<HTMLButtonElement>("redo-button");
const exportWorldButton = requiredElement<HTMLButtonElement>("export-world");
const focusSelectedButton = requiredElement<HTMLButtonElement>("focus-selected");
const translateButton = requiredElement<HTMLButtonElement>("tool-translate");
const rotateButton = requiredElement<HTMLButtonElement>("tool-rotate");
const scaleButton = requiredElement<HTMLButtonElement>("tool-scale");
const selectedIdElement = requiredElement<HTMLElement>("selected-id");
const selectedTypeElement = requiredElement<HTMLElement>("selected-type");
const boxDimensions = requiredElement<HTMLElement>("box-dimensions");
const capsuleDimensions = requiredElement<HTMLElement>("capsule-dimensions");
const splatTreeList = requiredElement<HTMLElement>("splat-tree-list");
const colliderTreeList = requiredElement<HTMLElement>("collider-tree-list");
const splatCountElement = requiredElement<HTMLElement>("splat-count");
const colliderCountElement = requiredElement<HTMLElement>("collider-count");
const statusElement = requiredElement<HTMLElement>("status");
const worldNameElement = requiredElement<HTMLElement>("world-name");
const fpsElement = requiredElement<HTMLElement>("fps");
const positionElement = requiredElement<HTMLElement>("position");
const toastElement = requiredElement<HTMLElement>("toast");

const positionInputs = getVectorInputs("position");
const rotationInputs = getVectorInputs("rotation");
const sizeInputs = getVectorInputs("size");
const radiusInput = requiredElement<HTMLInputElement>("capsule-radius");
const halfHeightInput = requiredElement<HTMLInputElement>("capsule-half-height");
const inspectorInputs = [
  ...positionInputs,
  ...rotationInputs,
  ...sizeInputs,
  radiusInput,
  halfHeightInput,
];

let toastTimer = 0;
let editorEnabled = false;
let selectedCollider: ColliderData | null = null;
let engine: Engine | undefined;

bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  statusElement.textContent = "启动失败";
  showToast(`启动失败：${message}`, 8000);
  console.error(error);
});

async function bootstrap(): Promise<void> {
  const manifestUrl =
    new URLSearchParams(window.location.search).get("world") ??
    "/worlds/demo/world.json";
  statusElement.textContent = "读取世界清单";
  const manifest = await loadManifest(manifestUrl);
  worldNameElement.textContent = manifest.name;

  engine = await Engine.create(canvas, manifest, {
    onStatus: (message) => {
      statusElement.textContent = message;
    },
    onProgress: ({ id, loaded, total }) => {
      const value = total ? `${Math.round((loaded / total) * 100)}%` : formatBytes(loaded);
      statusElement.textContent = `加载 ${id} · ${value}`;
    },
    onFrame: (fps, position) => {
      fpsElement.textContent = fps > 0 ? String(fps) : "--";
      positionElement.textContent = [position.x, position.y, position.z]
        .map((value) => value.toFixed(1))
        .join(", ");
    },
    onPointerLock: (locked) => {
      document.body.classList.toggle("pointer-locked", locked);
      if (!editorEnabled) launchPanel.classList.toggle("hidden", locked);
    },
    onEditorMode: (enabled) => {
      editorEnabled = enabled;
      document.body.classList.toggle("editor-mode", enabled);
      editorPanel.classList.toggle("hidden", !enabled);
      sceneTreePanel.classList.toggle("hidden", !enabled);
      launchPanel.classList.toggle("hidden", enabled || engine?.player.controls.isLocked === true);
      modeButton.textContent = enabled ? "返回游玩" : "进入编辑";
      toggleColliderButton.textContent = `碰撞层：${engine?.physics.isDebugVisible() ? "开" : "关"}`;
      if (!enabled) updateSelection(null);
    },
    onEditorSelection: updateSelection,
    onTransformMode: updateTransformMode,
    onHistoryChange: (canUndo, canRedo) => {
      undoButton.disabled = !canUndo;
      redoButton.disabled = !canRedo;
    },
    onSceneTreeChange: renderSceneTree,
  });
  engine.start();
  showToast("Runtime 0.4 已就绪：支持 Box、Capsule 与场景对象树。", 4200);

  enterButton.addEventListener("click", () => engine?.lockPointer());
  canvas.addEventListener("click", () => {
    if (!editorEnabled && !engine?.player.controls.isLocked) engine?.lockPointer();
  });

  modeButton.addEventListener("click", () => engine?.toggleEditorMode());
  toggleColliderButton.addEventListener("click", () => {
    const visible = engine?.toggleColliderDebug() ?? false;
    toggleColliderButton.textContent = `碰撞层：${visible ? "开" : "关"}`;
  });

  addBoxButton.addEventListener("click", () => {
    const collider = engine?.addBoxCollider();
    if (collider) showToast(`已新增 ${collider.id}`);
  });
  addCapsuleButton.addEventListener("click", () => {
    const collider = engine?.addCapsuleCollider();
    if (collider) showToast(`已新增 ${collider.id}`);
  });
  duplicateColliderButton.addEventListener("click", () => {
    const collider = engine?.duplicateSelectedCollider();
    if (collider) showToast(`已复制 ${collider.id}`);
  });
  deleteColliderButton.addEventListener("click", () => {
    const id = engine?.deleteSelectedCollider();
    if (id) showToast(`已删除 ${id}`);
  });
  undoButton.addEventListener("click", () => engine?.undo());
  redoButton.addEventListener("click", () => engine?.redo());
  exportWorldButton.addEventListener("click", () => {
    engine?.downloadWorldManifest();
    showToast("world.json 已导出");
  });
  focusSelectedButton.addEventListener("click", () => engine?.focusSelectedCollider());
  translateButton.addEventListener("click", () => engine?.setTransformMode("translate"));
  rotateButton.addEventListener("click", () => engine?.setTransformMode("rotate"));
  scaleButton.addEventListener("click", () => engine?.setTransformMode("scale"));

  for (const input of inspectorInputs) {
    input.addEventListener("change", applyInspectorValues);
  }

  importButton.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file || !engine) return;
    try {
      await engine.importSplat(file);
      showToast(`已导入 ${file.name}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      showToast(`导入失败：${message}`, 6500);
      console.error(error);
    } finally {
      fileInput.value = "";
    }
  });
}

function applyInspectorValues(): void {
  if (!engine || !selectedCollider) return;
  const position = readVector(positionInputs);
  const rotationDeg = readVector(rotationInputs);
  if (!position || !rotationDeg) {
    showToast("请输入有效数字", 2400);
    updateSelection(selectedCollider);
    return;
  }

  if (selectedCollider.type === "box") {
    const size = readVector(sizeInputs, 0.05);
    if (!size) {
      showToast("请输入有效尺寸", 2400);
      updateSelection(selectedCollider);
      return;
    }
    engine.updateSelectedCollider({ position, rotationDeg, size });
    return;
  }

  const radius = readPositiveNumber(radiusInput);
  const halfHeight = readPositiveNumber(halfHeightInput);
  if (radius === null || halfHeight === null) {
    showToast("请输入有效 Capsule 尺寸", 2400);
    updateSelection(selectedCollider);
    return;
  }
  engine.updateSelectedCollider({ position, rotationDeg, radius, halfHeight });
}

function updateSelection(collider: ColliderData | null): void {
  selectedCollider = collider;
  selectedIdElement.textContent = collider?.id ?? "未选择";
  selectedTypeElement.textContent = collider?.type ?? "";
  selectedTypeElement.classList.toggle("hidden", collider === null);
  selectedTypeElement.dataset.type = collider?.type ?? "";

  setVectorInputs(positionInputs, collider?.position ?? null);
  setVectorInputs(rotationInputs, collider?.rotationDeg ?? null);

  const isBox = collider?.type === "box";
  const isCapsule = collider?.type === "capsule";
  boxDimensions.classList.toggle("hidden", !isBox);
  capsuleDimensions.classList.toggle("hidden", !isCapsule);
  setVectorInputs(sizeInputs, isBox ? collider.size : null);
  radiusInput.value = isCapsule ? collider.radius.toFixed(3) : "";
  halfHeightInput.value = isCapsule ? collider.halfHeight.toFixed(3) : "";

  for (const input of inspectorInputs) input.disabled = collider === null;
  deleteColliderButton.disabled = collider === null;
  duplicateColliderButton.disabled = collider === null;
  focusSelectedButton.disabled = collider === null;
}

function renderSceneTree(state: SceneTreeState): void {
  splatCountElement.textContent = String(state.splats.length);
  colliderCountElement.textContent = String(state.colliders.length);

  splatTreeList.replaceChildren(
    ...state.splats.map((item) => createTreeItem("S", item.id, "splat", false)),
  );
  colliderTreeList.replaceChildren(
    ...state.colliders.map((item) => {
      const button = createTreeItem(
        item.type === "box" ? "B" : "C",
        item.id,
        item.type,
        item.id === state.selectedId,
      );
      button.addEventListener("click", () => engine?.selectCollider(item.id));
      return button;
    }),
  );
}

function createTreeItem(
  icon: string,
  name: string,
  kind: string,
  selected: boolean,
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "tree-item";
  button.classList.toggle("selected", selected);
  button.innerHTML = `<span class="tree-icon">${icon}</span><span class="tree-name"></span><small>${kind}</small>`;
  const nameElement = button.querySelector<HTMLElement>(".tree-name");
  if (nameElement) nameElement.textContent = name;
  if (kind === "splat") button.disabled = true;
  return button;
}

function updateTransformMode(mode: TransformControlsMode): void {
  translateButton.classList.toggle("active", mode === "translate");
  rotateButton.classList.toggle("active", mode === "rotate");
  scaleButton.classList.toggle("active", mode === "scale");
}

async function loadManifest(url: string): Promise<WorldManifest> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`无法读取世界清单 (${response.status})`);
  const value: unknown = await response.json();
  assertWorldManifest(value);
  return value;
}

function requiredElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing DOM element #${id}`);
  return element as T;
}

function getVectorInputs(prefix: string): [HTMLInputElement, HTMLInputElement, HTMLInputElement] {
  return ["x", "y", "z"].map((axis) =>
    requiredElement<HTMLInputElement>(`${prefix}-${axis}`),
  ) as [HTMLInputElement, HTMLInputElement, HTMLInputElement];
}

function setVectorInputs(
  inputs: readonly HTMLInputElement[],
  value: readonly number[] | null,
): void {
  inputs.forEach((input, index) => {
    input.value = value ? (value[index] ?? 0).toFixed(3) : "";
  });
}

function readVector(
  inputs: readonly HTMLInputElement[],
  minimumAbsoluteValue?: number,
): Vec3Tuple | null {
  const values = inputs.map((input) => Number(input.value));
  if (values.some((value) => !Number.isFinite(value))) return null;
  if (minimumAbsoluteValue !== undefined) {
    for (let index = 0; index < values.length; index += 1) {
      values[index] = Math.max(Math.abs(values[index] ?? 0), minimumAbsoluteValue);
    }
  }
  return [values[0] ?? 0, values[1] ?? 0, values[2] ?? 0];
}

function readPositiveNumber(input: HTMLInputElement): number | null {
  const value = Number(input.value);
  return Number.isFinite(value) && value > 0 ? Math.max(value, 0.05) : null;
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 ** 2).toFixed(1)} MB`;
}

function showToast(message: string, duration = 3200): void {
  window.clearTimeout(toastTimer);
  toastElement.textContent = message;
  toastElement.classList.add("visible");
  toastTimer = window.setTimeout(() => toastElement.classList.remove("visible"), duration);
}
