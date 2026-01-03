# SPEC-004: Agent Handoffs & A2A Chaining

> Technical specification for implementing agent-to-agent communication patterns

## 📋 Document Metadata

| Field         | Value                          |
| ------------- | ------------------------------ |
| Specification | SPEC-004                       |
| Title         | Agent Handoffs & A2A Chaining  |
| Status        | Draft                          |
| Created       | January 2026                   |
| Related ADR   | ADR-006 (proposed)             |
| Phase         | Phase 4 (Spec-Kit Integration) |

---

## 1. Executive Summary

This specification defines the implementation of agent-to-agent (A2A) communication patterns, enabling MCP tools to delegate tasks to specialized agents and orchestrate multi-step workflows. This builds on research from PR #384 (A2A Chaining) and integrates with the OutputStrategy layer.

## 2. Background & Research

### 2.1 A2A Protocol Research

| Protocol             | Status   | Integration            |
| -------------------- | -------- | ---------------------- |
| Google A2A           | Emerging | Watch/evaluate         |
| MCP Server-to-Server | Emerging | Primary target         |
| Langraph             | Mature   | Reference architecture |
| CrewAI               | Mature   | Pattern reference      |

### 2.2 Current Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │────▶│  MCP Server │────▶│   Tools     │
└─────────────┘     └─────────────┘     └─────────────┘
                          │
                          ▼
                   Single Request/Response
```

### 2.3 Target Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────────────┐
│    User     │────▶│  MCP Server │────▶│     Tool Orchestrator   │
└─────────────┘     └─────────────┘     └───────────┬─────────────┘
                                                    │
                    ┌───────────────────────────────┼───────────────────────────────┐
                    ▼                               ▼                               ▼
            ┌───────────────┐               ┌───────────────┐               ┌───────────────┐
            │  Agent: Code  │               │ Agent: Design │               │ Agent: Test   │
            │    Review     │──handoff──▶   │   Assistant   │──handoff──▶   │   Generator   │
            └───────────────┘               └───────────────┘               └───────────────┘
```

---

## 3. Goals & Non-Goals

### 3.1 Goals

1. **Define handoff protocol** — Standardized way for tools to delegate to other tools
2. **Implement agent orchestrator** — Coordinate multi-tool workflows
3. **Enable workflow templates** — Pre-defined agent chains for common tasks
4. **Integrate with OutputStrategy** — Handoffs work with all output approaches
5. **Maintain observability** — Track handoff chains for debugging

### 3.2 Non-Goals

- Implementing full Google A2A protocol
- Cross-server agent communication (future)
- Persistent agent memory across requests (future)
- Human-in-the-loop approval workflows

---

## 4. Technical Specification

### 4.1 Core Interfaces

```typescript
// src/agents/types.ts

/**
 * Agent identity and capabilities
 */
export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  inputSchema: z.ZodSchema;
  outputSchema: z.ZodSchema;
}

/**
 * Handoff request from one agent to another
 */
export interface HandoffRequest {
  /** Source agent ID */
  from: string;

  /** Target agent ID */
  to: string;

  /** Task description for target agent */
  task: string;

  /** Input data for target agent */
  input: Record<string, unknown>;

  /** Context passed from source agent */
  context?: HandoffContext;

  /** Optional callback preferences */
  callback?: HandoffCallback;
}

/**
 * Context passed between agents
 */
export interface HandoffContext {
  /** Original user request */
  originalRequest?: string;

  /** Chain of previous agents */
  agentChain: string[];

  /** Accumulated results */
  accumulatedResults: Record<string, unknown>;

  /** Shared workspace state */
  workspace?: WorkspaceContext;
}

/**
 * Result of a handoff
 */
export interface HandoffResult {
  /** Target agent ID */
  agentId: string;

  /** Success or failure */
  success: boolean;

  /** Agent output */
  output: unknown;

  /** Error details if failed */
  error?: McpToolError;

  /** Execution metadata */
  metadata: {
    startTime: Date;
    endTime: Date;
    duration: number;
  };
}

/**
 * Callback configuration for handoffs
 */
export interface HandoffCallback {
  /** Whether to wait for result */
  sync: boolean;

  /** Timeout in milliseconds */
  timeout?: number;

  /** How to handle result */
  resultHandling: 'merge' | 'replace' | 'append';
}
```

### 4.2 Agent Orchestrator

