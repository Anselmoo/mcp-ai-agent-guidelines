# TASKS: Phase 2 — Domain Extraction & Output Strategy

> Week 5-8 task breakdown for domain layer extraction and OutputStrategy implementation

## 📋 Phase Metadata

| Field         | Value                                                                                                            |
| ------------- | ---------------------------------------------------------------------------------------------------------------- |
| Phase         | Phase 2 (2a + 2b)                                                                                                |
| Name          | Domain Extraction + Output Strategy                                                                              |
| Duration      | 4 weeks (Week 5-8)                                                                                               |
| Related Spec  | [SPEC-001](../specs/SPEC-001-output-strategy-layer.md), [SPEC-003](../specs/SPEC-003-error-handling-refactor.md) |
| Exit Criteria | See TIMELINE.md Phase 2a/2b                                                                                      |

---

## 1. Overview

Phase 2 is the core architectural work, split into two sub-phases:
- **Phase 2a (Week 5-6)**: Extract domain logic from tools, implement ErrorCode enum
- **Phase 2b (Week 7-8)**: Implement OutputStrategy layer with 7 approaches

---

## 2. Phase 2a Tasks: Domain Extraction (Week 5-6)

### Week 5: ErrorCode Infrastructure + First Domain Extraction

#### Task 2.1: Create ErrorCode Enum
- **ID**: P2-001
- **Priority**: High
- **Estimate**: 3 hours
- **Assignee**: TBD
- **Dependencies**: None

**Description:**
Create centralized ErrorCode enum with numbering convention:
- 1xxx: Validation Errors
- 2xxx: Domain Errors
- 3xxx: Session Errors
- 4xxx: External Errors
- 5xxx: Configuration Errors
- 9xxx: Internal Errors

**Acceptance Criteria:**
- [ ] File: `src/tools/shared/error-codes.ts`
- [ ] All error codes defined with messages
- [ ] Numbering convention followed
- [ ] Exported from barrel

**Files to Create:**
- `src/tools/shared/error-codes.ts`

---

#### Task 2.2: Create McpToolError Class
- **ID**: P2-002
- **Priority**: High
- **Estimate**: 3 hours
- **Assignee**: TBD
- **Dependencies**: P2-001

**Description:**
Update `src/tools/shared/errors.ts` with new `McpToolError` class that includes:
- `code: ErrorCode`
- `context?: Record<string, unknown>`
- `cause?: Error`
- `timestamp: Date`
- `toResponse()` method

**Acceptance Criteria:**
- [ ] McpToolError class with all fields
- [ ] toResponse() returns MCP-compatible format
- [ ] isRetryable() method
- [ ] Backward compatible with existing errors

**Files to Modify:**
- `src/tools/shared/errors.ts`

---

#### Task 2.3: Create Error Factory Functions
- **ID**: P2-003
- **Priority**: High
- **Estimate**: 2 hours
- **Assignee**: TBD
- **Dependencies**: P2-002

**Description:**
Create factory functions for common error types:
- `validationError()`
- `missingRequiredError()`
- `sessionNotFoundError()`
- `fileSystemError()`
- `schemaViolationError()`
- `phaseTransitionError()`

**Acceptance Criteria:**
- [ ] File: `src/tools/shared/error-factory.ts`
- [ ] 6+ factory functions
- [ ] Each includes appropriate context
- [ ] Unit tests for each factory

**Files to Create:**
- `src/tools/shared/error-factory.ts`
- `tests/vitest/shared/error-factory.spec.ts`

---

#### Task 2.4: Create Central Error Handler
- **ID**: P2-004
- **Priority**: High
- **Estimate**: 3 hours
- **Assignee**: TBD
- **Dependencies**: P2-003

**Description:**
Create `handleToolError()` function that:
- Handles McpToolError directly
- Converts ZodError to schemaViolationError
- Detects error type from standard Error messages
- Returns MCP-compatible response

**Acceptance Criteria:**
- [ ] File: `src/tools/shared/error-handler.ts`
- [ ] Pattern matching for common errors
- [ ] Consistent response format
- [ ] Unit tests for all error paths

**Files to Create:**
- `src/tools/shared/error-handler.ts`
- `tests/vitest/shared/error-handler.spec.ts`

---

