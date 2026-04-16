---
title: "prompt-refinement"
description: "Use this skill when the user wants to work on Iteratively improving prompts based on measured failures and eval results. Triggers include \\\"optimize this prompt"
sidebar:
  label: "prompt-refinement"
  badge:
    text: "Efficient"
    variant: "caution"
---

**Domain:** [`prompt`](/mcp-ai-agent-guidelines/skills/prompting/) · **Model class:** `cheap`

## Description

Use this skill when the user wants to work on Iteratively improving prompts based on measured failures and eval results. Triggers include \"optimize this prompt\", \"improve my prompt\", \"my prompt keeps hallucinating\". Do NOT use when create a new prompt from scratch (use core-prompt-engineering).

## Purpose

Iteratively improving prompts based on measured failures and eval results. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "optimize this prompt"
- "improve my prompt"
- "my prompt keeps hallucinating"
- "refine based on eval results"
- "A/B compare prompt versions"

## Anti-Triggers

- create a new prompt from scratch (use core-prompt-engineering)
- run the initial evaluation (use core-prompt-evaluation)

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

[prompt-engineering](/mcp-ai-agent-guidelines/skills/reference/prompt-engineering/) · [eval-prompt](/mcp-ai-agent-guidelines/skills/reference/eval-prompt/) · [eval-variance](/mcp-ai-agent-guidelines/skills/reference/eval-variance/)
