# Baseline MCP Adoption Metrics (2026-06-17)

| Metric | Value |
|---|---|
| Sessions inspected | 16 |
| Total tool calls | 46 |
| MCP tool calls | 44 |
| MCP ratio | 95.65% |
| Sessions starting with task-bootstrap | 0.00% |

Source: `scripts/audit-mcp-call-ratio.mjs` run on `.mcp-ai-agent-guidelines/session-*.json` snapshot.
Track A's verification gate requires MCP ratio to increase by at least +15 percentage points
post-rollout.

## Schema Note

The session JSON format contains `records` array with high-level workflow steps (e.g., DESIGN, PRIORITY, SECURITY, ACCEPTANCE) rather than individual tool call names. The `kind` field indicates the type of record:
- `invokeSkill`: represents execution of a routing tool or skill
- `parallel`: container for parallel step execution
- `gate`: conditional step gate
- `finalize`: workflow finalization

Each record's `stepLabel` is mapped to infer the logical tool category. The "bootstrap-first" metric reflects sessions where the first record is a routing invocation (not containers or gates).