#### Task 2.5: Create Domain Layer Directory Structure
- **ID**: P2-005
- **Priority**: High
- **Estimate**: 1 hour
- **Assignee**: TBD
- **Dependencies**: None

**Description:**
Create directory structure for domain layer:
```
src/domain/
├── prompting/
│   └── types.ts
├── analysis/
│   └── types.ts
├── design/
│   └── types.ts
└── index.ts
```

**Acceptance Criteria:**
- [ ] Directories created
- [ ] Types files with initial interfaces
- [ ] Barrel exports

**Files to Create:**
- `src/domain/index.ts`
- `src/domain/prompting/types.ts`
- `src/domain/analysis/types.ts`
- `src/domain/design/types.ts`

---

#### Task 2.6: Extract Hierarchical Prompt Domain Logic
- **ID**: P2-006
- **Priority**: High
- **Estimate**: 6 hours
- **Assignee**: TBD
- **Dependencies**: P2-005

**Description:**
Extract pure business logic from `hierarchical-prompt-builder` into domain layer:
- Move prompt building logic to `src/domain/prompting/hierarchical-builder.ts`
- Return structured `PromptResult` instead of formatted string
- Tool becomes thin wrapper

**Acceptance Criteria:**
- [ ] Domain function returns `PromptResult` type
- [ ] No markdown formatting in domain
- [ ] Original tool still works (calls domain then formats)
- [ ] Tests for domain function
- [ ] No functionality regression

**Files to Create:**
- `src/domain/prompting/hierarchical-builder.ts`

**Files to Modify:**
- `src/tools/prompt/hierarchical-prompt-builder.ts`

---

#### Task 2.7: Extract Clean Code Scorer Domain Logic
- **ID**: P2-007
- **Priority**: High
- **Estimate**: 4 hours
- **Assignee**: TBD
- **Dependencies**: P2-005

**Description:**
Extract scoring logic from `clean-code-scorer`:
- Move to `src/domain/analysis/code-scorer.ts`
- Return `ScoringResult` with numeric scores and breakdown
- Tool formats the result

**Acceptance Criteria:**
- [ ] Domain function returns structured result
- [ ] Scoring logic testable in isolation
- [ ] Original tool still works
- [ ] Tests for domain function

**Files to Create:**
- `src/domain/analysis/code-scorer.ts`

**Files to Modify:**
- `src/tools/analysis/clean-code-scorer.ts`

---

### Week 6: Migrate Error Handling + More Domain Extraction

#### Task 2.8: Migrate Design-Assistant to New Errors
- **ID**: P2-008
- **Priority**: High
- **Estimate**: 6 hours
- **Assignee**: TBD
- **Dependencies**: P2-004

**Description:**
Update design-assistant to use new error handling:
- Replace all try/catch with `handleToolError()`
- Use error factory functions
- Add error codes to all error paths

**Acceptance Criteria:**
- [ ] All error paths use ErrorCode
- [ ] Single catch block with handleToolError()
- [ ] Existing tests pass
- [ ] New error tests added

**Files to Modify:**
- `src/tools/design/design-assistant.ts`
- `src/tools/design/services/*.ts`

---

#### Task 2.9: Migrate Prompt Tools to New Errors
- **ID**: P2-009
- **Priority**: Medium
- **Estimate**: 4 hours
- **Assignee**: TBD
- **Dependencies**: P2-004

**Description:**
Update all prompt builder tools to use new error handling pattern.

**Acceptance Criteria:**
- [ ] All prompt tools use handleToolError()
- [ ] No raw try/catch with string messages
- [ ] Tests pass

**Files to Modify:**
- `src/tools/prompt/*.ts` (all prompt tools)

---

#### Task 2.10: Migrate Analysis Tools to New Errors
- **ID**: P2-010
- **Priority**: Medium
- **Estimate**: 4 hours
- **Assignee**: TBD
- **Dependencies**: P2-004

**Description:**
Update all analysis tools to use new error handling pattern.

**Acceptance Criteria:**
- [ ] All analysis tools use handleToolError()
- [ ] Tests pass

**Files to Modify:**
- `src/tools/analysis/*.ts`

---

#### Task 2.11: Extract Security Prompt Domain Logic
- **ID**: P2-011
- **Priority**: Medium
- **Estimate**: 4 hours
- **Assignee**: TBD
- **Dependencies**: P2-005

