---
title: "adapt-quorum"
description: "Use when a user wants agent task assignment to emerge from agent availability signals rather than central dispatch. Triggers: \\\"decentralised agent coordination"
sidebar:
  label: "adapt-quorum"
  badge:
    text: "Efficient"
    variant: "caution"
---

**Domain:** [`adapt`](/mcp-ai-agent-guidelines/skills/adaptive/) · **Model class:** `cheap`

## Description

Use when a user wants agent task assignment to emerge from agent availability signals rather than central dispatch. Triggers: \"decentralised agent coordination\", \"quorum sensing\", \"agents that self-organise\", \"emergent task assignment\", \"no central scheduler\", \"agents claim tasks when ready\", \"load-based routing\". Also trigger when a user has 5+ agents and is frustrated that a central orchestrator is a bottleneck or single point of failure, or when someone wants a workflow that scales horizontally without redesign.

## Purpose

Each agent emits signal {specialisations, load, quality_recent}. Quorum listener aggregates signal_sum=Σ(quality_recent×(1-load)) for matching agents. When signal_sum≥quorum_threshold, broadcast task.

## Trigger Phrases

- "decentralised agent coordination"
- "quorum sensing"
- "agents that self-organise"
- "emergent task assignment"
- "no central scheduler"
- "agents claim tasks when ready"
- "load-based routing"
- "single point of failure"

## Anti-Triggers

- the user wants a one-off improvement without ongoing adaptation or structural change

## Intake Questions

1. What readiness or availability signals can agents publish?
2. What quorum threshold and minimum participation define a valid claim?
3. How should confidence or load factor into the signal sum?
4. What fallback path should run when no quorum forms?

## Output Contract

- routing decision artifact
- configuration and telemetry summary
- next-action explanation
- validation or operator notes

## Related Skills

[flow-orchestrator](/mcp-ai-agent-guidelines/skills/reference/flow-orchestrator/) · [orch-agent-orchestrator](/mcp-ai-agent-guidelines/skills/reference/orch-agent-orchestrator/) · [prompt-chaining](/mcp-ai-agent-guidelines/skills/reference/prompt-chaining/)
