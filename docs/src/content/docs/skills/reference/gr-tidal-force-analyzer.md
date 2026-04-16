---
title: "gr-tidal-force-analyzer"
description: "Use this skill when you need to detect differential coupling forces pulling parts of a module apart, suggesting it should be split into separate cohesive units."
sidebar:
  label: "gr-tidal-force-analyzer"
  badge:
    text: "Advanced"
    variant: "danger"
---

**Domain:** [`gr`](/mcp-ai-agent-guidelines/skills/physics-gr/) · **Model class:** `strong`

## Description

Use this skill when you need to detect differential coupling forces pulling parts of a module apart, suggesting it should be split into separate cohesive units.

## Purpose

Detects tidal forces tearing modules apart by measuring differential coupling across function groups. Based on `F_tidal ∝ GM/r³`, our analogue is `tidal_force = (max_coupling - min_coupling) / (mean_cohesion³ + ε)`.

## Trigger Phrases

- "gr-tidal-force-analyzer"

## Anti-Triggers

_None defined._

## Intake Questions

1. Apply the gr-tidal-force-analyzer skill to the user request.

## Output Contract

- physics metaphor output
- plain-language engineering translation
- confidence and limitation notes
- recommended engineering action

## Related Skills

_None_
