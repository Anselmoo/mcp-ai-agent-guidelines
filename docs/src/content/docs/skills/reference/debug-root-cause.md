---
title: "debug-root-cause"
description: "Use this skill when the user wants to work on Tracing bugs and incidents back to their root cause using structured causal analysis. Triggers include \\\"find the "
sidebar:
  label: "debug-root-cause"
  badge:
    text: "Efficient"
    variant: "caution"
---

**Domain:** [`debug`](/mcp-ai-agent-guidelines/skills/debugging/) · **Model class:** `cheap`

## Description

Use this skill when the user wants to work on Tracing bugs and incidents back to their root cause using structured causal analysis. Triggers include \"find the root cause\", \"5-whys analysis\", \"causal chain for this bug\". Do NOT use when triage first (use core-debugging-assistant).

## Purpose

Tracing bugs and incidents back to their root cause using structured causal analysis. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "find the root cause"
- "5-whys analysis"
- "causal chain for this bug"
- "what is really causing this failure"
- "trace symptom to cause"

## Anti-Triggers

- triage first (use core-debugging-assistant)
- plan reproduction after RCA (use core-reproduction-planner)

## Intake Questions

1. What is the user's goal and current state?
2. What constraints (time, team, compliance) apply?
3. Are there existing artifacts (specs, code, benchmarks) to reference?

## Output Contract

- structured response
- actionable steps
- context-aware recommendations
- clear handoff or validation guidance

## Related Skills

[debug-assistant](/mcp-ai-agent-guidelines/skills/reference/debug-assistant/) · [debug-reproduction](/mcp-ai-agent-guidelines/skills/reference/debug-reproduction/)
