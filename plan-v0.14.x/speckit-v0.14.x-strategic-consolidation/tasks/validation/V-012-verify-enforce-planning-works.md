# V-012: Verify enforce_planning Works

**Task ID**: V-012
**Phase**: Validation
**Priority**: P0 (HITL Critical)
**Estimate**: 2h
**Owner**: @mcp-tool-builder
**Reviewer**: @architecture-advisor
**Dependencies**: T-053 (enforce_planning Implementation)
**References**: AC-012 (spec.md), ADR-001 (adr.md), REQ-001 through REQ-003 (spec.md)

---

## 1. Overview

### What

Verify that the `enforce_planning` tool correctly enforces the Human-In-The-Loop (HITL) workflow by requiring Spec-Kit artifacts before code generation. This validation confirms the mandatory planning phase cannot be bypassed.

### Why

- **Requirement**: AC-012 mandates enforce_planning prevents unplanned code generation
- **Architecture**: ADR-001 establishes HITL as foundational safety pattern
- **Safety**: Prevents AI agents from generating code without human-approved specifications
- **Quality**: Ensures all code generation has proper planning artifacts

### Context from Spec-Kit

From spec.md AC-012:
> "enforce_planning correctly blocks code generation without approved Spec-Kit artifacts"

From adr.md ADR-001:
> "The enforce_planning tool implements a pre-flight check: 1) Validates spec.md exists and is approved, 2) Validates plan.md exists with phases defined, 3) Blocks tool calls if artifacts missing"

From plan.md:
> "HITL enforcement ensures no code generation proceeds without human review and approval of planning documents"

### Deliverables

- Integration tests showing enforce_planning blocks unapproved requests
- Test cases for all bypass scenarios
- Evidence of correct error messages when blocking

## 2. Context and Scope

### Current State

- Review existing modules and integrations
- Capture baseline behavior before changes

### Target State

- Verify enforce_planning Works fully implemented per requirements
- Supporting tests/validation in place

### Out of Scope

- Unrelated refactors or non-task enhancements

## 3. Prerequisites

### Dependencies

- T-053

### Target Files

- `artifacts/`
- `CI logs`

### Tooling

- Node.js 22.x
- npm scripts from the root package.json

## 4. Implementation Guide

### Step 4.1: Test Scenarios

| Scenario                   | Expected Outcome                      |
| -------------------------- | ------------------------------------- |
| No spec.md                 | Block with "Missing spec.md" error    |
| spec.md not approved       | Block with "Spec not approved" error  |
| No plan.md                 | Block with "Missing plan.md" error    |
| All artifacts valid        | Allow code generation                 |
| Expired approval (>7 days) | Block with "Approval expired" warning |

### Step 4.2: Integration Test Implementation

**Test File**: `tests/vitest/integration/enforce-planning.spec.ts`
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { enforcePlanning } from '../../../src/tools/planning/enforce-planning.js';
import { MockPAL } from '../../../src/platform/mock-pal.js';

describe('enforce_planning', () => {
  let mockPAL: MockPAL;

  beforeEach(() => {
    mockPAL = new MockPAL();
  });

  it('should block when spec.md is missing', async () => {
    mockPAL.setFiles({}); // No files

    const result = await enforcePlanning({ action: 'check' }, mockPAL);

    expect(result.allowed).toBe(false);
    expect(result.error).toContain('Missing spec.md');
  });

  it('should block when spec.md not approved', async () => {
    mockPAL.setFiles({
      'spec.md': '# Spec\n\nStatus: Draft', // Not approved
    });

    const result = await enforcePlanning({ action: 'check' }, mockPAL);

    expect(result.allowed).toBe(false);
    expect(result.error).toContain('not approved');
  });

  it('should allow when all artifacts valid', async () => {
    mockPAL.setFiles({
      'spec.md': '# Spec\n\nStatus: Approved\nApproved: 2025-01-01',
      'plan.md': '# Plan\n\n## Phase 1',
    });

    const result = await enforcePlanning({ action: 'check' }, mockPAL);

    expect(result.allowed).toBe(true);
  });
});
```

### Step 4.3: Run Integration Tests

```bash
# Run enforce_planning tests
npm run test:vitest -- tests/vitest/integration/enforce-planning.spec.ts
```

### Step 4.4: Manual Verification

```bash
# Test via MCP tool call
echo '{"action": "check", "directory": "."}' | npx mcp-tool enforce_planning
```

### Step 4.5: Bypass Attempt Tests

```bash
# Verify these attempts are blocked
npx tsx scripts/test-bypass-attempts.ts
```

## 5. Testing Strategy

- Confirm validation command exits with code 0
- Attach output artifacts to CI or `artifacts/`
- Document any follow-up actions

## 6. Risks and Mitigations

- Risk: Scope creep beyond tasks.md
  - Mitigation: Validate against acceptance criteria
- Risk: Integration regressions
  - Mitigation: Run targeted tests and CI checks

## 7. Acceptance Criteria

| Criterion                          | Status | Verification                    |
| ---------------------------------- | ------ | ------------------------------- |
| Blocks missing spec.md             | ⬜      | Integration test passes         |
| Blocks unapproved spec             | ⬜      | Integration test passes         |
| Blocks missing plan.md             | ⬜      | Integration test passes         |
| Allows valid artifacts             | ⬜      | Integration test passes         |
| Clear error messages               | ⬜      | Error text is actionable        |
| Cannot bypass via direct call      | ⬜      | Bypass tests fail as expected   |
| Integrates with all code gen tools | ⬜      | All tools call enforce_planning |

### Error Message Quality

| Scenario     | Required Message Content                 |
| ------------ | ---------------------------------------- |
| Missing spec | "Create spec.md with `speckit generate`" |
| Unapproved   | "Get approval before proceeding"         |
| Missing plan | "Create plan.md after spec approval"     |
| Expired      | "Approval >7 days old, re-approve"       |

---

## 8. References

- [spec.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/spec.md) - AC-012, REQ-001 through REQ-003
- [adr.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/adr.md) - ADR-001 (HITL Enforcement)

---

*Task: V-012 | Phase: Validation | Priority: P0*
