# MCP Testing & Debugging

## 1. Why black-box MCP checks matter

Unit tests on helper functions are necessary, but they are not sufficient for MCP servers. A tool can be:

- defined in the source tree,
- validated correctly in isolation,
- even listed by `tools/list`,

…and still fail when a real MCP client calls it through the server entrypoint.

This repository already has direct coverage for workspace helpers in `src/tests/tools/workspace-tools.test.ts`, but the safer guardrail is an end-to-end client check that exercises the same path used by Copilot, Claude Desktop, or any other MCP host.

## 2. Preferred workflow: MCP Inspector CLI

The fastest contributor workflow is the official Inspector CLI because it avoids custom JSON-RPC framing and uses the real MCP client path.

### Quick checks

```bash
npm run build
npx -y @modelcontextprotocol/inspector --cli node dist/index.js --method tools/list
```

### Call an instruction tool

```bash
npx -y @modelcontextprotocol/inspector --cli node dist/index.js \
  --method tools/call \
  --tool-name document \
  --tool-arg 'request="Document this pseudocode in short markdown."'
```

### Call a workspace/helper tool

```bash
npx -y @modelcontextprotocol/inspector --cli node dist/index.js \
  --method tools/call \
  --tool-name workspace-read \
  --tool-arg 'scope="source"' \
  --tool-arg 'path="README.md"'
```

## 3. Repository-local smoke tests

These commands are intended for repeatable verification during development and CI:

```bash
npm run test:mcp:ts
npm run test:mcp:py:inspector
npm run test:mcp:smoke:inspector
```

### What each one covers

| Command | Purpose |
|---|---|
| `npm run test:mcp:ts` | Fast unit-level coverage for workspace tools and mock MCP envelopes |
| `npm run test:mcp:py:inspector` | Black-box smoke test via the official Inspector CLI |
| `npm run test:mcp:smoke:inspector` | Combined local regression pass |

## 4. Interpreting failures

| Symptom | Likely cause |
|---|---|
| Tool missing from `tools/list` | registration or build-generation issue |
| Tool is listed but `tools/call` returns `Unknown instruction tool` | routing/dispatch mismatch |
| Validation error such as missing required field | schema or argument-shape mismatch |
| Initialize or call timeout | startup, transport, or long-running tool behavior |

## 5. Workspace tool naming

`tools/list` now advertises the namespaced workspace surface:

- `workspace-list`
- `workspace-read`
- `workspace-artifact`
- `workspace-fetch`
- `workspace-compare`

The server still accepts the legacy bare aliases (`list`, `read`, `artifact`, `fetch`, `compare`) as a compatibility path, but new tests and manual checks should prefer the namespaced public names so `tools/list` and `tools/call` stay aligned.

## 6. Inspector-specific safety notes

The Inspector proxy can spawn local processes, so keep it local-only and authenticated.

- Prefer the default localhost binding
- Do **not** disable auth unless you fully understand the risk
- Use query params or config files only for trusted local workflows

---

This page complements the general orchestration design notes with a practical verification loop for real MCP clients.
