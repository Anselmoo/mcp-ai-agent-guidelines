# Technique Catalog + Serena Grounding + Auto-Mode Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adopt universal-creator's prompt-technique catalog + a deterministic selector into the `prompt-engineering` pipeline (Issue 1605 Phases 1–5), thread Serena symbol grounding into skill execution (Issue 1601), and verify/harden the already-shipped auto-mode surface (Issue 1445).

**Architecture:** A typed, data-only technique catalog (`technique-catalog.ts`) + a pure deterministic selector (`technique-selector.ts`) reusing the existing `extractRequestSignals` + `rankCandidateTools` primitives — no sampler, no new public tools. The selector's output is folded into `prompt-engineering`'s recommendation/artifact set. Serena grounding is added as a bounded, never-throws helper alongside the existing file-grounding helper. 1445 is locked with regression tests + a description-field audit.

**Tech Stack:** TypeScript (ESM, `.js` import specifiers), Zod, Vitest, Biome; Python codegen (`generate-tool-definitions.py`); MCP servers: `serena`, `mcp-server-analyzer`, local `ai-agent-guidelines`.

## Global Constraints

- **No sampler round-trip.** Selector must be pure/deterministic (keyword + signal scoring only). Ref `docs/adr/0001-remove-sampler-round-trip.md`.
- **Never hand-edit `src/generated/**`.** Edit sources (`src/instructions/instruction-specs.ts`, skill sources), then run `python3 scripts/generate-tool-definitions.py` + `npm run generate:skill-docs`.
- **No tool-surface explosion.** Enrich the 4 existing prompt skills only. No per-technique public MCP tools.
- **Attribution.** Port under MIT with credit to `Anselmoo/universal-creator` in catalog module header + docs.
- **ESM imports** use `.js` specifiers even for `.ts` files (repo convention).
- **Determinism:** same input → identical output (no `Date.now`, no `Math.random`, stable sort).
- **Gates green before done:** `npm test`, `python3 scripts/verify_matrix.py`, `npm run quality`, `npm run check:generated`.

---

## File Structure

| File | Responsibility | Stage |
|---|---|---|
| `src/skills/prompt/technique-catalog.ts` (new) | Typed data catalog: 12 technique entries + accessor helpers | A/C/D |
| `src/skills/prompt/technique-selector.ts` (new) | Pure classifier: request → category + primary/supplementary + rationale | A |
| `src/skills/prompt/technique-examples.ts` (new) | Worked-card data for the 7 first-class techniques | B |
| `src/skills/prompt/prompt-engineering.ts` (modify) | Call selector in STRUCTURE step; emit selection recommendation + matrix artifact | A/B |
| `src/skills/shared/workspace-grounding.ts` (modify) | Add `resolveSymbolGrounding()` (Serena, bounded) | F |
| `src/skills/runtime/*` skill-registry (modify) | Thread `serena` into `SkillExecutionRuntime` | F |
| `src/contracts/runtime.ts` (modify) | Add `serena?` to `SkillExecutionRuntime`; new artifact kind only if needed | B/F |
| `src/instructions/instruction-specs.ts` (modify) | Description-field audit (item 5) | G |
| `src/tests/skills/prompt/technique-catalog.test.ts` (new) | Catalog well-formedness + escalation integrity | A |
| `src/tests/skills/prompt/technique-selector.test.ts` (new) | Refutable trigger per technique | A |
| `src/tests/skills/shared/workspace-grounding.test.ts` (modify) | Serena grounding + graceful degradation | F |
| `src/tests/tools/tool-surface-manifest.test.ts` (new/modify) | Lock 1445 invariants | G |
| `docs/src/content/docs/skills/prompting.md` (modify) | Document catalog/selector/escalation + attribution | E |

**Category vocabulary (fixed, 5 values):** `reasoning | retrieval | agentic | self-improvement | baseline`.

**Technique data (all 12 — no TBD):**

