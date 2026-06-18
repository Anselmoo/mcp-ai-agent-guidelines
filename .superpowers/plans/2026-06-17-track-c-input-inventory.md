# Track C Input Inventory: Physics Adapter Supported Input Shapes

**Date:** 2026-06-17  
**Author:** Agent Task C.1 (spike research)  
**Purpose:** Enumerate the currently-supported input shapes for the physics adapter prototype under the gating model.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [PhysicsConcern Catalog](#physicsconcern-catalog)
3. [Shape an Input Must Already Have](#shape-an-input-must-already-have)
4. [PHYSICS_ADAPTER_GUARDRAILS (Verbatim)](#physics_adapter_guardrails-verbatim)
5. [Things the Adapter Cannot Decide](#things-the-adapter-cannot-decide)
6. [Appendix: Helper Functions](#appendix-helper-functions)

---

## Executive Summary

The physics adapter prototype (`src/skills/shared/physics-adapter-prototype.ts`) is a **gated, pattern-matching router** that:

1. **Requires conventional evidence** before pattern-matching proceeds. If evidence is missing, the adapter returns `allowed: false`.
2. **Maps 12 physics concerns** across 2 lenses (Quantum Mechanics for uncertainty/variance, General Relativity for coupling/structure).
3. **Pattern-matches on combined text** (request + context + targetQuestion + evidence details) to detect structural questions.
4. **Recommends candidate skills** and translation checklists specific to each concern.
5. **Treats all output as advisory-only** — not a runtime surface.

The adapter is **not** a generative model. It is a classifier that routes pre-existing metrics or observations into named physics framings.

---

## PhysicsConcern Catalog

| Concern | Lens | Input Pattern (Regex) | Candidate Skills | Rationale | Engineer Question | Guardrail Check |
|---------|------|----------------------|------------------|-----------|-------------------|-----------------|
| **flakiness** | QM | `\b(flak\|intermittent\|race.condition\|timing\|non.deterministic\|resource.leak\|order.dependent)\b` | `qm-decoherence-sentinel` | Flaky tests are best framed as decoherence channels because the real question is which source of variance is destabilising the result. | Which failure channel is making this test non-deterministic, and what deterministic control removes it? | Conv. evidence required; no scraped numerals |
| **candidate-ranking** | QM | `\b(candidate\|rank\|option\|variant\|winner\|select\|choice\|best)\b` | `qm-superposition-generator`, `qm-bloch-interpolator` | Candidate-ranking fits the QM lens because the metaphor helps compare multiple plausible implementations without pretending there is a single deterministic answer upfront. | Which implementation options deserve deeper evaluation, and what evidence would collapse the choice safely? | Conv. evidence required; no scraped numerals |
| **coupling-cohesion** | QM | `\b(coupling\|cohesion\|mixed.concern\|single.responsibility\|tradeoff\|pareto)\b` | `qm-uncertainty-tradeoff`, `qm-entanglement-mapper` | The QM tradeoff lens is useful when the real question is whether improving one structural property worsens another and where hidden co-change makes that tradeoff sharper. | Which modules sit on the worst coupling-versus-cohesion frontier, and what refactor order would reduce that tension? | Conv. evidence required; no scraped numerals |
| **review-impact** | QM | `\b(review\|merge\|decision\|chosen\|pick\|backact\|adjacent\|neighbor\|impact)\b` | `qm-measurement-collapse` | Review-impact is a QM-style backaction problem: choosing one change path can perturb nearby modules or future options. | What adjacent modules or workflows are likely to be perturbed by adopting this reviewed change? | Conv. evidence required; no scraped numerals |
| **history-drift** | QM | `\b(history\|drift\|release\|over.time\|trajectory\|evolution\|snapshot\|commit)\b` | `qm-heisenberg-picture`, `qm-path-integral-historian` | Historical drift maps well to QM when the question is how metrics evolved across releases and which path changes had the highest architectural action. | Which historical shifts changed the engineering trajectory, and what metric drift now matters most? | Conv. evidence required; no scraped numerals |
| **coverage-gap** | QM | `\b(coverage\|uncovered\|bug.pattern\|regression\|blind.spot\|test.gap\|probability)\b` | `qm-wavefunction-coverage` | The QM coverage lens is appropriate when conventional line coverage misses the actual question of which bug patterns are still weakly exercised. | Which bug patterns are still weakly covered despite acceptable line or branch coverage? | Conv. evidence required; no scraped numerals |
| **coupling-gravity** | GR | `\b(coupling\|dependents\|fan.in\|fan.out\|core.module\|radius\|gravity\|cascade)\b` | `gr-schwarzschild-classifier`, `gr-event-horizon-detector` | GR is the right lens when the core question is whether coupling mass has grown so large that change now cascades through the surrounding system. | Which modules have become gravitational centers where every change cascades outward? | Conv. evidence required; no scraped numerals |
| **debt-curvature** | GR | `\b(debt\|curvature\|complexity\|cohesion\|maintainability\|hotspot\|slowdown)\b` | `gr-spacetime-debt-metric`, `gr-dark-energy-forecaster` | Debt-curvature is a relativity problem because the engineering concern is where accumulated coupling and complexity bend delivery speed the most. | Where is technical-debt curvature highest, and which modules are slowing nearby work the most? | Conv. evidence required; no scraped numerals |
| **entropy-surface** | GR | `\b(api.surface\|exports\|entropy\|public.api\|surface.area\|over.exposed\|under.exposed)\b` | `gr-hawking-entropy-auditor` | API-surface hygiene is better served by the GR entropy metaphor because the real issue is how much information and coupling is concentrated on the public boundary. | Is the public API surface exposing too much or too little relative to internal complexity? | Conv. evidence required; no scraped numerals |
| **split-pressure** | GR | `\b(split\|decompose\|tidal\|refactor.path\|shortest.path\|break.apart\|extract)\b` | `gr-tidal-force-analyzer`, `gr-geodesic-refactor` | The GR split-pressure lens fits when a module is under uneven coupling forces and the engineering task is to sequence the least-disruptive split. | Should this module split, and what is the lowest-risk refactor path? | Conv. evidence required; no scraped numerals |
| **abstraction-drift** | GR | `\b(abstraction\|wrapper\|adapter\|facade\|proxy\|drift\|redshift\|layer)\b` | `gr-redshift-velocity-mapper`, `gr-equivalence-principle-checker` | Abstraction drift is a GR problem because repeated wrappers and layers can distort the original contract as it travels through the system. | How much interface drift has accumulated through our abstraction layers, and where should we reassert a canonical contract? | Conv. evidence required; no scraped numerals |
| **topology-shock** | GR | `\b(shockwave\|merge\|ripple\|large.change\|dependency.wave\|after.refactor\|topology)\b` | `gr-gravitational-wave-detector`, `gr-gravitational-lensing-tracer` | Topology shock belongs to GR because the useful question is how large changes bend call paths and send coupling ripples through the architecture. | Which hidden modules are bending call paths, and where are recent large changes sending ripples? | Conv. evidence required; no scraped numerals |

---

## Shape an Input Must Already Have

The physics adapter's gating function (`gatePhysicsAdapter()`) requires **all three** of the following conditions before allowing translation:

### 1. Non-Empty Request

```typescript
if (input.request.trim().length === 0) {
  missingRequirements.push("request");
}
```

The `request` field must be present and contain at least one non-whitespace character. This is the primary signal that the user has framed a structural question.

### 2. Conventional Evidence (Required)

```typescript
const evidenceCount =
  input.conventionalEvidence?.filter((item) => item.detail.trim().length > 0)
    .length ?? 0;

if (evidenceCount === 0) {
  missingRequirements.push("conventional evidence");
}
```

At least one element in the `conventionalEvidence` array must have a non-empty `detail` string. Evidence kinds are:
- `metrics` — quantitative measurements (coupling count, complexity score, line count, test coverage, etc.)
- `static-analysis` — findings from linters, AST walkers, or architecture checkers
- `tests` — test failure logs, regression traces, flakiness reports
- `history` — git commit history, release notes, metric trends over time
- `architecture` — dependency graphs, module maps, API surface inventories
- `incident` — production outages, on-call logs, customer reports tied to structure

**The adapter does not generate evidence.** It consumes evidence that already exists in the workspace (committed metrics, CI logs, dependency reports, etc.).

### 3. A Structural Question (Physics-Worthy)

```typescript
if (concerns.length === 0) {
  missingRequirements.push("physics-worthy structural question");
}
```

The combined text (request + context + targetQuestion + evidence details) must match at least one of the 12 concern patterns. If the request mentions only implementation details or tactics without a structural question (e.g., "I want to refactor this loop"), and no pattern matches, the adapter rejects it.

**Pattern-matching is strict:** The regex patterns look for domain-specific keywords. Paraphrasing without explicit keywords may cause the pattern to fail. For example:
- ✓ "Our tests are flaky and intermittent" → matches `flakiness` pattern
- ✗ "Tests are unreliable" → does NOT match (word "flaky" or close synonym required)

---

## PHYSICS_ADAPTER_GUARDRAILS (Verbatim)

From `src/skills/shared/physics-adapter-prototype.ts` (line 76–83):

```typescript
export const PHYSICS_ADAPTER_GUARDRAILS = [
	"Do not use the adapter unless conventional evidence already exists.",
	"Treat the output as advisory-only; the adapter is not a runtime tool surface.",
	"Map only explicit structured metrics into calibrated calculations; do not scrape opportunistic numerals from free-form prose.",
	"Always pair the metaphor output with a plain-language engineering translation.",
	"Reject or down-rank physics recommendations that disagree with conventional analysis without supporting evidence.",
	"Keep QM/GR selection lens-specific: quantum for uncertainty/selection/variance, relativity for coupling/debt/abstraction structure.",
] as const;
```

Each guardrail is enforced at different stages:

1. **Guardrail 1** — enforced in `gatePhysicsAdapter()` (requires `conventionalEvidence`)
2. **Guardrail 2** — enforced in code comments and return types (output is `PhysicsLensRecommendation`, not imperative action)
3. **Guardrail 3** — enforced in helper functions like `extractNumbers()` (used to validate metrics; not auto-generate them)
4. **Guardrail 4** — enforced in translation checklist (QM and GR checklists require "plain-language engineering translation")
5. **Guardrail 5** — enforced in skill recommendation (each recommendation includes `rationale` field; if the QM/GR frame contradicts evidence, the calling skill rejects it)
6. **Guardrail 6** — enforced via lens-selection filter (`recommendPhysicsLenses()` respects `preferredLens` and maps concerns to lenses by design)

---

## Things the Adapter Cannot Decide

The adapter pattern-matches and recommends, but **produces vacuous output** in these scenarios:

### Scenario 1: Free-Form Prose Without Metrics

**Input:**
```typescript
{
  request: "The module feels like it's getting too complex.",
  conventionalEvidence: [{
    kind: "architecture",
    detail: "I've been looking at the code and it seems messy."
  }]
}
```

**Why vacuous:** The pattern matching succeeds (the word "complexity" appears), but there are **no structured metrics** to ground a physics recommendation. The QM/GR calculations in helper functions (e.g., `curvatureScore()` in `gr-physics-helpers.ts`) require numeric inputs like `coupling`, `complexity`, `cohesion`. Without those numbers, the recommendation becomes "Your module might be complex" — no better than the original observation.

### Scenario 2: Pattern Matches a Noun in Passing, But Request Is About Something Else

**Input:**
```typescript
{
  request: "We need to choose between candidate databases for the new feature.",
  conventionalEvidence: [{
    kind: "metrics",
    detail: "We have existing PostgreSQL and want to compare with MongoDB."
  }]
}
```

**Why vacuous:** The word "candidate" matches the `candidate-ranking` pattern, but the **structural question is not about code coupling or implementation variance** — it's about operational infrastructure. The QM superposition lens (recommending which code implementations are plausible) does not apply to database selection. The adapter would allow the translation, but the skill invocation would receive a recommendation that has no practical bearing on the decision.

### Scenario 3: Inputs Lacking Explicitly-Labeled Conventional Evidence

**Input:**
```typescript
{
  request: "Refactor the coupling layer to reduce complexity.",
  // conventionalEvidence is undefined or empty
}
```

**Why vacuous:** The gate explicitly rejects this (`missingRequirements.push("conventional evidence")`). The adapter will not produce a recommendation at all — it returns `allowed: false`.

### Scenario 4: Metric Numerals Scraped from Prose, Not Pre-Computed

**Input:**
```typescript
{
  request: "The module exports 20 things and has 500 lines.",
  conventionalEvidence: [{
    kind: "architecture",
    detail: "I looked at the file and counted 20 exports and 500 lines of code by hand."
  }]
}
```

**Violates Guardrail 3:** The adapter *could* use `extractNumbers()` to pull "20" and "500" from the prose, but the guardrail forbids scraping opportunistic numerals. The numbers must come from a **pre-computed report** (e.g., a static-analysis tool output, a committed metrics snapshot) that is cited explicitly in the evidence.

**Honest assessment:** The current code does not *prevent* a caller from scraping and passing numerals; the guardrail is a **contractual obligation** on the caller. If a caller ignores it, the adapter will happily consume the numerals. Track C's threat model includes "someone ignores the guardrails and the adapter makes bad recommendations."

### Scenario 5: All Evidence Is Historical or High-Level; No Link to Current Structure

**Input:**
```typescript
{
  request: "We had a lot of refactoring work in Q1.",
  conventionalEvidence: [{
    kind: "history",
    detail: "We refactored 5 modules and the work took 3 months."
  }]
}
```

**Why vacuous:** The pattern matching for `history-drift` succeeds (keywords "refactoring" and time-based references match). But without **current metric snapshots** (coupling before/after, complexity trends, or commit-per-file velocity), the recommendation cannot ground a physics framing. The adapter would say "Consider the QM Heisenberg Picture for historical variance" — which is true but unhelpful without side-by-side data.

---

## Appendix: Helper Functions

### QM Domain Helpers (`src/skills/qm/qm-physics-helpers.ts`)

**Signal detectors:**
- `hasCouplingSignal(combined: string): boolean` — detects keywords like "coupl", "depend", "fan-in", "fan-out", "import", "circular"
- `hasCohesionSignal(combined: string): boolean` — detects "cohes", "responsib", "single.purpose", "god.class", "mixed.concern"
- `hasCandidateSignal(combined: string): boolean` — detects "candidate", "option", "variant", "impl", "choice", "rank", "select", "best"
- `hasTestFlakinesSignal(combined: string): boolean` — detects "flak", "intermittent", "race.condition", "order.dependent", "non.deterministic"
- `hasCodeReviewSignal(combined: string): boolean` — detects "review", "select", "decision", "merge", "impact", "adjacent"
- `hasRefactoringSignal(combined: string): boolean` — detects "refactor", "migrat", "rewrite", "extract", "decompose", "technical.debt"

**Label maps:**
- `DECOHERENCE_CHANNEL_LABELS` — named channels: timing jitter, resource leak, ordering, environment, external
- `METRIC_PAIR_LABELS` — tradeoff pairs: coupling ↔ cohesion, complexity ↔ coverage, churn ↔ stability
- `REFACTORING_RISK_LABELS` — barriers: low, medium, high

**Advisories:**
- `QM_ADVISORY_DISCLAIMER` — mandatory disclaimer when QM metaphor is primary framing
- `QM_STATIC_EVIDENCE_NOTE` — reminder that QM runtime bridge is future work

### GR Domain Helpers (`src/skills/gr/gr-physics-helpers.ts`)

**Schwarzschild/Event Horizon:**
- `schwarzschildRadius(couplingMass: number): number` — returns `2 × couplingMass`
- `classifySchwarzschildZone(r, r_s): SchwarzschildZone` — zones: inside_horizon, near_horizon, orbital, free_space
- `timeDilationFactor(r, r_s): number` — development slowdown proportional to coupling proximity

**Spacetime Debt (Ricci Scalar analogue):**
- `curvatureScore(coupling, complexity, cohesion): number` — formula: `coupling × complexity / (cohesion + 1e-6)`
- `classifyCurvature(K): CurvatureClass` — classes: extreme (K > 10), high (5–10), moderate (2–5), flat (≤2)

**Tidal Force Analyzer:**
- `tidalForce(maxCoupling, minCoupling, meanCohesion): number` — formula: `(maxC - minC) / (cohesion³ + 1e-9)`
- `classifyTidal(F): TidalClass` — classes: split_required (F > 5), high_tension (2–5), stable (≤2)

**Hawking Entropy Auditor:**
- `hawkingEntropy(publicExports): number` — returns `publicExports / 4`
- `entropyRatio(entropy, internalLines): number` — formula: `entropy / (internalLines / 100 + 1)`
- `classifyEntropy(ratio): EntropyClass` — classes: critical (> 2), elevated (1–2), healthy (≤1)

**Utilities:**
- `fmtNum(n): string` — formats to 3 sig figs; returns "∞" for non-finite
- `extractNumbers(text, limit=5): number[]` — extracts leading numeric literals (used to detect embedded metrics)
- `safeEval(expr, scope): number` — safe mathjs evaluation; returns NaN on error

---

## Decision Criteria for Track C.3

This inventory serves as baseline evidence for the decision in **Track C.3: Physics Adapter Verdict**. The verdict will weigh:

1. **Scope of "supported input shapes"** — Are the 12 concerns sufficiently discrete, or do they overlap in ways that make routing ambiguous?
2. **Gatekeeping effectiveness** — Does the 3-part gate (request, evidence, pattern) actually prevent unsound recommendations, or can callers work around it?
3. **Guardrail compliance cost** — Is the burden on callers to supply structured evidence too high for typical engineering flows?
4. **False-positive rate** — How often does pattern-matching succeed on inputs that are structurally unrelated to the recommended lens?

---

**End of Inventory Document**
