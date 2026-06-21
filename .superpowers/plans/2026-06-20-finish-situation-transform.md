# Finish the Situation-Transform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the local `ai-agent-guidelines` MCP return *problem-oriented solution ideas* — not just a directive wrapped in a 60–230KB template wall — by proving the sampled (findings) path, trimming artifact volume, and hardening the two latent A/B-review gaps.

**Architecture:** The LLM→LLM transform already runs at the single `dispatchToolCall` chokepoint (`toSituationResult`) for an allow-list of analysis-family tools, gated by `resolveTransformDomain` and the `MCP_SITUATION_TRANSFORM` kill-switch. The sampler is already wired (`attachSampler` → `makeSampler` → `runtime.sampler`); this plan adds the missing end-to-end proof, makes the collapsed result carry forward evidence and stay small, and removes a brittle string-coupling.

**Tech Stack:** TypeScript (ESM, `.js` import specifiers, TAB indentation), vitest 4, biome, lefthook pre-commit. Python A/B harness already exists (`scripts/ab_eval.py`).

## Global Constraints

- ESM only: every relative import ends in `.js`. Indentation is TABS, not spaces.
- Run `npx biome check --write <changed files>` only on files you changed — never the whole tree (it overrides `biome-ignore` assists and breaks the serena mock).
- Do NOT reintroduce `agent-memory`/`agent-session`/`agent-snapshot` as callable tools (no-legacy contract).
- The transform is for the analysis family only: `quality-evaluate, code-review, issue-debug, system-design, evidence-research, policy-govern, fault-resilience` (the keys of `ANALYSIS_TRANSFORM_DOMAINS`). Do not widen it.
- Every commit must pass `npx tsc --noEmit`, `npx biome check src/`, and the targeted vitest suites named in each task.
- Co-author every commit: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

### Task 1: Single source for the advisory-only prefix (A/B finding B#5)

`directive-first.ts` filters advisory disclaimers out of the rubric seed with a hard-coded string `"This analysis is advisory only"`. Five family helpers each hard-code a disclaimer starting with the same words. If any drifts, the label silently leaks back into the seed with no failing test. This task makes the prefix one exported constant and pins the contract with a test over all five families.

**Files:**
- Create: `src/skills/shared/advisory.ts`
- Modify: `src/skills/shared/directive-first.ts` (replace the local `ADVISORY_PREFIX`)
- Test: `src/tests/skills/shared/advisory.test.ts`

**Interfaces:**
- Produces: `export const ADVISORY_PREFIX: string` from `src/skills/shared/advisory.ts`.
- Consumes (existing): `EVAL_ADVISORY_DISCLAIMER`, `BENCH_ADVISORY_DISCLAIMER`, `GOV_ADVISORY_DISCLAIMER`, `RESIL_ADVISORY_DISCLAIMER`, `QM_ADVISORY_DISCLAIMER` from `src/skills/{eval,bench,gov,resil,qm}/*-helpers.ts`.

- [ ] **Step 1: Write the failing test**

```typescript
// src/tests/skills/shared/advisory.test.ts
import { describe, expect, it } from "vitest";
import { BENCH_ADVISORY_DISCLAIMER } from "../../../skills/bench/bench-helpers.js";
import { EVAL_ADVISORY_DISCLAIMER } from "../../../skills/eval/eval-helpers.js";
import { GOV_ADVISORY_DISCLAIMER } from "../../../skills/gov/gov-helpers.js";
import { QM_ADVISORY_DISCLAIMER } from "../../../skills/qm/qm-physics-helpers.js";
import { RESIL_ADVISORY_DISCLAIMER } from "../../../skills/resil/resil-helpers.js";
import { ADVISORY_PREFIX } from "../../../skills/shared/advisory.js";

describe("ADVISORY_PREFIX", () => {
	it("is the prefix of every family disclaimer (so the seed filter catches them all)", () => {
		for (const disclaimer of [
			EVAL_ADVISORY_DISCLAIMER,
			BENCH_ADVISORY_DISCLAIMER,
			GOV_ADVISORY_DISCLAIMER,
			RESIL_ADVISORY_DISCLAIMER,
			QM_ADVISORY_DISCLAIMER,
		]) {
			expect(disclaimer.startsWith(ADVISORY_PREFIX)).toBe(true);
		}
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tests/skills/shared/advisory.test.ts`
Expected: FAIL — `Cannot find module '.../skills/shared/advisory.js'`.

