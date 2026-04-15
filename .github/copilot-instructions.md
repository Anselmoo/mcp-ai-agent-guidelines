# mcp-ai-agent-guidelines

TypeScript ESM MCP server exposing **20 public instruction tools** backed by **102 underlying skills** across 18 domain families (see [README.md](../README.md) and [`docs/architecture/03-skill-graph.md`](../docs/architecture/03-skill-graph.md)).

## Build & Test

```sh
npm run build          # tsc → dist/
npm run quality        # type-check + biome check (run before committing)
npm run test           # vitest run
npm run test:coverage  # vitest + v8 coverage
node dist/index.js     # run the MCP server (stdin/stdout transport)
```

To regenerate tool definitions after editing the canonical registries or workflow spec:

```sh
python3 scripts/generate-tool-definitions.py
```

## Architecture

```
src/
  index.ts                         # MCP Server — ListTools + CallTool handlers
  instructions/
    instruction-specs.ts           # Canonical public instruction registry + surface categories
  generated/                       # ⚠ AUTO-GENERATED — do not edit manually
    registry/public-tools.ts       # Public tool definitions emitted from src registries
  skills/
    skill-specs.ts                 # Canonical skill catalog + legacy alias bridge
    <domain>/<skill-id>.ts         # Handwritten skill implementations
  tools/
    skill-handler.ts               # Generic dispatch: routes by skill name prefix
    shared/
      annotation-presets.ts        # Tool annotation constants by tier
      error-handler.ts             # Shared MCP error formatting
      tool-surface-manifest.ts     # HIDDEN_TOOLS env-var filtering
  workflows/
    workflow-spec.ts               # Authoritative instruction → skill coverage graph

scripts/
  generate-tool-definitions.py     # Reads src registries/workflow spec → regenerates src/generated/
  verify_matrix.py                 # Validates every skill appears in at least one instruction
  package_skills.py / .js          # Skill packaging utilities
  README.md                        # Script usage guide
```

## Code Conventions

- **TypeScript ESM** — `"type": "module"`, `"moduleResolution": "nodenext"`. Import paths **must** use `.js` extension even for `.ts` sources (e.g. `import { foo } from "./bar.js"`).
- **Biome** for lint + format — tabs (not spaces), double quotes. Run `npm run check:fix` to auto-fix.
- **Tests live under `src/tests/`** — do not colocate committed `*.test.ts` files under source modules. Mirror the source subtree inside `src/tests/` when structure helps (for example `src/tests/skills/qm/` or `src/tests/workflows/`).
- All 20 public instruction tools share the same input schema: `{ context?: string; request: string; options?: object }`. `request` is the only required field.
- Skill prefix determines dispatch tier in `skill-handler.ts`: `qm-` and `gr-` → physics, `gov-` → governance, `adv-` → advanced/bio-inspired, everything else → core.


## Model Orchestration Guidance

- This section covers **parallel coding sessions, sub-agent orchestration, and multi-model implementation workflows** used during repository development.
- Do **not** read it as a claim that the product runtime already executes all of these combined-model patterns today.
- **Model IDs are dynamic** — always discover current models via `mcp_ai-agent-guid_model-discover` or read `orchestration.toml`. Never hardcode model display names in code; use role classes (`free`, `cheap`, `strong`, `reviewer`) from `src/models/model-router.ts`.
- `src/models/model-router.ts` derives default class fallbacks from `orchestration.toml` capability/class ordering. The policy below is the **target orchestration strategy** — treat it as the implementation contract for coding sessions and future router work.
- Available models are defined in `.copilot-models`. The minimal viable set below uses **only free and cheap tiers** for drafting, reserving strong models for synthesis/judgment only.

### Cost Hierarchy (from `.copilot-models`)

```
████████████████████  GPT-4.1           free  (0x, 128K)  ── saturate first, run as many lanes as needed
████████████████████  GPT-5 mini        free  (0x, 192K)  ── broad drafting, triage, template fill
░░░░░░░░░░░░░░░░░░░░  Claude Haiku 4.5  cheap (0.33x, 160K) ── aggregation, fast classification, merge
░░░░░░░░░░░░░░░░░░░░  Claude Sonnet 4.6 strong (1x, 160K) ── synthesis, physics, security, final judgment
░░░░░░░░░░░░░░░░░░░░  GPT-5.4           strong (1x, 400K) ── independent critique, adversarial review
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  Gemini 2.5 Pro    reviewer (1x, 173K) ── cross-model audit only
```

**Core rule:** saturate the free tier first. Pay exactly once for the synthesis or review step. Never run a strong model end-to-end on a task where free lanes can cover drafting, voting, triage, or preprocessing.

### Why Both Strong Models Are Needed