| id | tier | category | keywords (for rank) | escalatesTo |
|---|---|---|---|---|
| `zero-shot` | catalog-only | baseline | direct, simple, single, quick, straightforward | few-shot |
| `few-shot` | catalog-only | baseline | example, examples, few-shot, demonstrate, sample | cot, reflexion |
| `cot` | catalog-only | reasoning | reason, step by step, think, explain, logic | pal, self-consistency, tree-of-thoughts |
| `self-consistency` | first-class | reasoning | consistent, vote, majority, sample, reliability | tree-of-thoughts |
| `tree-of-thoughts` | first-class | reasoning | explore, branch, alternative, backtrack, search, options | self-consistency |
| `pal` | first-class | reasoning | calculate, compute, math, code, program, arithmetic, numeric | self-consistency |
| `rag` | first-class | retrieval | retrieve, document, knowledge base, source, citation, ground | reflexion |
| `generate-knowledge` | catalog-only | retrieval | background, facts, recall, elaborate, knowledge | rag |
| `react` | first-class | agentic | tool, agent, action, observe, api, call, interact | rag, reflexion |
| `reflexion` | first-class | self-improvement | reflect, self-critique, improve, iterate, feedback, retry | meta-prompting |
| `meta-prompting` | first-class | self-improvement | meta, critique the prompt, regenerate, refine prompt | reflexion |
| `prompt-chaining` | catalog-only | baseline | chain, multi-step, pipeline, sequence, stage, decompose | react |

---

## Stage 0 — Baseline (already partially done: build is green)

### Task 0: Characterization baseline

**Files:**
- Create: `src/tests/skills/prompt/prompt-engineering-baseline.test.ts`

**Interfaces:**
- Consumes: `skillModule` from `src/skills/prompt/prompt-engineering.js`; `expectSkillGuidance` from `../test-helpers.js`.
- Produces: a snapshot the Stage A diff is measured against.

- [ ] **Step 1: Write a characterization test** capturing today's artifact-kind order (from the existing test): `["comparison-matrix","output-template","worked-example","tool-chain"]` for a request without success criteria, plus `"eval-criteria"` when `successCriteria` is set.

```typescript
import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/prompt/prompt-engineering.js";
import { createMockSkillRuntime } from "../test-helpers.js";

describe("prompt-engineering baseline (pre-selector)", () => {
	it("emits the current artifact-kind order for a plain request", async () => {
		const result = await skillModule.run(
			{ request: "Write a summarization prompt" },
			createMockSkillRuntime(),
		);
		expect(result.artifacts?.map((a) => a.kind)).toEqual([
			"comparison-matrix",
			"output-template",
			"worked-example",
			"tool-chain",
		]);
	});
});
```

- [ ] **Step 2: Run it — expect PASS.** `npx vitest run src/tests/skills/prompt/prompt-engineering-baseline.test.ts`
- [ ] **Step 3: Dogfood the local MCP** (build already green). Confirm `dist/index.js` exists: `ls dist/index.js`. This unblocks the `ai-agent-guidelines` server in `.mcp.json` for later manual verification.
- [ ] **Step 4: Commit.** `git add -A && git commit -m "test: characterization baseline for prompt-engineering artifacts"`

---

## Stage A — Technique catalog + deterministic selector (1605 Phase 1)

### Task 1: Technique catalog module + type

**Files:**
- Create: `src/skills/prompt/technique-catalog.ts`
- Test: `src/tests/skills/prompt/technique-catalog.test.ts`

**Interfaces:**
- Produces:
  - `type TechniqueCategory = "reasoning" | "retrieval" | "agentic" | "self-improvement" | "baseline";`
  - `type TechniqueTier = "first-class" | "catalog-only";`
  - `interface TechniqueEntry { id: string; name: string; category: TechniqueCategory; tier: TechniqueTier; keywords: readonly string[]; structureSignals: readonly string[]; useCase: string; escalatesTo: readonly string[]; exampleRef?: string; }`
  - `const TECHNIQUE_CATALOG: readonly TechniqueEntry[]`
  - `function getTechnique(id: string): TechniqueEntry | undefined`
  - `function techniquesByCategory(cat: TechniqueCategory): readonly TechniqueEntry[]`

- [ ] **Step 1: Write the failing test** `technique-catalog.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import {
	TECHNIQUE_CATALOG,
	getTechnique,
} from "../../../skills/prompt/technique-catalog.js";

describe("technique-catalog", () => {
	it("holds exactly the 12 non-deferred techniques", () => {
		expect(TECHNIQUE_CATALOG).toHaveLength(12);
		expect(new Set(TECHNIQUE_CATALOG.map((t) => t.id)).size).toBe(12);
	});

	it("gives every entry ≥1 keyword and 3–5 structure signals", () => {
		for (const t of TECHNIQUE_CATALOG) {
			expect(t.keywords.length).toBeGreaterThan(0);
			expect(t.structureSignals.length).toBeGreaterThanOrEqual(3);
			expect(t.structureSignals.length).toBeLessThanOrEqual(5);
		}
	});

	it("only escalates to real technique ids (no dangling edges)", () => {
		for (const t of TECHNIQUE_CATALOG) {
			for (const target of t.escalatesTo) {
				expect(getTechnique(target), `${t.id}→${target}`).toBeDefined();
			}
		}
	});

	it("marks exactly the 7 first-class techniques", () => {
		const firstClass = TECHNIQUE_CATALOG.filter(
			(t) => t.tier === "first-class",
		).map((t) => t.id);
		expect(firstClass.sort()).toEqual(
			[
				"meta-prompting",
				"pal",
				"rag",
				"react",
				"reflexion",
				"self-consistency",
				"tree-of-thoughts",
			].sort(),
		);
	});
});
```

