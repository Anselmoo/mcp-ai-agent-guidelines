---
title: "resil-homeostatic"
description: "Use when a user wants their workflow to automatically maintain target levels of quality, speed, and cost — compensating when any metric drifts out of range. Tri"
sidebar:
  label: "resil-homeostatic"
  badge:
    text: "Efficient"
    variant: "caution"
---

**Domain:** [`resil`](/mcp-ai-agent-guidelines/skills/resilience/) · **Model class:** `cheap`

## Description

Use when a user wants their workflow to automatically maintain target levels of quality, speed, and cost — compensating when any metric drifts out of range. Triggers: \"maintain quality automatically\", \"workflow that stays within budget\", \"auto-scale agents\", \"feedback control for LLM pipeline\", \"PID controller\", \"homeostasis\", \"setpoint-driven orchestration\", \"keep latency below X\", \"don't let quality drop below Y\". Also trigger when someone defines SLOs and asks how to enforce them automatically, or says they want a workflow that \"self-regulates\".

## Purpose

PID control loop. For each setpoint compute error e=target-measured; output u=Kp×e+Ki×Σe×dt+Kd×Δe/dt (integral clamped by windup_guard); map u to actuator (latency→chain_depth, quality→agents).

## Trigger Phrases

- "maintain quality automatically"
- "workflow that stays within budget"
- "auto-scale agents"
- "feedback control for LLM pipeline"
- "PID controller"
- "homeostasis"
- "setpoint-driven orchestration"
- "keep latency below X"
- "don't let quality drop below Y"
- "self-regulates"

## Anti-Triggers

- the user wants a one-off improvement without ongoing adaptation or structural change

## Intake Questions

1. Which metrics have target setpoints and acceptable tolerances?
2. What actuators can the controller change in response to error?
3. What sampling cadence and PID gains are safe?
4. How should saturation limits or bounds be enforced?

## Output Contract

- failure mode analysis
- recovery strategy
- operational checks
- validation notes

## Related Skills

[flow-orchestrator](/mcp-ai-agent-guidelines/skills/reference/flow-orchestrator/) · [orch-agent-orchestrator](/mcp-ai-agent-guidelines/skills/reference/orch-agent-orchestrator/) · [prompt-chaining](/mcp-ai-agent-guidelines/skills/reference/prompt-chaining/)
