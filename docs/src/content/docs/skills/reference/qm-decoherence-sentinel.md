---
title: "qm-decoherence-sentinel"
description: "Use this skill when you need to classify flaky tests by their decoherence channels and compute a coherence time T₂. Trigger phrases include: \\\"which tests are f"
sidebar:
  label: "qm-decoherence-sentinel"
  badge:
    text: "Advanced"
    variant: "danger"
---

**Domain:** [`qm`](/mcp-ai-agent-guidelines/skills/physics-qm/) · **Model class:** `strong`

## Description

Use this skill when you need to classify flaky tests by their decoherence channels and compute a coherence time T₂. Trigger phrases include: \"which tests are flaky\", \"classify test flakiness by channel\", \"decoherence time of test suite\", \"timing jitter in tests\", \"resource leak tests\", \"ordering-dependent tests\". This skill models flaky tests via Lindblad decoherence channels and computes T₂=1/Σγₖ. Do NOT use when test failure data lacks channel breakdowns.

## Purpose

Classify flaky tests by mapping each failure mode onto a Lindblad decoherence channel and compute a coherence time T₂ = 1 / Σγₖ for every test. Tests with short T₂ are the most urgently flaky; tests with long T₂ are effectively stable.

## Trigger Phrases

- "qm-decoherence-sentinel"

## Anti-Triggers

_None defined._

## Intake Questions

1. Apply the qm-decoherence-sentinel skill to the user request.

## Output Contract

- physics metaphor output
- plain-language engineering translation
- confidence and limitation notes
- recommended engineering action

## Related Skills

_None_
