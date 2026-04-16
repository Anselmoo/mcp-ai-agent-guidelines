---
title: "doc-api"
description: "Use this skill when the user wants to work on Generating schema-driven API reference documentation with examples and contracts. Triggers include \\\"document this"
sidebar:
  label: "doc-api"
  badge:
    text: "Zero-Cost"
    variant: "success"
---

**Domain:** [`doc`](/mcp-ai-agent-guidelines/skills/documentation/) · **Model class:** `free`

## Description

Use this skill when the user wants to work on Generating schema-driven API reference documentation with examples and contracts. Triggers include \"document this API\", \"generate API reference docs\", \"OpenAPI documentation\". Do NOT use when generate general project docs (use core-documentation-generator).

## Purpose

Generating schema-driven API reference documentation with examples and contracts. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "document this API"
- "generate API reference docs"
- "OpenAPI documentation"
- "API endpoint documentation with examples"

## Anti-Triggers

- generate general project docs (use core-documentation-generator)
- write a user guide (use core-documentation-generator)

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

[doc-generator](/mcp-ai-agent-guidelines/skills/reference/doc-generator/) · [doc-readme](/mcp-ai-agent-guidelines/skills/reference/doc-readme/)
