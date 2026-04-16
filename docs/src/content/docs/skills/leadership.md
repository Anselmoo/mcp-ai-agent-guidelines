---
title: Leadership Skills
description: Skills for capability mapping, transformation roadmaps, executive briefs, and organisational health.
sidebar:
  label: Leadership
---

The `lead-*` family supports engineering leaders and CTOs in capability building, organisational transformation, and executive communication.

## Skills

| Skill ID | Description | Model Class |
|----------|-------------|-------------|
| `lead-capability-mapping` | Maps existing team capabilities to strategic requirements; identifies gaps | `cheap` |
| `lead-transformation-roadmap` | Builds a phased organisational transformation plan with change management steps | `strong` |
| `lead-exec-brief` | Generates an executive summary from technical content, suitable for C-suite or board | `cheap` |
| `lead-team-health` | Assesses team health indicators: velocity, attrition signals, skill concentration risk | `free` |
| `lead-hiring-profile` | Generates a hiring profile for a role based on gap analysis and strategic needs | `free` |
| `lead-okr-design` | Designs OKRs that align engineering output to business outcomes | `cheap` |
| `lead-culture-diagnostic` | Identifies cultural patterns that accelerate or impede engineering excellence | `cheap` |

## When to Use

| Situation | Skill(s) |
|-----------|----------|
| Preparing a tech strategy presentation | `lead-exec-brief` + `strat-advisor` |
| Planning team growth | `lead-capability-mapping` + `lead-hiring-profile` |
| Engineering transformation initiative | `lead-transformation-roadmap` |
| Quarterly planning | `lead-okr-design` |
| Underperforming team investigation | `lead-team-health` + `lead-culture-diagnostic` |

## Instructions That Invoke These Skills

- **enterprise** — primary consumer; all seven coordinated for large-scale transformation
- **strategy** — uses `lead-exec-brief` to format strategic output for leadership audiences
- **plan** — uses `lead-okr-design` to align delivery plans to business goals

## `lead-transformation-roadmap` — L9 Pattern

For large enterprise transformations, this skill uses the **Dual-Strong Research** pattern:

```
1. Fan-out: 2× GPT-4.1 + 1× GPT-5 mini (free)
2. First synthesis: GPT-5.4
3. Final synthesis: Claude Sonnet 4.6
```

This is only warranted for L9-level (full-organisation) transformation plans. For team-level, `cheap` model suffices.

## OKR Design Output

```markdown
**Objective**: Improve deployment reliability

**Key Results**:
- KR1: Reduce MTTR from 4h to 30min (Q2)
- KR2: Achieve 99.9% deployment success rate (Q3)
- KR3: 0 P0 incidents caused by deployment process (Q3)

**Leading indicators**: deployment frequency, change fail rate, rollback time
```
