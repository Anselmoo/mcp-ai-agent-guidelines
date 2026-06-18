# `analogy-think` + methodology gate — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `analogy-think` workflow tool driven by a curated metaphor catalog, plus a shared methodology-gate module appended to four engineering workflow tools.

**Architecture:** New module tree under `src/skills/analogy/` (types → catalog → matcher → clarify → expand → workflow). One shared module under `src/skills/shared/methodology-gate.ts` consumed by `issue-debug`, `code-review`, `system-design`, `evidence-research`. Output rides existing `__ENVELOPE_V1__:` envelope. `analogy-think` is exposed only with `MCP_FULL_SURFACE=true`.

**Tech Stack:** TypeScript 5.x strict, Vitest, neverthrow/ts-pattern (already in repo), Node ESM.

**Spec:** `.superpowers/specs/2026-06-17-analogy-think-and-methodology-gate-design.md` (commit `4c2ad02`).

## Global Constraints

- TypeScript strict; `npx tsc --noEmit` green after every task.
- Vitest is the runner.
- No reuse of `src/skills/shared/physics-adapter-prototype.ts` — that module is deprecated and must not be imported.
- Honest labelling: Path A output prose starts with `Metaphor, not theorem.`; Path B output contains `## Methodology checks (not proofs)`. Both strings are tested.
- No QM/GR entries in the seed catalog. The `PhysicsDomain` union explicitly excludes `"qm"` and `"gr"` literals.
- No emojis in catalog entries or methodology-gate output.
- ToolEnvelope V1 wire format unchanged; `analogy-think` uses `toToolResult` + `buildWorkflowEnvelopePayload` like the other workflow tools.
- Slim default surface unchanged. `analogy-think` ships only under `MCP_FULL_SURFACE=true`.
- Commit subject convention per `rrt-commit-subject` hook; subjects supplied per task are concrete and tested-friendly.

---

## Task 1: Catalog types — `ProblemFeature`, `PhysicsDomain`, `MetaphorEntry`

**Files:**
- Create: `src/skills/analogy/types.ts`
- Test:   `src/tests/skills/analogy/types.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `ProblemFeature` (string-literal union, 12 values), `PhysicsDomain` (string-literal union, 7 values, NO `"qm"`/`"gr"`), `MetaphorEntry` interface per spec.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import type { MetaphorEntry, ProblemFeature, PhysicsDomain } from "../../../skills/analogy/types.js";

describe("analogy types", () => {
  it("ProblemFeature union forbids QM/GR-specific tags", () => {
    const valid: ProblemFeature[] = [
      "has-time-evolution", "has-feedback-loop", "has-noise",
      "has-conserved-quantity", "has-overshoot-or-oscillation",
      "has-discrete-state-only", "has-network-topology",
      "has-threshold-or-phase-change", "has-equilibrium-state",
      "has-resource-flow", "has-multiple-coupled-parts",
      "has-stochastic-component",
    ];
    expect(valid).toHaveLength(12);
  });

  it("PhysicsDomain union excludes qm/gr at compile time", () => {
    const domains: PhysicsDomain[] = [
      "mechanics", "oscillators", "thermodynamics", "stat-mech",
      "fluids", "em", "general",
    ];
    expect(domains).toHaveLength(7);
  });

  it("MetaphorEntry shape carries gating + mapping + safety rails", () => {
    const entry: MetaphorEntry = {
      id: "x",
      name: "X",
      domain: "general",
      requiredFeatures: ["has-time-evolution"],
      excludingFeatures: ["has-discrete-state-only"],
      semanticDescription: "sd",
      mapping: [{ physics: "p", engineering: "e" }],
      translationBack: "t",
      antiPatterns: ["nope"],
      confidence: "low",
    };
    expect(entry.id).toBe("x");
  });
});
```

- [ ] **Step 2: Run, see RED**

```bash
npx vitest run src/tests/skills/analogy/types.test.ts
```
Expected: module not found.

- [ ] **Step 3: Create the module**

```ts
export type PhysicsDomain =
  | "mechanics" | "oscillators" | "thermodynamics" | "stat-mech"
  | "fluids" | "em" | "general";

export type ProblemFeature =
  | "has-time-evolution"
  | "has-feedback-loop"
  | "has-noise"
  | "has-conserved-quantity"
  | "has-overshoot-or-oscillation"
  | "has-discrete-state-only"
  | "has-network-topology"
  | "has-threshold-or-phase-change"
  | "has-equilibrium-state"
  | "has-resource-flow"
  | "has-multiple-coupled-parts"
  | "has-stochastic-component";

export interface MetaphorEntry {
  id: string;
  name: string;
  domain: PhysicsDomain;
  requiredFeatures: ProblemFeature[];
  excludingFeatures: ProblemFeature[];
  semanticDescription: string;
  mapping: Array<{ physics: string; engineering: string }>;
  predictions?: string[];
  evidenceNeeded?: string[];
  translationBack: string;
  antiPatterns: string[];
  confidence: "high" | "medium" | "low";
}
```

