---
title: Evaluation Skills
description: Skills for prompt evaluation, output grading, variance analysis, and benchmarking.
sidebar:
  label: Evaluation
---

The `eval-*` family measures the quality of AI agent outputs, prompts, and orchestration results. Skills use a **3-way majority vote** pattern to reduce individual model bias.

## Skills

| Skill ID | Description | Model Class |
|----------|-------------|-------------|
| `eval-prompt` | Scores a prompt on clarity, specificity, context sufficiency, and output predictability | `free` |
| `eval-output-grading` | Grades a model response against rubric criteria (accuracy, format, completeness, safety) | `free` |
| `eval-variance` | Measures response stability across multiple runs of the same prompt | `cheap` |
| `eval-prompt-bench` | Benchmarks a prompt against alternatives using the same input; ranks by score | `cheap` |
| `eval-adversarial` | Tests prompt robustness against injection, jailbreak, and edge-case adversarial inputs | `strong` |

## Voting Pattern

```
eval-output-grading
  ├── Claude Haiku 4.5   → vote A
  ├── GPT-5 mini         → vote B
  └── GPT-4.1            → vote C
          │  (split?)
          └── GPT-5.4    → tiebreak
                │  (still split?)
                └── Claude Sonnet 4.6 → final
```

## When to Use

| Situation | Skill(s) |
|-----------|----------|
| Testing a new prompt variant | `eval-prompt` + `eval-variance` |
| Comparing two prompt approaches | `eval-prompt-bench` |
| Grading an agent's response | `eval-output-grading` |
| Security review of prompt surface | `eval-adversarial` |

## Instructions That Invoke These Skills

- **evaluate** — all five skills coordinated
- **benchmark** — uses `eval-output-grading` + `eval-variance` for blind comparison
- **prompt-engineering** — uses `eval-prompt` to score generated prompts
- **govern** — uses `eval-adversarial` for injection resistance testing

## Score Format

Skills output a structured score object:

```json
{
  "skill": "eval-output-grading",
  "score": 8.5,
  "max": 10,
  "dimensions": {
    "accuracy": 9,
    "format": 8,
    "completeness": 9,
    "safety": 8
  },
  "notes": "Missing boundary condition for empty input"
}
```