- [ ] **Step 2: Run — expect FAIL** ("Cannot find module technique-catalog"). `npx vitest run src/tests/skills/prompt/technique-catalog.test.ts`
- [ ] **Step 3: Implement `technique-catalog.ts`.** Header credits universal-creator (MIT). Encode all 12 entries per the data table above. Pattern (showing 3 representative entries — fill the rest from the table with equally specific `useCase`/`structureSignals`):

```typescript
/**
 * Prompt-technique catalog — ported (MIT) from Anselmoo/universal-creator's
 * skills/shared/techniques.json. Data-only: the deterministic selector
 * (technique-selector.ts) ranks these; no sampler, no per-technique tools.
 */

export type TechniqueCategory =
	| "reasoning"
	| "retrieval"
	| "agentic"
	| "self-improvement"
	| "baseline";

export type TechniqueTier = "first-class" | "catalog-only";

export interface TechniqueEntry {
	id: string;
	name: string;
	category: TechniqueCategory;
	tier: TechniqueTier;
	/** Keywords for deterministic ranking (mirrors ROUTING_KEYWORDS pattern). */
	keywords: readonly string[];
	/** 3–5 structural requirements the technique imposes on the prompt. */
	structureSignals: readonly string[];
	useCase: string;
	/** technique→technique escalation edges (Stage D). */
	escalatesTo: readonly string[];
	/** Pointer to a worked card in technique-examples.ts (first-class only). */
	exampleRef?: string;
}

export const TECHNIQUE_CATALOG: readonly TechniqueEntry[] = [
	{
		id: "react",
		name: "ReAct (Reason + Act)",
		category: "agentic",
		tier: "first-class",
		keywords: ["tool", "agent", "action", "observe", "api", "call", "interact"],
		structureSignals: [
			"Interleave Thought → Action → Observation steps explicitly.",
			"Name the tool/action namespace the model may call.",
			"Require the model to stop and observe before the next action.",
			"Define a termination condition (answer found or budget exhausted).",
		],
		useCase:
			"Tasks needing external tool calls with observation between steps.",
		escalatesTo: ["rag", "reflexion"],
		exampleRef: "react",
	},
	{
		id: "cot",
		name: "Chain-of-Thought",
		category: "reasoning",
		tier: "catalog-only",
		keywords: ["reason", "step by step", "think", "explain", "logic"],
		structureSignals: [
			"Ask for explicit intermediate reasoning before the answer.",
			"Separate the reasoning trace from the final answer field.",
			"Keep each reasoning step to one inference.",
		],
		useCase: "Multi-step reasoning where showing the work improves accuracy.",
		escalatesTo: ["pal", "self-consistency", "tree-of-thoughts"],
	},
	{
		id: "rag",
		name: "Retrieval-Augmented Generation",
		category: "retrieval",
		tier: "first-class",
		keywords: [
			"retrieve",
			"document",
			"knowledge base",
			"source",
			"citation",
			"ground",
		],
		structureSignals: [
			"Specify retrieval order: system rules → task → retrieved evidence.",
			"Require answers to cite the retrieved source ids.",
			"Define behavior when retrieval returns nothing relevant.",
			"Bound context window usage for retrieved chunks.",
		],
		useCase: "Answers must be grounded in an external corpus with citations.",
		escalatesTo: ["reflexion"],
		exampleRef: "rag",
	},
	// … remaining 9 entries: self-consistency, tree-of-thoughts, pal,
	// generate-knowledge, reflexion, meta-prompting, zero-shot, few-shot,
	// prompt-chaining — each populated from the data table with a specific
	// useCase and 3–5 structureSignals.
];

const BY_ID = new Map(TECHNIQUE_CATALOG.map((t) => [t.id, t]));

export function getTechnique(id: string): TechniqueEntry | undefined {
	return BY_ID.get(id);
}

export function techniquesByCategory(
	cat: TechniqueCategory,
): readonly TechniqueEntry[] {
	return TECHNIQUE_CATALOG.filter((t) => t.category === cat);
}
```

