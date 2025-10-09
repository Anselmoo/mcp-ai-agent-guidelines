# Advanced Prompting Strategies Examples

This document demonstrates the new flow-based prompting capabilities inspired by claude-flow.

## 1. Prompt Chaining Example

### Security Analysis Chain

```typescript
// Multi-step security analysis workflow
await promptChainingBuilder({
  chainName: "Security Analysis Pipeline",
  description: "Comprehensive security review with progressive refinement",
  context: "Web application codebase security audit",
  globalVariables: {
    compliance: "OWASP Top 10",
    severity_threshold: "medium"
  },
  steps: [
    {
      name: "Initial Scan",
      description: "Automated vulnerability detection",
      prompt: "Scan the codebase for common security vulnerabilities including SQL injection, XSS, CSRF, and insecure dependencies",
      outputKey: "vulnerabilities",
      errorHandling: "abort"
    },
    {
      name: "Risk Assessment",
      description: "Evaluate severity and impact",
      prompt: "For each vulnerability in {{vulnerabilities}}, assess:\n1. Severity level (low/medium/high/critical)\n2. Potential impact\n3. Exploitability\n4. Affected components",
      dependencies: ["vulnerabilities"],
      outputKey: "risk_analysis",
      errorHandling: "retry"
    },
    {
      name: "Compliance Check",
      description: "Verify against compliance standards",
      prompt: "Map the identified issues in {{risk_analysis}} to {{compliance}} requirements and identify any compliance gaps",
      dependencies: ["risk_analysis"],
      outputKey: "compliance_report",
      errorHandling: "skip"
    },
    {
      name: "Remediation Plan",
      description: "Generate actionable fixes",
      prompt: "Create a prioritized remediation plan for {{risk_analysis}} including:\n- Quick wins (< 1 day)\n- Short-term fixes (1-5 days)\n- Long-term improvements (> 5 days)\nProvide code examples for top 3 issues",
      dependencies: ["risk_analysis", "compliance_report"],
      errorHandling: "abort"
    }
  ],
  executionStrategy: "sequential",
  includeVisualization: true
});
```

### Code Review Chain

```typescript
await promptChainingBuilder({
  chainName: "Adaptive Code Review",
  steps: [
    {
      name: "Static Analysis",
      prompt: "Perform static code analysis checking for:\n- Code complexity\n- Duplicate code\n- Dead code\n- Style violations",
      outputKey: "static_results"
    },
    {
      name: "Performance Analysis",
      prompt: "Analyze {{static_results}} for performance issues:\n- Inefficient algorithms (O(n²) or worse)\n- Memory leaks\n- Unnecessary re-renders\n- Network waterfalls",
      dependencies: ["static_results"],
      outputKey: "performance_issues"
    },
    {
      name: "Recommendations",
      prompt: "Generate specific, actionable recommendations based on {{static_results}} and {{performance_issues}}. Include code snippets.",
      dependencies: ["static_results", "performance_issues"]
    }
  ]
});
```

## 2. Prompt Flow Examples

### Conditional Flow: Adaptive Testing Strategy

```typescript
await promptFlowBuilder({
  flowName: "Adaptive Testing Strategy",
  description: "Selects appropriate testing approach based on code characteristics",
  variables: {
    coverage_target: "80%",
    complexity_threshold: "10"
  },
  nodes: [
    {
      id: "analyze_code",
      type: "prompt",
      name: "Analyze Codebase",
      description: "Assess code complexity and test coverage",
      config: {
        prompt: "Analyze the codebase and report:\n1. Cyclomatic complexity\n2. Current test coverage\n3. Test fragility score"
      }
    },
    {
      id: "check_complexity",
      type: "condition",
      name: "Complexity Gate",
      description: "Determine if code is complex enough for thorough testing",
      config: {
        expression: "complexity > 10"
      }
    },
    {
      id: "unit_tests",
      type: "prompt",
      name: "Generate Unit Tests",
      config: {
        prompt: "Generate comprehensive unit tests with edge cases, mocking, and assertions"
      }
    },
    {
      id: "integration_tests",
      type: "prompt",
      name: "Generate Integration Tests",
      config: {
        prompt: "Generate integration tests focusing on component interactions and data flow"
      }
    },
    {
      id: "simple_tests",
      type: "prompt",
      name: "Generate Basic Tests",
      config: {
        prompt: "Generate basic smoke tests for happy path scenarios"
      }
    },
    {
      id: "merge_results",
      type: "merge",
      name: "Combine Test Suites",
      config: {}
    }
  ],
  edges: [
    { from: "analyze_code", to: "check_complexity" },
    { from: "check_complexity", to: "unit_tests", condition: "true", label: "Complex code" },
    { from: "check_complexity", to: "simple_tests", condition: "false", label: "Simple code" },
    { from: "unit_tests", to: "integration_tests" },
    { from: "integration_tests", to: "merge_results" },
    { from: "simple_tests", to: "merge_results" }
  ],
  entryPoint: "analyze_code"
});
```

### Loop Flow: Iterative Refinement

