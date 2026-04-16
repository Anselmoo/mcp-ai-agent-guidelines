---
title: "qm-uncertainty-tradeoff"
description: "Use this skill when you need to identify modules that violate the coupling-cohesion uncertainty principle. Trigger phrases include: \\\"find modules with both hig"
sidebar:
  label: "qm-uncertainty-tradeoff"
  badge:
    text: "Advanced"
    variant: "danger"
---

**Domain:** [`qm`](/mcp-ai-agent-guidelines/skills/physics-qm/) · **Model class:** `strong`

## Description

Use this skill when you need to identify modules that violate the coupling-cohesion uncertainty principle. Trigger phrases include: \"find modules with both high coupling and low cohesion\", \"uncertainty product of coupling and cohesion\", \"Heisenberg uncertainty in code metrics\", \"coupling cohesion tradeoff\", \"Pareto violation modules\", \"which modules have tension between coupling and cohesion\". This skill computes the uncertainty product coupling × cohesion_deficit and flags Pareto violations. Do NOT use when you only have one of the two metrics available.

## Purpose

`qm-uncertainty-tradeoff` maps the Heisenberg uncertainty principle onto code metrics, treating coupling and cohesion_deficit as conjugate variables. Just as you cannot simultaneously minimise both position and momentum uncertainty in quantum mechanics, you cannot easily achieve both low coupling and low cohesion_deficit — the two metrics are in tension. This skill computes the **uncertainty product** `coupling × cohesion_deficit` and flags **Pareto violations** (modules bad at both simultaneously).

## Trigger Phrases

- "qm-uncertainty-tradeoff"

## Anti-Triggers

- Only one of `coupling` or `cohesion_deficit` is available.
- The user wants architectural guidance beyond metric analysis.

## Intake Questions

1. Apply the qm-uncertainty-tradeoff skill to the user request.

## Output Contract

- physics metaphor output
- plain-language engineering translation
- confidence and limitation notes
- recommended engineering action

## Related Skills

_None_
