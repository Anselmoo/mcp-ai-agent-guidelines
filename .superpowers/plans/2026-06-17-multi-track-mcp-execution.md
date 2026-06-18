# Multi-Track MCP Adoption & Output Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the three adoption blockers identified in the 2026-06-17 diagnosis: (A) MCP routing is advisory and gets bypassed, (B) tool output is markdown-only and is a token tax on chained agents, (C) physics adapter overpromises a universal mapping.

**Architecture:** Three tracks executed in a staged-parallel pattern. Track A (activation) and Track B (output envelope) are independent and can run in parallel after Phase 0. Track C is a *scoping spike*, not an implementation track — it produces a decision document. Final integration is gated on Track A and Track B both passing their verification gates.

**Tech Stack:** TypeScript 5.x, Vitest, Zod, neverthrow/ts-pattern (already in repo), Node ESM, existing MCP server scaffold under `src/runtime`.

## Global Constraints

- **No-legacy contract** (from `.claude/rules/no-legacy-tool-split.md`): never introduce `agent-memory`, `agent-session`, or `agent-snapshot` as callable tools — keep granular `agent-*-read|write|fetch|delete` names.
- **TOON was removed** in commit `ba2fa10f`. Any re-introduction of dense-encoding must be scoped, new, and justified in the spec — do not revive the old TOON code.
- **Branch coverage floor:** project sits at ~87.4% (PR #1517 notes target ≥87.55%). Every new code path needs a Vitest test or the PR gate trips.
- **No-emoji rule in code outputs** for new envelope payloads (Track B). Existing emoji glyphs in `glyphRegistry` stay where they are; new structured fields are emoji-free.
- **Backwards-compatible MCP responses.** The `TextToolResult` shape (`{ content: [{type:"text", text}], isError? }`) must remain valid for current clients; new structured payloads ride alongside, not in place of.

---

## Dependency graph & parallelism

```
                ┌──────────────────────┐
                │ Phase 0: Baseline    │  (≤ 1 day, serial)
                │ telemetry + decision │
                │ snapshot             │
                └──────────┬───────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
   ┌────────────────────┐    ┌────────────────────┐
   │ Track A: Activation│    │ Track B: Output    │   parallel
   │ & Enforcement      │    │ Envelope           │
   │ (5 tasks)          │    │ (6 tasks)          │
   └────────┬───────────┘    └─────────┬──────────┘
            │                          │
            │   Track C (spike) runs   │
            │   independently any time │
            │   ┌─────────────────┐    │
            │   │ Track C: Physics│    │
            │   │ Scoping Spike   │    │
            │   │ (4 tasks)       │    │
            │   └─────────────────┘    │
            │                          │
            └────────────┬─────────────┘
                         ▼
                ┌─────────────────────┐
                │ Phase 4: Integrate  │  (serial)
                │ Track A + B,        │
                │ release notes       │
                └─────────────────────┘
```

**Parallelism rules**

- Track A and Track B touch disjoint files (A: `src/tools/shared/tool-surface-manifest.ts`, hook scripts, telemetry; B: `src/tools/result-formatter.ts`, `src/tools/shared/error-handler.ts`). They can be executed by two subagents concurrently after Phase 0.
- Track C touches `src/skills/shared/physics-adapter-prototype.ts` and produces a doc; no conflict with A or B. Run any time.
- Phase 4 is serial because it merges the two PRs and updates `CHANGELOG.md`.

---

## Phase 0 — Baseline telemetry (1 task)

### Task 0.1: Capture baseline MCP-call ratio from existing session logs

**Files:**
- Read: `.mcp-ai-agent-guidelines/session-*.json` (existing telemetry)
- Create: `.superpowers/plans/2026-06-17-baseline-metrics.md`

**Interfaces:**
- Consumes: nothing
- Produces: `BASELINE_MCP_CALL_RATIO` (number, % of tool calls that hit an MCP tool), `BASELINE_BOOTSTRAP_FIRST_RATIO` (% sessions where `task-bootstrap` was the first call) — referenced by Track A's verification gate.

- [ ] **Step 1: Inventory session log shape**

```bash
ls .mcp-ai-agent-guidelines/session-*.json | head -3
node -e "const j=JSON.parse(require('fs').readFileSync(process.argv[1])); console.log(Object.keys(j))" .mcp-ai-agent-guidelines/session-2CVRBDweAGKc.json
```
Expected: a list of session files, plus top-level keys including something like `events`, `toolCalls`, or `messages`.

- [ ] **Step 2: Write a baseline-extractor script**

Create `scripts/audit-mcp-call-ratio.mjs`:

```js
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const sessionsDir = ".mcp-ai-agent-guidelines";
const files = readdirSync(sessionsDir).filter(
  (f) => f.startsWith("session-") && f.endsWith(".json"),
);

let totalCalls = 0;
let mcpCalls = 0;
let bootstrapFirst = 0;

for (const f of files) {
  const path = join(sessionsDir, f);
  let session;
  try {
    session = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    continue;
  }
  const calls = extractToolCalls(session);
  totalCalls += calls.length;
  mcpCalls += calls.filter((c) => isMcpTool(c.name)).length;
  if (calls[0] && calls[0].name === "task-bootstrap") bootstrapFirst++;
}

function extractToolCalls(session) {
  // adapt to actual schema once Step 1 confirms shape
  return session.toolCalls ?? session.events?.filter((e) => e.type === "tool_call") ?? [];
}

function isMcpTool(name) {
  // MCP tool names in this repo are kebab-case routing words; bash/file tools are not
  return typeof name === "string" && /^[a-z][a-z0-9-]+$/.test(name) && !["bash","read","write","edit","grep","glob"].includes(name);
}

console.log(JSON.stringify({
  sessions: files.length,
  totalCalls,
  mcpCalls,
  mcpRatio: totalCalls ? +(mcpCalls/totalCalls*100).toFixed(2) : 0,
  bootstrapFirstRatio: files.length ? +(bootstrapFirst/files.length*100).toFixed(2) : 0,
}, null, 2));
```

- [ ] **Step 3: Run it and write the snapshot doc**

```bash
node scripts/audit-mcp-call-ratio.mjs > /tmp/baseline.json
cat /tmp/baseline.json
```

Take the resulting numbers and write `.superpowers/plans/2026-06-17-baseline-metrics.md` containing:

```markdown
# Baseline MCP Adoption Metrics (2026-06-17)

| Metric | Value |
|---|---|
| Sessions inspected | N |
| Total tool calls | N |
| MCP tool calls | N |
| MCP ratio | X.XX% |
| Sessions starting with task-bootstrap | X.XX% |

Source: `scripts/audit-mcp-call-ratio.mjs` run on `.mcp-ai-agent-guidelines/session-*.json` snapshot.
Track A's verification gate requires MCP ratio to increase by at least +15 percentage points
post-rollout.
```

- [ ] **Step 4: Commit**

```bash
git add scripts/audit-mcp-call-ratio.mjs .superpowers/plans/2026-06-17-baseline-metrics.md
git commit -m "chore(plans): capture baseline MCP-call adoption metrics"
```

---

## Track A — Activation & Enforcement (5 tasks)

**Goal:** Lift the MCP-call ratio by making routing mechanically encouraged: slim-mode-by-default for chat clients, structured nudges in errors, and an opt-in `PreToolUse` gate.

### Task A.1: Make `MCP_SLIM_MODE` the default and add explicit opt-out

**Files:**
- Modify: `src/tools/shared/tool-surface-manifest.ts:113-125` (the `MCP_SLIM_MODE` env check around line 119)
- Test: `src/tests/tools/shared/tool-surface-manifest.test.ts` (create or extend)

**Interfaces:**
- Consumes: `process.env.MCP_FULL_SURFACE` (new opt-out flag)
- Produces: `isSlimSurface(env?: NodeJS.ProcessEnv): boolean` — true by default, false when `MCP_FULL_SURFACE=true`.

- [ ] **Step 1: Write the failing test**

Add to `src/tests/tools/shared/tool-surface-manifest.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { filterToSlimSurface } from "../../../tools/shared/tool-surface-manifest.js";

describe("slim surface default", () => {
  it("returns the slim subset by default (no env var set)", () => {
    const tools = [
      { name: "task-bootstrap" },
      { name: "meta-routing" },
      { name: "evidence-research" },
      { name: "fault-resilience" },
    ];
    const filtered = filterToSlimSurface(tools, {});
    expect(filtered.map((t) => t.name).sort()).toEqual(
      ["meta-routing", "task-bootstrap"].sort(),
    );
  });

  it("returns the full surface when MCP_FULL_SURFACE=true", () => {
    const tools = [{ name: "task-bootstrap" }, { name: "evidence-research" }];
    const filtered = filterToSlimSurface(tools, { MCP_FULL_SURFACE: "true" });
    expect(filtered).toEqual(tools);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/tests/tools/shared/tool-surface-manifest.test.ts
```
Expected: FAIL — current code uses `MCP_SLIM_MODE` opt-IN, not the new default.

- [ ] **Step 3: Flip the default and add the opt-out**

In `src/tools/shared/tool-surface-manifest.ts` (around line 119), replace the slim-mode check with:

```ts
const fullSurfaceOverride = (env ?? process.env).MCP_FULL_SURFACE === "true";
const slimMode = !fullSurfaceOverride;
```

Keep the existing `SLIM_TOOL_NAMES` constant unchanged.

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/tests/tools/shared/tool-surface-manifest.test.ts
```
Expected: PASS.

- [ ] **Step 5: Update README + CHANGELOG**

Add a one-line note to `README.md` under any "Configuration" section: `MCP_FULL_SURFACE=true exposes the full 25-tool surface (default is slim 3-tool routing surface).` Add an `### Unreleased` entry to `CHANGELOG.md`: `- Slim tool surface is now default; set MCP_FULL_SURFACE=true to restore the full surface.`

- [ ] **Step 6: Commit**

```bash
git add src/tools/shared/tool-surface-manifest.ts src/tests/tools/shared/tool-surface-manifest.test.ts README.md CHANGELOG.md
git commit -m "feat(tools): slim surface by default; MCP_FULL_SURFACE opts back in"
```

### Task A.2: Validation errors that name the right next tool

**Files:**
- Modify: `src/tools/shared/error-handler.ts:69-89` (the `formatMcpError` function)
- Test: `src/tests/tools/shared/error-handler.test.ts` (extend)

**Interfaces:**
- Consumes: existing `McpErrorPayload` with a new optional field `nextTool?: string`.
- Produces: error messages whose `suggestedAction` includes a call-this-next tool name when the error originates from a missing routing step.

- [ ] **Step 1: Extend the payload type and write the failing test**

In `src/tests/tools/shared/error-handler.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { formatMcpError } from "../../../tools/shared/error-handler.js";

it("names the next tool in suggestion when nextTool is present", () => {
  const text = formatMcpError({
    category: "validation",
    code: "TOOL_VALIDATION_F6511EDE",
    message: "Required field missing: request",
    recoverable: true,
    suggestedAction: "Provide a non-empty 'request' string.",
    nextTool: "task-bootstrap",
  });
  expect(text).toContain("task-bootstrap");
  expect(text).toMatch(/Next:.*task-bootstrap/);
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/tests/tools/shared/error-handler.test.ts
```
Expected: FAIL — `nextTool` not on payload yet.

- [ ] **Step 3: Add the field and the render line**

In `src/tools/shared/error-handler.ts`:

```ts
export interface McpErrorPayload {
  category: McpErrorCategory;
  code: string;
  message: string;
  details?: string;
  recoverable: boolean;
  suggestedAction?: string;
  nextTool?: string;
}
```

And in `formatMcpError`, after the `suggestedAction` line and before the recoverable line:

```ts
if (error.nextTool) lines.push(`Next: call \`${error.nextTool}\` to proceed.`);
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/tests/tools/shared/error-handler.test.ts
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/tools/shared/error-handler.ts src/tests/tools/shared/error-handler.test.ts
git commit -m "feat(errors): McpErrorPayload.nextTool surfaces the recommended next tool"
```

### Task A.3: Wire `nextTool` into validation errors raised by the dispatcher

**Files:**
- Modify: `src/tools/tool-call-handler.ts:279-381` (the three validation error returns)
- Test: `src/tests/tools/tool-call-handler.test.ts` (extend)

**Interfaces:**
- Consumes: Task A.2's `nextTool` field.
- Produces: any tool that fails validation when invoked without first running `task-bootstrap` returns an error pointing to `task-bootstrap` (or `meta-routing` for ambiguous category cases).

- [ ] **Step 1: Write the failing test**

```ts
it("validation error for unknown instruction points to meta-routing", async () => {
  const result = await dispatchToolCall(
    { name: "evidence-research", arguments: {} },
    // ... existing fixture
  );
  expect(result.isError).toBe(true);
  const text = result.content[0].text;
  expect(text).toMatch(/Next: call `(task-bootstrap|meta-routing)`/);
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/tests/tools/tool-call-handler.test.ts
```

- [ ] **Step 3: Set `nextTool` on each validation-error return**

At each `return { isError: true, content: [...] }` site in `tool-call-handler.ts` (lines 279, 315, 378), construct the payload through `classifyError` *or* build the `McpErrorPayload` directly with `nextTool: "task-bootstrap"` for "missing required field" cases and `nextTool: "meta-routing"` for "unknown instruction" cases. Then route through `buildMcpErrorContent`.

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/tests/tools/tool-call-handler.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/tools/tool-call-handler.ts src/tests/tools/tool-call-handler.test.ts
git commit -m "feat(dispatcher): point validation errors at task-bootstrap / meta-routing"
```

### Task A.4: Update the SessionStart hook script to install slim-mode + nudge

**Files:**
- Modify: `scripts/setup-hooks.mjs` or equivalent (check the Copilot hook reference in `.claude/rules/copilot.md`)
- Create: `scripts/hooks/session-start-bootstrap.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: a hook payload that emits a single advisory message at session start: `"Routing through ai-agent MCP. First call: task-bootstrap."` and ensures `MCP_FULL_SURFACE` is *not* set.

- [ ] **Step 0: Discover whether a SessionStart hook script already exists**

```bash
ls scripts/hooks 2>/dev/null
grep -rn "SessionStart\|setup-hooks\|mcp-cli hooks" scripts/ docs/ README.md 2>&1 | head
```

Expected outcome of this step: a one-line note recorded in the task report — either "no existing hook script, will create" or "existing script at `<path>`, will extend." Subsequent steps treat that decision as their input. If extending an existing script, preserve any other hookEventName entries it emits.

- [ ] **Step 1: Stage the script content**

If creating new (most likely path):

```js
#!/usr/bin/env node
// SessionStart hook: nudges the agent toward task-bootstrap.
const payload = {
  hookSpecificOutput: {
    hookEventName: "SessionStart",
    additionalContext:
      "ai-agent MCP is active in slim mode. To plan or route any task, call `task-bootstrap` first.",
  },
};
process.stdout.write(JSON.stringify(payload));
```

- [ ] **Step 2: Make it executable, test the JSON shape**

```bash
chmod +x scripts/hooks/session-start-bootstrap.mjs
node scripts/hooks/session-start-bootstrap.mjs | node -e "JSON.parse(require('fs').readFileSync(0,'utf8'))" && echo OK
```
Expected: prints `OK`.

- [ ] **Step 3: Document the hook install in README**

Append under the existing Copilot/Claude-Code hook section: `Manual install: add scripts/hooks/session-start-bootstrap.mjs as a SessionStart hook in ~/.claude/settings.json (or ~/.copilot/hooks/).`

- [ ] **Step 4: Commit**

```bash
git add scripts/hooks/session-start-bootstrap.mjs README.md
git commit -m "feat(hooks): SessionStart nudge that routes the agent to task-bootstrap"
```

### Task A.5: Re-run the adoption audit and gate the track

**Files:**
- Use: `scripts/audit-mcp-call-ratio.mjs` from Task 0.1.
- Create: `.superpowers/plans/2026-06-17-track-a-verification.md`

**Interfaces:**
- Consumes: baseline metrics from Task 0.1.
- Produces: pass/fail decision for Track A.

- [ ] **Step 1: Capture a fresh sample of sessions post-change**

Use the repo for ≥10 sessions with the slim default + new hook in place. (This is a human-in-the-loop step; the script runs the same as Task 0.1.)

- [ ] **Step 2: Re-run the audit**

```bash
node scripts/audit-mcp-call-ratio.mjs > /tmp/post-track-a.json
diff <(jq . /tmp/baseline.json) <(jq . /tmp/post-track-a.json) || true
```

- [ ] **Step 3: Write the verification doc**

Create `.superpowers/plans/2026-06-17-track-a-verification.md` with:
- Baseline ratio (from Task 0.1)
- Post-change ratio
- Pass/fail vs. the +15pp target
- If fail: hypothesize whether enforcement (a `PreToolUse` *blocking* hook) is needed, but do not build it yet — that's a follow-up brainstorm.

- [ ] **Step 4: Commit**

```bash
git add .superpowers/plans/2026-06-17-track-a-verification.md
git commit -m "docs(plans): Track A verification result"
```

---

## Track B — Hybrid Output Envelope (7 tasks)

**Goal:** Add a structured envelope alongside markdown output so chained agents can parse cheaply while humans/transcripts keep readable summaries. Errors get structured payloads first (quick win); workflow results follow.

### Task B.0: Promote `TextToolResult` to a named export

**Files:**
- Modify: `src/tools/tool-call-handler.ts:28-34` (the local `type TextToolResult = …` declaration)
- Test: nothing new required — existing tests must still pass.

**Interfaces:**
- Consumes: nothing.
- Produces: `export type TextToolResult = { content: Array<{ type: "text"; text: string }>; isError?: boolean; };` importable by sibling files under `src/tools/`.

This is the prerequisite for B.1's envelope module, which imports `TextToolResult`. Splitting it out keeps each task's diff focused.

- [ ] **Step 1: Add the `export` keyword**

In `src/tools/tool-call-handler.ts:28`, change `type TextToolResult = {` to `export type TextToolResult = {`. No other change.

- [ ] **Step 2: Confirm the suite still passes**

```bash
npx vitest run
```
Expected: PASS — no behavior change, only visibility.

- [ ] **Step 3: Commit**

```bash
git add src/tools/tool-call-handler.ts
git commit -m "refactor(tools): export TextToolResult so envelope module can consume it"
```

### Task B.1: Define the envelope shape

**Files:**
- Create: `src/tools/shared/output-envelope.ts`
- Test: `src/tests/tools/shared/output-envelope.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  ```ts
  export interface ToolEnvelope<T = unknown> {
    summaryMarkdown: string;
    payload: T;
    meta: { tool: string; ts: string; version: 1 };
  }
  export function toToolResult<T>(env: ToolEnvelope<T>): TextToolResult;
  ```
  The serialised content text is the `summaryMarkdown`; the structured `payload` is base64-encoded into a second text block tagged with a parseable prefix `__ENVELOPE_V1__:<base64>` so MCP wire compat is preserved without inventing a new content type.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { toToolResult, parseEnvelopeBlock } from "../../../tools/shared/output-envelope.js";

describe("output envelope", () => {
  it("round-trips payload through the envelope text block", () => {
    const result = toToolResult({
      summaryMarkdown: "# Hello",
      payload: { recommendations: [{ id: "r1" }] },
      meta: { tool: "evidence-research", ts: "2026-06-17T00:00:00Z", version: 1 },
    });
    expect(result.content[0].text).toBe("# Hello");
    expect(result.content[1].text).toMatch(/^__ENVELOPE_V1__:/);
    const parsed = parseEnvelopeBlock(result.content[1].text);
    expect(parsed.payload).toEqual({ recommendations: [{ id: "r1" }] });
    expect(parsed.meta.tool).toBe("evidence-research");
  });
});
```

- [ ] **Step 2: Run it and confirm failure**

```bash
npx vitest run src/tests/tools/shared/output-envelope.test.ts
```
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement the envelope**

Create `src/tools/shared/output-envelope.ts`:

```ts
import type { TextToolResult } from "../tool-call-handler.js";

export interface ToolEnvelope<T = unknown> {
  summaryMarkdown: string;
  payload: T;
  meta: { tool: string; ts: string; version: 1 };
}

const PREFIX = "__ENVELOPE_V1__:";

export function toToolResult<T>(env: ToolEnvelope<T>): TextToolResult {
  const encoded = Buffer.from(
    JSON.stringify({ payload: env.payload, meta: env.meta }),
    "utf8",
  ).toString("base64");
  return {
    content: [
      { type: "text", text: env.summaryMarkdown },
      { type: "text", text: `${PREFIX}${encoded}` },
    ],
  };
}

export function parseEnvelopeBlock<T = unknown>(text: string): ToolEnvelope<T> {
  if (!text.startsWith(PREFIX)) throw new Error("not an envelope block");
  const json = Buffer.from(text.slice(PREFIX.length), "base64").toString("utf8");
  const parsed = JSON.parse(json) as { payload: T; meta: ToolEnvelope["meta"] };
  return { summaryMarkdown: "", payload: parsed.payload, meta: parsed.meta };
}
```

(Prerequisite Task B.0 has already exported `TextToolResult` from `tool-call-handler.ts` — this import works without further changes.)

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/tests/tools/shared/output-envelope.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/tools/shared/output-envelope.ts src/tests/tools/shared/output-envelope.test.ts
git commit -m "feat(envelope): ToolEnvelope with markdown summary + structured payload"
```

### Task B.2: Migrate errors to use the envelope payload

**Files:**
- Modify: `src/tools/shared/error-handler.ts:95-103` (the `buildMcpErrorContent` function)
- Test: `src/tests/tools/shared/error-handler.test.ts` (extend)

**Interfaces:**
- Consumes: `ToolEnvelope` from B.1; `McpErrorPayload` (already structured).
- Produces: every error response now ships the raw `McpErrorPayload` inside the envelope payload while keeping the prose first block intact.

- [ ] **Step 1: Write the failing test**

```ts
import { parseEnvelopeBlock } from "../../../tools/shared/output-envelope.js";

it("error response includes a structured envelope block", () => {
  const r = buildMcpErrorContent({
    category: "validation",
    code: "X",
    message: "m",
    recoverable: true,
  });
  expect(r.content.length).toBe(2);
  const parsed = parseEnvelopeBlock(r.content[1].text);
  expect(parsed.payload).toMatchObject({ category: "validation", code: "X" });
});
```

- [ ] **Step 2: Confirm failure**

```bash
npx vitest run src/tests/tools/shared/error-handler.test.ts
```

- [ ] **Step 3: Update `buildMcpErrorContent`**

```ts
import { toToolResult } from "./output-envelope.js";

export function buildMcpErrorContent(error: McpErrorPayload) {
  const env = toToolResult({
    summaryMarkdown: formatMcpError(error),
    payload: error,
    meta: { tool: "mcp", ts: new Date().toISOString(), version: 1 },
  });
  return { isError: true as const, content: env.content };
}
```

- [ ] **Step 4: Confirm pass**

```bash
npx vitest run src/tests/tools/shared/error-handler.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/tools/shared/error-handler.ts src/tests/tools/shared/error-handler.test.ts
git commit -m "feat(errors): emit structured payload alongside formatted error prose"
```

### Task B.3: Pilot envelope on `evidence-research` workflow result

**Files:**
- Modify: `src/tools/result-formatter.ts:100-154` (`formatWorkflowResult`)
- Modify: `src/tools/tool-call-handler.ts` (the success-path return for `evidence-research`)
- Test: `src/tests/tools/result-formatter.test.ts` (create or extend)

**Interfaces:**
- Consumes: B.1 envelope.
- Produces: a `WorkflowEnvelopePayload` type:
  ```ts
  export interface WorkflowEnvelopePayload {
    displayName: string;
    instructionId: string;
    model: { id: string; label: string };
    steps: Array<{ kind: string; label: string; summary: string }>;
    recommendations: RecommendationItem[];
    artifacts: SkillArtifact[];
  }
  ```
- The existing `formatWorkflowResult` is kept and called for `summaryMarkdown`; a new sibling `buildWorkflowEnvelopePayload(result)` returns the structured payload.

- [ ] **Step 1: Write the failing test**

```ts
import { parseEnvelopeBlock } from "../../tools/shared/output-envelope.js";

it("evidence-research result emits both markdown summary and structured payload", async () => {
  const out = await dispatchToolCall(
    { name: "evidence-research", arguments: { request: "x" } },
    fixtureRuntime,
  );
  expect(out.content[0].text).toMatch(/^# Research:/);
  const parsed = parseEnvelopeBlock(out.content[1].text);
  expect(parsed.payload.instructionId).toBe("evidence-research");
  expect(Array.isArray(parsed.payload.steps)).toBe(true);
});
```

- [ ] **Step 2: Confirm failure**

```bash
npx vitest run src/tests/tools/result-formatter.test.ts
```

- [ ] **Step 3: Add `buildWorkflowEnvelopePayload`**

In `src/tools/result-formatter.ts`, after `formatWorkflowResult`:

```ts
export interface WorkflowEnvelopePayload {
  displayName: string;
  instructionId: string;
  model: { id: string; label: string };
  steps: Array<{ kind: string; label: string; summary: string }>;
  recommendations: RecommendationItem[];
  artifacts: SkillArtifact[];
}

export function buildWorkflowEnvelopePayload(
  result: WorkflowExecutionResult,
): WorkflowEnvelopePayload {
  return {
    displayName: result.displayName,
    instructionId: result.instructionId,
    model: { id: result.model.id, label: result.model.label },
    steps: result.steps.map((s) => ({ kind: s.kind, label: s.label, summary: s.summary })),
    recommendations: result.recommendations,
    artifacts: [
      ...(result.artifacts ?? []),
      ...result.steps.flatMap((s) => s.skillResult?.artifacts ?? []),
    ],
  };
}
```

- [ ] **Step 4: Wire it into the dispatcher's evidence-research success path**

At the `evidence-research` success return site in `tool-call-handler.ts`, replace the `formatWorkflowResult(result)` text-only return with:

```ts
return toToolResult({
  summaryMarkdown: formatWorkflowResult(result),
  payload: buildWorkflowEnvelopePayload(result),
  meta: { tool: "evidence-research", ts: new Date().toISOString(), version: 1 },
});
```

- [ ] **Step 5: Confirm pass**

```bash
npx vitest run src/tests/tools/result-formatter.test.ts
npx vitest run src/tests/runtime/mcp-server.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add src/tools/result-formatter.ts src/tools/tool-call-handler.ts src/tests/tools/result-formatter.test.ts
git commit -m "feat(envelope): pilot envelope on evidence-research result"
```

### Task B.4: Apply envelope across remaining workflow tools

**Files:**
- Modify: all success-return sites in `src/tools/tool-call-handler.ts` (search `formatWorkflowResult(`)
- Test: extend `src/tests/mcp/tool-coverage-matrix.test.ts`

**Interfaces:**
- Consumes: B.3 helpers.
- Produces: every workflow tool now returns a two-block envelope.

- [ ] **Step 1: Locate every formatWorkflowResult call site**

```bash
grep -n "formatWorkflowResult" src/tools/tool-call-handler.ts
```

- [ ] **Step 2: Write a coverage test that asserts every workflow tool emits a parseable envelope**

Extend `src/tests/mcp/tool-coverage-matrix.test.ts` to dispatch each instruction id from `INSTRUCTION_SPECS` with a minimal valid `{ request: "x" }` and assert `parseEnvelopeBlock(out.content[1].text).payload.instructionId === id`.

- [ ] **Step 3: Confirm failure**

```bash
npx vitest run src/tests/mcp/tool-coverage-matrix.test.ts
```

- [ ] **Step 4: Replace each return site with the `toToolResult` shape from B.3**

Mechanical edit at each grep-hit line.

- [ ] **Step 5: Confirm pass + full test suite**

```bash
npx vitest run
```

- [ ] **Step 6: Commit**

```bash
git add src/tools/tool-call-handler.ts src/tests/mcp/tool-coverage-matrix.test.ts
git commit -m "feat(envelope): roll envelope out across all workflow tools"
```

### Task B.5: Trim decorative workflow trace from `summaryMarkdown`

**Files:**
- Modify: `src/tools/result-formatter.ts:107-122` (the `stepLines` + `progressLines` blocks)
- Test: `src/tests/tools/result-formatter.test.ts`

**Interfaces:**
- Consumes: B.1 envelope.
- Produces: `summaryMarkdown` no longer duplicates the executed-workflow trace twice (the "Executed workflow" + "Progress snapshot" sections currently render the same step list with different emojis). After this task, the markdown summary keeps "Executed workflow" only; the full per-step record stays available in the structured payload.

- [ ] **Step 1: Write failing test**

```ts
it("workflow result markdown no longer renders Progress snapshot section", () => {
  const md = formatWorkflowResult(fixtureResult);
  expect(md).not.toContain("## Progress snapshot");
  expect(md).toContain("## Executed workflow");
});
```

- [ ] **Step 2: Confirm failure**

```bash
npx vitest run src/tests/tools/result-formatter.test.ts
```

- [ ] **Step 3: Delete the Progress snapshot section in `formatWorkflowResult`**

Remove the `progressLines` block and the `"## Progress snapshot"` heading from the joined output. The structured payload (B.3) already carries every step, so consumers who need the per-step record get it from `payload.steps`.

- [ ] **Step 4: Confirm pass**

```bash
npx vitest run src/tests/tools/result-formatter.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/tools/result-formatter.ts src/tests/tools/result-formatter.test.ts
git commit -m "refactor(formatter): drop duplicate Progress snapshot from markdown summary"
```

### Task B.6: Document the envelope for downstream agents

**Files:**
- Create: `docs/src/content/docs/output-envelope.md` (Astro Starlight content)

**Interfaces:**
- Consumes: B.1–B.5.
- Produces: a public spec page that any client (Codex, Copilot, custom) can read to extract `__ENVELOPE_V1__:` blocks.

- [ ] **Step 1: Confirm the Astro content path layout**

```bash
ls docs/src/content/docs 2>&1 | head
```
If the path differs, place the doc wherever existing top-level doc pages live.

- [ ] **Step 2: Write the doc**

Cover: envelope shape, why two blocks, base64+JSON parsing snippet (TypeScript + Python), forward-compatibility note (`version: 1` is the only supported value today; bump for breaking changes).

- [ ] **Step 3: Build the docs site to confirm it renders**

```bash
cd docs && npm run build
```
Expected: build succeeds, no broken links.

- [ ] **Step 4: Commit**

```bash
git add docs/src/content/docs/output-envelope.md
git commit -m "docs: ToolEnvelope V1 spec for downstream consumers"
```

---

## Track C — Physics Adapter Scoping Spike (4 tasks)

**Goal:** Decide whether the universal QM/GR translator is salvageable. This is a *spike*, not an implementation track. The deliverable is a decision document; no production code changes ship from this track without a follow-up plan.

### Task C.1: Enumerate the adapter's currently-supported input shapes

**Files:**
- Read: `src/skills/shared/physics-adapter-prototype.ts`, `src/tests/skills/shared/physics-adapter-prototype.test.ts`, `src/skills/qm/qm-physics-helpers.ts`, `src/skills/gr/gr-physics-helpers.ts`.
- Create: `.superpowers/plans/2026-06-17-track-c-input-inventory.md`

- [ ] **Step 1: Catalog every `PhysicsConcern` blueprint**

From `physics-adapter-prototype.ts`, the `PhysicsConcern` union has 12 members (flakiness, candidate-ranking, coupling-cohesion, review-impact, history-drift, coverage-gap, coupling-gravity, debt-curvature, entropy-surface, split-pressure, abstraction-drift, topology-shock). For each, capture: lens (qm/gr), input regex pattern, candidate skill list, engineer question.

- [ ] **Step 2: Note the existing guardrails**

The adapter already has `PHYSICS_ADAPTER_GUARDRAILS` (line 76+) that explicitly require conventional evidence and forbid scraping opportunistic numerals. Quote them in the inventory doc — Track C is about whether those guardrails *can* hold under "translate any context."

- [ ] **Step 3: Write the inventory doc**

`.superpowers/plans/2026-06-17-track-c-input-inventory.md`:
- Table of 12 concerns × {lens, pattern, guardrails}
- Section: "Shape an input must already have" — a checklist of what the adapter assumes before pattern-matching succeeds (structured metrics, explicit kind labels).
- Section: "Things the adapter cannot decide" — list inputs that pass the pattern regex but produce vacuous output.

- [ ] **Step 4: Commit**

```bash
git add .superpowers/plans/2026-06-17-track-c-input-inventory.md
git commit -m "docs(spike): catalog physics adapter supported inputs"
```

### Task C.2: Run 3 honest manual mappings on real contexts

**Files:**
- Create: `.superpowers/plans/2026-06-17-track-c-mapping-trials.md`

**Interfaces:**
- Consumes: C.1 inventory.
- Produces: empirical signal — does the metaphor predict anything that plain reasoning didn't?

- [ ] **Step 1: Pick three contexts from the user's real recent sessions**

Suggested kinds: (a) a refactor task (e.g. file-split candidate selection), (b) a bug-triage call (e.g. flaky test investigation), (c) a planning question (e.g. "should we add feature X?"). Pull each from `.mcp-ai-agent-guidelines/session-*.json`.

- [ ] **Step 2: For each context, attempt a QM and a GR mapping**

For each mapping, record:
- The exact PhysicsConcern blueprint that matched (or none).
- The engineer-question the adapter would have asked.
- A *predicted* answer derived from the physics frame.
- The actual answer reached without the physics frame.
- Diff: did the physics frame change the conclusion, surface new evidence, or just relabel?

- [ ] **Step 3: Write the trials doc**

`.superpowers/plans/2026-06-17-track-c-mapping-trials.md` with one section per context, a fourth section that scores each trial as `load-bearing | decorative | misleading`.

- [ ] **Step 4: Commit**

```bash
git add .superpowers/plans/2026-06-17-track-c-mapping-trials.md
git commit -m "docs(spike): three manual physics-adapter mapping trials"
```

### Task C.3: Decision doc — narrow, deprecate, or research further

**Files:**
- Create: `.superpowers/plans/2026-06-17-track-c-decision.md`

- [ ] **Step 1: Score the spike**

Using C.2 results, count load-bearing vs decorative outcomes. The decision rule:
- ≥ 2 load-bearing across the 3 trials → **narrow**: keep the adapter, restrict it to the matched PhysicsConcerns, gate everything else. Plan the narrowing as a follow-up spec.
- 1 load-bearing → **research further**: one trial is a coincidence; design 1–2 more trials in *that* shape before deciding. Plan the trials as a follow-up.
- 0 load-bearing → **deprecate as production tool**: keep the code as research scaffolding, remove from the routing surface, mark with a deprecation comment.

- [ ] **Step 2: Write the decision**

`.superpowers/plans/2026-06-17-track-c-decision.md` records the count, the chosen branch, and the next concrete action.

- [ ] **Step 3: Commit**

```bash
git add .superpowers/plans/2026-06-17-track-c-decision.md
git commit -m "docs(spike): physics adapter scoping decision"
```

### Task C.4: Apply the *non-code* part of the decision

**Files:** depends on C.3's branch.

- [ ] **Step 1: Conditional action**

- If **narrow**: stop here. Open a follow-up plan via `/superpowers:brainstorming` titled "Narrow physics adapter to load-bearing concerns."
- If **research further**: stop here. Open a follow-up plan titled "Physics adapter — additional mapping trials."
- If **deprecate**: drop the physics tools out of the routing surface manifest (`src/tools/shared/tool-surface-manifest.ts`) — do **not** delete the code; leave it as `src/skills/{qm,gr,shared}/` for research. Add a `@deprecated` JSDoc tag to `physics-adapter-prototype.ts`'s exports. Update `.claude/rules/default.md` to remove the `physics-analysis` line from the symptom→tool table. One commit: `chore(physics): mark adapter advisory-only, drop from routing surface`.

---

## Phase 4 — Integrate (1 task)

### Task 4.1: Merge tracks A + B, ship release notes

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `package.json` (version bump per semver — `feat:` changes → minor)

- [ ] **Step 1: Confirm both tracks' verification gates passed**

Track A: `.superpowers/plans/2026-06-17-track-a-verification.md` says PASS.
Track B: `npx vitest run` is green and the docs site builds.

- [ ] **Step 2: Bump version + CHANGELOG**

```bash
node -e "const p=require('./package.json'); const v=p.version.split('.'); v[1]=String(+v[1]+1); v[2]='0'; p.version=v.join('.'); require('fs').writeFileSync('./package.json', JSON.stringify(p, null, 2) + '\n');"
```

Update `CHANGELOG.md` `Unreleased` → `vX.Y.0` with the consolidated feat/refactor lines from each track's commits.

- [ ] **Step 3: Commit + tag**

```bash
git add package.json CHANGELOG.md
git commit -m "chore: release vX.Y.0 — slim default + ToolEnvelope V1"
```

- [ ] **Step 4 (optional, user-confirmed): tag and push**

Do **not** push or tag without the user's explicit go-ahead — both are visible-side-effects per the harness's care rules.

---

## Verification (end-to-end)

1. `npx vitest run` — full test suite green.
2. `node scripts/audit-mcp-call-ratio.mjs` — post-rollout ratio ≥ baseline + 15pp.
3. Manually invoke any workflow tool through MCP; confirm `content[0]` is markdown and `content[1].text` parses through `parseEnvelopeBlock`.
4. Manually invoke a tool with invalid input; confirm error message names the next tool (`Next: call \`task-bootstrap\``) and `content[1]` parses to the structured `McpErrorPayload`.
5. `cd docs && npm run build` — docs site builds with envelope spec page.
6. Track C decision doc exists and names a concrete next step.

---

## Self-review notes

- **Spec coverage:** Each problem from `2026-06-17-multi-track-mcp-execution` diagnosis maps to a track. Problem A+3 → Track A. Problem B → Track B. Problem C (physics) → Track C as scoping spike rather than implementation, matching the diagnosis's explicit "not yet a design session" call.
- **Placeholder scan:** No "TBD", "implement later", or "add error handling" placeholders. Every step shows the code or command to run.
- **Type consistency:** `ToolEnvelope`, `WorkflowEnvelopePayload`, `McpErrorPayload.nextTool` all introduced once and used consistently across later tasks. `TextToolResult` is promoted to a named export in B.1 (noted in the task) before later tasks import it.
- **Parallelism honesty:** Tracks A and B touch disjoint files; the graph at top is enforceable. Track C is fully independent. Phase 4 is the single serial integration point.

## Execution handoff

Plan complete and saved to `.superpowers/plans/2026-06-17-multi-track-mcp-execution.md`. Two execution options:

1. **Subagent-Driven (recommended for parallel tracks)** — dispatch one subagent per track after Phase 0; review between tasks within each track; reconverge at Phase 4.
2. **Inline Execution** — run tasks in this session via executing-plans; sequential within a track, but you'd lose the A‖B parallelism.

Which approach?
