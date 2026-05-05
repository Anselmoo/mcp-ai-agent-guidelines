# Changelog

All notable changes to `mcp-ai-agent-guidelines` are documented here.
This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

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
