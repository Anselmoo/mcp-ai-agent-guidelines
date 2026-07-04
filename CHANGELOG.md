# Changelog

All notable changes to `mcp-ai-agent-guidelines` are documented here.
This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Removed
- **QM/GR physics skills deleted outright** (~9k LOC: `src/skills/qm/`, `src/skills/gr/`, `physics-adapter-prototype.ts`, the `physics-analysis` instruction spec/workflow, the quorum gate, `physicsAnalysisJustification` plumbing, `ENABLE_PHYSICS_SKILLS`) — the Track C trials found zero load-bearing mappings; `analogy-think` is the surviving replacement. Skill count 102 → 72, domains 18 → 16
- **`project-onboard` merged into `task-bootstrap`** — the two tools shared the same orientation output contract and onboard's only chain target was task-bootstrap; its trigger language ("onboard", "what does this project do", "first session") moved into the task-bootstrap description. Slim surface is now `task-bootstrap` + `meta-routing`
- Unenforced `requiredPreconditions` on task-bootstrap (they referenced `agent-*-fetch` companions that are dispatchable but never advertised via `tools/list`); phantom `MCP_LOCAL_MEMORY` docs; stale TOON references in `.claude/rules/*`, session-start hook, and spec comments
- **MCP sampling round-trip removed** (`Sampler`/`SamplerRequest`/`SamplerResult` contracts, `src/tools/shared/sampler.ts`, `src/runtime/attach-sampler.ts`, `analyzeOrDirective`, and the `sampler`/`clientSupportsSampling` runtime fields). The round-trip inverted the server's role — it called *back* to the client to analyze a project the client already holds the context for. `directive + optional workspace grounding` is now the single, honest execution model, and the "⚠️ Directive mode" apology banner is gone: a sharp directive to an LLM caller is the intended output, not a degraded fallback. See the ADR at `docs/adr/0001-remove-sampler-round-trip.md`
- **BREAKING: `situationMode` dropped from the workflow-result envelope.** With the sampler gone the value was always `"directive"`, so the field is removed rather than pinned to a constant — envelope parsers must no longer expect it

### Added
- **Problem-specific output for headless/eval consumers (workspace grounding)**: `debug-root-cause`, `qual-code-analysis`, `arch-system`, and `req-scope` read the actual files a request references (via the already-injected `WorkspaceReader`, bounded by `guardRelativePath`) and match their catalogs against real file *content*, emitting `groundingScope: "workspace"` findings that cite the exact path with `workspace-file` evidence. New shared helper `src/skills/shared/workspace-grounding.ts` (`readReferencedFiles`/`matchProbes`/`buildWorkspaceEvidence`) + `extractReferencedPaths` in `recommendations.ts`. Its primary value is for headless / eval / non-LLM consumers that can't execute a directive themselves; for an LLM caller it is a sharper seed (concrete file evidence the caller may not have read yet), not a substitute for the caller reading the project itself.

### Fixed
- **Model router silently fell back for every config-routed skill**: `resolveForSkill()` returns physical model IDs (e.g. `gpt-5-mini`) but the profile registry is keyed by role alias (`free_secondary`) — added `aliasForPhysicalModelId()` translation so orchestration-config routing actually takes effect
- **meta-routing names a best match** via deterministic keyword ranking of routing candidates, instead of returning an unordered 12-tool menu
- Workspace listing failures now log a structured warning instead of silently returning an empty context
- Docs/src drift: physics-analysis and onboard pages removed from README/docs/rules; tool counts corrected (22 full-surface tools: 19 instructions + 3 utilities); phantom `agent-memory`/`agent-session`/`agent-snapshot` companion names replaced with the real `agent-workspace`

