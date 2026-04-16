---
title: "req-acceptance-criteria"
description: "Use this skill when the user wants to work on Generating clear, testable, and eval-ready acceptance criteria from requirements. Triggers include \\\"write accepta"
sidebar:
  label: "req-acceptance-criteria"
  badge:
    text: "Zero-Cost"
    variant: "success"
---

**Domain:** [`req`](/mcp-ai-agent-guidelines/skills/requirements/) · **Model class:** `free`

## Description

Use this skill when the user wants to work on Generating clear, testable, and eval-ready acceptance criteria from requirements. Triggers include \"write acceptance criteria\", \"turn requirements into testable criteria\", \"generate success criteria\". Do NOT use when extract requirements first (use core-requirements-analysis).

## Purpose

Generating clear, testable, and eval-ready acceptance criteria from requirements. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "write acceptance criteria"
- "turn requirements into testable criteria"
- "generate success criteria"
- "how do I verify this requirement is met"

## Anti-Triggers

- extract requirements first (use core-requirements-analysis)
- run evals against criteria (use core-eval-design)

## Intake Questions

1. What is the user's goal and current state?
2. What constraints (time, team, compliance) apply?
3. Are there existing artifacts (specs, code, benchmarks) to reference?

## Output Contract

- structured requirements
- constraints or acceptance criteria
- scope boundaries
- prioritized next actions

## Related Skills

[req-analysis](/mcp-ai-agent-guidelines/skills/reference/req-analysis/) · [eval-design](/mcp-ai-agent-guidelines/skills/reference/eval-design/)