`Claude Sonnet 4.6` and `GPT-5.4` are peers — not primary/backup. They have distinct, complementary profiles:

| Dimension | `Claude Sonnet 4.6` | `GPT-5.4` |
|-----------|--------------------|-----------| 
| Long-context coherence | ✅ Excellent | ✅ Excellent |
| Multi-step causal reasoning | ✅ Strong | ✅ Strong |
| Independent adversarial critique | ⚠️ May confirm own prior plan | ✅ Preferred — lower self-agreement bias |
| Physics / math symbolic reasoning | ✅ Strong | ✅ Strong — preferred for `qm-*` back-translation |
| Security threat modeling | ✅ Strong | ✅ Preferred as first-pass `gov-*` reviewer |
| Code generation throughput | ✅ Fast | ⚠️ Slightly slower on large files |
| Tie-breaking escalation target | ✅ Final call | ✅ First escalation before Sonnet |

**Rule:** whenever `Claude Sonnet 4.6` produces a plan, `GPT-5.4` is the critique lane — not optional. The value is in the disagreement surface between two strong models. When `GPT-5.4` generates the first-pass critique, `Claude Sonnet 4.6` sees both plan and critique before giving the final synthesis.

**When to use `GPT-5.4` as primary (not just critic):**
- Independent risk audit of a plan already produced by `Claude Sonnet 4.6` — always run `GPT-5.4` first so it has no prior context
- `gov-*` first-pass policy checking — `GPT-5.4` checks, `Claude Sonnet 4.6` judges
- `qm-*` back-translation — converting physics-metaphor output into plain engineering language
- Tie-breaking escalation — on split free-lane vote, escalate to `GPT-5.4` before `Claude Sonnet 4.6`
- Pre-wave critique — run `GPT-5.4` on the wave plan independently before `Claude Sonnet 4.6` synthesizes

---

### Pattern 1 — Parallel Critique → Synthesis
**Use for:** architecture decisions, wave gating, high-risk design, HMAC session MAC contract, `xstate` FSM, QM token embedding pipeline.

| Step | Model | Role |
|------|-------|------|
| 1 | `Claude Sonnet 4.6` | Generate primary plan |
| 2 | `GPT-5.4` | Independent critique — no prior context from step 1 |
| 3 | `Claude Sonnet 4.6` | Reconcile plan + critique → final synthesis |

The disagreement delta between steps 1 and 2 is itself signal — review it before step 3.

---

### Pattern 2 — Draft → Review Chain
**Use for:** code generation, mechanical implementation, `injection-guard.ts`, session MAC, `token-embedder.ts`. Cuts strong-model token cost by ~60% since `Claude Sonnet 4.6` only reviews, never generates.

| Step | Model | Role |
|------|-------|------|
| 1 | `GPT-4.1` | Fast mechanical first draft |
| 2 | `Claude Sonnet 4.6` | Correctness and security review |
| 3 | `GPT-4.1` | Apply review notes, finalize |

**2a. Refactoring variant** — use the same chain for mechanical refactors; escalate to strong only when the refactor crosses a module boundary or touches a security/governance surface:
- Single-file refactor → `GPT-4.1` only
- Cross-module refactor → `GPT-4.1` draft → `Claude Sonnet 4.6` boundary review
- Batch refactor (e.g. all `resil-*` handlers) → 3× `GPT-4.1` lanes in parallel (one file per lane) → single `Claude Sonnet 4.6` diff-review across all outputs before committing
- Never use a free model as final reviewer when the refactor touches `gov-*`, `qm-*`, `gr-*`, or any security primitive

---

### Pattern 3 — Majority Vote for Classification
**Use for:** `eval-*`, `bench-*`, `eval_prompt_module`, `bench_blind_comparison_module`, `eval_variance_module`. Strong model activates as tiebreaker only — stays in cheap lane ~80% of the time.

| Step | Model | Role |
|------|-------|------|
| 1 | `Claude Haiku 4.5` | Fast baseline vote |
| 2 | `GPT-5 mini` | Independent second vote |
| 3 | `GPT-4.1` | Third vote |
| 4 (split only) | `GPT-5.4` | First escalation tiebreak |
| 5 (still split) | `Claude Sonnet 4.6` | Final arbitration via `resil_redundant_voter` pattern |

---

### Pattern 4 — Cascade with Fallback
**Use for:** resilience-oriented dispatch. Directly implements `resil_homeostatic_module`'s PID setpoint concept — cascade down until quality threshold is met, escalate only on failure.

