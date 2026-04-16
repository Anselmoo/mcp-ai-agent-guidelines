---
title: "gov-data-guardrails"
description: "Use this skill when the user wants to work on Implementing data handling guardrails: PII protection, secret masking, and data minimisation. Triggers include \\\"h"
sidebar:
  label: "gov-data-guardrails"
  badge:
    text: "Advanced"
    variant: "danger"
---

**Domain:** [`gov`](/mcp-ai-agent-guidelines/skills/governance/) · **Model class:** `strong`

## Description

Use this skill when the user wants to work on Implementing data handling guardrails: PII protection, secret masking, and data minimisation. Triggers include \"handle PII safely\", \"mask sensitive data in my AI pipeline\", \"data minimisation for agents\". Do NOT use when validate the full workflow compliance (use gov-workflow-compliance).

## Purpose

Implementing data handling guardrails: PII protection, secret masking, and data minimisation. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "handle PII safely"
- "mask sensitive data in my AI pipeline"
- "data minimisation for agents"
- "redact secrets from context"
- "GDPR-safe AI workflow"

## Anti-Triggers

- validate the full workflow compliance (use gov-workflow-compliance)
- scope tool permissions (use gov-model-governance)

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

[gov-workflow-compliance](/mcp-ai-agent-guidelines/skills/reference/gov-workflow-compliance/) · [gov-model-governance](/mcp-ai-agent-guidelines/skills/reference/gov-model-governance/)