```typescript
// src/agents/orchestrator.ts

import { AgentDefinition, HandoffRequest, HandoffResult } from './types.js';
import { ErrorCode, McpToolError } from '../tools/shared/errors.js';

/**
 * Orchestrates agent-to-agent handoffs
 */
export class AgentOrchestrator {
  private agents: Map<string, AgentDefinition>;
  private executionGraph: ExecutionGraph;

  constructor() {
    this.agents = new Map();
    this.executionGraph = new ExecutionGraph();
  }

  /**
   * Register an agent with the orchestrator
   */
  registerAgent(agent: AgentDefinition): void {
    this.agents.set(agent.id, agent);
  }

  /**
   * Execute a handoff between agents
   */
  async executeHandoff(request: HandoffRequest): Promise<HandoffResult> {
    const startTime = new Date();

    // Validate target agent exists
    const targetAgent = this.agents.get(request.to);
    if (!targetAgent) {
      throw new McpToolError(
        ErrorCode.VALIDATION_ERROR,
        `Unknown target agent: ${request.to}`,
        { availableAgents: Array.from(this.agents.keys()) }
      );
    }

    // Validate input against agent schema
    const validatedInput = targetAgent.inputSchema.safeParse(request.input);
    if (!validatedInput.success) {
      throw new McpToolError(
        ErrorCode.SCHEMA_VIOLATION,
        `Invalid input for agent ${request.to}`,
        { issues: validatedInput.error.issues }
      );
    }

    // Build context
    const context: HandoffContext = {
      ...request.context,
      agentChain: [...(request.context?.agentChain || []), request.from],
    };

    // Execute agent
    try {
      const output = await this.executeAgent(
        targetAgent,
        validatedInput.data,
        context
      );

      const endTime = new Date();
      return {
        agentId: request.to,
        success: true,
        output,
        metadata: {
          startTime,
          endTime,
          duration: endTime.getTime() - startTime.getTime(),
        },
      };
    } catch (error) {
      const endTime = new Date();
      return {
        agentId: request.to,
        success: false,
        output: null,
        error: error instanceof McpToolError
          ? error
          : new McpToolError(ErrorCode.UNEXPECTED_ERROR, String(error)),
        metadata: {
          startTime,
          endTime,
          duration: endTime.getTime() - startTime.getTime(),
        },
      };
    }
  }

  /**
   * Execute a workflow chain
   */
  async executeChain(
    workflow: WorkflowDefinition,
    initialInput: Record<string, unknown>
  ): Promise<ChainResult> {
    const results: HandoffResult[] = [];
    let currentInput = initialInput;
    let currentContext: HandoffContext = {
      agentChain: [],
      accumulatedResults: {},
    };

    for (const step of workflow.steps) {
      const handoffRequest: HandoffRequest = {
        from: step.from || 'orchestrator',
        to: step.agent,
        task: step.task,
        input: this.resolveInput(step.input, currentInput, currentContext),
        context: currentContext,
      };

      const result = await this.executeHandoff(handoffRequest);
      results.push(result);

      if (!result.success && !step.continueOnError) {
        return {
          success: false,
          results,
          error: result.error,
        };
      }

      // Update context for next step
      currentContext = {
        ...currentContext,
        agentChain: [...currentContext.agentChain, step.agent],
        accumulatedResults: {
          ...currentContext.accumulatedResults,
          [step.agent]: result.output,
        },
      };

      // Update input for next step
      if (result.success) {
        currentInput = result.output as Record<string, unknown>;
      }
    }

    return {
      success: true,
      results,
      finalOutput: currentInput,
    };
  }

  private resolveInput(
    inputSpec: InputSpec,
    currentInput: Record<string, unknown>,
    context: HandoffContext
  ): Record<string, unknown> {
    // Resolve input references like "$previous.output" or "$context.originalRequest"
    // Implementation details...
    return inputSpec;
  }
}
```

### 4.3 Workflow Definition

```typescript
// src/agents/workflow.ts

/**
 * Definition of a multi-agent workflow
 */
export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;

  /** Trigger conditions */
  triggers?: WorkflowTrigger[];

  /** Workflow steps */
  steps: WorkflowStep[];

  /** Global error handling */
  errorHandling?: ErrorHandlingConfig;
}

export interface WorkflowStep {
  /** Step identifier */
  id: string;

  /** Agent to execute */
  agent: string;

  /** Task description */
  task: string;

  /** Input specification */
  input: InputSpec;

  /** Source agent (for handoff context) */
  from?: string;

  /** Continue chain if this step fails */
  continueOnError?: boolean;

  /** Conditional execution */
  condition?: StepCondition;
}

export interface StepCondition {
  /** Reference to previous output */
  ref: string;

  /** Operator */
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';

  /** Value to compare */
  value: unknown;
}
```

### 4.4 Pre-defined Workflows