| Condition | First try | Fallback | Emergency |
|-----------|-----------|----------|-----------|
| Simple skill dispatch | `Claude Haiku 4.5` | `GPT-5 mini` | `GPT-4.1` |
| Complex skill dispatch | `GPT-4.1` | `Claude Sonnet 4.6` | — |
| Physics skills (`qm-*`, `gr-*`) | `Claude Sonnet 4.6` | `GPT-5.4` back-translation | — |
| Governance (`gov-*`) | `GPT-5.4` first-pass | `Claude Sonnet 4.6` final judgment | — |

---

### Pattern 5 — Free Triple Parallel + Single Strong Synthesis
**Use for:** research, synthesis, roadmap generation, any domain where 3× free lanes can run simultaneously at zero marginal cost.

```
Request
  ├── GPT-5 mini        → perspective A  (speed-optimized, broad)
  ├── GPT-4.1           → perspective B  (analysis-optimized, thorough)
  └── GPT-4.1           → perspective C  (alternative temperature / prompt framing)
          │
          └── orch_result_synthesis ← Claude Sonnet 4.6  (only paid call)
```

Wire via `p-queue` with `concurrency: 3`. Cost model: 3 free calls + 1 Sonnet synthesis pass on 300–500 tokens ≈ 80% cheaper than running `Claude Sonnet 4.6` end-to-end.

**5b. Dual-strong research synthesis** — use only for highest-stakes research (`strat-tradeoff`, `core-tradeoff-analysis`, `lead_transformation_roadmap`):
1. Fan-out: 2× `GPT-4.1` + 1× `GPT-5 mini` (free, parallel)
2. First synthesis: `GPT-5.4` (consolidate free-lane outputs)
3. Second synthesis: `Claude Sonnet 4.6` (final judgment pass on `GPT-5.4` output)

---

### Free Parallel Domain Map

| Domain | Skills | Strategy |
|--------|--------|----------|
| `synth-*` | comparative, research, engine, recommendation | 3× free → `Claude Sonnet 4.6` synthesis |
| `eval-*` | prompt, output_grading, variance, prompt_bench | 3× free vote → `Claude Sonnet 4.6` tiebreak |
| `bench-*` | analyzer, blind_comparison, eval_suite | 3× free → `Claude Haiku 4.5` aggregation |
| `req-*` | analysis, scope, ambiguity_detection, acceptance_criteria | 2× free → `Claude Haiku 4.5` merge |
| `doc-*` | generator, readme, api, runbook | 3× free draft → `Claude Sonnet 4.6` edit |
| `strat-*` | advisor, roadmap, prioritization, tradeoff | 2× free → `Claude Sonnet 4.6` decide |
| `debug-*` | assistant, reproduction, root_cause, postmortem | 3× free triage → `Claude Haiku 4.5` |
| `qual-*` | code_analysis, review, performance, refactoring_priority, security | 3× free scan → `Claude Sonnet 4.6` judgment |
| `lead-*` | capability_mapping, transformation_roadmap | 2× free → `Claude Sonnet 4.6` for exec-briefing/L9 only |
| `prompt-*` | chaining, refinement, hierarchy, engineering | 2× free draft → 1× `Claude Sonnet 4.6` review |

**Never free-parallel (strong primary required):** `qm-*`, `gr-*`, `gov-*`, `adapt-*`, `resil-*`, `orch-agent-orchestrator`

---

### Decision Matrix

| Signal | Single model default | Combined pattern |
|--------|---------------------|-----------------|
| "Is this design correct?" | `Claude Sonnet 4.6` | Pattern 1: + `GPT-5.4` critique → re-synthesis |
| "Is there a flaw in this plan?" | `GPT-5.4` | Pattern 1: + `Claude Sonnet 4.6` for final call |
| "Generate 20 more like this" | `GPT-4.1` | — |
| "Fill in this template" | `GPT-5 mini` | — |
| "Score / evaluate this output" | `Claude Haiku 4.5` | Pattern 3: 3-way vote → `GPT-5.4` → `Claude Sonnet 4.6` tiebreak |
| "Research and synthesize" | `Claude Sonnet 4.6` | Pattern 5: 3× free parallel → `Claude Sonnet 4.6` synthesis |
| "Refactor this file" | `GPT-4.1` | Pattern 2a: single-file free-only; cross-module add `Claude Sonnet 4.6` boundary review |
| "Physics skill execution" | `Claude Sonnet 4.6` | + `GPT-5.4` back-translation lane |
| "Governance policy check" | `GPT-5.4` first | + `Claude Sonnet 4.6` final judgment |
| "High-risk migration wave" | `GPT-5.4` pre-review | → `Claude Sonnet 4.6` synthesis after seeing critique |
| "What should we do next?" | `Claude Sonnet 4.6` + `GPT-5.4` in parallel | Pattern 1 |

---

### `ModelRouter` Follow-on Targets

