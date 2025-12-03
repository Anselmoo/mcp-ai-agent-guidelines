# A2A Orchestration Examples

This document provides practical examples of using the A2A (Agent-to-Agent) orchestration infrastructure.

## Example 1: Simple Tool Chaining

Create a simple analysis pipeline:

```typescript
import { invokeTool, createA2AContext } from "./tools/shared";

async function analyzeProject(projectPath: string) {
  const context = createA2AContext();

  // Step 1: Analyze code semantics
  const semanticResult = await invokeTool(
    "semantic-code-analyzer",
    { codeContent: projectPath, analysisType: "structure" },
    context
  );

  // Step 2: Calculate clean code score
  const scoreResult = await invokeTool(
    "clean-code-scorer",
    { projectPath },
    context
  );

  // Step 3: Generate diagram
  const diagramResult = await invokeTool(
    "mermaid-diagram-generator",
    {
      description: `Code analysis for ${projectPath}`,
      diagramType: "flowchart"
    },
    context
  );

  return {
    semantic: semanticResult.data,
    score: scoreResult.data,
    diagram: diagramResult.data,
    executionLog: context.executionLog
  };
}
```

## Example 2: Using Agent Orchestrator

The agent orchestrator provides a high-level API for complex workflows:

```typescript
import { agentOrchestrator } from "./tools/agent-orchestrator";

// Quality Audit Template
async function runQualityAudit() {
  const result = await agentOrchestrator({
    mode: "template",
    template: "quality-audit",
    parameters: {
      projectPath: "./src",
      language: "typescript"
    },
    config: {
      maxDepth: 5,
      timeoutMs: 30000
    },
    includeTrace: true,
    includeVisualization: true
  });

  return JSON.parse(result.content[0].text);
}

// Security Scan Template
async function runSecurityScan() {
  const result = await agentOrchestrator({
    mode: "template",
    template: "security-scan",
    parameters: {
      dependencyContent: await readFile("package.json", "utf-8"),
      codeContext: await readFile("src/index.ts", "utf-8")
    },
    includeTrace: false
  });

  return JSON.parse(result.content[0].text);
}
```

## Example 3: Custom Workflow

Define a custom orchestration workflow:

```typescript
async function customAnalysisWorkflow() {
  const result = await agentOrchestrator({
    mode: "custom",
    executionPlan: {
      strategy: "sequential",
      steps: [
        {
          id: "onboard",
          toolName: "project-onboarding",
          args: { projectPath: "./src", analysisDepth: "standard" }
        },
        {
          id: "analyze",
          toolName: "semantic-code-analyzer",
          args: { analysisType: "all" },
          dependencies: ["onboard"]
        },
        {
          id: "score",
          toolName: "clean-code-scorer",
          args: {},
          dependencies: ["analyze"]
        }
      ],
      onError: "skip" // Continue even if a step fails
    },
    includeTrace: true
  });

  const response = JSON.parse(result.content[0].text);

  console.log(`Success: ${response.success}`);
  console.log(`Steps completed: ${response.steps.length}`);
  console.log(`Correlation ID: ${response.summary.correlationId}`);

  return response;
}
```

## Example 4: Parallel Execution

Run independent analyses in parallel:

```typescript
async function parallelAnalysis() {
  const result = await agentOrchestrator({
    mode: "custom",
    executionPlan: {
      strategy: "parallel", // Execute in parallel
      steps: [
        {
          id: "security",
          toolName: "dependency-auditor",
          args: { dependencyContent: "..." }
        },
        {
          id: "quality",
          toolName: "clean-code-scorer",
          args: { projectPath: "./src" }
        },
        {
          id: "hygiene",
          toolName: "code-hygiene-analyzer",
          args: { codeContent: "...", language: "typescript" }
        }
      ],
      onError: "skip"
    }
  });

  return JSON.parse(result.content[0].text);
}
```

## Example 5: Error Handling with Fallback

Handle errors gracefully with fallback tools:

```typescript
async function analysisWithFallback() {
  const result = await agentOrchestrator({
    mode: "custom",
    executionPlan: {
      strategy: "sequential",
      steps: [
        {
          id: "primary-analysis",
          toolName: "semantic-code-analyzer",
          args: { analysisType: "all" }
        }
      ],
      onError: "fallback",
      fallbackTool: "code-hygiene-analyzer", // Use this if primary fails
      fallbackArgs: {
        codeContent: "...",
        language: "typescript"
      }
    }
  });

  return JSON.parse(result.content[0].text);
}
```

