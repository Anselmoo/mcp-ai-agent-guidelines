<!-- HEADER:START -->
![Header](../.frames-static/09-header.svg)
<!-- HEADER:END -->

# Security Hardening Prompt Builder

> **Security analysis and hardening prompts**

[![MCP AI Agent Guidelines](https://img.shields.io/badge/MCP-AI_Agent_Guidelines-1a7f37?style=flat-square&logo=github)](../../README.md)
[![Prompt Builders](https://img.shields.io/badge/Category-Prompt_Builders-purple?style=flat-square)](./README.md#prompt-builders)
[![Documentation](https://img.shields.io/badge/📚-Docs-blue?style=flat-square)](../README.md)

**Complexity**: ⭐⭐⭐ Advanced | **Category**: Prompt Builders | **Time to Learn**: 1-2 hours

---

## Overview

The `security-hardening-prompt-builder` oWASP Top 10, compliance checks, threat modeling.

### Key Capabilities

- OWASP Top 10 coverage
- Compliance standards (NIST, ISO 27001, SOC 2, GDPR, HIPAA, PCI-DSS)
- Vulnerability analysis and threat modeling
- Secure code examples and test cases

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
  "tool": "security-hardening-prompt-builder",
  "codeContext": "your-code-context-here",
  "securityFocus": "your-security-focus",
  "analysisScope": ["item1", "item2"],
  "complianceStandards": ["item1", "item2"]
}
```

**Output**: Structured prompt builders output with:

- OWASP Top 10 coverage
- Compliance standards (NIST, ISO 27001, SOC 2, GDPR, HIPAA, PCI-DSS)
- Vulnerability analysis and threat modeling

---

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `codeContext` | string | ✅ Yes | - | Code snippet or description for security analysis |
| `securityFocus` | enum | No | - | Analysis focus: `vulnerability-analysis`, `security-hardening`, `compliance-check`, `threat-modeling`, or `penetration-testing` |
| `analysisScope` | array | No | - | Security areas to analyze (e.g., `input-validation`, `authentication`) |
| `complianceStandards` | array | No | - | Compliance frameworks to check (e.g., `OWASP-Top-10`, `PCI-DSS`, `HIPAA`) |
| `riskTolerance` | enum | No | - | Risk acceptance level: `low`, `medium`, or `high` |
| `includeMitigations` | boolean | No | `false` | Include specific mitigation recommendations |

---

## What You Get

The tool returns a structured prompt builders output with:

1. **OWASP** - OWASP Top 10 coverage
2. **Compliance** - Compliance standards (NIST, ISO 27001, SOC 2, GDPR, HIPAA, PCI-DSS)
3. **Vulnerability** - Vulnerability analysis and threat modeling
4. **Secure** - Secure code examples and test cases

### Output Structure

```markdown
## Security Hardening Prompt Builder Output

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
  "tool": "security-hardening-prompt-builder",
  "codeContext": "Example codeContext value for code review workflow",
  "securityFocus": "example-value",
  "analysisScope": ["example1", "example2"]
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

- **[code-analysis-prompt-builder](./code-analysis-prompt-builder.md)** - Code analysis prompts
- **[clean-code-scorer](./clean-code-scorer.md)** - Calculate Clean Code score (0-100)

---

## Workflow Integration

### With Other Tools

```mermaid
graph LR
  A[security-hardening-prompt-builder] --> B[code-analysis-prompt-builder]
  B --> C[clean-code-scorer]
  C --> D[Execute/Apply]
```

1. **security-hardening-prompt-builder** - Security analysis and hardening prompts
2. **code-analysis-prompt-builder** - Code analysis prompts
3. **clean-code-scorer** - Calculate Clean Code score (0-100)
4. Execute combined output with your AI model or apply changes

---

<details>
<summary><strong>📚 Related Documentation</strong></summary>

- [All Prompt Builders Tools](./README.md#prompt-builders)
- [Prompting Hierarchy Guide](../tips/PROMPTING_HIERARCHY.md)
- [Flow Prompting Examples](../tips/FLOW_PROMPTING_EXAMPLES.md)
- [AI Interaction Tips](../tips/AI_INTERACTION_TIPS.md)

</details>

<sub>**MCP AI Agent Guidelines** • Licensed under [MIT](../../LICENSE) • [Disclaimer](../../DISCLAIMER.md) • [Contributing](../../CONTRIBUTING.md)</sub>

---

## Related Documentation

- [All Prompt Builders Tools](./README.md#prompt-builders)
- [Prompting Hierarchy Guide](../tips/PROMPTING_HIERARCHY.md)
- [Flow Prompting Examples](../tips/FLOW_PROMPTING_EXAMPLES.md)
- [AI Interaction Tips](../tips/AI_INTERACTION_TIPS.md)

---

<!-- FOOTER:START -->
![Footer](../.frames-static/09-footer.svg)
<!-- FOOTER:END -->
