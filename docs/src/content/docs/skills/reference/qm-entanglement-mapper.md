---
title: "qm-entanglement-mapper"
description: "Use this skill when you need to detect hidden coupling between files via co-change entropy. Trigger phrases include: \\\"which files are entangled\\\", \\\"find coupl"
sidebar:
  label: "qm-entanglement-mapper"
  badge:
    text: "Advanced"
    variant: "danger"
---

**Domain:** [`qm`](/mcp-ai-agent-guidelines/skills/physics-qm/) · **Model class:** `strong`

## Description

Use this skill when you need to detect hidden coupling between files via co-change entropy. Trigger phrases include: \"which files are entangled\", \"find coupled files\", \"co-change entropy\", \"which files always change together\", \"detect hidden dependencies\", \"von Neumann entropy of file pairs\". This skill computes Von Neumann entropy S(ρ_A)=-Tr(ρ_A log₂ρ_A) from a co-change matrix to identify entangled file pairs. Do NOT use when you have no commit history or co-change data.

## Purpose

`qm-entanglement-mapper` detects hidden coupling between source files by treating co-change frequency as a quantum-mechanical density matrix and computing Von Neumann entropy for each file pair. File pairs with high entropy are "entangled" — they cannot be understood or modified independently.

## Trigger Phrases

- "qm-entanglement-mapper"

## Anti-Triggers

- No commit history or co-change data is available.
- The user wants runtime coupling analysis (use a dependency graph tool instead).

## Intake Questions

1. Apply the qm-entanglement-mapper skill to the user request.

## Output Contract

- physics metaphor output
- plain-language engineering translation
- confidence and limitation notes
- recommended engineering action

## Related Skills

_None_
