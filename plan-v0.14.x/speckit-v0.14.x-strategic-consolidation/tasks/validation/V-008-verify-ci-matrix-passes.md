# V-008: Verify CI Matrix Passes

**Task ID**: V-008
**Phase**: Validation
**Priority**: P0 (Release Blocker)
**Estimate**: 2h
**Owner**: @ci-fixer
**Reviewer**: @architecture-advisor
**Dependencies**: T-072 (CI Matrix Configuration)
**References**: AC-008 (spec.md), ADR-009 (adr.md), REQ-017 (spec.md)

---

## 1. Overview

### What

Verify that the CI matrix passes across all supported platforms (Linux, macOS, Windows) and Node.js versions (20.x, 22.x). This validation confirms cross-platform compatibility achieved through PAL abstraction.

### Why

- **Requirement**: AC-008 mandates CI matrix passes on all platforms
- **Architecture**: ADR-009 establishes multi-platform CI testing strategy
- **Compatibility**: Ensures code works on all 3 major platforms
- **Quality**: Node.js version matrix catches API compatibility issues

### Context from Spec-Kit

From spec.md AC-008:
> "CI matrix passes on Linux, macOS, Windows with Node.js 20.x and 22.x"

From adr.md ADR-009:
> "CI workflow uses matrix strategy for platform × Node.js version combinations"

From roadmap.md metrics:
> "Platform Support: 1 (macOS/Linux) → 3 (+ Windows) (+200%)"

### Deliverables

- GitHub Actions workflow run showing all 6 matrix combinations green
- Screenshot/artifact of successful matrix run
- Runtime comparison across platforms (should be within 20% of each other)

## 2. Context and Scope

### Current State

- Review existing modules and integrations
- Capture baseline behavior before changes

### Target State

- Verify CI Matrix Passes fully implemented per requirements
- Supporting tests/validation in place

### Out of Scope

- Unrelated refactors or non-task enhancements

## 3. Prerequisites

### Dependencies

- T-072

### Target Files

- `artifacts/`
- `CI logs`

### Tooling

- Node.js 22.x
- npm scripts from the root package.json

## 4. Implementation Guide

### Step 4.1: Review CI Workflow Configuration

**File**: `.github/workflows/ci.yml`
```yaml
jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        node: [20, 22]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
      - run: npm ci
      - run: npm run quality
      - run: npm run test:all
```

### Step 4.2: Trigger CI Matrix Run

```bash
# Push to trigger CI or manually dispatch
gh workflow run ci.yml

# Monitor run status
gh run list --workflow=ci.yml --limit 1
```

### Step 4.3: Verify All Matrix Combinations

**Expected Matrix**:
| OS             | Node.js | Status | Runtime |
| -------------- | ------- | ------ | ------- |
| ubuntu-latest  | 20      | ✅ Pass | ~8min   |
| ubuntu-latest  | 22      | ✅ Pass | ~8min   |
| macos-latest   | 20      | ✅ Pass | ~10min  |
| macos-latest   | 22      | ✅ Pass | ~10min  |
| windows-latest | 20      | ✅ Pass | ~12min  |
| windows-latest | 22      | ✅ Pass | ~12min  |

**Command to Check**:
```bash
gh run view --log | grep -E "(ubuntu|macos|windows).*node-(20|22)"
```

### Step 4.4: Analyze Failures (if any)

```bash
# Download logs for failed jobs
gh run download <run-id> --name logs

# Common failure patterns:
# - Windows: path separator issues (\ vs /)
# - macOS: case sensitivity
# - Node 20: missing APIs available in 22
```

### Step 4.5: Export Evidence

```bash
# Screenshot workflow summary
gh run view <run-id> --web

# Export run details
gh run view <run-id> --json jobs > artifacts/ci-matrix-results.json
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

| Criterion                        | Status | Verification             |
| -------------------------------- | ------ | ------------------------ |
| ubuntu-latest Node 20 passes     | ⬜      | CI workflow green        |
| ubuntu-latest Node 22 passes     | ⬜      | CI workflow green        |
| macos-latest Node 20 passes      | ⬜      | CI workflow green        |
| macos-latest Node 22 passes      | ⬜      | CI workflow green        |
| windows-latest Node 20 passes    | ⬜      | CI workflow green        |
| windows-latest Node 22 passes    | ⬜      | CI workflow green        |
| Total runtime ≤12min per job     | ⬜      | Job timing within budget |
| No platform-specific workarounds | ⬜      | Code review confirms     |

### Platform-Specific Test Expectations

| Platform | Key Validations                                |
| -------- | ---------------------------------------------- |
| Linux    | Baseline performance, default CI environment   |
| macOS    | Case-sensitive filesystem, ARM64 compatibility |
| Windows  | Path separators, line endings, PowerShell      |

---

## 8. References

- [spec.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/spec.md) - AC-008, REQ-017
- [adr.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/adr.md) - ADR-009 (CI Strategy)
- [GitHub Actions Matrix](https://docs.github.com/en/actions/using-jobs/using-a-matrix-for-your-jobs)

---

*Task: V-008 | Phase: Validation | Priority: P0*
