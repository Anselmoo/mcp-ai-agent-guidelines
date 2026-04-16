---
title: "prompt-chaining"
description: "Use this skill when the user wants to work on Sequencing multiple prompts where output from one step feeds into the next. Triggers include \\\"chain these prompts"
sidebar:
  label: "prompt-chaining"
  badge:
    text: "Efficient"
    variant: "caution"
---

**Domain:** [`prompt`](/mcp-ai-agent-guidelines/skills/prompting/) · **Model class:** `cheap`

## Description

Use this skill when the user wants to work on Sequencing multiple prompts where output from one step feeds into the next. Triggers include \"chain these prompts\", \"pass output from one prompt to another\", \"sequential prompt pipeline\". Do NOT use when coordinate agents (use core-agent-orchestrator).

## Purpose

Sequencing multiple prompts where output from one step feeds into the next. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "chain these prompts"
- "pass output from one prompt to another"
- "sequential prompt pipeline"
- "multi-step prompting"

## Anti-Triggers

- coordinate agents (use core-agent-orchestrator)
- design the full pipeline (use core-workflow-orchestrator)

## Intake Questions

1. What is the user's goal and current state?
2. What constraints (time, team, compliance) apply?
3. Are there existing artifacts (specs, code, benchmarks) to reference?

## Output Contract

- prompt asset
- explicit output contract
- failure handling
- worked example or usage guidance

## Related Skills

[flow-orchestrator](/mcp-ai-agent-guidelines/skills/reference/flow-orchestrator/) · [flow-context-handoff](/mcp-ai-agent-guidelines/skills/reference/flow-context-handoff/) · [flow-mode-switching](/mcp-ai-agent-guidelines/skills/reference/flow-mode-switching/)
