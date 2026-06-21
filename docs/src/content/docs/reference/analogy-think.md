---
title: analogy-think and the methodology gate
description: A workflow tool that maps a problem to candidate physics metaphors via a curated catalog, plus a methodology gate appended to four engineering workflow tools. Honest framing throughout — metaphor, not theorem.
sidebar:
  label: Analogy & Methodology
  order: 7
---

import { Aside } from '@astrojs/starlight/components';

`analogy-think` is a workflow tool that maps an engineering problem to one or more candidate physics metaphors and translates them back into plain engineering language. The companion **methodology gate** appends five plain-English physics-thinking checks to the output of `issue-debug`, `code-review`, `system-design`, and `evidence-research`.

Both are deliberately limited. They produce metaphors and methodology checks, not theorems and not proofs. Every output declares this explicitly in its first line.

## Why this exists

A previous experiment (Track C, recorded in the conceptual analysis at `.superpowers/plans/2026-06-17-track-c-conceptual-analysis.md` in the repo) attempted a universal QM/GR translator that took arbitrary engineering context and produced a quantum or relativistic picture. It was deprecated when the structural reasons it cannot work as a universal translator became clear: borrowed vocabulary does not inherit borrowed rigor, no isomorphism is on offer for arbitrary problems, and a framework that can describe anything constrains nothing.

`analogy-think` and the methodology gate are the two viable routes that survived that analysis:

- **Path A (`analogy-think`).** The user (or agent) opts in per-problem. The metaphor is named, the applicability conditions are *structural* gates, and every output translates the metaphor back to plain engineering language. The catalog is broad-physics (mechanics, oscillators, thermodynamics, statistical mechanics, fluids, electromagnetism, general systems) and explicitly excludes QM and GR.
- **Path B (the methodology gate).** Plain-English physics-thinking habits — dimensional consistency, conservation accounting, Fermi-scale sanity, scaling/asymptotic limits, falsifiability — applied to the output of four engineering tools. No metaphor; just the reasoning discipline.

## `analogy-think` workflow

Available only when `MCP_FULL_SURFACE=true`. The slim default surface (three routing tools) does not expose it.

### Input

```ts
{
  request: string;            // free-text description of the problem
  context?: string;            // optional supplementary detail
}
```

### Pipeline

1. **Clarify.** The heuristic feature extractor reads `request` (and optional `context`) and produces a `Set<ProblemFeature>` — twelve named structural features such as `has-feedback-loop`, `has-time-evolution`, `has-stochastic-component`. An LLM-backed extractor is a planned follow-up; the shipped heuristic uses regex patterns.
2. **Match.** A structural gate filters the metaphor catalog: an entry survives if its `requiredFeatures` are a subset of the problem's features and its `excludingFeatures` do not overlap. The gate is the load-bearing safety rail — it is what prevents the kind of "label happens to match" failure that bit the deprecated adapter.
3. **Rank.** An injectable ranker orders the survivors. The shipped placeholder is deterministic (gate-order); an LLM-backed ranker is a follow-up.
4. **Expand.** The top three surviving entries are unwrapped into structured reports: the physics↔engineering mapping, the predictions the metaphor implies, the evidence a user must gather to validate, the translation back, and the explicit anti-patterns naming when the metaphor *should not* be applied.

### Output

Two content blocks per the [ToolEnvelope V1 specification](./output-envelope.md):

- Block 0 — markdown prose. The first line is always exactly:

  ```
  Metaphor, not theorem.
  ```

- Block 1 — `__ENVELOPE_V1__:<base64-JSON>` carrying:

  ```ts
  interface AnalogyEnvelopePayload {
    instructionId: "analogy-think";
    candidates: AnalogyReport[];
    noMatchHint?: string;
    degradedRanking?: boolean;
  }

  interface AnalogyReport {
    id: string;
    name: string;
    domain: PhysicsDomain;
    rank: number;
    mapping: Array<{ physics: string; engineering: string }>;
    predictions: string[];      // empty when entry omits them
    evidenceNeeded: string[];   // empty when entry omits them
    translationBack: string;
    antiPatterns: string[];
    confidence: "high" | "medium" | "low";
  }
  ```

When the gate produces zero survivors, `candidates` is empty and `noMatchHint` directs the caller to the methodology gate via `issue-debug` or `system-design`.

### Catalog at a glance

Twelve seed entries spanning oscillators, statistical mechanics, fluids, electromagnetism, general systems accounting, and mechanics. Three are shipped at `confidence: "high"` and declare both `predictions` and `evidenceNeeded`:

- **damped-oscillator** (oscillators) — feedback loops with possible overshoot
- **diffusion** (stat-mech) — random-walk spread; variance grows like √t
- **conservation-flow** (general) — closed accounting around a bounded subsystem

