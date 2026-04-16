# Model Orchestration & Resource Pooling

## 1. Capability/Profile-Based Resolution
The runtime does not bind workflows to hard-coded provider model names. Model selection is resolved through capability tags and workload profiles declared in `.mcp-ai-agent-guidelines/config/orchestration.toml`, then mapped to physical model IDs by `src/config/orchestration-config.ts` and `src/models/model-router.ts`. `xstate` is used for workflow state management, not as the model resolver.

## 2. Capability-Driven Profiles
The environment uses capability tags plus named workload profiles in `.mcp-ai-agent-guidelines/config/orchestration.toml`. Builtin defaults live in `src/config/orchestration-defaults.ts` and are an explicit fallback only—they are not the normal runtime authority, and strict mode fails fast if the primary file cannot be loaded.

Implemented capability tags include `fast_draft`, `deep_reasoning`, `large_context`, `adversarial`, `classification`, `cost_sensitive`, `structured_output`, `code_analysis`, `security_audit`, `synthesis`, `math_physics`, and `low_latency`.

Implemented workload profiles include `meta_routing`, `bootstrap`, `implement`, `refactor`, `debugging`, `testing`, `design`, `code_review`, `research`, `orchestration`, `adaptive_routing`, `resilience`, `evaluation`, `prompt_engineering`, `strategy`, `documentation`, `governance`, `enterprise`, `physics_analysis`, `elicitation`, `benchmarking`, and `default`.

Examples from the builtin defaults:

- `meta_routing` requires `classification`, prefers `low_latency`, and falls back to `fast_draft`.
- `implement` requires `code_analysis` + `structured_output`, prefers `cost_sensitive`, and fans out to 2 lanes.
- `research` and `evaluation` both fan out to 3 lanes and prefer `cost_sensitive`.
- `governance` requires `security_audit` + `adversarial`, prefers `deep_reasoning`, and requires human-in-the-loop.
- `physics_analysis` requires `math_physics` + `deep_reasoning` with no fallback configured.

## 3. Dynamic Parallelism
Parallelism is driven by profile `fan_out` and orchestration patterns, not legacy tier names. In the builtin defaults, `research`, `evaluation`, `documentation`, and `benchmarking` fan out to 3 lanes; `prompt_engineering` and `implement` fan out to 2. The implemented orchestration patterns are `triple_parallel_synthesis`, `adversarial_critique`, `draft_review_chain`, `majority_vote`, and `cascade_fallback`, with synthesis/critique stages resolved back through the configured profiles and model availability rules.

## 4. Operational Verification & Debugging
The orchestration surface should be verified through a real MCP client, not only through direct unit calls. In practice, the most effective contributor loop is:

```bash
npm run build
npm run test:mcp:ts
npm run test:mcp:py:inspector
```

This combination checks both the internal helper implementations and the real `tools/list` → `tools/call` routing path exposed by the server entrypoint. For a focused debugging guide and known routing pitfalls, see [`04-mcp-debugging.md`](./04-mcp-debugging.md).
