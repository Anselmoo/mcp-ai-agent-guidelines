---
title: "resil-redundant-voter"
description: "Use when a user wants to reduce hallucination rates or add fault-tolerance by running a node multiple times and voting on the result. Triggers: \\\"make this more"
sidebar:
  label: "resil-redundant-voter"
  badge:
    text: "Efficient"
    variant: "caution"
---

**Domain:** [`resil`](/mcp-ai-agent-guidelines/skills/resilience/) · **Model class:** `cheap`

## Description

Use when a user wants to reduce hallucination rates or add fault-tolerance by running a node multiple times and voting on the result. Triggers: \"make this more reliable\", \"reduce hallucinations\", \"run N times and pick the best\", \"Byzantine fault tolerance\", \"majority vote on agent output\", \"ISS-style redundancy\", \"N-modular redundancy\", outputs are \"inconsistent\" or \"sometimes wrong\" and the user wants a structural fix not a prompt tweak.

## Purpose

ISS quad-processor voting applied to LLM nodes. Run N identical sub-prompts in parallel (temperature-jittered), collect outputs, compute pairwise similarity, return the majority-cluster centroid.

## Trigger Phrases

- "make this more reliable"
- "reduce hallucinations"
- "run N times and pick the best"
- "Byzantine fault tolerance"
- "majority vote on agent output"
- "ISS-style redundancy"
- "N-modular redundancy"
- "outputs are inconsistent"
- "sometimes wrong"

## Anti-Triggers

- the user wants a one-off improvement without ongoing adaptation or structural change

## Intake Questions

1. What node or agent output needs fault-tolerance?
2. What n_replicas and similarity_threshold are appropriate?
3. What tiebreak strategy should apply (escalate, abstain, longest)?
4. What comparison mode is required (semantic, structural, exact)?

## Output Contract

- failure mode analysis
- recovery strategy
- operational checks
- validation notes

## Related Skills

[flow-orchestrator](/mcp-ai-agent-guidelines/skills/reference/flow-orchestrator/) · [orch-agent-orchestrator](/mcp-ai-agent-guidelines/skills/reference/orch-agent-orchestrator/) · [prompt-chaining](/mcp-ai-agent-guidelines/skills/reference/prompt-chaining/)
