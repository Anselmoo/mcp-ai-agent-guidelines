# TASKS: Phase 1 — Discoverability

> Week 3-4 task breakdown for improving LLM tool discovery

## 📋 Phase Metadata

| Field         | Value                                               |
| ------------- | --------------------------------------------------- |
| Phase         | Phase 1                                             |
| Name          | Discoverability                                     |
| Duration      | 2 weeks (Week 3-4)                                  |
| Related Spec  | [SPEC-002](../specs/SPEC-002-tool-harmonization.md) |
| Exit Criteria | See TIMELINE.md Phase 1                             |

---

## 1. Overview

Phase 1 focuses on making 30+ MCP tools easily discoverable and selectable by LLMs. This includes:
- Adding ToolAnnotations to all tools
- Rewriting tool descriptions
- Adding schema examples
- Consolidating overlapping tools

---

## 2. Task Breakdown

### Week 3: Tool Annotations & Description Rewrite

#### Task 1.1: Create Annotation Presets
- **ID**: P1-001
- **Priority**: High
- **Estimate**: 2 hours
- **Assignee**: TBD
- **Dependencies**: None

**Description:**
Create `src/tools/shared/annotation-presets.ts` with standardized ToolAnnotation presets for different tool categories.

**Acceptance Criteria:**
- [ ] File created at correct path
- [ ] 4 presets defined: ANALYSIS, SESSION, FILESYSTEM, GENERATION
- [ ] Each preset has all 4 annotation fields
- [ ] Exported from barrel file
- [ ] Unit tests written

**Files to Create/Modify:**
- Create: `src/tools/shared/annotation-presets.ts`
- Modify: `src/tools/shared/index.ts` (add export)

---

#### Task 1.2: Add ToolAnnotations to Analysis Tools
- **ID**: P1-002
- **Priority**: High
- **Estimate**: 3 hours
- **Assignee**: TBD
- **Dependencies**: P1-001

**Description:**
Add ANALYSIS_TOOL_ANNOTATIONS to all analysis tools in `src/index.ts`:
- clean-code-scorer
- code-hygiene-analyzer
- semantic-code-analyzer
- dependency-auditor
- iterative-coverage-enhancer
- gap-frameworks-analyzers

**Acceptance Criteria:**
- [ ] 6 analysis tools have annotations
- [ ] All use ANALYSIS_TOOL_ANNOTATIONS preset
- [ ] Existing tests still pass
- [ ] Annotation values match tool behavior

**Files to Modify:**
- `src/index.ts`

---

#### Task 1.3: Add ToolAnnotations to Prompt Tools
- **ID**: P1-003
- **Priority**: High
- **Estimate**: 3 hours
- **Assignee**: TBD
- **Dependencies**: P1-001

**Description:**
Add GENERATION_TOOL_ANNOTATIONS to all prompt builder tools:
- hierarchical-prompt-builder
- hierarchy-level-selector
- prompting-hierarchy-evaluator
- code-analysis-prompt-builder
- debugging-assistant-prompt-builder
- security-hardening-prompt-builder
- architecture-design-prompt-builder
- documentation-generator-prompt-builder
- domain-neutral-prompt-builder
- quick-developer-prompts-builder
- spark-prompt-builder

**Acceptance Criteria:**
- [ ] 11 prompt tools have annotations
- [ ] All use GENERATION_TOOL_ANNOTATIONS preset
- [ ] Existing tests still pass

**Files to Modify:**
- `src/index.ts`

---

#### Task 1.4: Add ToolAnnotations to Session/Design Tools
- **ID**: P1-004
- **Priority**: High
- **Estimate**: 2 hours
- **Assignee**: TBD
- **Dependencies**: P1-001

**Description:**
Add SESSION_TOOL_ANNOTATIONS to session-based tools:
- design-assistant
- mode-switcher (currently broken)

**Acceptance Criteria:**
- [ ] 2 session tools have annotations
- [ ] readOnlyHint: false for session tools
- [ ] Existing tests still pass

**Files to Modify:**
- `src/index.ts`

---

#### Task 1.5: Add ToolAnnotations to Remaining Tools
- **ID**: P1-005
- **Priority**: Medium
- **Estimate**: 3 hours
- **Assignee**: TBD
- **Dependencies**: P1-001

**Description:**
Add appropriate annotations to all remaining tools:
- strategy-frameworks-builder (GENERATION)
- sprint-timeline-calculator (GENERATION)
- model-compatibility-checker (ANALYSIS)
- mermaid-diagram-generator (GENERATION)
- memory-context-optimizer (ANALYSIS)
- project-onboarding (FILESYSTEM)

**Acceptance Criteria:**
- [ ] All 30+ tools have annotations
- [ ] Annotations match actual tool behavior
- [ ] Comprehensive annotation coverage test passes

**Files to Modify:**
- `src/index.ts`

---

