# 🔧 P3-011: Implement Basic AgentOrchestrator [serial]

> **Parent**: #TBD
> **Labels**: `phase-3`, `priority-high`, `serial`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M4: Broken Tools
> **Estimate**: 6 hours
> **Depends On**: P3-010
> **Blocks**: P3-013, P3-014, P3-015

## Context

The AgentOrchestrator executes handoffs between agents and manages workflow execution.

## Task Description

Implement core orchestrator functionality:

**Create `src/agents/orchestrator.ts`:**
```typescript
import { agentRegistry } from './registry.js';
import type { HandoffRequest, HandoffResult, AgentDefinition } from './types.js';
import { McpToolError, ErrorCode } from '../tools/shared/errors.js';

export interface Workflow {
  name: string;
  description: string;
  steps: WorkflowStep[];
}

export interface WorkflowStep {
  agent: string;
  inputMapping?: Record<string, string>;  // Map from previous output
}

export interface WorkflowResult {
  success: boolean;
  outputs: Record<string, unknown>;
  executionTime: number;
  steps: StepResult[];
  error?: string;
}

interface StepResult {
  agent: string;
  success: boolean;
  output?: unknown;
  executionTime: number;
  error?: string;
}

class AgentOrchestrator {
  private toolExecutor: (toolName: string, args: unknown) => Promise<unknown>;

  setToolExecutor(executor: (toolName: string, args: unknown) => Promise<unknown>): void {
    this.toolExecutor = executor;
  }

  async executeHandoff(request: HandoffRequest): Promise<HandoffResult> {
    const startTime = Date.now();

    // Get target agent
    const agent = agentRegistry.getAgent(request.targetAgent);
    if (!agent) {
      return {
        success: false,
        output: null,
        executionTime: Date.now() - startTime,
        error: `Agent not found: ${request.targetAgent}`,
      };
    }

    try {
      // Execute the backing tool
      const output = await this.toolExecutor(agent.toolName, request.context);

      return {
        success: true,
        output,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        output: null,
        executionTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async executeWorkflow(workflow: Workflow, input: unknown): Promise<WorkflowResult> {
    const startTime = Date.now();
    const outputs: Record<string, unknown> = { _initial: input };
    const steps: StepResult[] = [];

    let currentInput = input;

    for (const step of workflow.steps) {
      const stepStart = Date.now();

      // Map input from previous outputs if specified
      const stepInput = step.inputMapping
        ? this.mapInput(outputs, step.inputMapping)
        : currentInput;

      const result = await this.executeHandoff({
        targetAgent: step.agent,
        context: stepInput,
      });

      steps.push({
        agent: step.agent,
        success: result.success,
        output: result.output,
        executionTime: result.executionTime,
        error: result.error,
      });

      if (!result.success) {
        return {
          success: false,
          outputs,
          executionTime: Date.now() - startTime,
          steps,
          error: `Workflow failed at step: ${step.agent}`,
        };
      }

      outputs[step.agent] = result.output;
      currentInput = result.output;
    }

    return {
      success: true,
      outputs,
      executionTime: Date.now() - startTime,
      steps,
    };
  }

  private mapInput(
    outputs: Record<string, unknown>,
    mapping: Record<string, string>
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, path] of Object.entries(mapping)) {
      result[key] = this.getValueByPath(outputs, path);
    }
    return result;
  }

  private getValueByPath(obj: unknown, path: string): unknown {
    return path.split('.').reduce((acc, key) =>
      acc && typeof acc === 'object' ? (acc as any)[key] : undefined,
      obj
    );
  }
}

// Singleton export
export const agentOrchestrator = new AgentOrchestrator();
```

## Acceptance Criteria

- [ ] File: `src/agents/orchestrator.ts`
- [ ] `executeHandoff()` executes single agent
- [ ] `executeWorkflow()` executes multi-step workflow
- [ ] Context propagation between steps
- [ ] Error handling with detailed results
- [ ] Execution timing recorded
- [ ] Unit tests

## Files to Create

- `src/agents/orchestrator.ts`
- `tests/vitest/agents/orchestrator.spec.ts`

## Files to Modify

- `src/agents/index.ts`

## Verification

```bash
npm run build && npm run test:vitest -- orchestrator
```

## References

- [SPEC-004: Agent Orchestration](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-004-agent-orchestration.md)
- [TASKS Phase 3](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-3-broken-tools.md) P3-011