### Added
- End-to-end regression tests for the bootstrap → meta-routing `invokeInstruction` chain and the `## ⚡ Next required tool call` chainTo footer (parseable JSON, registered tool names only)
- Prompt-technique upgrades (after universal-creator/skills/shared/examples): prompt-chaining handoff contract in the chainTo footer, PAL-style `solve()` rendering contract in the methodology gate, few-shot example calls in the slim-surface tool descriptions
- `analogy-think` workflow tool with curated 12-entry metaphor catalog (mechanics, oscillators, thermodynamics, stat-mech, fluids, em, general); structural-feature gating; honest `Metaphor, not theorem.` header on every output; available only with `MCP_FULL_SURFACE=true`
- Methodology gate appended to `issue-debug`, `code-review`, `system-design`, `evidence-research`: prose section `## Methodology checks (not proofs)` + optional `methodology: MethodologyReport` payload field with five checks (`dimensional`, `conservation`, `fermi`, `scaling`, `falsifiability`)
- Cross-blind verification suite (`src/tests/verification/cross-blind-analogy.test.ts`) — intent-anchored regression for slim-default exclusion, honest header presence, no rigor-laundering strings (`theorem`, `proven`, `QED`) in any envelope payload, methodology gate presence on four host tools
- Reference doc page `docs/src/content/docs/reference/analogy-think.md` covering catalog schema, methodology gate, honest-labelling rationale, and when not to use either

### Notes
- Heuristic feature extractor + deterministic placeholder ranker + placeholder methodology runner ship in this entry; LLM-backed implementations are a planned follow-up

---

## [0.19.0] - 2026-06-17

### Added
- SessionStart hook script (`scripts/hooks/session-start-bootstrap.mjs`) emits task-bootstrap nudge to Claude/Copilot at session start (Track A)
- Structured errors with routing hints via `McpErrorPayload.nextTool` carrying recommended next tool; dispatcher validation errors point at `task-bootstrap` or `meta-routing` (Track B)
- Hybrid output envelope (V1) for workflow tools: human-readable markdown summary AND structured `__ENVELOPE_V1__:` block with typed payload (instructionId, model, steps, recommendations, artifacts); errors travel same envelope (Track B)

### Changed
- Slim tool surface is now default; only `task-bootstrap`, `meta-routing`, `project-onboard` exposed; set `MCP_FULL_SURFACE=true` to restore the full 25-tool surface (Track A)
- Markdown summary simplified: duplicate "Progress snapshot" section removed from prose; structured consumers read `payload.steps` instead (Track B)
- Internal: sdk-compatibility-lane and tool-coverage-matrix tests now stub `MCP_FULL_SURFACE` for full-surface assertions (Track B)

### Deprecated
- `physics-analysis` tool deprecated as production tool. Scoping spike (Track C) found 0 of 3 trials load-bearing; source remains for research but tool removed from routing surface (Track C)

## [0.18.1] - 2026-06-17

### Fixed
- add nanoid dep and honour MCP_WORKSPACE_ROOT across all entry points

## [0.18.0] - 2026-06-16

