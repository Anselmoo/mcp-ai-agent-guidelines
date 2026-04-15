---
title: "gov-model-compatibility"
description: "Use this skill when the user wants to work on Assessing compatibility between AI models and existing workflows when upgrading or switching models. Triggers incl"
sidebar:
  label: "gov-model-compatibility"
  badge:
    text: "Advanced"
    variant: "danger"
---

**Domain:** [`gov`](/mcp-ai-agent-guidelines/skills/governance/) · **Model class:** `strong`

## Description

Use this skill when the user wants to work on Assessing compatibility between AI models and existing workflows when upgrading or switching models. Triggers include \"check model compatibility\", \"upgrade model safely\", \"will this model work with my workflow\". Do NOT use when pin the model version (use gov-model-governance).

## Purpose

Assessing compatibility between AI models and existing workflows when upgrading or switching models. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "check model compatibility"
- "upgrade model safely"
- "will this model work with my workflow"
- "model migration assessment"

## Anti-Triggers

- pin the model version (use gov-model-governance)
- run regression benchmarks (use core-prompt-benchmarking)

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

[gov-policy-validation](/mcp-ai-agent-guidelines/skills/reference/gov-policy-validation/) · [gov-regulated-workflow-design](/mcp-ai-agent-guidelines/skills/reference/gov-regulated-workflow-design/) · [gov-model-governance](/mcp-ai-agent-guidelines/skills/reference/gov-model-governance/)
