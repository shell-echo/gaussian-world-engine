import type { RuntimeNavAgentRegistryEvent, RuntimeNavAgentRegistryListener } from "./NavAgentRegistry.js";

export type RuntimeNavMissionHookType = RuntimeNavAgentRegistryEvent["type"] | "any";

export interface RuntimeNavMissionHook {
  id: string;
  agentId?: string;
  type?: RuntimeNavMissionHookType;
  once?: boolean;
  onEvent: RuntimeNavAgentRegistryListener;
}

export interface RuntimeNavMissionHookSnapshot {
  count: number;
  hooks: Array<{
    id: string;
    agentId: string | null;
    type: RuntimeNavMissionHookType;
    once: boolean;
  }>;
}

export class RuntimeNavMissionHooks {
  private readonly hooks = new Map<string, RuntimeNavMissionHook>();

  addHook(hook: RuntimeNavMissionHook): () => boolean {
    if (!hook.id) throw new Error("Runtime nav mission hook requires an id.");
    if (this.hooks.has(hook.id)) throw new Error(`Runtime nav mission hook already exists: ${hook.id}`);
    this.hooks.set(hook.id, hook);
    return () => this.removeHook(hook.id);
  }

  removeHook(id: string): boolean {
    return this.hooks.delete(id);
  }

  clearHooks(): void {
    this.hooks.clear();
  }

  handleEvent(event: RuntimeNavAgentRegistryEvent): void {
    const matchingHooks = Array.from(this.hooks.values()).filter((hook) => matchesHook(hook, event));
    for (const hook of matchingHooks) {
      if (hook.once) this.hooks.delete(hook.id);
      hook.onEvent(event);
    }
  }

  snapshot(): RuntimeNavMissionHookSnapshot {
    return {
      count: this.hooks.size,
      hooks: Array.from(this.hooks.values(), (hook) => ({
        id: hook.id,
        agentId: hook.agentId ?? null,
        type: hook.type ?? "any",
        once: hook.once ?? false,
      })),
    };
  }
}

function matchesHook(hook: RuntimeNavMissionHook, event: RuntimeNavAgentRegistryEvent): boolean {
  const type = hook.type ?? "any";
  if (hook.agentId && hook.agentId !== event.agentId) return false;
  if (type !== "any" && type !== event.type) return false;
  return true;
}
