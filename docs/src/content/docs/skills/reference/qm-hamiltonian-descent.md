---
title: "qm-hamiltonian-descent"
description: "Use this skill when you need to determine the optimal order in which to fix code quality issues across modules. Trigger phrases include: \\\"what should I fix fir"
sidebar:
  label: "qm-hamiltonian-descent"
  badge:
    text: "Advanced"
    variant: "danger"
---

**Domain:** [`qm`](/mcp-ai-agent-guidelines/skills/physics-qm/) · **Model class:** `strong`

## Description

Use this skill when you need to determine the optimal order in which to fix code quality issues across modules. Trigger phrases include: \"what should I fix first\", \"optimal fix order\", \"module penalty ranking\", \"ground state of codebase\", \"energy eigenvalues of quality\", \"lowest energy module\". This skill builds a diagonal quality Hamiltonian and sorts eigenvalues ascending to find the optimal fix order. Do NOT use when you need prioritisation by business impact rather than code quality metrics.

## Purpose

`qm-hamiltonian-descent` maps each module's code-quality metrics onto a diagonal quantum Hamiltonian. The energy eigenvalue is `E = 1 − penalty`, so the module with the **highest penalty** has the **lowest energy** — making it the true quantum **ground state** E₀. This matches QM convention: the ground state is the energy minimum that systems naturally relax toward. Codebases similarly decay toward their worst quality state without active intervention. The skill ranks modules in ascending energy order (ground state first), computes the spectral gap, classifies priority, and provides a **repair vector** for each module pointing from its current energy toward the ensemble mean.

## Trigger Phrases

- "qm-hamiltonian-descent"

## Anti-Triggers

- Prioritisation must be driven by business impact, customer severity, or SLA.
- Modules lack any measurable quality metrics (complexity, coupling, coverage, churn).

## Intake Questions

1. Apply the qm-hamiltonian-descent skill to the user request.

## Output Contract

- physics metaphor output
- plain-language engineering translation
- confidence and limitation notes
- recommended engineering action

## Related Skills

_None_
