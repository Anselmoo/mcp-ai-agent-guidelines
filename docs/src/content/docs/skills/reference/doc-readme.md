---
title: "doc-readme"
description: "Use this skill when the user wants to work on Generating clear README files optimized for developer onboarding and first successful use. Triggers include \\\"gene"
sidebar:
  label: "doc-readme"
  badge:
    text: "Zero-Cost"
    variant: "success"
---

**Domain:** [`doc`](/mcp-ai-agent-guidelines/skills/documentation/) · **Model class:** `free`

## Description

Use this skill when the user wants to work on Generating clear README files optimized for developer onboarding and first successful use. Triggers include \"generate a README\", \"write a README for this project\", \"create an onboarding README\". Do NOT use when document the full API (use core-api-documentation).

## Purpose

Generating clear README files optimized for developer onboarding and first successful use. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "generate a README"
- "write a README for this project"
- "create an onboarding README"
- "quickstart documentation"

## Anti-Triggers

- document the full API (use core-api-documentation)
- create operational runbooks (use core-runbook-generator)

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

[doc-generator](/mcp-ai-agent-guidelines/skills/reference/doc-generator/) · [doc-api](/mcp-ai-agent-guidelines/skills/reference/doc-api/)
