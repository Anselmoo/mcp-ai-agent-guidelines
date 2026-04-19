# mcp-ai-agent-guidelines

TypeScript ESM MCP server exposing public instruction tools backed by generated registries, workflow specs, and handwritten skill/runtime implementations.

## Build, test, and lint

```sh
npm ci
npm run build
npm run test
npm run test -- src/tests/runtime/mcp-server.test.ts
npx vitest run src/tests/runtime/mcp-server.test.ts -t "lists public, workspace, memory, session, snapshot, and orchestration tools"
npm run test:coverage
npm run check
npm run check:fix
npm run type-check
npm run quality
python3 -m unittest scripts.test_mcp_smoke
```

When changing the canonical registries or workflow graph, regenerate derived files before validating:

```sh
python3 scripts/generate-tool-definitions.py
npm run check:generated
```

Useful runtime entrypoints:

```sh
node dist/index.js
mcp-cli info
```

## High-level architecture

- `src/index.ts` is the MCP server entrypoint. It wires the SDK request handlers for tools, resources, and prompts, composes the runtime (`InstructionRegistry`, `SkillRegistry`, `ModelRouter`, `WorkflowEngine`, session store), and dispatches utility tools such as memory, session, snapshot, orchestration, visualization, and workspace operations.
- The public MCP surface is registry-driven, not handwritten in one place. `src/instructions/instruction-specs.ts` is the canonical public instruction registry, `src/skills/skill-specs.ts` is the canonical skill catalog plus legacy alias bridge, and `src/workflows/workflow-spec.ts` is the authoritative instruction-to-skill/state-machine coverage graph. Generated manifests and public tool definitions under `src/generated/` are emitted from those sources.
- Skill execution is tiered. `src/tools/skill-handler.ts` derives the execution tier from the skill prefix, applies the context membrane, and enforces extra gates such as physics justification before invoking a registered handler.
- Tool visibility is policy-driven. `src/tools/shared/tool-surface-manifest.ts` filters `ListTools` using `HIDDEN_TOOLS` and automatically hides `routing-adapt` unless `ENABLE_ADAPTIVE_ROUTING=true`, while `CallTool` still supports the hidden aliases internally.
- There are two user-facing entrypoints in the published package: `mcp-ai-agent-guidelines` for the MCP stdio server and `mcp-cli` for interactive onboarding/orchestration/status flows.

## Key conventions

- TypeScript ESM only: use `.js` import specifiers from `.ts` files because the project uses `"type": "module"` with NodeNext resolution.
- Do **not** edit `src/generated/**` directly. Update the canonical registries/specs (`src/instructions/instruction-specs.ts`, `src/skills/skill-specs.ts`, `src/workflows/workflow-spec.ts`) and regenerate.
- Public instruction tools share a single input shape: `{ request: string; context?: string; options?: object }`. `request` is the only required field, so keep new instruction surfaces consistent with that contract.
- Tests live under `src/tests/**`, not next to source files. Mirror the source subtree when that makes navigation clearer (`src/tests/runtime`, `src/tests/workflows`, `src/tests/skills/qm`, etc.).
- Skill IDs are prefix-driven and the prefixes matter operationally: `qm-*` and `gr-*` are physics-tier, `gov-*` is governance-tier, and `adapt-*`, `resil-*`, `strat-*`, and `orch-*` are treated as advanced-tier by the generic skill handler.
- New or renamed skills must stay reachable from at least one workflow. `scripts/verify_matrix.py` is part of `npm run quality` and fails if a skill becomes orphaned.
- Local orchestration state lives in `.mcp-ai-agent-guidelines/config/orchestration.toml`. Prefer role/class-based routing over hardcoded model IDs because the concrete model mapping is expected to change.
- If you touch workflow docs or the generated workflow graph, run `npm run check:workflow-docs` and `npm run check:generated` before concluding the change is done.