#### Task 1.6: Export Descriptions to CSV
- **ID**: P1-006
- **Priority**: Medium
- **Estimate**: 1 hour
- **Assignee**: TBD
- **Dependencies**: None

**Description:**
Create script to export all current tool descriptions to CSV for analysis and rewriting.

**Acceptance Criteria:**
- [ ] Script at `scripts/export-descriptions.ts`
- [ ] CSV includes: tool name, current description, character count
- [ ] Output to `artifacts/tool-descriptions.csv`

**Files to Create:**
- `scripts/export-descriptions.ts`

---

#### Task 1.7: Rewrite Tool Descriptions (Batch 1)
- **ID**: P1-007
- **Priority**: High
- **Estimate**: 4 hours
- **Assignee**: TBD
- **Dependencies**: P1-006

**Description:**
Rewrite descriptions for first batch of tools following template:
`[ACTION VERB] [WHAT IT DOES] with [KEY DIFFERENTIATOR]. BEST FOR: [use cases]. OUTPUTS: [format].`

Tools in batch 1 (most used):
- hierarchical-prompt-builder
- clean-code-scorer
- design-assistant
- security-hardening-prompt-builder
- dependency-auditor

**Acceptance Criteria:**
- [ ] 5 tools have new descriptions
- [ ] All follow template format
- [ ] First 10 words unique across all tools
- [ ] Character count < 200 per description

**Files to Modify:**
- `src/index.ts`

---

#### Task 1.8: Rewrite Tool Descriptions (Batch 2)
- **ID**: P1-008
- **Priority**: High
- **Estimate**: 4 hours
- **Assignee**: TBD
- **Dependencies**: P1-007

**Description:**
Rewrite descriptions for second batch (prompt builders):
- code-analysis-prompt-builder
- debugging-assistant-prompt-builder
- architecture-design-prompt-builder
- documentation-generator-prompt-builder
- domain-neutral-prompt-builder

**Acceptance Criteria:**
- [ ] 5 tools have new descriptions
- [ ] Clear differentiation from batch 1 prompt tools
- [ ] All follow template format

**Files to Modify:**
- `src/index.ts`

---

#### Task 1.9: Rewrite Tool Descriptions (Batch 3)
- **ID**: P1-009
- **Priority**: Medium
- **Estimate**: 4 hours
- **Assignee**: TBD
- **Dependencies**: P1-008

**Description:**
Rewrite descriptions for remaining tools:
- All remaining prompt builders
- All analysis tools
- All strategy tools
- All utility tools

**Acceptance Criteria:**
- [ ] All 30+ tools have new descriptions
- [ ] Uniqueness verification script passes
- [ ] No two tools share first 5 words

**Files to Modify:**
- `src/index.ts`

---

### Week 4: Schema Examples & Tool Consolidation

#### Task 1.10: Create Description Uniqueness Test
- **ID**: P1-010
- **Priority**: High
- **Estimate**: 2 hours
- **Assignee**: TBD
- **Dependencies**: P1-009

**Description:**
Create automated test to verify all tool descriptions are unique and follow template.

**Acceptance Criteria:**
- [ ] Test at `tests/vitest/discoverability/unique-descriptions.spec.ts`
- [ ] Fails if any two tools share first 5 words
- [ ] Fails if description doesn't follow template
- [ ] Integrated into CI pipeline

**Files to Create:**
- `tests/vitest/discoverability/unique-descriptions.spec.ts`

---

#### Task 1.11: Add Schema Examples to Core Tools
- **ID**: P1-011
- **Priority**: High
- **Estimate**: 4 hours
- **Assignee**: TBD
- **Dependencies**: None

**Description:**
Add `.examples()` to Zod schemas for required parameters in core tools:
- hierarchical-prompt-builder (context, goal)
- clean-code-scorer (codeContent)
- design-assistant (action, sessionId)
- security-hardening-prompt-builder (threatContext)

**Acceptance Criteria:**
- [ ] All required params have 2-3 examples
- [ ] Examples are realistic and diverse
- [ ] Schema validation still works

**Files to Modify:**
- `src/schemas/*.ts` (multiple files)

---

#### Task 1.12: Add Schema Examples to Remaining Tools
- **ID**: P1-012
- **Priority**: Medium
- **Estimate**: 6 hours
- **Assignee**: TBD
- **Dependencies**: P1-011

**Description:**
Add `.examples()` to all remaining tools with required parameters.

**Acceptance Criteria:**
- [ ] All required params across all tools have examples
- [ ] Examples test passes

**Files to Modify:**
- `src/schemas/*.ts` (all schema files)

---

#### Task 1.13: Design Unified Prompt-Hierarchy Tool
- **ID**: P1-013
- **Priority**: High
- **Estimate**: 4 hours
- **Assignee**: TBD
- **Dependencies**: None

**Description:**
Design the unified `prompt-hierarchy` tool that consolidates:
- hierarchical-prompt-builder
- hierarchy-level-selector
- prompting-hierarchy-evaluator

Create API specification with `mode` parameter.

