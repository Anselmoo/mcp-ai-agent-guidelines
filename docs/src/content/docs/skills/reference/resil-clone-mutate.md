---
title: "resil-clone-mutate"
description: "Use when workflow quality degrades over time or a specific node produces worse outputs than it used to, and the user wants automatic recovery without manual pro"
sidebar:
  label: "resil-clone-mutate"
  badge:
    text: "Efficient"
    variant: "caution"
---

**Domain:** [`resil`](/mcp-ai-agent-guidelines/skills/resilience/) · **Model class:** `cheap`

## Description

Use when workflow quality degrades over time or a specific node produces worse outputs than it used to, and the user wants automatic recovery without manual prompt tweaking. Triggers: \"self-healing prompt\", \"auto-fix broken agent\", \"evolve the prompt when it fails\", \"immune system for workflows\", \"clonal selection\", \"mutate and compete\", \"adaptive prompt improvement\", workflow \"used to work but now it doesn't\" and user wants automated recovery.

## Purpose

Monitor per-node rolling quality. When consecutive_failures runs fall below quality_threshold, clone N times with mutation strategies, run tournament, promote winner if beats original by promote_threshold.

## Trigger Phrases

- "self-healing prompt"
- "auto-fix broken agent"
- "evolve the prompt when it fails"
- "immune system for workflows"
- "clonal selection"
- "mutate and compete"
- "adaptive prompt improvement"
- "used to work but now it doesn't"

## Anti-Triggers

- the user wants a one-off improvement without ongoing adaptation or structural change

## Intake Questions

1. Which node is degrading and how is quality measured?
2. What consecutive failure threshold should trigger mutation?
3. Which mutation types are allowed in production?
4. How should mutated winners be promoted and audited?

## Output Contract

- failure mode analysis
- recovery strategy
- operational checks
- validation notes

## Related Skills

[flow-orchestrator](/mcp-ai-agent-guidelines/skills/reference/flow-orchestrator/) · [orch-agent-orchestrator](/mcp-ai-agent-guidelines/skills/reference/orch-agent-orchestrator/) · [prompt-chaining](/mcp-ai-agent-guidelines/skills/reference/prompt-chaining/)
