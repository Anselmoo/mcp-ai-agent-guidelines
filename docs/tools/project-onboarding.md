<!-- HEADER:START -->
![Header](../.frames-static/09-header.svg)
<!-- HEADER:END -->

# Project Onboarding

> **Utilities Tool** • **Complexity: Moderate**

[![MCP AI Agent Guidelines](https://img.shields.io/badge/MCP-AI_Agent_Guidelines-1a7f37?style=flat-square&logo=github)](../../README.md)
[![Utilities](https://img.shields.io/badge/Category-Utilities-gray?style=flat-square)](./README.md#utilities)
[![Documentation](https://img.shields.io/badge/📚-Docs-blue?style=flat-square)](../README.md)

---

# project-onboarding

> **Comprehensive project onboarding**

**Complexity**: ⭐⭐ Moderate | **Category**: Utilities | **Time to Learn**: 15-30 minutes

---

## Overview

The `project-onboarding` structure analysis, dependencies, memory generation.

### Key Capabilities

- Project structure scanning
- Dependency detection
- Technology stack identification
- Memory generation for quick context

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
  "tool": "project-onboarding",
  "projectPath": "your-project-path-here",
  "projectName": "your-project-name",
  "projectType": "your-project-type",
  "analysisDepth": "your-analysis-depth"
}
```

**Output**: Structured utilities output with:

- Project structure scanning
- Dependency detection
- Technology stack identification

---

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `projectPath` | string | ✅ Yes | - | Path to the project root directory |
| `projectName` | string | No | - | Project or initiative name |
| `projectType` | string | No | - | Type of project for onboarding |
| `analysisDepth` | string | No | - | Depth of analysis: `shallow`, `standard`, or `deep` |
| `includeMemories` | boolean | No | `false` | Generate memory entries for quick context |

---

## What You Get

The tool returns a structured utilities output with:

1. **Project** - Project structure scanning
2. **Dependency** - Dependency detection
3. **Technology** - Technology stack identification
4. **Memory** - Memory generation for quick context

### Output Structure

```markdown
## Project Onboarding Output

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
  "tool": "project-onboarding",
  "projectPath": "Example projectPath value for common use case",
  "projectName": "example-value",
  "projectType": "example-value"
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

- **[sprint-timeline-calculator](./sprint-timeline-calculator.md)** - Sprint timelines and development cycles
- **[semantic-code-analyzer](./semantic-code-analyzer.md)** - Semantic code analysis

---

## Workflow Integration

### With Other Tools

```mermaid
graph LR
  A[project-onboarding] --> B[sprint-timeline-calculator]
  B --> C[semantic-code-analyzer]
  C --> D[Execute/Apply]
```

1. **project-onboarding** - Comprehensive project onboarding
2. **sprint-timeline-calculator** - Sprint timelines and development cycles
3. **semantic-code-analyzer** - Semantic code analysis
4. Execute combined output with your AI model or apply changes

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
