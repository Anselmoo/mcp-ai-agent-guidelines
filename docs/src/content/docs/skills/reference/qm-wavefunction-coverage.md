---
title: "qm-wavefunction-coverage"
description: "Use this skill when you need to compute non-linear Born-rule coverage probability between test embeddings and bug patterns. Trigger phrases include: \\\"which bug"
sidebar:
  label: "qm-wavefunction-coverage"
  badge:
    text: "Advanced"
    variant: "danger"
---

**Domain:** [`qm`](/mcp-ai-agent-guidelines/skills/physics-qm/) · **Model class:** `strong`

## Description

Use this skill when you need to compute non-linear Born-rule coverage probability between test embeddings and bug patterns. Trigger phrases include: \"which bugs are covered by tests\", \"Born-rule test coverage\", \"wavefunction overlap between tests and bugs\", \"risk-weighted uncovered bugs\", \"which bugs have no test coverage\", \"quantum coverage probability\". This skill computes P(covers bug)=|⟨ψ_test|ψ_bug⟩|² to give non-linear coverage probabilities. Do NOT use when test and bug vectors are not comparable in the same embedding space.

## Purpose

Compute Born-rule squared-overlap coverage probability between test embeddings and bug pattern embeddings. Each test is a quantum state |ψ_test⟩ and each bug is a target state |ψ_bug⟩. The probability that a test "covers" a bug is |⟨ψ_test|ψ_bug⟩|², following the Born rule. Summing across all tests gives total coverage. Bugs with low total coverage and high risk scores are surfaced first via weighted risk = bug.risk × (1 − coverage_probability).

## Trigger Phrases

- "qm-wavefunction-coverage"

## Anti-Triggers

_None defined._

## Intake Questions

1. Apply the qm-wavefunction-coverage skill to the user request.

## Output Contract

- physics metaphor output
- plain-language engineering translation
- confidence and limitation notes
- recommended engineering action

## Related Skills

_None_
