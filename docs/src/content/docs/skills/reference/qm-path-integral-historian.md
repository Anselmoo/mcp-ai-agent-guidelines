---
title: "qm-path-integral-historian"
description: "Use this skill when you need to analyse git commit history as a quantum trajectory and find inflection commits where the codebase changed most. Trigger phrases "
sidebar:
  label: "qm-path-integral-historian"
  badge:
    text: "Advanced"
    variant: "danger"
---

**Domain:** [`qm`](/mcp-ai-agent-guidelines/skills/physics-qm/) · **Model class:** `strong`

## Description

Use this skill when you need to analyse git commit history as a quantum trajectory and find inflection commits where the codebase changed most. Trigger phrases include: \"find the inflection commit\", \"which commit was the biggest change\", \"path integral over git history\", \"weight commits by action\", \"Euclidean path integral of code\", \"find high-action commits\". This skill weights commit trajectories by exp(−action/T) and finds inflection points. Do NOT use when git history is unavailable or snapshots lack representative code samples.

## Purpose

`qm-path-integral-historian` treats git commit history as a quantum trajectory in code-embedding space. Each consecutive commit pair defines a "step" whose action is the L2 distance between token-hash embeddings of the code samples. Steps with action significantly above the mean (mean + 2σ) are labelled **inflection points** — moments where the codebase jumped to a qualitatively different region.

## Trigger Phrases

- "qm-path-integral-historian"

## Anti-Triggers

- Git history is unavailable.
- Code samples are absent, trivial (e.g., single-line files), or not representative.
- The user wants semantic diff analysis rather than statistical outlier detection.

## Intake Questions

1. Apply the qm-path-integral-historian skill to the user request.

## Output Contract

- physics metaphor output
- plain-language engineering translation
- confidence and limitation notes
- recommended engineering action

## Related Skills

_None_
