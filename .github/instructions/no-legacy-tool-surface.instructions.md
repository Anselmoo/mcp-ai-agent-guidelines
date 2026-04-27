---
description: "Use when refactoring or extending memory/session/snapshot tools. Enforces no-legacy command multiplexing and explicit persistence semantics."
applyTo: "src/tools/{memory-tools.ts,session-tools.ts,snapshot-tools.ts,tool-call-handler.ts}"
---
# No-Legacy Auxiliary Tool Surface Rules

When touching the auxiliary MCP tool surface, keep these constraints:

1. **No command multiplexing**
   - Do not add or reintroduce `command` enums for `agent-memory`, `agent-session`, or `agent-snapshot`.
   - Keep granular tools only:
     - memory: `agent-memory-read|write|fetch|delete`
     - session: `agent-session-read|write|fetch|delete`
     - snapshot: `agent-snapshot-read|write|fetch|compare|delete`

2. **Persistence semantics must be explicit**
   - `*-write` tools must return clear disk-persistence success/failure messages.
   - Include the target state directory in failure messages when possible.

3. **Validation at tool boundary**
   - Tool inputs must be schema-validated using shared validators.
   - Errors should be deterministic and actionable.

4. **Backward compatibility policy**
   - Legacy monolithic aliases (`agent-memory`, `agent-session`, `agent-snapshot`) are intentionally retired.
   - If referenced in docs/tests, update them to granular names.

5. **Tests required for any surface changes**
   - Update `src/tests/tools/*` and runtime MCP routing tests to match renamed tools.
   - Ensure no drift between listed tools and test coverage matrices.
