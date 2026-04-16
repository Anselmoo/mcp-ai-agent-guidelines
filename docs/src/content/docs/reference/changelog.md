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
