---
title: "qm-superposition-generator"
description: "Use this skill when you need to rank multiple candidate implementations and select the best one using Born-rule probability. Trigger phrases include: \\\"which im"
sidebar:
  label: "qm-superposition-generator"
  badge:
    text: "Advanced"
    variant: "danger"
---

**Domain:** [`qm`](/mcp-ai-agent-guidelines/skills/physics-qm/) · **Model class:** `strong`

## Description

Use this skill when you need to rank multiple candidate implementations and select the best one using Born-rule probability. Trigger phrases include: \"which implementation should I choose\", \"rank these candidates\", \"collapse to the best option\", \"superposition of implementations\", \"probability of each approach\", \"which version wins\". This skill computes Born-rule probability (P(i)=|αᵢ|²) to rank N candidate implementations by quantum probability and collapse to the winner. Do NOT use when you need deterministic rule-based selection without probabilistic weighting.

## Purpose

Rank N candidate implementations using the quantum Born rule. Each candidate is embedded into a Hilbert-space vector via a token-hash function. Amplitudes are normalised so ∑|αᵢ|² = 1. Squaring gives the collapse probability. Confidence is assessed via spectral gap (ratio of top two probabilities).

## Trigger Phrases

- "qm-superposition-generator"

## Anti-Triggers

_None defined._

## Intake Questions

1. Apply the qm-superposition-generator skill to the user request.

## Output Contract

- physics metaphor output
- plain-language engineering translation
- confidence and limitation notes
- recommended engineering action

## Related Skills

_None_
