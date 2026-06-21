# Target-Orientation Coverage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the situation-transform from the 7 analysis tools to the solution-producing tools (feature-implement, code-refactor, test-verify, strategy-plan, docs-generate, enterprise-strategy) via a generalized per-tool contract, and close the default-surface discoverability gap with documentation + routing — so "target-oriented output" covers every tool whose deliverable is a situation-specific analysis OR build, while routers/orientation/orchestration stay correctly excluded.

**Architecture:** Today `resolveTransformDomain(toolName)` returns a clean domain string for an allow-list of 7 analysis tools, and `toSituationResult` hard-codes an analysis-shaped `outputContract` ("findings per criterion …"). The root cause the tribunal found: the *contract* is analysis-shaped, so generation/planning tools were excluded even though they carry collapsible recommendation walls. This plan replaces the domain-string map with a **profile map** (`{ domain, outputContract }` per tool), keeps the 7 analysis tools behavior-identical, adds a second **build/plan** contract for 6 solution-producers, and leaves the 6 routers/orientation/orchestration/special tools untransformed. The slim-default gap (target tools hidden by default) is closed by documentation + confirming the router surfaces them by name (they remain callable when hidden).

**Tech Stack:** TypeScript (ESM, `.js` import specifiers, TAB indentation), vitest 4, biome, lefthook pre-commit.

## Global Constraints

- ESM only: every relative import ends in `.js`. Indentation is TABS, not spaces.
- Run `npx biome check --write <changed files>` only on files you changed — never the whole tree.
- Do NOT reintroduce `agent-memory`/`agent-session`/`agent-snapshot` as callable tools (no-legacy contract).
- **Transform boundary after this plan (13/20):** ANALYSIS (7, unchanged) = quality-evaluate, code-review, issue-debug, system-design, evidence-research, policy-govern, fault-resilience. BUILD (6, new) = feature-implement, code-refactor, test-verify, strategy-plan, docs-generate, enterprise-strategy. EXCLUDED (must stay passthrough) = meta-routing, routing-adapt, task-bootstrap, project-onboard, agent-orchestrate, analogy-think, prompt-engineering.
- The kill-switch `MCP_SITUATION_TRANSFORM=0` must continue to disable the whole transform.
- Every commit must pass `npx tsc --noEmit`, `npx biome check src/`, and the targeted vitest suites named in each task.
- Co-author every commit: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

### Task 1: Refactor the allow-list into a profile map (behavior-preserving)

Replace the `toolName → domain` map with a `toolName → { domain, outputContract }` map, and thread `outputContract` through `toSituationResult`. The 7 analysis tools keep the exact analysis contract, so behavior is identical and all existing tests stay green. This is a pure refactor that creates the seam Task 2 fills.

**Files:**
- Modify: `src/skills/shared/directive-first.ts`
- Modify: `src/tools/tool-call-handler.ts` (the hook)
- Test: `src/tests/skills/shared/directive-first.test.ts`

**Interfaces:**
- Produces: `export interface TransformProfile { domain: string; outputContract: string }`; `export const ANALYSIS_OUTPUT_CONTRACT: string`; `export const TRANSFORM_PROFILES: Readonly<Record<string, TransformProfile>>`; `export function resolveTransformProfile(toolName: string): TransformProfile | undefined`.
- Changes: `SituationTransformDeps` gains `outputContract: string`; `toSituationResult` uses `deps.outputContract` instead of the hard-coded string. `resolveTransformDomain` and `ANALYSIS_TRANSFORM_DOMAINS` are removed (no external consumers).

- [ ] **Step 1: Update the existing resolver tests to the profile API (RED)**

In `src/tests/skills/shared/directive-first.test.ts`, the `describe("resolveTransformDomain", …)` block calls the old function. Replace that whole block with:

