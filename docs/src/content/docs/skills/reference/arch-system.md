---
title: "arch-system"
description: "Use this skill when the user wants to work on Designing AI-native systems with agent layers, memory, retrieval, safety, and observability. Triggers include \\\"de"
sidebar:
  label: "arch-system"
  badge:
    text: "Advanced"
    variant: "danger"
---

**Domain:** [`arch`](/mcp-ai-agent-guidelines/skills/architecture/) · **Model class:** `strong`

## Description

Use this skill when the user wants to work on Designing AI-native systems with agent layers, memory, retrieval, safety, and observability. Triggers include \"design an AI-native system\", \"architect my agent platform\", \"how do I structure my AI application\". Do NOT use when review existing code quality (use code-analysis-quality).

## Purpose

Designing AI-native systems with agent layers, memory, retrieval, safety, and observability. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "design an AI-native system"
- "architect my agent platform"
- "how do I structure my AI application"
- "system architecture for AI"

## Anti-Triggers

- review existing code quality (use code-analysis-quality)
- debug a runtime issue (use core-debugging-assistant)

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

[arch-scalability](/mcp-ai-agent-guidelines/skills/reference/arch-scalability/) · [arch-security](/mcp-ai-agent-guidelines/skills/reference/arch-security/) · [arch-reliability](/mcp-ai-agent-guidelines/skills/reference/arch-reliability/)
