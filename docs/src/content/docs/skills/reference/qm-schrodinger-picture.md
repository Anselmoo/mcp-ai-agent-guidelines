---
title: "qm-schrodinger-picture"
description: "Use this skill when you need to predict how a codebase will evolve in the future based on its historical embedding trajectory. Trigger phrases include: \\\"predic"
sidebar:
  label: "qm-schrodinger-picture"
  badge:
    text: "Advanced"
    variant: "danger"
---

**Domain:** [`qm`](/mcp-ai-agent-guidelines/skills/physics-qm/) · **Model class:** `strong`

## Description

Use this skill when you need to predict how a codebase will evolve in the future based on its historical embedding trajectory. Trigger phrases include: \"predict future code state\", \"Schrödinger evolution of codebase\", \"extrapolate code trajectory\", \"what will the codebase look like in N steps\", \"time evolution of code embedding\", \"forecast architectural drift\". This skill applies a linear evolution operator estimated from snapshots to predict future states. Do NOT use when historical snapshots are fewer than 2 or the evolution is highly nonlinear.

## Purpose

Track how a codebase's embedding vector evolves across historical snapshots and predict future states by applying a linear evolution operator estimated from the most recent pair of snapshots. This mirrors the Schrödinger picture in quantum mechanics, where the state vector |ψ(t)⟩ carries all time dependence while operators remain fixed. The trajectory drift (L2 distance between consecutive states) quantifies how fast the codebase is changing.

## Trigger Phrases

- "qm-schrodinger-picture"

## Anti-Triggers

_None defined._

## Intake Questions

1. Apply the qm-schrodinger-picture skill to the user request.

## Output Contract

- physics metaphor output
- plain-language engineering translation
- confidence and limitation notes
- recommended engineering action

## Related Skills

_None_
