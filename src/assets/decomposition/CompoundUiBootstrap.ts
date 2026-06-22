import { Engine } from "../../core/Engine";

installCompoundControls();

const selectedId = requiredElement<HTMLElement>("selected-id");
const selectedType = requiredElement<HTMLElement>("selected-type");
const polyDimensions = requiredElement<HTMLElement>("poly-dimensions");
const scaleInputs = ["x", "y", "z"].map((axis) =>
  requiredElement<HTMLInputElement>(`poly-scale-${axis}`),
);
const visualSource = requiredElement<HTMLElement>("visual-source-name");

let engine: Engine | null = null;

const originalCreate = Engine.create.bind(Engine);
Object.defineProperty(Engine, "create", {
  configurable: true,
  value: async (...args: Parameters<typeof Engine.create>): Promise<Engine> => {
    const instance = await originalCreate(...args);
    engine = instance;
    refreshCompoundInspector();
    return instance;
  },
});

const observer = new MutationObserver(refreshCompoundInspector);
observer.observe(selectedId, { childList: true, characterData: true, subtree: true });
observer.observe(selectedType, { childList: true, characterData: true, subtree: true, attributes: true });

function installCompoundControls(): void {
  const mode = requiredElement<HTMLSelectElement>("glb-mode");
  if (!mode.querySelector('option[value="decomposition"]')) {
    const option = document.createElement("option");
    option.value = "decomposition";
    option.textContent = "GLB → Compound";
    mode.append(option);
  }

  if (!document.getElementById("glb-hulls")) {
    const hulls = document.createElement("select");
    hulls.id = "glb-hulls";
    hulls.className = "top-select";
    hulls.title = "Maximum convex hull count";
    for (const count of [4, 8, 16, 32]) {
      const option = document.createElement("option");
      option.value = String(count);
      option.textContent = `最多 ${count} Hulls`;
      option.selected = count === 8;
      hulls.append(option);
    }
    const detail = requiredElement<HTMLSelectElement>("glb-detail");
    detail.insertAdjacentElement("afterend", hulls);
  }
}

function refreshCompoundInspector(): void {
  if (!engine || selectedType.textContent !== "compound") return;
  const id = selectedId.textContent?.trim();
  if (!id || id === "未选择") return;
  const collider = engine.physics.getColliderData(id);
  if (!collider || collider.type !== "compound") return;

  polyDimensions.classList.remove("hidden");
  const scale = collider.scale3 ?? [1, 1, 1];
  scaleInputs.forEach((input, index) => {
    input.value = (scale[index] ?? 1).toFixed(3);
  });
  visualSource.title = `${collider.parts.length} convex hulls`;
  selectedType.title = `${collider.parts.length} convex hulls`;
  selectedType.dataset.type = "compound";
}

function requiredElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing DOM element #${id}`);
  return element as T;
}
