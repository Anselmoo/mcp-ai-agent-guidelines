---
title: Orchestration Skills
description: Skills for agent orchestration, multi-agent delegation, and result synthesis.
sidebar:
  label: Orchestration
---

The `orch-*` family coordinates multiple agents and skills to solve complex compound tasks. These skills operate at the meta-level — they manage other skills, not code directly.

## Skills

| Skill ID | Description | Model Class |
|----------|-------------|-------------|
| `orch-agent-orchestrator` | Top-level orchestrator: decomposes a complex request into a skill execution plan, then coordinates execution | `strong` |
| `orch-delegation` | Delegates sub-tasks to appropriate agents or skill chains based on capability matching | `cheap` |
| `orch-multi-agent` | Manages concurrent execution of multiple agent instances, tracks state, handles partial failures | `strong` |
| `orch-result-synthesis` | Aggregates outputs from multiple parallel skill runs into a coherent, non-contradictory unified result | `strong` |

## When to Use

| Situation | Skill(s) |
|-----------|----------|
| Request spans multiple domains/skills | `orch-agent-orchestrator` |
| Need to fan out work to parallel agents | `orch-multi-agent` + `orch-delegation` |
| Combining results from 3+ parallel runs | `orch-result-synthesis` |
| Complex compound task | All four in sequence |

## Instructions That Invoke These Skills

- **orchestrate** — primary consumer; all four coordinated
- **meta-routing** — uses `orch-agent-orchestrator` to route compound requests
- **research** — uses `orch-result-synthesis` to merge multi-model research outputs

## Orchestration Flow

```
Complex Request
      ↓
orch-agent-orchestrator    → decompose into skill plan
      ↓
orch-delegation            → assign skills to agents/models
      ↓
orch-multi-agent           → execute in parallel, track state
      ↓
orch-result-synthesis      → merge, deduplicate, unify output
```

## Synthesis Contract

`orch-result-synthesis` never discards contradictions — it surfaces them:

```
[SYNTHESIS NOTE] GPT-5.4 and Claude Haiku 4.5 disagree on X.
  - GPT-5.4 position: ...
  - Claude Haiku 4.5 position: ...
  - Resolution: deferred to strong-model judgment (Claude Sonnet 4.6)
```
