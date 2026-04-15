---
title: "gr-equivalence-principle-checker"
description: "Use this skill when you need to verify that a module's local interface consistency is compatible with global architectural conventions, checking whether the equ"
sidebar:
  label: "gr-equivalence-principle-checker"
  badge:
    text: "Advanced"
    variant: "danger"
---

**Domain:** [`gr`](/mcp-ai-agent-guidelines/skills/physics-gr/) · **Model class:** `strong`

## Description

Use this skill when you need to verify that a module's local interface consistency is compatible with global architectural conventions, checking whether the equivalence principle holds between local and global consistency scores.

## Purpose

Checks whether a module's local interface consistency (inertial mass) equals its global architectural consistency (gravitational mass). Equivalence ratio = local_consistency / global_consistency. Violations indicate modules that are locally coherent but globally alien, or vice versa.

## Trigger Phrases

- "gr-equivalence-principle-checker"

## Anti-Triggers

_None defined._

## Intake Questions

1. Apply the gr-equivalence-principle-checker skill to the user request.

## Output Contract

- physics metaphor output
- plain-language engineering translation
- confidence and limitation notes
- recommended engineering action

## Related Skills

_None_
