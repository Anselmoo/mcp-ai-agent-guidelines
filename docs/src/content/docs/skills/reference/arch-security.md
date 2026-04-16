---
title: "arch-security"
description: "Use this skill when the user wants to work on Designing AI workflows to resist prompt injection, tool misuse, and data leakage. Triggers include \\\"what are the "
sidebar:
  label: "arch-security"
  badge:
    text: "Advanced"
    variant: "danger"
---

**Domain:** [`arch`](/mcp-ai-agent-guidelines/skills/architecture/) · **Model class:** `strong`

## Description

Use this skill when the user wants to work on Designing AI workflows to resist prompt injection, tool misuse, and data leakage. Triggers include \"what are the security risks in my architecture\", \"secure my agent system\", \"prompt injection defense in architecture\". Do NOT use when review existing code for security issues (use core-security-review).

## Purpose

Designing AI workflows to resist prompt injection, tool misuse, and data leakage. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "what are the security risks in my architecture"
- "secure my agent system"
- "prompt injection defense in architecture"
- "least privilege agent design"

## Anti-Triggers

- review existing code for security issues (use core-security-review)
- harden a specific workflow (use gov-prompt-injection-hardening)

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

[arch-system](/mcp-ai-agent-guidelines/skills/reference/arch-system/) · [gov-prompt-injection-hardening](/mcp-ai-agent-guidelines/skills/reference/gov-prompt-injection-hardening/) · [qual-security](/mcp-ai-agent-guidelines/skills/reference/qual-security/)
