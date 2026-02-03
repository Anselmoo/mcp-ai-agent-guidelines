# Specification: MCP AI Agent Guidelines v0.14.x - Strategic Consolidation & Unified Architecture

**Status**: Approved
**Version**: 1.0.0
**Date**: 2026-02-01
**Authors**: AI Agent Guidelines Team

---

## Executive Summary

### Problem Statement

The current MCP AI Agent Guidelines codebase (v0.13.x) exhibits several critical issues:

1. **Tool Fragmentation**: 30+ individual tools with semantic overlap
2. **Prompt Builder Scatter**: 12+ builders doing similar work with inconsistent patterns
3. **Black Box Strategies**: No visibility into decision-making, no feedback loops
4. **High Cyclomatic Complexity**: Score-mapping functions with 6-8 sequential if/elif branches
5. **Inconsistent Patterns**: Three different Zod schema patterns across 50+ files
6. **Platform Limitation**: Unix-only code (46 shell scripts, 0 PowerShell)
7. **CI/CD Redundancy**: Same tests run 4 times across different workflows

### Solution Overview

This specification defines a comprehensive refactoring initiative to:

- **Consolidate** 30+ tools → 11 high-level frameworks
- **Implement** mandatory HITL feedback for all strategies via BaseStrategy<T>
- **Refactor** branching logic to data-driven threshold patterns
- **Establish** cross-platform support via Platform Abstraction Layer (PAL)
- **Optimize** CI/CD to reduce runtime by 30%
- **Achieve** ≥90% test coverage

---

## 1. Objectives

### 1.1 Primary Objectives (P0 - Must Have)

| ID      | Objective                                                                                                                                                       | Success Metric                       |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| OBJ-001 | Consolidate 30+ fragmented tools into 11 unified frameworks with clear single responsibility and routing patterns                                               | Framework count ≤11                  |
| OBJ-002 | Implement unified prompt system replacing 12+ prompt builders with single entry point (UnifiedPromptBuilder) with registry and template engine                  | Single entry point verified          |
| OBJ-003 | Achieve 100% MCP compliance with ToolAnnotations standard (ADR-002) for all 30+ tools                                                                           | validate_annotations passes          |
| OBJ-005 | Achieve ≥90% test coverage through refactoring high cyclomatic complexity code using threshold arrays                                                           | Vitest coverage ≥90%                 |
| OBJ-007 | Implement enforcement automation layer with CI gates (validate_uniqueness, validate_annotations, validate_schema_examples, enforce_planning, validate_progress) | All CI gates active                  |
| OBJ-008 | Implement mandatory HITL (Human-In-The-Loop) feedback patterns for ALL strategies via BaseStrategy<T>                                                           | All 7 strategies extend BaseStrategy |
| OBJ-009 | Standardize progress.md files across Spec-Kits with enforcement tool and canonical Handlebars template (GAP-008)                                                | validate_progress passes             |

### 1.2 Secondary Objectives (P1 - Should Have)

| ID      | Objective                                                                                           | Success Metric          |
| ------- | --------------------------------------------------------------------------------------------------- | ----------------------- |
| OBJ-004 | Establish cross-platform support via Platform Abstraction Layer (PAL) for Windows, Linux, and macOS | CI matrix passes        |
| OBJ-006 | Eliminate code duplication to <5% from current ~25% through framework consolidation                 | Code duplication metric |
| OBJ-010 | Context7 library integration for ADR generation and documentation retrieval                         | Integration verified    |

### 1.3 Deferred Objectives (P2 - v0.15.x)

| ID      | Objective                    | Rationale                  |
| ------- | ---------------------------- | -------------------------- |
| OBJ-011 | Full MCP Apps implementation | Research only in v0.14.x   |
| OBJ-012 | Complete RAG pipeline        | Evaluation only in v0.14.x |

---

## 2. Requirements

### 2.1 Functional Requirements

#### Phase 1: Core Infrastructure (Weeks 1-2, 24h)

| ID      | Requirement                                                                                                                                                                                 | Priority |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| REQ-001 | Create BaseStrategy<T> abstract class enforcing consistent interface, validation, and ExecutionTrace logging. All 7 strategies must extend this base class with mandatory summary feedback. | P0       |
| REQ-002 | Implement ExecutionTrace class for decision logging with recordDecision(), recordMetric(), recordError(), toJSON(), and toMarkdown() exports for transparency.                              | P0       |
| REQ-003 | Create SummaryFeedbackCoordinator for mandatory HITL approval workflow with timeout, retries, and confidence display.                                                                       | P0       |
| REQ-004 | Create AgentHandoffCoordinator with anchor points for SpecKit workflow (PRD-REVIEW, IMPLEMENTATION-GUIDANCE, TASK-BREAKDOWN, PR-REVIEW, INTEGRATION-COMPLETE).                              | P0       |

#### Phase 2: Strategy Migration (Weeks 2-3, 36h)