- [ ] **Step 4: Run — expect PASS.** `npx vitest run src/tests/skills/prompt/technique-catalog.test.ts`
- [ ] **Step 5: Lint + commit.** `mcp-server-analyzer biome-check` on the two files, then `git add -A && git commit -m "feat(prompt): add ported technique catalog (12 entries, MIT)"`

### Task 2: Deterministic selector

**Files:**
- Create: `src/skills/prompt/technique-selector.ts`
- Test: `src/tests/skills/prompt/technique-selector.test.ts`

**Interfaces:**
- Consumes: `extractRequestSignals` (`../shared/recommendations.js`), `rankCandidateTools` (`../shared/directive-first.js`), `TECHNIQUE_CATALOG`/`getTechnique` (`./technique-catalog.js`), `InstructionInput`.
- Produces:
  - `interface TechniqueSelection { category: TechniqueCategory | "unclassified"; primary: string | null; supplementary: string[]; structureRequirements: string[]; rationale: string; confident: boolean; }`
  - `function selectTechniques(input: InstructionInput): TechniqueSelection`

**Design note:** `rankCandidateTools` reads its own module-level `ROUTING_KEYWORDS` map — it will NOT see technique keywords. So the selector implements its own small scorer over `TECHNIQUE_CATALOG[].keywords` (same stable-sort algorithm), and uses `extractRequestSignals` for the empty/low-signal gate. This keeps determinism and reuses the *pattern* without polluting the router's keyword map.

- [ ] **Step 1: Write the failing test** — a refutable trigger per technique (positive selects it; a contrasting input does not):

```typescript
import { describe, expect, it } from "vitest";
import { selectTechniques } from "../../../skills/prompt/technique-selector.js";

const sel = (request: string) => selectTechniques({ request });

describe("technique-selector (refutable triggers)", () => {
	it("selects react for tool-observation agent tasks, not for plain summaries", () => {
		expect(sel("an agent that calls an API tool then observes the result").primary).toBe("react");
		expect(sel("write a short summary of this paragraph").primary).not.toBe("react");
	});

	it("selects rag for retrieval/citation tasks, not for pure arithmetic", () => {
		expect(sel("answer from the knowledge base and cite the source document").primary).toBe("rag");
		expect(sel("compute the factorial of 12").primary).not.toBe("rag");
	});

	it("selects pal for compute/math tasks, not for tone rewriting", () => {
		expect(sel("calculate and compute the numeric result with code").primary).toBe("pal");
		expect(sel("make this email sound friendlier").primary).not.toBe("pal");
	});

	it("selects self-consistency when reliability via voting is asked", () => {
		expect(sel("sample multiple answers and take the majority vote for reliability").primary).toBe("self-consistency");
	});

	it("selects tree-of-thoughts for branch/backtrack exploration", () => {
		expect(sel("explore alternative branches and backtrack to search options").primary).toBe("tree-of-thoughts");
	});

	it("selects reflexion for self-critique/iterate loops", () => {
		expect(sel("reflect on the failure, self-critique, and iterate with feedback").primary).toBe("reflexion");
	});

	it("selects meta-prompting for regenerating the prompt itself", () => {
		expect(sel("critique the prompt and regenerate a refined prompt").primary).toBe("meta-prompting");
	});

	it("emits ≤2 supplementary techniques and a rationale string", () => {
		const r = sel("an agent that calls a tool then observes and cites a document");
		expect(r.supplementary.length).toBeLessThanOrEqual(2);
		expect(r.rationale.length).toBeGreaterThan(0);
	});

	it("is low-confidence + unclassified when no technique keyword matches", () => {
		const r = sel("hello");
		expect(r.confident).toBe(false);
		expect(r.primary).toBeNull();
	});

	it("is deterministic (same input → same output)", () => {
		const a = sel("an agent that calls a tool then observes");
		const b = sel("an agent that calls a tool then observes");
		expect(a).toEqual(b);
	});
});
```

- [ ] **Step 2: Run — expect FAIL.** `npx vitest run src/tests/skills/prompt/technique-selector.test.ts`
- [ ] **Step 3: Implement `technique-selector.ts`:**