```typescript
await promptFlowBuilder({
  flowName: "Iterative Code Optimization",
  description: "Repeatedly optimize code until performance targets are met",
  nodes: [
    {
      id: "initial_profile",
      type: "prompt",
      name: "Profile Code",
      config: {
        prompt: "Profile the code and identify performance bottlenecks"
      }
    },
    {
      id: "optimize",
      type: "prompt",
      name: "Apply Optimizations",
      config: {
        prompt: "Apply the most impactful optimization from the profile results"
      }
    },
    {
      id: "measure",
      type: "prompt",
      name: "Measure Improvement",
      config: {
        prompt: "Measure performance improvement and calculate % gain"
      }
    },
    {
      id: "check_target",
      type: "condition",
      name: "Target Met?",
      config: {
        expression: "performance_gain >= target"
      }
    },
    {
      id: "iteration_loop",
      type: "loop",
      name: "Optimization Loop",
      description: "Repeat optimization until target met or max iterations",
      config: {
        iterations: 5,
        condition: "performance_gain < target"
      }
    }
  ],
  edges: [
    { from: "initial_profile", to: "iteration_loop" },
    { from: "iteration_loop", to: "optimize" },
    { from: "optimize", to: "measure" },
    { from: "measure", to: "check_target" },
    { from: "check_target", to: "iteration_loop", condition: "false", label: "Continue" }
  ]
});
```

### Parallel Flow: Multi-Aspect Analysis

```typescript
await promptFlowBuilder({
  flowName: "Comprehensive Code Analysis",
  description: "Parallel analysis of security, performance, and maintainability",
  nodes: [
    {
      id: "parse_code",
      type: "prompt",
      name: "Parse Codebase",
      config: {
        prompt: "Parse the codebase and extract AST, dependencies, and structure"
      }
    },
    {
      id: "parallel_analysis",
      type: "parallel",
      name: "Run Parallel Analyses",
      config: {}
    },
    {
      id: "security_check",
      type: "prompt",
      name: "Security Analysis",
      config: {
        prompt: "Analyze code for security vulnerabilities"
      }
    },
    {
      id: "performance_check",
      type: "prompt",
      name: "Performance Analysis",
      config: {
        prompt: "Analyze code for performance issues"
      }
    },
    {
      id: "maintainability_check",
      type: "prompt",
      name: "Maintainability Analysis",
      config: {
        prompt: "Analyze code complexity, readability, and maintainability"
      }
    },
    {
      id: "merge_reports",
      type: "merge",
      name: "Consolidate Reports",
      config: {}
    },
    {
      id: "final_report",
      type: "transform",
      name: "Generate Final Report",
      config: {
        transform: "Combine all analyses into executive summary with priorities"
      }
    }
  ],
  edges: [
    { from: "parse_code", to: "parallel_analysis" },
    { from: "parallel_analysis", to: "security_check" },
    { from: "parallel_analysis", to: "performance_check" },
    { from: "parallel_analysis", to: "maintainability_check" },
    { from: "security_check", to: "merge_reports" },
    { from: "performance_check", to: "merge_reports" },
    { from: "maintainability_check", to: "merge_reports" },
    { from: "merge_reports", to: "final_report" }
  ]
});
```

## 3. Integration with Existing Tools

### Combined Workflow: Hierarchical + Chaining

```typescript
// Step 1: Select appropriate hierarchy level
const levelResult = await hierarchyLevelSelector({
  taskDescription: "Implement OAuth2 authentication with JWT tokens",
  agentCapability: "intermediate",
  taskComplexity: "complex"
});

// Step 2: Build hierarchical prompt
const basePrompt = await hierarchicalPromptBuilder({
  context: levelResult.context,
  goal: levelResult.goal,
  requirements: levelResult.requirements,
  techniques: ["chain-of-thought", "prompt-chaining"]
});

// Step 3: Create implementation chain
const implChain = await promptChainingBuilder({
  chainName: "OAuth2 Implementation Chain",
  context: basePrompt.content[0].text,
  steps: [
    {
      name: "Design Phase",
      prompt: "Design the OAuth2 flow, token structure, and security measures",
      outputKey: "design"
    },
    {
      name: "Security Review",
      prompt: "Review {{design}} for security issues, especially token storage and CSRF protection",
      dependencies: ["design"],
      outputKey: "security_feedback"
    },
    {
      name: "Implementation",
      prompt: "Implement the OAuth2 system incorporating {{security_feedback}}",
      dependencies: ["design", "security_feedback"],
      outputKey: "code"
    },
    {
      name: "Testing",
      prompt: "Generate comprehensive tests for {{code}} covering auth flows and edge cases",
      dependencies: ["code"]
    }
  ]
});
```

## Best Practices

### 1. Chain Design
- **Keep steps focused**: Each step should have a single, clear responsibility
- **Use explicit output keys**: Make data flow transparent
- **Handle errors gracefully**: Choose appropriate error strategies per step
- **Validate dependencies**: Ensure dependency chains are acyclic

### 2. Flow Design
- **Start simple**: Begin with linear flows, add complexity as needed
- **Document conditions**: Make branching logic explicit and testable
- **Limit loop iterations**: Always set max iterations to prevent infinite loops
- **Visualize first**: Use the Mermaid output to communicate flow structure

### 3. Performance
- **Parallel where possible**: Use parallel nodes for independent analyses
- **Cache intermediate results**: Store outputs for reuse in subsequent steps
- **Monitor execution time**: Track bottlenecks in long chains
- **Optimize prompts**: Keep individual prompts concise and focused

### 4. Debugging
- **Enable visualization**: Always generate Mermaid diagrams during development
- **Log intermediate outputs**: Track data flow through the chain/flow
- **Test edge cases**: Validate error handling and edge conditions
- **Use execution guides**: Follow the generated execution instructions

## Resources

- [Prompt Chaining Patterns](https://www.promptingguide.ai/techniques/prompt_chaining)
- [Flow-Based Programming](https://en.wikipedia.org/wiki/Flow-based_programming)
- [Claude Flow GitHub](https://github.com/ruvnet/claude-flow)
- [Advanced Prompting Techniques](https://www.anthropic.com/research/prompting-patterns)
