---
title: "gov-prompt-injection-hardening"
description: "Use this skill when the user wants to work on Hardening AI workflows against prompt injection, indirect injection, and instruction hijacking. Triggers include \\"
sidebar:
  label: "gov-prompt-injection-hardening"
  badge:
    text: "Advanced"
    variant: "danger"
---

**Domain:** [`gov`](/mcp-ai-agent-guidelines/skills/governance/) · **Model class:** `strong`

## Description

Use this skill when the user wants to work on Hardening AI workflows against prompt injection, indirect injection, and instruction hijacking. Triggers include \"harden against prompt injection\", \"prompt injection defense\", \"protect my RAG pipeline from injection\". Do NOT use when design secure architecture (use core-security-design).

## Purpose

Hardening AI workflows against prompt injection, indirect injection, and instruction hijacking. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "harden against prompt injection"
- "prompt injection defense"
- "protect my RAG pipeline from injection"
- "secure my agent from indirect injection"

## Anti-Triggers

- design secure architecture (use core-security-design)
- review code for vulnerabilities (use core-security-review)

## Intake Questions

1. What is the user's goal and current state?
2. What constraints (time, team, compliance) apply?
3. Are there existing artifacts (specs, code, benchmarks) to reference?

## Output Contract

- policy or compliance assessment
- risk classification
- required controls
- audit trail or remediation steps

## Related Skills

[gov-workflow-compliance](/mcp-ai-agent-guidelines/skills/reference/gov-workflow-compliance/) · [arch-security](/mcp-ai-agent-guidelines/skills/reference/arch-security/)