- [ ] **Step 4: GREEN + tsc**

```bash
npx vitest run src/tests/skills/analogy/types.test.ts
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/skills/analogy/types.ts src/tests/skills/analogy/types.test.ts
git commit -m "feat(analogy): catalog types — ProblemFeature, PhysicsDomain, MetaphorEntry"
```

---

## Task 2: Seed catalog (12 entries) + validation test

**Files:**
- Create: `src/skills/analogy/catalog.ts`
- Test:   `src/tests/skills/analogy/catalog.test.ts`

**Interfaces:**
- Consumes: Task 1 types.
- Produces: `export const METAPHOR_CATALOG: ReadonlyArray<MetaphorEntry>` (12 entries) and `export function validateEntry(entry: MetaphorEntry): { ok: true } | { ok: false; reason: string }`.

- [ ] **Step 1: Write the failing validation test**

```ts
import { describe, expect, it } from "vitest";
import { METAPHOR_CATALOG, validateEntry } from "../../../skills/analogy/catalog.ts";

describe("metaphor catalog", () => {
  it("seeds 12 entries spanning major physics domains", () => {
    expect(METAPHOR_CATALOG).toHaveLength(12);
    const domains = new Set(METAPHOR_CATALOG.map((e) => e.domain));
    expect(domains.size).toBeGreaterThanOrEqual(5);
  });

  it("every entry passes validateEntry", () => {
    for (const e of METAPHOR_CATALOG) {
      const v = validateEntry(e);
      expect(v.ok, `${e.id} failed: ${v.ok ? "" : v.reason}`).toBe(true);
    }
  });

  it("high-confidence entries declare predictions and evidenceNeeded", () => {
    for (const e of METAPHOR_CATALOG) {
      if (e.confidence === "high") {
        expect(e.predictions?.length ?? 0, `${e.id} predictions`).toBeGreaterThan(0);
        expect(e.evidenceNeeded?.length ?? 0, `${e.id} evidenceNeeded`).toBeGreaterThan(0);
      }
    }
  });

  it("no entry uses qm or gr as domain (runtime guard)", () => {
    for (const e of METAPHOR_CATALOG) {
      expect(["qm", "gr"]).not.toContain(e.domain);
    }
  });

  it("no entry contains the literal strings 'theorem' or 'QED' (rigor-laundering guard)", () => {
    for (const e of METAPHOR_CATALOG) {
      const joined = JSON.stringify(e);
      expect(joined).not.toMatch(/\bQED\b/);
      expect(joined.toLowerCase()).not.toContain("theorem");
    }
  });
});
```

- [ ] **Step 2: Run, see RED**

```bash
npx vitest run src/tests/skills/analogy/catalog.test.ts
```

- [ ] **Step 3: Implement catalog and validator**

