---
title: "orch-result-synthesis"
description: "Use this skill when the user wants to work on Aggregating and reconciling outputs from multiple agents into one coherent result. Triggers include \\\"synthesize a"
sidebar:
  label: "orch-result-synthesis"
  badge:
    text: "Advanced"
    variant: "danger"
---

**Domain:** [`orch`](/mcp-ai-agent-guidelines/skills/orchestration/) · **Model class:** `strong`

## Description

Use this skill when the user wants to work on Aggregating and reconciling outputs from multiple agents into one coherent result. Triggers include \"synthesize agent outputs\", \"merge results from multiple agents\", \"reconcile conflicting agent answers\". Do NOT use when design the agent roles (use core-multi-agent-design).

## Purpose

Aggregating and reconciling outputs from multiple agents into one coherent result. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "synthesize agent outputs"
- "merge results from multiple agents"
- "reconcile conflicting agent answers"
- "final output assembly from agents"

## Anti-Triggers

- design the agent roles (use core-multi-agent-design)
- coordinate agents (use core-agent-orchestrator)

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

[orch-agent-orchestrator](/mcp-ai-agent-guidelines/skills/reference/orch-agent-orchestrator/) · [synth-engine](/mcp-ai-agent-guidelines/skills/reference/synth-engine/)
