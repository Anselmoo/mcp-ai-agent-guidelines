---
title: "eval-design"
description: "Use this skill when the user wants to work on Designing high-quality eval datasets with realistic prompts, hard negatives, and discriminative assertions. Trigge"
sidebar:
  label: "eval-design"
  badge:
    text: "Efficient"
    variant: "caution"
---

**Domain:** [`eval`](/mcp-ai-agent-guidelines/skills/evaluation/) · **Model class:** `cheap`

## Description

Use this skill when the user wants to work on Designing high-quality eval datasets with realistic prompts, hard negatives, and discriminative assertions. Triggers include \"design an eval set\", \"build a benchmark dataset\", \"create test cases for my prompt\". Do NOT use when run the evals after designing them (use core-prompt-benchmarking).

## Purpose

Designing high-quality eval datasets with realistic prompts, hard negatives, and discriminative assertions. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "design an eval set"
- "build a benchmark dataset"
- "create test cases for my prompt"
- "how do I write good evals"
- "eval-first development"

## Anti-Triggers

- run the evals after designing them (use core-prompt-benchmarking)
- grade the outputs (use core-output-grading)

## Intake Questions

1. What is the user's goal and current state?
2. What constraints (time, team, compliance) apply?
3. Are there existing artifacts (specs, code, benchmarks) to reference?

## Output Contract

- evaluation criteria
- scoring or benchmark framing
- comparison-ready output
- decision guidance

## Related Skills

[eval-prompt-bench](/mcp-ai-agent-guidelines/skills/reference/eval-prompt-bench/) · [eval-output-grading](/mcp-ai-agent-guidelines/skills/reference/eval-output-grading/) · [eval-variance](/mcp-ai-agent-guidelines/skills/reference/eval-variance/)
