---
mode: 'agent'
model: GPT-4.1
tools: ['githubRepo', 'codebase', 'editFiles']
description: 'Produce a step-by-step refactor plan and a checklist'
---
## 🧭 Hierarchical Prompt Structure

### Metadata
- Updated: 2025-09-11
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

# Technique Hints (2025)

## Zero-Shot
Use for simple tasks or baselines. Keep instructions crisp. Example: 'Summarize the following text in 3 bullets focused on findings.'

## Few-Shot
Provide 2–5 diverse examples that exactly match the desired output format.

## Chain-of-Thought
Ask for step-by-step reasoning on complex problems. For GPT add 'think carefully step by step'.

## Prompt Chaining
Split multi-step workflows into sequential prompts (analyze ➜ hypothesize ➜ recommend ➜ plan).

## Retrieval Augmented Generation (RAG)
Separate instructions from documents. Quote sources and include citations/anchors.
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

## Disclaimer
- References to third-party tools, models, pricing, and limits are indicative and may change.
- Validate choices with official docs and run a quick benchmark before production use.