<!-- HEADER:START -->
![Header](../.frames-static/09-header.svg)
<!-- HEADER:END -->

# Model Compatibility Checker

> **Recommend AI models for tasks**

[![MCP AI Agent Guidelines](https://img.shields.io/badge/MCP-AI_Agent_Guidelines-1a7f37?style=flat-square&logo=github)](../../README.md)
[![Utilities](https://img.shields.io/badge/Category-Utilities-gray?style=flat-square)](./README.md#utilities)
[![Documentation](https://img.shields.io/badge/📚-Docs-blue?style=flat-square)](../README.md)

**Complexity**: ⭐ Simple | **Category**: Utilities | **Time to Learn**: 5-10 minutes

---

## Overview

The `model-compatibility-checker` best model for task, budget, context length requirements.

### Key Capabilities

- Task-based model recommendations
- Budget considerations
- Context length requirements
- Multimodal capability checks

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
  "tool": "model-compatibility-checker",
  "taskDescription": "your-task-description-here",
  "requirements": ["item1", "item2"],
  "budget": "your-budget",
  "language": "your-language"
}
```

**Output**: Structured utilities output with:

- Task-based model recommendations
- Budget considerations
- Context length requirements

---

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `taskDescription` | string | ✅ Yes | - | Description of the task for model selection |
| `requirements` | array | No | - | Detailed requirements and constraints as an array of strings |
| `budget` | string | No | - | Budget constraint: `low`, `medium`, or `high` |
| `language` | string | No | - | Programming language (e.g., `typescript`, `python`, `java`) |
| `includeCodeExamples` | boolean | No | `false` | Include code examples in output |

---

## What You Get

The tool returns a structured utilities output with:

1. **Task-based** - Task-based model recommendations
2. **Budget** - Budget considerations
3. **Context** - Context length requirements
4. **Multimodal** - Multimodal capability checks

### Output Structure

```markdown
## Model Compatibility Checker Output

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
  "tool": "model-compatibility-checker",
  "taskDescription": "Example taskDescription value for common use case",
  "requirements": ["example1", "example2"],
  "budget": "example-value"
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

_No directly related tools. Check the [Tools Overview](./README.md) for other options._

---

<details>
<summary><strong>📚 Related Documentation</strong></summary>

- [All Utilities Tools](./README.md#utilities)
- [AI Interaction Tips](../tips/AI_INTERACTION_TIPS.md)

</details>

<sub>**MCP AI Agent Guidelines** • Licensed under [MIT](../../LICENSE) • [Disclaimer](../../DISCLAIMER.md) • [Contributing](../../CONTRIBUTING.md)</sub>

---

## Related Documentation

- [All Utilities Tools](./README.md#utilities)
- [AI Interaction Tips](../tips/AI_INTERACTION_TIPS.md)

---

<!-- FOOTER:START -->
![Footer](../.frames-static/09-footer.svg)
<!-- FOOTER:END -->