- [ ] **Step 3: Create the shared constant**

```typescript
// src/skills/shared/advisory.ts
/**
 * The opening words shared by every family's "advisory only" disclaimer
 * (eval / bench / gov / resil / qm). The situation-transform filters disclaimers
 * out of the rubric seed by this prefix, so it must stay in exactly one place.
 */
export const ADVISORY_PREFIX = "This analysis is advisory only";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/tests/skills/shared/advisory.test.ts`
Expected: PASS (all five disclaimers begin with the prefix).

- [ ] **Step 5: Point `directive-first.ts` at the shared constant**

In `src/skills/shared/directive-first.ts`, delete the local declaration:

```typescript
const ADVISORY_PREFIX = "This analysis is advisory only";
```

and add to the imports at the top of the file:

```typescript
import { ADVISORY_PREFIX } from "./advisory.js";
```

(Leave the JSDoc paragraph above the old constant; move it to sit above the import or delete it — the constant is now documented in `advisory.ts`.)

- [ ] **Step 6: Run the affected suites to verify no regression**

Run: `npx vitest run src/tests/skills/shared/directive-first.test.ts src/tests/skills/shared/advisory.test.ts`
Expected: PASS (all directive-first tests + the new advisory test).

- [ ] **Step 7: Format, typecheck, commit**

