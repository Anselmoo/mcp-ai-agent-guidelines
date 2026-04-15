---
title: "flow-orchestrator"
description: "Use this skill when the user wants to work on Designing and managing complete multi-step AI task pipelines end-to-end. Triggers include \\\"design a workflow\\\", \\"
sidebar:
  label: "flow-orchestrator"
  badge:
    text: "Zero-Cost"
    variant: "success"
---

**Domain:** [`flow`](/mcp-ai-agent-guidelines/skills/workflows/) · **Model class:** `free`

## Description

Use this skill when the user wants to work on Designing and managing complete multi-step AI task pipelines end-to-end. Triggers include \"design a workflow\", \"orchestrate my AI pipeline\", \"build an end-to-end workflow\". Do NOT use when coordinate multiple distinct agents (use core-agent-orchestrator).

## Purpose

Designing and managing complete multi-step AI task pipelines end-to-end. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "design a workflow"
- "orchestrate my AI pipeline"
- "build an end-to-end workflow"
- "manage my task pipeline"

## Anti-Triggers

- coordinate multiple distinct agents (use core-agent-orchestrator)
- refine a single prompt (use core-prompt-refinement)

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

[orch-agent-orchestrator](/mcp-ai-agent-guidelines/skills/reference/orch-agent-orchestrator/) · [prompt-chaining](/mcp-ai-agent-guidelines/skills/reference/prompt-chaining/) · [flow-context-handoff](/mcp-ai-agent-guidelines/skills/reference/flow-context-handoff/)