```typescript
describe("resolveTransformProfile", () => {
	it("returns a profile with a clean domain noun for analysis-family tools", () => {
		const p = resolveTransformProfile("quality-evaluate");
		expect(p?.domain).toBe("evaluation setup");
		expect(p?.outputContract.toLowerCase()).toContain("findings per criterion");
		expect(resolveTransformProfile("code-review")?.domain).toBeTruthy();
		expect(resolveTransformProfile("issue-debug")?.domain).toBeTruthy();
	});

	it("never returns the raw 'Label:' displayName form as the domain", () => {
		const domain = resolveTransformProfile("quality-evaluate")?.domain ?? "";
		expect(domain).not.toMatch(/^[A-Z][a-z]+:/);
	});

	it("excludes routers, onboarding, bootstrap, orchestration", () => {
		expect(resolveTransformProfile("meta-routing")).toBeUndefined();
		expect(resolveTransformProfile("project-onboard")).toBeUndefined();
		expect(resolveTransformProfile("task-bootstrap")).toBeUndefined();
		expect(resolveTransformProfile("agent-orchestrate")).toBeUndefined();
	});
});
```

Also update the import at the top of the file from `resolveTransformDomain` to `resolveTransformProfile`. And in the existing `toSituationResult` tests, the `deps` object (currently `{ domain, candidateNextTools }`) must gain `outputContract`. Change the shared `deps` constant to:

```typescript
const deps = {
	domain: "evaluation setup",
	outputContract:
		"findings per criterion that cite the actual files, values, or evidence in this project, then a tailored next-action workflow",
	candidateNextTools: ["evidence-research", "code-review"],
};
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/tests/skills/shared/directive-first.test.ts`
Expected: FAIL — `resolveTransformProfile` is not exported; `deps.outputContract` unused until the impl reads it.

- [ ] **Step 3: Implement the profile map in `directive-first.ts`**

Replace the `ANALYSIS_TRANSFORM_DOMAINS` constant and `resolveTransformDomain` function with:

```typescript
export interface TransformProfile {
	/** Clean domain noun for the directive ("evaluation setup", not "Evaluate:"). */
	domain: string;
	/** The shape of deliverable the directive asks the model to produce. */
	outputContract: string;
}

/** Output contract for rubric-analysis tools — findings + next actions. */
export const ANALYSIS_OUTPUT_CONTRACT =
	"findings per criterion that cite the actual files, values, or evidence in this project, then a tailored next-action workflow";

/**
 * Per-tool transform profiles. Presence is the allow-list; absence means
 * "pass through untouched". Analysis tools produce findings against a rubric;
 * routers/orientation/orchestration tools are intentionally absent (their
 * deliverable is a decision/config, not a rubric analysis).
 */
export const TRANSFORM_PROFILES: Readonly<Record<string, TransformProfile>> = {
	"quality-evaluate": { domain: "evaluation setup", outputContract: ANALYSIS_OUTPUT_CONTRACT },
	"code-review": { domain: "code under review", outputContract: ANALYSIS_OUTPUT_CONTRACT },
	"issue-debug": { domain: "bug or incident", outputContract: ANALYSIS_OUTPUT_CONTRACT },
	"system-design": { domain: "system design", outputContract: ANALYSIS_OUTPUT_CONTRACT },
	"evidence-research": { domain: "research question", outputContract: ANALYSIS_OUTPUT_CONTRACT },
	"policy-govern": { domain: "governance and compliance posture", outputContract: ANALYSIS_OUTPUT_CONTRACT },
	"fault-resilience": { domain: "fault-tolerance and resilience posture", outputContract: ANALYSIS_OUTPUT_CONTRACT },
};

export function resolveTransformProfile(
	toolName: string,
): TransformProfile | undefined {
	return TRANSFORM_PROFILES[toolName];
}
```

In `SituationTransformDeps`, add `outputContract: string;`. In `toSituationResult`, change the `analyzeOrDirective` call's `outputContract:` from the hard-coded string to `deps.outputContract`. Update the function's JSDoc if it names the analysis contract specifically.

- [ ] **Step 4: Update the hook in `tool-call-handler.ts`**

Change the import from `resolveTransformDomain` to `resolveTransformProfile`. Replace the transform block:

