---
title: "resil-membrane"
description: "Use when a user needs to enforce strict data boundaries, access controls, or transformation rules between workflow stages — especially in multi-tenant, multi-cl"
sidebar:
  label: "resil-membrane"
  badge:
    text: "Efficient"
    variant: "caution"
---

**Domain:** [`resil`](/mcp-ai-agent-guidelines/skills/resilience/) · **Model class:** `cheap`

## Description

Use when a user needs to enforce strict data boundaries, access controls, or transformation rules between workflow stages — especially in multi-tenant, multi-clearance, or regulatory contexts. Triggers: \"data should not cross between stages\", \"compartmentalised workflow\", \"membrane computing\", \"P-systems\", \"nested security zones\", \"data isolation between agents\", \"HIPAA/GDPR workflow boundaries\", \"each agent should only see its own data\". Also trigger for healthcare, finance, or government workflows requiring formal data-flow controls stronger than prompt instructions.

## Purpose

Each workflow stage wrapped in Membrane with entry_rules, evolution_rules, exit_rules. Artifacts annotated with clearance_level; fields exceeding membrane clearance are blocked or sanitised.

## Trigger Phrases

- "data should not cross between stages"
- "compartmentalised workflow"
- "membrane computing"
- "P-systems"
- "nested security zones"
- "data isolation between agents"
- "HIPAA/GDPR workflow boundaries"
- "each agent should only see its own data"

## Anti-Triggers

- the user wants a one-off improvement without ongoing adaptation or structural change

## Intake Questions

1. What membranes or clearance zones exist between stages?
2. Which fields must be blocked, masked, hashed, or anonymized?
3. What default action applies to unknown fields?
4. What audit or violation logging is required for blocked transfers?

## Output Contract

- failure mode analysis
- recovery strategy
- operational checks
- validation notes

## Related Skills

[flow-orchestrator](/mcp-ai-agent-guidelines/skills/reference/flow-orchestrator/) · [orch-agent-orchestrator](/mcp-ai-agent-guidelines/skills/reference/orch-agent-orchestrator/) · [prompt-chaining](/mcp-ai-agent-guidelines/skills/reference/prompt-chaining/)
