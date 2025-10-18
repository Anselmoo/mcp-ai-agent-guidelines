---
mode: 'agent'
model: GPT-4.1
tools: ['githubRepo', 'codebase', 'editFiles']
description: 'Template to run consistent, security-first code hygiene reviews across languages'
---
## 🧩 Domain-Neutral Prompt Template

### Metadata
- Updated: 2025-10-17
- Source tool: mcp_ai-agent-guid_domain-neutral-prompt-builder
- Input file: /home/runner/work/mcp-ai-agent-guidelines/mcp-ai-agent-guidelines/demos/demo-code-analysis.py
- Suggested filename: domain-neutral-code-hygiene-review-prompt.prompt.md

# Domain-Neutral Code Hygiene Review Prompt

Template to run consistent, security-first code hygiene reviews across languages

## Objectives
- Identify hygiene, security, maintainability issues
- Prioritize risks (High/Med/Low)
- Output a crisp, language-agnostic checklist

## Scope and Context
- Background: Analyze arbitrary code snippets; produce a summary and prioritized checklist

## Inputs and Outputs
- Inputs: Code snippet(s) or diffs
- Outputs: Summary + prioritized checklist + acceptance criteria

## Workflow
1) Summarize code purpose
2) Identify issues by category
3) Prioritize by risk
4) Produce fixes and acceptance criteria


# Model-Specific Tips

- Prefer Markdown with clear headings and sections
- Place instructions at the beginning (and optionally re-assert at the end) in long contexts
- Use explicit step numbering for CoT where helpful

- Preferred Style: MARKDOWN

```md
# Instructions
...your task...

# Context
...data...

# Output Format
JSON fields ...
```


## References
- Project scope and acceptance criteria basics: https://www.pmi.org/learning/library/project-scope-statement-7017
- Risk management primer: https://www.iso.org/iso-31000-risk-management.html


## Disclaimer
- References to third-party tools, models, pricing, and limits are indicative and may change.
- Validate choices with official docs and run a quick benchmark before production use.
