# A2A Orchestration Infrastructure - README Addition

## Add this section to the main README.md

### Agent-to-Agent (A2A) Orchestration

The MCP AI Agent Guidelines server now includes comprehensive A2A (Agent-to-Agent) orchestration infrastructure, enabling tools to invoke other tools in coordinated workflows with context propagation, error handling, and distributed tracing.

#### Key Features

- **Tool-to-Tool Invocation**: Tools can invoke other tools at runtime with proper context
- **Execution Strategies**: Sequential, parallel, conditional, retry-with-backoff
- **Context Propagation**: Automatic context and state management across tool chains
- **Permission Management**: Allowlist-based security for tool invocations
- **Distributed Tracing**: Correlation IDs and execution spans for debugging
- **Error Handling**: Configurable strategies (abort, skip, fallback) with retry logic
- **Pre-built Workflows**: Templates for common patterns (quality-audit, security-scan, etc.)

#### Quick Start

```typescript
// Simple tool invocation
import { invokeTool, createA2AContext } from "./tools/shared";

const context = createA2AContext();
const result = await invokeTool("clean-code-scorer", { projectPath: "./src" }, context);
```

```typescript
// Using pre-built workflows
import { agentOrchestrator } from "./tools/agent-orchestrator";

const result = await agentOrchestrator({
  mode: "template",
  template: "quality-audit",
  parameters: { projectPath: "./src" },
  includeTrace: true
});
```

#### Core Components

- **A2A Context** (`src/tools/shared/a2a-context.ts`): Context management with correlation IDs and execution logging
- **Tool Registry** (`src/tools/shared/tool-registry.ts`): Centralized tool management with permissions
- **Tool Invoker** (`src/tools/shared/tool-invoker.ts`): Core invocation engine with timeout and deduplication
- **Execution Controller** (`src/tools/shared/execution-controller.ts`): Multi-strategy workflow orchestration
- **Async Patterns** (`src/tools/shared/async-patterns.ts`): Reusable patterns (map-reduce, pipeline, etc.)
- **Trace Logger** (`src/tools/shared/trace-logger.ts`): Distributed tracing and visualization
- **Agent Orchestrator** (`src/tools/agent-orchestrator.ts`): High-level workflow coordination tool

#### Documentation

- **[A2A Orchestration Guide](./docs/A2A_ORCHESTRATION_GUIDE.md)** - Complete guide with API reference
- **[A2A Examples](./docs/A2A_EXAMPLES.md)** - Practical usage examples and patterns

#### Pre-built Workflow Templates

The agent orchestrator provides ready-to-use templates:

- **quality-audit**: Sequential code quality assessment
- **security-scan**: Parallel security analysis
- **code-analysis-pipeline**: Sequential analysis with visualization
- **documentation-generation**: Project documentation workflow

#### Architecture

```
MCP Client (Claude, VS Code)
      │
      ▼
  A2A Orchestrator
      │
      ├─► Tool Registry (permissions, concurrency)
      │
      ├─► Execution Controller (strategies)
      │       │
      │       ├─► Sequential
      │       ├─► Parallel
      │       ├─► Conditional
      │       └─► Retry
      │
      ├─► Context Manager (tracing, state)
      │
      └─► Trace Logger (observability)
```

#### Usage Example

```typescript
// Custom workflow with dependencies
await agentOrchestrator({
  mode: "custom",
  executionPlan: {
    strategy: "parallel",
    steps: [
      { id: "analyze", toolName: "semantic-code-analyzer", args: {...} },
      { id: "score", toolName: "clean-code-scorer", args: {...}, dependencies: ["analyze"] }
    ],
    onError: "skip"
  }
});
```

For detailed documentation, examples, and API reference, see:
- [A2A Orchestration Guide](./docs/A2A_ORCHESTRATION_GUIDE.md)
- [A2A Examples](./docs/A2A_EXAMPLES.md)
