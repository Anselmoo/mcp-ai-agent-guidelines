---
title: "doc-generator"
description: "Use this skill when the user wants to work on Generating structured, audience-targeted technical documentation from code or specs. Triggers include \\\"generate d"
sidebar:
  label: "doc-generator"
  badge:
    text: "Zero-Cost"
    variant: "success"
---

**Domain:** [`doc`](/mcp-ai-agent-guidelines/skills/documentation/) · **Model class:** `free`

## Description

Use this skill when the user wants to work on Generating structured, audience-targeted technical documentation from code or specs. Triggers include \"generate documentation\", \"auto-doc this codebase\", \"create technical docs\". Do NOT use when generate only a README (use core-readme-generator).

## Purpose

Generating structured, audience-targeted technical documentation from code or specs. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "generate documentation"
- "auto-doc this codebase"
- "create technical docs"
- "document this project"

## Anti-Triggers

- generate only a README (use core-readme-generator)
- document only an API (use core-api-documentation)

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

[doc-readme](/mcp-ai-agent-guidelines/skills/reference/doc-readme/) · [doc-api](/mcp-ai-agent-guidelines/skills/reference/doc-api/) · [doc-runbook](/mcp-ai-agent-guidelines/skills/reference/doc-runbook/)
