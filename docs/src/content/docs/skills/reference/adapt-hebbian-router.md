---
title: "adapt-hebbian-router"
description: "Use when a user wants agent collaboration to improve automatically based on which pairings have historically produced the best results. Triggers: \\\"agents that "
sidebar:
  label: "adapt-hebbian-router"
  badge:
    text: "Efficient"
    variant: "caution"
---

**Domain:** [`adapt`](/mcp-ai-agent-guidelines/skills/adaptive/) · **Model class:** `cheap`

## Description

Use when a user wants agent collaboration to improve automatically based on which pairings have historically produced the best results. Triggers: \"agents that learn to work together\", \"strengthen good agent pairs\", \"Hebbian learning\", \"synaptic weights for agents\", \"discover which agents complement each other\", \"adaptive multi-agent routing\". Also trigger when someone has 4+ agents and doesn't know the optimal collaboration pattern, or says their orchestration \"feels random\" and they want it to converge on better pairings.

## Purpose

Maintain N×N weight matrix over agent pairs. Update w[A][B]+=η×quality×co_activation; decay w*=(1-decay_rate); clamp to [floor,ceiling]. Route by softmax/greedy/ε-greedy over row w[A].

## Trigger Phrases

- "agents that learn to work together"
- "strengthen good agent pairs"
- "Hebbian learning"
- "synaptic weights for agents"
- "discover which agents complement each other"
- "adaptive multi-agent routing"
- "feels random"

## Anti-Triggers

- the user wants a one-off improvement without ongoing adaptation or structural change

## Intake Questions

1. Which agents may collaborate and how is pair quality scored?
2. What learning and decay rates fit the pace of adaptation?
3. Should routing exploit greedily or preserve exploration?
4. How many collaboration cycles are needed before weights stabilize?

## Output Contract

- routing decision artifact
- configuration and telemetry summary
- next-action explanation
- validation or operator notes

## Related Skills

[flow-orchestrator](/mcp-ai-agent-guidelines/skills/reference/flow-orchestrator/) · [orch-agent-orchestrator](/mcp-ai-agent-guidelines/skills/reference/orch-agent-orchestrator/) · [prompt-chaining](/mcp-ai-agent-guidelines/skills/reference/prompt-chaining/)
