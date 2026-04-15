---
title: "debug-assistant"
description: "Use this skill when the user wants to work on Providing structured triage and diagnosis for bugs, errors, crashes, and unexpected AI behaviour. Triggers include"
sidebar:
  label: "debug-assistant"
  badge:
    text: "Efficient"
    variant: "caution"
---

**Domain:** [`debug`](/mcp-ai-agent-guidelines/skills/debugging/) · **Model class:** `cheap`

## Description

Use this skill when the user wants to work on Providing structured triage and diagnosis for bugs, errors, crashes, and unexpected AI behaviour. Triggers include \"triage this error\", \"help me debug this\", \"something is broken\". Do NOT use when do a full root cause analysis (use core-root-cause-analysis).

## Purpose

Providing structured triage and diagnosis for bugs, errors, crashes, and unexpected AI behaviour. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "triage this error"
- "help me debug this"
- "something is broken"
- "unexpected behaviour in my AI system"
- "debug this failure"

## Anti-Triggers

- do a full root cause analysis (use core-root-cause-analysis)
- plan reproduction steps (use core-reproduction-planner)

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

[debug-root-cause](/mcp-ai-agent-guidelines/skills/reference/debug-root-cause/) · [debug-reproduction](/mcp-ai-agent-guidelines/skills/reference/debug-reproduction/) · [debug-postmortem](/mcp-ai-agent-guidelines/skills/reference/debug-postmortem/)
