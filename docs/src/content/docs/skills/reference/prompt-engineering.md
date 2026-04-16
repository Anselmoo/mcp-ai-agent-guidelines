---
title: "prompt-engineering"
description: "Use this skill when the user wants to work on Creating, templating, and versioning prompt assets for AI models. Triggers include \\\"write a system prompt\\\", \\\"bu"
sidebar:
  label: "prompt-engineering"
  badge:
    text: "Efficient"
    variant: "caution"
---

**Domain:** [`prompt`](/mcp-ai-agent-guidelines/skills/prompting/) · **Model class:** `cheap`

## Description

Use this skill when the user wants to work on Creating, templating, and versioning prompt assets for AI models. Triggers include \"write a system prompt\", \"build a prompt template\", \"how do I structure my prompt\". Do NOT use when refine an existing prompt (use core-prompt-refinement).

## Purpose

Creating, templating, and versioning prompt assets for AI models. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "write a system prompt"
- "build a prompt template"
- "how do I structure my prompt"
- "create a reusable prompt"
- "prompt versioning"

## Anti-Triggers

- refine an existing prompt (use core-prompt-refinement)
- evaluate prompt quality (use core-prompt-evaluation)

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

[prompt-refinement](/mcp-ai-agent-guidelines/skills/reference/prompt-refinement/) · [eval-prompt](/mcp-ai-agent-guidelines/skills/reference/eval-prompt/) · [eval-design](/mcp-ai-agent-guidelines/skills/reference/eval-design/)
