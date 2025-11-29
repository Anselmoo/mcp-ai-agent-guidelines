<!-- HEADER:START -->
![Header](../.frames-static/09-header.svg)
<!-- HEADER:END -->

# Clean Code Scorer

> **Code Analysis Tool** • **Complexity: Moderate**

[![MCP AI Agent Guidelines](https://img.shields.io/badge/MCP-AI_Agent_Guidelines-1a7f37?style=flat-square&logo=github)](../../README.md)
[![Code Analysis](https://img.shields.io/badge/Category-Code_Analysis-orange?style=flat-square)](./README.md#code-analysis)
[![Documentation](https://img.shields.io/badge/📚-Docs-blue?style=flat-square)](../README.md)

---

# clean-code-scorer

> **Calculate Clean Code score (0-100)**

**Complexity**: ⭐⭐ Moderate | **Category**: Code Analysis | **Time to Learn**: 15-30 minutes

---

## Overview

The `clean-code-scorer` code hygiene, test coverage, TypeScript, linting, docs, security.

### Key Capabilities

- Comprehensive 0-100 score
- Multiple quality metrics (hygiene, coverage, linting)
- TypeScript type safety analysis
- Documentation completeness
- Security best practices

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
  "tool": "clean-code-scorer",
  "projectPath": "your-project-path",
  "codeContent": "your-code-content",
  "coverageMetrics": { "key": "value" }
}
```

**Output**: Structured code analysis output with:

- Comprehensive 0-100 score
- Multiple quality metrics (hygiene, coverage, linting)
- TypeScript type safety analysis

---

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|

| `projectPath` | string | No | - | Path to the project root directory |
| `codeContent` | string | No | - | Source code content to analyze |
| `coverageMetrics` | object | No | - | Current test coverage metrics object |
| `language` | string | No | - | Programming language (e.g., `typescript`, `python`, `java`) |
| `framework` | string | No | - | Framework or technology stack (e.g., `express`, `react`, `django`) |

---

## What You Get

The tool returns a structured code analysis output with:

1. **Comprehensive** - Comprehensive 0-100 score
2. **Multiple** - Multiple quality metrics (hygiene, coverage, linting)
3. **TypeScript** - TypeScript type safety analysis
4. **Documentation** - Documentation completeness
5. **Security** - Security best practices

### Output Structure

```markdown
## Clean Code Scorer Output

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
  "tool": "clean-code-scorer",
  "projectPath": "example-value",
  "codeContent": "example-value"
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
- **[iterative-coverage-enhancer](./iterative-coverage-enhancer.md)** - Analyze coverage gaps and suggest tests

---

## Workflow Integration

### With Other Tools

```mermaid
graph LR
  A[clean-code-scorer] --> B[code-hygiene-analyzer]
  B --> C[iterative-coverage-enhancer]
  C --> D[Execute/Apply]
```

1. **clean-code-scorer** - Calculate Clean Code score (0-100)
2. **code-hygiene-analyzer** - Outdated patterns and unused dependencies
3. **iterative-coverage-enhancer** - Analyze coverage gaps and suggest tests
4. Execute combined output with your AI model or apply changes

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
