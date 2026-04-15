---
title: "qual-code-analysis"
description: "Use this skill when the user wants to work on Analyzing code structure, coupling, complexity, and maintainability across a codebase. Triggers include \\\"analyze "
sidebar:
  label: "qual-code-analysis"
  badge:
    text: "Efficient"
    variant: "caution"
---

**Domain:** [`qual`](/mcp-ai-agent-guidelines/skills/quality/) · **Model class:** `cheap`

## Description

Use this skill when the user wants to work on Analyzing code structure, coupling, complexity, and maintainability across a codebase. Triggers include \"analyze this codebase\", \"measure code complexity\", \"find coupling issues\". Do NOT use when review for security vulnerabilities (use core-security-review).

## Purpose

Analyzing code structure, coupling, complexity, and maintainability across a codebase. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "analyze this codebase"
- "measure code complexity"
- "find coupling issues"
- "check code maintainability"
- "repository code analysis"

## Anti-Triggers

- review for security vulnerabilities (use core-security-review)
- diagnose a specific bug (use core-debugging-assistant)

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

[qual-review](/mcp-ai-agent-guidelines/skills/reference/qual-review/) · [qual-security](/mcp-ai-agent-guidelines/skills/reference/qual-security/) · [qual-performance](/mcp-ai-agent-guidelines/skills/reference/qual-performance/) · [qual-refactoring-priority](/mcp-ai-agent-guidelines/skills/reference/qual-refactoring-priority/)