```typescript
		const profile =
			process.env.MCP_SITUATION_TRANSFORM === "0"
				? undefined
				: resolveTransformProfile(toolName);
		const situationData = profile
			? await toSituationResult(result.data, {
					domain: profile.domain,
					outputContract: profile.outputContract,
					candidateNextTools: instruction.manifest.chainTo ?? [],
					sampler: runtime.sampler,
				})
			: result.data;
```

- [ ] **Step 5: Run to verify it passes**

Run: `npx vitest run src/tests/skills/shared/directive-first.test.ts src/tests/tools/tool-call-handler.test.ts`
Expected: PASS. Behavior for the 7 analysis tools is identical (same domains, same contract), so the dogfood and scope-guard tests still hold.

- [ ] **Step 6: Format, typecheck, commit**

```bash
npx biome check --write src/skills/shared/directive-first.ts src/tools/tool-call-handler.ts src/tests/skills/shared/directive-first.test.ts
npx tsc --noEmit
git add src/skills/shared/directive-first.ts src/tools/tool-call-handler.ts src/tests/skills/shared/directive-first.test.ts
git commit -m "refactor: per-tool transform profiles (domain + output contract)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Add the build/plan contract and the 6 solution-producing tools

Add a build-oriented output contract and register the 6 solution-producers in `TRANSFORM_PROFILES`. After this, those tools collapse their template wall into a tailored *plan/build* directive ("produce the concrete changes for THIS request, grounded in the code") instead of passing through.

**Files:**
- Modify: `src/skills/shared/directive-first.ts`
- Test: `src/tests/skills/shared/directive-first.test.ts`
- Test: `src/tests/tools/tool-call-handler.test.ts`

**Interfaces:**
- Produces: `export const BUILD_OUTPUT_CONTRACT: string`; 6 new entries in `TRANSFORM_PROFILES`.
- Consumes: `resolveTransformProfile` / `toSituationResult` from Task 1.

- [ ] **Step 1: Write the failing tests (RED)**

Add to `src/tests/skills/shared/directive-first.test.ts` inside `describe("resolveTransformProfile", …)`:

```typescript
	it("covers the solution-producing tools with the build contract", () => {
		for (const tool of [
			"feature-implement",
			"code-refactor",
			"test-verify",
			"strategy-plan",
			"docs-generate",
			"enterprise-strategy",
		]) {
			const p = resolveTransformProfile(tool);
			expect(p, tool).toBeDefined();
			expect(p?.outputContract.toLowerCase()).toContain("tailored");
			expect(p?.domain).not.toMatch(/^[A-Z][a-z]+:/);
		}
	});

	it("still excludes routers, orchestration, and the analogy/prompt special paths", () => {
		for (const tool of [
			"meta-routing",
			"routing-adapt",
			"task-bootstrap",
			"project-onboard",
			"agent-orchestrate",
			"analogy-think",
			"prompt-engineering",
		]) {
			expect(resolveTransformProfile(tool), tool).toBeUndefined();
		}
	});
```

Add to `src/tests/tools/tool-call-handler.test.ts` inside `describe("tool-call-handler", …)` (mirrors the existing quality-evaluate dogfood for a build tool):

```typescript
	it("feature-implement now emits a target-oriented build directive, not a template wall", async () => {
		const result = await dispatchToolCall(
			"feature-implement",
			{ request: "add rate limiting to the public checkout API" },
			createRuntime(),
		);
		expect(result.isError).toBeUndefined();
		const text = result.content[0]?.text ?? "";
		expect(text).toContain("Analyze your feature to implement");
		expect(text).toContain("add rate limiting to the public checkout API");
		expect(text.toLowerCase()).not.toContain("advisory only");
	});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/tests/skills/shared/directive-first.test.ts src/tests/tools/tool-call-handler.test.ts -t "build contract"`
Run: `npx vitest run src/tests/tools/tool-call-handler.test.ts -t "feature-implement now emits"`
Expected: FAIL — those tools resolve to `undefined`, so `feature-implement` passes through with no directive.

- [ ] **Step 3: Implement the build contract + entries**

In `src/skills/shared/directive-first.ts`, after `ANALYSIS_OUTPUT_CONTRACT`, add:

```typescript
/** Output contract for build/plan tools — a tailored deliverable + next steps. */
export const BUILD_OUTPUT_CONTRACT =
	"a concrete, tailored deliverable for this request — the specific changes, steps, tests, or artifacts to produce, grounded in the actual files and code, followed by an ordered next-action sequence";
