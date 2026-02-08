# V-007: Verify All progress.md Valid

**Task ID**: V-007
**Phase**: Validation
**Priority**: P1 (Documentation Quality)
**Estimate**: 1h
**Owner**: @documentation-generator
**Reviewer**: @code-reviewer
**Dependencies**: T-048 (Progress Tracking), T-061 (CI Progress Validation)
**References**: AC-007 (spec.md), REQ-019 (spec.md)

---

## 1. Overview

### What

Verify that all progress.md files across planning directories conform to the Spec-Kit schema and contain valid tracking information. This ensures consistent progress reporting and enables automated status dashboards.

### Why

- **Requirement**: AC-007 mandates valid progress.md files in all planning directories
- **Automation**: Valid structure enables CI-based progress tracking
- **Visibility**: Standardized format supports dashboard generation
- **Compliance**: Spec-Kit methodology requires progress.md for HITL workflow

### Context from Spec-Kit

From spec.md AC-007:
> "All progress.md files are valid and conform to Spec-Kit schema"

From plan.md Phase 5:
> "Progress tracking via progress.md enables real-time visibility into task completion and blockers"

### Deliverables

- Progress.md validation script execution report
- List of all valid progress.md files with paths
- Schema compliance report (0 violations expected)
- Progress summary aggregation (tasks completed, in-progress, blocked)

## 2. Context and Scope

### Current State

- Review existing modules and integrations
- Capture baseline behavior before changes

### Target State

- Verify All progress.md Valid fully implemented per requirements
- Supporting tests/validation in place

### Out of Scope

- Unrelated refactors or non-task enhancements

## 3. Prerequisites

### Dependencies

- T-048, T-061

### Target Files

- `artifacts/`
- `CI logs`

### Tooling

- Node.js 22.x
- npm scripts from the root package.json

## 4. Implementation Guide

### Step 4.1: Find All progress.md Files

**Command**:
```bash
find plan-v0.14.x -name "progress.md" -type f
```

**Expected Output**:
```
plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/progress.md
plan-v0.14.x/*/progress.md
```

### Step 4.2: Validate Progress Schema

**Required Schema Structure**:
```markdown
# Progress: [Project Name]

## Summary
| Metric      | Value |
| ----------- | ----- |
| Total Tasks | N     |
| Completed   | X     |
| In Progress | Y     |
| Blocked     | Z     |

## Phase Progress

### Phase N: [Name]
- [x] Task completed
- [ ] Task pending
- [⚠️] Task blocked - REASON

## Blockers
| Task | Blocker | Owner | ETA |
| ---- | ------- | ----- | --- |

## Recent Updates
- [Date] Update description
```

**Validation Script** (`scripts/validate-progress.ts`):
```typescript
import { readFileSync, existsSync } from 'fs';
import { glob } from 'glob';

const progressFiles = glob.sync('plan-v0.14.x/**/progress.md');
let valid = 0;
let invalid = 0;

for (const file of progressFiles) {
  const content = readFileSync(file, 'utf-8');

  // Check required sections
  const hasTitle = /^# Progress:/.test(content);
  const hasSummary = /## Summary/.test(content);
  const hasPhaseProgress = /## Phase Progress/.test(content);

  if (hasTitle && hasSummary && hasPhaseProgress) {
    console.log(`✓ ${file}`);
    valid++;
  } else {
    console.error(`✗ ${file} - Missing sections`);
    invalid++;
  }
}

console.log(`\nValid: ${valid}, Invalid: ${invalid}`);
process.exit(invalid > 0 ? 1 : 0);
```

### Step 4.3: Run Validation

```bash
npm run validate:progress
# or
npx tsx scripts/validate-progress.ts
```

### Step 4.4: Generate Progress Report

```bash
# Aggregate progress across all projects
npx tsx scripts/aggregate-progress.ts > artifacts/progress-summary.md
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

| Criterion                        | Status | Verification |
| -------------------------------- | ------ | ------------ |
| Validation executed successfully | ⬜      | TBD          |
| Results recorded with evidence   | ⬜      | TBD          |
| Follow-up items documented       | ⬜      | TBD          |

---

## 8. References

- [spec.md](../../spec.md)
- [tasks.md](../../tasks.md)

---

*Task: V-007 | Phase: Validation | Priority: TBD*
