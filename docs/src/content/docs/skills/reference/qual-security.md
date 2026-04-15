---
title: "qual-security"
description: "Use this skill when the user wants to work on Reviewing code for security vulnerabilities, secret exposure, and unsafe patterns. Triggers include \\\"find securit"
sidebar:
  label: "qual-security"
  badge:
    text: "Efficient"
    variant: "caution"
---

**Domain:** [`qual`](/mcp-ai-agent-guidelines/skills/quality/) · **Model class:** `cheap`

## Description

Use this skill when the user wants to work on Reviewing code for security vulnerabilities, secret exposure, and unsafe patterns. Triggers include \"find security issues in my code\", \"security code review\", \"check for vulnerabilities\". Do NOT use when design secure architecture (use core-security-design).

## Purpose

Reviewing code for security vulnerabilities, secret exposure, and unsafe patterns. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "find security issues in my code"
- "security code review"
- "check for vulnerabilities"
- "find hardcoded secrets"
- "OWASP review"

## Anti-Triggers

- design secure architecture (use core-security-design)
- harden against prompt injection (use gov-prompt-injection-hardening)

## Intake Questions

1. What is the user's goal and current state?
2. What constraints (time, team, compliance) apply?
3. Are there existing artifacts (specs, code, benchmarks) to reference?

## Output Contract

- quality findings
- evidence-grounded issues
- prioritized fixes
- verification guidance

## Related Skills

[qual-code-analysis](/mcp-ai-agent-guidelines/skills/reference/qual-code-analysis/) · [arch-security](/mcp-ai-agent-guidelines/skills/reference/arch-security/) · [gov-prompt-injection-hardening](/mcp-ai-agent-guidelines/skills/reference/gov-prompt-injection-hardening/)
