---
title: "orch-agent-orchestrator"
description: "Use this skill when the user wants to work on Coordinating multiple specialized agents on a shared task with explicit routing and control. Triggers include \\\"co"
sidebar:
  label: "orch-agent-orchestrator"
  badge:
    text: "Advanced"
    variant: "danger"
---

**Domain:** [`orch`](/mcp-ai-agent-guidelines/skills/orchestration/) · **Model class:** `strong`

## Description

Use this skill when the user wants to work on Coordinating multiple specialized agents on a shared task with explicit routing and control. Triggers include \"coordinate multiple agents\", \"set up agent coordination\", \"orchestrate specialized agents\". Do NOT use when design a single-agent pipeline (use core-workflow-orchestrator).

## Purpose

Coordinating multiple specialized agents on a shared task with explicit routing and control. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "coordinate multiple agents"
- "set up agent coordination"
- "orchestrate specialized agents"
- "route tasks between agents"

## Anti-Triggers

- design a single-agent pipeline (use core-workflow-orchestrator)
- define the delegation strategy in detail (use core-delegation-strategy)

## Intake Questions

1. What is the user's goal and current state?
2. What constraints (time, team, compliance) apply?
3. Are there existing artifacts (specs, code, benchmarks) to reference?

## Output Contract

- orchestration topology
- agent responsibility map
- control-loop or validation contract
- handoff guidance

## Related Skills

[orch-delegation](/mcp-ai-agent-guidelines/skills/reference/orch-delegation/) · [orch-multi-agent](/mcp-ai-agent-guidelines/skills/reference/orch-multi-agent/) · [orch-result-synthesis](/mcp-ai-agent-guidelines/skills/reference/orch-result-synthesis/)
