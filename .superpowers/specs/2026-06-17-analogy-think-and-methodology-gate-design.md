# Spec: `analogy-think` + methodology gate

**Companion docs:**

- Track C decision: `.superpowers/plans/2026-06-17-track-c-decision.md`
- Conceptual analysis of universal QM-translation: `.superpowers/plans/2026-06-17-track-c-conceptual-analysis.md`

**Status:** Design approved in conversation 2026-06-17. Awaiting written-spec review before plan generation.

## Why

Track C concluded that universal QM/GR translation cannot be load-bearing because it is a vocabulary substitution, not a structure-preserving map. Two routes remain viable:

- **Path A (analogy-on-request).** A user (or autonomous agent) presents a problem; the system queries a *curated metaphor catalog* spanning broad physics (not just QM/GR), gates candidate metaphors by *structural* applicability conditions (not regex on labels), and returns the surviving 2–3 candidates with explicit mapping, predictions, evidence-needed, and translation back to the original domain. Honest framing: metaphor as cognitive scaffold, not theorem.
- **Path B (methodology gate).** Apply physics-thinking *habits* — dimensional consistency, conservation accounting, Fermi-scale sanity, scaling/asymptotic limits, falsifiability — to existing engineering workflow tools. No metaphor. Plain-English checks; works for any user.

Together: A gives fresh framing on request, B silently raises the rigor of routine engineering tools. Neither inherits authority from QM/GR by virtue of vocabulary alone.

## Goals

- Ship Path A as a new workflow MCP tool `analogy-think`, available under `MCP_FULL_SURFACE=true` (not in slim default).
- Ship Path B as a shared module `src/skills/shared/methodology-gate.ts` consumed by four engineering workflow tools: `issue-debug`, `code-review`, `system-design`, `evidence-research`.
- Seed catalog spans 12 entries across major physics areas; no catalog entry is QM- or GR-specific in the initial seed.
- Honest labelling: every Path A candidate output starts with `Metaphor, not theorem.` and every methodology gate output starts with `Methodology checks (not proofs).`
- No re-use of the deprecated `src/skills/shared/physics-adapter-prototype.ts`; fresh implementation with the lessons applied.

## Non-goals

- Universal problem translation. Path A is opt-in per request; Path B does not claim the problem *is* physics.
- QM/GR specifically in the seed catalog. (The catalog *can* hold a QM entry later if a narrow problem class with genuine non-commutativity is identified — see the conceptual analysis. Seed ship excludes them to avoid relapse into rigor-laundering.)
- Replacing existing tools. Path B *appends* to existing output; it does not replace.

## Architecture

### Path A — `analogy-think` workflow tool

Lives under `src/skills/analogy/`. Same workflow shape as `system-design` and `evidence-research`: clarify → match → expand → report. Dispatched through the existing `tool-call-handler.ts` and `result-formatter.ts`; output uses the existing `__ENVELOPE_V1__:` envelope (Track B).

Pipeline:

1. **Clarify (LLM step).** Take the user's `request` (and optional `context`) and infer a `Set<ProblemFeature>` plus a short structured problem summary. The interview is implicit: the LLM extracts features from the free-text request rather than holding a turn-by-turn dialog.
2. **Match (deterministic + LLM ranking).** Filter the catalog: every entry whose `requiredFeatures` is a subset of the problem features AND whose `excludingFeatures` does not overlap survives. The LLM then ranks the survivors against the problem summary using each entry's `semanticDescription`. Top 3 progress.
3. **Expand (deterministic).** For each of the top 3 surviving entries, render: name, domain, mapping, predictions, evidenceNeeded, translationBack, antiPatterns. No LLM inference here — pure templating from the catalog entry.
4. **Report (deterministic).** Wrap the expansion in the standard workflow output: markdown summary (prose) + envelope payload (structured). Header is `Metaphor, not theorem.` Anti-patterns are emitted alongside each candidate, not buried.

If zero entries survive the gate, the tool returns an empty-candidates result with a recommendation: "no strong physical analogy applies; the methodology gate may still help — consider running `issue-debug` or `system-design`."

### Path B — methodology gate

Lives at `src/skills/shared/methodology-gate.ts`. Exports `runMethodologyChecks(context: MethodologyContext): MethodologyReport`. The context carries the problem summary + the originating tool's result. The report contains the five checks: `dimensional`, `conservation`, `fermi`, `scaling`, `falsifiability`. Each check is one of: `{ status: "applied"; finding: string }`, `{ status: "not-applicable"; reason: string }`, `{ status: "needs-data"; question: string }`.

Each engineering tool (`issue-debug`, `code-review`, `system-design`, `evidence-research`) calls the gate just before final output assembly and appends:

- A `## Methodology checks (not proofs)` section to its `summaryMarkdown` (one line per applied check, omit not-applicable for brevity).
- A `methodology: MethodologyReport` field on its envelope payload, so chained agents can read all five checks including not-applicable ones.

The gate uses LLM reasoning to populate each check given the context; results are always advisory.

### Honest labelling

Both surfaces explicitly say what they are not. Path A header (prose): `Metaphor, not theorem.` Path B header (markdown section): `## Methodology checks (not proofs)`. Both strings are tested for presence — removal counts as a regression.

## Catalog schema

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

`predictions` and `evidenceNeeded` are optional in the type but **required** for a `confidence: "high"` entry — enforced by a catalog-validation test, not by TypeScript. This keeps the bar high for shipped entries while permitting research-grade entries to enter the catalog with lower claims.

### Seed catalog (12 entries)