**Description:**
Extract domain logic from `security-hardening-prompt-builder`.

**Acceptance Criteria:**
- [ ] Domain function in `src/domain/prompting/security-builder.ts`
- [ ] Returns structured security analysis result
- [ ] Tool formats result

**Files to Create:**
- `src/domain/prompting/security-builder.ts`

---

#### Task 2.12: Extract Design Session Domain Logic
- **ID**: P2-012
- **Priority**: High
- **Estimate**: 8 hours
- **Assignee**: TBD
- **Dependencies**: P2-005

**Description:**
Extract design session logic to domain layer:
- Move session management to `src/domain/design/session-manager.ts`
- Move phase workflow to `src/domain/design/phase-workflow.ts`
- Keep tool as orchestration layer

**Acceptance Criteria:**
- [ ] Domain functions for all design actions
- [ ] Session state management in domain
- [ ] Phase transitions in domain
- [ ] Tool calls domain functions
- [ ] All existing tests pass

**Files to Create:**
- `src/domain/design/session-manager.ts`
- `src/domain/design/phase-workflow.ts`

**Files to Modify:**
- `src/tools/design/design-assistant.ts`

---

#### Task 2.13: Remove Legacy Error Classes
- **ID**: P2-013
- **Priority**: Low
- **Estimate**: 2 hours
- **Assignee**: TBD
- **Dependencies**: P2-008, P2-009, P2-010

**Description:**
Remove old `ValidationError`, `ConfigurationError`, `OperationError` classes once all tools migrated.

**Acceptance Criteria:**
- [ ] No tools import old error classes
- [ ] Old classes removed
- [ ] Clean compilation

**Files to Modify:**
- `src/tools/shared/errors.ts`

---

#### Task 2.14: Domain Layer Integration Test
- **ID**: P2-014
- **Priority**: High
- **Estimate**: 3 hours
- **Assignee**: TBD
- **Dependencies**: P2-006, P2-007, P2-012

**Description:**
Create integration tests verifying domain functions work with existing tools.

**Acceptance Criteria:**
- [ ] Test file: `tests/vitest/domain/integration.spec.ts`
- [ ] Tests domain→tool flow
- [ ] Tests error propagation
- [ ] Tests type safety

**Files to Create:**
- `tests/vitest/domain/integration.spec.ts`

---

## 3. Phase 2b Tasks: Output Strategy (Week 7-8)

### Week 7: Strategy Infrastructure + First Strategies

#### Task 2.15: Create OutputStrategy Interface
- **ID**: P2-015
- **Priority**: High
- **Estimate**: 3 hours
- **Assignee**: TBD
- **Dependencies**: P2-005

**Description:**
Create base OutputStrategy interface and types:
- OutputApproach enum (7 values)
- CrossCuttingCapability enum (6 values)
- OutputArtifacts interface
- RenderOptions interface

**Acceptance Criteria:**
- [ ] File: `src/strategies/output-strategy.ts`
- [ ] All types exported
- [ ] JSDoc documentation

**Files to Create:**
- `src/strategies/output-strategy.ts`
- `src/strategies/index.ts`

---

#### Task 2.16: Implement ChatStrategy
- **ID**: P2-016
- **Priority**: High
- **Estimate**: 3 hours
- **Assignee**: TBD
- **Dependencies**: P2-015

**Description:**
Implement ChatStrategy as default/baseline:
- Simple markdown formatting
- Direct response for LLM chat

**Acceptance Criteria:**
- [ ] File: `src/strategies/chat-strategy.ts`
- [ ] Renders domain results to markdown
- [ ] Unit tests
- [ ] Works with hierarchical-prompt domain result

**Files to Create:**
- `src/strategies/chat-strategy.ts`
- `tests/vitest/strategies/chat-strategy.spec.ts`

---

#### Task 2.17: Implement RFCStrategy
- **ID**: P2-017
- **Priority**: High
- **Estimate**: 4 hours
- **Assignee**: TBD
- **Dependencies**: P2-015

**Description:**
Implement RFC document strategy with standard sections:
- Summary, Scope, Participants
- Proposal, Pros/Cons, Alternatives
- Conclusion

