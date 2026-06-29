import type { RuntimeNavAgent, RuntimeNavAgentOptions, RuntimeNavAgentSnapshot, RuntimeNavRouteProvider } from "./NavAgentController.js";
import { RuntimeNavAgent as Agent } from "./NavAgentController.js";

export interface RuntimeNavAgentRegistrySnapshot {
  count: number;
  moving: number;
  blocked: number;
  arrived: number;
  idle: number;
  agents: RuntimeNavAgentSnapshot[];
}

export class RuntimeNavAgentRegistry {
  private readonly agents = new Map<string, RuntimeNavAgent>();

  constructor(private readonly nav: RuntimeNavRouteProvider) {}

  createAgent(options: RuntimeNavAgentOptions = {}): RuntimeNavAgent {
    const agent = new Agent(this.nav, options);
    if (this.agents.has(agent.id)) {
      throw new Error(`Runtime nav agent already exists: ${agent.id}`);
    }
    this.agents.set(agent.id, agent);
    return agent;
  }

  getAgent(id: string): RuntimeNavAgent | null {
    return this.agents.get(id) ?? null;
  }

  hasAgent(id: string): boolean {
    return this.agents.has(id);
  }

  removeAgent(id: string): boolean {
    const agent = this.agents.get(id);
    if (!agent) return false;
    agent.stop();
    return this.agents.delete(id);
  }

  update(deltaSeconds: number): RuntimeNavAgentRegistrySnapshot {
    for (const agent of this.agents.values()) agent.update(deltaSeconds);
    return this.snapshot();
  }

  snapshot(): RuntimeNavAgentRegistrySnapshot {
    const agents = Array.from(this.agents.values(), (agent) => agent.snapshot());
    return {
      count: agents.length,
      moving: agents.filter((agent) => agent.status === "moving").length,
      blocked: agents.filter((agent) => agent.status === "blocked").length,
      arrived: agents.filter((agent) => agent.status === "arrived").length,
      idle: agents.filter((agent) => agent.status === "idle").length,
      agents,
    };
  }

  clear(): void {
    for (const agent of this.agents.values()) agent.stop();
    this.agents.clear();
  }
}