| id                       | domain         | requiredFeatures (gate)                                          |
| ------------------------ | -------------- | ---------------------------------------------------------------- |
| damped-oscillator        | oscillators    | has-time-evolution, has-feedback-loop                            |
| diffusion                | stat-mech      | has-time-evolution, has-stochastic-component                     |
| conservation-flow        | general        | has-resource-flow                                                |
| phase-transition         | stat-mech      | has-threshold-or-phase-change                                    |
| steady-state-equilibrium | general        | has-time-evolution, has-equilibrium-state                        |
| resonance                | oscillators    | has-feedback-loop, has-overshoot-or-oscillation                  |
| dimensionless-ratio      | fluids         | has-multiple-coupled-parts                                       |
| brownian-noise           | stat-mech      | has-stochastic-component, has-noise                              |
| hysteresis               | em             | has-threshold-or-phase-change, has-time-evolution                |
| wave-propagation         | mechanics      | has-time-evolution, has-network-topology                         |
| rc-time-constant         | em             | has-time-evolution, has-feedback-loop                            |
| markov-equilibrium       | general        | has-stochastic-component, has-equilibrium-state, has-discrete-state-only |

No QM/GR entries in the seed. Catalog grows through follow-up plans, not in this one.

## Data flow

### Path A

```
MCP client
  └─ dispatchToolCall("analogy-think", { request, context? })
     └─ analogyWorkflow.run({ request, context })
        ├─ clarify(request, context)       → { problemSummary, features: Set<ProblemFeature> }
        ├─ match(features, problemSummary) → Top 3 MetaphorEntry candidates (gated, then LLM-ranked)
        ├─ expand(candidates)              → AnalogyReport[]
        └─ report(reports)
           ├─ summaryMarkdown (prose, "Metaphor, not theorem." header)
           └─ payload (structured AnalogyEnvelopePayload, fits ToolEnvelope V1)
```

### Path B

```
Existing tool (e.g. issue-debug)
  └─ workflow.run(input)
     ├─ ...(existing pipeline)...
     ├─ runMethodologyChecks({ problemSummary, toolResult })
     │  └─ returns MethodologyReport with 5 checks
     └─ assembleOutput()
        ├─ summaryMarkdown += "\n## Methodology checks (not proofs)\n" + ...
        └─ envelope.payload.methodology = report
```

## Error handling

- **Catalog returns zero matches.** `analogy-think` returns a success result whose payload's `candidates` array is empty, with a `noMatchHint` field pointing at `system-design` / `issue-debug` / methodology gate. UI-side this renders as a short prose explanation; not an error response.
- **LLM ranking fails or times out.** Fall back to deterministic gate-only matching (no ranking). Mark the candidates with `confidence: "low"` and add a `degradedRanking: true` field to the payload.
- **Catalog entry malformed.** Caught at startup by a validation test; the loader refuses to register the entry and logs once.
- **Methodology check raises.** Each of the five checks runs in isolation; a thrown check becomes `{ status: "needs-data", question: <error message> }`. Other checks still run.
- **Backward compatibility for Path B host tools.** The methodology section is *appended*, not inserted. Any test that asserts on `content[0].text` ending at a specific point must be updated; the spec calls this out as expected work in the implementation plan.

## Testing approach

- **Catalog validation.** Test that every shipped entry has a non-empty `name`, `semanticDescription`, `mapping`, `antiPatterns`; that `confidence: "high"` entries also have `predictions` and `evidenceNeeded`; that no entry uses domain `"qm"` or `"gr"` (typo-prevention; those aren't even in the `PhysicsDomain` union, but a runtime guard test belt-and-braces).
- **Matcher unit tests.** Construct a fake catalog with two entries (one expected to match, one excluded by `excludingFeatures`); assert the matcher returns only the expected one.
- **Workflow integration test.** Dispatch `analogy-think` with a hand-crafted problem statement that should match `damped-oscillator`; assert the candidate is returned and the envelope payload has `instructionId: "analogy-think"`.
- **Honest-labelling test.** Assert that `summaryMarkdown` starts with `Metaphor, not theorem.` for Path A and `## Methodology checks (not proofs)` appears in Path B host outputs.
- **Methodology gate unit tests.** For each of the 5 check types, supply a context where the check should apply, should-not-apply, and needs-data; assert the right `status` is returned.
- **Cross-blind file.** Extend `src/tests/verification/cross-blind-tracks.test.ts` (or add a sibling file `cross-blind-analogy.test.ts`) with assertions written from this spec's *intent* — e.g. "a refactor-style request returns no false-positive analogy"; "a feedback-loop request matches damped-oscillator"; "every Path A output names its anti-patterns alongside its predictions"; "no envelope payload field carries the string 'theorem' or 'proven' or 'QED'."
- **No-emoji rule.** Catalog entries and methodology gate output are scanned by a test for any non-ASCII glyph characters (allowing the few existing glyphRegistry uses elsewhere in prose).
- **Coverage matrix.** Extend `src/tests/mcp/tool-coverage-matrix.test.ts` to dispatch `analogy-think` and confirm two-block envelope round-trips.

## Constraints inherited from the project

- TypeScript strict; `npx tsc --noEmit` green.
- Vitest is the runner.
- ToolEnvelope V1 wire format unchanged.
- Slim default surface unchanged; `analogy-think` only visible with `MCP_FULL_SURFACE=true` (verify by extending the slim-surface test).
- No legacy `agent-memory`/`agent-session`/`agent-snapshot` introduced.
- No reuse of `src/skills/shared/physics-adapter-prototype.ts` (still deprecated).
- Project's existing `rrt-commit-subject` hook governs commit messages.

## Scope check (single plan?)

This spec is one feature with two surfaces (a new tool + a shared module appended to four existing tools). It is plan-sized — comparable to Track B's envelope rollout. It does not need further decomposition.
