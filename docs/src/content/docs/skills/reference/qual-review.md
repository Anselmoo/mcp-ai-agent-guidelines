---
title: "qual-review"
description: "Use this skill when the user wants to work on Reviewing code for readability, maintainability, and adherence to quality standards. Triggers include \\\"review thi"
sidebar:
  label: "qual-review"
  badge:
    text: "Efficient"
    variant: "caution"
---

**Domain:** [`qual`](/mcp-ai-agent-guidelines/skills/quality/) · **Model class:** `cheap`

## Description

Use this skill when the user wants to work on Reviewing code for readability, maintainability, and adherence to quality standards. Triggers include \"review this code for quality\", \"code review for maintainability\", \"check code readability\". Do NOT use when analyze performance (use core-performance-review).

## Purpose

Reviewing code for readability, maintainability, and adherence to quality standards. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "review this code for quality"
- "code review for maintainability"
- "check code readability"
- "is this code well-structured"

## Anti-Triggers

- analyze performance (use core-performance-review)
- find security issues (use core-security-review)

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

[qual-code-analysis](/mcp-ai-agent-guidelines/skills/reference/qual-code-analysis/) · [qual-refactoring-priority](/mcp-ai-agent-guidelines/skills/reference/qual-refactoring-priority/) · [eval-output-grading](/mcp-ai-agent-guidelines/skills/reference/eval-output-grading/)
