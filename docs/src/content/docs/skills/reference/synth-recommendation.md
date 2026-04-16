---
title: "synth-recommendation"
description: "Use this skill when the user wants to work on Framing evidence-based recommendations with rationale, tradeoffs, and confidence levels. Triggers include \\\"frame "
sidebar:
  label: "synth-recommendation"
  badge:
    text: "Efficient"
    variant: "caution"
---

**Domain:** [`synth`](/mcp-ai-agent-guidelines/skills/research/) · **Model class:** `cheap`

## Description

Use this skill when the user wants to work on Framing evidence-based recommendations with rationale, tradeoffs, and confidence levels. Triggers include \"frame a recommendation\", \"what should we choose and why\", \"evidence-based recommendation\". Do NOT use when gather evidence first (use core-research-assistant).

## Purpose

Framing evidence-based recommendations with rationale, tradeoffs, and confidence levels. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "frame a recommendation"
- "what should we choose and why"
- "evidence-based recommendation"
- "actionable recommendation from research"

## Anti-Triggers

- gather evidence first (use core-research-assistant)
- frame as strategy (use core-strategy-advisor)

## Intake Questions

1. What is the user's goal and current state?
2. What constraints (time, team, compliance) apply?
3. Are there existing artifacts (specs, code, benchmarks) to reference?

## Output Contract

- structured synthesis
- comparison or recommendation artifact
- evidence summary
- confidence and next action

## Related Skills

[synth-engine](/mcp-ai-agent-guidelines/skills/reference/synth-engine/) · [synth-comparative](/mcp-ai-agent-guidelines/skills/reference/synth-comparative/) · [strat-advisor](/mcp-ai-agent-guidelines/skills/reference/strat-advisor/)
