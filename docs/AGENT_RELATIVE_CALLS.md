<!-- HEADER:START -->
![Header](./.frames-static/09-header.svg)
<!-- HEADER:END -->

# Agent-Relative Call Patterns

> Invoking tools in workflows and multi-agent systems

## Overview

Agent-relative call patterns define how AI agents invoke tools, coordinate workflows, and interact with other agents in a systematic, traceable manner.

## Core Concepts

### 1. Tool Invocation Patterns

**Direct Calls**: Single tool invocation for specific tasks

```typescript
// Direct pattern
const result = await tool({ params });
```

**Chained Calls**: Sequential tool invocation with output passing

```typescript
// Chain pattern
const step1 = await tool1({ input });
const step2 = await tool2({ input: step1.output });
const step3 = await tool3({ input: step2.output });
```

**Parallel Calls**: Independent tool invocation

```typescript
// Parallel pattern
const [result1, result2, result3] = await Promise.all([
  tool1({ params1 }),
  tool2({ params2 }),
  tool3({ params3 }),
]);
```

### 2. Workflow Orchestration

**Sequential Workflows**: Steps executed in order

```typescript
const workflow = await promptChainingBuilder({
  chainName: "sequential-workflow",
  executionStrategy: "sequential",
  steps: [
    /* steps */
  ],
});
```

**Conditional Workflows**: Branching based on conditions

```typescript
const workflow = await promptFlowBuilder({
  flowName: "conditional-workflow",
  nodes: [
    /* nodes */
  ],
  edges: [
    /* with conditions */
  ],
});
```

**Iterative Workflows**: Loops until condition met

```typescript
let result;
do {
  result = await tool({ params });
} while (!result.satisfies(condition));
```

### 3. Multi-Agent Coordination

**Coordinator Pattern**: One agent orchestrates others

```typescript
// Coordinator agent
const coordinator = {
  async execute(task) {
    const analysis = await analysisAgent.analyze(task);
    const design = await designAgent.design(analysis);
    const code = await codingAgent.implement(design);
    return code;
  },
};
```

**Pipeline Pattern**: Agents in sequence

```typescript
// Pipeline
const result = await pipelineExecutor(
  [requirementsAgent, designAgent, implementationAgent, testingAgent],
  initialInput
);
```

**Swarm Pattern**: Agents work in parallel

```typescript
// Swarm
const results = await Promise.all([
  frontendAgent.build(spec),
  backendAgent.build(spec),
  databaseAgent.build(spec),
]);
```

## Best Practices

### 1. Explicit Dependencies

Always declare dependencies between tool calls:

```typescript
// ✅ Good: Clear dependencies
const design = await designTool({ spec });
const implementation = await codeTool({ design }); // Depends on design

// ❌ Bad: Implicit dependencies
const implementation = await codeTool({ spec }); // Should depend on design
```

### 2. Error Handling

Handle errors at each step:

```typescript
try {
  const result = await tool({ params });
  return result;
} catch (error) {
  if (error instanceof ValidationError) {
    // Retry with corrected params
  } else {
    // Escalate to coordinator
    throw error;
  }
}
```

### 3. State Management

Maintain workflow state:

```typescript
const workflowState = {
  currentPhase: "design",
  completedSteps: [],
  pendingSteps: ["implementation", "testing"],
  artifacts: {},
};
```

### 4. Traceability

Log all tool invocations:

```typescript
logger.info({
  tool: "design-assistant",
  action: "start-session",
  params: { goal: "..." },
  timestamp: new Date(),
});
```

## Common Patterns

### Pattern 1: Analysis-Design-Implementation

```typescript
async function buildFeature(requirements) {
  // Analysis
  const analysis = await semanticCodeAnalyzer({
    codeContent: existingCode,
    analysisType: "all",
  });

  // Design
  const design = await designAssistant({
    action: "start-session",
    config: { goal: requirements },
  });

  // Implementation planning
  const timeline = await sprintTimelineCalculator({
    tasks: design.tasks,
    teamSize: 3,
  });

  return { analysis, design, timeline };
}
```

### Pattern 2: Iterative Improvement

```typescript
async function improveCodeQuality(code, targetScore = 90) {
  let currentScore = 0;
  let iterations = 0;
  const maxIterations = 5;

  while (currentScore < targetScore && iterations < maxIterations) {
    // Score
    const score = await cleanCodeScorer({ codeContent: code });
    currentScore = score.overall;

    if (currentScore >= targetScore) break;

    // Analyze issues
    const issues = await codeHygieneAnalyzer({ codeContent: code });

    // Fix issues (would integrate with code modification tool)
    code = await applyFixes(code, issues);

    iterations++;
  }

  return { code, finalScore: currentScore, iterations };
}
```

### Pattern 3: Parallel Analysis

```typescript
async function comprehensiveAudit(codebase) {
  const [quality, security, coverage, hygiene] = await Promise.all([
    cleanCodeScorer({ projectPath: codebase }),
    securityHardeningPromptBuilder({ codeContext: codebase }),
    iterativeCoverageEnhancer({ projectPath: codebase }),
    codeHygieneAnalyzer({ codeContent: codebase }),
  ]);

  return {
    quality,
    security,
    coverage,
    hygiene,
    overallHealth: calculateOverallHealth({
      quality,
      security,
      coverage,
      hygiene,
    }),
  };
}
```

## Related Resources

- [Flow Prompting Examples](./FLOW_PROMPTING_EXAMPLES.md) - Workflow patterns
- [Tools Reference](./TOOLS_REFERENCE.md) - Available tools
- [AI Interaction Tips](./AI_INTERACTION_TIPS.md) - Effective tool usage

## Conclusion

Agent-relative call patterns provide structured approaches for tool invocation, workflow orchestration, and multi-agent coordination. By following these patterns, you can build reliable, maintainable AI workflows.

---

<!-- FOOTER:START -->

![Footer](../.frames-static/09-footer.svg)

<!-- FOOTER:END -->
