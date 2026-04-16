---
title: "eval-prompt-bench"
description: "Use this skill when the user wants to work on Running benchmarks to score prompts, compare versions, and detect regressions. Triggers include \\\"benchmark this p"
sidebar:
  label: "eval-prompt-bench"
  badge:
    text: "Efficient"
    variant: "caution"
---

**Domain:** [`eval`](/mcp-ai-agent-guidelines/skills/evaluation/) · **Model class:** `cheap`

## Description

Use this skill when the user wants to work on Running benchmarks to score prompts, compare versions, and detect regressions. Triggers include \"benchmark this prompt\", \"compare prompt versions\", \"detect prompt regressions\". Do NOT use when design the eval first (use core-eval-design).

## Purpose

Running benchmarks to score prompts, compare versions, and detect regressions. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "benchmark this prompt"
- "compare prompt versions"
- "detect prompt regressions"
- "run my eval suite"
- "score this prompt"

## Anti-Triggers

- design the eval first (use core-eval-design)
- grade individual outputs (use core-output-grading)

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

[eval-design](/mcp-ai-agent-guidelines/skills/reference/eval-design/) · [eval-output-grading](/mcp-ai-agent-guidelines/skills/reference/eval-output-grading/) · [eval-variance](/mcp-ai-agent-guidelines/skills/reference/eval-variance/)
