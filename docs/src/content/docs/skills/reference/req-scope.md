---
title: "req-scope"
description: "Use this skill when the user wants to work on Explicitly bounding work, separating must-haves from nice-to-haves, and preventing scope creep. Triggers include \\"
sidebar:
  label: "req-scope"
  badge:
    text: "Zero-Cost"
    variant: "success"
---

**Domain:** [`req`](/mcp-ai-agent-guidelines/skills/requirements/) · **Model class:** `free`

## Description

Use this skill when the user wants to work on Explicitly bounding work, separating must-haves from nice-to-haves, and preventing scope creep. Triggers include \"clarify the scope\", \"what is in and out of scope\", \"bound the work\". Do NOT use when extract requirements (use core-requirements-analysis).

## Purpose

Explicitly bounding work, separating must-haves from nice-to-haves, and preventing scope creep. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "clarify the scope"
- "what is in and out of scope"
- "bound the work"
- "prevent scope creep"
- "must-have vs nice-to-have"

## Anti-Triggers

- extract requirements (use core-requirements-analysis)
- frame strategic decision (use core-strategy-advisor)

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

[req-analysis](/mcp-ai-agent-guidelines/skills/reference/req-analysis/) · [req-ambiguity-detection](/mcp-ai-agent-guidelines/skills/reference/req-ambiguity-detection/) · [strat-advisor](/mcp-ai-agent-guidelines/skills/reference/strat-advisor/)
