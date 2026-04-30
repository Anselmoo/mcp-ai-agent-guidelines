---
description: "Use when editing this repository to enforce safe local tool usage, local build/restart hygiene, and coverage-first changes."
applyTo: "**/*"
---
# Local tool safety and workspace hygiene

This repository currently has unreliable local file creation and direct state deletion behavior. When working here, prefer safer project workflows and keep the local MCP server aligned with the latest build.

1. **Avoid unsafe direct tool usage**
   - Do not use `fetch_webpage` in this workspace unless there is no other way to get the data.
   - Do not call direct delete variants such as `agent-memory-delete` or `mcp_ai-agent-guid_agent-memory-delete`.
   - Prefer explicit workspace edits, `agent-memory-read|write|fetch`, and `agent-session/read|write` flows instead.

2. **Keep the local build current**
   - Before running or debugging anything in this repo, run `npm run build`.
   - Restart the local MCP server after rebuilding so the agent uses the newest `dist/` artifacts.
   - If local tools fail unexpectedly, rebuild and restart before changing the tool logic.

3. **Do not delete `.mcp-ai-agent-guidelines/` manually**
   - Avoid hard deleting the local state directory for troubleshooting.
   - If the state directory needs to be reset, use the repository’s supported reset or onboarding workflows instead.

4. **Coverage-first development**
   - New source files in `src/` must ship tests and must not lower the project coverage rate.
   - Mirror new code under `src/tests/...` and verify with `npm run test:coverage`.
   - Add cases for both positive and negative branches in new logic.

5. **Make diagnostics actionable**
   - When writing warnings or failure messages, call out the required recovery steps explicitly: `npm run build`, restart the MCP server, and avoid unsafe direct delete tools.
   - Explain why the tool path is blocked, not just that it failed.
