---
title: Changelog
description: All notable changes to mcp-ai-agent-guidelines, following Keep a Changelog and Semantic Versioning.
sidebar:
  label: Changelog
  order: 1
---

All notable changes to `mcp-ai-agent-guidelines` are documented here.
This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased] — Serena integration + memory backend rewrite

**Breaking changes.** The MCP server now treats Serena as the canonical cross-session memory + LSP-grade symbol backend. The custom TOON memory subsystem, the onboarding/orchestration CLI surface, and the per-tool-call disk writes that motivated them are removed.

### Removed (MCP tool surface)

- `agent-memory-*` (read/write/fetch/delete) — replaced by Serena memory (`mcp__serena__write_memory` / `read_memory` / `list_memories`), surfaced via the new 🧭 enrichment footer on every instruction response.
- `agent-session-*` (read/write/fetch/delete) — workspace state lives in Serena now.
- `agent-snapshot-*` (read/write/fetch/compare/delete) — drift tracking moved to Serena's LSP symbol surface.
- `orchestration-config` — `orchestration.toml` is no longer auto-bootstrapped; defaults stay in memory unless explicitly persisted via `model-discover` save.
- `project-onboard` — wizard-driven onboarding deleted; per-IDE skill hooks now live in the slim `mcp-cli onboard skills` command.
- `agent-workspace persist` / `fetch` / `compare` and `scope=artifact` — reduced to `list` / `read` on source files only.

### Removed (CLI surface)

- `mcp-cli onboard init` / `status` / `reset`
- `mcp-cli orchestration edit` / `run-pattern`
- `mcp-cli memory list` / `show` / `sessions`
- `mcp-cli report` / `export` / `analytics` / `docs`
- `mcp-cli status` / `info` / `dev` test utilities

The remaining commands are `hooks setup` / `print` / `remind-*` and `onboard skills` — see [CLI Reference](./cli).

### Removed (disk writes)

- `~/.mcp-ai-agent-guidelines/` — never written.
- `~/.cache/mcp-ai-agent-guidelines/sessions/` — Hebbian session warmup removed.
- `.mcp-ai-agent-guidelines/config/orchestration.toml` auto-bootstrap on missing file.
- Per-tool-call session-context + memory-artifact writes (now gated behind `MCP_LOCAL_MEMORY=true`).
- Workflow checkpoint files.

### Added

- `src/serena/client.ts` — `SerenaClient` interface with `AdvisorySerenaClient` (default, emits structured hints) and `ChildSerenaClient` (opt-in, spawns Serena via `MCP_SERENA_COMMAND`).
- 🧭 Serena enrichment footer on every instruction tool response.
- New env vars: `MCP_SERENA_COMMAND`, `MCP_SERENA_ARGS`, `MCP_SERENA_CWD`, `MCP_LOCAL_MEMORY`.
- `npm run test:mcp:serena` — opt-in e2e test (`MCP_SERENA_E2E=1`) that spawns `uvx serena` and verifies the full `code-review → ChildSerenaClient → footer` round-trip.
- New concept page: [Serena Integration](../concepts/serena-integration).

### Migration

If you depended on `agent-memory-*` / `agent-session-*` / `agent-snapshot-*`: install Serena (most MCP hosts already do) and let the host model follow the 🧭 footer. For automated end-to-end runs without a host-level Serena, set `MCP_SERENA_COMMAND=uvx` and `MCP_SERENA_ARGS="--from git+https://github.com/oraios/serena serena start-mcp-server --project <path>"`.

---

## [0.1.0-alpha.1] — 2026-04-08

### First pre-release of the MCP AI Agent Guidelines server.

This release ships a fully functional TypeScript ESM MCP server exposing **101 AI agent skills** as callable tools across 18 domain prefixes, with a complete model-routing layer, governance surface, and observability pipeline.

### Added

- **102 skills** across 18 domain prefixes (`req-`, `orch-`, `doc-`, `qual-`, `synth-`, `flow-`, `eval-`, `debug-`, `strat-`, `arch-`, `prompt-`, `adapt-`, `bench-`, `lead-`, `resil-`, `gov-`, `qm-`, `gr-`)
- **21 mission-driven instruction files** covering bootstrap, implement, refactor, debug, test, design, review, research, orchestrate, adapt, resilience, evaluate, prompt-engineering, plan, document, govern, enterprise, physics-analysis, meta-routing, onboard_project, initial_instructions
- **Model router** with role-name architecture (`free_primary`, `free_secondary`, `cheap_primary`, `cheap_secondary`, `strong_primary`, `strong_secondary`, `reviewer_primary`) backed by `orchestration.toml`
- **orchestration-model-discover** MCP tool — self-reporting LLM discovery that writes physical model IDs into `orchestration.toml` by role
- **orchestration-config-read / orchestration-config-write** MCP tools for non-interactive config management
- **`LlmProvider`** type extended to cover `"xai"` and `"mistral"` in addition to `"openai"`, `"anthropic"`, `"google"`, `"other"`
- **Observability pipeline** with structured JSON logging and `ObservabilityOrchestrator`
- **5 evaluation patterns** (parallel critique → synthesis, draft → review, majority vote, cascade with fallback, free triple parallel + synthesis)
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
- **All 30 physics skills** (`qm-*`, `gr-*`) gated behind `physics-analysis` instruction and guarded against default invocation
- **`scripts/verify_matrix.py`** — zero-orphan skill coverage enforcement
- **`scripts/generate-tool-definitions.py`** — auto-regenerates `src/generated/` from canonical registries
- **Biome** for lint + format; **lefthook** for pre-commit quality gates
- **Coverage reporting** with thresholds: statements 83%, lines 84%, functions 87%, branches 75%