```

Add these entries to `TRANSFORM_PROFILES`:

```typescript
	"feature-implement": { domain: "feature to implement", outputContract: BUILD_OUTPUT_CONTRACT },
	"code-refactor": { domain: "refactor target", outputContract: BUILD_OUTPUT_CONTRACT },
	"test-verify": { domain: "test and verification gap", outputContract: BUILD_OUTPUT_CONTRACT },
	"strategy-plan": { domain: "plan or roadmap", outputContract: BUILD_OUTPUT_CONTRACT },
	"docs-generate": { domain: "documentation to produce", outputContract: BUILD_OUTPUT_CONTRACT },
	"enterprise-strategy": { domain: "enterprise strategy", outputContract: BUILD_OUTPUT_CONTRACT },
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/tests/skills/shared/directive-first.test.ts src/tests/tools/tool-call-handler.test.ts`
Expected: PASS (new coverage + exclusion tests + feature-implement dogfood, plus all prior tests).

- [ ] **Step 5: Format, typecheck, commit**

```bash
npx biome check --write src/skills/shared/directive-first.ts src/tests/skills/shared/directive-first.test.ts src/tests/tools/tool-call-handler.test.ts
npx tsc --noEmit
git add src/skills/shared/directive-first.ts src/tests/skills/shared/directive-first.test.ts src/tests/tools/tool-call-handler.test.ts
git commit -m "feat: extend the situation-transform to solution-producing tools (build contract)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Close the default-surface discoverability gap (docs + routing)

The transform-eligible tools are hidden in slim (default) mode but remain callable. Document that discovery requires `MCP_FULL_SURFACE=true`, and pin that the router (`meta-routing`) names transform-eligible tools so an agent reaches them.

**Files:**
- Modify: `src/tools/shared/tool-surface-manifest.ts` (JSDoc on `SLIM_SURFACE_TOOLS`)
- Modify: `README.md` (slim-mode section — add the discoverability note)
- Test: `src/tests/tools/tool-call-handler.test.ts`

**Interfaces:**
- No code-behavior change to the slim surface. Adds a documentation note and one test pinning that `meta-routing` output references at least one transform-eligible tool.

- [ ] **Step 1: Write the failing/penning test**

Add to `src/tests/tools/tool-call-handler.test.ts`:

```typescript
	// Default-surface gap (tribunal C3): in slim mode the transform-eligible tools
	// are hidden but callable. The router must name them so an agent can reach a
	// target-oriented tool from the default surface.
	it("meta-routing surfaces at least one transform-eligible tool by name", async () => {
		const result = await dispatchToolCall(
			"meta-routing",
			{ request: "review my auth module and find the security bugs" },
			createRuntime(),
		);
		const text = result.content[0]?.text ?? "";
		const eligible = [
			"code-review",
			"issue-debug",
			"quality-evaluate",
			"system-design",
			"evidence-research",
			"policy-govern",
			"fault-resilience",
			"feature-implement",
			"code-refactor",
			"test-verify",
			"strategy-plan",
		];
		expect(eligible.some((t) => text.includes(t))).toBe(true);
	});
```

- [ ] **Step 2: Run to verify it passes (or fails)**

Run: `npx vitest run src/tests/tools/tool-call-handler.test.ts -t "meta-routing surfaces"`
Expected: PASS if the router already names tools via its chainTo footer. If it FAILS, the router does not surface any eligible tool — report that as a finding and stop; routing changes are out of scope for this doc task and need their own task.

- [ ] **Step 3: Document the discoverability requirement**

In `src/tools/shared/tool-surface-manifest.ts`, extend the JSDoc above `SLIM_SURFACE_TOOLS` with one sentence:

