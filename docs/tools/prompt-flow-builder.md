<!-- HEADER:START -->
![Header](../.frames-static/09-header.svg)
<!-- HEADER:END -->

# Prompt Flow Builder

> **Declarative prompt flows with branching**

[![MCP AI Agent Guidelines](https://img.shields.io/badge/MCP-AI_Agent_Guidelines-1a7f37?style=flat-square&logo=github)](../../README.md)
[![Prompt Builders](https://img.shields.io/badge/Category-Prompt_Builders-purple?style=flat-square)](./README.md#prompt-builders)
[![Documentation](https://img.shields.io/badge/📚-Docs-blue?style=flat-square)](../README.md)

**Complexity**: ⭐⭐⭐ Advanced | **Category**: Prompt Builders | **Time to Learn**: 1-2 hours

---

## Overview

The `prompt-flow-builder` conditional branching, loops, and parallel execution.

### Key Capabilities

- Conditional branching logic
- Loop constructs
- Parallel execution nodes
- Mermaid flow visualization

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
  "tool": "prompt-flow-builder",
  "flowName": "your-flow-name-here",
  "nodes": "your-nodes-here",
  "description": "your-description",
  "edges": ["item1", "item2"],
  "entryPoint": "your-entry-point"
}
```

**Output**: Structured prompt builders output with:

- Conditional branching logic
- Loop constructs
- Parallel execution nodes

---

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `flowName` | string | ✅ Yes | - | Name identifier for the prompt flow |
| `nodes` | array | ✅ Yes | - | Array of flow node definitions with conditions and actions |
| `description` | string | No | - | Description of the diagram to generate |
| `edges` | array | No | - | Connections between nodes defining flow transitions |
| `entryPoint` | string | No | - | Starting node for flow execution |
| `variables` | object | No | - | Flow-level variables for state management |
| `outputFormat` | enum | No | - | Desired output format specification |

---

## What You Get

The tool returns a structured prompt builders output with:

1. **Conditional** - Conditional branching logic
2. **Loop** - Loop constructs
3. **Parallel** - Parallel execution nodes
4. **Mermaid** - Mermaid flow visualization

### Output Structure

```markdown
## Prompt Flow Builder Output

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
  "tool": "prompt-flow-builder",
  "flowName": "Example flowName value for code review workflow",
  "nodes": "Example nodes value for code review workflow",
  "description": "example-value",
  "edges": ["example1", "example2"]
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

- **[prompt-chaining-builder](./prompt-chaining-builder.md)** - Build multi-step prompt chains
- **[mermaid-diagram-generator](./mermaid-diagram-generator.md)** - Generate Mermaid diagrams

---

## Workflow Integration

### With Other Tools

```mermaid
graph LR
  A[prompt-flow-builder] --> B[prompt-chaining-builder]
  B --> C[mermaid-diagram-generator]
  C --> D[Execute/Apply]
```

1. **prompt-flow-builder** - Declarative prompt flows with branching
2. **prompt-chaining-builder** - Build multi-step prompt chains
3. **mermaid-diagram-generator** - Generate Mermaid diagrams
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
