# MCP AI Agent Guidelines v0.13.x — Master Plan

> **Hybrid Approach**: Spec-Driven Development + Architecture Decision Records

## 📋 Executive Summary

This plan implements a comprehensive refactoring of the MCP AI Agent Guidelines from 30+ loosely coupled tools into a clean, hexagonal architecture with:

- **Harmonized tool options** across all 30+ tools
- **Output Strategy Layer** supporting 7+ output approaches
- **Cross-cutting capabilities** (workflows, scripts, diagrams) in ANY output
- **Agent handoffs** for multi-step workflows
- **Spec-Kit compatibility** for structured development

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MCP AI Agent Guidelines v0.13.x               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌─────────────┐     ┌─────────────────┐     ┌─────────────────┐  │
│   │   MCPServer  │────▶│ PolyglotGateway │────▶│ DomainServices  │  │
│   └─────────────┘     └────────┬────────┘     └─────────────────┘  │
│                                │                                     │
│                                ▼                                     │
│                       ┌─────────────────┐                           │
│                       │ OutputStrategy  │                           │
│                       │   + CrossCut    │                           │
│                       └─────────────────┘                           │
│                                │                                     │
│          ┌─────────┬──────────┼──────────┬─────────┐               │
│          ▼         ▼          ▼          ▼         ▼               │
│       ┌─────┐  ┌─────┐   ┌─────┐    ┌─────┐   ┌─────┐             │
│       │Chat │  │ RFC │   │ ADR │    │ SDD │   │TOGAF│             │
│       └─────┘  └─────┘   └─────┘    └─────┘   └─────┘             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## 📁 Plan Structure

```
plan-v0.13.x/
├── README.md                    # This file - plan overview
├── CONSTITUTION.md              # Project principles and constraints
├── TIMELINE.md                  # Sprint timeline and milestones
│
├── specs/                       # SDD Specifications
│   ├── SPEC-001-output-strategy-layer.md
│   ├── SPEC-002-tool-harmonization.md
│   ├── SPEC-003-error-handling-refactor.md
│   ├── SPEC-004-agent-handoffs.md
│   └── SPEC-005-speckit-integration.md
│
├── adrs/                        # Architecture Decision Records
│   ├── ADR-001-output-strategy-pattern.md
│   ├── ADR-002-tool-annotations-standard.md
│   ├── ADR-003-strangler-fig-migration.md
│   ├── ADR-004-error-code-enum.md
│   └── ADR-005-cross-cutting-capabilities.md
│
└── tasks/                       # Task Breakdown
    ├── TASKS-phase-1-discoverability.md
    ├── TASKS-phase-2-domain-extraction.md
    ├── TASKS-phase-3-broken-tools.md
    └── TASKS-phase-4-speckit-integration.md
```

## 🎯 Key Decisions Summary

| ADR                                                   | Decision                                            | Status   |
| ----------------------------------------------------- | --------------------------------------------------- | -------- |
| [ADR-001](adrs/ADR-001-output-strategy-pattern.md)    | Implement OutputStrategy pattern with 7 approaches  | Proposed |
| [ADR-002](adrs/ADR-002-tool-annotations-standard.md)  | Add ToolAnnotations to all tools                    | Proposed |
| [ADR-003](adrs/ADR-003-strangler-fig-migration.md)    | Use Strangler Fig pattern for incremental migration | Proposed |
| [ADR-004](adrs/ADR-004-error-code-enum.md)            | Replace if/else with ErrorCode enum                 | Proposed |
| [ADR-005](adrs/ADR-005-cross-cutting-capabilities.md) | Workflows/scripts as cross-cutting, not strategies  | Proposed |

## 📊 Timeline Overview

| Phase       | Duration   | Focus             | Key Deliverables                      |
| ----------- | ---------- | ----------------- | ------------------------------------- |
| **Phase 0** | Week 1-2   | Foundation        | ADRs, Specs, Constitution             |
| **Phase 1** | Week 3-4   | Discoverability   | Tool descriptions, annotations        |
| **Phase 2** | Week 5-7   | Domain Extraction | src/domain/, OutputStrategy interface |
| **Phase 3** | Week 8-9   | Broken Tools      | Fix 3 broken tools                    |
| **Phase 4** | Week 10-12 | Spec-Kit          | spec.md/plan.md generation            |

## 📈 Success Metrics

| Metric                   | Current  | Target    | Measurement        |
| ------------------------ | -------- | --------- | ------------------ |
| Tool utilization by LLMs | ~5 tools | 20+ tools | MCP trace analysis |
| Test coverage            | 90%      | 95%       | Vitest reports     |
| Broken tools             | 3        | 0         | Issue tracking     |
| Output formats supported | 1 (chat) | 7+        | Feature flags      |

## 🔗 Related Documents

| Document                  | Location                                                  | Purpose              |
| ------------------------- | --------------------------------------------------------- | -------------------- |
| Vision & Requirements     | [memories/v013_vision_mission_requirements.md](/memories) | Strategic foundation |
| Output Strategy Layer     | [memories/v013_output_strategy_layer.md](/memories)       | Architecture details |
| Project Health Assessment | [memories/v013_project_health_assessment.md](/memories)   | Gap analysis         |
| Research Journey          | [memories/v013_research_journey.md](/memories)            | Research sources     |

## 🚀 Getting Started

### For Implementers

1. Read [CONSTITUTION.md](CONSTITUTION.md) for project constraints
2. Review relevant [ADRs](adrs/) for architectural decisions
3. Pick up tasks from [tasks/](tasks/) directory
4. Follow Strangler Fig pattern (new alongside old)

### For Reviewers

1. Validate ADRs against Constitution principles
2. Review specifications for completeness
3. Check task breakdown covers all requirements
4. Ensure cross-cutting capabilities are addressed

---

*Plan Created: January 2026*
*Version: 0.13.x*
*Status: Active Development*
