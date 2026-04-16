---
title: "bench-eval-suite"
description: "Use this skill when the user wants to work on Designing comprehensive evaluation suites covering multiple dimensions of AI system quality. Triggers include \\\"de"
sidebar:
  label: "bench-eval-suite"
  badge:
    text: "Efficient"
    variant: "caution"
---

**Domain:** [`bench`](/mcp-ai-agent-guidelines/skills/benchmarking/) · **Model class:** `cheap`

## Description

Use this skill when the user wants to work on Designing comprehensive evaluation suites covering multiple dimensions of AI system quality. Triggers include \"design a comprehensive eval suite\", \"multi-dimensional evaluation framework\", \"end-to-end eval suite for my AI system\". Do NOT use when run individual benchmarks (use core-prompt-benchmarking).

## Purpose

Designing comprehensive evaluation suites covering multiple dimensions of AI system quality. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "design a comprehensive eval suite"
- "multi-dimensional evaluation framework"
- "end-to-end eval suite for my AI system"
- "what evals do I need for production readiness"

## Anti-Triggers

- run individual benchmarks (use core-prompt-benchmarking)
- analyze results (use adv-benchmark-analyzer)

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

[bench-analyzer](/mcp-ai-agent-guidelines/skills/reference/bench-analyzer/) · [bench-blind-comparison](/mcp-ai-agent-guidelines/skills/reference/bench-blind-comparison/) · [eval-design](/mcp-ai-agent-guidelines/skills/reference/eval-design/)
