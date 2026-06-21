# Sampler Seam + Real Analysis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let any skill optionally perform real, server-driven LLM analysis via MCP sampling, falling back to the universal return-a-prompt directive when the client offers no sampling capability.

**Architecture:** Add `sampler?` as a third optional-capability seam on the runtime — identical in shape to the existing `workspace?` (`SkillExecutionRuntime`) and `serena?` (`WorkflowExecutionRuntime`) seams. A `makeSampler(server)` factory wraps `server.createMessage`; `main()` populates it post-connect from `server.getClientCapabilities().sampling`. Skills read `context.runtime.sampler?` and branch: sample-or-directive, with try/catch fallback to the directive. No new call sites — the change rides the single `createSkillExecutionContext` funnel.

**Tech Stack:** TypeScript (ESM, `.js` import specifiers), `@modelcontextprotocol/sdk` 1.29.0, vitest 4, biome.

## Global Constraints

- SDK already installed: `@modelcontextprotocol/sdk@^1.17.1` (1.29.0 resolved). Do NOT bump.
- ESM: every relative import ends in `.js`. Indentation is TABS.
- `src/contracts/runtime.ts` must stay free of SDK imports (pure type contracts). The MCP `Server` type may only be imported in factory/wiring modules.
- The directive helper already exists: `buildAnalysisDirective` in `src/skills/shared/analysis-directive.ts` (do NOT recreate it).
- Existing tests must keep `runtime.sampler` undefined and assert the directive path; new sampled-path tests inject a fake `Sampler`. Mirror the `workspace?` seam's test discipline (`src/tests/test-helpers/handler-runtime.ts`, `createWorkspaceReaderStub`).
- Do not reintroduce legacy multiplexed tool names (`.claude/rules/no-legacy-tool-split.md`).
- Run `npx biome check --write <files>` before each commit.

---

### Task 0: Decide `llm-lane-executor`'s fate — retire it, make the sampler the single model path

**Context:** The codebase already contains a model-calling mechanism, `src/runtime/llm-lane-executor.ts`, built on the Vercel AI SDK (`@ai-sdk/anthropic`, `@ai-sdk/openai`, `ai` → `generateText`/`streamText`). It is **dead at the product level**: every function and the `LlmLaneExecutor` class are referenced only by its own unit test; the only thing the rest of the tree imports is the `ModelTier` type (`src/contracts/llm-types.ts:9`). Adding MCP sampling without addressing it would leave two competing model stacks. Decision: **retire the executor** (server-holds-API-keys model is wrong for an MCP server) and make client-driven MCP sampling the single path. This also removes three heavy dependencies.

**Files:**
- Modify: `src/contracts/llm-types.ts` (absorb the `ModelTier` type locally)
- Delete: `src/runtime/llm-lane-executor.ts`, `src/tests/runtime/llm-lane-executor.test.ts`
- Modify: `package.json` (drop `@ai-sdk/anthropic`, `@ai-sdk/openai`, `ai`)

- [ ] **Step 1: Relocate the `ModelTier` type into the pure contracts file**

In `src/contracts/llm-types.ts`, replace the import line
`import type { ModelTier } from "../runtime/llm-lane-executor.js";` with a local definition:

```typescript
export type ModelTier = "free" | "cheap" | "strong" | "reviewer";
```

- [ ] **Step 2: Confirm nothing else imports from the executor**

Run: `grep -rn "llm-lane-executor" src/ | grep -v "src/tests/runtime/llm-lane-executor.test.ts"`
Expected: no results after Step 1 (the `llm-types.ts` import is gone). If any remain, repoint them at a pure module before deleting.

- [ ] **Step 3: Delete the executor and its test**

```bash
git rm src/runtime/llm-lane-executor.ts src/tests/runtime/llm-lane-executor.test.ts
```

- [ ] **Step 4: Drop the now-orphaned dependencies**

```bash
npm uninstall @ai-sdk/anthropic @ai-sdk/openai ai
```

- [ ] **Step 5: Check whether `gpt-tokenizer` is now also orphaned**

Run: `grep -rn "gpt-tokenizer" src/ | grep -v "\.test\."`
If the only importer was the deleted executor, also run `npm uninstall gpt-tokenizer`. Otherwise leave it.

- [ ] **Step 6: Verify the tree still builds and passes**

