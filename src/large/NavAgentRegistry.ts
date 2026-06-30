import type {
  RuntimeNavAgent,
  RuntimeNavAgentOptions,
  RuntimeNavAgentSnapshot,
  RuntimeNavAgentStatus,
  RuntimeNavAgentStatusChange,
  RuntimeNavRouteProvider,
} from "./NavAgentController.js";
import { RuntimeNavAgent as Agent } from "./NavAgentController.js";

export type RuntimeNavAgentRegistryEventType = "created" | "removed" | "status-change" | "arrived" | "blocked";

export interface RuntimeNavAgentRegistryEvent {
  type: RuntimeNavAgentRegistryEventType;
  agentId: string;
  status: RuntimeNavAgentStatus;
  previousStatus?: RuntimeNavAgentStatus;
  snapshot: RuntimeNavAgentSnapshot;
}

export type RuntimeNavAgentRegistryListener = (event: RuntimeNavAgentRegistryEvent) => void;

export interface RuntimeNavAgentRegistryOptions {
  maxEvents?: number;
}

export interface RuntimeNavAgentRegistrySnapshot {
  count: number;
  moving: number;
  blocked: number;
  arrived: number;
  idle: number;
  pendingEvents: number;
  maxEvents: number;
  droppedEvents: number;
  agents: RuntimeNavAgentSnapshot[];
}

const DEFAULT_MAX_EVENTS = 128;

export class RuntimeNavAgentRegistry {
  private readonly agents = new Map<string, RuntimeNavAgent>();
  private readonly events: RuntimeNavAgentRegistryEvent[] = [];
  private readonly listeners = new Set<RuntimeNavAgentRegistryListener>();
  private maxEventsValue: number;
  private droppedEventsValue = 0;

  constructor(
    private readonly nav: RuntimeNavRouteProvider,
    options: RuntimeNavAgentRegistryOptions = {},
  ) {
    this.maxEventsValue = normalizeMaxEvents(options.maxEvents);
  }

  createAgent(options: RuntimeNavAgentOptions = {}): RuntimeNavAgent {
    const agent = new Agent(this.nav, {
      ...options,
      onStatusChange: (change) => {
        options.onStatusChange?.(change);
        this.handleAgentStatusChange(change);
      },
      onArrive: (snapshot) => {
        options.onArrive?.(snapshot);
        this.emit({ type: "arrived", agentId: snapshot.id, status: snapshot.status, snapshot });
      },
      onBlocked: (snapshot) => {
        options.onBlocked?.(snapshot);
        this.emit({ type: "blocked", agentId: snapshot.id, status: snapshot.status, snapshot });
      },
    });
    if (this.agents.has(agent.id)) {
      throw new Error(`Runtime nav agent already exists: ${agent.id}`);
    }
    this.agents.set(agent.id, agent);
    const snapshot = agent.snapshot();
    this.emit({ type: "created", agentId: agent.id, status: snapshot.status, snapshot });
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
    const snapshot = agent.snapshot();
    const removed = this.agents.delete(id);
    if (removed) this.emit({ type: "removed", agentId: id, status: snapshot.status, snapshot });
    return removed;
  }

  subscribe(listener: RuntimeNavAgentRegistryListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  get maxEvents(): number {
    return this.maxEventsValue;
  }

  get droppedEvents(): number {
    return this.droppedEventsValue;
  }

  setMaxEvents(maxEvents: number): void {
    this.maxEventsValue = normalizeMaxEvents(maxEvents);
    this.trimEvents();
  }

  peekEvents(): RuntimeNavAgentRegistryEvent[] {
    return this.events.map(cloneEvent);
  }

  drainEvents(): RuntimeNavAgentRegistryEvent[] {
    const drained = this.peekEvents();
    this.events.length = 0;
    return drained;
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
      pendingEvents: this.events.length,
      maxEvents: this.maxEventsValue,
      droppedEvents: this.droppedEventsValue,
      agents,
    };
  }

  clearEvents(): void {
    this.events.length = 0;
    this.droppedEventsValue = 0;
  }

  clear(): void {
    for (const agent of this.agents.values()) agent.stop();
    this.agents.clear();
    this.clearEvents();
  }

  private handleAgentStatusChange(change: RuntimeNavAgentStatusChange): void {
    this.emit({
      type: "status-change",
      agentId: change.agentId,
      previousStatus: change.previousStatus,
      status: change.status,
      snapshot: change.snapshot,
    });
  }

  private emit(event: RuntimeNavAgentRegistryEvent): void {
    const cloned = cloneEvent(event);
    this.events.push(cloned);
    this.trimEvents();
    for (const listener of this.listeners) listener(cloneEvent(cloned));
  }

  private trimEvents(): void {
    if (this.events.length <= this.maxEventsValue) return;
    const dropCount = this.events.length - this.maxEventsValue;
    this.events.splice(0, dropCount);
    this.droppedEventsValue += dropCount;
  }
}

function normalizeMaxEvents(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : DEFAULT_MAX_EVENTS;
}

function cloneEvent(event: RuntimeNavAgentRegistryEvent): RuntimeNavAgentRegistryEvent {
  return {
    ...event,
    snapshot: {
      ...event.snapshot,
      position: [...event.snapshot.position],
      velocity: [...event.snapshot.velocity],
      destination: event.snapshot.destination ? [...event.snapshot.destination] : null,
      routeTileIds: [...event.snapshot.routeTileIds],
    },
  };
}
