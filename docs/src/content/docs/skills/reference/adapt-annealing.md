---
title: "adapt-annealing"
description: "Use when a user wants to automatically discover the optimal workflow configuration — agent count, model selection, chain depth, parallelism — without manual tun"
sidebar:
  label: "adapt-annealing"
  badge:
    text: "Efficient"
    variant: "caution"
---

**Domain:** [`adapt`](/mcp-ai-agent-guidelines/skills/adaptive/) · **Model class:** `cheap`

## Description

Use when a user wants to automatically discover the optimal workflow configuration — agent count, model selection, chain depth, parallelism — without manual tuning. Triggers: \"find the best workflow config\", \"optimise my pipeline automatically\", \"too expensive / too slow — fix it\", \"simulated annealing\", \"Boltzmann\", \"explore workflow topologies\", \"auto-tune the orchestrator\". Also trigger when a user is frustrated they don't know how many agents to use or which model tier to pick.

## Purpose

Represent workflow config as state vector. Perturb it; evaluate E=λ_lat×latency+λ_tok×token_cost+λ_q×(1-quality); accept/reject via Boltzmann exp(-ΔE/T). Cool T geometrically.

## Trigger Phrases

- "find the best workflow config"
- "optimise my pipeline automatically"
- "too expensive / too slow — fix it"
- "simulated annealing"
- "Boltzmann"
- "explore workflow topologies"
- "auto-tune the orchestrator"
- "which model tier to pick"

## Anti-Triggers

- the user wants a one-off improvement without ongoing adaptation or structural change

## Intake Questions

1. What topology knobs may change (agent count, model tier, chain depth, parallelism, context)?
2. How are quality, latency, and cost combined into an objective score?
3. How many evaluations are affordable for the search?
4. What initial topology is acceptable as the starting point?

## Output Contract

- routing decision artifact
- configuration and telemetry summary
- next-action explanation
- validation or operator notes

## Related Skills

[flow-orchestrator](/mcp-ai-agent-guidelines/skills/reference/flow-orchestrator/) · [orch-agent-orchestrator](/mcp-ai-agent-guidelines/skills/reference/orch-agent-orchestrator/) · [prompt-chaining](/mcp-ai-agent-guidelines/skills/reference/prompt-chaining/)
