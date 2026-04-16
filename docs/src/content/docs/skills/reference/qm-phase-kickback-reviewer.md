---
title: "qm-phase-kickback-reviewer"
description: "Use this skill when you need to quickly extract the dominant architectural phase of a codebase without reading every file deeply. Trigger phrases include: \\\"wha"
sidebar:
  label: "qm-phase-kickback-reviewer"
  badge:
    text: "Advanced"
    variant: "danger"
---

**Domain:** [`qm`](/mcp-ai-agent-guidelines/skills/physics-qm/) · **Model class:** `strong`

## Description

Use this skill when you need to quickly extract the dominant architectural phase of a codebase without reading every file deeply. Trigger phrases include: \"what is the dominant architecture phase\", \"phase kickback analysis\", \"extract architectural invariant from files\", \"which file has the strongest architectural signal\", \"probe the codebase phase\", \"cosine probe embedding\". This skill injects a cosine probe into token-hash embeddings to extract dominant phases in O(n·d) time. Do NOT use when files are too small (< 5 tokens) to produce meaningful embeddings.

## Purpose

Extract the dominant architectural phase of a codebase by injecting a cosine probe vector into token-hash embeddings of each file. The file whose embedding has the highest dot-product magnitude with the probe is the architectural invariant carrier — the file that most strongly defines the codebase's structural identity.

## Trigger Phrases

- "qm-phase-kickback-reviewer"

## Anti-Triggers

_None defined._

## Intake Questions

1. Apply the qm-phase-kickback-reviewer skill to the user request.

## Output Contract

- physics metaphor output
- plain-language engineering translation
- confidence and limitation notes
- recommended engineering action

## Related Skills

_None_
