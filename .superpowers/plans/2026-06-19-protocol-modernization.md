# Protocol Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adopt the spec-native MCP features the installed SDK (1.29.0, protocol up to `2025-11-25`) already supports — `structuredContent`/`outputSchema` and `elicitation` — replacing the hand-rolled `__ENVELOPE_V1__` base64 block while keeping it as a backward-compatibility bridge.

**Architecture:** Rosetta dual-emit. `toToolResult` keeps the markdown summary (block 0) and the legacy `__ENVELOPE_V1__` block (block 1) AND adds the protocol-native `structuredContent` field carrying the same payload. New consumers read `structuredContent`; old consumers keep parsing the envelope. Elicitation is added as an optional capability seam (same shape as the sampler seam) for the analogy `clarify` step.

**Tech Stack:** TypeScript (ESM, `.js`, TABS), `@modelcontextprotocol/sdk` 1.29.0, vitest 4.

## Global Constraints

- Do NOT remove the `__ENVELOPE_V1__` path or `parseEnvelopeBlock` in this plan — dual-emit only. Removal happens later, after adoption is measured (forward-compat policy in `docs/src/content/docs/reference/output-envelope.md`).
- `meta.version` stays `1`; the native `structuredContent` carries the identical `{payload, meta}` object.
- Elicitation, like sampling, is optional client-side — every elicitation path must degrade gracefully to the existing heuristic when the capability is absent.
- This plan's D2 ("declare/consume sampling") is delivered by the **Sampler Seam plan** (`2026-06-19-sampler-seam.md`); do that first or in parallel. No duplicate work here.
- ESM `.js` imports, TABS. `npx biome check --write <files>` before each commit.

---

### Task 1: Dual-emit `structuredContent` alongside the legacy envelope

**Files:**
- Modify: `src/tools/shared/output-envelope.ts` (`toToolResult`)
- Modify: `src/tools/tool-call-handler.ts` (`TextToolResult` type — add optional `structuredContent`)
- Test: `src/tests/tools/shared/output-envelope.test.ts`

**Interfaces:**
- Produces: `toToolResult` returns a result whose `content` is unchanged (summary + `__ENVELOPE_V1__` block) AND whose top-level `structuredContent` equals `{ payload, meta }`.

- [ ] **Step 1: Write the failing test**

Add to `src/tests/tools/shared/output-envelope.test.ts`:

```typescript
it("also emits the payload as protocol-native structuredContent", () => {
	const result = toToolResult({
		summaryMarkdown: "# done",
		payload: { instructionId: "evidence-research", steps: [] },
		meta: { tool: "evidence-research", ts: "2026-06-19T00:00:00Z", version: 1 },
	});
	expect(result.structuredContent).toEqual({
		payload: { instructionId: "evidence-research", steps: [] },
		meta: { tool: "evidence-research", ts: "2026-06-19T00:00:00Z", version: 1 },
	});
	// Legacy envelope block is still present (Rosetta bridge).
	expect(result.content[1].text.startsWith("__ENVELOPE_V1__:")).toBe(true);
});
```

- [ ] **Step 2: Run, verify it fails**

Run: `npx vitest run src/tests/tools/shared/output-envelope.test.ts`
Expected: FAIL — `result.structuredContent` is `undefined`.

- [ ] **Step 3: Add `structuredContent` to the result type**

In `src/tools/tool-call-handler.ts`, extend `TextToolResult` with an optional field:

```typescript
	structuredContent?: unknown;
```

- [ ] **Step 4: Populate it in `toToolResult`**

In `src/tools/shared/output-envelope.ts`, update the return of `toToolResult`:

```typescript
	return {
		content: [
			{ type: "text", text: env.summaryMarkdown },
			{ type: "text", text: `${PREFIX}${encoded}` },
		],
		structuredContent: { payload: env.payload, meta: env.meta },
	};
```

- [ ] **Step 5: Run, verify GREEN; run the broader tool suite for regressions**

Run: `npx vitest run src/tests/tools/ src/tests/runtime/mcp-server.test.ts src/tests/mcp/tool-coverage-matrix.test.ts`
Expected: PASS.

