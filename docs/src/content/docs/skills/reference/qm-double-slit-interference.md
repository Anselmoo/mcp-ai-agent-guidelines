---
title: "qm-double-slit-interference"
description: "Use this skill when you need to determine whether two competing implementations interfere constructively or destructively. Trigger phrases include: \\\"do these i"
sidebar:
  label: "qm-double-slit-interference"
  badge:
    text: "Advanced"
    variant: "danger"
---

**Domain:** [`qm`](/mcp-ai-agent-guidelines/skills/physics-qm/) · **Model class:** `strong`

## Description

Use this skill when you need to determine whether two competing implementations interfere constructively or destructively. Trigger phrases include: \"do these implementations complement each other\", \"constructive or destructive interference\", \"double slit comparison of two approaches\", \"cosine similarity interference term\", \"will these implementations conflict\", \"interference pattern between impl-A and impl-B\". This skill computes I=I₁+I₂+2√(I₁I₂)cos(δ) to classify interference type. Do NOT use when you only have one implementation.

## Purpose

Determine whether two competing implementations (or design approaches) interfere constructively, destructively, or independently by treating their embeddings as waves passing through a double slit. The cosine similarity between the normalised embedding vectors acts as cos(δ), the phase difference. The Young's interference formula I = I₁ + I₂ + 2√(I₁I₂)cos(δ) gives the total combined intensity, and the relative gain versus classical addition reveals the interference type.

## Trigger Phrases

- "qm-double-slit-interference"

## Anti-Triggers

_None defined._

## Intake Questions

1. Apply the qm-double-slit-interference skill to the user request.

## Output Contract

- physics metaphor output
- plain-language engineering translation
- confidence and limitation notes
- recommended engineering action

## Related Skills

_None_