### Changed
- remove toon (#1517)

## [0.17.0] - 2026-05-05
### Added
- implement workspace root anchoring for state storage and enhance ToonMemoryInterface
- **mcp**: implement startup onboarding memory handling and enhance tool result summarization
- **mcp**: allow workspace writes when uninitialized

### Documentation
- **mcp**: document local write behavior for .mcp-ai-agent-guidelines

### Fixed
- **pr**: address PR #1467 review feedback
- **mcp**: make all state artifact writes atomic
- **mcp**: use atomic writes for memory artifacts and snapshots

### Changed
- **mcp**: improve workspace directory handling and cleanup in tests
## [0.16.0] - 2026-04-28
### Fixed
- update tool references and enhance memory tool tests for better context handling
## [0.15.4] - 2026-04-24
### Changed
- streamline onboarding process and enhance memory interface initialization

### Added
- enhance meta-routing instruction for better task classification and usage guidance

### Fixed
- address all Copilot review comments from PR #1461 and add push-ready gate
- update changelog to include recent enhancements in onboarding and meta-routing instructions
- update changelog to reflect recent enhancements in onboarding and meta-routing instructions
## [0.15.3] - 2026-04-21

_No notable changes recorded._

## [0.15.2] - 2026-04-20
### Added
- implement advisory bootstrap defaults for orchestration config
## [0.15.1] - 2026-04-19
### Added
- Added a dedicated Jest smoke-test lane for compiled ESM entrypoints alongside the main Vitest suite.
- Expanded orchestration and workflow regression coverage around retry behavior, resolver selection, and infrastructure factories.
- Lefthook integration upgraded to `repo-release-tools` v0.1.10: `rrt-update-unreleased` auto-writes changelog bullets on commit, `--strategy unreleased` pre-push guard replaces the per-commit file-diff check.

### Fixed
- enhance Jest testing support and improve orchestration config tests
- Fixed MCP server direct-execution detection for symlinked bin invocations.
- Clarified the published entrypoints: `mcp-ai-agent-guidelines` remains the MCP stdio server and `mcp-cli` is the interactive CLI.

---

## [0.15.0] — 2026-04-17

### First pre-release of the MCP AI Agent Guidelines server.

This release ships a fully functional TypeScript ESM MCP server exposing
**102 AI agent skills** as callable tools across 18 domain prefixes, with a
complete model-routing layer, governance surface, and observability pipeline.

### Added

- **102 skills** across 18 domain prefixes (`req-`, `orch-`, `doc-`, `qual-`,
  `synth-`, `flow-`, `eval-`, `debug-`, `strat-`, `arch-`, `prompt-`,
  `adapt-`, `bench-`, `lead-`, `resil-`, `gov-`, `qm-`, `gr-`)
- **21 mission-driven instruction files** covering bootstrap, implement,
  refactor, debug, test, design, review, research, orchestrate, adapt,
  resilience, evaluate, prompt-engineering, plan, document, govern,
  enterprise, physics-analysis, meta-routing, onboard_project, initial_instructions
- **Model router** with role-name architecture (`free_primary`, `free_secondary`,
  `cheap_primary`, `cheap_secondary`, `strong_primary`, `strong_secondary`,
  `reviewer_primary`) backed by `orchestration.toml`
- **orchestration-model-discover** MCP tool — self-reporting LLM discovery
  that writes physical model IDs into `orchestration.toml` by role
- **orchestration-config-read / orchestration-config-write** MCP tools for
  non-interactive config management
- **LlmProvider** type extended to cover `"xai"` and `"mistral"` in addition
  to `"openai"`, `"anthropic"`, `"google"`, `"other"`
- **`src/tools/model-discovery.ts`** — typed wiring for the model-discover tool
- **`src/tests/globalSetup.ts`** — vitest global setup that restores
  `orchestration.toml` from HEAD before each test run, preventing flakiness
  from live MCP server tool invocations
- **Observability pipeline** with structured JSON logging and
  `ObservabilityOrchestrator`
- **5 evaluation patterns** (parallel critique → synthesis, draft → review,
  majority vote, cascade with fallback, free triple parallel + synthesis)
- **PID homeostatic controller** for SLO-driven model tier selection
- **Ant Colony Optimization router** (`adv-aco-router`) with pheromone decay
- **Hebbian router** (`adv-hebbian-router`) for agent pairing reinforcement
- **Physarum router** (`adv-physarum-router`) for self-pruning topology
- **Redundant voter** (`adv-redundant-voter`) with NMR fault tolerance
- **Membrane orchestrator** (`adv-membrane-orchestrator`) for data-boundary enforcement
- **Replay consolidator** (`adv-replay-consolidator`) for orchestrator meta-learning
- **Quorum coordinator** (`adv-quorum-coordinator`) for decentralised task assignment
- **Clonal mutation** (`adv-clone-mutate`) for self-healing prompt recovery
- **Simulated annealing optimizer** (`adv-annealing-optimizer`) for workflow topology search
- **All 30 physics skills** (`qm-*`, `gr-*`) gated behind `physics-analysis`
  instruction and guarded against default invocation
- **`scripts/verify_matrix.py`** — zero-orphan skill coverage enforcement
- **`scripts/generate-tool-definitions.py`** — auto-regenerates `src/generated/`
  from `.github/skills/*/SKILL.md`
- **Biome** for lint + format; **lefthook** for pre-commit quality gates
- **Coverage reporting** with thresholds: statements 83 %, lines 84 %,
  functions 87 %, branches 75 %
- **`orchestration.toml`** as single orchestration authority with `strict_mode`,
  capability tags, workload profiles, resilience config, and routing rules

### Fixed

- Opus 4.6 correctly classified as `strong_primary` (reasoning model),
  not legacy `strong_secondary`
- `orchestration.toml` role names standardised: `free_primary = gpt-5.1-mini`,
  `strong_primary = sonnet-4.6` (`available = false` — reserved for synthesis
  and adversarial review only)
- CI workflow: `orchestration.toml` now tracked and validated via lefthook
  `tracked-orchestration-config` pre-commit hook
- All 1915 tests updated from physical model IDs to role-name IDs to match
  the role-name `MODEL_PROFILES` architecture
- `LlmLaneExecutor` switch branches and `ProviderEnvironmentVariable` added
  for xAI and Mistral providers
- Removed unused `canvas` devDependency that caused Docker builds to fail 
  on  `node:24-alpine` due to missing native system libraries (cairo, pango, etc.)
  required by node-gyp during `npm ci`.
- Added targeted regression coverage for core runtime modules, including
  `skill-cache`, `unified-orchestration`, and `llm-lane-executor`, to improve
  branch coverage and guard against future regressions.
- Added `.trivyignore` to exclude `CVE-2026-33671` from CI security scans until all dependencies are patched.

### Changed

- `MODEL_PROFILES` keyed by role names (`"free_primary"`, …) rather than
  physical model strings — physical IDs live exclusively in `orchestration.toml`
- `createBuiltinOrchestrationDefaults()` returns `models: {}` — physical
  models must be discovered and written by the `orchestration-model-discover`
  tool, not hardcoded in source

### Test coverage

- **1 915 tests** across **262 test files** — all passing
- Global setup guard (`src/tests/globalSetup.ts`) prevents TOML state leaks
  between interactive sessions and clean CI runs
- `src/tests/fixtures/orchestration.toml` fixture added — mirrors production
  `orchestration.toml` with `strict_mode = false` so test runs on CI and
  fresh clones never throw the "strict mode forbids fallback" error
- `tool-call-handler.test.ts` — `returns structured snapshot status payloads`
  now mocks `loadFingerprintSnapshot` so the handler enters the `present`
  branch (which includes `snapshotId`); previously failed in CI where no
  snapshot file was on disk

### CI

- Added `Lint & Code Quality (Lefthook)` job to `ci.yml` that runs
  `lefthook run pre-commit --command biome-check` — satisfies the required
  GitHub status check gate before the Quality Gate job
- `test` job bootstraps `orchestration.toml` from the test fixture before
  running `vitest` to ensure a clean, hermetic environment on all matrix nodes
- `quality` job now depends on the `lint` job for a serial fast-fail chain:
  `lint → quality → test → drift`
- CI test matrix updated from `[20, 22, 24]` to `[22, 24, latest]` — Node 20
  reached end-of-life and is dropped; `latest` added to track the current
  stable release automatically

---

## Links

- Repository: <https://github.com/Anselmoo/mcp-ai-agent-guidelines>
- Issues: <https://github.com/Anselmoo/mcp-ai-agent-guidelines/issues>
- MCP specification: <https://modelcontextprotocol.io>
