---
title: "eval-prompt"
description: "Use this skill when the user wants to work on Scoring and grading prompts against benchmark datasets and golden test sets. Triggers include \\\"evaluate this prom"
sidebar:
  label: "eval-prompt"
  badge:
    text: "Efficient"
    variant: "caution"
---

**Domain:** [`eval`](/mcp-ai-agent-guidelines/skills/evaluation/) · **Model class:** `cheap`

## Description

Use this skill when the user wants to work on Scoring and grading prompts against benchmark datasets and golden test sets. Triggers include \"evaluate this prompt\", \"score my prompt against test cases\", \"benchmark my prompt\". Do NOT use when refine the prompt after evaluation (use core-prompt-refinement).

## Purpose

Scoring and grading prompts against benchmark datasets and golden test sets. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "evaluate this prompt"
- "score my prompt against test cases"
- "benchmark my prompt"
- "how good is this prompt"
- "run an eval on my prompt"

## Anti-Triggers

- refine the prompt after evaluation (use core-prompt-refinement)
- design the eval dataset (use core-eval-design)

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

[prompt-refinement](/mcp-ai-agent-guidelines/skills/reference/prompt-refinement/) · [eval-design](/mcp-ai-agent-guidelines/skills/reference/eval-design/) · [eval-output-grading](/mcp-ai-agent-guidelines/skills/reference/eval-output-grading/)
