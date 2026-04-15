---
title: "qm-dirac-notation-mapper"
description: "Use this skill when you need to compute all pairwise file overlap integrals and identify which files are most central to the codebase. Trigger phrases include: "
sidebar:
  label: "qm-dirac-notation-mapper"
  badge:
    text: "Advanced"
    variant: "danger"
---

**Domain:** [`qm`](/mcp-ai-agent-guidelines/skills/physics-qm/) · **Model class:** `strong`

## Description

Use this skill when you need to compute all pairwise file overlap integrals and identify which files are most central to the codebase. Trigger phrases include: \"compute pairwise file overlaps\", \"which files are most central\", \"Dirac bra-ket overlap matrix\", \"inner product between files\", \"which files span the embedding space\", \"projection weight of each file\". This skill builds the full n×n overlap matrix ⟨i|j⟩ and ranks files by projection weight. Do NOT use with more than 50 files as the O(n²) cost becomes significant.

## Purpose

Express all pairwise relationships between files as bra-ket inner products, building a full n×n overlap (Gram) matrix. Each file is treated as a ket |file⟩ in the embedding space. The diagonal entries are 1.0 after normalisation; off-diagonal entries measure directional alignment. The "projection weight" of a file is the sum of squared overlaps across all other files — a high value indicates that this file is architecturally central and its patterns recur throughout the codebase.

## Trigger Phrases

- "qm-dirac-notation-mapper"

## Anti-Triggers

_None defined._

## Intake Questions

1. Apply the qm-dirac-notation-mapper skill to the user request.

## Output Contract

- physics metaphor output
- plain-language engineering translation
- confidence and limitation notes
- recommended engineering action

## Related Skills

_None_
