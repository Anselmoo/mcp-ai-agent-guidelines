---
title: "qm-heisenberg-picture"
description: "Use this skill when you need to analyse how code quality metrics drift over time and find which metrics are compatible vs competing. Trigger phrases include: \\\""
sidebar:
  label: "qm-heisenberg-picture"
  badge:
    text: "Advanced"
    variant: "danger"
---

**Domain:** [`qm`](/mcp-ai-agent-guidelines/skills/physics-qm/) · **Model class:** `strong`

## Description

Use this skill when you need to analyse how code quality metrics drift over time and find which metrics are compatible vs competing. Trigger phrases include: \"how are my metrics changing over time\", \"Heisenberg picture of code metrics\", \"which metrics are commuting\", \"metric drift analysis\", \"find anti-correlated metrics\", \"which quality indicators conflict with each other\". This skill computes metric drift rates and pairwise Pearson correlations to classify metric pairs as COMMUTING or NON_COMMUTING. Do NOT use when fewer than 3 metric snapshots are available.

## Purpose

Analyse how code quality metrics (operators) evolve across a series of snapshots while treating the codebase state as fixed. This mirrors the Heisenberg picture in quantum mechanics, where operators carry all time-dependence while the state vector remains constant. The tool computes per-metric drift rates and pairwise Pearson correlations to classify metric pairs as COMMUTING (compatible — measuring one does not disturb the other) or NON_COMMUTING (competing — improving one degrades the other, e.g. complexity vs. test coverage).

## Trigger Phrases

- "qm-heisenberg-picture"

## Anti-Triggers

_None defined._

## Intake Questions

1. Apply the qm-heisenberg-picture skill to the user request.

## Output Contract

- physics metaphor output
- plain-language engineering translation
- confidence and limitation notes
- recommended engineering action

## Related Skills

_None_
