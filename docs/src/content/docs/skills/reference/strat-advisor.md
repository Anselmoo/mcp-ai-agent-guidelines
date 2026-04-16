---
title: "strat-advisor"
description: "Use this skill when the user wants to work on Framing technical strategy for AI adoption, platform design, and operating model decisions. Triggers include \\\"hel"
sidebar:
  label: "strat-advisor"
  badge:
    text: "Advanced"
    variant: "danger"
---

**Domain:** [`strat`](/mcp-ai-agent-guidelines/skills/strategy/) · **Model class:** `strong`

## Description

Use this skill when the user wants to work on Framing technical strategy for AI adoption, platform design, and operating model decisions. Triggers include \"help me build a technical strategy\", \"AI-first strategy\", \"what is our AI operating model\". Do NOT use when extract requirements first (use core-requirements-analysis).

## Purpose

Framing technical strategy for AI adoption, platform design, and operating model decisions. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "help me build a technical strategy"
- "AI-first strategy"
- "what is our AI operating model"
- "frame our AI adoption plan"

## Anti-Triggers

- extract requirements first (use core-requirements-analysis)
- synthesise research first (use core-research-assistant)

## Intake Questions

1. What is the user's goal and current state?
2. What constraints (time, team, compliance) apply?
3. Are there existing artifacts (specs, code, benchmarks) to reference?

## Output Contract

- prioritized plan
- tradeoff rationale
- sequencing guidance
- success metrics

## Related Skills

[strat-prioritization](/mcp-ai-agent-guidelines/skills/reference/strat-prioritization/) · [strat-tradeoff](/mcp-ai-agent-guidelines/skills/reference/strat-tradeoff/) · [strat-roadmap](/mcp-ai-agent-guidelines/skills/reference/strat-roadmap/)
