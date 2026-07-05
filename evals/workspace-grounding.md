# Workspace grounding — real headless / non-LLM consumer

**Issue:** [#1602](https://github.com/Anselmoo/mcp-ai-agent-guidelines/issues/1602) —
follow-up to ADR 0001 (`docs/adr/0001-remove-sampler-round-trip.md`).

**Question:** ADR 0001 reframed workspace grounding's primary value as serving
**headless / eval / non-LLM consumers** that can't execute a directive
themselves. Is that real, or speculative? Does a caller with **no model in the
loop** actually get problem-specific findings that cite real files?

## Method

A pure Node program — `evals/workspace-grounding-consumer.mjs` — with no
`claude -p`, no sampler, no model anywhere:

1. Points the **real** filesystem surface `createWorkspaceSurface()` (the same
   reader the MCP server injects) at the checked-in fixture `evals/fixtures/`.
2. Runs the real `qual-code-analysis` skill against a request that names a
   fixture file (`src/payments/charge.ts`, which contains an `any`-typed
   function — a signal the skill's content probes match).
3. Collects every `groundingScope: "workspace"` recommendation and verifies each
   cited path **resolves on disk** (`fs.stat`).
4. Writes `evals/workspace-grounding-results.json` and **exits non-zero** if no
   grounded finding cites a real file — so it is a gate, not a demo.

## Result: PASS

The headless consumer gets a workspace-grounded finding that cites the real
referenced file:

| skill | referenced file | grounded findings | citing real files | result |
|---|---|---|---|---|
| `qual-code-analysis` | `src/payments/charge.ts` | 1 | 1 | **PASS** |

> ``src/payments/charge.ts``: Audit type coverage: `any` types, missing return
> types, and untyped function parameters are defect entry points — strengthen the
> type boundary before adding features.

The finding is **problem-specific** (derived from the file's real content, citing
its real path), produced with no model executing the directive. The reframe's
justification is no longer speculative.

## Reproduce

```bash
npm run build                             # compiles the skill into dist/
node evals/workspace-grounding-consumer.mjs
```

Or run the executable proof / CI gate (no build needed):

```bash
npx vitest run src/tests/evals/workspace-grounding-consumer.test.ts
```

That test does the same thing against a freshly-written **temp** workspace (so it
also proves grounding works for arbitrary real files, not just the checked-in
fixture) and asserts the cited path exists on disk — no mock `WorkspaceReader`,
unlike the per-skill grounding unit tests in `src/tests/skills/*/*-grounding.test.ts`.
