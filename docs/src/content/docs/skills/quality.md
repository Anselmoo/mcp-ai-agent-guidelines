---
title: Quality Skills
description: Skills for code review, static analysis, performance, security scanning, and refactoring prioritization.
sidebar:
  label: Quality
---

The `qual-*` family applies a multi-lens quality assessment to code. These skills are coordinated in 3× free parallel lanes followed by a `strong` synthesis pass.

## Skills

| Skill ID | Description | Model Class |
|----------|-------------|-------------|
| `qual-review` | Holistic code review: style, correctness, test coverage gaps, readability | `free` |
| `qual-code-analysis` | Static analysis pass: dead code, unused imports, complexity metrics, naming issues | `free` |
| `qual-performance` | Performance audit: algorithmic complexity, N+1 queries, memory leaks, render blocking | `cheap` |
| `qual-security` | Security scan: OWASP Top 10, injection vectors, auth flaws, secret exposure | `strong` |
| `qual-refactoring-priority` | Ranks refactoring candidates by risk, impact, and technical debt score | `cheap` |

## Parallel Execution Pattern

```
Code Input
  ├── qual-review          (free)  → style + correctness
  ├── qual-code-analysis   (free)  → static metrics
  └── qual-performance     (cheap) → perf audit
          │
          ├── qual-security        (strong, independent)
          └── qual-refactoring-priority (cheap, aggregates above)
```

## When to Use

| Situation | Skill(s) |
|-----------|----------|
| Pre-merge code review | `qual-review` + `qual-code-analysis` |
| Performance regression investigation | `qual-performance` |
| Security audit before release | `qual-security` |
| Prioritising tech-debt backlog | `qual-refactoring-priority` |
| Full quality gate | All five |

## Instructions That Invoke These Skills

- **review** — primary consumer of all five
- **refactor** — uses `qual-refactoring-priority` to decide where to start
- **testing** — uses `qual-code-analysis` to find under-tested paths
- **research** — uses `qual-code-analysis` + `qual-performance` for benchmarking
- **evaluate** / **benchmark** — scoring uses `qual-review` as baseline

## Output Format

Each skill produces a **finding table** with severity (`critical` / `high` / `medium` / `low`), file path + line, description, and suggested fix stub.
