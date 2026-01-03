# 🔧 P3-015: Add Execution Graph Logging [parallel]

> **Parent**: #697
> **Labels**: `phase-3`, `priority-low`, `parallel`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M4: Broken Tools
> **Estimate**: 3 hours
> **Depends On**: P3-011

## Context

Observability for agent orchestration helps debug complex workflows and understand execution flow.

## Task Description

Add observability to agent orchestration:

**Create `src/agents/execution-graph.ts`:**
```typescript
export interface HandoffRecord {
  id: string;
  sourceAgent?: string;
  targetAgent: string;
  timestamp: Date;
  executionTime: number;
  success: boolean;
  error?: string;
}

export interface ExecutionGraphOptions {
  maxRecords?: number;
}

class ExecutionGraph {
  private records: HandoffRecord[] = [];
  private readonly maxRecords: number;

  constructor(options?: ExecutionGraphOptions) {
    this.maxRecords = options?.maxRecords ?? 100;
  }

  recordHandoff(record: Omit<HandoffRecord, 'id' | 'timestamp'>): void {
    this.records.push({
      ...record,
      id: this.generateId(),
      timestamp: new Date(),
    });

    // Trim if over max
    if (this.records.length > this.maxRecords) {
      this.records = this.records.slice(-this.maxRecords);
    }
  }

  getRecords(): HandoffRecord[] {
    return [...this.records];
  }

  toMermaid(): string {
    if (this.records.length === 0) {
      return 'graph LR\n    empty[No handoffs recorded]';
    }

    const lines = ['graph LR'];

    for (const record of this.records) {
      const source = record.sourceAgent ?? 'user';
      const target = record.targetAgent;
      const status = record.success ? '' : ':::error';
      const time = `${record.executionTime}ms`;

      lines.push(`    ${source} -->|${time}| ${target}${status}`);
    }

    lines.push('    classDef error fill:#f99');

    return lines.join('\n');
  }

  toSequenceDiagram(): string {
    if (this.records.length === 0) {
      return 'sequenceDiagram\n    note over User: No handoffs recorded';
    }

    const lines = ['sequenceDiagram'];
    lines.push('    participant U as User');

    // Add unique agents as participants
    const agents = new Set(this.records.flatMap(r => [r.sourceAgent, r.targetAgent]));
    agents.delete(undefined);

    for (const agent of agents) {
      lines.push(`    participant ${agent}`);
    }

    for (const record of this.records) {
      const source = record.sourceAgent ?? 'U';
      const target = record.targetAgent;
      const arrow = record.success ? '->>' : '-x';

      lines.push(`    ${source}${arrow}${target}: handoff (${record.executionTime}ms)`);
    }

    return lines.join('\n');
  }

  clear(): void {
    this.records = [];
  }

  private generateId(): string {
    return `hf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

// Singleton export
export const executionGraph = new ExecutionGraph();
```

## Acceptance Criteria

- [ ] File: `src/agents/execution-graph.ts`
- [ ] `recordHandoff()` stores handoff data
- [ ] `toMermaid()` generates flowchart diagram
- [ ] `toSequenceDiagram()` generates sequence diagram
- [ ] Integrated with orchestrator
- [ ] Unit tests

## Files to Create

- `src/agents/execution-graph.ts`
- `tests/vitest/agents/execution-graph.spec.ts`

## Files to Modify

- `src/agents/orchestrator.ts` — integrate recording
- `src/agents/index.ts`

## Verification

```bash
npm run build && npm run test:vitest -- execution-graph
```

## References

- [Mermaid Documentation](https://mermaid.js.org/)
- [TASKS Phase 3](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-3-broken-tools.md) P3-015