- [ ] **Step 6: Typecheck + commit**

Run: `npx tsc --noEmit && npx biome check --write src/tools/shared/output-envelope.ts src/tools/tool-call-handler.ts src/tests/tools/shared/output-envelope.test.ts`

```bash
git add src/tools/shared/output-envelope.ts src/tools/tool-call-handler.ts src/tests/tools/shared/output-envelope.test.ts
git commit -m "feat(protocol): dual-emit native structuredContent alongside legacy envelope"
```

---

### Task 2: Declare `outputSchema` on workflow tools

**Files:**
- Modify: `src/tools/tool-surface.ts` (or the generator that builds public tool definitions — confirm via `grep -rn "inputSchema" src/tools/tool-surface.ts`)
- Test: `src/tests/tools/tool-surface.test.ts`

**Interfaces:**
- Produces: each workflow tool definition gains an `outputSchema` describing the `{ payload, meta }` envelope object so clients can validate `structuredContent`.

- [ ] **Step 1: Write the failing test**

```typescript
it("workflow tools advertise an outputSchema for structuredContent", () => {
	const tools = buildPublicToolSurface(registry);
	const research = tools.find((t) => t.name === "evidence-research");
	expect(research?.outputSchema).toBeDefined();
	expect(research?.outputSchema?.type).toBe("object");
});
```

- [ ] **Step 2: Run, verify it fails** — `outputSchema` undefined.

- [ ] **Step 3: Add a shared `WORKFLOW_OUTPUT_SCHEMA` constant and attach it**

Define a single JSON-schema object describing `{ payload: object, meta: { tool, ts, version } }` and attach it to every workflow-surface tool definition where `inputSchema` is currently set. Keep non-workflow tools (visualization, workspace) unchanged unless they also use `toToolResult`.

- [ ] **Step 4: Run, verify GREEN; check coverage-matrix invariant still holds**

Run: `npx vitest run src/tests/tools/ src/tests/mcp/tool-coverage-matrix.test.ts`
Expected: PASS.

- [ ] **Step 5: Regenerate any generated tool definitions + commit**

Run: `python3 scripts/generate-tool-definitions.py && git diff --exit-code src/generated/ || git add src/generated/`

```bash
git add src/tools/ src/tests/tools/ src/generated/
git commit -m "feat(protocol): advertise outputSchema for workflow tool structuredContent"
```

---

### Task 3: Native elicitation seam for the analogy `clarify` step

**Files:**
- Create: `src/skills/runtime/elicitor.ts` (type + `makeElicitor` factory)
- Modify: `src/contracts/runtime.ts` (add optional `elicitor?` + `clientSupportsElicitation?`, mirroring the sampler seam)
- Modify: `src/runtime/attach-sampler.ts` → rename/extend to also attach elicitation, or add `attach-elicitor.ts`
- Modify: `src/skills/analogy/clarify.ts` (`HEURISTIC_EXTRACTOR` becomes the fallback)
- Test: `src/tests/skills/analogy/clarify.test.ts`, `src/tests/runtime/elicitor.test.ts`

**Interfaces:**
- Produces: `Elicitor = (req: { message: string; schema: object }) => Promise<Record<string, unknown> | null>` wrapping `server.elicitInput`; returns `null` when declined/unsupported. `clarify` uses `context.runtime.elicitor?` to ask the user for structured problem features, falling back to `HEURISTIC_EXTRACTOR` on `null`/throw/absent.

- [ ] **Step 1: Write the failing test for the elicitor factory**

```typescript
import { describe, expect, it, vi } from "vitest";
import { makeElicitor } from "../../skills/runtime/elicitor.js";

describe("makeElicitor", () => {
	it("returns the accepted content", async () => {
		const elicitInput = vi
			.fn()
			.mockResolvedValue({ action: "accept", content: { hasFeedbackLoop: true } });
		const elicit = makeElicitor({ elicitInput });
		expect(await elicit({ message: "?", schema: {} })).toEqual({
			hasFeedbackLoop: true,
		});
	});
	it("returns null when the user declines", async () => {
		const elicitInput = vi.fn().mockResolvedValue({ action: "decline" });
		const elicit = makeElicitor({ elicitInput });
		expect(await elicit({ message: "?", schema: {} })).toBeNull();
	});
});
```