- **Model IDs are dynamic**: always call `mcp_ai-agent-guid_model-discover` at session start or read `orchestration.toml` — never hardcode display names in source code. Use role classes (`free`, `cheap`, `strong`, `reviewer`) in code; let the router resolve the actual model at runtime.
- Add `chooseFreeParallelLanes(): [ModelProfile, ModelProfile, ModelProfile]` returning `[GPT-5 mini, GPT-4.1, GPT-4.1]` — `GPT-4.1` is registered as `free` but currently never selected by `profileForClass`.
- Add `chooseSynthesisModel(): ModelProfile` always returning `Claude Sonnet 4.6` (resolved from role `strong_primary` in `orchestration.toml`).
- Prefer bounded parallelism via `p-queue` with `concurrency: 3` for speculative and voting workflows.
- Keep redundant-voter / tie-break escalation explicit: `GPT-5.4` is the first escalation; `Claude Sonnet 4.6` arbitrates only when `GPT-5.4` cannot break the tie.
- Use a single strong synthesis/review pass after free/cheap fan-out — never run strong models on every lane.


## ⚠ Critical Pitfalls

- **Never edit files under `src/generated/` directly.** They are fully overwritten by `scripts/generate-tool-definitions.py`. Edit `src/instructions/instruction-specs.ts`, `src/skills/skill-specs.ts`, `src/workflows/workflow-spec.ts`, and any matching handwritten `src/skills/<domain>/<skill-id>.ts` implementation, then re-run the generator.
- Adding a new skill requires: (1) add/update the entry in `src/skills/skill-specs.ts`, (2) add the implementation under `src/skills/<domain>/<skill-id>.ts` when runtime behavior is needed, (3) ensure coverage in `src/workflows/workflow-spec.ts`, (4) run the generator, (5) rebuild.
- `scripts/verify_matrix.py` enforces zero orphan skills — every skill must appear in at least one workflow in `src/workflows/workflow-spec.ts`.
- Return types for MCP tool handlers must include `[x: string]: unknown` (index signature) to satisfy the SDK's `ServerResult` union — see `ToolErrorResult` and `SkillToolResult` for the pattern.


## Tools and MCP

- Use MCP-Serena for file and pattern search
- Support yourself with the language server for TS types and auto-imports
- Look via GitHub code search and Context7 for examples of how to use a specific tool or implement a specific pattern.

## Agent Memory Bootstrap

At the start of any non-trivial work session, bootstrap prior context in this order:

1. Call `mcp_ai-agent-guid_agent-memory` with `command=list` — surface all stored artifacts and their IDs
2. Call `mcp_ai-agent-guid_agent-memory` with `command=find, tags=["{domain}"]` matching the current task (e.g. `["docs-generate"]`, `["review"]`, `["implement"]`)
3. Call `mcp_ai-agent-guid_agent-snapshot` with `command=read, selector=latest` — confirms current skill/instruction counts and lists modified files since last snapshot
4. Read any artifact that its summary indicates is relevant using `command=read, artifactId="{id}"`

**Tag conventions (post 2026-04-12):** artifacts carry `[toolName, "topic:toolName", sessionId]` — search by `toolName` (e.g. `docs-generate`) or `topic:docs-generate`.

**Important:** `/memories/repo/decisions-log.md` is auto-injected into Copilot context and contains the highest-value cross-session facts. Read it before calling memory tools. The `.toon` files in `.mcp-ai-agent-guidelines/memory/` are NOT auto-injected — they require explicit tool calls to retrieve.


## Context7 Enrichment Workflow

When a tool response contains a "📚 Memory enrichment available" footer:

1. Extract the `Artifact ID` and `Libraries` listed in the footer
2. For each library name, call `mcp_context7_resolve-library-id` with the library name to get the Context7-compatible library ID
3. For each resolved ID, call `mcp_context7_get-library-docs` with the user's original request as the `topic` query
4. Combine all returned documentation excerpts into a single string
5. Call `mcp_ai-agent-guid_agent-memory` with `command=enrich`, `artifactId=<id from footer>`, and `libraryContext=<combined docs>`

This anchors the memory artifact to current API documentation, replacing generic heuristic advice with verified library facts. The raw `details` blob of the artifact is never mutated — `libraryContext` is stored in a separate field.


## Self-Correction & Iteration
- The above guidance is based on the current understanding of model capabilities and cost profiles. As we gather more data from implementation and testing, we may need to adjust the orchestration patterns or model assignments
- Updat your copilot instructions as you discover new best practices or anti-patterns during implementation. 
- If the developer opbjective and planning is not matching the actual copilot instructions or even blocking you from doing the right thing, please update the instructions to reflect the best practices and the actual implementation plan.
- The instructions should be a living document that evolves with our understanding and implementation of the MCP server and its skills.