| ID      | Requirement                                                                                                                                        | Priority |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| REQ-005 | Migrate all 7 strategies (speckit, togaf, adr, rfc, enterprise, sdd, chat) to extend BaseStrategy<T> with mandatory feedback and execution traces. | P0       |
| REQ-006 | Convert all score-mapping functions from if/elif chains to data-driven threshold arrays for testability and reduced cyclomatic complexity.         | P0       |

#### Phase 2.5: Unified Prompt Ecosystem (Weeks 3-4, 55h) ★ BREAKING CHANGE

| ID      | Requirement                                                                                                                    | Priority |
| ------- | ------------------------------------------------------------------------------------------------------------------------------ | -------- |
| REQ-007 | Implement UnifiedPromptBuilder as single entry point replacing 12+ prompt builders with registry pattern and template engine.  | P0       |
| REQ-008 | Create legacy facades for backward compatibility (hierarchical-facade.ts, domain-neutral-facade.ts) with deprecation warnings. | P0       |
| REQ-009 | Phase 2.5 has strict "no backward compatibility" policy for internal prompt builder APIs.                                      | P0       |

#### Phase 3: Framework Consolidation (Weeks 4-6, 42h)

| ID      | Requirement                                                                                                                                                                                                                                                                                                     | Priority |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| REQ-010 | Consolidate 30+ analysis frameworks into 11 unified frameworks: Prompt Engineering, Code Quality & Analysis, Design & Architecture, Security & Compliance, Testing & Coverage, Documentation, Strategic Planning, AI Agent Orchestration, Prompt Optimization, Visualization & Diagramming, Project Management. | P0       |
| REQ-011 | Implement GAP-002 Schema Examples for Zod with .describe() coverage ≥80% across all schemas.                                                                                                                                                                                                                    | P0       |
| REQ-012 | Implement GAP-004 Deprecation Warning Helpers with warnDeprecated() function tracking oldName, newName, removalVersion.                                                                                                                                                                                         | P0       |
| REQ-013 | Implement GAP-008 Progress Standardization with validate_progress tool, progress-template.hbs canonical template, and dry-run + --apply patch generation.                                                                                                                                                       | P0       |

#### Phase 4: Platform Abstraction (Weeks 5-7, 29h)

| ID      | Requirement                                                                                                                      | Priority |
| ------- | -------------------------------------------------------------------------------------------------------------------------------- | -------- |
| REQ-014 | Implement Platform Abstraction Layer (PAL) interface with readFile(), writeFile(), listFiles(), resolvePath(), exists() methods. | P1       |
| REQ-015 | Create NodePAL implementation for Node.js runtime and MockPAL for testing.                                                       | P1       |
| REQ-016 | Replace all direct fs/path calls with PAL abstractions for cross-platform support.                                               | P1       |

#### Phase 5: CI/CD & Documentation (Weeks 6-8, 24h)

| ID      | Requirement                                                                    | Priority |
| ------- | ------------------------------------------------------------------------------ | -------- |
| REQ-017 | Implement CI job for validate_progress in GitHub Actions workflow.             | P1       |
| REQ-018 | Optimize CI/CD pipeline to reduce runtime by 30% (from 18min to 12min target). | P1       |
| REQ-019 | Generate comprehensive documentation for all public APIs with migration guide. | P1       |
| REQ-020 | Implement GAP-005 Description CSV Export for tool description validation.      | P1       |

#### Phase 6: Testing & Validation (Weeks 7-9, 50h)

| ID      | Requirement                                                                                                           | Priority |
| ------- | --------------------------------------------------------------------------------------------------------------------- | -------- |
| REQ-021 | Achieve ≥90% test coverage with Vitest across domain layer (100%), tools layer (90%), and integration critical paths. | P0       |
| REQ-022 | Implement validate_progress tests, validate_annotations tests, validate_schema_examples tests.                        | P0       |
| REQ-023 | Run CI matrix testing for Windows, Linux, and macOS platforms.                                                        | P0       |

#### Enforcement Requirements

| ID      | Requirement                                                                                                                                                  | Priority |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| REQ-024 | GAP-001: All tools must have ToolAnnotations following ADR-002 standard with title, readOnlyHint, destructiveHint, idempotentHint, openWorldHint properties. | P0       |
| REQ-025 | ENFORCEMENT: validate_uniqueness tool must check for duplicate tool descriptions and report violations.                                                      | P0       |
| REQ-026 | ENFORCEMENT: validate_annotations tool must verify ToolAnnotations coverage for all registered tools.                                                        | P0       |
| REQ-027 | ENFORCEMENT: enforce_planning tool must validate SpecKit compliance for spec.md, plan.md, tasks.md, progress.md structure.                                   | P0       |

### 2.2 Non-Functional Requirements

| ID      | Requirement                                                                                                                           | Priority |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| NFR-001 | All Zod schemas must use Pattern A (inline co-located) as default, Pattern B (external) only for shared schemas, with no 'any' types. | P0       |
| NFR-002 | All TypeScript code must pass strict mode with isolatedModules: true and all ESM imports ending with .js extension.                   | P0       |
| NFR-003 | All strategies must use mandatory HITL feedback - summary feedback cannot be disabled.                                                | P0       |
| NFR-004 | CI/CD pipeline runtime must be ≤12 minutes.                                                                                           | P1       |
| NFR-005 | Code duplication must be <5%.                                                                                                         | P1       |