```typescript
// src/agents/workflows/code-review-chain.ts

export const CODE_REVIEW_WORKFLOW: WorkflowDefinition = {
  id: 'code-review-chain',
  name: 'Comprehensive Code Review',
  description: 'Multi-agent code review with quality scoring, security check, and documentation',

  steps: [
    {
      id: 'score',
      agent: 'clean-code-scorer',
      task: 'Calculate code quality score',
      input: { codebase: '$input.code', language: '$input.language' },
    },
    {
      id: 'security',
      agent: 'security-hardening-prompt-builder',
      task: 'Check for security vulnerabilities',
      input: { codeContext: '$input.code', securityFocus: 'vulnerability-analysis' },
      from: 'clean-code-scorer',
    },
    {
      id: 'documentation',
      agent: 'documentation-generator-prompt-builder',
      task: 'Generate documentation for code',
      input: { contentType: 'API', existingContent: '$input.code' },
      from: 'security-hardening-prompt-builder',
      condition: {
        ref: '$steps.score.output.score',
        operator: 'greaterThan',
        value: 70,
      },
    },
  ],
};

export const DESIGN_TO_SPEC_WORKFLOW: WorkflowDefinition = {
  id: 'design-to-spec',
  name: 'Design Session to Specification',
  description: 'Convert design session to formal specification documents',

  steps: [
    {
      id: 'analyze',
      agent: 'design-assistant',
      task: 'Start design session and gather requirements',
      input: {
        action: 'start-session',
        config: {
          goal: '$input.designGoal',
          context: '$input.context',
        },
      },
    },
    {
      id: 'architecture',
      agent: 'architecture-design-prompt-builder',
      task: 'Generate architecture prompt',
      input: {
        systemRequirements: '$steps.analyze.output.requirements',
        scale: '$input.scale',
      },
      from: 'design-assistant',
    },
    {
      id: 'spec',
      agent: 'domain-neutral-prompt-builder',
      task: 'Create specification document',
      input: {
        title: '$input.title',
        summary: '$steps.analyze.output.summary',
        objectives: '$steps.analyze.output.objectives',
      },
      from: 'architecture-design-prompt-builder',
    },
  ],
};
```

---

## 5. Integration with OutputStrategy

### 5.1 Workflow Output Selection

```typescript
// Workflows can specify output approach
export interface WorkflowDefinition {
  // ... existing fields

  /** Output configuration */
  output?: {
    /** Preferred output approach */
    approach: OutputApproach;

    /** Cross-cutting capabilities to include */
    crossCutting?: CrossCuttingCapability[];
  };
}

// Example: Design workflow that produces ADR
const DESIGN_WORKFLOW: WorkflowDefinition = {
  // ...
  output: {
    approach: 'adr',
    crossCutting: ['diagram', 'issues'],
  },
};
```

### 5.2 Handoff Result Formatting

```typescript
// Format final workflow result using OutputStrategy
async function formatWorkflowResult(
  chainResult: ChainResult,
  outputConfig: OutputConfig
): Promise<OutputArtifacts> {
  const strategy = getStrategy(outputConfig.approach);

  // Aggregate all step outputs into domain result
  const domainResult: DomainResult = {
    title: chainResult.workflow.name,
    summary: `Executed ${chainResult.results.length} steps`,
    sections: chainResult.results.map(r => ({
      agent: r.agentId,
      output: r.output,
      success: r.success,
    })),
  };

  return strategy.render(domainResult, {
    crossCutting: outputConfig.crossCutting,
  });
}
```

---

## 6. Observability

### 6.1 Execution Graph

```typescript
// src/agents/execution-graph.ts

export class ExecutionGraph {
  private nodes: Map<string, ExecutionNode>;
  private edges: ExecutionEdge[];

  /**
   * Record a handoff in the graph
   */
  recordHandoff(request: HandoffRequest, result: HandoffResult): void {
    const node: ExecutionNode = {
      id: `${request.to}-${Date.now()}`,
      agentId: request.to,
      task: request.task,
      startTime: result.metadata.startTime,
      endTime: result.metadata.endTime,
      success: result.success,
    };

    this.nodes.set(node.id, node);

    if (request.from) {
      this.edges.push({
        from: request.from,
        to: request.to,
        timestamp: result.metadata.startTime,
      });
    }
  }

  /**
   * Generate Mermaid diagram of execution
   */
  toMermaid(): string {
    let diagram = 'flowchart LR\n';

    for (const [id, node] of this.nodes) {
      const status = node.success ? '✅' : '❌';
      diagram += `  ${id}[${status} ${node.agentId}]\n`;
    }

    for (const edge of this.edges) {
      diagram += `  ${edge.from} --> ${edge.to}\n`;
    }

    return diagram;
  }
}
```

### 6.2 Trace Logging

