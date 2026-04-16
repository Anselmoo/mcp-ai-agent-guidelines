---
title: "debug-reproduction"
description: "Use this skill when the user wants to work on Planning minimal reproduction steps for bugs to make them reliably reproducible. Triggers include \\\"plan reproduct"
sidebar:
  label: "debug-reproduction"
  badge:
    text: "Efficient"
    variant: "caution"
---

**Domain:** [`debug`](/mcp-ai-agent-guidelines/skills/debugging/) · **Model class:** `cheap`

## Description

Use this skill when the user wants to work on Planning minimal reproduction steps for bugs to make them reliably reproducible. Triggers include \"plan reproduction steps\", \"write a repro for this bug\", \"minimal failing test case\". Do NOT use when triage first (use core-debugging-assistant).

## Purpose

Planning minimal reproduction steps for bugs to make them reliably reproducible. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "plan reproduction steps"
- "write a repro for this bug"
- "minimal failing test case"
- "how do I reproduce this issue reliably"

## Anti-Triggers

- triage first (use core-debugging-assistant)
- analyze root cause (use core-root-cause-analysis)

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

[debug-assistant](/mcp-ai-agent-guidelines/skills/reference/debug-assistant/) · [debug-root-cause](/mcp-ai-agent-guidelines/skills/reference/debug-root-cause/)
