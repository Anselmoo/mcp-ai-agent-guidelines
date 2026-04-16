---
title: "resil-replay"
description: "Use when a user wants their orchestrator to learn from past runs and improve routing strategy over time without retraining a model. Triggers: \\\"learn from past "
sidebar:
  label: "resil-replay"
  badge:
    text: "Efficient"
    variant: "caution"
---

**Domain:** [`resil`](/mcp-ai-agent-guidelines/skills/resilience/) · **Model class:** `cheap`

## Description

Use when a user wants their orchestrator to learn from past runs and improve routing strategy over time without retraining a model. Triggers: \"learn from past runs\", \"workflow memory\", \"consolidate experience\", \"reflection loop\", \"meta-learning for orchestrator\", \"hippocampal replay\", \"improve routing from history\", \"make the orchestrator smarter over time\", orchestrator \"keeps making the same mistakes\". Also trigger when someone wants a scheduled review of their workflow performance logs.

## Purpose

Buffer N ExecutionTrace objects (FIFO or quality-weighted eviction). At trigger, run reflection agent over buffer+current strategy. Agent outputs routing_strategy_update; inject into orchestrator system prompt.

## Trigger Phrases

- "learn from past runs"
- "workflow memory"
- "consolidate experience"
- "reflection loop"
- "meta-learning for orchestrator"
- "hippocampal replay"
- "improve routing from history"
- "make the orchestrator smarter over time"
- "keeps making the same mistakes"
- "scheduled review of workflow performance logs"

## Anti-Triggers

- the user wants a one-off improvement without ongoing adaptation or structural change

## Intake Questions

1. What traces or run logs should be replayed?
2. How many traces and what mix of successes/failures should consolidation use?
3. What strategy update or injection mode can modify the orchestrator safely?
4. How often should replay consolidation run and what metrics define improvement?

## Output Contract

- failure mode analysis
- recovery strategy
- operational checks
- validation notes

## Related Skills

[flow-orchestrator](/mcp-ai-agent-guidelines/skills/reference/flow-orchestrator/) · [orch-agent-orchestrator](/mcp-ai-agent-guidelines/skills/reference/orch-agent-orchestrator/) · [prompt-chaining](/mcp-ai-agent-guidelines/skills/reference/prompt-chaining/)
