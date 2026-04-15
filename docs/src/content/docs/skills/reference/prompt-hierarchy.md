---
title: "prompt-hierarchy"
description: "Use this skill when the user wants to work on Calibrating AI agent autonomy levels and control surfaces for tasks. Triggers include \\\"calibrate agent autonomy\\\""
sidebar:
  label: "prompt-hierarchy"
  badge:
    text: "Efficient"
    variant: "caution"
---

**Domain:** [`prompt`](/mcp-ai-agent-guidelines/skills/prompting/) · **Model class:** `cheap`

## Description

Use this skill when the user wants to work on Calibrating AI agent autonomy levels and control surfaces for tasks. Triggers include \"calibrate agent autonomy\", \"how much autonomy should my agent have\", \"set up agent control surfaces\". Do NOT use when design a multi-step pipeline (use core-workflow-orchestrator).

## Purpose

Calibrating AI agent autonomy levels and control surfaces for tasks. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "calibrate agent autonomy"
- "how much autonomy should my agent have"
- "set up agent control surfaces"
- "choose between guided and autonomous mode"

## Anti-Triggers

- design a multi-step pipeline (use core-workflow-orchestrator)
- write a prompt template (use core-prompt-engineering)

## Intake Questions

1. What is the user's goal and current state?
2. What constraints (time, team, compliance) apply?
3. Are there existing artifacts (specs, code, benchmarks) to reference?

## Output Contract

- prompt asset
- explicit output contract
- failure handling
- worked example or usage guidance

## Related Skills

[flow-orchestrator](/mcp-ai-agent-guidelines/skills/reference/flow-orchestrator/) · [gov-workflow-compliance](/mcp-ai-agent-guidelines/skills/reference/gov-workflow-compliance/)
