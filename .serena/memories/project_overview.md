# Project Overview

## Purpose
MCP AI Agent Guidelines — a TypeScript MCP (Model Context Protocol) server with 40+ tools for AI agent best practices: hierarchical prompting, code hygiene analysis, design workflows, security hardening, agile planning, and more.

## Tech Stack
- **Runtime**: Node.js 22 (LTS), ESM modules
- **Language**: TypeScript (strict mode, `isolatedModules: true`)
- **Build**: `tsc` → `dist/`, target ES2023
- **Test**: Vitest (primary, `tests/vitest/`), legacy unit tests (`tests/unit/`)
- **Lint/Format**: Biome (tabs, double quotes, recommended rules)
- **Git hooks**: Lefthook (pre-commit: biome + gitleaks + type-check; pre-push: full quality + tests)
- **Coverage**: c8 / vitest --coverage, threshold 90%

## Key Source Directories
```
src/
  index.ts              # MCP server entry — all 40 tools registered here
  tools/                # MCP tool handlers (thin layer, validate + dispatch)
    design/             # Design workflow facade (most complex subsystem)
    prompt/             # Prompt builder tools
    analysis/           # Code quality, strategy framework tools
    enforcement/        # Enforcement/validation tools (validate-progress, etc.)
    shared/             # logger.ts, errors.ts, prompt-utils.ts
  domain/               # Pure business logic (no framework deps)
    prompts/            # Prompt domain (renderers, builders)
    speckit/            # SpecKit domain (generators, validators)
    router/             # FrameworkRouter + StrategyRegistry
    analysis/           # Scoring, hygiene analysis
  frameworks/           # 11 thin framework facades (delegating to tools/)
  platform/             # Platform Abstraction Layer (PAL)
  strategies/           # Output strategies (chat, speckit, etc.)
  schemas/              # Zod input schemas
tests/
  vitest/               # Primary tests (mirrors src/ structure)
  unit/                 # Legacy tests
```

## Version
Current: `0.13.1` — active development toward `v0.14.x`
