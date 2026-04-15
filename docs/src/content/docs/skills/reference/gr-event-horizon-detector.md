---
title: "gr-event-horizon-detector"
description: "Use this skill when you need to detect modules that have crossed their coupling event horizon, where the number of dependents exceeds the Schwarzschild radius a"
sidebar:
  label: "gr-event-horizon-detector"
  badge:
    text: "Advanced"
    variant: "danger"
---

**Domain:** [`gr`](/mcp-ai-agent-guidelines/skills/physics-gr/) · **Model class:** `strong`

## Description

Use this skill when you need to detect modules that have crossed their coupling event horizon, where the number of dependents exceeds the Schwarzschild radius analogue and changes are guaranteed to cascade uncontrollably.

## Purpose

Detects modules that have crossed their coupling "event horizon" using the Schwarzschild radius analogue `r_s = 2 × coupling_mass`. If a module's dependents count exceeds r_s, changes to it will cascade uncontrollably through the codebase.

## Trigger Phrases

- "gr-event-horizon-detector"

## Anti-Triggers

_None defined._

## Intake Questions

1. Apply the gr-event-horizon-detector skill to the user request.

## Output Contract

- physics metaphor output
- plain-language engineering translation
- confidence and limitation notes
- recommended engineering action

## Related Skills

_None_
