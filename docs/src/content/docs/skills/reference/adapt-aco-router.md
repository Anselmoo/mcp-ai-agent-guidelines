---
title: "adapt-aco-router"
description: "Use when a user wants workflow routing to improve automatically based on which paths have historically produced the best results. Triggers: \\\"self-optimising wo"
sidebar:
  label: "adapt-aco-router"
  badge:
    text: "Efficient"
    variant: "caution"
---

**Domain:** [`adapt`](/mcp-ai-agent-guidelines/skills/adaptive/) · **Model class:** `cheap`

## Description

Use when a user wants workflow routing to improve automatically based on which paths have historically produced the best results. Triggers: \"self-optimising workflow\", \"adaptive routing\", \"learn which path works best\", \"pheromone routing\", \"ant colony\", \"workflow that gets smarter\", \"reinforce good paths\", \"dynamic edge weights\", user has a prompt-flow-builder workflow and says \"I want it to prefer routes that work\". Also trigger when a user wants to shift traffic toward better-performing agents without hardcoding which ones those are.

## Purpose

Augment PromptFlowRequest edges with pheromone weight. After each run deposit Δτ on traversed edges; apply evaporation every cycle_length runs. Route by P(i,j) ∝ τ^α × η^β.

## Trigger Phrases

- "self-optimising workflow"
- "adaptive routing"
- "learn which path works best"
- "pheromone routing"
- "ant colony"
- "workflow that gets smarter"
- "reinforce good paths"
- "dynamic edge weights"
- "I want it to prefer routes that work"

## Anti-Triggers

- the user wants a one-off improvement without ongoing adaptation or structural change

## Intake Questions

1. What graph nodes and candidate edges are available?
2. How is path quality measured for pheromone updates?
3. What exploration/exploitation balance should alpha and beta enforce?
4. How often should evaporation run and state be persisted?

## Output Contract

- routing decision artifact
- configuration and telemetry summary
- next-action explanation
- validation or operator notes

## Related Skills

[flow-orchestrator](/mcp-ai-agent-guidelines/skills/reference/flow-orchestrator/) · [orch-agent-orchestrator](/mcp-ai-agent-guidelines/skills/reference/orch-agent-orchestrator/) · [prompt-chaining](/mcp-ai-agent-guidelines/skills/reference/prompt-chaining/)
