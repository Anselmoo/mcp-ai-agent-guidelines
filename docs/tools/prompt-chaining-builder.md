<!-- HEADER:START -->
![Header](../.frames-static/09-header.svg)
<!-- HEADER:END -->

# Prompt Chaining Builder

> **Build multi-step prompt chains**

[![MCP AI Agent Guidelines](https://img.shields.io/badge/MCP-AI_Agent_Guidelines-1a7f37?style=flat-square&logo=github)](../../README.md)
[![Prompt Builders](https://img.shields.io/badge/Category-Prompt_Builders-purple?style=flat-square)](./README.md#prompt-builders)
[![Documentation](https://img.shields.io/badge/📚-Docs-blue?style=flat-square)](../README.md)

**Complexity**: ⭐⭐ Moderate | **Category**: Prompt Builders | **Time to Learn**: 15-30 minutes

---

## Overview

The `prompt-chaining-builder` sequential workflows with output passing and error handling.

### Key Capabilities

- Multi-step sequences with dependencies
- Output passing between steps
- Error handling (skip, retry, abort)
- Global variables and context

---

## When to Use

✅ **Good for:**

- Complex tasks requiring detailed instructions
- Multi-step workflows with dependencies
- Standardizing prompt patterns across teams
- Generating consistent AI interactions

❌ **Not ideal for:**

- Simple, single-line questions
- Quick clarifications without context
- Tasks with obvious, minimal requirements

---

## Basic Usage

### Example 1: Basic Prompt Builders Task

```json
{
  "tool": "prompt-chaining-builder",
  "chainName": "your-chain-name-here",
  "steps": "your-steps-here",
  "context": "your-context",
  "description": "your-description",
  "executionStrategy": "your-execution-strategy"
}
```

**Output**: Structured prompt builders output with:

- Multi-step sequences with dependencies
- Output passing between steps
- Error handling (skip, retry, abort)

---

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `chainName` | string | ✅ Yes | - | Name identifier for the prompt chain |
| `steps` | array | ✅ Yes | - | Array of chain step objects with name, prompt, and dependencies |
| `context` | string | No | - | Broad context or domain background for the task |
| `description` | string | No | - | Description of the diagram to generate |
| `executionStrategy` | enum | No | - | Execution mode: `sequential` or `parallel-where-possible` |
| `globalVariables` | object | No | - | Variables accessible to all steps in the chain |
| `includeVisualization` | boolean | No | `false` | Generate mermaid diagram visualization |

---

## What You Get

The tool returns a structured prompt builders output with:

1. **Multi-step** - Multi-step sequences with dependencies
2. **Output** - Output passing between steps
3. **Error** - Error handling (skip, retry, abort)
4. **Global** - Global variables and context

### Output Structure

```markdown
## Prompt Chaining Builder Output

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

### Example 1: Code Review Workflow

```json
{
  "tool": "prompt-chaining-builder",
  "chainName": "Example chainName value for code review workflow",
  "steps": "Example steps value for code review workflow",
  "context": "example-value",
  "description": "example-value"
}
```

**Generated Output Excerpt**:

```markdown
## Code Review Workflow Results

### Summary
Analysis complete with actionable insights...

### Key Findings
1. [Finding 1 based on prompt builders analysis]
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

1. **Be Specific in Goals** - Vague goals lead to vague outputs
2. **Prioritize Requirements** - Use keywords like CRITICAL, HIGH, NICE-TO-HAVE
3. **Define Success Criteria** - How will you know when it's done?
4. **Match Style to Use Case** - XML for complex structures, Markdown for readability

### 🚫 Common Mistakes

- ❌ Vague context → ✅ Be specific about the domain and constraints
- ❌ Too many requirements → ✅ Focus on top 3-5 critical ones
- ❌ Mixing goals → ✅ One clear objective per prompt
- ❌ Ignoring audience → ✅ Tailor detail level to expertise

### ⚡ Pro Tips

- Combine with related tools for comprehensive workflows
- Use `autoSelectTechniques: true` for optimal technique selection
- Enable `includePitfalls: true` for complex tasks

---

## Related Tools

- **[prompt-flow-builder](./prompt-flow-builder.md)** - Declarative prompt flows with branching
- **[hierarchical-prompt-builder](./hierarchical-prompt-builder.md)** - Build structured prompts with clear hierarchies

---

## Workflow Integration

### With Other Tools

```mermaid
graph LR
  A[prompt-chaining-builder] --> B[prompt-flow-builder]
  B --> C[hierarchical-prompt-builder]
  C --> D[Execute/Apply]
```

1. **prompt-chaining-builder** - Build multi-step prompt chains
2. **prompt-flow-builder** - Declarative prompt flows with branching
3. **hierarchical-prompt-builder** - Build structured prompts with clear hierarchies
4. Execute combined output with your AI model or apply changes

---

<details>
<summary><strong>📚 Related Documentation</strong></summary>

- [All Prompt Builders Tools](./README.md#prompt-builders)
- [Prompting Hierarchy Guide](../tips/prompting-hierarchy.md)
- [Flow Prompting Examples](../tips/flow-prompting-examples.md)
- [AI Interaction Tips](../tips/ai-interaction-tips.md)

</details>

<sub>**MCP AI Agent Guidelines** • Licensed under [MIT](../../LICENSE) • [Disclaimer](../../DISCLAIMER.md) • [Contributing](../../CONTRIBUTING.md)</sub>

---

## Related Documentation

- [All Prompt Builders Tools](./README.md#prompt-builders)
- [Prompting Hierarchy Guide](../tips/prompting-hierarchy.md)
- [Flow Prompting Examples](../tips/flow-prompting-examples.md)
- [AI Interaction Tips](../tips/ai-interaction-tips.md)

---

<!-- FOOTER:START -->
![Footer](../.frames-static/09-footer.svg)
<!-- FOOTER:END -->
