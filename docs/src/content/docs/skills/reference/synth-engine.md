---
title: "synth-engine"
description: "Use this skill when the user wants to work on Synthesising scattered evidence and research material into structured summaries and insights. Triggers include \\\"s"
sidebar:
  label: "synth-engine"
  badge:
    text: "Efficient"
    variant: "caution"
---

**Domain:** [`synth`](/mcp-ai-agent-guidelines/skills/research/) · **Model class:** `cheap`

## Description

Use this skill when the user wants to work on Synthesising scattered evidence and research material into structured summaries and insights. Triggers include \"synthesise these sources\", \"create a structured summary from these documents\", \"distil key findings\". Do NOT use when gather more material first (use core-research-assistant).

## Purpose

Synthesising scattered evidence and research material into structured summaries and insights. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "synthesise these sources"
- "create a structured summary from these documents"
- "distil key findings"
- "turn this research into insights"

## Anti-Triggers

- gather more material first (use core-research-assistant)
- frame the recommendation (use core-recommendation-framing)

## Intake Questions

1. What is the user's goal and current state?
2. What constraints (time, team, compliance) apply?
3. Are there existing artifacts (specs, code, benchmarks) to reference?

## Output Contract

- structured synthesis
- comparison or recommendation artifact
- evidence summary
- confidence and next action

## Related Skills

[synth-research](/mcp-ai-agent-guidelines/skills/reference/synth-research/) · [synth-comparative](/mcp-ai-agent-guidelines/skills/reference/synth-comparative/) · [synth-recommendation](/mcp-ai-agent-guidelines/skills/reference/synth-recommendation/)