**Acceptance Criteria:**
- [ ] File: `src/strategies/rfc-strategy.ts`
- [ ] All RFC sections rendered
- [ ] Unit tests

**Files to Create:**
- `src/strategies/rfc-strategy.ts`
- `tests/vitest/strategies/rfc-strategy.spec.ts`

---

#### Task 2.18: Implement ADRStrategy
- **ID**: P2-018
- **Priority**: High
- **Estimate**: 4 hours
- **Assignee**: TBD
- **Dependencies**: P2-015

**Description:**
Implement ADR strategy following Michael Nygard format:
- Status, Context, Decision
- Consequences (positive, negative, neutral)

**Acceptance Criteria:**
- [ ] File: `src/strategies/adr-strategy.ts`
- [ ] Standard ADR format
- [ ] Unit tests

**Files to Create:**
- `src/strategies/adr-strategy.ts`
- `tests/vitest/strategies/adr-strategy.spec.ts`

---

#### Task 2.19: Implement SDDStrategy
- **ID**: P2-019
- **Priority**: High
- **Estimate**: 4 hours
- **Assignee**: TBD
- **Dependencies**: P2-015

**Description:**
Implement Spec-Driven Development strategy:
- spec.md, plan.md, tasks.md output
- Multiple document output

**Acceptance Criteria:**
- [ ] File: `src/strategies/sdd-strategy.ts`
- [ ] Generates 3 documents
- [ ] Unit tests

**Files to Create:**
- `src/strategies/sdd-strategy.ts`
- `tests/vitest/strategies/sdd-strategy.spec.ts`

---

#### Task 2.20: Create CrossCuttingManager
- **ID**: P2-020
- **Priority**: High
- **Estimate**: 4 hours
- **Assignee**: TBD
- **Dependencies**: P2-015

**Description:**
Create manager for cross-cutting capabilities:
- workflow, shell-script, diagram, config, issues, pr-template
- Plugin architecture for handlers

**Acceptance Criteria:**
- [ ] File: `src/strategies/cross-cutting/manager.ts`
- [ ] Base capability handler interface
- [ ] generateArtifacts() method
- [ ] Unit tests

**Files to Create:**
- `src/strategies/cross-cutting/manager.ts`
- `src/strategies/cross-cutting/types.ts`
- `src/strategies/cross-cutting/index.ts`

---

### Week 8: Remaining Strategies + Gateway Integration

#### Task 2.21: Implement SpecKitStrategy
- **ID**: P2-021
- **Priority**: High
- **Estimate**: 6 hours
- **Assignee**: TBD
- **Dependencies**: P2-015

**Description:**
Implement GitHub Spec-Kit strategy as defined in SPEC-005.

**Acceptance Criteria:**
- [ ] File: `src/strategies/speckit-strategy.ts`
- [ ] Generates spec.md, plan.md, tasks.md, progress.md
- [ ] Constitutional constraint embedding
- [ ] Task derivation from requirements
- [ ] Unit tests

**Files to Create:**
- `src/strategies/speckit-strategy.ts`
- `tests/vitest/strategies/speckit-strategy.spec.ts`

---

#### Task 2.22: Implement TOGAF & Enterprise Strategies
- **ID**: P2-022
- **Priority**: Medium
- **Estimate**: 6 hours
- **Assignee**: TBD
- **Dependencies**: P2-015

**Description:**
Implement remaining strategies:
- togaf-strategy.ts (enterprise architecture)
- enterprise-strategy.ts (traditional TDD/HLD/LLD)

**Acceptance Criteria:**
- [ ] Both strategy files created
- [ ] Appropriate document formats
- [ ] Unit tests

**Files to Create:**
- `src/strategies/togaf-strategy.ts`
- `src/strategies/enterprise-strategy.ts`

---

#### Task 2.23: Implement Workflow Capability
- **ID**: P2-023
- **Priority**: High
- **Estimate**: 4 hours
- **Assignee**: TBD
- **Dependencies**: P2-020

**Description:**
Implement GitHub Actions workflow generation capability.

**Acceptance Criteria:**
- [ ] File: `src/strategies/cross-cutting/workflow-capability.ts`
- [ ] Generates valid YAML
- [ ] Configurable triggers
- [ ] Unit tests

