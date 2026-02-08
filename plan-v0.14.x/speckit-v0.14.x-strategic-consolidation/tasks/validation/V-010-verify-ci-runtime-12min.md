# V-010: Verify CI Runtime ≤12min

**Task ID**: V-010
**Phase**: Validation
**Priority**: P1 (Developer Experience)
**Estimate**: 1h
**Owner**: @performance-optimizer
**Reviewer**: @ci-fixer
**Dependencies**: T-064 (CI Performance Optimization)
**References**: AC-010 (spec.md), REQ-018 (spec.md)

---

## 1. Overview

### What

Verify that CI pipeline runtime is ≤12 minutes per job, ensuring fast feedback loops for developers. This validation confirms performance optimizations including caching, parallelization, and test sharding are effective.

### Why

- **Requirement**: AC-010 mandates CI runtime ≤12min
- **Developer Experience**: Fast CI enables rapid iteration
- **Cost**: Shorter runtimes reduce GitHub Actions billing
- **Productivity**: Quick feedback prevents context switching

### Context from Spec-Kit

From spec.md AC-010:
> "CI pipeline runtime ≤12 minutes (per job in matrix)"

From roadmap.md metrics:
> "CI Time: 18min → 12min (-33%)"

From plan.md optimizations:
> "Implement npm cache, parallel test execution, and intelligent test sharding"

### Deliverables

- CI timing analysis showing all jobs ≤12min
- Breakdown of time by workflow step
- Optimization recommendations if any job exceeds target

## 2. Context and Scope

### Current State

- Review existing modules and integrations
- Capture baseline behavior before changes

### Target State

- Verify CI Runtime ≤12min fully implemented per requirements
- Supporting tests/validation in place

### Out of Scope

- Unrelated refactors or non-task enhancements

## 3. Prerequisites

### Dependencies

- T-064

### Target Files

- `artifacts/`
- `CI logs`

### Tooling

- Node.js 22.x
- npm scripts from the root package.json

## 4. Implementation Guide

### Step 4.1: Collect CI Timing Data

**Command**:
```bash
# Get last 10 CI runs timing
gh run list --workflow=ci.yml --limit 10 --json databaseId,conclusion,startedAt,updatedAt \
  | jq '.[] | {id: .databaseId, duration: ((.updatedAt | fromdateiso8601) - (.startedAt | fromdateiso8601))}'
```

### Step 4.2: Analyze Job-Level Timing

```bash
# Get detailed job timing for a run
gh run view <run-id> --json jobs \
  | jq '.jobs[] | {name: .name, duration: ((.completedAt | fromdateiso8601) - (.startedAt | fromdateiso8601))/60}'
```

**Expected Output**:
```json
{"name": "test (ubuntu-latest, 22)", "duration": 8.5}
{"name": "test (macos-latest, 22)", "duration": 10.2}
{"name": "test (windows-latest, 22)", "duration": 11.8}
```

### Step 4.3: Step-Level Breakdown

**Target Step Timings**:
| Step              | Target            | Typical |
| ----------------- | ----------------- | ------- |
| Checkout          | <10s              | 5s      |
| Setup Node        | <30s              | 15s     |
| npm ci (cached)   | <60s              | 45s     |
| Type check        | <60s              | 40s     |
| Lint              | <30s              | 20s     |
| Unit tests        | <300s             | 240s    |
| Integration tests | <120s             | 90s     |
| Coverage          | <60s              | 45s     |
| **Total**         | **<720s (12min)** | ~500s   |

### Step 4.4: Verify Cache Effectiveness

```bash
# Check cache hit rate
gh run view <run-id> --log | grep -E "(Cache|cache)" | head -20
```

**Expected**: npm cache hit on non-lockfile-change runs

### Step 4.5: Generate Timing Report

```bash
# Export timing analysis
npx tsx scripts/ci-timing-analysis.ts > artifacts/ci-timing-report.md
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

| Criterion                | Status | Verification    |
| ------------------------ | ------ | --------------- |
| Linux jobs ≤10min        | ⬜      | Timing analysis |
| macOS jobs ≤12min        | ⬜      | Timing analysis |
| Windows jobs ≤12min      | ⬜      | Timing analysis |
| npm cache hit rate >80%  | ⬜      | Cache logs      |
| No test timeout failures | ⬜      | CI logs         |
| P95 runtime ≤12min       | ⬜      | 10-run analysis |

### Optimization Techniques (Implemented)

| Technique                    | Impact            |
| ---------------------------- | ----------------- |
| npm ci with cache            | -40% install time |
| Parallel test execution      | -30% test time    |
| TypeScript incremental build | -25% build time   |
| Smart test selection         | -20% test time    |

---

## 8. References

- [spec.md](../../spec.md) - AC-010, REQ-018
- [GitHub Actions Caching](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows)

---

*Task: V-010 | Phase: Validation | Priority: P1*