Run: `npm run build && npx tsc --noEmit && npx vitest run`
Expected: clean build, full suite green (minus the deleted executor test). No `@ai-sdk`/`ai` import remains: `grep -rn "@ai-sdk\|from \"ai\"" src/` returns nothing.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(sampler): retire dead llm-lane-executor; MCP sampling is the single model path"
```

---

### Task 1: Sampler types + `makeSampler` factory

**Files:**
- Modify: `src/contracts/runtime.ts` (add pure `Sampler` types + optional runtime fields)
- Create: `src/tools/shared/sampler.ts` (`makeSampler` factory, SDK-coupled)
- Test: `src/tests/tools/shared/sampler.test.ts`

**Interfaces:**
- Produces: `SamplerRequest = { system: string; prompt: string; maxTokens: number; modelClass: RecommendationItem["modelClass"] }`; `SamplerResult = { text: string }`; `Sampler = (req: SamplerRequest) => Promise<SamplerResult>`; `makeSampler(server: Pick<Server, "createMessage">): Sampler`.
- Consumes (Task 2): the optional runtime fields `sampler?`/`clientSupportsSampling?`.

- [ ] **Step 1: Add pure Sampler types to the contracts file**

In `src/contracts/runtime.ts`, after the `RecommendationItem` interface, add:

```typescript
export interface SamplerRequest {
	system: string;
	prompt: string;
	maxTokens: number;
	modelClass: RecommendationItem["modelClass"];
}

export interface SamplerResult {
	text: string;
}

/** Optional server-driven sampling capability. Wraps MCP `sampling/createMessage`. */
export type Sampler = (req: SamplerRequest) => Promise<SamplerResult>;
```

- [ ] **Step 2: Write the failing test for `makeSampler`**

Create `src/tests/tools/shared/sampler.test.ts`:

```typescript
import { describe, expect, it, vi } from "vitest";
import { makeSampler } from "../../../tools/shared/sampler.js";

describe("makeSampler", () => {
	it("maps the request onto createMessage and returns the text content", async () => {
		const createMessage = vi.fn().mockResolvedValue({
			content: { type: "text", text: "real finding" },
		});
		const sampler = makeSampler({ createMessage });

		const result = await sampler({
			system: "you are an evaluator",
			prompt: "evaluate X",
			maxTokens: 512,
			modelClass: "strong",
		});

		expect(result.text).toBe("real finding");
		const params = createMessage.mock.calls[0][0];
		expect(params.maxTokens).toBe(512);
		expect(params.systemPrompt).toBe("you are an evaluator");
		expect(params.messages[0].content.text).toBe("evaluate X");
	});

	it("returns empty text when the model yields a non-text block", async () => {
		const createMessage = vi
			.fn()
			.mockResolvedValue({ content: { type: "image", data: "..." } });
		const sampler = makeSampler({ createMessage });

		const result = await sampler({
			system: "s",
			prompt: "p",
			maxTokens: 10,
			modelClass: "cheap",
		});

		expect(result.text).toBe("");
	});
});
```

- [ ] **Step 3: Run the test, verify it fails**

Run: `npx vitest run src/tests/tools/shared/sampler.test.ts`
Expected: FAIL — `Cannot find module '.../tools/shared/sampler.js'`.

- [ ] **Step 4: Implement `makeSampler`**

Create `src/tools/shared/sampler.ts`:

```typescript
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import type { Sampler } from "../../contracts/runtime.js";

const MODEL_HINTS: Record<string, string> = {
	cheap: "claude-haiku",
	strong: "claude-sonnet",
	reviewer: "claude-opus",
};

/**
 * Wrap an MCP server's `createMessage` into a `Sampler`. The server may only
 * call this when the client advertises the `sampling` capability; callers gate
 * on `clientSupportsSampling` before invoking.
 */
export function makeSampler(
	server: Pick<Server, "createMessage">,
): Sampler {
	return async (req) => {
		const response = await server.createMessage({
			systemPrompt: req.system,
			maxTokens: req.maxTokens,
			messages: [
				{ role: "user", content: { type: "text", text: req.prompt } },
			],
			modelPreferences: {
				hints: [{ name: MODEL_HINTS[req.modelClass] ?? "claude" }],
			},
		});
		const block = response.content;
		const text =
			block && block.type === "text" && typeof block.text === "string"
				? block.text
				: "";
		return { text };
	};
}
```

- [ ] **Step 5: Run the test, verify it passes**

Run: `npx vitest run src/tests/tools/shared/sampler.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Typecheck + commit**

Run: `npx tsc --noEmit && npx biome check --write src/contracts/runtime.ts src/tools/shared/sampler.ts src/tests/tools/shared/sampler.test.ts`

