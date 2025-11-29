<!-- HEADER:START -->
![Header](../.frames-static/09-header.svg)
<!-- HEADER:END -->

# Mode Switcher

> **Switch agent operation modes**

[![MCP AI Agent Guidelines](https://img.shields.io/badge/MCP-AI_Agent_Guidelines-1a7f37?style=flat-square&logo=github)](../../README.md)
[![Utilities](https://img.shields.io/badge/Category-Utilities-gray?style=flat-square)](./README.md#utilities)
[![Documentation](https://img.shields.io/badge/📚-Docs-blue?style=flat-square)](../README.md)

**Complexity**: ⭐ Simple | **Category**: Utilities | **Time to Learn**: 5-10 minutes

---

## Overview

The `mode-switcher` planning, editing, analysis, debugging, refactoring, documentation.

### Key Capabilities

- Mode switching (planning, editing, analysis, interactive, debugging)
- Context-aware tool sets
- Prompting strategy adjustment
- Workflow optimization

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
  "tool": "mode-switcher",
  "targetMode": "your-target-mode-here",
  "currentMode": "your-current-mode",
  "context": "your-context",
  "reason": "your-reason"
}
```

**Output**: Structured utilities output with:

- Mode switching (planning, editing, analysis, interactive, debugging)
- Context-aware tool sets
- Prompting strategy adjustment

---

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `targetMode` | enum | ✅ Yes | - | Target mode: `planning`, `editing`, `analysis`, `debugging`, `refactoring`, `documentation` |
| `currentMode` | string | No | - | Current agent operation mode |
| `context` | string | No | - | Broad context or domain background for the task |
| `reason` | string | No | - | Reason for the operation |

---

## What You Get

The tool returns a structured utilities output with:

1. **Mode** - Mode switching (planning, editing, analysis, interactive, debugging)
2. **Context-aware** - Context-aware tool sets
3. **Prompting** - Prompting strategy adjustment
4. **Workflow** - Workflow optimization

### Output Structure

```markdown
## Mode Switcher Output

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
  "tool": "mode-switcher",
  "targetMode": "Example targetMode value for common use case",
  "currentMode": "example-value",
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
