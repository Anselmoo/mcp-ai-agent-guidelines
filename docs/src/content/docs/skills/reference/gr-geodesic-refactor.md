---
title: "gr-geodesic-refactor"
description: "Use this skill when you need to find the shortest refactoring path through module-space between a current and target architecture, minimising the total metric d"
sidebar:
  label: "gr-geodesic-refactor"
  badge:
    text: "Advanced"
    variant: "danger"
---

**Domain:** [`gr`](/mcp-ai-agent-guidelines/skills/physics-gr/) · **Model class:** `strong`

## Description

Use this skill when you need to find the shortest refactoring path through module-space between a current and target architecture, minimising the total metric distance across architectural states.

## Purpose

Computes the geodesic (shortest curved-space path) through a set of architectural waypoints using a configurable metric tensor. Applies the spacetime line element `ds² = g_μν dx^μ dx^ν` to quantify pairwise distances between module embedding vectors and orders the waypoints along the path of least architectural resistance.

## Trigger Phrases

- "gr-geodesic-refactor"

## Anti-Triggers

_None defined._

## Intake Questions

1. Apply the gr-geodesic-refactor skill to the user request.

## Output Contract

- physics metaphor output
- plain-language engineering translation
- confidence and limitation notes
- recommended engineering action

## Related Skills

_None_