```bash
npx biome check --write src/skills/shared/advisory.ts src/skills/shared/directive-first.ts src/tests/skills/shared/advisory.test.ts
npx tsc --noEmit
git add src/skills/shared/advisory.ts src/skills/shared/directive-first.ts src/tests/skills/shared/advisory.test.ts
git commit -m "refactor: single source for the advisory-only prefix

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Carry evidence anchors and source refs onto the collapsed recommendation (A/B finding B#1)

The collapse builds one recommendation from `buildAnalysisDirective`/`analyzeOrDirective`, which only set `title`/`detail`/`modelClass`/`groundingScope`. Any `evidenceAnchors`/`sourceRefs` the pipeline computed on the seed recs are dropped, so `formatRecommendation` (`result-formatter.ts:58-67`) renders no Evidence/Sources lines and the envelope payload loses them. This task forwards the union of those fields onto the collapsed rec.

**Files:**
- Modify: `src/skills/shared/directive-first.ts` (in `toSituationResult`)
- Test: `src/tests/skills/shared/directive-first.test.ts`

**Interfaces:**
- Consumes: `RecommendationItem.evidenceAnchors?: string[]`, `RecommendationItem.sourceRefs?: string[]` (from `src/contracts/runtime.ts:79-80`).
- Produces: the collapsed `RecommendationItem` now additionally carries `evidenceAnchors` and `sourceRefs` = de-duplicated union across all seed recommendations (only when non-empty).

- [ ] **Step 1: Write the failing test**

Add to `src/tests/skills/shared/directive-first.test.ts` inside `describe("toSituationResult", …)`:

```typescript
it("forwards the union of evidence anchors and source refs onto the collapsed rec", async () => {
	const result = workflowResult([
		{
			...rec("Define the dataset slices."),
			evidenceAnchors: ["src/eval/runner.ts"],
			sourceRefs: ["docs/eval.md"],
		},
		{
			...rec("Attach an oracle."),
			evidenceAnchors: ["src/eval/runner.ts", "tests/golden.jsonl"],
			sourceRefs: ["docs/eval.md", "RFC-12"],
		},
	]);
	const out = await toSituationResult(result, deps);
	const lead = out.recommendations[0];
	expect(lead?.evidenceAnchors).toEqual([
		"src/eval/runner.ts",
		"tests/golden.jsonl",
	]);
	expect(lead?.sourceRefs).toEqual(["docs/eval.md", "RFC-12"]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tests/skills/shared/directive-first.test.ts -t "forwards the union"`
Expected: FAIL — `lead.evidenceAnchors` is `undefined`.

- [ ] **Step 3: Implement the union forwarding**

In `src/skills/shared/directive-first.ts`, inside `toSituationResult`, after the `analyzeOrDirective` call returns `{ recommendation }` and before the `return`, build the unions and attach them:

```typescript
	const evidenceAnchors = [
		...new Set(result.recommendations.flatMap((r) => r.evidenceAnchors ?? [])),
	];
	const sourceRefs = [
		...new Set(result.recommendations.flatMap((r) => r.sourceRefs ?? [])),
	];

	return {
		...result,
		recommendations: [
			{
				...recommendation,
				...(evidenceAnchors.length > 0 ? { evidenceAnchors } : {}),
				...(sourceRefs.length > 0 ? { sourceRefs } : {}),
			},
		],
	};
```

Replace the existing `return { ...result, recommendations: [recommendation] };` with the block above.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/tests/skills/shared/directive-first.test.ts -t "forwards the union"`
Expected: PASS.

- [ ] **Step 5: Run the whole directive-first suite**

Run: `npx vitest run src/tests/skills/shared/directive-first.test.ts`
Expected: PASS (no other test asserted the absence of these fields).

- [ ] **Step 6: Format, typecheck, commit**

```bash
npx biome check --write src/skills/shared/directive-first.ts src/tests/skills/shared/directive-first.test.ts
npx tsc --noEmit
git add src/skills/shared/directive-first.ts src/tests/skills/shared/directive-first.test.ts
git commit -m "feat: forward evidence anchors and source refs onto the collapsed rec

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Trim artifact volume on transform (the focus lever)

Measured composition for `issue-debug`: a 132KB payload is 75% artifacts (147 template artifacts merged from every delegated skill). The transform collapses recommendations but leaves the artifact wall, so even the transformed output is 58–229KB — the opposite of focused solution ideas. Both `formatWorkflowResult` and `buildWorkflowEnvelopePayload` (`result-formatter.ts:128-131,155-158`) merge `result.artifacts` **plus** `step.skillResult.artifacts`. So trimming must cap the top-level list AND clear the per-step lists, inside `toSituationResult`.

**Files:**
- Modify: `src/skills/shared/directive-first.ts`
- Test: `src/tests/skills/shared/directive-first.test.ts` (add new test; update the existing "preserves artifacts and steps untouched" test)

**Interfaces:**
- Consumes: `WorkflowExecutionResult.artifacts?: SkillArtifact[]`, `StepExecutionRecord.skillResult?.artifacts` (`src/contracts/runtime.ts:188-199`, `113-120`).
- Produces: a new module constant `export const TRANSFORM_ARTIFACT_CAP = 6;` and a transformed result whose merged artifact count is `≤ TRANSFORM_ARTIFACT_CAP`, achieved by putting the capped set on `result.artifacts` and clearing each `step.skillResult.artifacts`.

- [ ] **Step 1: Update the now-wrong "untouched" test**

In `src/tests/skills/shared/directive-first.test.ts`, the existing test asserts referential identity of artifacts/steps:

```typescript
	it("preserves artifacts and steps untouched", async () => {
		const result = workflowResult([rec("Define the dataset slices.")]);
		result.steps = [{ label: "s", kind: "skill", summary: "ran" }];
		const out = await toSituationResult(result, deps);
		expect(out.steps).toBe(result.steps);
		expect(out.artifacts).toBe(result.artifacts);
	});
```

Replace it with a test that steps are preserved by value but artifacts are trimmed:

```typescript
	it("preserves steps' labels but trims the artifact wall to the cap", async () => {
		const result = workflowResult([rec("Define the dataset slices.")]);
		const many = Array.from({ length: 20 }, (_, i) => ({
			kind: "eval-criteria" as const,
			title: `crit-${i}`,
			criteria: [`c${i}`],
		}));
		result.steps = [
			{
				label: "s",
				kind: "skill",
				summary: "ran",
				skillResult: {
					skillId: "x",
					displayName: "X",
					model: model,
					summary: "ran",
					recommendations: [],
					relatedSkills: [],
					artifacts: many,
				},
			},
		];
		const out = await toSituationResult(result, deps);
		const merged = [
			...(out.artifacts ?? []),
			...out.steps.flatMap((s) => s.skillResult?.artifacts ?? []),
		];
		expect(merged.length).toBeLessThanOrEqual(6);
		expect(out.steps[0]?.label).toBe("s");
	});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tests/skills/shared/directive-first.test.ts -t "trims the artifact wall"`
Expected: FAIL — merged length is 20, not ≤ 6.

- [ ] **Step 3: Implement the cap**

In `src/skills/shared/directive-first.ts`, add the constant near the top (below the `ADVISORY_PREFIX` import):

```typescript
/**
 * Cap on artifacts a transformed (collapsed) analysis result renders. The
 * matched templates are the rubric seed now; the directive supersedes the
 * template wall, so we keep only a small representative sample to stop a single
 * call ballooning to 60–230KB of delegated-skill scaffolding.
 */
export const TRANSFORM_ARTIFACT_CAP = 6;
```

Then change the `return` (now built in Task 2) so the artifacts are capped onto the top level and per-step artifact lists are cleared. Replace the Task-2 return block's `...result,` spread with an explicit trimmed result:

```typescript
	const mergedArtifacts = [
		...(result.artifacts ?? []),
		...result.steps.flatMap((s) => s.skillResult?.artifacts ?? []),
	].slice(0, TRANSFORM_ARTIFACT_CAP);
	const trimmedSteps = result.steps.map((s) =>
		s.skillResult
			? { ...s, skillResult: { ...s.skillResult, artifacts: [] } }
			: s,
	);

	return {
		...result,
		steps: trimmedSteps,
		artifacts: mergedArtifacts,
		recommendations: [
			{
				...recommendation,
				...(evidenceAnchors.length > 0 ? { evidenceAnchors } : {}),
				...(sourceRefs.length > 0 ? { sourceRefs } : {}),
			},
		],
	};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/tests/skills/shared/directive-first.test.ts -t "trims the artifact wall"`
Expected: PASS.

- [ ] **Step 5: Run the whole directive-first suite + handler suite**

Run: `npx vitest run src/tests/skills/shared/directive-first.test.ts src/tests/tools/tool-call-handler.test.ts`
Expected: PASS. (If a handler test asserted a specific artifact count for an analysis tool, update it to the capped expectation — analysis tools now render ≤ 6 artifacts.)

- [ ] **Step 6: Format, typecheck, commit**

```bash
npx biome check --write src/skills/shared/directive-first.ts src/tests/skills/shared/directive-first.test.ts
npx tsc --noEmit
git add src/skills/shared/directive-first.ts src/tests/skills/shared/directive-first.test.ts
git commit -m "feat: cap artifact volume on the collapsed analysis result

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Prove the sampled (findings) path end-to-end (the sampling lever)

The sampler is wired (`src/runtime/attach-sampler.ts` sets `runtime.sampler` when the client advertises `sampling`; `tool-call-handler.ts:453` passes it to the transform). But no test drives `dispatchToolCall` with a sampler present, so the "directive → real findings" path is unverified end-to-end. The A/B harness can't cover it because `claude -p` as a client does not advertise sampling. This task adds the integration test using a fake sampler on the runtime.

**Files:**
- Modify: `src/tests/tools/tool-call-handler.test.ts`

**Interfaces:**
- Consumes: `dispatchToolCall(toolName, input, runtime)` and the runtime shape from `createRuntime()` in the same test file (lines 12-52). The runtime is passed through to `toSituationResult` which reads `runtime.sampler`.
- The fake sampler matches `Sampler = (req: SamplerRequest) => Promise<SamplerResult>` (`src/contracts/runtime.ts:97`), i.e. `async () => ({ text: "..." })`.

- [ ] **Step 1: Write the failing test**

Add to `src/tests/tools/tool-call-handler.test.ts` inside `describe("tool-call-handler", …)`:

```typescript
	// Sampling lever: when the connected client advertises `sampling`, the server
	// has a runtime.sampler, and the transform must return the model's FINDINGS
	// (not the return-a-prompt directive) through the full dispatch path.
	it("returns sampled findings for an analysis tool when a sampler is present", async () => {
		const sampler = vi
			.fn()
			.mockResolvedValue({ text: "SAMPLED-FINDINGS: golden.jsonl lacks negatives." });
		const runtime = { ...createRuntime(), sampler, clientSupportsSampling: true };
		const result = await dispatchToolCall(
			"quality-evaluate",
			{ request: "design an eval set with hard negatives" },
			runtime,
		);
		expect(result.isError).toBeUndefined();
		const text = result.content[0]?.text ?? "";
		expect(text).toContain("SAMPLED-FINDINGS: golden.jsonl lacks negatives.");
		// It is the findings, not the directive.
		expect(text.toLowerCase()).not.toContain("analysis task");
		expect(sampler).toHaveBeenCalled();
	});
```

Confirm `vi` is already imported at the top of the file (`import { describe, expect, it, vi } from "vitest";`). If not, add `vi` to that import.

- [ ] **Step 2: Run test to verify it fails (or passes for the right reason)**

Run: `npx vitest run src/tests/tools/tool-call-handler.test.ts -t "returns sampled findings"`
Expected: PASS if the wiring is correct. If it FAILS (e.g. text still shows "analysis task"), the sampler is not being threaded — inspect `toSituationResult` deps at `tool-call-handler.ts:445-450` to confirm `sampler: runtime.sampler` is passed, and fix the threading before proceeding. Either way this test now pins the behavior.

- [ ] **Step 3: (only if Step 2 failed) Fix the threading**

If the sampler was not threaded, ensure the transform call passes it:

```typescript
		const situationData = transformDomain
			? await toSituationResult(result.data, {
					domain: transformDomain,
					candidateNextTools: instruction.manifest.chainTo ?? [],
					sampler: runtime.sampler,
				})
			: result.data;
```

Re-run Step 2 until PASS.

- [ ] **Step 4: Run the whole handler suite**

Run: `npx vitest run src/tests/tools/tool-call-handler.test.ts`
Expected: PASS (all handler tests including the new one).

- [ ] **Step 5: Format, typecheck, commit**

```bash
npx biome check --write src/tests/tools/tool-call-handler.test.ts
npx tsc --noEmit
git add src/tests/tools/tool-call-handler.test.ts
git commit -m "test: prove the sampled findings path through dispatchToolCall

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Re-run the A/B eval and refresh the results (verification)

Confirm the volume lever moved the numbers and nothing regressed, using the harness already in the repo.

**Files:**
- Modify: `evals/RESULTS.md`, `evals/ab_results.json` (regenerated outputs)

- [ ] **Step 1: Rebuild and run the full suite**

Run: `npm run build && npx vitest run`
Expected: green except the known flaky `index-main.test.ts` stderr-timing test (passes in isolation) and the SDK/cross-blind tests if `dist/` is stale (rebuild fixes them).

- [ ] **Step 2: Re-run the A/B eval**

Run: `python3 scripts/ab_eval.py --eval-set evals/situation-transform.json --out /tmp/ab_after.json`
Expected: B still wins; B `chars` per case is now materially smaller than before (artifacts capped). Record the new sizes.

- [ ] **Step 3: Update the results doc**

In `evals/RESULTS.md`, update the size column and add a line under "Findings" noting the post-cap B sizes (e.g. "after the artifact cap, B dropped from 58–207KB to <N>KB"). Copy `/tmp/ab_after.json` to `evals/ab_results.json`.

- [ ] **Step 4: Commit**

```bash
git add evals/RESULTS.md evals/ab_results.json
git commit -m "docs: refresh A/B eval after artifact-volume cap

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- MCP-sampling lever (directive → findings) → Task 4 (prove end-to-end; wiring already exists).
- Artifact-volume trimming → Task 3.
- Latent B#1 (evidence-anchor carry) → Task 2.
- Latent B#5 (shared advisory constant) → Task 1.
- Verification → Task 5 (re-run A/B, refresh results).
- The third latent item from the A/B review ("sampled-path integration test") is the same as the sampling lever → Task 4. No gap.

**Placeholder scan:** No "TBD"/"handle edge cases"/"similar to Task N" — every code step shows the exact code. The one conditional (Task 4 Step 3) is gated on an observed test result, with the exact fix shown.

**Type consistency:** `TRANSFORM_ARTIFACT_CAP` (Task 3) and `ADVISORY_PREFIX` (Task 1) are the only new exports, used consistently. The Task-2 union block and the Task-3 cap block compose into a single `return` (Task 3 shows the merged final form, superseding Task 2's interim return) — implement Tasks 2 then 3 in order so the return evolves once. `evidenceAnchors`/`sourceRefs`/`artifacts`/`skillResult.artifacts` names match `src/contracts/runtime.ts`. The fake sampler return shape `{ text }` matches `SamplerResult`.
