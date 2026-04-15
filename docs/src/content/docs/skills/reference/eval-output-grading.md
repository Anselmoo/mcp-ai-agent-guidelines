---
title: "eval-output-grading"
description: "Use this skill when the user wants to work on Grading AI outputs using rubrics, schema validation, pairwise comparison, and judge models. Triggers include \\\"gra"
sidebar:
  label: "eval-output-grading"
  badge:
    text: "Efficient"
    variant: "caution"
---

**Domain:** [`eval`](/mcp-ai-agent-guidelines/skills/evaluation/) · **Model class:** `cheap`

## Description

Use this skill when the user wants to work on Grading AI outputs using rubrics, schema validation, pairwise comparison, and judge models. Triggers include \"grade these outputs\", \"score AI responses\", \"rubric-based grading\". Do NOT use when design the grading criteria first (use core-eval-design).

## Purpose

Grading AI outputs using rubrics, schema validation, pairwise comparison, and judge models. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "grade these outputs"
- "score AI responses"
- "rubric-based grading"
- "validate output schema"
- "judge model outputs"
- "pairwise comparison"

## Anti-Triggers

- design the grading criteria first (use core-eval-design)
- measure variance across runs (use core-variance-analysis)

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

[eval-design](/mcp-ai-agent-guidelines/skills/reference/eval-design/) · [eval-prompt-bench](/mcp-ai-agent-guidelines/skills/reference/eval-prompt-bench/) · [eval-variance](/mcp-ai-agent-guidelines/skills/reference/eval-variance/)
