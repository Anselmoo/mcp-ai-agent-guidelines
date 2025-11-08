---
mode: "agent"
model: GPT-5
tools: ["githubRepo", "codebase", "editFiles"]
---

## 🧭 Hierarchical Prompt Structure

### Metadata

- Updated: 2025-08-23
- Source tool: mcp_ai-agent-guid_hierarchical-prompt-builder

# Context

We need a structured prompt to guide a thorough code hygiene assessment and remediation planning for a problematic Python file. Findings should be categorized and prioritized, with security-first focus.

# Goal

Generate a hierarchical prompt that elicits: summary, categorized findings, prioritized risks, and a remediation plan with acceptance checks.

# Requirements

1. Security findings must come first
2. Checklist format for actions
3. Limit verbosity—concise bullets
4. Accepts arbitrary language inputs

# Target Audience

Senior engineers and tech leads

# Technique Hints (2025)

## Few-Shot

Provide 2–5 diverse examples that exactly match the desired output format.

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

# Pitfalls to Avoid

- Vague instructions → replace with precise, positive directives
- Forced behaviors (e.g., 'always use a tool') → say 'Use tools when needed'
- Context mixing → separate Instructions vs Data clearly
- Limited examples → vary few-shot examples to avoid overfitting
- Repetitive sample phrases → add 'vary language naturally'
- Negative instructions → state what to do, not just what not to do

# Instructions

Follow the structure above. If you detect additional issues in the codebase, explicitly add them under Problem Indicators, propose minimal diffs, and flag risky changes. Treat tools/models as recommendations to validate against current provider documentation.

## References

- Hierarchical Prompting overview: https://relevanceai.com/prompt-engineering/master-hierarchical-prompting-for-better-ai-interactions
- Prompt engineering best practices: https://kanerika.com/blogs/ai-prompt-engineering-best-practices/
- Techniques round-up (2025): https://www.dataunboxed.io/blog/the-complete-guide-to-prompt-engineering-15-essential-techniques-for-2025

## Disclaimer

- References to third-party tools, models, pricing, and limits are indicative and may change.
- Validate choices with official docs and run a quick benchmark before production use.