```typescript
import type { InstructionInput } from "../../contracts/runtime.js";
import { extractRequestSignals } from "../shared/recommendations.js";
import {
	TECHNIQUE_CATALOG,
	type TechniqueCategory,
	type TechniqueEntry,
	getTechnique,
} from "./technique-catalog.js";

export interface TechniqueSelection {
	category: TechniqueCategory | "unclassified";
	primary: string | null;
	supplementary: string[];
	structureRequirements: string[];
	rationale: string;
	confident: boolean;
}

/** Stable keyword scorer over the catalog (mirrors rankCandidateTools). */
function scoreTechniques(
	request: string,
): { entry: TechniqueEntry; score: number }[] {
	const lower = request.toLowerCase();
	return TECHNIQUE_CATALOG.map((entry, index) => ({
		entry,
		index,
		score: entry.keywords.filter((kw) => lower.includes(kw)).length,
	}))
		.sort((a, b) => b.score - a.score || a.index - b.index)
		.map(({ entry, score }) => ({ entry, score }));
}

export function selectTechniques(input: InstructionInput): TechniqueSelection {
	const signals = extractRequestSignals(input);
	const combined = `${input.request ?? ""} ${input.context ?? ""}`;
	const ranked = scoreTechniques(combined);
	const top = ranked[0];

	if (!top || top.score === 0 || signals.keywords.length === 0) {
		return {
			category: "unclassified",
			primary: null,
			supplementary: [],
			structureRequirements: [],
			rationale:
				"No technique keyword matched the request; defaulting to unclassified. Provide the task's reasoning/retrieval/tool-use shape to select a technique.",
			confident: false,
		};
	}

	const primary = top.entry;
	const supplementary = ranked
		.slice(1)
		.filter((r) => r.score > 0 && r.entry.category === primary.category)
		.slice(0, 2)
		.map((r) => r.entry.id);

	const escalation = primary.escalatesTo
		.map((id) => getTechnique(id)?.name)
		.filter((n): n is string => Boolean(n));

	const rationale = [
		`Classified as ${primary.category}: strongest keyword match is ${primary.name} (${top.score} signal${top.score === 1 ? "" : "s"}).`,
		supplementary.length
			? `Supplementary: ${supplementary.join(", ")}.`
			: "",
		escalation.length
			? `Consider escalating to ${escalation.join(" or ")} if the primary technique underperforms.`
			: "",
	]
		.filter(Boolean)
		.join(" ");

	return {
		category: primary.category,
		primary: primary.id,
		supplementary,
		structureRequirements: [...primary.structureSignals],
		rationale,
		confident: true,
	};
}
```

- [ ] **Step 4: Run — expect PASS.** `npx vitest run src/tests/skills/prompt/technique-selector.test.ts`
- [ ] **Step 5: Commit.** `git add -A && git commit -m "feat(prompt): deterministic technique selector (refutable triggers)"`

### Task 3: Wire selector into prompt-engineering STRUCTURE step

**Files:**
- Modify: `src/skills/prompt/prompt-engineering.ts`
- Modify: `src/tests/skills/prompt/prompt-engineering.test.ts`

**Interfaces:**
- Consumes: `selectTechniques` from `./technique-selector.js`.
- Produces: an added recommendation detail naming the selected technique + a new `comparison-matrix` artifact `"Technique selection"`.

- [ ] **Step 1: Extend the existing test** — assert the selected technique surfaces. Add to the guidance test (request already mentions few-shot/system): expect a detail fragment naming a technique and the rationale.

```typescript
	it("names a selected technique for a tool-use request", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{ request: "prompt for an agent that calls a tool then observes the result" },
			{ detailIncludes: ["Selected technique"] },
		);
		expect(
			result.artifacts?.some((a) => a.kind === "comparison-matrix" && a.title === "Technique selection"),
		).toBe(true);
	});
```

- [ ] **Step 2: Run — expect FAIL.** `npx vitest run src/tests/skills/prompt/prompt-engineering.test.ts`
- [ ] **Step 3: Implement the wire-in.** Import the selector; after the existing `details` are built (around line 145, before the `artifacts` array), insert:

```typescript
	const selection = selectTechniques(parsed.data);
	if (selection.confident && selection.primary) {
		details.push(
			`Selected technique: ${selection.primary} (${selection.category}). ${selection.rationale} Structural requirements: ${selection.structureRequirements.join(" ")}`,
		);
	}
```

Then append a matrix artifact to the `artifacts` array (keep it AFTER the existing four so the baseline order is preserved as a prefix):

```typescript
	if (selection.confident && selection.primary) {
		artifacts.push(
			buildComparisonMatrixArtifact(
				"Technique selection",
				["Role", "Technique", "Why"],
				[
					{ label: "primary", values: [selection.primary, selection.category] },
					...selection.supplementary.map((id) => ({
						label: "supplementary",
						values: [id, "same-category support"],
					})),
				],
				selection.rationale,
			),
		);
	}
```

