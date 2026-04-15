---
title: "gr-schwarzschild-classifier"
description: "Use this skill when you need to classify modules by their position relative to their Schwarzschild radius, measuring development velocity penalties as gravitati"
sidebar:
  label: "gr-schwarzschild-classifier"
  badge:
    text: "Advanced"
    variant: "danger"
---

**Domain:** [`gr`](/mcp-ai-agent-guidelines/skills/physics-gr/) · **Model class:** `strong`

## Description

Use this skill when you need to classify modules by their position relative to their Schwarzschild radius, measuring development velocity penalties as gravitational time dilation near high-coupling singularities.

## Purpose

Classifies modules by their position relative to their own Schwarzschild radius `r_s = 2 × coupling_mass`. Modules inside the horizon have collapsed; those near it experience severe development time dilation.

## Trigger Phrases

- "gr-schwarzschild-classifier"

## Anti-Triggers

_None defined._

## Intake Questions

1. Apply the gr-schwarzschild-classifier skill to the user request.

## Output Contract

- physics metaphor output
- plain-language engineering translation
- confidence and limitation notes
- recommended engineering action

## Related Skills

_None_
