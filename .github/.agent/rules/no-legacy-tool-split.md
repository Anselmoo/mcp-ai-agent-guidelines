# No-Legacy Tool-Surface Refactor Agent Rule

Use this rule when touching the auxiliary MCP surface (`memory`, `session`, `snapshot`).

## Objective

Preserve the granular no-legacy contract and avoid regressions to command-multiplexed tools.

## Required behavior

1. Prefer `agent-*-read|write|fetch|delete` style tool names.
2. Never introduce `agent-memory`, `agent-session`, or `agent-snapshot` as callable public tools.
3. Keep write paths explicit about disk persistence outcomes.
4. When docs or tests mention legacy names, migrate them in the same change.
5. Run targeted tests for:
   - `src/tests/tools/*(memory|session|snapshot|tool-call-handler)*`
   - `src/tests/runtime/mcp-server.test.ts`
   - `src/tests/mcp/tool-coverage-matrix.test.ts`
