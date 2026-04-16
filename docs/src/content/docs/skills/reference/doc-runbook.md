---
title: "doc-runbook"
description: "Use this skill when the user wants to work on Creating operational runbooks for AI systems covering incidents, rollbacks, and degraded modes. Triggers include \\"
sidebar:
  label: "doc-runbook"
  badge:
    text: "Zero-Cost"
    variant: "success"
---

**Domain:** [`doc`](/mcp-ai-agent-guidelines/skills/documentation/) · **Model class:** `free`

## Description

Use this skill when the user wants to work on Creating operational runbooks for AI systems covering incidents, rollbacks, and degraded modes. Triggers include \"write an operational runbook\", \"create a runbook for my AI system\", \"incident response procedures for AI\". Do NOT use when create general docs (use core-documentation-generator).

## Purpose

Creating operational runbooks for AI systems covering incidents, rollbacks, and degraded modes. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "write an operational runbook"
- "create a runbook for my AI system"
- "incident response procedures for AI"
- "prompt rollback runbook"

## Anti-Triggers

- create general docs (use core-documentation-generator)
- write a postmortem (use core-incident-postmortem)

## Intake Questions

1. What is the user's goal and current state?
2. What constraints (time, team, compliance) apply?
3. Are there existing artifacts (specs, code, benchmarks) to reference?

## Output Contract

- documentation artifact
- audience-aware structure
- source-aware coverage
- publication or validation checklist

## Related Skills

[doc-generator](/mcp-ai-agent-guidelines/skills/reference/doc-generator/) · [debug-postmortem](/mcp-ai-agent-guidelines/skills/reference/debug-postmortem/)
