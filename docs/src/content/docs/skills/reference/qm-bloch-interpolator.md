---
title: "qm-bloch-interpolator"
description: "Use this skill when you need to interpolate between two coding styles or architectural approaches and visualise intermediate states. Trigger phrases include: \\\""
sidebar:
  label: "qm-bloch-interpolator"
  badge:
    text: "Advanced"
    variant: "danger"
---

**Domain:** [`qm`](/mcp-ai-agent-guidelines/skills/physics-qm/) · **Model class:** `strong`

## Description

Use this skill when you need to interpolate between two coding styles or architectural approaches and visualise intermediate states. Trigger phrases include: \"show me the intermediate steps between style A and style B\", \"Bloch sphere interpolation\", \"geodesic between two coding styles\", \"interpolate between OOP and functional\", \"what are the mixed states\", \"show style transition steps\". This skill linearly interpolates Bloch vectors between two antipodal states showing mixed intermediate styles. Do NOT use when the two styles are not expressible as 3D vectors.

## Purpose

Interpolate N steps along the geodesic between two coding styles (or architectural approaches) represented as Bloch vectors. Each step shows the label, purity, and 3D vector of the intermediate mixed style, enabling a team to see what a gradual transition looks like from pure style A to pure style B.

## Trigger Phrases

- "qm-bloch-interpolator"

## Anti-Triggers

_None defined._

## Intake Questions

1. Apply the qm-bloch-interpolator skill to the user request.

## Output Contract

- physics metaphor output
- plain-language engineering translation
- confidence and limitation notes
- recommended engineering action

## Related Skills

_None_
