---
title: "qual-refactoring-priority"
description: "Use this skill when the user wants to work on Ranking and prioritizing code refactoring work using churn, coupling, and business impact signals. Triggers includ"
sidebar:
  label: "qual-refactoring-priority"
  badge:
    text: "Efficient"
    variant: "caution"
---

**Domain:** [`qual`](/mcp-ai-agent-guidelines/skills/quality/) · **Model class:** `cheap`

## Description

Use this skill when the user wants to work on Ranking and prioritizing code refactoring work using churn, coupling, and business impact signals. Triggers include \"prioritize refactoring\", \"what should I refactor first\", \"technical debt ranking\". Do NOT use when analyze code quality in detail (use core-code-analysis).

## Purpose

Ranking and prioritizing code refactoring work using churn, coupling, and business impact signals. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "prioritize refactoring"
- "what should I refactor first"
- "technical debt ranking"
- "hotspot analysis for refactoring"
- "code debt core-prioritization"

## Anti-Triggers

- analyze code quality in detail (use core-code-analysis)
- design a refactoring strategy (use core-system-design)

## Intake Questions

1. What is the user's goal and current state?
2. What constraints (time, team, compliance) apply?
3. Are there existing artifacts (specs, code, benchmarks) to reference?

## Output Contract

- quality findings
- evidence-grounded issues
- prioritized fixes
- verification guidance

## Related Skills

[qual-code-analysis](/mcp-ai-agent-guidelines/skills/reference/qual-code-analysis/) · [qual-review](/mcp-ai-agent-guidelines/skills/reference/qual-review/) · [strat-prioritization](/mcp-ai-agent-guidelines/skills/reference/strat-prioritization/)
