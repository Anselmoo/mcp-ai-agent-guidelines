---
title: Debugging Skills
description: Skills for fault diagnosis, root cause analysis, reproduction, and postmortem.
sidebar:
  label: Debugging
---

The `debug-*` family moves from symptom to fix. Skills run sequentially: triage → root cause → reproduction → retrospective.

## Skills

| Skill ID | Description | Model Class |
|----------|-------------|-------------|
| `debug-assistant` | First-pass triage: interprets stack traces, logs, and error messages; proposes investigation hypotheses | `free` |
| `debug-root-cause` | Deep causal analysis: traces the chain of events that produced the failure | `strong` |
| `debug-reproduction` | Generates a minimal reproducible example (MRE) that isolates the fault | `cheap` |
| `debug-postmortem` | Structured post-incident report: timeline, impact, root cause, mitigations, action items | `cheap` |

## Debug Workflow

```
Bug Report / Stack Trace
        ↓
  debug-assistant      → symptom classification, top-3 hypotheses
        ↓
  debug-root-cause     → confirm root cause, causal chain
        ↓
  debug-reproduction   → minimal example to prove/disprove
        ↓
  (Fix applied)
        ↓
  debug-postmortem     → prevention measures, monitoring additions
```

## When to Use

| Situation | Skill(s) |
|-----------|----------|
| Lost in a cryptic stack trace | `debug-assistant` |
| Need to understand *why* something failed | `debug-root-cause` |
| Need to isolate a bug for a ticket | `debug-reproduction` |
| After a production incident | `debug-postmortem` |

## Instructions That Invoke These Skills

- **debug** — orchestrates all four skills in sequence
- **resilience** — uses `debug-root-cause` to identify failure modes for hardening

## Postmortem Format

`debug-postmortem` outputs a structured document:

```markdown
## Incident Summary
...
## Timeline
| Time | Event |
| ...  | ...   |
## Root Cause
...
## Impact
...
## Mitigations Applied
...
## Action Items
| Item | Owner | Due |
```
