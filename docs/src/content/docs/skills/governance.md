---
title: Governance Skills
description: Skills for prompt injection hardening, policy validation, data guardrails, model governance, and compliance.
sidebar:
  label: Governance
---

The `gov-*` family enforces safety, compliance, and policy constraints on AI workflows. These are **strong-model-primary** skills — `GPT-5.4` runs the first-pass check, `Claude Sonnet 4.6` provides final judgment.

## Skills

| Skill ID | Description | Model Class |
|----------|-------------|-------------|
| `gov-prompt-injection-hardening` | Detects and mitigates prompt injection vectors in system prompts and input pipelines | `strong` |
| `gov-policy-validation` | Validates a workflow or output against a defined policy specification (JSON Schema or plain text rules) | `strong` |
| `gov-data-guardrails` | Enforces data privacy rules: PII detection, scrubbing, purpose limitation, retention checks | `strong` |
| `gov-model-governance` | Audits model selection decisions against organisational model policy (approved models, forbidden capabilities) | `strong` |
| `gov-model-compatibility` | Checks that a workflow's model requirements are compatible with the available model roster | `cheap` |
| `gov-regulated-workflow-design` | Designs workflows for regulated environments (HIPAA, GDPR, SOC 2): control gates, audit logging | `strong` |
| `gov-workflow-compliance` | End-to-end compliance check of a complete workflow against a regulatory standard | `strong` |

## Model Execution Pattern

```
gov-* request
  1. GPT-5.4           → first-pass policy check (no prior context)
  2. Claude Sonnet 4.6 → final judgment (sees GPT-5.4 output + original)
```

The two-pass pattern exists because `GPT-5.4` has lower self-agreement bias — it catches issues that a model which generated the plan would be inclined to approve.

## When to Use

| Situation | Skill(s) |
|-----------|----------|
| AI system prompt handles user-provided text | `gov-prompt-injection-hardening` |
| Workflow must comply with GDPR/HIPAA | `gov-regulated-workflow-design` + `gov-workflow-compliance` |
| Handling personal or sensitive data | `gov-data-guardrails` |
| Selecting models for a production system | `gov-model-governance` + `gov-model-compatibility` |
| Policy-gated approval gate | `gov-policy-validation` |

## Instructions That Invoke These Skills

- **govern** — primary consumer; all seven coordinated
- **review** — uses `gov-prompt-injection-hardening` when reviewing AI-facing code
- **enterprise** — uses `gov-regulated-workflow-design` + `gov-workflow-compliance`
- **design** — uses `gov-data-guardrails` for data architecture decisions

## Strict Mode

When `ENABLE_GOVERNANCE_STRICT=true`, governance skills add a **human-in-the-loop checkpoint** before returning results. A blocking approval prompt is inserted into the tool response.
