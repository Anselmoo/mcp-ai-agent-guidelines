---
title: "eval-variance"
description: "Use this skill when the user wants to work on Measuring output variance and flakiness across multiple runs to assess model consistency. Triggers include \\\"measu"
sidebar:
  label: "eval-variance"
  badge:
    text: "Efficient"
    variant: "caution"
---

**Domain:** [`eval`](/mcp-ai-agent-guidelines/skills/evaluation/) · **Model class:** `cheap`

## Description

Use this skill when the user wants to work on Measuring output variance and flakiness across multiple runs to assess model consistency. Triggers include \"measure output variance\", \"how flaky is my prompt\", \"consistency analysis\". Do NOT use when design the eval first (use core-eval-design).

## Purpose

Measuring output variance and flakiness across multiple runs to assess model consistency. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "measure output variance"
- "how flaky is my prompt"
- "consistency analysis"
- "repeated run benchmarking"
- "stability of my AI workflow"

## Anti-Triggers

- design the eval first (use core-eval-design)
- analyze quality vs cost tradeoffs after benchmarking

## Intake Questions

1. What is the user's goal and current state?
2. What constraints (time, team, compliance) apply?
3. Are there existing artifacts (specs, code, benchmarks) to reference?

## Output Contract

- evaluation criteria
- scoring or benchmark framing
- comparison-ready output
- decision guidance

## Related Skills

[eval-design](/mcp-ai-agent-guidelines/skills/reference/eval-design/) · [eval-prompt-bench](/mcp-ai-agent-guidelines/skills/reference/eval-prompt-bench/) · [eval-output-grading](/mcp-ai-agent-guidelines/skills/reference/eval-output-grading/)