## Example 6: Retry with Backoff

Automatically retry failed operations:

```typescript
async function analysisWithRetry() {
  const result = await agentOrchestrator({
    mode: "custom",
    executionPlan: {
      strategy: "retry-with-backoff",
      steps: [
        {
          id: "analysis",
          toolName: "semantic-code-analyzer",
          args: { analysisType: "all" }
        }
      ],
      onError: "abort",
      retryConfig: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        backoffMultiplier: 2
      }
    }
  });

  return JSON.parse(result.content[0].text);
}
```

## Example 7: Tracing and Visualization

Enable detailed execution tracing:

```typescript
async function tracedWorkflow() {
  const result = await agentOrchestrator({
    mode: "template",
    template: "code-analysis-pipeline",
    parameters: {
      codeContent: "...",
      projectPath: "./src",
      description: "Full analysis with tracing"
    },
    config: {
      correlationId: "custom-trace-id-123",
      maxDepth: 10,
      chainTimeoutMs: 300000
    },
    includeTrace: true,
    includeVisualization: true
  });

  const response = JSON.parse(result.content[0].text);

  // Access trace information
  console.log("Correlation ID:", response.trace.correlationId);
  console.log("Spans:", response.trace.spans);

  // Access Mermaid visualization
  console.log("Execution flow:");
  console.log(response.visualization);

  return response;
}
```

## Example 8: Conditional Execution

Execute steps based on runtime conditions:

```typescript
async function conditionalWorkflow() {
  const context = createA2AContext();

  // Set initial condition
  context.sharedState.set("needsDeepAnalysis", true);

  const result = await agentOrchestrator({
    mode: "custom",
    executionPlan: {
      strategy: "conditional",
      steps: [
        {
          id: "basic-check",
          toolName: "clean-code-scorer",
          args: { projectPath: "./src" },
          condition: () => true // Always run
        },
        {
          id: "deep-analysis",
          toolName: "semantic-code-analyzer",
          args: { analysisType: "all" },
          condition: (state) => state.get("needsDeepAnalysis") === true
        }
      ],
      onError: "skip"
    }
  });

  return JSON.parse(result.content[0].text);
}
```

## Example 9: Documentation Generation Pipeline

```typescript
async function generateDocumentation() {
  const result = await agentOrchestrator({
    mode: "template",
    template: "documentation-generation",
    parameters: {
      projectPath: "./src",
      contentType: "API",
      targetAudience: "developers"
    },
    includeTrace: false
  });

  const response = JSON.parse(result.content[0].text);

  if (response.success) {
    console.log("Documentation generated successfully");
    console.log("Steps:", response.steps.length);
  }

  return response;
}
```

## Running These Examples

1. **Ensure dependencies are installed:**
   ```bash
   npm install
   ```

2. **Build the project:**
   ```bash
   npm run build
   ```

3. **Import and run examples:**
   ```typescript
   import { analyzeProject } from "./examples";

   const result = await analyzeProject("./src");
   console.log(result);
   ```

## Testing Your Workflows

Use the test infrastructure to validate workflows:

```typescript
import { describe, it, expect } from "vitest";

describe("Custom Workflow", () => {
  it("should complete analysis successfully", async () => {
    const result = await runQualityAudit();

    expect(result.success).toBe(true);
    expect(result.steps).toHaveLength(2);
  });
});
```

## Best Practices

1. **Always create a context** for tracing and state management
2. **Use appropriate error strategies** based on criticality (abort vs. skip vs. fallback)
3. **Enable tracing in production** for debugging
4. **Set reasonable timeouts** to prevent hanging
5. **Use parallel strategies** when steps are independent
6. **Leverage pre-built templates** when possible

## Next Steps

- Read the [A2A Orchestration Guide](./A2A_ORCHESTRATION_GUIDE.md) for detailed API reference
- Explore the [agent-orchestrator source](../src/tools/agent-orchestrator.ts) for implementation details
- Check the [test files](../tests/vitest/) for more examples

---

For questions or issues, please open a GitHub issue or consult the main documentation.
