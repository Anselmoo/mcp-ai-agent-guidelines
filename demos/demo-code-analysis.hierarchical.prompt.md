---
mode: 'agent'
model: GPT-5-Codex
tools: ['githubRepo', 'codebase', 'editFiles']
description: 'Produce a step-by-step refactor plan and a checklist'
---
## 🧭 Hierarchical Prompt Structure

### Metadata
- Updated: 2025-12-16
- Source tool: mcp_ai-agent-guid_hierarchical-prompt-builder
- Input file: /home/runner/work/mcp-ai-agent-guidelines/mcp-ai-agent-guidelines/demos/demo-code-analysis.py
- Suggested filename: produce-a-step-by-step-refactor-plan-and-a-checklist.prompt.md

# Context
Refactor a small Python script for clarity and safety

# Goal
Produce a step-by-step refactor plan and a checklist

# Requirements
1. Keep behavior the same
2. Reduce complexity
3. Add docstrings and type hints

# Output Format
1. Summary
2. Steps
3. Checklist

# Target Audience
Senior engineer

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

# Instructions
Follow the structure above. If you detect additional issues in the codebase, explicitly add them under Problem Indicators, propose minimal diffs, and flag risky changes. Treat tools/models as recommendations to validate against current provider documentation.

## Disclaimer
- References to third-party tools, models, pricing, and limits are indicative and may change.
- Validate choices with official docs and run a quick benchmark before production use.
