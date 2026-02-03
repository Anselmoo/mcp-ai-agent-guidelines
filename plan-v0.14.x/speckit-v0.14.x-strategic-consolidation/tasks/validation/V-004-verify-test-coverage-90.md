# V-004: Verify Test Coverage ≥90%

**Task ID**: V-004
**Phase**: Validation
**Priority**: P0 (Critical Path)
**Estimate**: 2h
**Owner**: @tdd-workflow
**Reviewer**: @code-reviewer
**Dependencies**: T-069 (Coverage Infrastructure), T-070 (Coverage Gates)
**References**: AC-004 (spec.md), ADR-007 (adr.md), REQ-006 (spec.md)

---

## 1. Overview

### What

Verify that the test suite achieves ≥90% code coverage across all source files, using Vitest coverage reports. This validation ensures the consolidated codebase maintains high quality with comprehensive test coverage for all 11 unified frameworks and supporting modules.

### Why

- **Requirement**: AC-004 mandates 90% minimum test coverage
- **Architecture**: ADR-007 establishes Vitest as primary testing framework
- **Quality**: High coverage prevents regressions during consolidation
- **Confidence**: Enables safe refactoring and future maintenance

### Context from Spec-Kit

From spec.md AC-004:
> "Test coverage ≥90% across all source files (Vitest coverage report)"

From adr.md ADR-007:
> "Use Vitest with c8 coverage provider for comprehensive test coverage reporting with threshold enforcement"

From roadmap.md metrics:
> "Test Coverage: 75% → 90% (+20%)"

### Deliverables

- Vitest coverage report showing ≥90% for statements, branches, functions, lines
- Coverage badge updated to reflect current percentage
- CI gate confirmation showing coverage threshold enforcement
- Coverage diff analysis for any files below threshold

## 2. Context and Scope

### Current State

- Review existing modules and integrations
- Capture baseline behavior before changes

### Target State

- Verify Test Coverage ≥90% fully implemented per requirements
- Supporting tests/validation in place

### Out of Scope

- Unrelated refactors or non-task enhancements

## 3. Prerequisites

### Dependencies

- T-069, T-070

### Target Files

- `artifacts/`
- `CI logs`

### Tooling

- Node.js 22.x
- npm scripts from the root package.json

## 4. Implementation Guide

### Step 4.1: Run Coverage Report

**Command**:
```bash
npm run test:coverage:vitest
```

**Expected Output**:
```
------------------------|---------|----------|---------|---------|
| File                     | % Stmts   | % Branch   | % Funcs   | % Lines   |
| ------------------------ | --------- | ---------- | --------- | --------- |
| All files                | 92.4      | 89.1       | 94.2      | 92.1      |
| src/domain/              | 95.2      | 91.3       | 97.1      | 95.0      |
| src/frameworks/          | 91.8      | 88.5       | 93.4      | 91.5      |
| src/tools/               | 90.5      | 87.2       | 92.1      | 90.2      |
| ------------------------ | --------- | ---------- | --------- | --------- |
```

### Step 4.2: Verify Coverage Thresholds

**Vitest Configuration** (`vitest.config.ts`):
```typescript
export default defineConfig({
  test: {
    coverage: {
      provider: 'c8',
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 90,
      },
      exclude: ['**/*.d.ts', '**/types.ts', '**/index.ts'],
    },
  },
});
```

### Step 4.3: Check Coverage Diff

```bash
# Generate coverage diff from baseline
npm run test:coverage:diff -- --baseline artifacts/coverage-baseline.json

# Expected: No files dropped below 90%
```

### Step 4.4: Identify Low-Coverage Files

```bash
# Find files below threshold
grep -E '^[^|]+\|\s*[0-8][0-9]\.' coverage/lcov.info.txt

# For each low-coverage file, add targeted tests
```

### Step 4.5: Export Coverage Artifacts

```bash
# Copy reports to artifacts directory
cp -r coverage/lcov-report artifacts/coverage-report-v014/
cp coverage/lcov.info artifacts/coverage-v014.lcov
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

| Criterion                    | Status | Verification                              |
| ---------------------------- | ------ | ----------------------------------------- |
| Statement coverage ≥90%      | ⬜      | `npm run test:coverage:vitest` shows ≥90% |
| Branch coverage ≥85%         | ⬜      | Coverage report branches column ≥85%      |
| Function coverage ≥90%       | ⬜      | Coverage report functions column ≥90%     |
| Line coverage ≥90%           | ⬜      | Coverage report lines column ≥90%         |
| Coverage artifacts saved     | ⬜      | `artifacts/coverage-v014.lcov` exists     |
| CI threshold gate passes     | ⬜      | CI workflow exits 0 on coverage step      |
| No regressions from baseline | ⬜      | Coverage diff shows no files dropped      |

### Coverage by Layer

| Layer                          | Target | Reason                                   |
| ------------------------------ | ------ | ---------------------------------------- |
| Domain (`src/domain/`)         | 95%    | Core business logic, must be bulletproof |
| Frameworks (`src/frameworks/`) | 90%    | Consolidated tool handlers               |
| Shared (`src/tools/shared/`)   | 90%    | Reusable utilities                       |
| Legacy Facades                 | 80%    | Thin wrappers, minimal logic             |

---

## 8. References

- [spec.md](../../spec.md) - AC-004, REQ-006
- [adr.md](../../adr.md) - ADR-007 (Testing Strategy)
- [Vitest Coverage Docs](https://vitest.dev/guide/coverage.html)

---

*Task: V-004 | Phase: Validation | Priority: P0*
