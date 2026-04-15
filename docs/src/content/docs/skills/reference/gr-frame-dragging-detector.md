---
title: "gr-frame-dragging-detector"
description: "Use this skill when you need to detect high-churn modules that drag unrelated modules into their changes through frame-dragging coupling, analogous to the Lense"
sidebar:
  label: "gr-frame-dragging-detector"
  badge:
    text: "Advanced"
    variant: "danger"
---

**Domain:** [`gr`](/mcp-ai-agent-guidelines/skills/physics-gr/) · **Model class:** `strong`

## Description

Use this skill when you need to detect high-churn modules that drag unrelated modules into their changes through frame-dragging coupling, analogous to the Lense-Thirring effect.

## Purpose

Detects high-churn modules that pull neighbouring modules into unnecessary changes — the Lense-Thirring frame-dragging effect in code. `frame_dragging = churn_rate × coupling`.

## Trigger Phrases

- "gr-frame-dragging-detector"

## Anti-Triggers

_None defined._

## Intake Questions

1. Apply the gr-frame-dragging-detector skill to the user request.

## Output Contract

- physics metaphor output
- plain-language engineering translation
- confidence and limitation notes
- recommended engineering action

## Related Skills

_None_
