---
title: "gov-policy-validation"
description: "Use this skill when the user wants to work on Validating AI workflows and prompts against organisational, regulatory, and compliance policies. Triggers include "
sidebar:
  label: "gov-policy-validation"
  badge:
    text: "Advanced"
    variant: "danger"
---

**Domain:** [`gov`](/mcp-ai-agent-guidelines/skills/governance/) · **Model class:** `strong`

## Description

Use this skill when the user wants to work on Validating AI workflows and prompts against organisational, regulatory, and compliance policies. Triggers include \"validate against policy\", \"compliance validation for AI\", \"policy-as-code for AI\". Do NOT use when harden against injection (use gov-prompt-injection-hardening).

## Purpose

Validating AI workflows and prompts against organisational, regulatory, and compliance policies. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "validate against policy"
- "compliance validation for AI"
- "policy-as-code for AI"
- "governance check"
- "regulatory compliance for AI"

## Anti-Triggers

- harden against injection (use gov-prompt-injection-hardening)
- validate at the workflow level (use gov-workflow-compliance)

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

[gov-model-compatibility](/mcp-ai-agent-guidelines/skills/reference/gov-model-compatibility/) · [gov-regulated-workflow-design](/mcp-ai-agent-guidelines/skills/reference/gov-regulated-workflow-design/) · [gov-workflow-compliance](/mcp-ai-agent-guidelines/skills/reference/gov-workflow-compliance/)