- [ ] **Step 4: Update the baseline/existing artifact-order test.** The existing assertion `toEqual([...])` now has a trailing `"comparison-matrix"` for confident selections. The `system prompt` request in that test WILL classify (mentions "few-shot"/"safety"), so update its expected array to append `"comparison-matrix"`. Re-verify Stage 0's plain-request test still holds (a plain "Write a summarization prompt" scores 0 → no extra artifact).
- [ ] **Step 5: Run — expect PASS.** `npx vitest run src/tests/skills/prompt/`
- [ ] **Step 6: Dogfood via local MCP.** Rebuild (`npm run build`), then call the local `ai-agent-guidelines` `prompt-engineering` tool with a ReAct request; confirm the output names `react`. Compare to the Stage 0 snapshot.
- [ ] **Step 7: Commit.** `git commit -am "feat(prompt): surface selected technique in prompt-engineering"`

---

## Stage B — First-class worked cards (1605 Phase 2)

### Task 4: Worked-example cards for the 7 first-class techniques

**Files:**
- Create: `src/skills/prompt/technique-examples.ts`
- Modify: `src/skills/prompt/technique-selector.ts` (expose `exampleRef` through selection — add `exampleRef: primary.exampleRef ?? null` to the return)
- Modify: `src/skills/prompt/prompt-engineering.ts` (emit a `worked-example` artifact when the selected technique has a card)
- Test: `src/tests/skills/prompt/technique-examples.test.ts`

**Interfaces:**
- Produces:
  - `interface TechniqueCard { id: string; input: unknown; expectedOutput: unknown; description: string; }`
  - `const TECHNIQUE_CARDS: Record<string, TechniqueCard>` keyed by technique id (7 keys)
  - `function getTechniqueCard(id: string): TechniqueCard | undefined`

**Artifact-kind decision:** default to `buildWorkedExampleArtifact` (its `input`/`expectedOutput` are `unknown`, expressive enough for reasoning traces). Only if a reviewer finds a technique's contract genuinely inexpressible do we add a new `SkillArtifact` kind — deferred unless proven necessary during this task.

- [ ] **Step 1: Write the failing test:**

```typescript
import { describe, expect, it } from "vitest";
import { TECHNIQUE_CARDS, getTechniqueCard } from "../../../skills/prompt/technique-examples.js";
import { TECHNIQUE_CATALOG } from "../../../skills/prompt/technique-catalog.js";

describe("technique-examples", () => {
	it("has a card for every first-class technique", () => {
		const firstClass = TECHNIQUE_CATALOG.filter((t) => t.tier === "first-class").map((t) => t.id);
		for (const id of firstClass) expect(getTechniqueCard(id), id).toBeDefined();
		expect(Object.keys(TECHNIQUE_CARDS)).toHaveLength(firstClass.length);
	});

	it("every card carries input, expectedOutput, and description", () => {
		for (const card of Object.values(TECHNIQUE_CARDS)) {
			expect(card.input).toBeDefined();
			expect(card.expectedOutput).toBeDefined();
			expect(card.description.length).toBeGreaterThan(0);
		}
	});
});
```

- [ ] **Step 2: Run — expect FAIL.**
- [ ] **Step 3: Implement `technique-examples.ts`** with 7 typed cards (react, rag, reflexion, tree-of-thoughts, pal, self-consistency, meta-prompting), each a concise worked input→output. Header credits universal-creator's `skills/shared/examples/*.prompt.md`.
- [ ] **Step 4: Run — expect PASS.**
- [ ] **Step 5: Emit the card** in `prompt-engineering.ts` — when `selection.exampleRef` resolves, push `buildWorkedExampleArtifact(card.id + " worked example", card.input, card.expectedOutput, card.description)`. Add a test asserting a first-class selection emits an extra `worked-example` artifact.
- [ ] **Step 6: Run prompt tests — expect PASS.** `npx vitest run src/tests/skills/prompt/`
- [ ] **Step 7: Commit.** `git commit -am "feat(prompt): worked-example cards for 7 first-class techniques"`

---

## Stage C — Catalog-only labels (1605 Phase 3)

Already delivered by Task 1 (the 5 catalog-only entries ship in the same file). No new task — this stage is satisfied when Task 1's test asserts all 12 ids and the 5 catalog-only tiers are present.

- [ ] **Step 1: Add an assertion to `technique-catalog.test.ts`** that the 5 catalog-only ids are exactly `["cot","few-shot","generate-knowledge","prompt-chaining","zero-shot"]`. Run — expect PASS. Commit `test(prompt): assert catalog-only decision space complete`.

