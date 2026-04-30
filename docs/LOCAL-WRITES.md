Local write behavior for .mcp-ai-agent-guidelines

Summary
- The MCP now allows tools to persist workspace-state files under .mcp-ai-agent-guidelines even when the workspace "onboarding" or orchestration manifest is missing.
- Writes are still workspace-scoped by default: the state lives under the project workspace root in .mcp-ai-agent-guidelines/{memory,sessions,snapshots}.
- The underlying ToonMemoryInterface performs safe directory creation and atomic writes; the tool layer no longer blocks writes pre-onboarding.

Implications
- Programmatic flows and automated agents can persist memory, snapshots and session state without requiring manual onboarding steps.
- Existing path-safety protections remain in place (no path traversal). Writes overwrite existing files using atomic rename semantics.

How to opt out / notes
- If you want to prevent writes on uninitialized workspaces, revert the workspace-initialized guard at the tool layer or add a config flag in orchestration.toml to gate writes.
- State directory resolution honors any explicit configuration in the repository; refer to resolveSessionStateDir in src/runtime/session-store-utils.ts for the resolution order.

Tests & verification
- Unit tests added/updated under src/tests/tools to cover memory/session write behavior.
- Full test suite and coverage were run: Tests passed and coverage is reported in the project CI.
