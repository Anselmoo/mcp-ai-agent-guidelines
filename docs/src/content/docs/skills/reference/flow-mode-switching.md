---
title: "flow-mode-switching"
description: "Use this skill when the user wants to work on Managing transitions between operating modes (plan, code, debug, review) in AI workflows. Triggers include \\\"switc"
sidebar:
  label: "flow-mode-switching"
  badge:
    text: "Zero-Cost"
    variant: "success"
---

**Domain:** [`flow`](/mcp-ai-agent-guidelines/skills/workflows/) · **Model class:** `free`

## Description

Use this skill when the user wants to work on Managing transitions between operating modes (plan, code, debug, review) in AI workflows. Triggers include \"switch between plan and execute mode\", \"how do I add a review gate\", \"change agent mode mid-workflow\". Do NOT use when design the full pipeline (use core-workflow-orchestrator).

## Purpose

Managing transitions between operating modes (plan, code, debug, review) in AI workflows. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "switch between plan and execute mode"
- "how do I add a review gate"
- "change agent mode mid-workflow"
- "separate planning from execution"

## Anti-Triggers

- design the full pipeline (use core-workflow-orchestrator)
- handle context between steps (use core-context-handoff)

## Intake Questions

1. What is the user's goal and current state?
2. What constraints (time, team, compliance) apply?
3. Are there existing artifacts (specs, code, benchmarks) to reference?

## Output Contract

- handoff-ready artifact
- phase sequencing guidance
- state transition notes
- validation or resume guidance

## Related Skills

[flow-orchestrator](/mcp-ai-agent-guidelines/skills/reference/flow-orchestrator/) · [flow-context-handoff](/mcp-ai-agent-guidelines/skills/reference/flow-context-handoff/) · [prompt-hierarchy](/mcp-ai-agent-guidelines/skills/reference/prompt-hierarchy/)
