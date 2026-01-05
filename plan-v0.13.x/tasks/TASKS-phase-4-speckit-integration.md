# TASKS: Phase 4 — Spec-Kit Integration

> Week 11-14 task breakdown for Spec-Kit methodology integration

## 📋 Phase Metadata

| Field         | Value                                                |
| ------------- | ---------------------------------------------------- |
| Phase         | Phase 4 (4a + 4b)                                    |
| Name          | Spec-Kit Integration                                 |
| Duration      | 4 weeks (Week 11-14)                                 |
| Related Spec  | [SPEC-005](../specs/SPEC-005-speckit-integration.md) |
| Exit Criteria | See TIMELINE.md Phase 4a/4b                          |

---

## 1. Overview

Phase 4 integrates GitHub's Spec-Kit methodology with MCP tools:
- **Phase 4a (Week 11-12)**: SpecKit strategy, constitution parser, spec generation
- **Phase 4b (Week 13-14)**: Progress tracking, validation, design-assistant integration

---

## 2. Phase 4a Tasks: Core Spec-Kit (Week 11-12)

### Week 11: Foundation + Constitution Parser

#### Task 4.1: Analyze CONSTITUTION.md Structure
- **ID**: P4-001
- **Priority**: High
- **Estimate**: 2 hours
- **Assignee**: TBD
- **Dependencies**: None

**Description:**
Analyze the CONSTITUTION.md format to design parser:
- Identify section patterns (Principles, Constraints, Rules)
- Document ID patterns (P1, C1, AR1, DP1)
- Plan extraction approach

**Acceptance Criteria:**
- [ ] Document format patterns identified
- [ ] Regex patterns drafted
- [ ] Constitution interface designed

**Files to Analyze:**
- `plan-v0.13.x/CONSTITUTION.md`

**Files to Create:**
- `docs/analysis/constitution-format.md`

---

#### Task 4.2: Implement Constitution Parser
- **ID**: P4-002
- **Priority**: High
- **Estimate**: 4 hours
- **Assignee**: TBD
- **Dependencies**: P4-001

**Description:**
Create parser to extract structured data from CONSTITUTION.md:
- Parse principles (P1, P2, etc.)
- Parse constraints (C1, C2, etc.)
- Parse architecture rules (AR1, etc.)
- Parse design principles (DP1, etc.)

**Acceptance Criteria:**
- [ ] File: `src/strategies/speckit/constitution-parser.ts`
- [ ] Constitution interface defined
- [ ] All section types extracted
- [ ] Unit tests with sample constitution

**Files to Create:**
- `src/strategies/speckit/constitution-parser.ts`
- `src/strategies/speckit/types.ts`
- `tests/vitest/strategies/speckit/constitution-parser.spec.ts`

---

#### Task 4.3: Create Spec-Kit Types
- **ID**: P4-003
- **Priority**: High
- **Estimate**: 2 hours
- **Assignee**: TBD
- **Dependencies**: None

**Description:**
Define TypeScript types for Spec-Kit artifacts:
- ParsedSpec, Plan, Tasks, Progress
- SpecKitArtifacts aggregate type
- Task derivation types

**Acceptance Criteria:**
- [ ] File: `src/strategies/speckit/types.ts` (expand)
- [ ] All artifact types defined
- [ ] JSDoc documentation

**Files to Modify:**
- `src/strategies/speckit/types.ts`

---

#### Task 4.4: Implement SpecKitStrategy - spec.md Generation
- **ID**: P4-004
- **Priority**: High
- **Estimate**: 6 hours
- **Assignee**: TBD
- **Dependencies**: P4-002, P4-003

**Description:**
Implement spec.md generation in SpecKitStrategy:
- Overview section
- Objectives section
- Requirements (functional + non-functional)
- Constitutional constraints (if constitution provided)
- Acceptance criteria
- Out of scope

**Acceptance Criteria:**
- [ ] File: `src/strategies/speckit-strategy.ts`
- [ ] renderSpec() method
- [ ] Constitutional constraint embedding
- [ ] Unit tests

**Files to Create:**
- `src/strategies/speckit-strategy.ts`
- `tests/vitest/strategies/speckit-strategy.spec.ts`

---

#### Task 4.5: Implement SpecKitStrategy - plan.md Generation
- **ID**: P4-005
- **Priority**: High
- **Estimate**: 4 hours
- **Assignee**: TBD
- **Dependencies**: P4-004

