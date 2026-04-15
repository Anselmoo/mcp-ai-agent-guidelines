---
title: Strategy Skills
description: Skills for strategic advisory, roadmap creation, prioritization, and tradeoff analysis.
sidebar:
  label: Strategy
---

The `strat-*` family translates technical decisions into strategic recommendations, roadmaps, and trade-off analyses for engineering leaders and product stakeholders.

## Skills

| Skill ID | Description | Model Class |
|----------|-------------|-------------|
| `strat-advisor` | Provides strategic recommendations on technical direction, framing risk and opportunity | `strong` |
| `strat-roadmap` | Generates a phased delivery roadmap with milestones, dependencies, and risk flags | `cheap` |
| `strat-prioritisation` | Ranks a backlog of initiatives by impact, effort, risk, and strategic alignment | `cheap` |
| `strat-tradeoff` | Systematic tradeoff analysis: maps options to consequences across time horizon, cost, and capability | `strong` |

## When to Use

| Situation | Skill(s) |
|-----------|----------|
| Deciding between competing technical approaches | `strat-tradeoff` |
| Planning a multi-quarter delivery | `strat-roadmap` |
| Ranking backlog for next sprint/quarter | `strat-prioritisation` |
| Preparing for executive decision meeting | `strat-advisor` + `strat-tradeoff` |

## Instructions That Invoke These Skills

- **strategy** — primary consumer; all four coordinated
- **plan** — uses `strat-roadmap` + `strat-prioritisation`
- **enterprise** — uses `strat-advisor` for transformation advisory
- **research** — uses `strat-tradeoff` for decision synthesis

## Dual-Strong Research for High-Stakes Strategy

For `strat-tradeoff` in critical decisions:

```
1. Fan-out: 2× GPT-4.1 + 1× GPT-5 mini (free, parallel)
2. First synthesis: GPT-5.4 (consolidate)
3. Final synthesis: Claude Sonnet 4.6 (judgment pass)
```

## Roadmap Output Format

```markdown
## Q1: Foundation
- [ ] Milestone: Auth service extracted (Week 4)
- [ ] Milestone: Database schema migration (Week 8)
- Risk: vendor API rate limits during migration

## Q2: Scale
...
```
