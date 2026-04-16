---
title: "req-ambiguity-detection"
description: "Use this skill when the user wants to work on Identifying underspecified, conflicting, or ambiguous requirements before implementation. Triggers include \\\"find "
sidebar:
  label: "req-ambiguity-detection"
  badge:
    text: "Zero-Cost"
    variant: "success"
---

**Domain:** [`req`](/mcp-ai-agent-guidelines/skills/requirements/) · **Model class:** `free`

## Description

Use this skill when the user wants to work on Identifying underspecified, conflicting, or ambiguous requirements before implementation. Triggers include \"find ambiguities in this spec\", \"what is unclear in these requirements\", \"flag missing constraints\". Do NOT use when extract the requirements first (use core-requirements-analysis).

## Purpose

Identifying underspecified, conflicting, or ambiguous requirements before implementation. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "find ambiguities in this spec"
- "what is unclear in these requirements"
- "flag missing constraints"
- "surface hidden assumptions"

## Anti-Triggers

- extract the requirements first (use core-requirements-analysis)
- clarify scope (use core-scope-clarification)

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

[req-analysis](/mcp-ai-agent-guidelines/skills/reference/req-analysis/) · [req-scope](/mcp-ai-agent-guidelines/skills/reference/req-scope/)