---

## Stage D — Escalation graph (1605 Phase 4)

Escalation edges live in `escalatesTo` (Task 1) and surface in the selector rationale (Task 2). This stage adds explicit coverage + a docs boundary note.

### Task 5: Escalation integrity + rationale surfacing

**Files:**
- Modify: `src/tests/skills/prompt/technique-selector.test.ts`

- [ ] **Step 1: Add tests** that the selector rationale mentions "escalating" for a technique with `escalatesTo`, and that no escalation edge forms a self-loop (`t.id ∉ t.escalatesTo`). Run — expect FAIL if self-loop present, else adjust.
- [ ] **Step 2: Implement** any fix needed in the catalog data. Run — expect PASS.
- [ ] **Step 3: Commit.** `test(prompt): escalation edges surface in rationale, no self-loops`

**Boundary note (for Stage E docs):** techniques are not public tools, so edges are NOT added to `src/generated/graph/**`; they live in catalog data + selector output only.

---

## Stage E — Docs, codegen, gates (1605 Phase 5)

### Task 6: Prompting docs + codegen + full gate

**Files:**
- Modify: `docs/src/content/docs/skills/prompting.md`

- [ ] **Step 1: Document** the catalog (12 techniques, 3 tiers), the deterministic selector (category + primary/supplementary + rationale, no sampler), the escalation model, the deferred-6 with their infra prerequisite, and MIT attribution to `Anselmoo/universal-creator`. (Hand-written file; no codegen needed for it.)
- [ ] **Step 2: Regenerate** (only if any spec metadata changed): `npm run build && python3 scripts/generate-tool-definitions.py && npm run generate:skill-docs`.
- [ ] **Step 3: Drift check.** `npm run check:generated` — expect no diff. If diff appears, it means a source spec changed and the regen must be committed (never hand-edit generated files).
- [ ] **Step 4: Matrix + quality.** `python3 scripts/verify_matrix.py` and `npm run quality` — expect green.
- [ ] **Step 5: Full test.** `npm test` — expect green.
- [ ] **Step 6: Commit.** `git commit -am "docs(prompt): document technique catalog + selector (1605 Phase 5)"`

---

## Stage F — Serena symbol grounding (1601)

### Task 7: Thread `serena` into SkillExecutionRuntime

**Files:**
- Modify: `src/contracts/runtime.ts` (add `serena?: SerenaClient` to `SkillExecutionRuntime`)
- Modify: skill-registry (`SkillRegistry.execute()` builds `skillRuntime` — add `serena` passthrough from `WorkflowExecutionRuntime`)
- Modify: `src/tests/skills/test-helpers.ts` (`createMockSkillRuntime` accepts optional `serena`)

**Interfaces:**
- Consumes: `SerenaClient` from `src/serena/client.js` (`query({ kind: "find_symbol" | "find_references" | "overview" })`).
- Produces: `context.runtime.serena?: SerenaClient` available to any skill handler.

