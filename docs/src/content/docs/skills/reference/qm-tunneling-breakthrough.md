---
title: "qm-tunneling-breakthrough"
description: "Use this skill when you need to assess whether a refactoring migration is worth attempting now vs deferring. Trigger phrases include: \\\"should I attempt this re"
sidebar:
  label: "qm-tunneling-breakthrough"
  badge:
    text: "Advanced"
    variant: "danger"
---

**Domain:** [`qm`](/mcp-ai-agent-guidelines/skills/physics-qm/) · **Model class:** `strong`

## Description

Use this skill when you need to assess whether a refactoring migration is worth attempting now vs deferring. Trigger phrases include: \"should I attempt this refactor now\", \"tunneling probability for migration\", \"barrier height for this refactor\", \"WKB tunneling estimate\", \"which refactoring is most viable\", \"can we break through this technical debt\". This skill computes WKB tunnelling T=exp(−2·width·max(0,height−energy)) to rank refactoring viability. Do NOT use for new feature work where there is no existing barrier.

## Purpose

Rank refactoring migrations by their WKB quantum tunnelling probability. Each refactoring is characterised by a barrier width (scope/complexity), barrier height (peak risk/difficulty), and the team's current energy level. High tunnelling probability means attempt now; low probability means defer or reduce the barrier.

## Trigger Phrases

- "qm-tunneling-breakthrough"

## Anti-Triggers

_None defined._

## Intake Questions

1. Apply the qm-tunneling-breakthrough skill to the user request.

## Output Contract

- physics metaphor output
- plain-language engineering translation
- confidence and limitation notes
- recommended engineering action

## Related Skills

_None_