- [ ] **Step 2: Run, verify it fails** — module missing.

- [ ] **Step 3: Implement `makeElicitor`**

Create `src/skills/runtime/elicitor.ts`:

```typescript
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

export type Elicitor = (req: {
	message: string;
	schema: object;
}) => Promise<Record<string, unknown> | null>;

export function makeElicitor(
	server: Pick<Server, "elicitInput">,
): Elicitor {
	return async ({ message, schema }) => {
		const response = await server.elicitInput({
			message,
			requestedSchema: schema as never,
		});
		return response.action === "accept" && response.content
			? (response.content as Record<string, unknown>)
			: null;
	};
}
```

- [ ] **Step 4: Run, verify GREEN.** `npx vitest run src/tests/runtime/elicitor.test.ts` → PASS.

- [ ] **Step 5: Add the optional seam fields + attach post-connect**

Add `elicitor?: Elicitor` and `clientSupportsElicitation?: boolean` to `SkillExecutionRuntime`/`WorkflowExecutionRuntime` (pure type import only). In the post-connect wiring (extend `attachSamplerCapability` or add `attachElicitorCapability`), set them from `server.getClientCapabilities()?.elicitation`.

- [ ] **Step 6: Write the failing `clarify` test (elicitation path)**

```typescript
it("uses elicitation to gather features when supported", async () => {
	const elicitor = vi.fn().mockResolvedValue({ features: ["has-feedback-loop"] });
	const result = await clarify(
		{ request: "stabilize a runaway control loop" },
		{ runtime: { elicitor, clientSupportsElicitation: true } } as never,
	);
	expect(result.features).toContain("has-feedback-loop");
	expect(elicitor).toHaveBeenCalled();
});
```

- [ ] **Step 7: Wire `clarify` to prefer the elicitor, fall back to `HEURISTIC_EXTRACTOR`**

In `src/skills/analogy/clarify.ts`, before invoking `HEURISTIC_EXTRACTOR`, try `context.runtime.elicitor?`; on a non-null structured result use it, otherwise fall through to the heuristic. Wrap in try/catch.

- [ ] **Step 8: Run, verify GREEN; commit**

Run: `npx tsc --noEmit && npx vitest run src/tests/skills/analogy/ src/tests/runtime/ && npx biome check --write src/`

```bash
git add src/skills/runtime/elicitor.ts src/contracts/runtime.ts src/runtime/ src/skills/analogy/clarify.ts src/tests/
git commit -m "feat(protocol): native elicitation for analogy clarify, heuristic fallback"
```

---

### Task 4: Document + verify

- [ ] **Step 1: Update `docs/src/content/docs/reference/output-envelope.md`** to note that `structuredContent` is now the preferred read path and the `__ENVELOPE_V1__` block is a compatibility bridge scheduled for removal once adoption is measured.

- [ ] **Step 2: Full verification**

Run: `npm run build && npx vitest run && npx docs:build`
Expected: tsc clean; full suite green (no drop from baseline); docs build clean.

```bash
git add docs/
git commit -m "docs(protocol): structuredContent is the preferred read path"
```

## Self-Review

- **Spec coverage:** D1 structuredContent → Task 1; D1 outputSchema → Task 2; D3 elicitation → Task 3; docs → Task 4. D2 (sampling) is owned by the Sampler Seam plan — cross-referenced, not duplicated.
- **Type consistency:** `Elicitor` defined once in `elicitor.ts`; the optional runtime fields mirror the sampler seam exactly. `structuredContent` is `unknown` on `TextToolResult`, set to `{payload, meta}` in `toToolResult`.
- **Rosetta discipline:** the legacy envelope and `parseEnvelopeBlock` are untouched; Task 1's test explicitly asserts the legacy block still ships.
- **Graceful degradation:** elicitation path falls back to `HEURISTIC_EXTRACTOR` on absent capability / decline / throw.
