---
title: "arch-reliability"
description: "Use this skill when the user wants to work on Designing AI systems for workflow consistency, retry logic, fallbacks, and quality gates. Triggers include \\\"desig"
sidebar:
  label: "arch-reliability"
  badge:
    text: "Advanced"
    variant: "danger"
---

**Domain:** [`arch`](/mcp-ai-agent-guidelines/skills/architecture/) · **Model class:** `strong`

## Description

Use this skill when the user wants to work on Designing AI systems for workflow consistency, retry logic, fallbacks, and quality gates. Triggers include \"design for reliability\", \"how do I add fallbacks to my agent\", \"quality gates in my pipeline\". Do NOT use when design the initial system (use core-system-design).

## Purpose

Designing AI systems for workflow consistency, retry logic, fallbacks, and quality gates. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "design for reliability"
- "how do I add fallbacks to my agent"
- "quality gates in my pipeline"
- "deterministic wrappers for non-deterministic models"

## Anti-Triggers

- design the initial system (use core-system-design)
- debug a reliability failure (use core-debugging-assistant)

## Intake Questions

1. What is the user's goal and current state?
2. What constraints (time, team, compliance) apply?
3. Are there existing artifacts (specs, code, benchmarks) to reference?

## Output Contract

- architecture recommendation
- tradeoff summary
- system component framing
- risk and next-step guidance

## Related Skills

[arch-system](/mcp-ai-agent-guidelines/skills/reference/arch-system/) · [flow-orchestrator](/mcp-ai-agent-guidelines/skills/reference/flow-orchestrator/) · [eval-variance](/mcp-ai-agent-guidelines/skills/reference/eval-variance/)
