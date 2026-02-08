# V-001: Verify ToolAnnotations Coverage = 100%

**Task ID**: V-001
**Phase**: Validation
**Priority**: P0 (Critical Path)
**Estimate**: 1h
**Owner**: @code-reviewer
**Reviewer**: @architecture-advisor
**Dependencies**: T-034 (Add ToolAnnotations), T-062 (CI Job)
**References**: AC-001 (spec.md), ADR-002 (adr.md), REQ-024 (spec.md)

---

## 1. Overview

### What

Verify that 100% of the 30+ tools have complete ToolAnnotations as specified in the MCP standard (ADR-002). This validation ensures all tools have proper metadata for safe AI agent interaction and improved tool discovery.

### Why

- **Requirement**: AC-001 mandates 100% ToolAnnotations coverage
- **Architecture**: ADR-002 establishes ToolAnnotations as mandatory MCP standard
- **Safety**: Proper annotations prevent unsafe tool invocations by AI agents
- **Discovery**: Enables agents to understand tool capabilities without execution

### Context from Spec-Kit

From spec.md AC-001:
> "All 30+ tools have ToolAnnotations (100% coverage verified by validate_annotations)"

From adr.md ADR-002:
> "All tools MUST have ToolAnnotations with these properties: title, readOnlyHint, destructiveHint, idempotentHint, openWorldHint"

### Deliverables

- validate_annotations execution report with 100% pass rate
- CI logs showing successful validation
- Remediation plan for any failures (target: 0 failures)

## 2. Context and Scope

### Current State

From roadmap.md baseline metrics:
- Current ToolAnnotations coverage: ~60% (18 of 30 tools)
- Missing annotations on legacy prompt builders
- Inconsistent metadata format across tools

### Target State

Per AC-001 and ADR-002:
- 100% coverage across all 30+ tools
- Consistent annotation format: title, readOnlyHint, destructiveHint, idempotentHint, openWorldHint
- validate_annotations CI job passing with exit code 0
- Zero tools without complete annotations

### Out of Scope

- Tool functionality changes (only metadata)
- Documentation beyond annotations
- Performance optimization

## 3. Prerequisites

### Dependencies

- T-034, T-062

### Target Files

- `artifacts/`
- `CI logs`

### Tooling

- Node.js 22.x
- npm scripts from the root package.json

## 4. Implementation Guide

### Step 4.1: Prepare Validation Environment

- Confirm T-034 (ToolAnnotations implementation) is complete
- Confirm T-062 (CI job) is deployed
- Ensure npm dependencies are installed

### Step 4.2: Execute validate_annotations

**Command**:
```bash
npm run validate:annotations
```

**Expected Output**:
```
✓ Scanning src/tools/ for tool registrations...
✓ Found 34 registered tools
✓ Checking ToolAnnotations coverage...

Tool Annotations Report:
========================
Total Tools:        34
Annotated:          34 (100.00%)
Missing:            0 (0.00%)

All required properties present:
✓ title            34/34 (100%)
✓ readOnlyHint     34/34 (100%)
✓ destructiveHint  34/34 (100%)
✓ idempotentHint   34/34 (100%)
✓ openWorldHint    34/34 (100%)

✅ PASS: 100% ToolAnnotations coverage achieved
```

### Step 4.3: Handle Failures (If Any)

If validation fails, output will show:
```
❌ FAIL: ToolAnnotations coverage: 88.24% (30/34)

Missing annotations:
  - src/tools/prompt/old-builder.ts
  - src/tools/analysis/legacy-scorer.ts
  - src/tools/framework/deprecated-router.ts
  - src/tools/orchestration/old-coordinator.ts
```

**Remediation**:
1. Open each file listed
2. Add ToolAnnotations per ADR-002 template:
```typescript
const toolAnnotations: ToolAnnotations = {
  title: "Tool Name",
  readOnlyHint: true,  // or false
  destructiveHint: false,  // or true
  idempotentHint: true,  // or false
  openWorldHint: false,  // or true
};
```
3. Re-run validation

### Step 4.4: Capture Evidence

- Save validation output to `artifacts/validation/V-001-toolannotations-report.txt`
- Attach CI job logs showing successful run
- Document any remediation actions taken

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

From spec.md AC-001:

| Criterion | Status | Verification |
|-----------|--------|--------------|
| All 30+ tools have ToolAnnotations | ⬜ | `npm run validate:annotations` exits 0 |
| 100% coverage verified by validate_annotations | ⬜ | Coverage report shows 100% |
| All 5 required properties present (title, readOnlyHint, destructiveHint, idempotentHint, openWorldHint) | ⬜ | Property check passes |
| CI job integrated and passing | ⬜ | GitHub Actions shows green check |
| Zero tools without annotations | ⬜ | Missing count = 0 |

**Definition of Done**:
- validate_annotations returns exit code 0
- Coverage report shows 100.00%
- CI job passes on every PR
- Evidence saved in artifacts/validation/

---

## 8. References

- [spec.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/spec.md)
- [tasks.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/tasks.md)

---

*Task: V-001 | Phase: Validation | Priority: TBD*
