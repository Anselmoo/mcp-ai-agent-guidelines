# Track C.2: Three Manual Physics-Adapter Mapping Trials

**Date:** 2026-06-17
**Author:** Agent Task C.2 (spike research)
**Branch:** feat/multi-track-mcp-execution
**Depends on:** C.1 inventory at `docs/superpowers/plans/2026-06-17-track-c-input-inventory.md`

---

## Table of Contents

1. [Session Corpus Overview](#session-corpus-overview)
2. [Selection Rule](#selection-rule)
3. [Trial A: Code-Review / Quality Audit Context](#trial-a-code-review--quality-audit-context)
4. [Trial B: Bug-Triage / Debugging Context](#trial-b-bug-triage--debugging-context)
5. [Trial C: Architecture / Planning Context](#trial-c-architecture--planning-context)
6. [Scoring Summary](#scoring-summary)
7. [Aggregate Finding](#aggregate-finding)

---

## Session Corpus Overview

The corpus at `.mcp-ai-agent-guidelines/session-*.json` contains 25 session files. All
sessions follow a uniform record schema: `{ stepLabel, kind, summary }` where `kind` is
one of `parallel`, `invokeSkill`, `gate`, `invokeInstruction`, `note`, or `finalize`.
Large sessions are stored compressed (base64 + zlib); decompressed, they contain
between 1 and 192 actual records per session.

The corpus is dominated by short sessions (1–3 records) with labels `DESIGN`, `PRIORITY`,
`REQUIREMENTS`. These are workflow orchestration scaffolds executed without a model
available (all invokeSkill summaries read "Model unavailable, providing guidance only").
No session contains free-form prose describing a specific user problem; the records
capture the workflow machinery, not the underlying engineering concern.

---

## Selection Rule

Because the corpus contains no rich natural-language session descriptions, sessions were
selected by **workflow-phase profile**: the distinct `stepLabel` values present in a
session's records were used as a structural proxy for the type of engineering question
the session was addressing.

Three profiles are discernibly different:

- **Profile A (Quality/Review):** `QUALITY`, `SECURITY`, `ACCEPTANCE`, `OUTPUT GRADE`,
  `API SURFACE`, `RECOMMEND`, `PHYSICS AUDIT (OPT-IN)` -- sessions 5NFpM49Ykv71 and
  EVnJYXWSWKSJ. These sessions ran a review-and-audit workflow, making them the closest
  proxy for a code-review or quality-audit context.

- **Profile B (Bug-Triage):** `REPRODUCE`, `LOCATE`, `ROOT CAUSE`, `MEASURE`,
  `PHYSICS SCAN (OPT-IN)`, `DEBUGGING`, `POSTMORTEM`, `PREVENT` -- sub-context records
  49-53 and 65-69 in session vSedqMERb9Bj. These labels map most directly to a bug or
  incident investigation workflow.

- **Profile C (Architecture/Planning):** `CONSTRAINTS`, `RESEARCH`, `OPTIONS`,
  `ARCHITECTURE`, `MULTI-AGENT`, `EVALUATION`, `LEADERSHIP`, `ROADMAP` -- session
  cC3PXrW9swaX. These step labels map to an architectural decision or planning session.

The heuristic is imperfect: step labels name workflow phases, not engineering concerns.
A session labeled `DEBUGGING` may have been investigating a configuration question, not
a code defect. This limitation is disclosed in each trial below.

---

## Trial A: Code-Review / Quality Audit Context

**Session file:** `session-5NFpM49Ykv71.json` (2026-06-02, 8 records after decompression)

**Verbatim records:**

```
[parallel]    QUALITY          "3 parallel step(s) completed."
[parallel]    SECURITY         "4 parallel step(s) completed."
[invokeSkill] ACCEPTANCE       "Advisory execution of Acceptance Criteria: Model unavailable, providing guidance only"
[parallel]    OUTPUT GRADE     "3 parallel step(s) completed."
[invokeSkill] API SURFACE      "Advisory execution of Api Documentation: Model unavailable, providing guidance only"
[invokeSkill] RECOMMEND        "Advisory execution of Recommendation Framing: Model unavailable, providing guidance only"
[gate]        PHYSICS AUDIT (OPT-IN)  "0 serial step(s) executed."
[finalize]    Finalize         "Workflow finalized."
```

**Characterization of context:**

The session ran a quality-review workflow with steps for security assessment, acceptance
criteria, output grading, API surface documentation, and recommendation framing. The
`API SURFACE` step is notable: the `docs-generate` and `code-review` concerns often
surface API-surface hygiene questions. The gate `PHYSICS AUDIT (OPT-IN)` executed zero
steps, meaning the opt-in condition was not met at runtime.

There is no information about which codebase was under review, what files were examined,
or what defects or concerns were surfaced. The records capture only that the workflow
steps were invoked and that a model was unavailable.

**Attempted QM Mapping:**

The C.1 catalog's `review-impact` concern (QM lens) is the closest match. Its regex
is `\b(review|merge|decision|chosen|pick|backact|adjacent|neighbor|impact)\b`. The word
"review" appears in the session only as part of the workflow label `QUALITY` and the
advisory text "Advisory execution." The targeted structural question from the catalog is:
"What adjacent modules or workflows are likely to be perturbed by adopting this reviewed
change?"

- **Blueprint matched:** `review-impact` (QM) -- pattern trigger: keyword `review` in
  `API SURFACE` and `QUALITY` labels.
- **Engineer-question the adapter would ask:** "What adjacent modules or workflows are
  likely to be perturbed by adopting this reviewed change?"
- **Predicted answer from physics frame:** The QM measurement-collapse framing would
  produce a checklist of adjacent modules to inspect for backaction risk. It would name
  specific candidate skill outputs (`qm-measurement-collapse`) and ask the caller to
  supply coupling measurements between the reviewed module and neighbors.
- **Actual reachable answer without the physics frame:** "Review adjacent modules after
  any merge." This is standard review practice and follows directly from the `SECURITY`
  and `ACCEPTANCE` steps visible in the session. No physics framing is needed to arrive
  at "check what the change touches."
- **Diff:** The physics frame adds the label "measurement backaction" and recommends
  `qm-measurement-collapse`. The conclusion -- inspect neighboring modules -- is
  identical. The label is not falsifiable in this context because there are no coupling
  metrics to run the helper functions against.

**Attempted GR Mapping:**

The `entropy-surface` concern (GR lens) could match via the `API SURFACE` step label.
Its regex is `\b(api.surface|exports|entropy|public.api|surface.area|over.exposed|under.exposed)\b`.
The word "API SURFACE" appears verbatim.

- **Blueprint matched:** `entropy-surface` (GR) -- pattern trigger: `api.surface`
  keyword in the `API SURFACE` step label.
- **Engineer-question the adapter would ask:** "Is the public API surface exposing too
  much or too little relative to internal complexity?"
- **Predicted answer from physics frame:** The `gr-hawking-entropy-auditor` would
  compute `hawkingEntropy(publicExports)` and `entropyRatio(entropy, internalLines)`.
  It would classify the API surface as `critical`, `elevated`, or `healthy`.
- **Actual reachable answer without the physics frame:** Unknown, because no numeric
  metrics exist in the session records. The `API SURFACE` step ran in advisory mode
  without a live model, meaning the session produced no actual surface-area count,
  export count, or internal line count.
- **Diff:** The adapter would require `publicExports` and `internalLines` as inputs.
  Those numbers do not exist in this session. The gate returned "0 serial step(s)
  executed," confirming the opt-in was not satisfied. Even if the gate had triggered,
  the session provides no structured metrics to feed to `hawkingEntropy()`. Any output
  would be vacuous per C.1's Scenario 1 ("no structured metrics to ground a physics
  recommendation").

**Score:**

| Mapping | Verdict | Justification |
|---------|---------|---------------|
| QM `review-impact` | **decorative** | The conclusion (inspect neighboring modules after a review) is reachable by reading the `SECURITY` and `ACCEPTANCE` step labels without invoking the measurement-backaction metaphor. The physics frame relabels an existing practice, it does not surface new evidence or change the conclusion. |
| GR `entropy-surface` | **misleading** | The pattern matches on the `API SURFACE` step label, but there are zero numeric metrics in the session to feed into `hawkingEntropy()` or `entropyRatio()`. Reporting an `entropy-surface` concern would imply analytical rigor (Hawking entropy calculation) that the underlying session does not support. The gate itself returned 0 steps, which is the system's own signal that the opt-in condition was not met. |

---

## Trial B: Bug-Triage / Debugging Context

**Session file:** `session-vSedqMERb9Bj.json`, records 49-53 (2026-06-17, sub-context
within a 192-record mega-session)

**Verbatim records (records 49-53):**

```
[invokeSkill] REPRODUCE   "Advisory execution of Reproduction Planner: Model unavailable, providing guidance only"
[invokeSkill] LOCATE      "Advisory execution of Debugging Assistant: Model unavailable, providing guidance only"
[invokeSkill] ROOT CAUSE  "Advisory execution of Root Cause Analysis: Model unavailable, providing guidance only"
[parallel]    MEASURE     "4 parallel step(s) completed."
[gate]        PHYSICS SCAN (OPT-IN)  "0 serial step(s) executed."
```

**Characterization of context:**

This sub-context ran a bug-investigation workflow: reproduction, localization, root cause
analysis, measurement (4 parallel steps), and a physics opt-in gate that triggered zero
executions. The `MEASURE` step with 4 parallel substeps suggests four independent
measurements were attempted -- potentially coverage, coupling, complexity, and test
failure rate -- but the model was unavailable for all invokeSkill steps. The gate
`PHYSICS SCAN (OPT-IN)` again returned zero executions.

There is no information about what bug, which file, or what failure mode was under
investigation. The stepLabels name the investigation phases only.

**Attempted QM Mapping:**

The C.1 catalog's `flakiness` concern (QM lens) is the strongest candidate. Its regex is
`\b(flak|intermittent|race.condition|timing|non.deterministic|resource.leak|order.dependent)\b`.
None of these keywords appear in the session records verbatim. The keyword "MEASURE" and
"ROOT CAUSE" do not trigger the `flakiness` pattern.

The `history-drift` concern's regex `\b(history|drift|release|over.time|trajectory|evolution|snapshot|commit)\b`
also does not match.

- **Blueprint matched:** None. No QM pattern triggers on the available text.
- **Engineer-question the adapter would ask:** N/A (gate would reject: no pattern match).
- **Predicted answer from physics frame:** N/A.
- **Actual reachable answer without the physics frame:** The `REPRODUCE`, `LOCATE`,
  `ROOT CAUSE` sequence already encodes a competent triage workflow. The workflow
  prescribes the right steps in the right order for any debugging context, without
  physics framing.
- **Diff:** None achievable. The adapter's own gating (pattern match required) would
  return `allowed: false` on this input because neither `flak`, `intermittent`, nor any
  other QM-flakiness keyword appears in the record summaries.

**Attempted GR Mapping:**

The `coupling-gravity` concern (GR lens) has regex
`\b(coupling|dependents|fan.in|fan.out|core.module|radius|gravity|cascade)\b`. The
`debt-curvature` concern has regex `\b(debt|curvature|complexity|cohesion|maintainability|hotspot|slowdown)\b`.
Neither keyword set appears in the session summaries for this sub-context.

The `topology-shock` concern's regex `\b(shockwave|merge|ripple|large.change|dependency.wave|after.refactor|topology)\b`
also does not match.

- **Blueprint matched:** None. No GR pattern triggers.
- **Diff:** None achievable. Adapter returns `allowed: false` on this input.

**Score:**

| Mapping | Verdict | Justification |
|---------|---------|---------------|
| QM (any) | **does not apply** | No QM pattern keyword appears in the session text. The adapter's own gate would reject this input with `missingRequirements: ["physics-worthy structural question"]`. Scoring as non-applicable rather than decorative or misleading: the adapter correctly rejects it. |
| GR (any) | **does not apply** | Same reason: no GR keyword appears in the available text. The PHYSICS SCAN gate returned "0 serial step(s) executed," consistent with the adapter's rejection. |

**Important finding for Trial B:** The bug-triage workflow produces records with no
domain-specific keywords (only procedural labels `REPRODUCE`, `LOCATE`, `ROOT CAUSE`,
`MEASURE`). This is the strongest evidence of a corpus-level limitation: the records
store _what steps ran_, not _why they ran_ or _what they found_. The adapter cannot
distinguish a flakiness investigation from a coupling investigation based solely on
step-label text.

---

## Trial C: Architecture / Planning Context

**Session file:** `session-cC3PXrW9swaX.json` (2026-06-17, 11 records)

**Verbatim records:**

```
[parallel]    CONSTRAINTS   "2 parallel step(s) completed."
[parallel]    RESEARCH      "2 parallel step(s) completed."
[parallel]    OPTIONS       "2 parallel step(s) completed."
[parallel]    ARCHITECTURE  "4 parallel step(s) completed."
[invokeSkill] MULTI-AGENT   "Advisory execution of Multi Agent Design: Model unavailable, providing guidance only"
[invokeSkill] EVALUATION    "Advisory execution of Eval Design: Model unavailable, providing guidance only"
[invokeSkill] LEADERSHIP    "Advisory execution of Digital Enterprise Architect: Model unavailable, providing guidance only"
[invokeSkill] COMPLIANCE    "Regulated Workflow Design needs a description of the industry, the regulated decision type, or the compliance requirement before it can produce targeted design guidance."
[invokeSkill] ROADMAP       "Advisory execution of Roadmap Planning: Model unavailable, providing guidance only"
[invokeSkill] DOCUMENT      "Advisory execution of Documentation Generator: Model unavailable, providing guidance only"
[finalize]    Finalize      "Workflow finalized."
```

**Characterization of context:**

The session ran a system-design workflow: constraint enumeration, research, option
exploration, architecture specification, multi-agent design, evaluation design,
enterprise architecture review, compliance check, roadmap planning, and documentation.
This is a planning and architectural-decision context. The `OPTIONS` step (2 parallel)
and `ARCHITECTURE` step (4 parallel) suggest multiple candidate architectures were
evaluated.

The COMPLIANCE invokeSkill returned a non-advisory error: "Regulated Workflow Design
needs a description of the industry, the regulated decision type, or the compliance
requirement before it can produce targeted design guidance." This is the only step that
produced actionable feedback (the skill requires more context and said so explicitly).

**Attempted QM Mapping:**

The `candidate-ranking` concern (QM lens) has regex
`\b(candidate|rank|option|variant|winner|select|choice|best)\b`. The word "OPTIONS"
matches the keyword `option` (case-insensitive regex). The `ARCHITECTURE` step label
does not match any QM pattern.

- **Blueprint matched:** `candidate-ranking` (QM) -- pattern trigger: keyword `option`
  in the `OPTIONS` step label.
- **Engineer-question the adapter would ask:** "Which implementation options deserve
  deeper evaluation, and what evidence would collapse the choice safely?"
- **Predicted answer from physics frame:** The QM superposition framing (`qm-superposition-generator`,
  `qm-bloch-interpolator`) would ask the caller to supply implementation variants with
  associated metrics (complexity, coupling, test coverage deltas). It would represent
  each candidate as a "superposition state" and identify which evidence would "collapse"
  the choice to a winner.
- **Actual reachable answer without the physics frame:** The session already ran
  `OPTIONS` (2 parallel) and `EVALUATION` steps, which structurally represent the same
  process: enumerate alternatives, evaluate them. Standard weighted-criteria analysis or
  an ADR (Architecture Decision Record) would produce the same output without invoking
  the superposition metaphor.
- **Diff:** The physics frame adds the framing of "collapse" (choose when evidence
  suffices) and names the uncertainty explicitly. However, the adapter would still need
  the caller to supply structured metrics for each candidate -- metrics that are absent
  from the session records. Without numeric inputs, `qm-bloch-interpolator` cannot
  compute a Bloch-sphere position for each candidate, so its output is "candidate A
  and candidate B both exist" -- identical to what the `OPTIONS` step already recorded.

**Attempted GR Mapping:**

The `topology-shock` concern (GR lens) has regex
`\b(shockwave|merge|ripple|large.change|dependency.wave|after.refactor|topology)\b`.
None of these keywords appear in the session text.

The `debt-curvature` concern regex `\b(debt|curvature|complexity|cohesion|maintainability|hotspot|slowdown)\b`
also does not match.

The `abstraction-drift` concern regex `\b(abstraction|wrapper|adapter|facade|proxy|drift|redshift|layer)\b`
does not match either.

The `split-pressure` concern regex `\b(split|decompose|tidal|refactor.path|shortest.path|break.apart|extract)\b`
partially matches on "decompose" -- but "decompose" appears only in the session-level
label `DECOMPOSE` in a different sub-context in session vSedqMERb9Bj (records 126), not
in cC3PXrW9swaX.

- **Blueprint matched:** None. No GR pattern triggers on the cC3PXrW9swaX session text.
- **Engineer-question the adapter would ask:** N/A.
- **Predicted answer from physics frame:** N/A.
- **Actual reachable answer without the physics frame:** Architecture planning with
  multi-agent coordination does not require a GR lens. The `ARCHITECTURE` and `ROADMAP`
  steps already sequence the work structurally.

**Score:**

| Mapping | Verdict | Justification |
|---------|---------|---------------|
| QM `candidate-ranking` | **decorative** | The adapter matches on the keyword `option` in the `OPTIONS` step label and asks which implementation options deserve deeper evaluation. The `OPTIONS` step in the session already answers this question by the fact of its existence -- the workflow ran option enumeration as its third step. The physics framing produces the same question the workflow already asked, without adding falsifiable predictions or new evidence. |
| GR (any) | **does not apply** | No GR pattern keyword appears in the session text. Adapter would reject. |

---

## Scoring Summary

| Trial | Context type | QM score | GR score | Notes |
|-------|-------------|----------|----------|-------|
| A | Code-review / quality audit (session-5NFpM49Ykv71) | decorative | misleading | QM relabels standard review practice; GR implies numeric rigor absent from the session |
| B | Bug-triage / debugging (session-vSedqMERb9Bj records 49-53) | does not apply | does not apply | No pattern keyword in step labels; adapter correctly rejects |
| C | Architecture / planning (session-cC3PXrW9swaX) | decorative | does not apply | QM matches `option` keyword but adds no evidence not already captured by the `OPTIONS` step |

**Load-bearing:** 0
**Decorative:** 2 (Trial A QM, Trial C QM)
**Misleading:** 1 (Trial A GR)
**Does not apply (correct rejection):** 3 (Trial B QM, Trial B GR, Trial C GR)

---

## Aggregate Finding

Across three contexts drawn from the real session corpus, the physics adapter produced
**zero load-bearing mappings**.

The reasons cluster into two structural causes:

**Cause 1: The records corpus contains only workflow-phase labels, not engineering-concern
content.** The `stepLabel` and `summary` fields name what workflow machinery ran (`DESIGN`,
`DEBUGGING`, `REPRODUCE`, `MEASURE`), not what engineering problem was being solved. The
adapter's 12 concern patterns are tuned to domain-specific keywords (`flak`, `coupling`,
`debt`, `api.surface`, etc.). Those keywords do not appear in step-label-only records.
The adapter's pattern matcher cannot extract structural signal from procedural metadata.

**Cause 2: Even where a pattern triggers (Trials A and C), the underlying session
provides no structured metrics.** The three gating conditions for a valid adapter
invocation require (a) a request, (b) conventional evidence with at least one non-empty
numeric or structured detail, and (c) a matching concern pattern. All sessions examined
ran in "Model unavailable" advisory mode and produced no artifacts (no coupling counts,
no export counts, no test failure logs) that could serve as conventional evidence.
Without structured metrics, any physics framing output is vacuous per C.1's documented
failure modes (Scenarios 1 and 4).

**A note on the misleading finding in Trial A:** The GR `entropy-surface` mapping is
scored misleading rather than merely decorative because the pattern match on `API SURFACE`
is superficially convincing -- it looks like the adapter detected a real concern. But
the session's PHYSICS AUDIT gate returned "0 serial step(s) executed," which is the
system's own runtime signal that the opt-in threshold was not met. A consumer of the
adapter recommendation who did not check the gate record might act on the `entropy-surface`
finding as if it were supported by Hawking-entropy calculations, when in fact no
calculations were possible. The misleading classification captures the risk that the
label implies rigor the data does not support.

**The honest verdict for Track C.3:** These trials do not support the hypothesis that
the physics adapter adds signal over plain analysis in the session contexts examined.
The corpus does not provide the structured input the adapter requires to produce
non-vacuous output. If the adapter is to be tested fairly, the test corpus must include
sessions with committed metric snapshots, static-analysis reports, or test failure logs
attached to session records -- none of the 25 sessions in this corpus contain those
artifacts.

---

**End of Mapping Trials Document**
