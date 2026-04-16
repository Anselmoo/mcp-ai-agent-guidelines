---
title: "bench-blind-comparison"
description: "Use this skill when the user wants to work on Running blind pairwise comparisons between AI outputs to remove bias from evaluation. Triggers include \\\"blind com"
sidebar:
  label: "bench-blind-comparison"
  badge:
    text: "Efficient"
    variant: "caution"
---

**Domain:** [`bench`](/mcp-ai-agent-guidelines/skills/benchmarking/) · **Model class:** `cheap`

## Description

Use this skill when the user wants to work on Running blind pairwise comparisons between AI outputs to remove bias from evaluation. Triggers include \"blind comparison of outputs\", \"pairwise eval without bias\", \"A/B test my prompts blindly\". Do NOT use when design the eval suite (use adv-eval-suite-designer).

## Purpose

Running blind pairwise comparisons between AI outputs to remove bias from evaluation. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "blind comparison of outputs"
- "pairwise eval without bias"
- "A/B test my prompts blindly"
- "unbiased prompt comparison"

## Anti-Triggers

- design the eval suite (use adv-eval-suite-designer)
- analyze benchmark trends (use adv-benchmark-analyzer)

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

[bench-analyzer](/mcp-ai-agent-guidelines/skills/reference/bench-analyzer/) · [bench-eval-suite](/mcp-ai-agent-guidelines/skills/reference/bench-eval-suite/) · [eval-output-grading](/mcp-ai-agent-guidelines/skills/reference/eval-output-grading/)