**Description:**
Implement plan.md generation:
- Approach section
- Phases section with deliverables
- Dependencies section
- Risks section
- Timeline table

**Acceptance Criteria:**
- [ ] renderPlan() method
- [ ] Phase generation from domain result
- [ ] Timeline table formatting
- [ ] Unit tests

**Files to Modify:**
- `src/strategies/speckit-strategy.ts`

---

#### Task 4.6: Implement Task Derivation
- **ID**: P4-006
- **Priority**: High
- **Estimate**: 4 hours
- **Assignee**: TBD
- **Dependencies**: P4-004

**Description:**
Implement automatic task derivation from spec:
- Derive tasks from functional requirements
- Derive verification tasks from acceptance criteria
- Assign priorities and estimates

**Acceptance Criteria:**
- [ ] deriveTasksFromSpec() method
- [ ] Tasks include: title, description, priority, estimate
- [ ] Acceptance criteria per task
- [ ] Unit tests

**Files to Modify:**
- `src/strategies/speckit-strategy.ts`

---

### Week 12: Remaining Generation + Integration

#### Task 4.7: Implement SpecKitStrategy - tasks.md Generation
- **ID**: P4-007
- **Priority**: High
- **Estimate**: 3 hours
- **Assignee**: TBD
- **Dependencies**: P4-006

**Description:**
Implement tasks.md generation:
- Task list with details
- Priority indicators
- Phase assignments
- Dependency tracking

**Acceptance Criteria:**
- [ ] renderTasks() method
- [ ] Task formatting with checkboxes
- [ ] Dependency references
- [ ] Unit tests

**Files to Modify:**
- `src/strategies/speckit-strategy.ts`

---

#### Task 4.8: Implement SpecKitStrategy - progress.md Generation
- **ID**: P4-008
- **Priority**: High
- **Estimate**: 3 hours
- **Assignee**: TBD
- **Dependencies**: P4-007

**Description:**
Implement progress.md generation:
- Status indicator
- Summary metrics table
- Recent updates section
- Blockers section
- Next steps

**Acceptance Criteria:**
- [ ] renderProgress() method
- [ ] Metrics calculation
- [ ] Timestamp formatting
- [ ] Unit tests

**Files to Modify:**
- `src/strategies/speckit-strategy.ts`

---

#### Task 4.9: Wire SpecKitStrategy to Gateway
- **ID**: P4-009
- **Priority**: High
- **Estimate**: 2 hours
- **Assignee**: TBD
- **Dependencies**: P4-008

**Description:**
Register SpecKitStrategy with PolyglotGateway.

**Acceptance Criteria:**
- [ ] Strategy registered
- [ ] 'speckit' approach selectable
- [ ] Integration test

**Files to Modify:**
- `src/gateway/polyglot-gateway.ts`
- `src/strategies/index.ts`

---

#### Task 4.10: Add speckit-generator Tool
- **ID**: P4-010
- **Priority**: High
- **Estimate**: 3 hours
- **Assignee**: TBD
- **Dependencies**: P4-009

**Description:**
Create dedicated MCP tool for Spec-Kit generation:
- Accept requirements input
- Optional constitution path
- Return all 4 documents

**Acceptance Criteria:**
- [ ] Tool: `speckit-generator`
- [ ] Schema with requirements, constitution, options
- [ ] Returns structured artifact response
- [ ] ToolAnnotations added
- [ ] Description follows template

**Files to Create:**
- `src/schemas/speckit-generator.ts`

**Files to Modify:**
- `src/index.ts`

---

#### Task 4.11: Integrate with design-assistant
- **ID**: P4-011
- **Priority**: High
- **Estimate**: 4 hours
- **Assignee**: TBD
- **Dependencies**: P4-009

**Description:**
Add 'speckit' to design-assistant artifact types:
- Update ArtifactType union
- Implement generateSpecKitArtifacts()
- Convert session to domain result

**Acceptance Criteria:**
- [ ] 'speckit' in artifactTypes
- [ ] design-assistant can generate spec.md, plan.md, etc.
- [ ] Session data maps to Spec-Kit format
- [ ] Integration test

**Files to Modify:**
- `src/tools/design/design-assistant.ts`
- `src/tools/design/services/artifact-generation-service.ts`

---

#### Task 4.12: Strategy Selection for Spec-Kit
- **ID**: P4-012
- **Priority**: Medium
- **Estimate**: 2 hours
- **Assignee**: TBD
- **Dependencies**: P4-009

