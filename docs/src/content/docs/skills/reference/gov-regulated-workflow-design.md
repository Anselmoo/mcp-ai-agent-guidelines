---
title: "gov-regulated-workflow-design"
description: "Use this skill when the user wants to work on Designing AI workflows for regulated industries with auditability, approval gates, and compliance trails. Triggers"
sidebar:
  label: "gov-regulated-workflow-design"
  badge:
    text: "Advanced"
    variant: "danger"
---

**Domain:** [`gov`](/mcp-ai-agent-guidelines/skills/governance/) · **Model class:** `strong`

## Description

Use this skill when the user wants to work on Designing AI workflows for regulated industries with auditability, approval gates, and compliance trails. Triggers include \"design a compliant AI workflow\", \"regulated AI deployment\", \"auditability requirements for AI\". Do NOT use when validate against policy (use gov-policy-validation).

## Purpose

Designing AI workflows for regulated industries with auditability, approval gates, and compliance trails. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "design a compliant AI workflow"
- "regulated AI deployment"
- "auditability requirements for AI"
- "approval gates in my AI pipeline"
- "GDPR/HIPAA compliant AI"

## Anti-Triggers

- validate against policy (use gov-policy-validation)
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

[gov-policy-validation](/mcp-ai-agent-guidelines/skills/reference/gov-policy-validation/) · [gov-model-compatibility](/mcp-ai-agent-guidelines/skills/reference/gov-model-compatibility/) · [gov-data-guardrails](/mcp-ai-agent-guidelines/skills/reference/gov-data-guardrails/)
