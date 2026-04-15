---
title: Resilience Skills
description: Skills for homeostatic control, membrane isolation, redundant voting, replay recovery, and clone-mutate fault tolerance.
sidebar:
  label: Resilience
---

The `resil-*` family hardens AI workflows against failures, drift, and adversarial conditions. These skills borrow concepts from biological systems and control theory.

## Skills

| Skill ID | Description | Model Class |
|----------|-------------|-------------|
| `resil-homeostatic` | PID-controller-style setpoint maintenance: detects drift from target quality and applies corrective action | `strong` |
| `resil-membrane` | Isolation membranes between workflow stages: prevents fault propagation across skill boundaries | `cheap` |
| `resil-redundant-voter` | Runs N independent model instances on the same input; majority vote determines output | `cheap` |
| `resil-replay` | Replays failed skill executions with modified context or different model to recover from transient errors | `cheap` |
| `resil-clone-mutate` | Clones a solution and applies structured mutations to explore the solution space around a local optimum | `strong` |

## Concepts

### `resil-homeostatic` — PID Control

Treats output quality as a controlled variable with a setpoint. When metrics drift:
- **Proportional**: immediate correction proportional to error magnitude
- **Integral**: accounts for accumulated error over multiple runs
- **Derivative**: anticipates trend based on rate of change

### `resil-membrane` — Fault Isolation

Inspired by cell membranes, this skill defines **permeability rules** for what can cross skill boundaries. A failing skill cannot corrupt state visible to adjacent skills.

### `resil-redundant-voter` — Majority Vote

```
Input
  ├── Model instance A  → answer X
  ├── Model instance B  → answer X  ← majority
  └── Model instance C  → answer Y
              ↓
          Output: X (majority vote)
```

## When to Use

| Situation | Skill(s) |
|-----------|----------|
| High-stakes output requiring confidence | `resil-redundant-voter` |
| Workflow quality degrading over time | `resil-homeostatic` |
| Transient model errors causing failures | `resil-replay` |
| Need to explore solutions beyond local optimum | `resil-clone-mutate` |
| Isolating a flaky skill from the rest | `resil-membrane` |

## Instructions That Invoke These Skills

- **resilience** — primary consumer; all five coordinated
- **orchestrate** — uses `resil-membrane` as default isolation between agents
- **govern** — uses `resil-redundant-voter` for critical policy decisions
