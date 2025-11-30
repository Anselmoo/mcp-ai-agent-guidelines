<!-- HEADER:START -->

![Header](../.frames-static/09-header.svg)

<!-- HEADER:END -->

# Serena Integration Workflows

> **Flow-Based Serena Patterns**

[![MCP AI Agent Guidelines](https://img.shields.io/badge/MCP-AI_Agent_Guidelines-1a7f37?style=flat-square&logo=github)](../README.md)
[![Documentation](https://img.shields.io/badge/📚-Documentation-blue?style=flat-square)](./README.md)
[![Technical Guide](https://img.shields.io/badge/Type-Technical_Guide-purple?style=flat-square)](./README.md#documentation-index)

<details>
<summary><strong>📍 Quick Navigation</strong></summary>

**Related Guides:**

- [Serena Strategies](./serena-strategies.md)
- [Bridge Connectors](./bridge-connectors.md)
- [Documentation Index](../README.md#documentation-index)

</details>

---

# Flow-Based Prompting & Serena Patterns Integration

This guide demonstrates how to combine flow-based prompting strategies (inspired by claude-flow) with Serena's memory and context management patterns for powerful, context-aware AI workflows.

## Overview

### Flow-Based Prompting (claude-flow)

- **Prompt Chaining**: Sequential multi-step workflows with data flow
- **Prompt Flows**: Declarative graphs with branching, loops, and parallel execution
- **Visualization**: Automatic Mermaid diagram generation
- **Error Handling**: Configurable strategies (skip, retry, abort)

### Serena Patterns

- **Memory System**: Project context retention across sessions
- **Mode Switching**: Adaptive behavior (planning, editing, analysis, etc.)
- **Semantic Analysis**: Symbol-based code understanding
- **Context Optimization**: Efficient token usage for long sessions

## Integration Patterns

### 1. Planning-First Workflow

Start in planning mode, design the flow, then execute in editing mode.

```typescript
// Step 1: Switch to planning mode
await modeSwitcher({
  targetMode: "planning",
  context: "ide-assistant",
  reason: "Design comprehensive workflow before execution",
});

// Step 2: Design the flow architecture
const flowDesign = await promptFlowBuilder({
  flowName: "Feature Implementation Flow",
  description: "Plan complete feature development workflow",
  nodes: [
    {
      id: "requirements",
      type: "prompt",
      name: "Gather Requirements",
      config: { prompt: "Analyze feature requirements and constraints" },
    },
    {
      id: "design",
      type: "prompt",
      name: "Design Architecture",
      config: { prompt: "Design system architecture and data flow" },
    },
    {
      id: "review",
      type: "condition",
      name: "Design Review",
      config: { expression: "complexity <= acceptable_threshold" },
    },
    {
      id: "simplify",
      type: "prompt",
      name: "Simplify Design",
      config: { prompt: "Reduce complexity while maintaining requirements" },
    },
    {
      id: "implement",
      type: "prompt",
      name: "Implementation Plan",
      config: { prompt: "Create detailed implementation steps" },
    },
  ],
  edges: [
    { from: "requirements", to: "design" },
    { from: "design", to: "review" },
    { from: "review", to: "implement", condition: "true", label: "Approved" },
    {
      from: "review",
      to: "simplify",
      condition: "false",
      label: "Too Complex",
    },
    { from: "simplify", to: "design", label: "Iterate" },
  ],
  outputFormat: "both",
});

// Step 3: Review and validate plan
// ... (manual review of flowDesign.content[0].text)

// Step 4: Switch to editing mode for execution
await modeSwitcher({
  currentMode: "planning",
  targetMode: "editing",
  context: "ide-assistant",
  reason: "Execute validated implementation plan",
});

// Step 5: Execute the implementation
// ... (use the plan from step 2)
```

### 2. Memory-Aware Chaining

Use project memories to inform each step in a chain.

```typescript
// Step 1: Load or create project memories
const onboarding = await projectOnboarding({
  projectPath: process.cwd(),
  projectName: "MyProject",
  projectType: "application",
  analysisDepth: "standard",
  includeMemories: true,
});

// Step 2: Create chain that uses project context
await promptChainingBuilder({
  chainName: "Context-Aware Refactoring",
  description: "Refactor code using project-specific patterns and conventions",
  context: `Project: ${onboarding.memories.architecture}`,
  globalVariables: {
    coding_standards: onboarding.memories.codeConventions,
    tech_stack: onboarding.memories.dependencies,
  },
  steps: [
    {
      name: "Identify Patterns",
      prompt: "Identify code patterns that violate {{coding_standards}}",
      outputKey: "violations",
    },
    {
      name: "Check Compatibility",
      prompt: "Ensure refactoring is compatible with {{tech_stack}}",
      dependencies: ["violations"],
      outputKey: "safe_changes",
    },
    {
      name: "Apply Refactoring",
      prompt: "Refactor code following project patterns: {{safe_changes}}",
      dependencies: ["safe_changes"],
      errorHandling: "abort",
    },
    {
      name: "Update Memories",
      prompt: "Update project memories with new patterns discovered",
      dependencies: ["safe_changes"],
      errorHandling: "skip",
    },
  ],
});
```

### 3. Semantic-Aware Flows

Combine semantic code analysis with flow-based processing.

```typescript
// Step 1: Perform semantic analysis
const semanticAnalysis = await semanticCodeAnalyzer({
  codeContent: sourceCode,
  analysisType: "all",
  language: "TypeScript/JavaScript",
});

// Step 2: Create flow based on code structure
await promptFlowBuilder({
  flowName: "Symbol-Based Refactoring",
  description: "Refactor using semantic understanding of code symbols",
  variables: {
    symbols: JSON.stringify(semanticAnalysis.symbols),
    dependencies: JSON.stringify(semanticAnalysis.dependencies),
  },
  nodes: [
    {
      id: "analyze_symbols",
      type: "prompt",
      name: "Analyze Symbols",
      config: {
        prompt: "Review symbols: {{symbols}} for refactoring opportunities",
      },
    },
    {
      id: "check_deps",
      type: "condition",
      name: "Has Dependencies",
      config: { expression: "dependencies.length > 0" },
    },
    {
      id: "refactor_safe",
      type: "prompt",
      name: "Safe Refactoring",
      config: {
        prompt: "Refactor symbols with no dependencies first",
      },
    },
    {
      id: "refactor_deps",
      type: "prompt",
      name: "Dependency-Aware Refactoring",
      config: {
        prompt:
          "Carefully refactor symbols with dependencies: {{dependencies}}",
      },
    },
    {
      id: "merge",
      type: "merge",
      name: "Combine Changes",
    },
  ],
  edges: [
    { from: "analyze_symbols", to: "check_deps" },
    { from: "check_deps", to: "refactor_safe", condition: "false" },
    { from: "check_deps", to: "refactor_deps", condition: "true" },
    { from: "refactor_safe", to: "merge" },
    { from: "refactor_deps", to: "merge" },
  ],
});
```

### 4. Context-Optimized Long Workflows

Manage context window efficiently in multi-step workflows.

```typescript
await promptChainingBuilder({
  chainName: "Memory-Efficient Documentation",
  description: "Generate documentation with context optimization",
  steps: [
    {
      name: "Extract Code Structure",
      prompt: "Extract code structure and API surface",
      outputKey: "structure",
    },
    {
      name: "Optimize Context",
      prompt:
        "Use memory-context-optimizer with cacheStrategy=aggressive to compress {{structure}}",
      dependencies: ["structure"],
      outputKey: "optimized_structure",
    },
    {
      name: "Generate API Docs",
      prompt: "Generate API documentation from {{optimized_structure}}",
      dependencies: ["optimized_structure"],
      outputKey: "api_docs",
    },
    {
      name: "Optimize Again",
      prompt: "Re-optimize context before examples: {{api_docs}}",
      dependencies: ["api_docs"],
      outputKey: "optimized_docs",
    },
    {
      name: "Add Examples",
      prompt: "Add code examples to {{optimized_docs}}",
      dependencies: ["optimized_docs"],
      outputKey: "complete_docs",
    },
    {
      name: "Final Optimization",
      prompt: "Final memory optimization of {{complete_docs}} for storage",
      dependencies: ["complete_docs"],
    },
  ],
  executionStrategy: "sequential",
});
```

### 5. Multi-Mode Workflow Orchestration

Switch modes throughout a complex workflow for optimal results.

```typescript
// Step 1: Start with analysis mode
await modeSwitcher({
  targetMode: "analysis",
  context: "agent",
});

const analysisFlow = await promptFlowBuilder({
  flowName: "Multi-Mode Development Workflow",
  nodes: [
    {
      id: "analyze",
      type: "prompt",
      name: "Analyze Requirements",
      config: { prompt: "Analyze project requirements and constraints" },
    },
  ],
});

// Step 2: Switch to planning mode
await modeSwitcher({
  currentMode: "analysis",
  targetMode: "planning",
  context: "agent",
});

const planningChain = await promptChainingBuilder({
  chainName: "Architecture Planning",
  steps: [
    {
      name: "Design Architecture",
      prompt: "Design system architecture based on analysis",
      outputKey: "architecture",
    },
    {
      name: "Plan Implementation",
      prompt: "Create implementation plan for {{architecture}}",
      dependencies: ["architecture"],
    },
  ],
});

// Step 3: Switch to editing mode for implementation
await modeSwitcher({
  currentMode: "planning",
  targetMode: "editing",
  context: "agent",
});

// Implementation happens here...

// Step 4: Switch to debugging mode for testing
await modeSwitcher({
  currentMode: "editing",
  targetMode: "debugging",
  context: "agent",
});

// Testing and debugging...

// Step 5: Switch to documentation mode
await modeSwitcher({
  currentMode: "debugging",
  targetMode: "documentation",
  context: "agent",
});

// Documentation generation...
```

## Best Practices

### 1. Always Start with Planning Mode

- Design flows before executing them
- Use visualization to validate flow logic
- Get stakeholder approval on flow structure

### 2. Leverage Project Memories

- Load project context at the start of workflows
- Update memories after significant operations
- Use memories to maintain consistency across sessions

### 3. Optimize Context Window Usage

- Use memory-context-optimizer between long steps
- Compress intermediate results when possible
- Cache frequently used context data

### 4. Combine Semantic Analysis with Flows

- Use symbol-based operations for precise code changes
- Let semantic analysis inform flow branching decisions
- Validate changes against code structure

### 5. Switch Modes Appropriately

- Use planning mode for design and architecture
- Use editing mode for implementation
- Use analysis mode for understanding existing code
- Use debugging mode for issue resolution
- Use documentation mode for docs generation

## Common Patterns

### Pattern: Incremental Feature Development

```typescript
// 1. Planning mode: Design feature
// 2. Load project context
// 3. Editing mode: Implement in small steps with memory optimization
// 4. Debugging mode: Test and fix issues
// 5. Documentation mode: Update docs
// 6. Update project memories
```

### Pattern: Large-Scale Refactoring

```typescript
// 1. Analysis mode: Semantic code analysis
// 2. Planning mode: Design refactoring flow with branches for different cases
// 3. Load and use project memories for consistency
// 4. Editing mode: Execute refactoring with error recovery
// 5. Optimize context between large file operations
// 6. Update memories with new patterns
```

### Pattern: Comprehensive Code Review

```typescript
// 1. Analysis mode: Understand changes
// 2. Create parallel flow for multiple review aspects
// 3. Use semantic analysis to understand impact
// 4. Optimize context for large diffs
// 5. Generate consolidated feedback
// 6. Store review patterns in memories
```

## Performance Tips

1. **Parallel Execution**: Use parallel nodes for independent analyses
2. **Context Compression**: Apply memory optimization between expensive steps
3. **Caching**: Store project context and reuse across flows
4. **Incremental Processing**: Break large tasks into smaller, cacheable chunks
5. **Mode Switching**: Minimize mode switches - batch operations by mode
6. **Error Handling**: Use appropriate strategies (skip for optional, abort for critical)
7. **Visualization**: Generate diagrams only when needed (disable for production)

## Troubleshooting

### Issue: Context Window Overflow

**Solution**: Add memory-context-optimizer steps between large operations

### Issue: Slow Flow Execution

**Solution**: Identify independent nodes and use parallel execution

### Issue: Inconsistent Results

**Solution**: Load project memories at flow start for consistent context

### Issue: Complex Flow Hard to Debug

**Solution**: Enable visualization and add logging at merge points

### Issue: Lost Context Between Sessions

**Solution**: Use project-onboarding to persist and reload memories

## Resources

- [Flow-Based Prompting Examples](./flow-prompting-examples.md)
- [Serena Strategies](./serena-strategies.md)
- [Serena Integration Summary](./serena-strategies.md)
- [Claude Flow Architecture](https://github.com/ruvnet/claude-flow)
- [Serena Project](https://github.com/oraios/serena)

---

<!-- FOOTER:START -->

![Footer](../.frames-static/09-footer.svg)

<!-- FOOTER:END -->
