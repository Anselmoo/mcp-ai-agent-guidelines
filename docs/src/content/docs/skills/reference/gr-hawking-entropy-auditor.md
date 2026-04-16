---
title: "gr-hawking-entropy-auditor"
description: "Use this skill when you need to audit API surface entropy using the Bekenstein-Hawking formula, identifying modules whose public export count violates the Hawki"
sidebar:
  label: "gr-hawking-entropy-auditor"
  badge:
    text: "Advanced"
    variant: "danger"
---

**Domain:** [`gr`](/mcp-ai-agent-guidelines/skills/physics-gr/) · **Model class:** `strong`

## Description

Use this skill when you need to audit API surface entropy using the Bekenstein-Hawking formula, identifying modules whose public export count violates the Hawking bound relative to their internal complexity.

## Purpose

Applies the Bekenstein-Hawking entropy formula `S = A/4` to software modules. A module's public API is its "event horizon"; entropy = public_exports / 4. Modules with entropy_ratio > 2 have too many exports for their internal complexity.

## Trigger Phrases

- "gr-hawking-entropy-auditor"

## Anti-Triggers

_None defined._

## Intake Questions

1. Apply the gr-hawking-entropy-auditor skill to the user request.

## Output Contract

- physics metaphor output
- plain-language engineering translation
- confidence and limitation notes
- recommended engineering action

## Related Skills

_None_
