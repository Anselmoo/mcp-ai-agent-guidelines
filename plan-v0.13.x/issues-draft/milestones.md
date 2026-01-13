# GitHub Milestones for v0.13.x

Milestone definitions for automated creation via `scripts/create-github-issues.js --create-milestones`

## Format

Each milestone entry:
- `id`: Unique identifier (used in scripts)
- `title`: GitHub milestone title
- `description`: Milestone description
- `due_on`: ISO 8601 due date (YYYY-MM-DDTHH:MM:SSZ)
- `state`: `open` or `closed`

## Milestone Definitions

### M1: Foundation Complete
**Timeline**: End Week 2 (January 17, 2026)

```yaml
id: M1
title: "M1: Foundation (End Week 2)"
description: |
  Complete all planning documentation and establish foundation for refactoring work.

  Exit Criteria:
  - All 5 ADRs in "Proposed" status
  - All specifications drafted
  - GitHub Issues created for Phase 1
  - Team aligned on approach

  Deliverables:
  - CONSTITUTION.md
  - ADR-001: Output Strategy Pattern
  - ADR-002: Tool Annotations Standard
  - ADR-003: Strangler Fig Migration
  - ADR-004: Error Code Enum
  - ADR-005: Cross-Cutting Capabilities
  - SPEC-001: Output Strategy Layer
  - SPEC-002: Tool Harmonization
due_on: "2026-01-17T23:59:59Z"
state: open
```

### M2: Discoverability (End Week 4)
**Timeline**: End Week 4 (January 31, 2026)

```yaml
id: M2
title: "M2: Discoverability (End Week 4)"
description: |
  Fix LLM tool discoverability crisis — highest impact-to-effort ratio.

  Exit Criteria:
  - All 30+ tool descriptions rewritten in LLM-optimized format
  - ToolAnnotations added to all tools
  - Overlapping tools consolidated
  - Integration tests pass

  Deliverables:
  - Annotation presets for all tool categories
  - Rewritten tool descriptions (3 batches)
  - Unified prompt tool (consolidation of 3 tools)
  - Updated tool registration
  - Comprehensive integration tests
due_on: "2026-01-31T23:59:59Z"
state: open
```

### M3: Domain Layer (End Week 8)
**Timeline**: End Week 8 (February 28, 2026)

```yaml
id: M3
title: "M3: Domain Layer (End Week 8)"
description: |
  Extract domain logic and implement output strategy pattern.

  Exit Criteria:
  - Domain layer extracted for prompting, analysis, design
  - Output strategy pattern implemented
  - Error handling standardized
  - Gateway pattern in place
  - All tools migrated to new error handling

  Deliverables:
  - Error code enum (100+ codes)
  - Domain-specific error types
  - Output strategy implementations (ADR, RFC, SDD, Chat, TOGAF, Diagram)
  - Polyglot gateway (Markdown, JSON, YAML, Mermaid)
  - Migrated tools using new patterns
  - Domain integration tests
due_on: "2026-02-28T23:59:59Z"
state: open
```

### M4: Tools Fixed (End Week 10)
**Timeline**: End Week 10 (March 14, 2026)

```yaml
id: M4
title: "M4: Tools Fixed (End Week 10)"
description: |
  Fix all broken tools and implement missing functionality.

  Exit Criteria:
  - Mode-switcher fully functional
  - Project onboarding working end-to-end
  - Memory/context-optimizer operational
  - Agent orchestrator implemented
  - All tool descriptions updated

  Deliverables:
  - Mode manager with state transitions
  - Mode persistence and restoration
  - Project scanner and analyzer
  - Refactored project onboarding tool
  - Agent execution graph
  - Orchestration engine
  - Updated documentation
due_on: "2026-03-14T23:59:59Z"
state: open
```

### M5: Spec-Kit Core (End Week 12)
**Timeline**: End Week 12 (March 28, 2026)