```bash
git add src/contracts/runtime.ts src/tools/shared/sampler.ts src/tests/tools/shared/sampler.test.ts
git commit -m "feat(sampler): add Sampler types and makeSampler factory"
```

---

### Task 2: Thread the seam onto the runtime + populate post-connect

**Files:**
- Modify: `src/contracts/runtime.ts:235` (`SkillExecutionRuntime`) and `:257` (`WorkflowExecutionRuntime`) — add optional fields
- Create: `src/runtime/attach-sampler.ts` (`attachSamplerCapability`, unit-testable)
- Modify: `src/index.ts` (call it in `main()` after `anchorStateToClientRoots`)
- Test: `src/tests/runtime/attach-sampler.test.ts`

**Interfaces:**
- Consumes: `Sampler`, `makeSampler` (Task 1).
- Produces: `attachSamplerCapability(runtime: { sampler?: Sampler; clientSupportsSampling?: boolean }, server: Pick<Server, "createMessage" | "getClientCapabilities">): void`. Sets `runtime.clientSupportsSampling` from `server.getClientCapabilities()?.sampling` and, when present, `runtime.sampler = makeSampler(server)`.

- [ ] **Step 1: Add optional fields to both runtime interfaces**

In `src/contracts/runtime.ts`, inside `SkillExecutionRuntime` (after the `workspace?` field) add:

```typescript
	/**
	 * Optional server-driven sampling capability. Present only when the MCP
	 * client advertises `sampling`. Skill handlers should read it via
	 * `context.runtime.sampler?` and must degrade gracefully when undefined.
	 */
	sampler?: Sampler;
	/** True when the connected client advertised the `sampling` capability. */
	clientSupportsSampling?: boolean;
```

In `WorkflowExecutionRuntime` (after the `serena?` field) add the identical two fields (so the capability survives the registry threading where `WorkflowExecutionRuntime` is the static type).

- [ ] **Step 2: Write the failing test for `attachSamplerCapability`**

Create `src/tests/runtime/attach-sampler.test.ts`:

```typescript
import { describe, expect, it, vi } from "vitest";
import type { Sampler } from "../../contracts/runtime.js";
import { attachSamplerCapability } from "../../runtime/attach-sampler.js";

function fakeServer(caps: unknown) {
	return {
		getClientCapabilities: () => caps,
		createMessage: vi.fn().mockResolvedValue({
			content: { type: "text", text: "x" },
		}),
	};
}

describe("attachSamplerCapability", () => {
	it("attaches a sampler when the client advertises sampling", () => {
		const runtime: { sampler?: Sampler; clientSupportsSampling?: boolean } = {};
		attachSamplerCapability(runtime, fakeServer({ sampling: {} }));
		expect(runtime.clientSupportsSampling).toBe(true);
		expect(typeof runtime.sampler).toBe("function");
	});

	it("leaves sampler undefined when the client lacks sampling", () => {
		const runtime: { sampler?: Sampler; clientSupportsSampling?: boolean } = {};
		attachSamplerCapability(runtime, fakeServer({ roots: {} }));
		expect(runtime.clientSupportsSampling).toBe(false);
		expect(runtime.sampler).toBeUndefined();
	});

	it("treats absent capabilities as no sampling", () => {
		const runtime: { sampler?: Sampler; clientSupportsSampling?: boolean } = {};
		attachSamplerCapability(runtime, fakeServer(undefined));
		expect(runtime.clientSupportsSampling).toBe(false);
		expect(runtime.sampler).toBeUndefined();
	});
});
```

- [ ] **Step 3: Run the test, verify it fails**

Run: `npx vitest run src/tests/runtime/attach-sampler.test.ts`
Expected: FAIL — `Cannot find module '.../runtime/attach-sampler.js'`.

- [ ] **Step 4: Implement `attachSamplerCapability`**

Create `src/runtime/attach-sampler.ts`:

```typescript
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import type { Sampler } from "../contracts/runtime.js";
import { makeSampler } from "../tools/shared/sampler.js";

export function attachSamplerCapability(
	runtime: { sampler?: Sampler; clientSupportsSampling?: boolean },
	server: Pick<Server, "createMessage" | "getClientCapabilities">,
): void {
	const supportsSampling = Boolean(server.getClientCapabilities()?.sampling);
	runtime.clientSupportsSampling = supportsSampling;
	if (supportsSampling) {
		runtime.sampler = makeSampler(server);
	}
}
```

- [ ] **Step 5: Run the test, verify it passes**

