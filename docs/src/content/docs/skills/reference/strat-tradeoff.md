---
title: "strat-tradeoff"
description: "Use this skill when the user wants to work on Comparing architectural, model, and workflow alternatives with explicit tradeoff axes. Triggers include \\\"compare "
sidebar:
  label: "strat-tradeoff"
  badge:
    text: "Advanced"
    variant: "danger"
---

**Domain:** [`strat`](/mcp-ai-agent-guidelines/skills/strategy/) · **Model class:** `strong`

## Description

Use this skill when the user wants to work on Comparing architectural, model, and workflow alternatives with explicit tradeoff axes. Triggers include \"compare these two approaches\", \"RAG vs fine-tuning tradeoffs\", \"analyze tradeoffs\". Do NOT use when frame the strategy (use core-strategy-advisor).

## Purpose

Comparing architectural, model, and workflow alternatives with explicit tradeoff axes. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "compare these two approaches"
- "RAG vs fine-tuning tradeoffs"
- "analyze tradeoffs"
- "single-agent vs multi-agent decision"
- "architecture alternatives"

## Anti-Triggers

- frame the strategy (use core-strategy-advisor)
- synthesise research to inform decision (use core-comparative-analysis)

## Intake Questions

1. What is the user's goal and current state?
2. What constraints (time, team, compliance) apply?
3. Are there existing artifacts (specs, code, benchmarks) to reference?

## Output Contract

- prioritized plan
- tradeoff rationale
- sequencing guidance
- success metrics

## Related Skills

[strat-advisor](/mcp-ai-agent-guidelines/skills/reference/strat-advisor/) · [synth-comparative](/mcp-ai-agent-guidelines/skills/reference/synth-comparative/) · [eval-prompt-bench](/mcp-ai-agent-guidelines/skills/reference/eval-prompt-bench/)