```yaml
id: M5
title: "M5: Spec-Kit Core (End Week 12)"
description: |
  Implement core Spec-Kit functionality for spec/plan generation.

  Exit Criteria:
  - Constitution parser working
  - Spec-Kit tool suite functional
  - Integration with design-assistant
  - Gateway integration complete
  - Core generation workflows operational

  Deliverables:
  - Constitution.md parser
  - Spec-Kit TypeScript types
  - Spec generation tool
  - Plan generation tool
  - Task derivation logic
  - Progress generation
  - Design-assistant integration
  - Gateway wiring
  - Constitution validator
due_on: "2026-03-28T23:59:59Z"
state: open
```

### M6: Spec-Kit Validation (End Week 14)
**Timeline**: End Week 14 (April 11, 2026)

```yaml
id: M6
title: "M6: Spec-Kit Validation (End Week 14)"
description: |
  Add validation, testing, and polish to Spec-Kit.

  Exit Criteria:
  - Spec validator functional
  - Comprehensive test coverage
  - Integration tests passing
  - Documentation complete
  - Ready for production use

  Deliverables:
  - Spec validator with schema checking
  - Plan validator with dependency checks
  - Spec-Kit integration tests
  - Progress tracking tool
  - Updated progress tracker
  - E2E workflow tests
  - Comprehensive documentation
due_on: "2026-04-11T23:59:59Z"
state: open
```

### M7: Spec-Kit Progress (Ongoing)
**Timeline**: Throughout project

```yaml
id: M7
title: "M7: Spec-Kit Progress"
description: |
  Ongoing progress tracking and reporting for Spec-Kit development.

  Used for tasks that span multiple phases or provide continuous value.

  Deliverables:
  - Progress tracking tools
  - Status reporting
  - Metrics and analytics
  - Continuous documentation updates
due_on: "2026-04-11T23:59:59Z"
state: open
```

### M8: v0.13.0 Release (End Week 16)
**Timeline**: End Week 16 (April 25, 2026)

```yaml
id: M8
title: "M8: v0.13.0 Release (End Week 16)"
description: |
  Final release preparation and polish.

  Exit Criteria:
  - All tests passing
  - Documentation complete
  - Migration guide available
  - Breaking changes documented
  - Release notes finalized

  Deliverables:
  - Final bug fixes
  - Performance optimizations
  - Release documentation
  - Migration guide
  - CHANGELOG.md updated
  - v0.13.0 tagged and published
due_on: "2026-04-25T23:59:59Z"
state: open
```

### M-Test-Stable (Intermediate)
**Timeline**: Mid-Phase 1

```yaml
id: M-Test-Stable
title: "M2: Test-Stable"
description: |
  Intermediate milestone for Phase 1 test stabilization.

  Used for tasks that need to complete before final Phase 1 milestone.

  Deliverables:
  - Unified prompt tool registration
  - Test suite stabilization
  - Integration test coverage
due_on: "2026-01-24T23:59:59Z"
state: open
```

## Usage with create-github-issues.js

### Create all milestones:
```bash
node scripts/create-github-issues.js --create-milestones
```

### Create specific milestone:
```bash
node scripts/create-github-issues.js --create-milestones --milestone=M1
node scripts/create-github-issues.js --create-milestones --milestone=M2
```

### Dry run (preview):
```bash
node scripts/create-github-issues.js --create-milestones --dry-run
```

## Milestone Mapping to Issues

| Milestone               | Issue Count | Phases Covered         |
| ----------------------- | ----------- | ---------------------- |
| M1: Foundation          | TBD         | Phase 0                |
| M2: Discoverability     | 18          | Phase 1                |
| M2: Test-Stable         | 2           | Phase 1 (intermediate) |
| M3: Domain Layer        | 28          | Phase 2a, 2b           |
| M4: Tools Fixed         | 18          | Phase 3                |
| M5: Spec-Kit Core       | 10          | Phase 4a               |
| M6: Spec-Kit Validation | 8           | Phase 4b               |
| M7: Spec-Kit Progress   | 6           | Phase 4 (ongoing)      |
| M8: v0.13.0 Release     | TBD         | Final polish           |

---

**Last Updated**: 2026-01-03