**Acceptance Criteria:**
- [ ] API design document in `docs/api/prompt-hierarchy.md`
- [ ] Zod schema defined
- [ ] Mode parameter: 'build' | 'select' | 'evaluate'
- [ ] Backward-compatible input handling

**Files to Create:**
- `docs/api/prompt-hierarchy.md`
- `src/schemas/prompt-hierarchy.ts`

---

#### Task 1.14: Implement Unified Prompt-Hierarchy Tool
- **ID**: P1-014
- **Priority**: High
- **Estimate**: 8 hours
- **Assignee**: TBD
- **Dependencies**: P1-013

**Description:**
Implement the unified tool, extracting shared logic from existing tools.

**Acceptance Criteria:**
- [ ] New file: `src/tools/prompt/prompt-hierarchy.ts`
- [ ] All 3 modes working
- [ ] Shared utility functions extracted
- [ ] Unit tests for each mode
- [ ] 90%+ test coverage

**Files to Create:**
- `src/tools/prompt/prompt-hierarchy.ts`
- `tests/vitest/tools/prompt/prompt-hierarchy.spec.ts`

**Files to Modify:**
- `src/tools/prompt/index.ts` (barrel export)

---

#### Task 1.15: Add Deprecation Warnings to Old Tools
- **ID**: P1-015
- **Priority**: Medium
- **Estimate**: 2 hours
- **Assignee**: TBD
- **Dependencies**: P1-014

**Description:**
Add deprecation warnings to the 3 old prompt tools, pointing to new unified tool.

**Acceptance Criteria:**
- [ ] Each old tool logs deprecation warning
- [ ] Warning includes migration instructions
- [ ] Warning includes removal version (v0.14.0)
- [ ] Old tools still work (backward compatible)

**Files to Modify:**
- `src/tools/prompt/hierarchical-prompt-builder.ts`
- `src/tools/prompt/hierarchy-level-selector.ts`
- `src/tools/prompt/prompting-hierarchy-evaluator.ts`

---

#### Task 1.16: Register Unified Tool in Server
- **ID**: P1-016
- **Priority**: High
- **Estimate**: 1 hour
- **Assignee**: TBD
- **Dependencies**: P1-014

**Description:**
Register the new `prompt-hierarchy` tool in the MCP server.

**Acceptance Criteria:**
- [ ] Tool registered in `src/index.ts`
- [ ] Description follows new template
- [ ] ToolAnnotations added
- [ ] Integration test passes

**Files to Modify:**
- `src/index.ts`

---

#### Task 1.17: Update Documentation
- **ID**: P1-017
- **Priority**: Medium
- **Estimate**: 3 hours
- **Assignee**: TBD
- **Dependencies**: P1-015, P1-016

**Description:**
Update README.md and other docs to reflect:
- New tool descriptions
- Unified prompt-hierarchy tool
- Deprecation of old tools

**Acceptance Criteria:**
- [ ] README tool list updated
- [ ] Migration guide for prompt tools
- [ ] API docs updated

**Files to Modify:**
- `README.md`
- `docs/tools/prompt.md`

---

#### Task 1.18: LLM Discoverability Test
- **ID**: P1-018
- **Priority**: High
- **Estimate**: 3 hours
- **Assignee**: TBD
- **Dependencies**: P1-016

**Description:**
Manual testing with Claude/GPT to verify tool selection accuracy.

**Test Scenarios:**
1. "Review my code for quality" → clean-code-scorer
2. "Create a prompt for code review" → prompt-hierarchy
3. "Check my dependencies for security" → dependency-auditor
4. "Generate an architecture diagram" → mermaid-diagram-generator
5. "Start a design session" → design-assistant

**Acceptance Criteria:**
- [ ] 5 test scenarios documented
- [ ] 90%+ correct tool selection
- [ ] Results documented in `artifacts/discoverability-test.md`

**Files to Create:**
- `artifacts/discoverability-test.md`

---

## 3. Exit Criteria Checklist

From TIMELINE.md Phase 1:

- [ ] All 30+ tools have unique, action-oriented descriptions
- [ ] ToolAnnotations added to all tools
- [ ] Schema examples on all required parameters
- [ ] 3 overlapping prompt tools consolidated into 1
- [ ] Description uniqueness test in CI
- [ ] LLM tool selection accuracy ≥ 90%

---

## 4. Risk Mitigation

| Risk                                  | Mitigation                                       |
| ------------------------------------- | ------------------------------------------------ |
| Breaking changes during consolidation | Keep old tools working with deprecation warnings |
| Description template too restrictive  | Allow variations within template structure       |
| Schema examples incomplete            | Prioritize most-used tools first                 |

---

## 5. Definition of Done

A task is complete when:
1. Code changes are merged to main
2. Tests pass (including new tests)
3. Documentation is updated
4. No regressions in existing functionality
5. PR reviewed and approved

---

*Tasks Created: January 2026*
*Last Updated: January 2026*
