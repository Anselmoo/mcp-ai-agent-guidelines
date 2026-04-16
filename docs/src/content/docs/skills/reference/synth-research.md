---
title: "synth-research"
description: "Use this skill when the user wants to work on Gathering and structuring information from multiple sources into organized research material. Triggers include \\\"g"
sidebar:
  label: "synth-research"
  badge:
    text: "Efficient"
    variant: "caution"
---

**Domain:** [`synth`](/mcp-ai-agent-guidelines/skills/research/) · **Model class:** `cheap`

## Description

Use this skill when the user wants to work on Gathering and structuring information from multiple sources into organized research material. Triggers include \"gather research on this topic\", \"collect sources about this subject\", \"research this for me\". Do NOT use when synthesise the gathered material (use core-synthesis-engine).

## Purpose

Gathering and structuring information from multiple sources into organized research material. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "gather research on this topic"
- "collect sources about this subject"
- "research this for me"
- "find information about"
- "deep research on"

## Anti-Triggers

- synthesise the gathered material (use core-synthesis-engine)
- compare options (use core-comparative-analysis)

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

[synth-engine](/mcp-ai-agent-guidelines/skills/reference/synth-engine/) · [synth-comparative](/mcp-ai-agent-guidelines/skills/reference/synth-comparative/) · [synth-recommendation](/mcp-ai-agent-guidelines/skills/reference/synth-recommendation/)