Run: `npx vitest run src/tests/runtime/attach-sampler.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Wire into `main()`**

In `src/index.ts`, inside `main()`, immediately after the `await anchorStateToClientRoots(server, runtime);` line, add:

```typescript
	attachSamplerCapability(runtime, server);
```

And add the import near the other `./runtime/...` imports:

```typescript
import { attachSamplerCapability } from "./runtime/attach-sampler.js";
```

- [ ] **Step 7: Typecheck, run runtime tests, commit**

Run: `npx tsc --noEmit && npx vitest run src/tests/runtime/ && npx biome check --write src/contracts/runtime.ts src/runtime/attach-sampler.ts src/index.ts src/tests/runtime/attach-sampler.test.ts`
Expected: tsc clean; runtime tests PASS.

```bash
git add src/contracts/runtime.ts src/runtime/attach-sampler.ts src/index.ts src/tests/runtime/attach-sampler.test.ts
git commit -m "feat(sampler): thread sampler capability onto runtime, populate post-connect"
```

---

### Task 3: `analyzeOrDirective` — the sample-or-fallback helper

**Files:**
- Create: `src/skills/shared/analyze-or-directive.ts`
- Test: `src/tests/skills/shared/analyze-or-directive.test.ts`

**Interfaces:**
- Consumes: `buildAnalysisDirective` (`src/skills/shared/analysis-directive.ts`), `SkillExecutionContext` (`src/skills/runtime/contracts.ts`), `Sampler`.
- Produces: `analyzeOrDirective(context, spec): Promise<{ recommendation: RecommendationItem; mode: "sampled" | "directive" }>` where `spec` is the `AnalysisDirectiveSpec` (minus `modelClass`, taken from `context.model.modelClass`). When `context.runtime.sampler` is present it samples using the directive text as the prompt and returns a `context`-grounded recommendation titled `Analysis of your <domain>`; on any throw or absent sampler it returns `buildAnalysisDirective(...)` unchanged.

- [ ] **Step 1: Write the failing test**

Create `src/tests/skills/shared/analyze-or-directive.test.ts`:

```typescript
import { describe, expect, it, vi } from "vitest";
import type { Sampler } from "../../../contracts/runtime.js";
import { analyzeOrDirective } from "../../../skills/shared/analyze-or-directive.js";
import { createMockSkillExecutionContext } from "../test-helpers.js";

const spec = {
	domain: "evaluation design",
	criteria: ["Define the dataset slices."],
	input: { request: "evaluate our RAG pipeline" },
	outputContract: "a table",
};

describe("analyzeOrDirective", () => {
	it("returns the directive when no sampler is present", async () => {
		const context = createMockSkillExecutionContext();
		const { recommendation, mode } = await analyzeOrDirective(context, spec);
		expect(mode).toBe("directive");
		expect(recommendation.detail.toLowerCase()).toContain("analysis task");
	});

	it("samples when a sampler is present and returns its findings", async () => {
		const sampler: Sampler = vi
			.fn()
			.mockResolvedValue({ text: "Slice coverage is thin in tests/golden.jsonl." });
		const context = createMockSkillExecutionContext({
			runtime: { sampler, clientSupportsSampling: true },
		});
		const { recommendation, mode } = await analyzeOrDirective(context, spec);
		expect(mode).toBe("sampled");
		expect(recommendation.detail).toContain("Slice coverage is thin");
	});

	it("falls back to the directive when sampling throws", async () => {
		const sampler: Sampler = vi.fn().mockRejectedValue(new Error("no model"));
		const context = createMockSkillExecutionContext({
			runtime: { sampler, clientSupportsSampling: true },
		});
		const { recommendation, mode } = await analyzeOrDirective(context, spec);
		expect(mode).toBe("directive");
		expect(recommendation.detail.toLowerCase()).toContain("analysis task");
	});
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `npx vitest run src/tests/skills/shared/analyze-or-directive.test.ts`
Expected: FAIL — module not found. (If `createMockSkillExecutionContext` does not accept a `runtime` override, extend it minimally first — see Step 3a.)

- [ ] **Step 3a: If needed, let the mock context accept a runtime override**

Inspect `src/tests/skills/test-helpers.ts` `createMockSkillExecutionContext`. If it does not already merge a `runtime` partial, add an optional `overrides?: { runtime?: Partial<SkillExecutionRuntime> }` parameter that shallow-merges into the default runtime. Keep existing callers working (parameter optional).

- [ ] **Step 3: Implement `analyzeOrDirective`**

Create `src/skills/shared/analyze-or-directive.ts`:

```typescript
import type { RecommendationItem } from "../../contracts/runtime.js";
import type { SkillExecutionContext } from "../runtime/contracts.js";
import {
	type AnalysisDirectiveSpec,
	buildAnalysisDirective,
} from "./analysis-directive.js";

export type AnalyzeOrDirectiveSpec = Omit<AnalysisDirectiveSpec, "modelClass">;

const MAX_TOKENS = 700;

export async function analyzeOrDirective(
	context: SkillExecutionContext,
	spec: AnalyzeOrDirectiveSpec,
): Promise<{ recommendation: RecommendationItem; mode: "sampled" | "directive" }> {
	const modelClass = context.model.modelClass;
	const directive = buildAnalysisDirective({ ...spec, modelClass });
	const sampler = context.runtime.sampler;
	if (!sampler) {
		return { recommendation: directive, mode: "directive" };
	}
	try {
		const { text } = await sampler({
			system: `You analyze a project's ${spec.domain} against a rubric. Be specific and cite evidence; never return generic advice.`,
			prompt: directive.detail,
			maxTokens: MAX_TOKENS,
			modelClass,
		});
		if (text.trim().length === 0) {
			return { recommendation: directive, mode: "directive" };
		}
		return {
			recommendation: {
				title: `Analysis of your ${spec.domain}`,
				detail: text.trim(),
				modelClass,
				groundingScope: "context",
			},
			mode: "sampled",
		};
	} catch {
		return { recommendation: directive, mode: "directive" };
	}
}
```

- [ ] **Step 4: Run the test, verify it passes**

Run: `npx vitest run src/tests/skills/shared/analyze-or-directive.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Typecheck + commit**