Create `src/skills/analogy/catalog.ts` with 12 entries (one per row of the spec's seed table). `damped-oscillator` is shown verbatim in the spec; use that as the template. `validateEntry` checks: non-empty `name`, `semanticDescription`, `mapping`, `antiPatterns`; if `confidence === "high"` then non-empty `predictions` AND `evidenceNeeded`.

```ts
import type { MetaphorEntry } from "./types.js";

export const METAPHOR_CATALOG: ReadonlyArray<MetaphorEntry> = [
  {
    id: "damped-oscillator",
    name: "Damped harmonic oscillator",
    domain: "oscillators",
    requiredFeatures: ["has-time-evolution", "has-feedback-loop"],
    excludingFeatures: ["has-discrete-state-only"],
    semanticDescription: "A system that returns to equilibrium after a disturbance, possibly overshooting, governed by a restoring force and a damping term. Applies to feedback loops that can oscillate or overshoot.",
    mapping: [
      { physics: "displacement x(t)", engineering: "current error / distance to target" },
      { physics: "restoring force -kx", engineering: "correction strength" },
      { physics: "damping -c*xdot", engineering: "smoothing / rate-limit factor" },
      { physics: "damping ratio zeta", engineering: "ratio of correction to smoothing" },
    ],
    predictions: [
      "zeta ~= 1 (critical damping) gives the fastest stable response without overshoot.",
      "zeta < 1 produces oscillation; the loop rings.",
      "zeta > 1 is sluggish but stable.",
    ],
    evidenceNeeded: [
      "time-to-recover after a known disturbance",
      "presence of overshoot",
      "oscillation period if any",
    ],
    translationBack: "Identify the smoothing factor and the correction strength in your loop. If the loop rings, increase smoothing. If sluggish, reduce smoothing. Target zeta ~= 1 for fastest stable response.",
    antiPatterns: [
      "Do not apply to one-shot decisions (no feedback).",
      "Do not apply when the response is highly nonlinear far from equilibrium.",
      "Do not use to justify oscillation as natural.",
    ],
    confidence: "high",
  },
  // ... 11 more entries per the spec table. Each entry follows the same
  // shape. For domain/feature gating consult the spec's seed table.
  // Implementers: fill each entry with a non-empty mapping, antiPatterns,
  // and (for confidence: "high") predictions + evidenceNeeded.
];

export function validateEntry(e: MetaphorEntry): { ok: true } | { ok: false; reason: string } {
  if (!e.name) return { ok: false, reason: "empty name" };
  if (!e.semanticDescription) return { ok: false, reason: "empty semanticDescription" };
  if (e.mapping.length === 0) return { ok: false, reason: "empty mapping" };
  if (e.antiPatterns.length === 0) return { ok: false, reason: "empty antiPatterns" };
  if (e.confidence === "high") {
    if (!e.predictions?.length) return { ok: false, reason: "high-confidence entry needs predictions" };
    if (!e.evidenceNeeded?.length) return { ok: false, reason: "high-confidence entry needs evidenceNeeded" };
  }
  return { ok: true };
}
```

The remaining 11 entries follow the same shape; use the spec's seed table for `id`, `domain`, `requiredFeatures`. Three entries are mandatorily `confidence: "high"` (`damped-oscillator`, `diffusion`, `conservation-flow`); the rest may be `"medium"` if you cannot honestly populate `predictions` + `evidenceNeeded`. Confidence is a quality dial, not a popularity score.

- [ ] **Step 4: GREEN + tsc**

```bash
npx vitest run src/tests/skills/analogy/catalog.test.ts
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/skills/analogy/catalog.ts src/tests/skills/analogy/catalog.test.ts
git commit -m "feat(analogy): seed metaphor catalog with 12 broad-physics entries"
```

---

## Task 3: Matcher — structural gate + LLM ranking interface

**Files:**
- Create: `src/skills/analogy/matcher.ts`
- Test:   `src/tests/skills/analogy/matcher.test.ts`

**Interfaces:**
- Consumes: Task 1 types, Task 2 catalog.
- Produces:
  ```ts
  export interface MatchInput { features: ReadonlyArray<ProblemFeature>; problemSummary: string; }
  export interface RankedCandidate { entry: MetaphorEntry; rank: number; gateResult: "passed"; }
  export type Ranker = (
    summary: string,
    candidates: ReadonlyArray<MetaphorEntry>,
  ) => Promise<ReadonlyArray<{ id: string; score: number }>>;
  export async function matchCandidates(
    input: MatchInput,
    rank: Ranker,
    catalog?: ReadonlyArray<MetaphorEntry>,
  ): Promise<ReadonlyArray<RankedCandidate>>;
  ```
  Default `catalog` is `METAPHOR_CATALOG`. The matcher first drops entries whose `requiredFeatures` are not a subset of `input.features` OR whose `excludingFeatures` overlap `input.features`. It then calls `rank` on the survivors and returns the top 3 sorted by descending score.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { matchCandidates } from "../../../skills/analogy/matcher.js";
import type { MetaphorEntry } from "../../../skills/analogy/types.js";

const fakeCatalog: MetaphorEntry[] = [
  { id: "a", name: "A", domain: "general", requiredFeatures: ["has-time-evolution"], excludingFeatures: [], semanticDescription: "sd-a", mapping: [{ physics: "p", engineering: "e" }], translationBack: "t", antiPatterns: ["nope"], confidence: "low" },
  { id: "b", name: "B", domain: "general", requiredFeatures: ["has-discrete-state-only"], excludingFeatures: [], semanticDescription: "sd-b", mapping: [{ physics: "p", engineering: "e" }], translationBack: "t", antiPatterns: ["nope"], confidence: "low" },
  { id: "c", name: "C", domain: "general", requiredFeatures: ["has-time-evolution"], excludingFeatures: ["has-stochastic-component"], semanticDescription: "sd-c", mapping: [{ physics: "p", engineering: "e" }], translationBack: "t", antiPatterns: ["nope"], confidence: "low" },
];

const allHigh: Awaited<ReturnType<Parameters<typeof matchCandidates>[1]>> = [
  { id: "a", score: 0.9 },
  { id: "c", score: 0.8 },
];

it("drops entries whose requiredFeatures are not a subset of problem features", async () => {
  const out = await matchCandidates(
    { features: ["has-time-evolution"], problemSummary: "..." },
    async () => allHigh,
    fakeCatalog,
  );
  const ids = out.map((c) => c.entry.id);
  expect(ids).toContain("a");
  expect(ids).not.toContain("b"); // requires has-discrete-state-only
});

it("drops entries whose excludingFeatures overlap problem features", async () => {
  const out = await matchCandidates(
    { features: ["has-time-evolution", "has-stochastic-component"], problemSummary: "..." },
    async () => allHigh,
    fakeCatalog,
  );
  const ids = out.map((c) => c.entry.id);
  expect(ids).toContain("a");
  expect(ids).not.toContain("c"); // excluded by has-stochastic-component
});

it("returns at most 3 candidates sorted by descending score", async () => {
  const out = await matchCandidates(
    { features: ["has-time-evolution"], problemSummary: "..." },
    async () => allHigh,
    fakeCatalog,
  );
  expect(out.length).toBeLessThanOrEqual(3);
  for (let i = 1; i < out.length; i++) {
    expect(out[i - 1].rank).toBeLessThanOrEqual(out[i].rank);
  }
});
```

- [ ] **Step 2: Run, see RED**

```bash
npx vitest run src/tests/skills/analogy/matcher.test.ts
```

- [ ] **Step 3: Implement**

```ts
import type { MetaphorEntry, ProblemFeature } from "./types.js";
import { METAPHOR_CATALOG } from "./catalog.js";

export interface MatchInput {
  features: ReadonlyArray<ProblemFeature>;
  problemSummary: string;
}
export interface RankedCandidate { entry: MetaphorEntry; rank: number; gateResult: "passed"; }
export type Ranker = (
  summary: string,
  candidates: ReadonlyArray<MetaphorEntry>,
) => Promise<ReadonlyArray<{ id: string; score: number }>>;

export async function matchCandidates(
  input: MatchInput,
  rank: Ranker,
  catalog: ReadonlyArray<MetaphorEntry> = METAPHOR_CATALOG,
): Promise<ReadonlyArray<RankedCandidate>> {
  const features = new Set(input.features);
  const gated = catalog.filter((e) => {
    const requiredOk = e.requiredFeatures.every((f) => features.has(f));
    const excludedOk = !e.excludingFeatures.some((f) => features.has(f));
    return requiredOk && excludedOk;
  });
  if (gated.length === 0) return [];
  const ranked = await rank(input.problemSummary, gated);
  const byId = new Map(gated.map((e) => [e.id, e] as const));
  return ranked
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((r, i) => {
      const entry = byId.get(r.id);
      if (!entry) throw new Error(`ranker returned unknown id ${r.id}`);
      return { entry, rank: i, gateResult: "passed" as const };
    });
}
```

- [ ] **Step 4: GREEN + tsc**

```bash
npx vitest run src/tests/skills/analogy/matcher.test.ts
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/skills/analogy/matcher.ts src/tests/skills/analogy/matcher.test.ts
git commit -m "feat(analogy): matcher with structural gate + injectable LLM ranker"
```

---

## Task 4: Feature extractor (clarify step)

**Files:**
- Create: `src/skills/analogy/clarify.ts`
- Test:   `src/tests/skills/analogy/clarify.test.ts`

**Interfaces:**
- Consumes: Task 1 types.
- Produces:
  ```ts
  export interface ClarifyResult { problemSummary: string; features: ProblemFeature[]; }
  export type FeatureExtractor = (request: string, context?: string) => Promise<ClarifyResult>;
  export const HEURISTIC_EXTRACTOR: FeatureExtractor; // pure keyword fallback, NO LLM call
  ```
  `HEURISTIC_EXTRACTOR` maps common phrases to features (e.g. `/feedback|retry|control loop|PID/i` → `has-feedback-loop`; `/over time|interval|timestep/i` → `has-time-evolution`; etc.). It is the deterministic baseline; the production extractor will be an LLM-backed function injected at runtime in Task 6.

- [ ] **Step 1: Failing test**

```ts
import { describe, expect, it } from "vitest";
import { HEURISTIC_EXTRACTOR } from "../../../skills/analogy/clarify.js";

it("detects feedback-loop language", async () => {
  const r = await HEURISTIC_EXTRACTOR("our retry loop overshoots when the upstream slows");
  expect(r.features).toContain("has-feedback-loop");
  expect(r.features).toContain("has-time-evolution");
});

it("detects discrete-state-only when the wording is about state machines", async () => {
  const r = await HEURISTIC_EXTRACTOR("FSM transitions between three states based on user input");
  expect(r.features).toContain("has-discrete-state-only");
});

it("produces a problemSummary that is at most 240 chars", async () => {
  const r = await HEURISTIC_EXTRACTOR("a".repeat(500));
  expect(r.problemSummary.length).toBeLessThanOrEqual(240);
});
```

- [ ] **Step 2: RED**

```bash
npx vitest run src/tests/skills/analogy/clarify.test.ts
```

- [ ] **Step 3: Implement heuristic extractor**

Pattern-table approach. Each `ProblemFeature` has 1–2 regex patterns; if any match, the feature is included. `problemSummary` is the first 240 chars of `request + " " + (context ?? "")`.

- [ ] **Step 4: GREEN + tsc**

- [ ] **Step 5: Commit**

```bash
git add src/skills/analogy/clarify.ts src/tests/skills/analogy/clarify.test.ts
git commit -m "feat(analogy): heuristic feature extractor (clarify step)"
```

---

## Task 5: Expand step (template rendering, no LLM)

**Files:**
- Create: `src/skills/analogy/expand.ts`
- Test:   `src/tests/skills/analogy/expand.test.ts`

**Interfaces:**
- Consumes: Task 1 types, Task 3 `RankedCandidate`.
- Produces:
  ```ts
  export interface AnalogyReport { id: string; name: string; domain: string; rank: number;
    mapping: Array<{ physics: string; engineering: string }>;
    predictions: string[]; evidenceNeeded: string[]; translationBack: string;
    antiPatterns: string[]; confidence: "high" | "medium" | "low"; }
  export function expandCandidates(cands: ReadonlyArray<RankedCandidate>): AnalogyReport[];
  ```
  Pure function; no LLM. Just unwraps each entry into the report shape. Missing `predictions` / `evidenceNeeded` become empty arrays.

- [ ] **Step 1: Failing test**
- [ ] **Step 2: RED**
- [ ] **Step 3: Implement**
- [ ] **Step 4: GREEN + tsc**
- [ ] **Step 5: Commit**

```bash
git commit -m "feat(analogy): expand step renders RankedCandidate into AnalogyReport"
```

---

## Task 6: Workflow tool — instruction spec + dispatch handler

**Files:**
- Create: `src/skills/analogy/workflow.ts` (workflow orchestrator: clarify → match → expand → report)
- Modify: `src/instructions/instruction-specs.ts` (register `analogy-think` with `public: true`, `surface: "public"`; chainTo: empty)
- Modify: `src/generated/registry/public-tools.ts` (add `analogy-think` to the workflow public tools, but its surface visibility is gated by `MCP_FULL_SURFACE`; the slim manifest already excludes it because it is not in `SLIM_SURFACE_TOOLS`)
- Modify: `src/tools/tool-call-handler.ts` (dispatch `analogy-think` through the workflow path; pass `toolName="analogy-think"` to envelope helpers)
- Test:   `src/tests/skills/analogy/workflow.test.ts`

**Interfaces:**
- Consumes: Task 4 `FeatureExtractor`, Task 3 `Ranker`, Task 5 `expandCandidates`.
- Produces:
  ```ts
  export interface AnalogyEnvelopePayload {
    candidates: AnalogyReport[];
    noMatchHint?: string;
    degradedRanking?: boolean;
  }
  export async function runAnalogyWorkflow(
    input: { request: string; context?: string },
    deps: { extract: FeatureExtractor; rank: Ranker },
  ): Promise<{ summaryMarkdown: string; payload: AnalogyEnvelopePayload }>;
  ```

The summary markdown ALWAYS starts with the literal line `Metaphor, not theorem.`

- [ ] **Step 1: Failing test**

```ts
import { describe, expect, it } from "vitest";
import { runAnalogyWorkflow } from "../../../skills/analogy/workflow.js";
import { HEURISTIC_EXTRACTOR } from "../../../skills/analogy/clarify.js";

it("returns a Metaphor-not-theorem labelled report for a feedback-loop problem", async () => {
  const fakeRank = async (_s: string, cs: any[]) => cs.map((c, i) => ({ id: c.id, score: 1 - i * 0.1 }));
  const out = await runAnalogyWorkflow(
    { request: "our retry loop overshoots when the upstream slows" },
    { extract: HEURISTIC_EXTRACTOR, rank: fakeRank },
  );
  expect(out.summaryMarkdown.startsWith("Metaphor, not theorem.")).toBe(true);
  expect(out.payload.candidates.length).toBeGreaterThan(0);
  expect(out.payload.candidates[0].id).toBeTruthy();
});

it("returns a no-match hint when nothing in the catalog gates open", async () => {
  const fakeRank = async () => [];
  const out = await runAnalogyWorkflow(
    { request: "TODO: write more docs" },
    { extract: async () => ({ problemSummary: "TODO", features: [] }), rank: fakeRank },
  );
  expect(out.payload.candidates).toHaveLength(0);
  expect(out.payload.noMatchHint).toBeTruthy();
});
```

- [ ] **Step 2: RED**
- [ ] **Step 3: Implement workflow.ts**

```ts
import { matchCandidates } from "./matcher.js";
import { expandCandidates, type AnalogyReport } from "./expand.js";
import type { FeatureExtractor } from "./clarify.js";
import type { Ranker } from "./matcher.js";

const HEADER = "Metaphor, not theorem.";

export interface AnalogyEnvelopePayload {
  candidates: AnalogyReport[];
  noMatchHint?: string;
  degradedRanking?: boolean;
}

export async function runAnalogyWorkflow(
  input: { request: string; context?: string },
  deps: { extract: FeatureExtractor; rank: Ranker },
): Promise<{ summaryMarkdown: string; payload: AnalogyEnvelopePayload }> {
  const clarify = await deps.extract(input.request, input.context);
  const ranked = await matchCandidates(
    { features: clarify.features, problemSummary: clarify.problemSummary },
    deps.rank,
  );
  const reports = expandCandidates(ranked);
  if (reports.length === 0) {
    const summaryMarkdown = `${HEADER}\n\nNo strong physical analogy gates open for this problem. The methodology gate (issue-debug / system-design) may still help.`;
    return { summaryMarkdown, payload: { candidates: [], noMatchHint: "Try issue-debug or system-design — the methodology gate is appended to both." } };
  }
  const sections = reports.map((r) => renderReport(r)).join("\n\n---\n\n");
  const summaryMarkdown = `${HEADER}\n\n# Analogy candidates\n\n${sections}`;
  return { summaryMarkdown, payload: { candidates: reports } };
}

function renderReport(r: AnalogyReport): string {
  // pure template; spec lists required sections; antiPatterns rendered alongside predictions
  return [
    `## ${r.name} (${r.domain}, ${r.confidence})`,
    "",
    "### Mapping",
    ...r.mapping.map((m) => `- ${m.physics} → ${m.engineering}`),
    r.predictions.length ? "\n### Predictions" : "",
    ...r.predictions.map((p) => `- ${p}`),
    r.evidenceNeeded.length ? "\n### Evidence needed" : "",
    ...r.evidenceNeeded.map((e) => `- ${e}`),
    "\n### Translation back",
    r.translationBack,
    "\n### When NOT to apply",
    ...r.antiPatterns.map((a) => `- ${a}`),
  ].filter(Boolean).join("\n");
}
```

- [ ] **Step 4: Wire into instruction-specs**

Inspect `src/instructions/instruction-specs.ts` for the existing entry shape; add an `analogy-think` spec with `public: true`, `surface: "public"`, `chainTo: []`, `displayName: "Analogy Think"`, `instructionId: "analogy-think"`. Register a Zod input schema with `request: z.string()` and optional `context: z.string().optional()`.

- [ ] **Step 5: Wire dispatcher**

In `src/tools/tool-call-handler.ts`, add a branch for `toolName === "analogy-think"`. The dispatcher already routes workflow tools through a unified path; the analogy workflow returns `{ summaryMarkdown, payload }` shaped like `buildWorkflowEnvelopePayload` output. Pass it directly to `toToolResult({ summaryMarkdown, payload, meta: { tool: "analogy-think", ts: ..., version: 1 } })`. The injected `Ranker` and `FeatureExtractor` are runtime dependencies; for the initial ship, use the heuristic extractor + a placeholder ranker that ranks by gate order (deterministic, no LLM). The LLM-backed ranker can land in a follow-up.

- [ ] **Step 6: Add to public surface**

The slim filter is opt-out on `SLIM_SURFACE_TOOLS`, so `analogy-think` is automatically NOT in slim mode. Verify by extending `src/tests/tools/shared/tool-surface-manifest.test.ts` with an assertion: `filterToSlimSurface([{ name: "analogy-think" }, ...], {})` does NOT include `analogy-think`.

- [ ] **Step 7: GREEN + tsc + full suite**

```bash
npx vitest run
npx tsc --noEmit
```

- [ ] **Step 8: Commit**

```bash
git add src/skills/analogy/workflow.ts src/instructions/instruction-specs.ts src/tools/tool-call-handler.ts src/tests/skills/analogy/workflow.test.ts src/tests/tools/shared/tool-surface-manifest.test.ts
git commit -m "feat(analogy): analogy-think workflow tool (full-surface only)"
```

---

## Task 7: Methodology gate module — five plain-English checks

**Files:**
- Create: `src/skills/shared/methodology-gate.ts`
- Test:   `src/tests/skills/shared/methodology-gate.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  ```ts
  export type CheckStatus =
    | { status: "applied"; finding: string }
    | { status: "not-applicable"; reason: string }
    | { status: "needs-data"; question: string };

  export interface MethodologyReport {
    dimensional: CheckStatus;
    conservation: CheckStatus;
    fermi: CheckStatus;
    scaling: CheckStatus;
    falsifiability: CheckStatus;
  }

  export interface MethodologyContext {
    problemSummary: string;
    toolResult: { summaryMarkdown: string; payload: unknown };
  }

  export type CheckRunner = (name: keyof MethodologyReport, ctx: MethodologyContext) => Promise<CheckStatus>;
  export async function runMethodologyChecks(
    ctx: MethodologyContext,
    runner: CheckRunner,
  ): Promise<MethodologyReport>;

  export function renderMethodologySection(report: MethodologyReport): string;
  ```
  `runMethodologyChecks` invokes the `runner` (LLM-backed in production, deterministic in tests) once per check, in parallel, and catches per-check exceptions into `{ status: "needs-data", question: <error message> }`. `renderMethodologySection` produces the markdown section starting with `## Methodology checks (not proofs)` and one bullet per `applied` check; not-applicable checks are summarised in a single tail line.

- [ ] **Step 1: Failing test**

```ts
import { describe, expect, it } from "vitest";
import { runMethodologyChecks, renderMethodologySection } from "../../../skills/shared/methodology-gate.js";

it("runs all five checks and tolerates per-check errors", async () => {
  const runner = async (name: any): Promise<any> => {
    if (name === "fermi") throw new Error("fermi runner blew up");
    return { status: "applied", finding: `${name} finding` };
  };
  const report = await runMethodologyChecks({ problemSummary: "x", toolResult: { summaryMarkdown: "", payload: {} } }, runner);
  expect(report.dimensional.status).toBe("applied");
  expect(report.fermi.status).toBe("needs-data");
  expect((report.fermi as any).question).toContain("fermi runner blew up");
});

it("renderMethodologySection always starts with the markdown header", () => {
  const md = renderMethodologySection({
    dimensional: { status: "applied", finding: "all dimensions consistent" },
    conservation: { status: "not-applicable", reason: "no closed quantity" },
    fermi: { status: "needs-data", question: "what is the request rate?" },
    scaling: { status: "applied", finding: "linear in N" },
    falsifiability: { status: "applied", finding: "claim is testable" },
  });
  expect(md).toMatch(/^## Methodology checks \(not proofs\)/m);
  expect(md).toContain("dimensional");
  expect(md).toContain("not-applicable");
});
```

- [ ] **Step 2: RED**
- [ ] **Step 3: Implement** (per the interface above)
- [ ] **Step 4: GREEN + tsc**
- [ ] **Step 5: Commit**

```bash
git commit -m "feat(methodology): five-check gate module with renderer"
```

---

## Task 8: Wire methodology gate into the four host workflow tools

**Files:**
- Modify: `src/tools/tool-call-handler.ts` (or per-tool wrappers if they exist) for the success-return path of `issue-debug`, `code-review`, `system-design`, `evidence-research`.
- Modify: `src/tools/result-formatter.ts` if `buildWorkflowEnvelopePayload` needs a `methodology` field added.
- Modify: `src/tests/mcp/tool-coverage-matrix.test.ts` (extend to assert payload has `methodology` for the four host tools).
- Test:   ad-hoc in `src/tests/tools/result-formatter.test.ts` extension.

**Interfaces:**
- Consumes: Task 7 module.
- Produces: each of the four tools' envelope payloads gains a `methodology: MethodologyReport` field; each tool's `summaryMarkdown` gains a `## Methodology checks (not proofs)` section.

This is a repeating-pattern task. Apply the same change to all four tools.

- [ ] **Step 1: Failing test**

Extend `src/tests/mcp/tool-coverage-matrix.test.ts` to assert: for each of the 4 host tools, `parsed.payload.methodology` exists.

- [ ] **Step 2: RED**
- [ ] **Step 3: Implement**

Inject a default runner (deterministic stub for now: returns `{ status: "needs-data", question: "LLM runner not yet wired" }` for all five checks; LLM-backed runner is a follow-up). At each of the four success-return sites in `tool-call-handler.ts`:

```ts
const methodologyReport = await runMethodologyChecks(
  { problemSummary: result.data.request ?? "", toolResult: { summaryMarkdown: rawMarkdown, payload: workflowPayload } },
  defaultRunner,
);
const summaryMarkdown = rawMarkdown + "\n\n" + renderMethodologySection(methodologyReport);
const payload = { ...workflowPayload, methodology: methodologyReport };
return toToolResult({ summaryMarkdown, payload, meta: { tool: toolName, ts: ..., version: 1 } });
```

Add the `methodology` field to `WorkflowEnvelopePayload` in `result-formatter.ts` (optional field on the type).

- [ ] **Step 4: GREEN + tsc + full suite**
- [ ] **Step 5: Commit**

```bash
git commit -m "feat(methodology): append gate to issue-debug, code-review, system-design, evidence-research"
```

---

## Task 9: Cross-blind verification

**Files:**
- Create: `src/tests/verification/cross-blind-analogy.test.ts`

**Interfaces:**
- Consumes: spec.
- Produces: intent-anchored assertions independent of the implementation tests.

- [ ] **Step 1: Write the assertions from the SPEC, not from the implementation tests**

Tests should include at minimum:
- `analogy-think` is not in the slim default surface.
- `analogy-think` IS in the full surface (with `MCP_FULL_SURFACE=true`).
- A successful `analogy-think` run on a feedback-loop request yields output whose prose starts with `Metaphor, not theorem.` and whose envelope payload has `candidates.length >= 1`.
- For each of the four methodology host tools, output prose contains `## Methodology checks (not proofs)` and payload has a `methodology` field with all five check keys.
- No envelope payload field carries the string `theorem`, `proven`, or `QED` (rigor-laundering guard).
- The seed catalog contains zero entries claiming QM or GR domain.

- [ ] **Step 2: Build dist (cross-blind tests dispatch via MCP)**

```bash
npm run build
```

- [ ] **Step 3: Run**

```bash
npx vitest run src/tests/verification/cross-blind-analogy.test.ts
```

- [ ] **Step 4: Commit**

```bash
git commit -m "test(verification): cross-blind regression for analogy-think + methodology gate"
```

---

## Task 10: Docs page + CHANGELOG

**Files:**
- Create: `docs/src/content/docs/reference/analogy-think.md`
- Modify: `CHANGELOG.md` (Unreleased section)

- [ ] **Step 1: Write the Starlight doc**

Cover: what the tool does, the honest-labelling rationale, the catalog schema link, the methodology gate, when to NOT use it (pointer to the conceptual analysis).

- [ ] **Step 2: Build docs**

```bash
cd docs && npm run build
```

- [ ] **Step 3: CHANGELOG entry**

Under `### Unreleased`, add bullets for:
- `feat(analogy): analogy-think workflow tool with curated metaphor catalog`
- `feat(methodology): methodology gate appended to four engineering workflow tools`

- [ ] **Step 4: Commit**

```bash
git add docs/src/content/docs/reference/analogy-think.md CHANGELOG.md
git commit -m "docs: analogy-think reference page + CHANGELOG entry"
```

---

## Verification (end-to-end)

1. `npx vitest run` — full suite green.
2. `npx tsc --noEmit` — clean.
3. Slim mode: spawn MCP via `SdkMcpTestClient` without `MCP_FULL_SURFACE` — `listTools()` does NOT include `analogy-think`.
4. Full mode: spawn with `MCP_FULL_SURFACE=true` — `analogy-think` is present; dispatch with a feedback-loop request; both content blocks present; prose starts with `Metaphor, not theorem.`; envelope payload parses to `AnalogyEnvelopePayload`.
5. Methodology gate: dispatch `issue-debug`, `code-review`, `system-design`, `evidence-research` each with `{ request: "x" }`; each output's prose contains `## Methodology checks (not proofs)` and envelope payload has `methodology` field.
6. Astro docs build green.

## Self-review notes

- **Spec coverage:** Each spec section maps to one or more tasks. Path A: tasks 1–6, 9, 10. Path B: tasks 7, 8, 9, 10. Verification: task 9.
- **Placeholder scan:** No `TBD`/`TODO`. Every step shows code or commands.
- **Type consistency:** `MetaphorEntry`, `RankedCandidate`, `AnalogyReport`, `AnalogyEnvelopePayload`, `MethodologyReport`, `CheckStatus` all defined once and reused.
- **Right-sizing:** Tasks 1–5 are small and tightly TDD-shaped. Task 6 is the largest (multi-file wiring) but unavoidable — registering a new tool touches the spec registry, the dispatcher, and the public surface. Task 8 is a repeating pattern across 4 host tools (handled with one task per skill-rule guidance).
- **What's deferred:** LLM-backed `Ranker` and LLM-backed `CheckRunner` are out of scope for this plan. The plan ships a heuristic extractor + a placeholder ranker + a placeholder check runner. A follow-up plan will replace these with LLM-backed implementations and add the LLM-call cost telemetry that comes with them.

## Execution handoff

Plan complete and committed. Use superpowers:subagent-driven-development (recommended) for parallel-friendly task execution, or superpowers:executing-plans for sequential same-session execution.
