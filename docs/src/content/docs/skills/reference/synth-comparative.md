---
title: "synth-comparative"
description: "Use this skill when the user wants to work on Comparing tools, models, frameworks, or approaches across explicit evaluation axes. Triggers include \\\"compare the"
sidebar:
  label: "synth-comparative"
  badge:
    text: "Efficient"
    variant: "caution"
---

**Domain:** [`synth`](/mcp-ai-agent-guidelines/skills/research/) · **Model class:** `cheap`

## Description

Use this skill when the user wants to work on Comparing tools, models, frameworks, or approaches across explicit evaluation axes. Triggers include \"compare these approaches\", \"comparison matrix for these tools\", \"trade study between options\". Do NOT use when gather information first (use core-research-assistant).

## Purpose

Comparing tools, models, frameworks, or approaches across explicit evaluation axes. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "compare these approaches"
- "comparison matrix for these tools"
- "trade study between options"
- "compare these frameworks with criteria"

## Anti-Triggers

- gather information first (use core-research-assistant)
- frame recommendation after comparison (use core-recommendation-framing)

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

[synth-research](/mcp-ai-agent-guidelines/skills/reference/synth-research/) · [synth-engine](/mcp-ai-agent-guidelines/skills/reference/synth-engine/) · [synth-recommendation](/mcp-ai-agent-guidelines/skills/reference/synth-recommendation/)
