---
title: "qm-measurement-collapse"
description: "Use this skill when you need to model the effect of a code review decision on adjacent modules — i.e., which modules are most \\\"disturbed\\\" by choosing a partic"
sidebar:
  label: "qm-measurement-collapse"
  badge:
    text: "Advanced"
    variant: "danger"
---

**Domain:** [`qm`](/mcp-ai-agent-guidelines/skills/physics-qm/) · **Model class:** `strong`

## Description

Use this skill when you need to model the effect of a code review decision on adjacent modules — i.e., which modules are most \"disturbed\" by choosing a particular implementation. Trigger phrases include: \"what is the backaction of choosing this implementation\", \"code review collapse\", \"how does selecting impl-X affect adjacent modules\", \"post-measurement state after code review\", \"which modules are disturbed by this choice\", \"measurement collapse of candidates\". This skill projects all candidates onto the selected one and computes backaction on adjacent modules. Do NOT use with fewer than 2 candidates.

## Purpose

Model a code-review decision as a quantum measurement that collapses a superposition of candidate implementations to a single definite choice. Once the selected implementation is chosen, all other candidates are projected onto it (yielding projection probabilities), and adjacent modules experience "backaction" proportional to their cosine similarity with the post-measurement state. High backaction means the selected implementation will pull those modules toward its design patterns, requiring updates or reviews.

## Trigger Phrases

- "qm-measurement-collapse"

## Anti-Triggers

_None defined._

## Intake Questions

1. Apply the qm-measurement-collapse skill to the user request.

## Output Contract

- physics metaphor output
- plain-language engineering translation
- confidence and limitation notes
- recommended engineering action

## Related Skills

_None_