---

## 3. Acceptance Criteria

All acceptance criteria must pass for the specification to be considered complete:

- [ ] **AC-001**: All 30+ tools have ToolAnnotations (100% coverage verified by validate_annotations)
- [ ] **AC-002**: Zod schema description coverage ≥80% (verified by validate_schema_examples CI check)
- [ ] **AC-003**: Framework count reduced from 30+ to exactly 11 unified frameworks
- [ ] **AC-004**: Test coverage ≥90% measured by Vitest coverage report
- [ ] **AC-005**: All 7 strategies (speckit, togaf, adr, rfc, enterprise, sdd, chat) extend BaseStrategy<T>
- [ ] **AC-006**: Zero duplicate tool descriptions (verified by CSV export validation)
- [ ] **AC-007**: All progress.md files validated by validate_progress tool
- [ ] **AC-008**: Cross-platform CI matrix passes for Windows, Linux, and macOS
- [ ] **AC-009**: UnifiedPromptBuilder is the single entry point for all prompt generation
- [ ] **AC-010**: CI/CD pipeline runtime reduced to ≤12 minutes
- [ ] **AC-011**: All public APIs documented with migration guide
- [ ] **AC-012**: enforce_planning tool validates 100% SpecKit compliance
- [ ] **AC-013**: ExecutionTrace logging active for all strategy executions
- [ ] **AC-014**: PAL abstracts all direct fs/path operations

---

## 4. Out of Scope

The following items are explicitly **NOT** included in v0.14.x:

- Full MCP Apps implementation (research only in v0.15.x)
- Complete RAG pipeline (evaluation only in v0.15.x)
- Breaking changes to MCP SDK itself
- Rewriting existing tool logic beyond consolidation
- Performance optimization unless blocking critical path
- PowerShell script implementation (defer to PAL abstraction)
- Agent-to-agent direct communication (use orchestrator)

---

## 5. Dependencies

### 5.1 Internal Dependencies

| ID      | Dependency                                                   | Owner             | Impact                 |
| ------- | ------------------------------------------------------------ | ----------------- | ---------------------- |
| DEP-001 | BaseStrategy<T> must be complete before strategy migration   | @mcp-tool-builder | Blocks Phase 2         |
| DEP-002 | ExecutionTrace must be complete before strategy migration    | @mcp-tool-builder | Blocks Phase 2         |
| DEP-003 | UnifiedPromptBuilder must be complete before facade creation | @mcp-tool-builder | Blocks legacy facades  |
| DEP-004 | PAL interface must be complete before implementations        | @mcp-tool-builder | Blocks NodePAL/MockPAL |
| DEP-005 | All enforcement tools must exist before CI integration       | @mcp-tool-builder | Blocks Phase 5 CI jobs |

### 5.2 External Dependencies

| ID      | Dependency                | Version | Purpose                       |
| ------- | ------------------------- | ------- | ----------------------------- |
| EXT-001 | @modelcontextprotocol/sdk | Latest  | MCP SDK for tool registration |
| EXT-002 | Zod                       | ^3.x    | Schema validation             |
| EXT-003 | Vitest                    | ^1.x    | Testing framework             |
| EXT-004 | Handlebars                | ^4.x    | Template engine               |
| EXT-005 | Context7                  | HTTP    | Library documentation         |

---

## 6. Risks

| ID       | Risk                                                      | Severity | Likelihood | Mitigation                                   |
| -------- | --------------------------------------------------------- | -------- | ---------- | -------------------------------------------- |
| RISK-001 | Breaking changes in Phase 2.5 may impact downstream users | High     | Medium     | Clear migration guide, deprecation warnings  |
| RISK-002 | Cross-platform testing may reveal platform-specific bugs  | Medium   | High       | Early CI matrix setup, MockPAL for isolation |
| RISK-003 | Framework consolidation may miss edge cases               | Medium   | Medium     | Extensive integration testing                |
| RISK-004 | 90% coverage target may require significant refactoring   | Medium   | Low        | Threshold arrays reduce complexity           |
| RISK-005 | PAL abstraction may introduce performance overhead        | Low      | Low        | Benchmark before/after, optimize if needed   |

---

## 7. Glossary

| Term                     | Definition                                                                     |
| ------------------------ | ------------------------------------------------------------------------------ |
| **BaseStrategy<T>**      | Abstract base class for all strategy implementations with mandatory HITL       |
| **ExecutionTrace**       | Decision logging system for transparency and debugging                         |
| **HITL**                 | Human-In-The-Loop feedback pattern                                             |
| **PAL**                  | Platform Abstraction Layer for cross-platform support                          |
| **SpecKit**              | Standardized documentation structure (spec.md, plan.md, tasks.md, progress.md) |
| **UnifiedPromptBuilder** | Single entry point for all prompt generation                                   |
| **ToolAnnotations**      | MCP standard for tool metadata (ADR-002)                                       |

---

*See [plan.md](./plan.md) for implementation details*
*See [adr.md](./adr.md) for architectural decisions*
