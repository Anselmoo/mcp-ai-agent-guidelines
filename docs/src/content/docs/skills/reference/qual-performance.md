---
title: "qual-performance"
description: "Use this skill when the user wants to work on Reviewing code for performance hotspots, token efficiency, inference cost, and latency. Triggers include \\\"analyze"
sidebar:
  label: "qual-performance"
  badge:
    text: "Efficient"
    variant: "caution"
---

**Domain:** [`qual`](/mcp-ai-agent-guidelines/skills/quality/) · **Model class:** `cheap`

## Description

Use this skill when the user wants to work on Reviewing code for performance hotspots, token efficiency, inference cost, and latency. Triggers include \"analyze performance\", \"find performance hotspots\", \"optimize token usage\". Do NOT use when analyze overall code structure (use core-code-analysis).

## Purpose

Reviewing code for performance hotspots, token efficiency, inference cost, and latency. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "analyze performance"
- "find performance hotspots"
- "optimize token usage"
- "reduce inference latency"
- "measure AI workflow cost"

## Anti-Triggers

- analyze overall code structure (use core-code-analysis)
- design for scalability (use core-scalability-design)

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

[qual-code-analysis](/mcp-ai-agent-guidelines/skills/reference/qual-code-analysis/) · [arch-scalability](/mcp-ai-agent-guidelines/skills/reference/arch-scalability/)
