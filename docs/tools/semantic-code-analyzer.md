<!-- HEADER:START -->
![Header](../.frames-static/09-header.svg)
<!-- HEADER:END -->

# Semantic Code Analyzer

> **Code Analysis Tool** • **Complexity: Moderate**

[![MCP AI Agent Guidelines](https://img.shields.io/badge/MCP-AI_Agent_Guidelines-1a7f37?style=flat-square&logo=github)](../../README.md)
[![Code Analysis](https://img.shields.io/badge/Category-Code_Analysis-orange?style=flat-square)](./README.md#code-analysis)
[![Documentation](https://img.shields.io/badge/📚-Docs-blue?style=flat-square)](../README.md)

---

# semantic-code-analyzer

> **Semantic code analysis**

**Complexity**: ⭐⭐ Moderate | **Category**: Code Analysis | **Time to Learn**: 15-30 minutes

---

## Overview

The `semantic-code-analyzer` symbols, structure, dependencies, patterns.

### Key Capabilities

- Symbol extraction and analysis
- Code structure mapping
- Dependency graph generation
- Pattern detection

---

## When to Use

✅ **Good for:**

- Identifying code quality issues and technical debt
- Analyzing test coverage gaps
- Security vulnerability scanning
- Dependency health checks

❌ **Not ideal for:**

- Real-time code execution
- Replacing comprehensive security audits
- Performance benchmarking

---

## Basic Usage

### Example 1: Basic Code Analysis Task

```json
{
  "tool": "semantic-code-analyzer",
  "codeContent": "your-code-content-here",
  "analysisType": "your-analysis-type",
  "language": "your-language",
  "includeMetadata": true
}
```

**Output**: Structured code analysis output with:

- Symbol extraction and analysis
- Code structure mapping
- Dependency graph generation

---

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `codeContent` | string | ✅ Yes | - | Source code content to analyze |
| `analysisType` | enum | No | - | Analysis Type parameter |
| `language` | string | No | - | Programming language (e.g., `typescript`, `python`, `java`) |
| `includeMetadata` | boolean | No | `false` | Include metadata section with timestamps and source info |

---

## What You Get

The tool returns a structured code analysis output with:

1. **Symbol** - Symbol extraction and analysis
2. **Code** - Code structure mapping
3. **Dependency** - Dependency graph generation
4. **Pattern** - Pattern detection

### Output Structure

```markdown
## Semantic Code Analyzer Output

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

### Example 1: Security Analysis

```json
{
  "tool": "semantic-code-analyzer",
  "codeContent": "Example codeContent value for security analysis",
  "analysisType": "example-value",
  "language": "example-value"
}
```

**Generated Output Excerpt**:

```markdown
## Security Analysis Results

### Summary
Analysis complete with actionable insights...

### Key Findings
1. [Finding 1 based on code analysis analysis]
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

1. **Provide Complete Code** - Partial snippets may miss context
2. **Specify Language and Framework** - Enables targeted analysis
3. **Review All Severity Levels** - Not just critical issues
4. **Integrate with CI/CD** - Automate quality checks

### 🚫 Common Mistakes

- ❌ Ignoring low severity issues → ✅ They accumulate as tech debt
- ❌ Skipping context → ✅ Always specify framework and patterns
- ❌ One-time analysis → ✅ Regular monitoring catches regressions
- ❌ Trusting blindly → ✅ Validate recommendations with tests

### ⚡ Pro Tips

- Combine with security hardening for comprehensive reviews
- Use coverage metrics to prioritize testing efforts
- Export results to tracking systems for follow-up

---

## Related Tools

- **[code-hygiene-analyzer](./code-hygiene-analyzer.md)** - Outdated patterns and unused dependencies

---

## Workflow Integration

### With Other Tools

```mermaid
graph LR
  A[semantic-code-analyzer] --> B[code-hygiene-analyzer]

  B --> C[Execute/Apply]
```

1. **semantic-code-analyzer** - Semantic code analysis
2. **code-hygiene-analyzer** - Outdated patterns and unused dependencies
3. Execute combined output with your AI model or apply changes

---

<details>
<summary><strong>📚 Related Documentation</strong></summary>

- [All Code Analysis Tools](./README.md#code-analysis)
- [Clean Code Initiative](../tips/CLEAN_CODE_INITIATIVE.md)
- [Code Quality Improvements](../tips/CODE_QUALITY_IMPROVEMENTS.md)
- [AI Interaction Tips](../tips/AI_INTERACTION_TIPS.md)

</details>

<sub>**MCP AI Agent Guidelines** • Licensed under [MIT](../../LICENSE) • [Disclaimer](../../DISCLAIMER.md) • [Contributing](../../CONTRIBUTING.md)</sub>

---

## Related Documentation

- [All Code Analysis Tools](./README.md#code-analysis)
- [Clean Code Initiative](../tips/CLEAN_CODE_INITIATIVE.md)
- [Code Quality Improvements](../tips/CODE_QUALITY_IMPROVEMENTS.md)
- [AI Interaction Tips](../tips/AI_INTERACTION_TIPS.md)

---

<!-- FOOTER:START -->
![Footer](../.frames-static/09-footer.svg)
<!-- FOOTER:END -->
