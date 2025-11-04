<!-- HEADER:START -->
![Header](./.frames-static/09-header.svg)
<!-- HEADER:END -->

# AI Interaction Tips

> Comprehensive guide for asking targeted questions to better utilize specialized tools

## Overview

This guide provides best practices for interacting with AI agents and utilizing the specialized tools in this MCP server effectively.

## Asking Targeted Questions

### Be Specific

Instead of broad questions, focus on specific aspects:

- ❌ "How do I improve my code?"
- ✅ "How can I improve the test coverage for my authentication module?"

### Provide Context

Include relevant details about your environment and constraints:

- Framework/language you're using
- Current challenges or pain points
- Performance or quality requirements
- Team size and skill level

### Use Tool-Specific Queries

Different tools are optimized for different tasks. Direct your questions appropriately:

- **Code Quality**: Use `clean-code-scorer` or `code-hygiene-analyzer`
- **Architecture**: Use `architecture-design-prompt-builder` or `design-assistant`
- **Security**: Use `security-hardening-prompt-builder`
- **Planning**: Use `sprint-timeline-calculator` or `gap-frameworks-analyzers`

## Working with Prompt Builders

### Hierarchical Prompting

Choose the appropriate prompt level based on task complexity:

- **Independent**: For well-defined, autonomous tasks
- **Indirect**: When you need hints and guidance
- **Direct**: For step-by-step instructions
- **Modeling**: When you need examples to follow
- **Scaffolding**: For partially completed templates
- **Full-Physical**: For maximum guidance

See [Prompting Hierarchy](./PROMPTING_HIERARCHY.md) for detailed guidance.

### Flow-Based Prompting

For complex multi-step workflows:

1. Break down tasks into logical steps
2. Define dependencies between steps
3. Specify error handling strategies
4. Use prompt chaining for sequential operations

See [Flow Prompting Examples](./FLOW_PROMPTING_EXAMPLES.md) for patterns.

## Leveraging Analysis Tools

### Code Analysis

When requesting code analysis:

- Provide the code snippet or file path
- Specify the focus area (security, performance, maintainability)
- Define quality thresholds if applicable
- Request actionable recommendations

### Strategy & Planning

When using strategy frameworks:

- Clearly define current state and goals
- Identify key stakeholders
- List known constraints and objectives
- Specify which frameworks are most relevant (SWOT, VRIO, etc.)

## Best Practices

### 1. Iterate and Refine

Start with broad analysis, then drill down:

```
1. Get overview with semantic-code-analyzer
2. Identify problem areas with clean-code-scorer
3. Deep dive with specific tools (security, coverage, etc.)
```

### 2. Combine Tools

Use multiple tools together for comprehensive analysis:

- Code quality + Coverage enhancer
- Architecture design + Security hardening
- Strategy frameworks + Gap analysis

### 3. Validate Results

- Review generated recommendations critically
- Test suggested changes in a safe environment
- Verify alignment with your specific context

### 4. Provide Feedback

Help the AI understand what works:

- "That's exactly what I needed"
- "I need more detail on X"
- "Focus less on Y, more on Z"

## Common Scenarios

### Scenario 1: Improving Code Quality

```
1. Run clean-code-scorer for baseline
2. Use code-hygiene-analyzer for specific issues
3. Apply iterative-coverage-enhancer for test gaps
4. Validate with semantic-code-analyzer
```

### Scenario 2: Designing New Features

```
1. Start design-assistant session
2. Define requirements and constraints
3. Generate architecture with architecture-design-prompt-builder
4. Review security with security-hardening-prompt-builder
5. Generate artifacts (ADRs, specs, roadmaps)
```

### Scenario 3: Planning Sprints

```
1. Use gap-frameworks-analyzers for capability assessment
2. Define tasks with dependencies
3. Calculate timeline with sprint-timeline-calculator
4. Validate with strategy-frameworks-builder
```

## Tips for Better Results

### Do's

- ✅ Provide complete context upfront
- ✅ Use precise terminology
- ✅ Specify output format preferences
- ✅ Include relevant constraints
- ✅ Ask follow-up questions for clarification

### Don'ts

- ❌ Ask vague or overly broad questions
- ❌ Omit critical context
- ❌ Mix unrelated concerns in one query
- ❌ Expect the AI to guess your requirements
- ❌ Skip validation of generated outputs

## Related Resources

- [Prompting Hierarchy Guide](./PROMPTING_HIERARCHY.md) - Understanding prompt levels
- [Flow Prompting Examples](./FLOW_PROMPTING_EXAMPLES.md) - Multi-step workflows
- [Context-Aware Guidance](./CONTEXT_AWARE_GUIDANCE.md) - Adaptive recommendations
- [Tools Reference](./TOOLS_REFERENCE.md) - Complete tool documentation

## Conclusion

Effective AI interaction is about clarity, context, and appropriate tool selection. By following these tips, you'll get more accurate, actionable, and relevant results from this MCP server.
---

<!-- FOOTER:START -->
![Footer](./.frames-static/09-footer.svg)
<!-- FOOTER:END -->
