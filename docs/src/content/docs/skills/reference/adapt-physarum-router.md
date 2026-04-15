---
title: "adapt-physarum-router"
description: "Use when a user wants workflow routing topology to self-prune — automatically removing underperforming paths and reinforcing high-throughput ones. Triggers: \\\"s"
sidebar:
  label: "adapt-physarum-router"
  badge:
    text: "Efficient"
    variant: "caution"
---

**Domain:** [`adapt`](/mcp-ai-agent-guidelines/skills/adaptive/) · **Model class:** `cheap`

## Description

Use when a user wants workflow routing topology to self-prune — automatically removing underperforming paths and reinforcing high-throughput ones. Triggers: \"self-pruning workflow\", \"slime mould optimisation\", \"Physarum\", \"reinforce busy paths\", \"prune unused routes\", \"adaptive network topology\", \"workflow that removes dead ends\". Best for flows with 6+ edges. Also trigger when a user notices some workflow paths are never used and wants the system to consolidate onto paths that matter.

## Purpose

Model each edge as tube with conductance D (init 1.0). After each cycle: D(t+1)=D(t)×|flow(t)|^μ (normalised). Prune edges where D<pruning_threshold. Spawn exploratory edges with p_explore.

## Trigger Phrases

- "self-pruning workflow"
- "slime mould optimisation"
- "Physarum"
- "reinforce busy paths"
- "prune unused routes"
- "adaptive network topology"
- "workflow that removes dead ends"
- "workflow paths are never used"

## Anti-Triggers

- the user wants a one-off improvement without ongoing adaptation or structural change

## Intake Questions

1. What initial edges are eligible for reinforcement or pruning?
2. How is throughput or flow measured on each edge?
3. What decay, reinforcement, and prune thresholds fit the workload?
4. How many adaptation cycles should run before edges can be removed?

## Output Contract

- routing decision artifact
- configuration and telemetry summary
- next-action explanation
- validation or operator notes

## Related Skills

[flow-orchestrator](/mcp-ai-agent-guidelines/skills/reference/flow-orchestrator/) · [orch-agent-orchestrator](/mcp-ai-agent-guidelines/skills/reference/orch-agent-orchestrator/) · [prompt-chaining](/mcp-ai-agent-guidelines/skills/reference/prompt-chaining/)
