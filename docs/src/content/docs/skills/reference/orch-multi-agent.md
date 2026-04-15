---
title: "orch-multi-agent"
description: "Use this skill when the user wants to work on Designing the architecture and roles of multi-agent systems. Triggers include \\\"design a multi-agent system\\\", \\\"w"
sidebar:
  label: "orch-multi-agent"
  badge:
    text: "Advanced"
    variant: "danger"
---

**Domain:** [`orch`](/mcp-ai-agent-guidelines/skills/orchestration/) · **Model class:** `strong`

## Description

Use this skill when the user wants to work on Designing the architecture and roles of multi-agent systems. Triggers include \"design a multi-agent system\", \"what roles should my agents have\", \"set up specialist agents\". Do NOT use when implement the coordination logic (use core-agent-orchestrator).

## Purpose

Designing the architecture and roles of multi-agent systems. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "design a multi-agent system"
- "what roles should my agents have"
- "set up specialist agents"
- "multi-agent architecture"

## Anti-Triggers

- implement the coordination logic (use core-agent-orchestrator)
- synthesize agent outputs (use core-result-synthesis)

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

[orch-agent-orchestrator](/mcp-ai-agent-guidelines/skills/reference/orch-agent-orchestrator/) · [orch-delegation](/mcp-ai-agent-guidelines/skills/reference/orch-delegation/) · [arch-system](/mcp-ai-agent-guidelines/skills/reference/arch-system/)