**Description:**
Add Spec-Kit to OutputSelector decision matrix:
- When to recommend 'speckit' approach
- Context signals: "spec", "plan", "tasks", "github workflow"

**Acceptance Criteria:**
- [ ] Selection logic updated
- [ ] Recommends speckit for appropriate contexts
- [ ] Unit tests

**Files to Modify:**
- `src/gateway/output-selector.ts`

---

## 3. Phase 4b Tasks: Validation & Progress (Week 13-14)

### Week 13: Spec Validation

#### Task 4.13: Implement SpecValidator
- **ID**: P4-013
- **Priority**: High
- **Estimate**: 6 hours
- **Assignee**: TBD
- **Dependencies**: P4-002

**Description:**
Create validator to check specs against constitutional constraints:
- Validate principles compliance
- Validate constraint compliance
- Generate warnings for potential issues

**Acceptance Criteria:**
- [ ] File: `src/strategies/speckit/spec-validator.ts`
- [ ] validate() returns ValidationResult
- [ ] Checks all principle types
- [ ] Checks all constraint types
- [ ] Unit tests for each check

**Files to Create:**
- `src/strategies/speckit/spec-validator.ts`
- `tests/vitest/strategies/speckit/spec-validator.spec.ts`

---

#### Task 4.14: Add Validation to SpecKitStrategy
- **ID**: P4-014
- **Priority**: High
- **Estimate**: 3 hours
- **Assignee**: TBD
- **Dependencies**: P4-013

**Description:**
Integrate validation into spec generation:
- Validate before rendering
- Include violations in output
- Option to fail on violations

**Acceptance Criteria:**
- [ ] Optional validation step
- [ ] Violations section in spec.md
- [ ] validateBeforeRender option
- [ ] Integration test

**Files to Modify:**
- `src/strategies/speckit-strategy.ts`

---

#### Task 4.15: Create Validation Report Format
- **ID**: P4-015
- **Priority**: Medium
- **Estimate**: 2 hours
- **Assignee**: TBD
- **Dependencies**: P4-14

**Description:**
Define format for validation reports:
- Summary section
- Violations list with severity
- Recommendations section

**Acceptance Criteria:**
- [ ] ValidationReport type
- [ ] Markdown formatting
- [ ] Severity levels: error, warning, info

**Files to Modify:**
- `src/strategies/speckit/types.ts`
- `src/strategies/speckit/spec-validator.ts`

---

#### Task 4.16: Add validate-spec Tool
- **ID**: P4-016
- **Priority**: Medium
- **Estimate**: 3 hours
- **Assignee**: TBD
- **Dependencies**: P4-13

**Description:**
Create dedicated tool for spec validation:
- Accept spec content
- Accept constitution path
- Return validation result

**Acceptance Criteria:**
- [ ] Tool: `validate-spec`
- [ ] Returns structured validation result
- [ ] Works with any spec.md content

**Files to Create:**
- `src/schemas/validate-spec.ts`

**Files to Modify:**
- `src/index.ts`

---

### Week 14: Progress Tracking & Polish

#### Task 4.17: Implement ProgressTracker
- **ID**: P4-017
- **Priority**: High
- **Estimate**: 4 hours
- **Assignee**: TBD
- **Dependencies**: P4-008

**Description:**
Create service for tracking spec progress:
- Load existing progress.md
- Update completion metrics
- Track completed tasks

**Acceptance Criteria:**
- [ ] File: `src/strategies/speckit/progress-tracker.ts`
- [ ] loadProgress(), updateProgress()
- [ ] calculateCompletion()
- [ ] Unit tests

**Files to Create:**
- `src/strategies/speckit/progress-tracker.ts`
- `tests/vitest/strategies/speckit/progress-tracker.spec.ts`

---

#### Task 4.18: Add Git Integration for Progress
- **ID**: P4-018
- **Priority**: Low
- **Estimate**: 3 hours
- **Assignee**: TBD
- **Dependencies**: P4-017

**Description:**
Auto-update progress based on git commits:
- Parse commit messages for task references
- Mark tasks complete based on "closes #X" patterns
- Update progress.md automatically

**Acceptance Criteria:**
- [ ] syncFromGit() method
- [ ] Parses "closes", "fixes", "resolves" patterns
- [ ] Updates progress.md
- [ ] Unit tests with mock commits

**Files to Modify:**
- `src/strategies/speckit/progress-tracker.ts`

---

#### Task 4.19: Add update-progress Tool
- **ID**: P4-019
- **Priority**: Medium
- **Estimate**: 2 hours
- **Assignee**: TBD
- **Dependencies**: P4-017

