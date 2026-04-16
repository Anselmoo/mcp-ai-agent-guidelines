---
title: "flow-context-handoff"
description: "Use this skill when the user wants to work on Structuring and transferring relevant context between workflow steps and agents. Triggers include \\\"how do I pass "
sidebar:
  label: "flow-context-handoff"
  badge:
    text: "Zero-Cost"
    variant: "success"
---

**Domain:** [`flow`](/mcp-ai-agent-guidelines/skills/workflows/) · **Model class:** `free`

## Description

Use this skill when the user wants to work on Structuring and transferring relevant context between workflow steps and agents. Triggers include \"how do I pass context between steps\", \"manage context window across steps\", \"context handoff strategy\". Do NOT use when design the full pipeline (use core-workflow-orchestrator).

## Purpose

Structuring and transferring relevant context between workflow steps and agents. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "how do I pass context between steps"
- "manage context window across steps"
- "context handoff strategy"
- "serialize state for next agent"

## Anti-Triggers

- design the full pipeline (use core-workflow-orchestrator)
- retrieve context from documents (use core-research-assistant)

## Intake Questions

1. What is the user's goal and current state?
2. What constraints (time, team, compliance) apply?
3. Are there existing artifacts (specs, code, benchmarks) to reference?

## Output Contract

- handoff-ready artifact
- phase sequencing guidance
- state transition notes
- validation or resume guidance

## Related Skills

[flow-orchestrator](/mcp-ai-agent-guidelines/skills/reference/flow-orchestrator/) · [prompt-chaining](/mcp-ai-agent-guidelines/skills/reference/prompt-chaining/) · [orch-agent-orchestrator](/mcp-ai-agent-guidelines/skills/reference/orch-agent-orchestrator/)
