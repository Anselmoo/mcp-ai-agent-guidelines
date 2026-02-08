# Spec Kit: MCP AI Agent Guidelines v0.14.x - Strategic Consolidation & Unified Architecture

**Version**: 1.0.0
**Status**: Active Planning
**Date**: 2026-02-01
**Total Duration**: 9 weeks (260 hours)
**Total Tasks**: 74 implementation tasks + 14 validation tasks

---

## Overview

A comprehensive 9-week refactoring initiative to transform mcp-ai-agent-guidelines from a fragmented collection of 30+ tools into a unified, maintainable platform with:

- **Single responsibility** components for each framework
- **Clear abstractions** with domain logic separated from tool interfaces
- **Unified prompt system** replacing 12+ prompt builders with single entry point
- **Quality enforcement** automation with CI gates
- **Cross-platform support** for Windows, Linux, and macOS

This plan consolidates BaseStrategy pattern, ExecutionTrace system, framework consolidation (30→11), Platform Abstraction Layer (PAL), and enforcement tools into a cohesive architecture following MCP SDK best practices.

## Contents

| Document                     | Purpose                                                           |
| ---------------------------- | ----------------------------------------------------------------- |
| [spec.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/spec.md)         | Full specification with requirements, objectives, and constraints |
| [plan.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/plan.md)         | Implementation plan with phases and timeline                      |
| [tasks.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/tasks.md)       | Detailed task breakdown with dependencies (74 tasks)              |
| [progress.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/progress.md) | Progress tracking and status updates                              |
| [adr.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/adr.md)           | Architecture decision records                                     |
| [roadmap.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/roadmap.md)   | Timeline, milestones, and deliverables                            |
| [issues/](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/issues/)         | GitHub issue templates ready for creation                         |

## Quick Start

1. **Review the specification** → Read [spec.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/spec.md) for complete requirements
2. **Understand decisions** → Review [adr.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/adr.md) for architectural rationale
3. **Follow the plan** → Execute phases per [plan.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/plan.md)
4. **Track progress** → Update [progress.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/progress.md) and [tasks.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/tasks.md)
5. **Create issues** → Use templates in [issues/](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/issues/) for GitHub tracking

## Phase Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        9-Week Implementation Timeline                    │
├─────────────────────────────────────────────────────────────────────────┤
│ Week 1-2  │ ████████ Phase 1: Core Infrastructure (24h)                 │
│           │          BaseStrategy, ExecutionTrace, Coordinators         │
│ Week 2-3  │ ████████ Phase 2: Strategy Migration (36h)                  │
│           │          Migrate 7 strategies, threshold arrays             │
│ Week 3-4  │ ████████ Phase 2.5: Unified Prompt Ecosystem (55h) ★        │
│           │          UnifiedPromptBuilder, legacy facades               │
│ Week 4-6  │ ████████████ Phase 3: Framework Consolidation (42h)         │
│           │          30→11 frameworks, GAP-002, GAP-004, GAP-008        │
│ Week 5-7  │ ████████████ Phase 4: Platform Abstraction (29h)            │
│           │          PAL interface, NodePAL, MockPAL                    │
│ Week 6-8  │ ████████████ Phase 5: CI/CD & Documentation (24h)           │
│           │          CI jobs, optimization, migration guide             │
│ Week 7-9  │ ████████████ Phase 6: Testing & Validation (50h)            │
│           │          90% coverage, CI matrix, enforcement tests         │
└─────────────────────────────────────────────────────────────────────────┘

★ Phase 2.5 is a BREAKING CHANGE phase with strict "no backward compatibility" policy
```

## Key Metrics

| Metric           | Baseline        | Target        | Improvement |
| ---------------- | --------------- | ------------- | ----------- |
| Tool Count       | 30+             | 11 frameworks | -63%        |
| Prompt Builders  | 12+             | 1 unified     | -92%        |
| Test Coverage    | ~70%            | ≥90%          | +20%        |
| CI Pipeline Time | 18min           | ≤12min        | -33%        |
| Platform Support | 1 (macOS/Linux) | 3 (+ Windows) | +200%       |
| Code Duplication | ~25%            | <5%           | -80%        |
| MCP Compliance   | ~60%            | 100%          | +40%        |

## Gap Remediation Summary

| Gap ID  | Title                                  | Priority | Target Phase | Status        |
| ------- | -------------------------------------- | -------- | ------------ | ------------- |
| GAP-001 | Tool Annotations Standard (ADR-002)    | P0       | Phase 2.5    | ⬜ Not Started |
| GAP-002 | Schema Examples for Zod                | P0       | Phase 3      | ⬜ Not Started |
| GAP-003 | Unified Prompt Tool Design             | P1       | Phase 2.5    | ⬜ Not Started |
| GAP-004 | Deprecation Warning Helpers            | P0       | Phase 3      | ⬜ Not Started |
| GAP-005 | Description CSV Export                 | P1       | Phase 5      | ⬜ Not Started |
| GAP-006 | MCP Apps Research                      | P2       | v0.15.x      | 🔮 Deferred    |
| GAP-007 | RAG Integration Evaluation             | P2       | v0.15.x      | 🔮 Deferred    |
| GAP-008 | Progress Standardization & Enforcement | P0       | Phase 3      | ⬜ Not Started |

## Enforcement Tools

| Tool                       | Purpose                           | Phase   |
| -------------------------- | --------------------------------- | ------- |
| `validate_uniqueness`      | Check tool description duplicates | Phase 3 |
| `validate_annotations`     | Verify ToolAnnotations coverage   | Phase 3 |
| `validate_schema_examples` | Check Zod .describe() coverage    | Phase 3 |
| `enforce_planning`         | Validate SpecKit compliance       | Phase 5 |
| `validate_progress`        | Normalize progress.md files       | Phase 5 |

## Related Documents

- [comprehensive-refactoring-plan.md](/plan-v0.14.x/basics/comprehensive-refactoring-plan.md)
- [master-refactoring-plan.md](/plan-v0.14.x/basics/master-refactoring-plan.md)
- [mcp-ai-agent-guidelines-refactoring-plan.md](/plan-v0.14.x/basics/mcp-ai-agent-guidelines-refactoring-plan.md)

## Contributors

- **Primary**: @mcp-tool-builder
- **Review**: @code-reviewer, @architecture-advisor
- **Testing**: @tdd-workflow
- **Security**: @security-auditor
- **Documentation**: @documentation-generator

---

**Status**: 🟡 Active Planning
**Created**: 2026-02-01
**Owner**: @copilot

*Generated by mcp_ai-agent-guid_speckit-generator with design-assistant SpecKit strategy*
