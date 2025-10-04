# Copilot Project Instructions

## Overview & architecture

- `src/index.ts` hosts the MCP server, wiring `@modelcontextprotocol/sdk` handlers for tools, prompts, and resources; keep it declarative and free of business logic.
- Tool families live under `src/tools/analysis`, `src/tools/design`, `src/tools/prompt`, and `src/tools/config`; prompts/resources sit in `src/prompts` and `src/resources`, with barrel files exporting deterministically.
- Design orchestration centers on `src/tools/design/design-assistant.ts`, which coordinates `confirmation-module.ts`, `constraint-manager.ts`, `cross-session-consistency-enforcer.ts`, `methodology-selector.ts`, and shared `types.ts` data shapes.
- Demos in `demos/` showcase tool outputs and double as regression artifacts; regenerate via `node demos/demo-tools.js` after a build.

## Coding conventions

- TypeScript is strict: rely on `zod` schemas for input parsing, avoid `any`, and return typed objects that match the schemas configured in `listTools`.
- The project targets Node 20+ with pure ESM; relative imports end in `.js` after build, so adjust import paths accordingly when moving files.
- Modules should stay functional/pure; singletons (e.g., `constraintManager`, `crossSessionConsistencyEnforcer`) manage shared state—reuse them instead of instantiating new objects.
- When touching design files, mirror existing patterns for session objects and constraint structures (see `src/tools/design/constraint-manager.ts`).

## Build, test, and quality workflow

- Core scripts (see `package.json`): `npm run build`, `npm run test:unit` (Node harness in `tests/unit`), `npm run test:all` (build + unit + integration + demo + MCP smoke), and `npm run quality` (TypeScript `--noEmit` plus Biome check).
- Vitest suites reside in `tests/vitest/**`; for coverage runs use `npx vitest run --coverage --maxWorkers=1` and, if memory is tight, prefix with `NODE_OPTIONS=--max-old-space-size=8192`.
- Lefthook (configured in `lefthook.yml`) executes formatting, type-checks, and the full `test:all` pipeline before pushes—expect these gates to run in CI as well.
- Coverage artifacts land in `coverage/` and feed the Codecov badge; keep high-signal tests near their target modules to maintain per-file coverage.

## Testing patterns

- Favor public APIs in specs: call `designAssistant.createSession`, `constraintManager.addConstraint`, or tool exports as the tests in `tests/vitest/unit/design-*.spec.ts` do.
- Build minimal `DesignSessionState` fixtures inline following the shapes in existing specs; accessing internals breaks future refactors.
- Use Vitest spies (`vi.spyOn`) when stubbing heavy collaborators—examples live in `tests/vitest/design-assistant-consistency-integration.test.ts`.
- Snapshot folders exist but are rarely used; prefer explicit assertions for deterministic text outputs (e.g., mermaid generator tests).

## Extending tools & prompts

- Adding a tool: place the implementation under `src/tools/<category>/`, export a typed handler, register it in `src/index.ts`, and cover it with a Vitest spec plus (if needed) a demo invocation.
- Adding a prompt/resource: create a deterministic module under `src/prompts` or `src/resources` and add it to the respective `index.ts` aggregator; avoid dynamic imports so the MCP manifest stays static.
- When amending `package.json` scripts or metadata, review Lefthook and CI expectations so automation stays in sync.
- Keep generated demos and documentation (`demos/*.md`, `coverage/index.html`) up to date when behavior changes—they are often inspected during reviews.

_Questions or unclear areas? Flag them so we can extend these instructions for future agents._
