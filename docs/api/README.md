# API Reference

> Auto-generated tool reference for MCP AI Agent Guidelines v0.13.x / v0.14.x

## Overview

This server exposes **35+ MCP tools** organized into these categories:

| Category | Tools |
|----------|-------|
| Prompt Engineering | hierarchical-prompt-builder, code-analysis-prompt-builder, architecture-design-prompt-builder, ... |
| Code Quality | clean-code-scorer, code-hygiene-analyzer, iterative-coverage-enhancer |
| Security | security-hardening-prompt-builder |
| Design Workflow | design-assistant |
| Documentation | documentation-generator-prompt-builder, project-onboarding |
| Strategic Planning | strategy-frameworks-builder, gap-frameworks-analyzers, sprint-timeline-calculator |
| Spec-Kit | speckit-generator, validate-spec, update-progress |
| Visualization | mermaid-diagram-generator, spark-prompt-builder |
| Agent Orchestration | agent-orchestrator, memory-context-optimizer |
| Enforcement | validate-progress |

## Tool Descriptions CSV

A machine-readable CSV of all tool names and descriptions is available at:

```
artifacts/tool-descriptions.csv
```

Regenerate with:

```bash
npx tsx scripts/export-descriptions.ts
```

## Framework Facades (v0.14.x)

The `src/frameworks/` module provides 11 unified framework facades that delegate to the tools above:

1. **prompt-engineering** — build, evaluate, chain, flow, select-level
2. **code-quality** — score, hygiene, coverage, semantic
3. **design-architecture** — architecture, l9-engineering, enterprise-architect, design-session
4. **security** — assess, harden, model, audit
5. **testing** — suggest, enhance, coverage, workflow
6. **documentation** — generate, onboard, update
7. **strategic-planning** — swot, vrio, bsc, gap, sprint
8. **agent-orchestration** — orchestrate, design-session, handoff, list-agents, list-workflows
9. **prompt-optimization** — optimize, select-level, evaluate
10. **visualization** — diagram, ui-card
11. **project-management** — generate, validate, progress

## Related

- [Migration Guide v0.14.x](../guides/migration-v0.14.x.md)
- [Output Strategies](../output-strategies.md)
- [Tool Docs](../tools/)