```typescript
// Structured logging for handoffs
logger.info('handoff:start', {
  from: request.from,
  to: request.to,
  task: request.task,
  traceId: generateTraceId(),
});

logger.info('handoff:complete', {
  agentId: result.agentId,
  success: result.success,
  duration: result.metadata.duration,
  traceId: getTraceId(),
});
```

---

## 7. Error Handling in Chains

### 7.1 Chain Error Policies

```typescript
export type ChainErrorPolicy =
  | 'stop'           // Stop chain on first error
  | 'continue'       // Continue with next step
  | 'retry'          // Retry failed step
  | 'fallback';      // Use fallback agent

export interface ErrorHandlingConfig {
  policy: ChainErrorPolicy;
  maxRetries?: number;
  fallbackAgent?: string;

  /** Errors to ignore */
  ignoreCodes?: ErrorCode[];
}
```

### 7.2 Error Propagation

```typescript
async function executeWithErrorHandling(
  step: WorkflowStep,
  config: ErrorHandlingConfig
): Promise<HandoffResult> {
  let attempts = 0;
  const maxAttempts = config.policy === 'retry' ? (config.maxRetries || 3) : 1;

  while (attempts < maxAttempts) {
    const result = await this.executeHandoff(step);

    if (result.success) {
      return result;
    }

    // Check if error should be ignored
    if (result.error && config.ignoreCodes?.includes(result.error.code)) {
      return { ...result, success: true };
    }

    // Check error policy
    switch (config.policy) {
      case 'stop':
        throw result.error;
      case 'continue':
        return result;
      case 'retry':
        attempts++;
        await sleep(Math.pow(2, attempts) * 1000); // Exponential backoff
        break;
      case 'fallback':
        if (config.fallbackAgent) {
          return this.executeHandoff({ ...step, to: config.fallbackAgent });
        }
        throw result.error;
    }
  }

  throw new McpToolError(
    ErrorCode.OPERATION_FAILED,
    `Step ${step.id} failed after ${maxAttempts} attempts`
  );
}
```

---

## 8. Testing Strategy

### 8.1 Unit Tests

```typescript
// tests/vitest/agents/orchestrator.spec.ts
describe('AgentOrchestrator', () => {
  it('executes simple handoff', async () => {
    const orchestrator = new AgentOrchestrator();
    orchestrator.registerAgent(mockCodeScorerAgent);

    const result = await orchestrator.executeHandoff({
      from: 'user',
      to: 'clean-code-scorer',
      task: 'Score this code',
      input: { code: 'const x = 1;' },
    });

    expect(result.success).toBe(true);
    expect(result.output).toHaveProperty('score');
  });

  it('rejects handoff to unknown agent', async () => {
    const orchestrator = new AgentOrchestrator();

    await expect(orchestrator.executeHandoff({
      from: 'user',
      to: 'unknown-agent',
      task: 'Do something',
      input: {},
    })).rejects.toThrow('Unknown target agent');
  });
});
```

### 8.2 Integration Tests

```typescript
// tests/vitest/agents/workflows.spec.ts
describe('Workflow Execution', () => {
  it('executes code review chain', async () => {
    const orchestrator = setupTestOrchestrator();

    const result = await orchestrator.executeChain(
      CODE_REVIEW_WORKFLOW,
      { code: testCode, language: 'typescript' }
    );

    expect(result.success).toBe(true);
    expect(result.results).toHaveLength(3);
    expect(result.results[0].agentId).toBe('clean-code-scorer');
  });
});
```

---

## 9. Success Criteria

| Criterion                   | Target   | Measurement                       |
| --------------------------- | -------- | --------------------------------- |
| Orchestrator implementation | Complete | Core class working                |
| Pre-defined workflows       | 3+       | CODE_REVIEW, DESIGN_TO_SPEC, etc. |
| Error handling policies     | 4        | stop, continue, retry, fallback   |
| OutputStrategy integration  | 100%     | All workflows use strategies      |
| Execution graph             | Complete | Mermaid visualization working     |
| Test coverage               | 90%+     | Vitest report                     |

---

## 10. Future Considerations

1. **Cross-Server A2A**: Communication between different MCP servers
2. **Persistent Memory**: Agent memory across requests
3. **Human-in-the-Loop**: Approval workflows
4. **Parallel Execution**: Run multiple agents simultaneously
5. **Dynamic Routing**: AI-based agent selection

---

## 11. References

- PR #384: A2A Chaining Implementation
- [Google A2A Protocol](https://github.com/google/a2a)
- [LangGraph Documentation](https://python.langchain.com/docs/langgraph)
- [CrewAI Agents](https://www.crewai.com/)

---

*Specification Created: January 2026*
*Status: Draft — Awaiting Review*
