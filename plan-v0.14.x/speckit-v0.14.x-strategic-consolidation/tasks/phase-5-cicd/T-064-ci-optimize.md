# T-064: Optimize CI Pipeline

**Task ID**: T-064
**Phase**: 5
**Priority**: P1
**Estimate**: 4h
**Owner**: @ci-fixer
**Reviewer**: @code-reviewer
**Dependencies**: None

---

## 1. Overview

### What

Complete the 'Optimize CI Pipeline' work as specified in tasks.md and related issue templates.

### Why

- Aligns with the v0.14.x consolidation plan
- Ensures repeatable delivery across phases
- Reduces risk by documenting clear steps

### Deliverables

- Updated implementation for T-064
- Updated tests or validation evidence
- Documentation or notes as required

## 2. Context and Scope

### Current State

- CI pipeline runs ~18 minutes
- No npm caching configured
- Sequential test execution
- Full install on every run

### Target State

- CI pipeline ≤12 minutes (33% reduction)
- npm cache hit rate >80%
- Parallel test execution where possible
- Incremental builds where supported

### Out of Scope

- Self-hosted runners
- Build caching beyond npm

## 3. Prerequisites

### Dependencies

- None (applies to all workflows)

### Target Files

- `.github/workflows/*.yml` (all workflow files)

### Tooling

- GitHub Actions
- actions/setup-node with cache
- actions/cache for custom caching

## 4. Implementation Guide

### Step 4.1: Enable npm Caching

**In all workflows**:
```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '22'
    cache: 'npm'  # Enables npm cache
```

### Step 4.2: Add Dependency Caching

```yaml
- name: Cache node_modules
  uses: actions/cache@v4
  with:
    path: node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

### Step 4.3: Parallelize Test Execution

**File**: `.github/workflows/ci.yml`
```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check

  test:
    runs-on: ubuntu-latest
    needs: lint  # Run after lint passes
    strategy:
      matrix:
        shard: [1, 2, 3]  # Split tests into 3 shards
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:vitest -- --shard=${{ matrix.shard }}/3

  coverage:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:coverage:vitest
```

### Step 4.4: Skip Unnecessary Work

**Path filtering**:
```yaml
on:
  pull_request:
    paths:
      - 'src/**'
      - 'tests/**'
      - 'package*.json'
    paths-ignore:
      - '**.md'
      - 'docs/**'
```

### Step 4.5: Optimize npm ci

```yaml
- run: npm ci --prefer-offline
  env:
    CI: true
```

### Step 4.6: Measure and Track

**Add timing annotations**:
```yaml
- name: Build
  run: |
    start=$(date +%s)
    npm run build
    end=$(date +%s)
    echo "::notice::Build took $((end-start)) seconds"
```

## 5. Expected Results

| Metric         | Before | After  | Improvement |
| -------------- | ------ | ------ | ----------- |
| Total runtime  | 18min  | ≤12min | -33%        |
| npm install    | 2min   | 30s    | -75%        |
| Tests          | 10min  | 6min   | -40%        |
| Cache hit rate | 0%     | >80%   | +80%        |

## 5. Testing Strategy

- Trigger workflow on a test branch
- Validate job steps and failure behavior
- Capture timing metrics

## 6. Risks and Mitigations

- Risk: Scope creep beyond tasks.md
  - Mitigation: Validate against acceptance criteria
- Risk: Integration regressions
  - Mitigation: Run targeted tests and CI checks

## 7. Acceptance Criteria

| Criterion                      | Status | Verification |
| ------------------------------ | ------ | ------------ |
| Workflow runs successfully     | ⬜      | TBD          |
| Failure modes reported clearly | ⬜      | TBD          |
| Runtime/coverage targets met   | ⬜      | TBD          |

---

## 8. References

- [spec.md](../../spec.md)
- [tasks.md](../../tasks.md)

---

*Task: T-064 | Phase: 5 | Priority: P1*
