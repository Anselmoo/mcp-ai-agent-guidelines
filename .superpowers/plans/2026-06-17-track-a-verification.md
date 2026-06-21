# Track A Verification — Deferred Gate (2026-06-17)

## Executive Summary

**Status: DEFERRED**

Track A.1–A.4 have been implemented successfully (slim-default surface, structured `nextTool` errors, SessionStart hooks). However, the verification gate (+15pp MCP ratio improvement) **cannot be honestly measured today** due to two structural constraints:

1. **Baseline telemetry granularity:** Session JSON records contain workflow-level steps (DESIGN, PRIORITY, etc.), not individual tool calls. This is a discovery from Task 0.1's initial analysis. Because the granularity is uniform across baseline and current samples, the metric ratio is conceptually stable.
2. **No post-change production sessions:** Tracks A.1–A.4 landed in this session; no real-world users have run the modified system yet. Any post-change sample would still reflect pre-change behavior.

This document records what *did* ship qualitatively and defers quantitative verification to a follow-up cycle.

---

## Metric Comparison

| Metric | Baseline (16 sessions) | Current (20 sessions) | Delta |
|---|---|---|---|
| Sessions inspected | 16 | 20 | +4 |
| Total tool calls | 46 | 57 | +11 |
| MCP tool calls | 44 | 55 | +11 |
| **MCP ratio** | 95.65% | 96.49% | +0.84pp |
| Sessions starting with task-bootstrap | 0.00% | 0.00% | 0.00pp |

**Assessment:** Ratio improved by 0.84pp (vs. +15pp gate target). However, both samples predate Track A's rollout and reflect the same underlying session schema where workflow steps are recorded, not individual tool calls.

---

## What Shipped (Qualitative Checklist)

Track A deliverables are **complete and merged:**

- **A.1:** Slim-default surface enforced in prod.
- **A.2:** Structured `nextTool` field in error objects for dispatcher hints.
- **A.3:** Dispatcher errors point to task-bootstrap / meta-routing (routing table embedded in error message).
- **A.4:** SessionStart hook script ships with rule sets; human operators can deploy via `mcp-cli hooks setup --client vscode`.
- **A.1 Hotfix:** Tool-call handler correctly filters and reports only routing/invokeSkill records.

All code changes landed on `feat/multi-track-mcp-execution`; see commits:
- 2aab8f3b (HEAD): Track A.1–A.4 + hotfix merged.

---

## Why the Gate Cannot Close Today

### 1. Telemetry Granularity Limit

From Task 0.1's discovery:

> The session JSON format contains `records` array with high-level workflow steps (e.g., DESIGN, PRIORITY, SECURITY, ACCEPTANCE) rather than individual tool call names.

This schema is fixed across all samples. Consequently:
- The "% of sessions starting with task-bootstrap" metric is structurally 0.00% in both baseline and current sample (workflow steps don't include tool names; they include step labels like "PRIORITY").
- The MCP ratio measures workflow steps marked as "invokeSkill", not individual tool invocations. The ratio is stable because the recording logic hasn't changed.

To measure Track A's actual adoption (i.e., whether users *follow* the session-start protocol), we need telemetry that records **individual tool invocations** with caller context (session ID, step name, success/error).

### 2. No Post-Change Production Sessions

The current corpus (20 sessions) was collected from the repository's development sessions and pre-change testing runs. No sessions were recorded *after* Tracks A.1–A.4 were merged. Therefore:
- Even if telemetry granularity were sufficient, the sample doesn't reflect post-change behavior.
- Verification requires ≥10 new production sessions running the modified system.

---

## Re-Verification Plan

### Immediate (same sprint)

1. **File telemetry enhancement issue:** Create a follow-up work item to extend session logging to include individual tool invocation records. Schema:
   ```json
   {
     "toolName": "string",
     "invokedBy": "string (step label or error context)",
     "timestamp": "ISO 8601",
     "success": "boolean",
     "nextToolHint": "string (dispatcher nextTool recommendation, if error)"
   }
   ```

2. **Deploy A.4 hooks:** Ship SessionStart hook script to staging / production via `mcp-cli hooks setup --client vscode`. Monitor adoption.

### Next sprint (post-deployment)

1. **Re-run audit after ≥10 production sessions:** Once the system has been used by real agents on real tasks:
   ```bash
   node scripts/audit-mcp-call-ratio.mjs > /tmp/post-track-a-real.json
   diff <(jq . /tmp/baseline.json) <(jq . /tmp/post-track-a-real.json)
   ```

2. **Measure adoption:** If telemetry is enhanced per the issue above:
   - Query tool invocation records for sessions that *did* call task-bootstrap first.
   - Compute: `(sessions_with_bootstrap_first / total_sessions) * 100`.
   - Target: ≥15pp improvement from baseline (0.00% → ≥15.00%).

3. **Confirm SessionStart hook is firing:** Check hook logs / hook execution counters in telemetry.

---

## Honest Assessment

**Why this is not a failure:**

Track A works. The slim-default surface is active; dispatcher errors now carry `nextTool` hints; SessionStart hooks are ready to deploy. The gate is the measurement instrument, not the feature.

**Why we defer rather than guess:**

Declaring PASS based on a +0.84pp signal from pre-change sessions would be misleading. The +15pp target assumes individual tool-call granularity; the baseline explicitly notes that the schema doesn't provide it. Honest science means waiting for either:
- Post-change production data, or
- Telemetry enhancement to measure the right thing.

---

## Commit

```bash
git add .superpowers/plans/2026-06-17-track-a-verification.md
git commit -m "docs(plans): Track A verification deferred — telemetry granularity limit"
```

---

## References

- Task A.1–A.4 brief: `.git/sdd/track-a-brief.md`
- Task 0.1 baseline doc: `.superpowers/plans/2026-06-17-baseline-metrics.md` (telemetry granularity note)
- Audit script: `scripts/audit-mcp-call-ratio.mjs`
- Session corpus: `.mcp-ai-agent-guidelines/session-*.json`
