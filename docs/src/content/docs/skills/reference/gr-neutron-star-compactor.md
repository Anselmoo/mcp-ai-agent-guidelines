---
title: "gr-neutron-star-compactor"
description: "Use this skill when you need to assess information density of files against their Chandrasekhar limit, identifying files approaching collapse due to excessive L"
sidebar:
  label: "gr-neutron-star-compactor"
  badge:
    text: "Advanced"
    variant: "danger"
---

**Domain:** [`gr`](/mcp-ai-agent-guidelines/skills/physics-gr/) · **Model class:** `strong`

## Description

Use this skill when you need to assess information density of files against their Chandrasekhar limit, identifying files approaching collapse due to excessive LOC, cyclomatic complexity, and responsibility count.

## Purpose

Assesses whether files are approaching their "Chandrasekhar limit" — the maximum information density before collapse into an unreadable blob. `density = (loc × cyclomatic_complexity) / (cohesion + 1)`.

## Trigger Phrases

- "gr-neutron-star-compactor"

## Anti-Triggers

_None defined._

## Intake Questions

1. Apply the gr-neutron-star-compactor skill to the user request.

## Output Contract

- physics metaphor output
- plain-language engineering translation
- confidence and limitation notes
- recommended engineering action

## Related Skills

_None_
