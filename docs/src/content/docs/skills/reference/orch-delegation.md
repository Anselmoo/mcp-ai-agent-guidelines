---
title: "orch-delegation"
description: "Use this skill when the user wants to work on Defining how and when tasks are delegated to specialist subagents. Triggers include \\\"how should I delegate tasks "
sidebar:
  label: "orch-delegation"
  badge:
    text: "Advanced"
    variant: "danger"
---

**Domain:** [`orch`](/mcp-ai-agent-guidelines/skills/orchestration/) · **Model class:** `strong`

## Description

Use this skill when the user wants to work on Defining how and when tasks are delegated to specialist subagents. Triggers include \"how should I delegate tasks to subagents\", \"delegation strategy for my agent system\", \"route by capability boundary\". Do NOT use when design the overall multi-agent architecture (use core-multi-agent-design).

## Purpose

Defining how and when tasks are delegated to specialist subagents. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "how should I delegate tasks to subagents"
- "delegation strategy for my agent system"
- "route by capability boundary"
- "subagent task assignment"

## Anti-Triggers

- design the overall multi-agent architecture (use core-multi-agent-design)
- set up the lead agent (use core-agent-orchestrator)

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

[orch-agent-orchestrator](/mcp-ai-agent-guidelines/skills/reference/orch-agent-orchestrator/) · [orch-multi-agent](/mcp-ai-agent-guidelines/skills/reference/orch-multi-agent/) · [gov-workflow-compliance](/mcp-ai-agent-guidelines/skills/reference/gov-workflow-compliance/)
