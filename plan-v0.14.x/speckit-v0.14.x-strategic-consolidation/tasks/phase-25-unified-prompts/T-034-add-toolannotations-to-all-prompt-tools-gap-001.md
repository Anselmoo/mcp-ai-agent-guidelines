# T-034: Add ToolAnnotations to All Prompt Tools (GAP-001)

**Task ID**: T-034
**Phase**: 2.5
**Priority**: P0
**Estimate**: 6h
**Owner**: @mcp-tool-builder
**Reviewer**: @code-reviewer
**Dependencies**: T-026

---

## 1. Overview

### What

Complete the 'Add ToolAnnotations to All Prompt Tools (GAP-001)' work as specified in tasks.md and related issue templates.

### Why

- Aligns with the v0.14.x consolidation plan
- Ensures repeatable delivery across phases
- Reduces risk by documenting clear steps

### Deliverables

- Updated implementation for T-034
- Updated tests or validation evidence
- Documentation or notes as required

## 2. Context and Scope

### Current State

- Review existing modules and integrations
- Capture baseline behavior before changes

### Target State

- Add ToolAnnotations to All Prompt Tools (GAP-001) fully implemented per requirements
- Supporting tests/validation in place

### Out of Scope

- Unrelated refactors or non-task enhancements

## 3. Prerequisites

### Dependencies

- T-026

### Target Files

- `TBD`

### Tooling

- Node.js 22.x
- npm scripts from the root package.json

## 4. Implementation Guide

### Step 4.1: Review Existing State

- Locate related code and determine current gaps
- Confirm requirements from tasks.md

### Step 4.2: Implement Core Changes

```typescript
export class AddToolannotationsToAllPromptToolsGap001 {
  constructor(private readonly config: Config) {}

  execute(): Result {
    // TODO: implement core logic
  }
}
```

### Step 4.3: Wire Integrations

- Update barrel exports and registries
- Register new handler or service if required
- Add configuration entries where needed

### Step 4.4: Validate Behavior

- Run unit tests for new logic
- Ensure TypeScript strict mode passes

## 5. Testing Strategy

- Add/update unit tests for new logic
- Cover error handling and edge cases
- Run `npm run quality` before finalizing

## 6. Risks and Mitigations

- Risk: Scope creep beyond tasks.md
  - Mitigation: Validate against acceptance criteria
- Risk: Integration regressions
  - Mitigation: Run targeted tests and CI checks

## 7. Acceptance Criteria

| Criterion | Status | Verification |
|-----------|--------|--------------|
| Implementation completed per requirements | ⬜ | TBD |
| Integration points wired and documented | ⬜ | TBD |
| Quality checks pass | ⬜ | TBD |

---

## 8. References

- [spec.md](../../spec.md)
- [tasks.md](../../tasks.md)

---

*Task: T-034 | Phase: 2.5 | Priority: P0*