```typescript
// Note: the situation-transform (target-oriented analysis/build output) applies
// only to domain tools, which are HIDDEN in slim mode but still callable by
// name. To expose them for discovery, set MCP_FULL_SURFACE=true.
```

In `README.md`, find the slim-mode/`MCP_FULL_SURFACE` section and add:

```markdown
> **Target-oriented output & the slim surface.** The situation-transform that turns
> a tool's keyword-matched template into a project-specific analysis or build plan
> applies to the domain tools (e.g. `code-review`, `issue-debug`, `feature-implement`).
> These are hidden in the default slim surface but remain callable by name (the
> router chains to them). Set `MCP_FULL_SURFACE=true` to list them for discovery.
```

(If the README has no such section, add the note under the first heading that mentions `MCP_FULL_SURFACE`.)

- [ ] **Step 4: Verify + commit**

Run: `npx vitest run src/tests/tools/tool-call-handler.test.ts`
Expected: PASS.

```bash
npx biome check --write src/tools/shared/tool-surface-manifest.ts src/tests/tools/tool-call-handler.test.ts
npx tsc --noEmit
git add src/tools/shared/tool-surface-manifest.ts README.md src/tests/tools/tool-call-handler.test.ts
git commit -m "docs: document that target-oriented tools need MCP_FULL_SURFACE; pin router surfacing

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Verify coverage end-to-end (13/20) and refresh the eval

Confirm the enumeration moved from 7/20 to 13/20, the right tools are excluded, and nothing regressed.

**Files:**
- Modify: `evals/RESULTS.md` (append a coverage-expansion note)

- [ ] **Step 1: Rebuild and run the full suite**

Run: `npm run build && npx vitest run`
Expected: green except the known flaky `cross-blind-analogy`/`index-main` tests (pass in isolation) — confirm any failure passes alone before treating it as pre-existing.

- [ ] **Step 2: Enumerate the transformed tools**

Create `src/tests/tools/enum.test.ts` with the enumeration probe (dispatch each public instruction with a real request, mark those whose output contains `Analyze your ` + `analysis task`), run it, read `/tmp/enum.txt`, then delete the probe file. Expected: **13/20 transformed** — the 7 analysis + 6 build tools — and the 7 excluded (meta-routing, routing-adapt, task-bootstrap, project-onboard, agent-orchestrate, analogy-think, prompt-engineering) still passthrough.

- [ ] **Step 3: Append the coverage note to `evals/RESULTS.md`**

Add a dated section recording: coverage went 7/20 → 13/20; the build contract now covers feature-implement, code-refactor, test-verify, strategy-plan, docs-generate, enterprise-strategy; the 7 excluded tools and the rationale (routers/orientation/orchestration/special); and the default-surface note (hidden-but-callable, MCP_FULL_SURFACE for discovery).

- [ ] **Step 4: Commit**

```bash
git add evals/RESULTS.md
git commit -m "docs: record target-orientation coverage expansion (7/20 -> 13/20)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- Tribunal C1/C2 (solution-producers excluded) → Tasks 1+2: generalized contract + 6 build tools, with the exclusion set pinned by test.
- Tribunal C3 (default surface) → Task 3: documentation + router-surfacing test.
- Tribunal C4 (claim honesty) → the new accurate state (13/20, with a documented, tested boundary) replaces the inaccurate "all tools" expectation; RESULTS.md (Task 4) records it honestly.
- Verification → Task 4 (enumeration 13/20 + full suite).

**Placeholder scan:** Every code step shows exact code. The two conditional steps (Task 3 Step 2 router check; Task 4 flaky-test handling) state the exact fallback. No "TBD"/"handle edge cases".

**Type consistency:** `TransformProfile`, `resolveTransformProfile`, `TRANSFORM_PROFILES`, `ANALYSIS_OUTPUT_CONTRACT`, `BUILD_OUTPUT_CONTRACT`, and `SituationTransformDeps.outputContract` are introduced in Task 1 and used consistently in Tasks 2–4. The build-tool domains are lowercase nouns (no "Label:" prefix), matching the analysis-tool convention so the directive copy stays grammatical.
