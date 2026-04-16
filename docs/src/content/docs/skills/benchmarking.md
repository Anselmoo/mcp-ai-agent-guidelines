---
title: Benchmarking Skills
description: Skills for performance analysis, blind output comparison, and evaluation suite construction.
sidebar:
  label: Benchmarking
---

The `bench-*` family establishes objective baselines and comparative measurements. Output feeds the **evaluate** and **research** instructions.

## Skills

| Skill ID | Description | Model Class |
|----------|-------------|-------------|
| `bench-analyzer` | Profiles runtime performance: measures latency, throughput, P95/P99, and regression detection | `free` |
| `bench-blind-comparison` | Side-by-side blind comparison of two solutions or responses without revealing source | `cheap` |
| `bench-eval-suite` | Constructs a reusable evaluation suite: test cases, scoring rubric, and expected outputs | `cheap` |

## When to Use

| Situation | Skill(s) |
|-----------|----------|
| Comparing two algorithm implementations | `bench-blind-comparison` |
| Establishing performance baselines | `bench-analyzer` |
| Building a repeatable eval dataset | `bench-eval-suite` |

## Instructions That Invoke These Skills

- **benchmark** — primary consumer; all three coordinated
- **evaluate** — uses `bench-blind-comparison` for output comparison
- **research** — uses `bench-analyzer` to validate performance claims

## `bench-blind-comparison` Format

Both options are presented without labels during evaluation:

```
Option A: [implementation 1 — label hidden]
Option B: [implementation 2 — label hidden]

Evaluated by 3 free-tier models → majority vote → result revealed
```

This prevents evaluator bias toward the "familiar" or "expected" implementation.

## `bench-eval-suite` Output

```json
{
  "suite": "auth-service-v2",
  "cases": [
    {
      "id": "happy-path-login",
      "input": { "email": "user@example.com", "password": "valid" },
      "expected": { "status": 200, "token": "<jwt>" },
      "rubric": ["has_token", "status_200", "response_time_lt_200ms"]
    }
  ]
}
```