Nine more ship at `confidence: "medium"`: `phase-transition`, `steady-state-equilibrium`, `resonance`, `dimensionless-ratio`, `brownian-noise`, `hysteresis`, `wave-propagation`, `rc-time-constant`, `markov-equilibrium`.

The catalog source is at `src/skills/analogy/catalog.ts`. Adding a new entry is a normal PR: write the entry, run the catalog validation test, write an integration assertion that exercises its structural gate.

<Aside type="caution">
The catalog ships **no QM or GR entries** on purpose. The `PhysicsDomain` union excludes those literals at the type level. The Track C conceptual analysis explains why: the cases where QM machinery genuinely helps (real non-commutativity, real Born-rule probabilities, real linear algebra over complex Hilbert spaces) are narrow and best added as named problem classes — not via a universal lens.
</Aside>

## Methodology gate

The gate is a shared module (`src/skills/shared/methodology-gate.ts`) appended to the output of four engineering workflow tools: `issue-debug`, `code-review`, `system-design`, `evidence-research`. It does not introduce a new tool surface.

### Five checks

| Check | What it asks |
|---|---|
| `dimensional` | Do the units / types / shapes line up across each step? |
| `conservation` | What invariant must hold; is the accounting closed? |
| `fermi` | Do order-of-magnitude estimates of inputs and outputs match expectation? |
| `scaling` | What changes when the relevant scale (load, depth, N) doubles or grows asymptotically? |
| `falsifiability` | What observation would refute the proposed explanation or fix? |

Each check returns one of three statuses:

```ts
type CheckStatus =
  | { status: "applied"; finding: string }
  | { status: "not-applicable"; reason: string }
  | { status: "needs-data"; question: string };
```

### Effect on tool output

- Prose: each tool's `summaryMarkdown` gains an appended section whose header is always:

  ```
  ## Methodology checks (not proofs)
  ```

  Applied checks render one bullet each; not-applicable checks share a single tail line; needs-data checks render with their question.

- Envelope payload: `WorkflowEnvelopePayload` gains an optional `methodology?: MethodologyReport` field carrying all five check statuses. Downstream agents can read this directly rather than re-parsing the prose.

### Current runner

The shipped runner is a deterministic placeholder that returns `needs-data` for every check with the message `LLM runner not yet wired (Task 8 ships a deterministic placeholder)`. An LLM-backed runner is a planned follow-up. Even with the placeholder, the gate is useful: it documents which checks should be considered, exposes the structured field for downstream chaining, and provides the integration surface the LLM-backed runner will plug into.

## Honest framing

Both surfaces explicitly disclaim what they are not. The strings are tested for presence and removal counts as a regression:

| Surface | First line / header |
|---|---|
| `analogy-think` prose | `Metaphor, not theorem.` |
| Methodology gate section | `## Methodology checks (not proofs)` |

A cross-blind regression suite (`src/tests/verification/cross-blind-analogy.test.ts`) verifies, against the spec rather than the implementation, that:

- Slim default surface excludes `analogy-think`.
- Full surface exposes it and a feedback-loop request returns at least one candidate.
- Every methodology gate output contains the honest header in prose and all five check keys in the payload.
- No envelope payload string anywhere contains `theorem`, `proven`, or `QED` (rigor-laundering guard scoped to the structured payload — the prose disclaimer is exempt and intentional).
- The seed catalog contains no `qm` or `gr` domain entries.

## When *not* to use this

- **For routine routing.** `analogy-think` is not a planner; use `task-bootstrap` or `meta-routing` for that.
- **For decisions that need quantitative rigor.** A metaphor is a cognitive scaffold, not a measurement. If the answer matters, gather the evidence the catalog entry lists under `evidenceNeeded`.
- **For problem classes whose mathematics genuinely matches QM machinery.** Those exist, but they want named handling, not a re-labelled universal adapter — see the conceptual analysis at `.superpowers/plans/2026-06-17-track-c-conceptual-analysis.md` for the structural argument.
- **As a substitute for engineering practice.** The methodology gate ships in advisory mode. Its checks are prompts to think, not gates that block a deploy.

## Source pointers

- Spec: `.superpowers/specs/2026-06-17-analogy-think-and-methodology-gate-design.md`
- Plan: `.superpowers/plans/2026-06-17-analogy-think-and-methodology-gate.md`
- Catalog: `src/skills/analogy/catalog.ts`
- Workflow: `src/skills/analogy/workflow.ts`
- Methodology gate: `src/skills/shared/methodology-gate.ts`
- Cross-blind regression: `src/tests/verification/cross-blind-analogy.test.ts`
