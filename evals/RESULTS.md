# Situation-transform A/B — real local MCP eval

**Question:** Using the local `ai-agent-guidelines` MCP server (from `.mcp.json`),
when you hand it a real problem, do you get problem-oriented solution ideas — and
does the situation-transform help?

**Method:** `scripts/ab_eval.py` shells out to headless `claude -p` (MCP loaded
from a temp config, `CLAUDECODE` unset) so a real Claude session invokes the tool
over MCP stdio. Same prompt per case, two variants of the same build toggled by
the kill-switch:

- **A** = `MCP_SITUATION_TRANSFORM=0` (pre-transform template output)
- **B** = `MCP_SITUATION_TRANSFORM=1` (situation-specific output)

The full tool output is captured (following the saved `tool-results/*.txt` file
when the client truncates a large result). An LLM judge (`claude -p`, output
order randomized) picks which is more problem-oriented. 5 analysis-family cases.

> **Fairness caveat.** The judge sees each side's recommendations section sliced
> to 3500 chars. Both sides get the same window, but A (the dense template wall)
> is shown mid-wall while B (collapsed) usually fits whole — a structural
> asymmetry that faithfully represents the consumer experience but leans toward
> B. Read the win margin with that in mind.

## Result: B wins 5/5

| case | tool | judge | problem-oriented | A adv/dir/size | B adv/dir/size |
|---|---|---|---|---|---|
| eval-taskforce | quality-evaluate | **B** | **B** | yes/no/67KB | no/yes/58KB |
| review-auth | code-review | **B** | neither | yes/no/69KB | no/yes/63KB |
| debug-ci-crash | issue-debug | **B** | neither | yes/no/229KB | no/yes/207KB |
| design-ratelimit | system-design | **B** | **B** | yes/no/125KB | no/yes/117KB |
| govern-eu-llm | policy-govern | **B** | **B** | yes/no/135KB | no/yes/120KB |

(adv = self-labels "advisory only"; dir = emits a request-anchored analysis
directive; size = tool output bytes.)

## Findings

1. **The transform is a clear, consistent win.** B beats A on every case. A
   always self-labels "advisory only" and emits no project-grounded directive;
   B never does, always anchors to the actual request, and frames a self-directed
   analysis citing real files/evidence. The original complaint is closed through
   the real MCP path, not just in unit tests.

