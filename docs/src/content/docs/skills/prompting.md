---
title: Prompting Skills
description: Skills for prompt engineering, chaining, refinement, and hierarchy design.
sidebar:
  label: Prompting
---

The `prompt-*` family designs, improves, and validates the prompts used throughout the skill system. These skills are meta-tools — they operate on prompts, not on product code.

## Skills

| Skill ID | Description | Model Class |
|----------|-------------|-------------|
| `prompt-engineering` | Designs new prompts from scratch: system message, user message, output format, stop tokens | `cheap` |
| `prompt-chaining` | Builds multi-step prompt chains where each step's output feeds the next | `cheap` |
| `prompt-refinement` | Iteratively improves an existing prompt based on failure analysis or eval scores | `cheap` |
| `prompt-hierarchy` | Designs a prompt hierarchy: system → instruction → user layers with clear override rules | `strong` |

## When to Use

| Situation | Skill(s) |
|-----------|----------|
| Building a new AI feature's prompt | `prompt-engineering` |
| Chain of thought requires multiple steps | `prompt-chaining` |
| Prompt is producing inconsistent results | `prompt-refinement` |
| Complex multi-layer prompt system | `prompt-hierarchy` |

## Instructions That Invoke These Skills

- **prompt-engineering** — primary consumer; all four coordinated
- **evaluate** — uses `prompt-refinement` after eval scores reveal weaknesses
- **govern** — uses `prompt-hierarchy` to enforce policy layers

## Prompt Engineering Output

`prompt-engineering` produces a full prompt specification:

```yaml
system: |
  You are a senior TypeScript engineer. You produce clean, typed, testable code.
  Follow ESM conventions. Never use `any`. Use `zod` for runtime validation.

user_template: |
  Implement a function that {{task}}.
  Requirements: {{requirements}}
  Constraints: {{constraints}}

output_format: typescript_fenced_codeblock
temperature: 0.2
max_tokens: 2048
stop_tokens: ["```\n\n"]
```

## Prompt Refinement Loop

```
Initial prompt → eval-prompt score
      ↓
prompt-refinement  → identify failure mode
      ↓
Modified prompt → eval-prompt re-score
      ↓
Repeat until score ≥ threshold
```
