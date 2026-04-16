---
title: "gov-workflow-compliance"
description: "Use this skill when the user wants to work on Validating AI workflows against policy, compliance, and governance requirements. Triggers include \\\"validate this "
sidebar:
  label: "gov-workflow-compliance"
  badge:
    text: "Advanced"
    variant: "danger"
---

**Domain:** [`gov`](/mcp-ai-agent-guidelines/skills/governance/) · **Model class:** `strong`

## Description

Use this skill when the user wants to work on Validating AI workflows against policy, compliance, and governance requirements. Triggers include \"validate this workflow against policy\", \"make this workflow compliant\", \"governance check for my AI pipeline\". Do NOT use when harden against injection first (use gov-prompt-injection-hardening).

## Purpose

Validating AI workflows against policy, compliance, and governance requirements. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "validate this workflow against policy"
- "make this workflow compliant"
- "governance check for my AI pipeline"
- "policy validation"

## Anti-Triggers

- harden against injection first (use gov-prompt-injection-hardening)
- handle data privacy (use gov-data-guardrails)

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

[gov-prompt-injection-hardening](/mcp-ai-agent-guidelines/skills/reference/gov-prompt-injection-hardening/) · [gov-data-guardrails](/mcp-ai-agent-guidelines/skills/reference/gov-data-guardrails/) · [gov-model-governance](/mcp-ai-agent-guidelines/skills/reference/gov-model-governance/)