Run: `npx tsc --noEmit && npx biome check --write src/skills/shared/analyze-or-directive.ts src/tests/skills/shared/analyze-or-directive.test.ts`

```bash
git add src/skills/shared/analyze-or-directive.ts src/tests/skills/shared/analyze-or-directive.test.ts src/tests/skills/test-helpers.ts
git commit -m "feat(sampler): add analyzeOrDirective sample-or-fallback helper"
```

---

### Task 4: Adopt `analyzeOrDirective` in the eval skills (A5)

**Files:**
- Modify: `src/skills/eval/eval-design.ts`, `eval-output-grading.ts`, `eval-prompt-bench.ts`, `eval-prompt.ts`, `eval-variance.ts`
- Modify: `src/tests/skills/eval/eval-directive.test.ts` (add a sampled-path assertion)

**Interfaces:**
- Consumes: `analyzeOrDirective` (Task 3). Replaces the direct `buildAnalysisDirective(...)` call introduced by the A0 pilot.

- [ ] **Step 1: Write the failing sampled-path test**

In `src/tests/skills/eval/eval-directive.test.ts`, add (importing `vi`):

```typescript
it("eval-design uses the sampler to produce findings when one is present", async () => {
	const sampler = vi
		.fn()
		.mockResolvedValue({ text: "Your golden.jsonl lacks hard negatives." });
	const result = await evalDesign.run(
		{ request: "design an eval dataset with assertions" },
		{ ...baseRuntime, sampler, clientSupportsSampling: true },
	);
	expect(result.recommendations[0]?.title.toLowerCase()).toMatch(/^analysis of your/);
	expect(result.recommendations[0]?.detail).toContain(
		"Your golden.jsonl lacks hard negatives.",
	);
});
```

Add a `baseRuntime` built from `createHandlerRuntime()` (`src/tests/test-helpers/handler-runtime.ts`) at the top of the file.

- [ ] **Step 2: Run the test, verify it fails**

Run: `npx vitest run src/tests/skills/eval/eval-directive.test.ts`
Expected: FAIL — lead title is still `analyze your …` (directive), not `analysis of your …` (sampled).

- [ ] **Step 3: Convert each eval skill's handler to async-await the helper**

In `eval-design.ts`, replace the inline directive construction in the `return createCapabilityResult(...)` recommendations array. Before the return, add:

```typescript
		const { recommendation: leadAnalysis } = await analyzeOrDirective(context, {
			domain: "evaluation design",
			criteria: matchedRules,
			input: parsed.data,
			outputContract:
				"an eval plan naming the dataset slices, the grading oracle per slice, the versioned baseline, and the release decision each threshold triggers",
		});
```

Then change the recommendations array head from `buildAnalysisDirective({...})` to `leadAnalysis`, and swap the import:

```typescript
import { analyzeOrDirective } from "../shared/analyze-or-directive.js";
```

(remove the now-unused `buildAnalysisDirective` import). The handler `execute` is already `async`. Repeat verbatim for the other four skills using their existing domain/outputContract strings from the A0 pilot.

- [ ] **Step 4: Run the eval suite, verify GREEN**

Run: `npx vitest run src/tests/skills/eval/`
Expected: PASS (directive path for the no-sampler tests, sampled path for the new test).

- [ ] **Step 5: Typecheck + commit**

Run: `npx tsc --noEmit && npx biome check --write src/skills/eval/ src/tests/skills/eval/eval-directive.test.ts`

```bash
git add src/skills/eval/ src/tests/skills/eval/eval-directive.test.ts
git commit -m "feat(eval): sample real findings when client supports it, directive otherwise"
```

---

### Task 5: Roll the seam out to `code-review` and `issue-debug` (A6, first wave)

**Files:**
- Modify: the lead skills behind `code-review` (`src/skills/qual/*`) and `issue-debug` (`src/skills/debug/*` — confirm exact dir via `grep -rl "issue-debug\|code-review" src/generated/instructions/`)
- Test: extend the corresponding `src/tests/skills/...` suites with a directive-present assertion

**Interfaces:**
- Consumes: `analyzeOrDirective` (Task 3). Same adoption shape as Task 4.

- [ ] **Step 1: Identify the lead skill + its RULES array**

Run: `grep -n "matchEvalRules\|_RULES\|createCapabilityResult" src/skills/qual/<lead-skill>.ts`
Record the rules array name and the return block, as in Task 4.

- [ ] **Step 2: Write the failing directive assertion**

Add to the skill's test (use a valid request that passes its signal gate):

```typescript
it("leads with a return-a-prompt analysis directive", async () => {
	const result = await expectSkillGuidance(skillModule, { request: "<valid request>" }, {});
	expect(result.recommendations[0]?.title.toLowerCase()).toMatch(/^analyze your/);
	expect(result.recommendations[0]?.detail.toLowerCase()).toContain("analysis task");
});
```

- [ ] **Step 3: Run, verify it fails**

Run: `npx vitest run src/tests/skills/qual/<lead-skill>.test.ts`
Expected: FAIL — no `analyze your …` lead.

- [ ] **Step 4: Wire `analyzeOrDirective` exactly as in Task 4 (capture matched rules, await helper, prepend lead recommendation)**

- [ ] **Step 5: Run, verify GREEN**

Run: `npx vitest run src/tests/skills/qual/`
Expected: PASS.

- [ ] **Step 6: Repeat Steps 1–5 for the `issue-debug` lead skill, then commit**

Run: `npx tsc --noEmit && npx biome check --write src/skills/`

```bash
git add src/skills/ src/tests/skills/
git commit -m "feat(rollout): real-analysis seam for code-review and issue-debug"
```

---

### Task 6: Full-suite verification

- [ ] **Step 1: Build + full test run**

Run: `npm run build && npx vitest run`
Expected: tsc clean; full suite green with no drop from the 3298-passing baseline (new tests add to the count).

- [ ] **Step 2: Targeted no-legacy + coverage-matrix suites**

Run: `npx vitest run src/tests/mcp/tool-coverage-matrix.test.ts src/tests/runtime/mcp-server.test.ts src/tests/tools/`
Expected: PASS.

- [ ] **Step 3: Commit any codegen drift fix if `npm run build` changed generated files**

```bash
git add -A && git commit -m "chore(sampler): regenerate after seam rollout" || echo "no drift"
```

## Self-Review

- **Spec coverage:** A1–A4 (seam) → Tasks 1–2; A5 (eval sampling) → Task 4; A6 (rollout) → Task 5; helper that makes both honest → Task 3. Covered.
- **Type consistency:** `Sampler`/`SamplerRequest`/`SamplerResult` defined once in `contracts/runtime.ts` (Task 1), consumed unchanged in Tasks 2–4. `analyzeOrDirective` signature stable across Tasks 3–5. `buildAnalysisDirective` reused, not redefined.
- **Placeholder scan:** Task 5 leaves the exact skill file/dir to a `grep` because the debug/qual lead-skill filenames must be confirmed at execution; every other step has concrete code. Acceptable — it is a lookup, not a deferred design decision.
- **Graceful degradation:** every sampling path has try/catch → directive fallback; empty-text → directive; absent sampler → directive. Existing tests untouched (sampler undefined by default).