- [ ] **Step 1: Write a failing test** in a new `src/tests/skills/shared/serena-grounding.test.ts` that a skill runtime can carry a mock `serena` and a handler reads it. (Red: property doesn't exist on the type.)
- [ ] **Step 2: Run — expect FAIL (type error / undefined).**
- [ ] **Step 3: Add `serena?: SerenaClient`** to `SkillExecutionRuntime` in `src/contracts/runtime.ts`; thread it through the registry's `skillRuntime` builder (mirror how `WorkflowExecutionRuntime.serena` already exists); extend `createMockSkillRuntime` to pass it through like `workspace`.
- [ ] **Step 4: Run — expect PASS.** Use `serena` MCP `find_symbol`/`find_referencing_symbols` to locate the exact registry build site and referencing tests before editing.
- [ ] **Step 5: Commit.** `feat(grounding): thread SerenaClient into SkillExecutionRuntime`

### Task 8: `resolveSymbolGrounding()` — bounded, never-throws

**Files:**
- Modify: `src/skills/shared/workspace-grounding.ts`
- Modify: `src/tests/skills/shared/workspace-grounding.test.ts`

**Interfaces:**
- Produces: `async function resolveSymbolGrounding(context: SkillExecutionContext, opts?: { maxSymbols?: number }): Promise<RecommendationItem[]>` — queries `context.runtime.serena` for symbols/refs the request did NOT name; returns `[]` when serena absent or on any error; caps at `maxSymbols` (default 3); each item `groundingScope: "workspace"`, `evidenceAnchors: [symbolRef...]`.

- [ ] **Step 1: Write failing tests** — (a) with a mock serena returning a symbol, `resolveSymbolGrounding` returns a `RecommendationItem` citing it in `evidenceAnchors`; (b) with `serena` undefined, returns `[]`; (c) when the mock throws, returns `[]` (never propagates).
- [ ] **Step 2: Run — expect FAIL.**
- [ ] **Step 3: Implement** following the existing `readReferencedFiles` bounded/swallow pattern (cap, try/catch → `[]`).
- [ ] **Step 4: Run — expect PASS.**
- [ ] **Step 5: Wire into 1 skill** (e.g. `debug-root-cause`) opt-in: append `resolveSymbolGrounding` results to its recommendations. Add a test that the skill degrades gracefully with no serena.
- [ ] **Step 6: Run + commit.** `feat(grounding): additive Serena symbol grounding (1601 strong version)`

---

## Stage G — Auto-mode verify + audit + harden (1445)

### Task 9: Lock the shipped 1445 invariants

**Files:**
- Create/Modify: `src/tests/tools/tool-surface-manifest.test.ts`
- Reference: `src/tools/shared/tool-surface-manifest.ts`, `src/instructions/instruction-specs.ts`, `src/cli.ts`

- [ ] **Step 1: Check for existing assertions** (`grep` for `session-start`, `DISABLE_ADAPTIVE_ROUTING`, `SLIM_SURFACE_TOOLS` in tests). Only add what's missing.
- [ ] **Step 2: Write regression tests** (red if any invariant regressed):
  - `meta-routing` spec has `reactivationPolicy === "session-start"`.
  - `computeEffectiveHiddenTools()` hides `routing-adapt` iff `DISABLE_ADAPTIVE_ROUTING==="true"` (visible by default).
  - `filterToSlimSurface([...], {})` returns only `task-bootstrap` + `meta-routing`; with `MCP_FULL_SURFACE:"true"` returns all.
  - CLI `buildHookJson("vscode")` includes both `SessionStart` and `PreToolUse`.
- [ ] **Step 3: Run — expect PASS** (these are already implemented; tests should go green immediately, proving the invariants hold).
- [ ] **Step 4: Commit.** `test(auto-mode): lock 1445 session-start/opt-out/slim/hooks invariants`

### Task 10: Description-field audit (item 5)

**Files:**
- Modify: `src/instructions/instruction-specs.ts`

- [ ] **Step 1: Audit** each `description` toward the `system-design` pattern: explicit trigger phrases + a named anti-pattern ("do NOT use for …") + a one-line companion hint. Edit source only.
- [ ] **Step 2: Regenerate.** `npm run build && python3 scripts/generate-tool-definitions.py && npm run generate:skill-docs`.
- [ ] **Step 3: Drift + matrix.** `npm run check:generated` (commit regenerated files) and `python3 scripts/verify_matrix.py`.
- [ ] **Step 4: Harden via dogfood.** Rebuild; call local `ai-agent-guidelines` `meta-routing` with 3 representative symptoms ("this is broken", "design the architecture", "write tests") and confirm the tightened descriptions route as intended.
- [ ] **Step 5: Commit.** `feat(auto-mode): tighten instruction descriptions to trigger-phrase pattern (1445 item 5)`

---

## Final integration

### Task 11: Full-suite green + PR

- [ ] **Step 1:** `npm run build && npm test` — all green.
- [ ] **Step 2:** `npm run quality && npm run check:generated` — green, no drift.
- [ ] **Step 3:** `/claude-automation-recommender` — adopt any fitting hooks (codegen-drift guard, biome-on-edit) for this PR size.
- [ ] **Step 4:** Open PR via `github` MCP; body cross-links #1605, #1601, #1445; notes 1445 was found substantially complete (verify + audit + harden); lists deferred 1605 Phases 6–7 as follow-ups.

---

## Self-Review notes

- **Spec coverage:** 1605 Phases 1–5 → Tasks 1–6; deferred Phases 6–7 noted in Task 11. 1601 → Tasks 7–8. 1445 verify/audit/harden → Tasks 9–10.
- **Type consistency:** `TechniqueEntry`/`TechniqueSelection`/`TechniqueCard` field names are used identically across Tasks 1–4 and the tests. `resolveSymbolGrounding` signature matches its test and its wire-in.
- **Determinism:** selector uses stable sort + keyword scoring, no time/random — asserted by the "same input → same output" test.
- **Artifact order:** baseline prefix preserved; technique artifacts appended only for confident selections (Stage 0 plain-request test guards this).
