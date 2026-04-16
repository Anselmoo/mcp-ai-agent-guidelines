---
title: "debug-postmortem"
description: "Use this skill when the user wants to work on Generating structured postmortems with timelines, root causes, impact, and action items. Triggers include \\\"genera"
sidebar:
  label: "debug-postmortem"
  badge:
    text: "Efficient"
    variant: "caution"
---

**Domain:** [`debug`](/mcp-ai-agent-guidelines/skills/debugging/) · **Model class:** `cheap`

## Description

Use this skill when the user wants to work on Generating structured postmortems with timelines, root causes, impact, and action items. Triggers include \"generate a postmortem\", \"write an incident report\", \"summarize this incident\". Do NOT use when triage the incident first (use core-debugging-assistant).

## Purpose

Generating structured postmortems with timelines, root causes, impact, and action items. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "generate a postmortem"
- "write an incident report"
- "summarize this incident"
- "extract action items from this outage"

## Anti-Triggers

- triage the incident first (use core-debugging-assistant)
- create a runbook to prevent recurrence (use core-runbook-generator)

## Intake Questions

1. What is the user's goal and current state?
2. What constraints (time, team, compliance) apply?
3. Are there existing artifacts (specs, code, benchmarks) to reference?

## Output Contract

- structured response
- actionable steps
- context-aware recommendations
- clear handoff or validation guidance

## Related Skills

[debug-assistant](/mcp-ai-agent-guidelines/skills/reference/debug-assistant/) · [doc-runbook](/mcp-ai-agent-guidelines/skills/reference/doc-runbook/)
