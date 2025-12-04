# Agent-to-Agent (A2A) Orchestration Guide

## Overview

The A2A (Agent-to-Agent) orchestration infrastructure enables tools within the MCP AI Agent Guidelines server to invoke other tools in coordinated workflows with context propagation, error handling, and distributed tracing.

## Table of Contents

- [Core Concepts](#core-concepts)
- [Quick Start](#quick-start)
- [Core Components](#core-components)
- [Usage Examples](#usage-examples)
- [Pre-built Workflows](#pre-built-workflows)
- [Advanced Patterns](#advanced-patterns)
- [Best Practices](#best-practices)
- [API Reference](#api-reference)

## Core Concepts

### What is A2A Orchestration?

A2A orchestration allows tools to:
- **Invoke other tools** at runtime with proper context
- **Chain operations** sequentially or in parallel
- **Share state** across tool invocations
- **Handle errors** intelligently with retry/fallback strategies
- **Trace execution** with correlation IDs for debugging

### Key Design Principles

1. **MCP is a protocol, not an orchestrator** - Orchestration logic lives in tool implementations
2. **Asymmetric patterns** - Tools have different capabilities and coordinate accordingly
3. **External context management** - Long-term state managed outside MCP's transport layer
4. **Structured error propagation** - Failures surface actionable information

## Quick Start

###  Basic Tool Invocation

```typescript
import { invokeTool } from "./shared/tool-invoker.js";
import { createA2AContext } from "./shared/a2a-context.js";

// Create context for tracing
const context = createA2AContext();

// Invoke a tool
const result = await invokeTool(
  "clean-code-scorer",
  { projectPath: "./src" },
  context
);

if (result.success) {
  console.log("Score:", result.data);
}
```

### 2. Sequential Tool Chain

```typescript
import { invokeSequence } from "./shared/tool-invoker.js";

const result = await invokeSequence(
  [
    { toolName: "semantic-code-analyzer" },
    { toolName: "clean-code-scorer" },
    { toolName: "mermaid-diagram-generator" },
  ],
  undefined, // context (optional)
  { projectPath: "./src" } // initial input
);
```

### 3. Using Agent Orchestrator (High-Level)

```typescript
import { agentOrchestrator } from "./agent-orchestrator.js";

// Use pre-built workflow template
const result = await agentOrchestrator({
  mode: "template",
  template: "quality-audit",
  parameters: {
    projectPath: "./src",
    language: "typescript"
  },
  includeTrace: true
});
```

## Core Components

### 1. A2A Context (`a2a-context.ts`)

Manages execution context across tool invocations.

**Features:**
- Unique correlation IDs for distributed tracing
- Recursion depth tracking (prevents infinite loops)
- Shared state map for passing data between tools
- Execution audit trail with timestamps and durations
- Timeout enforcement (per-tool and chain-level)

**Usage:**

```typescript
import { createA2AContext, createChildContext } from "./shared/a2a-context.js";

// Create root context
const context = createA2AContext("custom-correlation-id", {
  maxDepth: 10,
  timeoutMs: 30000,
  chainTimeoutMs: 300000
});

// Create child context for nested invocation
const childContext = createChildContext(context, "parent-tool-name");

// Add to shared state
context.sharedState.set("key", "value");

// Check timeout
if (hasChainTimedOut(context)) {
  throw new ChainTimeoutError();
}
```

### 2. Tool Registry (`tool-registry.ts`)

Centralized tool registration with permission management.

**Features:**
- Tool registration with metadata and schemas
- Permission allowlists (canInvoke field)
- Wildcard permissions support (`["*"]`)
- Concurrency limits per tool
- Input/output schema validation

**Usage:**

```typescript
import { toolRegistry } from "./shared/tool-registry.js";
import { z } from "zod";

// Register a tool
toolRegistry.register(
  {
    name: "my-analyzer",
    description: "Analyzes code quality",
    inputSchema: z.object({
      code: z.string(),
      language: z.string()
    }),
    canInvoke: ["mermaid-diagram-generator", "clean-code-scorer"],
    maxConcurrency: 5
  },
  async (args, context) => {
    // Can invoke allowed tools
    const scoreResult = await invokeTool(
      "clean-code-scorer",
      { projectPath: args.code },
      context
    );

    return {
      success: true,
      data: { score: scoreResult.data }
    };
  }
);
```

### 3. Tool Invoker (`tool-invoker.ts`)

Core invocation engine with timeout, deduplication, and batch support.

**Features:**
- Automatic context propagation
- Timeout enforcement
- Deduplication via input hashing
- Custom error handlers
- Batch and sequence operations

**API:**

```typescript
// Single invocation
const result = await invokeTool(toolName, args, context, {
  timeoutMs: 30000,
  deduplicate: true,
  onError: (error) => ({ success: false, error: error.message })
});

// Batch invocation (parallel)
const results = await batchInvoke([
  { toolName: "tool-a", args: { id: 1 } },
  { toolName: "tool-b", args: { id: 2 } }
], context);

// Sequential invocation
const result = await invokeSequence([
  { toolName: "tool-a" },
  { toolName: "tool-b", transform: (prev) => ({ ...prev, modified: true }) }
], context, initialInput);
```

### 4. Execution Controller (`execution-controller.ts`)

High-level workflow orchestration with multiple strategies.

**Strategies:**
- `sequential`: Execute steps one after another
- `parallel`: Execute independent steps concurrently
- `parallel-with-join`: Parallel execution with result merging
- `conditional`: Branch based on shared state predicates
- `retry-with-backoff`: Exponential backoff with configurable limits

**Usage:**

```typescript
import { executeChain, type ExecutionPlan } from "./shared/execution-controller.js";

const plan: ExecutionPlan = {
  strategy: "sequential",
  onError: "abort", // or "skip", "fallback"
  steps: [
    { id: "step1", toolName: "tool-a", args: {} },
    { id: "step2", toolName: "tool-b", args: {}, dependencies: ["step1"] },
  ],
  fallbackTool: "fallback-tool", // optional
  fallbackArgs: {} // optional
};

const context = createA2AContext();
const result = await executeChain(plan, context);

console.log(`Success: ${result.success}`);
console.log(`Steps: ${result.summary.totalSteps}`);
console.log(`Duration: ${result.summary.totalDurationMs}ms`);
```

### 5. Async Patterns (`async-patterns.ts`)

Reusable patterns for common orchestration scenarios.

**Patterns:**
- `mapReduceTools`: Parallel processing with aggregation
- `pipelineTools`: Sequential transformation chain
- `scatterGatherTools`: Fan-out/fan-in pattern
- `waterfallTools`: Cascade with accumulation
- `raceTools`: First successful result wins
- `retryWithBackoff`: Exponential backoff retry
- `fallbackChain`: Primary/secondary with failover

**Example:**

```typescript
import { mapReduceTools, pipelineTools } from "./shared/async-patterns.js";

// Map-Reduce: Process multiple items in parallel then aggregate
const result = await mapReduceTools(
  [
    { toolName: "analyzer", args: { file: "a.ts" } },
    { toolName: "analyzer", args: { file: "b.ts" } },
    { toolName: "analyzer", args: { file: "c.ts" } }
  ],
  context,
  (results) => ({
    success: true,
    data: { totalIssues: results.reduce((sum, r) => sum + r.data.issues, 0) }
  })
);

// Pipeline: Transform data through multiple stages
const result = await pipelineTools(
  ["parse", "validate", "transform", "optimize"],
  { input: "raw data" },
  context
);
```

### 6. Trace Logger (`trace-logger.ts`)

Distributed tracing with span tracking and visualization.

**Features:**
- Span-based execution tracking
- Timeline visualization
- Critical path analysis
- OTLP export for external observability
- Performance metrics

**Usage:**

```typescript
import { traceLogger, createTraceFromContext } from "./shared/trace-logger.js";

// Start chain tracing
traceLogger.startChain(context);

// ... execute tools ...

// End chain
traceLogger.endChain(context, success, errorMessage);

// Export trace
const trace = createTraceFromContext(context);
console.log(JSON.stringify(trace, null, 2));

// Get timeline visualization
const timeline = traceLogger.visualizeTimeline(context);
console.log(timeline); // Mermaid diagram
```

## Usage Examples

### Example 1: Quality Audit Workflow

```typescript
import { executeChain } from "./shared/execution-controller.js";
import { createA2AContext } from "./shared/a2a-context.js";

async function qualityAudit(projectPath: string) {
  const plan = {
    strategy: "sequential" as const,
    onError: "abort" as const,
    steps: [
      {
        id: "clean-code",
        toolName: "clean-code-scorer",
        args: { projectPath }
      },
      {
        id: "hygiene",
        toolName: "code-hygiene-analyzer",
        args: { projectPath },
        dependencies: ["clean-code"]
      }
    ]
  };

  const context = createA2AContext();
  traceLogger.startChain(context);

  const result = await executeChain(plan, context);

  traceLogger.endChain(context, result.success);

  return {
    success: result.success,
    cleanCodeScore: result.stepResults.get("clean-code")?.data,
    hygieneReport: result.stepResults.get("hygiene")?.data,
    trace: createTraceFromContext(context)
  };
}
```

### Example 2: Parallel Security Scan

```typescript
import { scatterGatherTools } from "./shared/async-patterns.js";

async function securityScan(codebase: string) {
  const context = createA2AContext();

  const result = await scatterGatherTools(
    ["dependency-auditor", "security-hardening-prompt-builder"],
    { codebase },
    context,
    (results) => {
      const dependencyIssues = results[0]?.data?.issues || [];
      const securityIssues = results[1]?.data?.issues || [];

      return {
        success: true,
        data: {
          totalIssues: dependencyIssues.length + securityIssues.length,
          dependencyIssues,
          securityIssues
        }
      };
    }
  );

  return result;
}
```

### Example 3: Retry with Fallback

```typescript
import { retryWithBackoff, fallbackChain } from "./shared/async-patterns.js";

async function analyzeWithFallback(code: string) {
  const context = createA2AContext();

  // Try primary analyzer with retries
  let result = await retryWithBackoff(
    "advanced-analyzer",
    { code },
    context,
    3, // maxRetries
    1000, // initialDelayMs
    10000, // maxDelayMs
    2 // backoffMultiplier
  );

  // If still failing, try fallback chain
  if (!result.success) {
    result = await fallbackChain(
      ["advanced-analyzer", "simple-analyzer", "basic-analyzer"],
      { code },
      context
    );
  }

  return result;
}
```

## Pre-built Workflows

The `agent-orchestrator` tool provides pre-built workflow templates.

### Quality Audit

Sequential workflow for code quality assessment.

```typescript
await agentOrchestrator({
  mode: "template",
  template: "quality-audit",
  parameters: {
    projectPath: "./src",
    language: "typescript"
  }
});
```

**Steps:**
1. `clean-code-scorer` → Calculate quality score
2. `code-hygiene-analyzer` → Identify code smells

### Security Scan

Parallel workflow for security analysis.

```typescript
await agentOrchestrator({
  mode: "template",
  template: "security-scan",
  parameters: {
    dependencyContent: packageJson,
    codeContext: sourceCode
  }
});
```

**Steps:**
1. `dependency-auditor` (parallel)
2. `security-hardening-prompt-builder` (parallel)

### Code Analysis Pipeline

Sequential analysis with visualization.

```typescript
await agentOrchestrator({
  mode: "template",
  template: "code-analysis-pipeline",
  parameters: {
    codeContent: sourceCode,
    projectPath: "./src",
    description: "Architecture analysis"
  }
});
```

**Steps:**
1. `semantic-code-analyzer` → Analyze structure
2. `clean-code-scorer` → Calculate score
3. `mermaid-diagram-generator` → Visualize results

### Documentation Generation

Documentation workflow.

```typescript
await agentOrchestrator({
  mode: "template",
  template: "documentation-generation",
  parameters: {
    projectPath: "./src",
    contentType: "API"
  }
});
```

**Steps:**
1. `project-onboarding` → Scan project structure
2. `documentation-generator-prompt-builder` → Generate docs

### Custom Workflows

Define custom workflows:

```typescript
await agentOrchestrator({
  mode: "custom",
  executionPlan: {
    strategy: "parallel",
    steps: [
      {
        id: "analyze",
        toolName: "semantic-code-analyzer",
        args: { code: sourceCode }
      },
      {
        id: "test",
        toolName: "iterative-coverage-enhancer",
        args: { projectPath: "./src" }
      }
    ],
    onError: "skip"
  }
});
```

## Advanced Patterns

### Pattern 1: Conditional Execution

Execute steps based on runtime conditions:

```typescript
const plan: ExecutionPlan = {
  strategy: "conditional",
  onError: "abort",
  steps: [
    {
      id: "always-run",
      toolName: "initial-check",
      args: {}
    },
    {
      id: "conditional-step",
      toolName: "deep-analysis",
      args: {},
      condition: (state) => state.get("initial-check-passed") === true
    }
  ]
};
```

### Pattern 2: Dependency Graph

Complex dependencies with parallel execution where possible:

```typescript
const plan: ExecutionPlan = {
  strategy: "parallel",
  onError: "abort",
  steps: [
    { id: "a", toolName: "tool-a", args: {} },
    { id: "b", toolName: "tool-b", args: {}, dependencies: ["a"] },
    { id: "c", toolName: "tool-c", args: {}, dependencies: ["a"] },
    { id: "d", toolName: "tool-d", args: {}, dependencies: ["b", "c"] }
  ]
};

// Execution order: a → (b || c) → d
```

### Pattern 3: Nested Orchestration

Tools can invoke the orchestrator recursively:

```typescript
toolRegistry.register(
  {
    name: "complex-analyzer",
    description: "Complex analysis with sub-workflows",
    inputSchema: z.any(),
    canInvoke: ["*"] // Can invoke any tool
  },
  async (args, context) => {
    // Run sub-workflow
    const subResult = await executeChain(
      {
        strategy: "sequential",
        onError: "skip",
        steps: [/* ... */]
      },
      createChildContext(context, "complex-analyzer")
    );

    return { success: true, data: subResult };
  }
);
```

## Best Practices

### 1. Context Management

- **Always create a root context** for top-level invocations
- **Use child contexts** for nested invocations to maintain the trace hierarchy
- **Set appropriate timeouts** - balance responsiveness vs. completion
- **Clean up shared state** when no longer needed

```typescript
// Good
const context = createA2AContext(undefined, {
  maxDepth: 10,
  timeoutMs: 30000,
  chainTimeoutMs: 300000
});

// Use child contexts for nesting
const childContext = createChildContext(context, "parent-tool");
```

### 2. Permission Management

- **Use allowlists** to restrict which tools can invoke others
- **Prefer specific permissions** over wildcards when possible
- **Document why** a tool needs specific permissions

```typescript
// Good - specific permissions
canInvoke: ["clean-code-scorer", "code-hygiene-analyzer"]

// Use with caution - wildcard
canInvoke: ["*"]
```

### 3. Error Handling

- **Choose appropriate error strategies**: `abort`, `skip`, or `fallback`
- **Provide custom error handlers** for graceful degradation
- **Log errors with context** for debugging

```typescript
// Good - custom error handler
await invokeTool(toolName, args, context, {
  onError: (error) => {
    logger.warn("Tool failed, using default", { error: error.message });
    return { success: true, data: defaultValue };
  }
});
```

### 4. Performance

- **Use parallel strategies** when steps are independent
- **Set concurrency limits** to prevent resource exhaustion
- **Enable deduplication** for idempotent operations
- **Use timeouts** to prevent runaway executions

```typescript
// Good - parallel with concurrency limit
toolRegistry.register(
  {
    name: "analyzer",
    maxConcurrency: 5, // Limit concurrent invocations
    canInvoke: []
  },
  async (args) => {/* ... */}
);
```

### 5. Observability

- **Always enable tracing** for production workflows
- **Use correlation IDs** consistently
- **Export traces** to external systems for analysis
- **Visualize execution** for debugging

```typescript
// Good - full observability
const context = createA2AContext("custom-correlation-id");
traceLogger.startChain(context);

// ... execute workflow ...

traceLogger.endChain(context, success);
const trace = createTraceFromContext(context);
await exportToOTLP(trace);
```

## API Reference

### A2A Context

```typescript
interface A2AContext {
  correlationId: string;
  parentToolName?: string;
  depth: number;
  maxDepth: number;
  sharedState: Map<string, unknown>;
  executionLog: ExecutionLogEntry[];
  timeoutMs?: number;
  chainTimeoutMs?: number;
  chainStartTime?: Date;
}

function createA2AContext(
  correlationId?: string,
  config?: Partial<A2AContextConfig>
): A2AContext;

function createChildContext(
  parent: A2AContext,
  toolName: string
): A2AContext;

function hasChainTimedOut(context: A2AContext): boolean;
```

### Tool Registry

```typescript
interface ToolDescriptor {
  name: string;
  description: string;
  inputSchema: z.ZodType;
  outputSchema?: z.ZodType;
  canInvoke: string[];
  maxConcurrency?: number;
  tags?: string[];
}

interface ToolRegistry {
  register(descriptor: ToolDescriptor, handler: ToolHandler): void;
  invoke(toolName: string, args: unknown, context?: A2AContext): Promise<ToolResult>;
  listTools(filter?: ToolFilter): ToolDescriptor[];
  getCapabilityMatrix(): Map<string, string[]>;
  clear(): void;
}
```

### Tool Invoker

```typescript
interface InvocationOptions {
  timeoutMs?: number;
  deduplicate?: boolean;
  onError?: (error: Error) => ToolResult | Promise<ToolResult>;
}

async function invokeTool(
  toolName: string,
  args: unknown,
  context?: A2AContext,
  options?: InvocationOptions
): Promise<ToolResult>;

async function batchInvoke(
  invocations: Array<{ toolName: string; args: unknown }>,
  context?: A2AContext
): Promise<ToolResult[]>;

async function invokeSequence(
  steps: Array<{ toolName: string; transform?: (prev: unknown) => unknown }>,
  context?: A2AContext,
  initialInput?: unknown
): Promise<ToolResult>;
```

### Execution Controller

```typescript
type ExecutionStrategy =
  | "sequential"
  | "parallel"
  | "parallel-with-join"
  | "conditional"
  | "retry-with-backoff";

interface ExecutionPlan {
  strategy: ExecutionStrategy;
  steps: ExecutionStep[];
  onError: "abort" | "skip" | "fallback";
  fallbackTool?: string;
  fallbackArgs?: unknown;
  retryConfig?: RetryConfig;
}

async function executeChain(
  plan: ExecutionPlan,
  context: A2AContext
): Promise<ChainResult>;
```

## Troubleshooting

### Common Issues

**Issue:** `RecursionDepthError`

```
Solution: Increase maxDepth or check for circular dependencies
```

```typescript
const context = createA2AContext(undefined, { maxDepth: 20 });
```

**Issue:** `ToolTimeoutError`

```
Solution: Increase timeout or optimize tool implementation
```

```typescript
await invokeTool(toolName, args, context, { timeoutMs: 60000 });
```

**Issue:** `ToolInvocationNotAllowedError`

```
Solution: Add tool to canInvoke allowlist
```

```typescript
toolRegistry.register(
  {
    name: "my-tool",
    canInvoke: ["other-tool"], // Add missing tool here
    // ...
  },
  handler
);
```

**Issue:** High memory usage

```
Solution: Clear shared state or reduce log retention
```

```typescript
// Clear shared state after use
context.sharedState.clear();

// Or be selective
context.sharedState.delete("large-object");
```

## Further Reading

- [MCP Specification](https://modelcontextprotocol.io)
- [Advanced MCP: Agent Orchestration, Chaining, and Handoffs](https://www.getknit.dev/blog/advanced-mcp-agent-orchestration-chaining-and-handoffs)
- [arXiv:2504.21030 - Advancing Multi-Agent Systems Through MCP](https://arxiv.org/abs/2504.21030)
- [Project README](../../README.md)
- [CHANGELOG](../../CHANGELOG.md)

---

**Need help?** Open an issue on GitHub or consult the examples in `demos/`.
