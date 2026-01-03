# 🔧 P3-010: Implement AgentRegistry [serial]

> **Parent**: [003-parent-phase3-broken-tools.md](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/issues-draft/003-parent-phase3-broken-tools.md)
> **Labels**: `phase-3`, `priority-high`, `serial`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M4: Broken Tools
> **Estimate**: 4 hours
> **Depends On**: P3-009
> **Blocks**: P3-011, P3-012

## Context

The AgentRegistry maintains a catalog of available agents and supports capability-based queries.

## Task Description

Create registry for available agents:

**Create `src/agents/types.ts`:**
```typescript
export interface AgentDefinition {
  name: string;
  description: string;
  capabilities: string[];
  inputSchema: object;
  outputSchema?: object;
  toolName: string;  // MCP tool backing this agent
}

export interface AgentInfo {
  name: string;
  description: string;
  capabilities: string[];
  available: boolean;
}

export interface HandoffRequest {
  sourceAgent?: string;
  targetAgent: string;
  context: unknown;
  reason?: string;
}

export interface HandoffResult {
  success: boolean;
  output: unknown;
  executionTime: number;
  error?: string;
}
```

**Create `src/agents/registry.ts`:**
```typescript
import type { AgentDefinition, AgentInfo } from './types.js';

class AgentRegistry {
  private agents: Map<string, AgentDefinition> = new Map();

  registerAgent(agent: AgentDefinition): void {
    if (this.agents.has(agent.name)) {
      throw new Error(`Agent already registered: ${agent.name}`);
    }
    this.agents.set(agent.name, agent);
  }

  getAgent(name: string): AgentDefinition | undefined {
    return this.agents.get(name);
  }

  queryByCapability(capabilities: string[]): AgentDefinition[] {
    return Array.from(this.agents.values()).filter(agent =>
      capabilities.some(cap => agent.capabilities.includes(cap))
    );
  }

  listAgents(): AgentInfo[] {
    return Array.from(this.agents.values()).map(agent => ({
      name: agent.name,
      description: agent.description,
      capabilities: agent.capabilities,
      available: true,
    }));
  }

  unregisterAgent(name: string): boolean {
    return this.agents.delete(name);
  }

  clear(): void {
    this.agents.clear();
  }
}

// Singleton export
export const agentRegistry = new AgentRegistry();
```

## Acceptance Criteria

- [ ] File: `src/agents/types.ts` with types
- [ ] File: `src/agents/registry.ts` with AgentRegistry
- [ ] `registerAgent()` adds agent to registry
- [ ] `getAgent()` retrieves by name
- [ ] `queryByCapability()` finds agents by capability
- [ ] `listAgents()` returns all agent info
- [ ] Unit tests cover all methods

## Files to Create

- `src/agents/types.ts`
- `src/agents/registry.ts`
- `src/agents/index.ts`
- `tests/vitest/agents/registry.spec.ts`

## Verification

```bash
npm run build && npm run test:vitest -- registry
```

## References

- [SPEC-004: Agent Orchestration](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-004-agent-orchestration.md)
- [TASKS Phase 3](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-3-broken-tools.md) P3-010
