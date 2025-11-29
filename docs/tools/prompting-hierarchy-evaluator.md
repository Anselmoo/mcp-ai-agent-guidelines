<!-- HEADER:START -->
![Header](../.frames-static/09-header.svg)
<!-- HEADER:END -->

# Prompting Hierarchy Evaluator

> **Evaluate prompt quality**

[![MCP AI Agent Guidelines](https://img.shields.io/badge/MCP-AI_Agent_Guidelines-1a7f37?style=flat-square&logo=github)](../../README.md)
[![Utilities](https://img.shields.io/badge/Category-Utilities-gray?style=flat-square)](./README.md#utilities)
[![Documentation](https://img.shields.io/badge/📚-Docs-blue?style=flat-square)](../README.md)

**Complexity**: ⭐⭐ Moderate | **Category**: Utilities | **Time to Learn**: 15-30 minutes

---

## Overview

The `prompting-hierarchy-evaluator` numeric scoring (clarity, specificity, completeness, complexity).

### Key Capabilities

- Multi-dimensional scoring (clarity, specificity, completeness, cognitive complexity)
- Hierarchical taxonomy evaluation
- Improvement recommendations
- Reinforcement learning-inspired metrics

---

## When to Use

✅ **Good for:**

- AI model selection based on task requirements
- Validating practices against established guidelines
- Context window optimization
- Project onboarding and analysis

❌ **Not ideal for:**

- Complex business logic decisions
- Security-critical operations
- Production deployment automation

---

## Basic Usage

### Example 1: Basic Utilities Task

```json
{
  "tool": "prompting-hierarchy-evaluator",
  "promptText": "your-prompt-text-here",
  "targetLevel": "your-target-level",
  "context": "your-context",
  "includeRecommendations": true
}
```

**Output**: Structured utilities output with:

- Multi-dimensional scoring (clarity, specificity, completeness, cognitive complexity)
- Hierarchical taxonomy evaluation
- Improvement recommendations

---

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `promptText` | string | ✅ Yes | - | Prompt text to evaluate |
| `targetLevel` | string | No | - | Target hierarchy level for evaluation |
| `context` | string | No | - | Broad context or domain background for the task |
| `includeRecommendations` | boolean | No | `false` | Include Recommendations parameter |

---

## What You Get

The tool returns a structured utilities output with:

1. **Multi-dimensional** - Multi-dimensional scoring (clarity, specificity, completeness, cognitive complexity)
2. **Hierarchical** - Hierarchical taxonomy evaluation
3. **Improvement** - Improvement recommendations
4. **Reinforcement** - Reinforcement learning-inspired metrics

### Output Structure

```markdown
## Prompting Hierarchy Evaluator Output

### Summary
[High-level summary of analysis/output]

### Details
[Detailed content based on your inputs]

### Recommendations
[Actionable next steps]

### References (if enabled)
[Links to external resources]
```

---

## Real-World Examples

### Example 1: Common Use Case

```json
{
  "tool": "prompting-hierarchy-evaluator",
  "promptText": "Example promptText value for common use case",
  "targetLevel": "example-value",
  "context": "example-value"
}
```

**Generated Output Excerpt**:

```markdown
## Common Use Case Results

### Summary
Analysis complete with actionable insights...

### Key Findings
1. [Finding 1 based on utilities analysis]
2. [Finding 2 with specific recommendations]
3. [Finding 3 with priority indicators]

### Next Steps
- Implement recommended changes
- Review and validate results
- Integrate into workflow
```

---

## Tips & Tricks

### 💡 Best Practices

1. **Match Tool to Task** - Choose the right utility for the job
2. **Provide Complete Context** - Utilities need information to help
3. **Review Recommendations** - Don't blindly accept suggestions
4. **Integrate into Workflow** - Make utilities part of your process

### 🚫 Common Mistakes

- ❌ Using wrong tool → ✅ Check tool descriptions carefully
- ❌ Incomplete input → ✅ Provide all relevant context
- ❌ Ignoring output → ✅ Act on recommendations
- ❌ One-off usage → ✅ Build into regular workflow

### ⚡ Pro Tips

- Combine utilities for more comprehensive analysis
- Use validation tools before committing changes
- Cache results for frequently used configurations

---

## Related Tools

- **[hierarchy-level-selector](./hierarchy-level-selector.md)** - Select prompting hierarchy level
- **[hierarchical-prompt-builder](./hierarchical-prompt-builder.md)** - Build structured prompts with clear hierarchies

---

## Workflow Integration

### With Other Tools

```mermaid
graph LR
  A[prompting-hierarchy-evaluator] --> B[hierarchy-level-selector]
  B --> C[hierarchical-prompt-builder]
  C --> D[Execute/Apply]
```

1. **prompting-hierarchy-evaluator** - Evaluate prompt quality
2. **hierarchy-level-selector** - Select prompting hierarchy level
3. **hierarchical-prompt-builder** - Build structured prompts with clear hierarchies
4. Execute combined output with your AI model or apply changes

---

<details>
<summary><strong>📚 Related Documentation</strong></summary>

- [All Utilities Tools](./README.md#utilities)
- [AI Interaction Tips](../tips/ai-interaction-tips.md)

</details>

<sub>**MCP AI Agent Guidelines** • Licensed under [MIT](../../LICENSE) • [Disclaimer](../../DISCLAIMER.md) • [Contributing](../../CONTRIBUTING.md)</sub>

---

## Related Documentation

- [All Utilities Tools](./README.md#utilities)
- [AI Interaction Tips](../tips/ai-interaction-tips.md)

---

<!-- FOOTER:START -->
![Footer](../.frames-static/09-footer.svg)
<!-- FOOTER:END -->