**Files to Create:**
- `src/strategies/cross-cutting/workflow-capability.ts`
- `tests/vitest/strategies/cross-cutting/workflow.spec.ts`

---

#### Task 2.24: Implement Diagram Capability
- **ID**: P2-024
- **Priority**: Medium
- **Estimate**: 3 hours
- **Assignee**: TBD
- **Dependencies**: P2-020

**Description:**
Implement Mermaid diagram generation capability.

**Acceptance Criteria:**
- [ ] File: `src/strategies/cross-cutting/diagram-capability.ts`
- [ ] Generates valid Mermaid syntax
- [ ] Multiple diagram types
- [ ] Unit tests

**Files to Create:**
- `src/strategies/cross-cutting/diagram-capability.ts`

---

#### Task 2.25: Create PolyglotGateway
- **ID**: P2-025
- **Priority**: High
- **Estimate**: 6 hours
- **Assignee**: TBD
- **Dependencies**: P2-016, P2-017, P2-018, P2-019, P2-021

**Description:**
Create gateway that routes domain results to appropriate output strategy.

**Acceptance Criteria:**
- [ ] File: `src/gateway/polyglot-gateway.ts`
- [ ] Strategy selection based on context/preference
- [ ] Cross-cutting capability application
- [ ] Unit tests

**Files to Create:**
- `src/gateway/polyglot-gateway.ts`
- `src/gateway/output-selector.ts`
- `src/gateway/types.ts`
- `src/gateway/index.ts`

---

#### Task 2.26: Wire Gateway to Tools (Feature Flag)
- **ID**: P2-026
- **Priority**: High
- **Estimate**: 4 hours
- **Assignee**: TBD
- **Dependencies**: P2-025

**Description:**
Add optional `outputApproach` parameter to tools with feature flag:
- Add to hierarchical-prompt-builder
- Add to design-assistant
- Feature flag controls new vs old path

**Acceptance Criteria:**
- [ ] Feature flag: `USE_OUTPUT_STRATEGY`
- [ ] Old behavior preserved when flag off
- [ ] New behavior when flag on
- [ ] Integration tests for both paths

**Files to Modify:**
- `src/tools/prompt/hierarchical-prompt-builder.ts`
- `src/tools/design/design-assistant.ts`

---

#### Task 2.27: Strategy Matrix Test
- **ID**: P2-027
- **Priority**: High
- **Estimate**: 4 hours
- **Assignee**: TBD
- **Dependencies**: P2-026

**Description:**
Create integration test that verifies same domain result renders to all 7 strategies.

**Acceptance Criteria:**
- [ ] Test file: `tests/vitest/strategies/matrix.spec.ts`
- [ ] All 7 strategies tested
- [ ] Cross-cutting capabilities tested with each
- [ ] 7×6 matrix coverage

**Files to Create:**
- `tests/vitest/strategies/matrix.spec.ts`

---

#### Task 2.28: Update Documentation
- **ID**: P2-028
- **Priority**: Medium
- **Estimate**: 3 hours
- **Assignee**: TBD
- **Dependencies**: P2-026

**Description:**
Update documentation for OutputStrategy feature:
- API docs for new parameter
- Strategy comparison table
- Examples for each approach

**Files to Create/Modify:**
- `docs/output-strategies.md`
- `README.md`

---

## 4. Exit Criteria Checklist

### Phase 2a:
- [ ] ErrorCode enum with 20+ codes
- [ ] McpToolError class with toResponse()
- [ ] handleToolError() function
- [ ] 3+ tools have domain functions extracted
- [ ] All tools use new error handling

### Phase 2b:
- [ ] OutputStrategy interface defined
- [ ] 7 strategies implemented
- [ ] CrossCuttingManager with 2+ capabilities
- [ ] PolyglotGateway routing working
- [ ] Feature flag controlling new path
- [ ] Strategy matrix test passing

---

## 5. Risk Mitigation

| Risk                           | Mitigation                                              |
| ------------------------------ | ------------------------------------------------------- |
| Domain extraction breaks tools | Keep old code paths, toggle with feature flag           |
| Too many strategies            | Start with 3 (chat, adr, sdd), add others incrementally |
| Cross-cutting complexity       | MVP with workflow + diagram only                        |

---

*Tasks Created: January 2026*
*Last Updated: January 2026*
