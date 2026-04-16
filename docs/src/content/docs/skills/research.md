---
title: Research Skills
description: Skills for comparative research, synthesis, recommendation engines, and multi-source analysis.
sidebar:
  label: Research
---

The `synth-*` family gathers, compares, and synthesises information from multiple sources or model perspectives. Output feeds strategic and architectural decisions.

## Skills

| Skill ID | Description | Model Class |
|----------|-------------|-------------|
| `synth-comparative` | Structured comparison of N options across defined evaluation dimensions | `free` |
| `synth-research` | Deep-dive research on a topic: collects evidence, identifies consensus and controversy | `free` |
| `synth-engine` | Research synthesis engine: takes multiple raw research inputs and produces a unified report | `strong` |
| `synth-recommendation` | Generates a decision recommendation with supporting rationale from research outputs | `cheap` |

## Pattern 5 — Free Triple Parallel

```
Research Request
  ├── GPT-5 mini        → perspective A (broad)
  ├── GPT-4.1           → perspective B (thorough)
  └── GPT-4.1           → perspective C (alt framing)
          │
          └── synth-engine (Claude Sonnet 4.6) → unified synthesis
                  │
                  └── synth-recommendation → decision output
```

Cost: 3 free calls + 1 synthesis pass ≈ 80% cheaper than strong end-to-end.

## When to Use

| Situation | Skill(s) |
|-----------|----------|
| Choosing between frameworks/tools | `synth-comparative` + `synth-recommendation` |
| Understanding an unfamiliar domain | `synth-research` + `synth-engine` |
| Building a justified recommendation | All four |

## Instructions That Invoke These Skills

- **research** — primary consumer; all four coordinated with Pattern 5
- **strategy** — uses `synth-comparative` + `synth-recommendation` for tradeoff analysis
- **design** — uses `synth-research` for technology selection

## `synth-comparative` Format

```markdown
## Comparison: Option A vs Option B vs Option C

| Dimension | Option A | Option B | Option C |
|-----------|----------|----------|----------|
| Performance | ★★★★☆ | ★★★☆☆ | ★★★★★ |
| ...

**Recommendation**: Option C for high-throughput, Option A for ease of maintenance.
```