**Description:**
Create tool to update progress.md:
- Accept completed task IDs
- Recalculate metrics
- Return updated progress

**Acceptance Criteria:**
- [ ] Tool: `update-progress`
- [ ] Accepts task IDs array
- [ ] Returns updated progress.md content

**Files to Create:**
- `src/schemas/update-progress.ts`

**Files to Modify:**
- `src/index.ts`

---

#### Task 4.20: Create Spec-Kit Demo
- **ID**: P4-020
- **Priority**: Medium
- **Estimate**: 3 hours
- **Assignee**: TBD
- **Dependencies**: P4-011

**Description:**
Create demo script showcasing Spec-Kit workflow:
- Generate spec from requirements
- Validate against constitution
- Generate tasks
- Track progress

**Acceptance Criteria:**
- [ ] Demo script: `demos/demo-speckit.js`
- [ ] Generates sample artifacts
- [ ] Output files in demos/

**Files to Create:**
- `demos/demo-speckit.js`
- `demos/demo-speckit-spec.md`
- `demos/demo-speckit-plan.md`
- `demos/demo-speckit-tasks.md`

---

#### Task 4.21: Comprehensive Spec-Kit Tests
- **ID**: P4-021
- **Priority**: High
- **Estimate**: 4 hours
- **Assignee**: TBD
- **Dependencies**: P4-019

**Description:**
Create comprehensive test suite for Spec-Kit integration.

**Acceptance Criteria:**
- [ ] End-to-end generation test
- [ ] Validation test with real constitution
- [ ] Progress tracking test
- [ ] Design-assistant integration test
- [ ] 90%+ coverage

**Files to Create:**
- `tests/vitest/strategies/speckit/integration.spec.ts`

---

#### Task 4.22: Documentation
- **ID**: P4-022
- **Priority**: Medium
- **Estimate**: 3 hours
- **Assignee**: TBD
- **Dependencies**: P4-20

**Description:**
Create documentation for Spec-Kit features:
- Usage guide
- Tool reference
- Example workflows
- Constitutional constraint guide

**Files to Create:**
- `docs/speckit/README.md`
- `docs/speckit/usage.md`
- `docs/speckit/constitution-guide.md`

**Files to Modify:**
- `README.md`

---

#### Task 4.23: Export All Spec-Kit from Barrel
- **ID**: P4-023
- **Priority**: Low
- **Estimate**: 1 hour
- **Assignee**: TBD
- **Dependencies**: P4-21

**Description:**
Ensure all Spec-Kit exports are properly organized.

**Acceptance Criteria:**
- [ ] All types exported from barrel
- [ ] Parser, validator, tracker accessible
- [ ] Clean import paths

**Files to Modify:**
- `src/strategies/speckit/index.ts`
- `src/strategies/index.ts`

---

#### Task 4.24: Final Integration Testing
- **ID**: P4-024
- **Priority**: High
- **Estimate**: 4 hours
- **Assignee**: TBD
- **Dependencies**: P4-021, P4-022

**Description:**
Final integration testing with real v0.13.x plan:
- Use actual CONSTITUTION.md
- Generate real spec from plan
- Validate against actual constraints
- Verify progress tracking

**Acceptance Criteria:**
- [ ] Works with actual project files
- [ ] No errors or warnings
- [ ] Output matches expected format

---

## 4. Exit Criteria Checklist

### Phase 4a:
- [ ] SpecKitStrategy generates all 4 files
- [ ] Constitution parser extracts all constraint types
- [ ] Task derivation working
- [ ] speckit-generator tool registered
- [ ] design-assistant supports 'speckit' artifact type

### Phase 4b:
- [ ] SpecValidator validates against constitution
- [ ] ProgressTracker updates completion metrics
- [ ] validate-spec tool working
- [ ] update-progress tool working
- [ ] Documentation complete
- [ ] Demo script working

---

## 5. Risk Mitigation

| Risk                        | Mitigation                        |
| --------------------------- | --------------------------------- |
| Constitution format changes | Parser handles flexible patterns  |
| Complex task derivation     | Start simple, enhance iteratively |
| Git integration complexity  | Make git sync optional            |

---

## 6. Definition of Done

A task is complete when:
1. Code changes are merged to main
2. Tests pass with 90%+ coverage
3. Documentation updated
4. Demo script works
5. No regressions

---

*Tasks Created: January 2026*
*Last Updated: January 2026*