2. **"Problem-oriented" only partly.** B is the *return-a-prompt directive* ("do
   this yourself against the real code, cite files"), not finished solutions. The
   judge rated B genuinely problem-oriented on 3/5 but "neither" on code-review
   and issue-debug — a directive to analyze, not a solution list. The calling LLM
   (which holds the project context) executes the directive — which a real agent
   does. **(Superseded: the MCP sampling round-trip mentioned in earlier updates
   was removed — see `docs/adr/0001-remove-sampler-round-trip.md`. The directive
   to an LLM caller IS the intended output, not a degraded fallback.)**

3. **Volume was the remaining problem — now addressed.** In the first run every
   response was 58–229KB: the transform collapsed the recommendation wall but the
   template **artifacts** (matrices, output templates, worked examples) still
   shipped. The `TRANSFORM_ARTIFACT_CAP` (6) added afterwards caps the merged
   artifact set on the collapsed result. `cites_files=0` on the tool output itself
   is by design (the directive asks the *consumer* to cite files).

## Update — after the artifact cap + sampling proof (2026-06-20)

The plan `.superpowers/plans/2026-06-20-finish-situation-transform.md` was
executed (4 implementation tasks, each reviewed clean).

- **Volume cut sharply.** Direct measurement (transform OFF vs ON, same build via
  the `MCP_SITUATION_TRANSFORM` kill-switch): quality-evaluate 19KB→11KB,
  issue-debug 71KB→24KB, code-review 23KB→9KB, policy-govern 42KB→15KB — a
  **42–66% reduction**. End-to-end through the real MCP, the task-force case
  dropped from **B=58KB to B=29KB** (~50%).
- **Still wins.** The 1-case end-to-end A/B re-run kept **winner = B** (A is the
  69KB advisory-only template wall; B is the 29KB request-anchored directive).
- **Sampling path (removed 2026-07-04).** This update originally reported a
  directive→findings path gated on MCP `sampling`. That round-trip was removed —
  it inverted the server's role by calling back to the client to analyze a
  project the client already holds context for. B is now always the directive,
  which is the intended output for an LLM caller. See
  `docs/adr/0001-remove-sampler-round-trip.md`.

## Update — target-orientation coverage expansion (2026-06-20)

A rubber-duck tribunal (`framing`/coverage rubric) found the transform reached
only **7 of 20** public tools, and **0 of 3** on the default slim surface. Plan
`.superpowers/plans/2026-06-20-target-orientation-coverage.md` was executed.

- **Coverage 7/20 → 13/20.** The transform was generalized from a single
  analysis contract to per-tool **profiles** (`{ domain, outputContract }`). A new
  `BUILD_OUTPUT_CONTRACT` now covers the 6 solution-producing tools
  (feature-implement, code-refactor, test-verify, strategy-plan, docs-generate,
  enterprise-strategy) alongside the 7 analysis tools. Verified by enumeration.
- **7 tools stay passthrough by design:** ~~meta-routing~~, routing-adapt,
  task-bootstrap, project-onboard, ~~agent-orchestrate~~, analogy-think,
  ~~prompt-engineering~~ — routers/orientation/orchestration/special, where
  "produce a plan for THIS request" is a category error (the B#2 lesson).
  *(Struck-through tools were later given their own profile kind — see the
  meta-routing / agent-orchestrate / prompt-engineering updates below; this
  bullet reflects the 13/20 state at the time.)*
- **Default-surface gap documented.** Domain tools are hidden in slim mode but
  callable; `MCP_FULL_SURFACE=true` lists them for discovery (README +
  `tool-surface-manifest.ts`). Note: `meta-routing` currently names no domain
  tool (`chainTo: []`) — making the router surface them is a tracked follow-up.

## Update — meta-routing routing fix (2026-06-20)

A second rubber-duck tribunal (coverage-v2 rubric) audited the 7 untransformed
tools per-tool. Verdict: **6 of 7 correctly untransformed**, but **`meta-routing`
was a genuine defect** — its mission is "decide which instruction(s) to invoke,"
yet it emitted a request-agnostic skill-scaffolding wall naming zero tools.

Fixed with a third transform profile **kind — routing** (not the analysis/build
collapse, which is a category error for a router): `ROUTING_OUTPUT_CONTRACT` +
an optional `candidateNextTools` on the profile (routers seed their own
candidates since their manifest `chainTo` is empty). `meta-routing` now collapses
its wall into a request-anchored decision naming the ordered domain instructions
(issue-debug, system-design, code-review, …), and shrank **42KB → 14KB**.
**Coverage 13/20 → 14/20.**

A follow-up mission-vs-output pass then caught one more: **`agent-orchestrate`**
— its mission "synthesize results … coherent unified output" produces a
deliverable and it carries a 21-item collapsible wall, yet it passed through.
Added an `ORCHESTRATION_OUTPUT_CONTRACT` (domain "agent orchestration") → it now
collapses into a tailored coordination plan. **Coverage 14/20 → 15/20.**

**prompt-engineering** was corrected in a follow-up: it has a full collapsible
wall (**27 recommendations, 24 seed-eligible**) for a genuine prompt request; an
earlier measurement artifact (off-topic probe) had incorrectly suggested 0 recs.
It was registered with `PROMPT_OUTPUT_CONTRACT` (domain "prompt asset"),
bringing coverage to **16/20**.

## Update — passthrough re-audit: 3 of the "excluded 4" were still walls (2026-06-21)

The 16/20 writeup claimed the remaining 4 tools were "correctly excluded." A
direct re-probe (dispatch through the real handler, transform OFF since they
carry no profile, with concrete requests) **disproved that for 3 of the 4** —
they still emitted the exact keyword→template wall this whole effort exists to
kill:

| tool | numbered recs | bytes | verdict |
|---|---|---|---|
| `analogy-think` | 0 | 146 | ✅ genuinely clean — gates to a request-specific metaphor (or "no analogy opens") |
| `routing-adapt` | 44 | 21KB | ❌ generic delegation-template wall |
| `project-onboard` | 10 | 11KB | ❌ generic scope-template wall |
| `task-bootstrap` | 75 | 45KB | ❌ biggest wall of all — and it is the **mandated session-start tool**, so it fired first every session |

The B#2 "category error" defence (don't force *solve THIS request* onto a
router/orientation tool) did **not** protect them: the established fix is to give
each tool a contract shaped to *its own* mission (as `meta-routing` got routing
and `agent-orchestrate` got orchestration), not a passthrough. So:

- **`routing-adapt`** → new `ADAPTIVE_ROUTING_OUTPUT_CONTRACT` (domain "adaptive
  routing policy") — it produces a bio-inspired routing-policy deliverable,
  structurally like `agent-orchestrate`. **16/20 → 17/20.**
- **`task-bootstrap` / `project-onboard`** → new `ORIENTATION_OUTPUT_CONTRACT`
  (a request-specific scope brief: in/out of scope + key ambiguities +
  recommended first instruction, **explicitly not a finished solution**). This
  orients rather than solves, so it is not the B#2 category error. **17/20 →
  19/20.**

Direct ON-vs-OFF measurement (same build, `MCP_SITUATION_TRANSFORM` kill-switch):
routing-adapt **21KB→12KB (43%)**, project-onboard **11KB→4.8KB (55%)**,
task-bootstrap **45KB→18KB (61%)**. Each collapse is covered by a
`tool-call-handler.test.ts` case asserting the request anchor + the
mission-shaped contract.

**`analogy-think` is now the sole correct passthrough** on the 20-tool public
surface (`physics-analysis` is internal, `public: false`). **Coverage 19/20.**

## Reproduce

```bash
npm run build
python3 scripts/ab_eval.py --eval-set evals/situation-transform.json --out /tmp/ab.json
# add --no-judge to skip the LLM grader (deterministic signals only)
```
