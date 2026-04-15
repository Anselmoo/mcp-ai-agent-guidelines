---
title: "gov-model-governance"
description: "Use this skill when the user wants to work on Governing model selection, version pinning, lifecycle management, and deployment policy. Triggers include \\\"govern"
sidebar:
  label: "gov-model-governance"
  badge:
    text: "Advanced"
    variant: "danger"
---

**Domain:** [`gov`](/mcp-ai-agent-guidelines/skills/governance/) · **Model class:** `strong`

## Description

Use this skill when the user wants to work on Governing model selection, version pinning, lifecycle management, and deployment policy. Triggers include \"govern model versions\", \"how do I pin my model in production\", \"model registry\". Do NOT use when validate workflow compliance (use gov-workflow-compliance).

## Purpose

Governing model selection, version pinning, lifecycle management, and deployment policy. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "govern model versions"
- "how do I pin my model in production"
- "model registry"
- "model lifecycle management"
- "safe model upgrade policy"

## Anti-Triggers

- validate workflow compliance (use gov-workflow-compliance)
- benchmark model performance (use core-prompt-benchmarking)

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

[gov-workflow-compliance](/mcp-ai-agent-guidelines/skills/reference/gov-workflow-compliance/) · [eval-prompt-bench](/mcp-ai-agent-guidelines/skills/reference/eval-prompt-bench/)
