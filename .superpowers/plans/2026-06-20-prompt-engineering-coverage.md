# Prompt-Engineering Target-Orientation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `prompt-engineering` emit a target-oriented directive (a tailored prompt deliverable) instead of a template wall, taking situation-transform coverage from 15/20 to 16/20.

**Architecture:** This is a **registration**, not a skill restructure. An earlier audit claimed prompt-engineering had "0 top-level recommendations" — that was a measurement error from an off-topic probe request. For a genuine prompt request, prompt-engineering produces **27 recommendations, 24 seed-eligible** (non-advisory), so it already has a collapsible wall the existing transform can seed. The fix is one `TRANSFORM_PROFILES` entry with a prompt-shaped output contract, exactly like the `agent-orchestrate` change. Because the claim "registration is enough" rests on that 24-rec measurement, this plan **proves it end-to-end** (a dispatched dogfood test) rather than asserting it.

**Tech Stack:** TypeScript (ESM, `.js` import specifiers, TAB indentation), vitest 4, biome, lefthook pre-commit.

## Global Constraints

- ESM only: every relative import ends in `.js`. Indentation is TABS, not spaces.
- Run `npx biome check --write <changed files>` only on files you changed — never the whole tree.
- The transform boundary the rest of the surface must keep: routers/orientation/special tools stay passthrough. After this change the only passthrough tools are `routing-adapt`, `task-bootstrap`, `project-onboard`, `analogy-think` (16/20 transformed).
- The kill-switch `MCP_SITUATION_TRANSFORM=0` must continue to disable the transform.
- Every commit must pass `npx tsc --noEmit`, `npx biome check src/`, and the targeted vitest suites named below.
- Co-author every commit: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

### Task 1: Register prompt-engineering with a prompt output contract

Add a `PROMPT_OUTPUT_CONTRACT` and a `TRANSFORM_PROFILES` entry for `prompt-engineering`, then prove end-to-end that the transform fires and the output is request-anchored.

**Files:**
- Modify: `src/skills/shared/directive-first.ts`
- Test: `src/tests/skills/shared/directive-first.test.ts`
- Test: `src/tests/tools/tool-call-handler.test.ts`

**Interfaces:**
- Produces: `export const PROMPT_OUTPUT_CONTRACT: string`; one new `TRANSFORM_PROFILES` entry `"prompt-engineering"`.
- Consumes: `resolveTransformProfile` / `toSituationResult` (unchanged); `TransformProfile` (unchanged).

- [ ] **Step 1: Write the failing unit + dogfood tests (RED)**

In `src/tests/skills/shared/directive-first.test.ts`, add inside `describe("resolveTransformProfile", …)`:

```typescript
	it("gives prompt-engineering a prompt deliverable profile", () => {
		const p = resolveTransformProfile("prompt-engineering");
		expect(p).toBeDefined();
		expect(p?.domain).not.toMatch(/^[A-Z][a-z]+:/);
		expect(p?.outputContract.toLowerCase()).toContain("prompt");
	});
```

And remove `"prompt-engineering"` from the exclusion-list test `it("still excludes the orientation/niche/special tools", …)` so that test now lists only `routing-adapt`, `task-bootstrap`, `project-onboard`, `analogy-think`.

In `src/tests/tools/tool-call-handler.test.ts`, add inside `describe("tool-call-handler", …)`:

```typescript
	// prompt-engineering produces a prompt artifact (its mission: "every prompt is
	// a versioned, tested artifact"). For a real prompt request it carries 24
	// seed-eligible recommendations, so it must collapse into a tailored directive,
	// not a template wall. This dispatched test PROVES the transform fires (the
	// claim "registration is enough" rests on that rec count).
	it("prompt-engineering emits a tailored prompt directive for a prompt request", async () => {
		const result = await dispatchToolCall(
			"prompt-engineering",
			{ request: "improve our hallucinating rate-limit system prompt" },
			createRuntime(),
		);
		expect(result.isError).toBeUndefined();
		const text = result.content[0]?.text ?? "";
		expect(text).toContain("Analyze your prompt asset");
		expect(text).toContain("improve our hallucinating rate-limit system prompt");
		expect(text.toLowerCase()).not.toContain("advisory only");
	});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/tests/skills/shared/directive-first.test.ts -t "prompt deliverable profile"`
Run: `npx vitest run src/tests/tools/tool-call-handler.test.ts -t "prompt-engineering emits"`
Expected: BOTH FAIL — `resolveTransformProfile("prompt-engineering")` is `undefined`, so the tool passes through (no "Analyze your prompt asset").

