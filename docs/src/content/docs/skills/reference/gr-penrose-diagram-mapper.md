---
title: "gr-penrose-diagram-mapper"
description: "Use this skill when you need to map architectural history to a Penrose-style causal diagram, classifying module pairs as timelike, lightlike, or spacelike separ"
sidebar:
  label: "gr-penrose-diagram-mapper"
  badge:
    text: "Advanced"
    variant: "danger"
---

**Domain:** [`gr`](/mcp-ai-agent-guidelines/skills/physics-gr/) · **Model class:** `strong`

## Description

Use this skill when you need to map architectural history to a Penrose-style causal diagram, classifying module pairs as timelike, lightlike, or spacelike separated to identify isolated clusters and causal chains.

## Purpose

Maps commit history and dependency structure to a Penrose-style causal diagram using conformal compactification. Classifies module pairs as TIMELIKE (dependency chain), LIGHTLIKE (single direct edge), or SPACELIKE (no connection), and identifies spacelike islands.

## Trigger Phrases

- "gr-penrose-diagram-mapper"

## Anti-Triggers

_None defined._

## Intake Questions

1. Apply the gr-penrose-diagram-mapper skill to the user request.

## Output Contract

- physics metaphor output
- plain-language engineering translation
- confidence and limitation notes
- recommended engineering action

## Related Skills

_None_
