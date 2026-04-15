---
title: "req-analysis"
description: "Use this skill when the user wants to work on Extracting and structuring requirements from vague or incomplete user inputs. Triggers include \\\"extract requireme"
sidebar:
  label: "req-analysis"
  badge:
    text: "Zero-Cost"
    variant: "success"
---

**Domain:** [`req`](/mcp-ai-agent-guidelines/skills/requirements/) · **Model class:** `free`

## Description

Use this skill when the user wants to work on Extracting and structuring requirements from vague or incomplete user inputs. Triggers include \"extract requirements from this description\", \"structure these requirements\", \"turn this brief into requirements\". Do NOT use when detect ambiguities (use core-ambiguity-detection).

## Purpose

Extracting and structuring requirements from vague or incomplete user inputs. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.

## Trigger Phrases

- "extract requirements from this description"
- "structure these requirements"
- "turn this brief into requirements"
- "requirements from user stories"

## Anti-Triggers

- detect ambiguities (use core-ambiguity-detection)
- write acceptance criteria (use core-acceptance-criteria)

## Intake Questions

1. What is the user's goal and current state?
2. What constraints (time, team, compliance) apply?
3. Are there existing artifacts (specs, code, benchmarks) to reference?

## Output Contract

- structured requirements
- constraints or acceptance criteria
- scope boundaries
- prioritized next actions

## Related Skills

[req-ambiguity-detection](/mcp-ai-agent-guidelines/skills/reference/req-ambiguity-detection/) · [req-acceptance-criteria](/mcp-ai-agent-guidelines/skills/reference/req-acceptance-criteria/) · [req-scope](/mcp-ai-agent-guidelines/skills/reference/req-scope/)