- [ ] **Step 3: Implement the contract + entry**

In `src/skills/shared/directive-first.ts`, after `ORCHESTRATION_OUTPUT_CONTRACT`, add:

```typescript
/** Output contract for prompt tools — a tailored prompt deliverable. */
export const PROMPT_OUTPUT_CONTRACT =
	"the concrete, tailored prompt (or prompt changes) for this request — the structure, instructions, examples, and guardrails to use, grounded in the real task and failure modes, followed by an ordered next-action sequence";
```

Add this entry to `TRANSFORM_PROFILES` (next to the other non-analysis entries):

```typescript
	"prompt-engineering": {
		domain: "prompt asset",
		outputContract: PROMPT_OUTPUT_CONTRACT,
	},
```

Update the `TRANSFORM_PROFILES` JSDoc: prompt-engineering is no longer "absent (no collapsible wall)"; remove that clause so the comment lists only `routing-adapt`, `task-bootstrap`, `project-onboard`, `analogy-think` as intentionally absent.

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/tests/skills/shared/directive-first.test.ts src/tests/tools/tool-call-handler.test.ts`
Expected: PASS, including the new unit test and the dispatched dogfood (proves the transform fires and is request-anchored).

- [ ] **Step 5: Confirm coverage is 16/20**

Create a temporary `src/tests/tools/enum.test.ts` that builds an `InstructionRegistry`, dispatches each public instruction with a real request, and counts those whose output contains both `Analyze your ` and `analysis task`; write the count to `/tmp/enum.txt`; run it; then delete the probe file. Expected: **16/20**, with the 4 passthrough being exactly `routing-adapt`, `task-bootstrap`, `project-onboard`, `analogy-think`.

- [ ] **Step 6: Format, typecheck, full suite**

Run: `npx biome check --write src/skills/shared/directive-first.ts src/tests/skills/shared/directive-first.test.ts src/tests/tools/tool-call-handler.test.ts`
Run: `npx tsc --noEmit`  (expect clean)
Run: `npm run build && npx vitest run`  (expect green except the known flaky `index-main` stderr-spy test — confirm it passes in isolation before treating it as pre-existing).

- [ ] **Step 7: Commit**

```bash
git add src/skills/shared/directive-first.ts src/tests/skills/shared/directive-first.test.ts src/tests/tools/tool-call-handler.test.ts
git commit -m "feat: register prompt-engineering for the situation-transform (16/20)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Record the correction in the eval log

The "0 recommendations / needs restructure" claim in `evals/RESULTS.md` is wrong and must be corrected so the record is honest.

**Files:**
- Modify: `evals/RESULTS.md`

- [ ] **Step 1: Correct the record**

In `evals/RESULTS.md`, find the passage stating prompt-engineering "emits 0 top-level recommendations … needs the skill restructured". Replace it with the corrected finding: prompt-engineering has a full collapsible wall (27 recs, 24 seed-eligible) for a genuine prompt request; the earlier "0" was a measurement artifact from an off-topic probe; it was registered with `PROMPT_OUTPUT_CONTRACT`, taking coverage to **16/20**; the remaining 4 passthrough are `routing-adapt` (niche), `task-bootstrap` / `project-onboard` (orientation), `analogy-think` (deterministic).

- [ ] **Step 2: Commit**

```bash
git add evals/RESULTS.md
git commit -m "docs: correct prompt-engineering finding + record 16/20 coverage

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- Make prompt-engineering target-oriented → Task 1 (registration + dispatched proof + 16/20 confirmation).
- Honest record → Task 2 (correct the "0 recs / restructure" error in RESULTS.md).

**Placeholder scan:** Every code step shows exact code. The one conditional (Step 6 flaky-test handling) states the exact check. No "TBD"/"handle edge cases".

**Type consistency:** `PROMPT_OUTPUT_CONTRACT` is the only new export, used in one `TRANSFORM_PROFILES` entry; `domain` is a clean lowercase noun ("prompt asset") matching the convention; no new types. The dogfood assertion string ("Analyze your prompt asset") matches the registered domain via `buildAnalysisDirective`'s `Analyze your ${domain}` title.

**Risk note:** If Step 4's dogfood unexpectedly FAILS (transform does not fire despite 24 seed-eligible recs), do NOT force it — that would mean the rec count is request-dependent in a way the probe missed, and the premise "registration is enough" is false. In that case stop and report; the fix would then genuinely require seeding the transform from step/artifact content (a larger change), and this plan must be revised.
