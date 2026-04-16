---
title: "bench-analyzer"
description: "Use this skill when the user wants to work on Analyzing benchmark results to identify quality trends, regressions, and performance signals. Triggers include \\\"a"
sidebar:
  label: "bench-analyzer"
  badge:
    text: "Efficient"
    variant: "caution"
---

**Domain:** [`bench`](/mcp-ai-agent-guidelines/skills/benchmarking/) · **Model class:** `cheap`

## Description

Use this skill when the user wants to work on Analyzing benchmark results to identify quality trends, regressions, and performance signals. Triggers include \"analyze benchmark results\", \"interpret my eval results\", \"quality trends from benchmarks\". Do NOT use when design the benchmark (use core-eval-design).

## Purpose

Analyzing benchmark results to identify quality trends, regressions, and performance signals. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "analyze benchmark results"
- "interpret my eval results"
- "quality trends from benchmarks"
- "regression analysis from evals"

## Anti-Triggers

- design the benchmark (use core-eval-design)
- grade individual outputs (use core-output-grading)

## Intake Questions

1. What is the user's goal and current state?
2. What constraints (time, team, compliance) apply?
3. Are there existing artifacts (specs, code, benchmarks) to reference?

## Output Contract

- benchmark analysis summary
- trend or regression findings
- comparison-ready evidence
- follow-up actions

## Related Skills

[bench-blind-comparison](/mcp-ai-agent-guidelines/skills/reference/bench-blind-comparison/) · [bench-eval-suite](/mcp-ai-agent-guidelines/skills/reference/bench-eval-suite/) · [eval-variance](/mcp-ai-agent-guidelines/skills/reference/eval-variance/)
