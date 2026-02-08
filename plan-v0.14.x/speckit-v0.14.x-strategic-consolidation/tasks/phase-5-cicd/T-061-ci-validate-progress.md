# T-061: Implement CI Job: validate_progress

**Task ID**: T-061
**Phase**: 5
**Priority**: P1
**Estimate**: 2h
**Owner**: @ci-fixer
**Reviewer**: @code-reviewer
**Dependencies**: T-048

---

## 1. Overview

### What

Complete the 'Implement CI Job: validate_progress' work as specified in tasks.md and related issue templates.

### Why

- Aligns with the v0.14.x consolidation plan
- Ensures repeatable delivery across phases
- Reduces risk by documenting clear steps

### Deliverables

- Updated implementation for T-061
- Updated tests or validation evidence
- Documentation or notes as required

## 2. Context and Scope

### Current State

- No automated progress.md validation in CI
- Manual verification of spec-kit documentation
- Inconsistent progress tracking format

### Target State

- GitHub Actions workflow validates all progress.md files on PR
- Schema validation ensures consistent format
- Aggregated progress report generated as CI artifact
- Blocking on invalid progress.md files

### Out of Scope

- Progress.md content quality (only structure validation)
- Historical progress tracking

## 3. Prerequisites

### Dependencies

- T-048: Progress validation script implemented

### Target Files

- `.github/workflows/validate-progress.yml` (new)
- `scripts/validate-progress.ts`
- `artifacts/progress-report.md` (output)

### Tooling

- Node.js 22.x
- GitHub Actions

## 4. Implementation Guide

### Step 4.1: Create Validation Workflow

**File**: `.github/workflows/validate-progress.yml`
```yaml
name: Validate Progress Files

on:
  pull_request:
    paths:
      - 'plan-*/**/progress.md'
      - 'scripts/validate-progress.ts'
  push:
    branches: [main]
    paths:
      - 'plan-*/**/progress.md'

jobs:
  validate-progress:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - run: npm ci

      - name: Validate progress.md files
        run: npx tsx scripts/validate-progress.ts

      - name: Generate progress report
        run: npx tsx scripts/aggregate-progress.ts > artifacts/progress-report.md

      - name: Upload progress report
        uses: actions/upload-artifact@v4
        with:
          name: progress-report
          path: artifacts/progress-report.md
          retention-days: 30
```

### Step 4.2: Implement Validation Script

**File**: `scripts/validate-progress.ts`
```typescript
import { readFileSync } from 'fs';
import { glob } from 'glob';

interface ValidationResult {
  file: string;
  valid: boolean;
  errors: string[];
}

const requiredSections = [
  /^# Progress:/m,
  /## Summary/m,
  /## Phase Progress/m,
];

function validateProgress(filePath: string): ValidationResult {
  const content = readFileSync(filePath, 'utf-8');
  const errors: string[] = [];

  for (const section of requiredSections) {
    if (!section.test(content)) {
      errors.push(`Missing required section: ${section.source}`);
    }
  }

  // Check summary table format
  if (!/\| Total Tasks \|/.test(content)) {
    errors.push('Summary table missing "Total Tasks" row');
  }

  return {
    file: filePath,
    valid: errors.length === 0,
    errors,
  };
}

async function main() {
  const files = await glob('plan-*/**/progress.md');
  const results = files.map(validateProgress);

  const failed = results.filter(r => !r.valid);

  if (failed.length > 0) {
    console.error('\n❌ Progress validation failed:\n');
    for (const result of failed) {
      console.error(`  ${result.file}:`);
      for (const error of result.errors) {
        console.error(`    - ${error}`);
      }
    }
    process.exit(1);
  }

  console.log(`✓ Validated ${results.length} progress.md files`);
}

main();
```

### Step 4.3: Add Aggregate Report Script

**File**: `scripts/aggregate-progress.ts`
```typescript
import { readFileSync } from 'fs';
import { glob } from 'glob';

async function main() {
  const files = await glob('plan-*/**/progress.md');

  console.log('# Aggregated Progress Report');
  console.log(`\n_Generated: ${new Date().toISOString()}_\n`);
  console.log(`## Files: ${files.length}\n`);

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    const titleMatch = content.match(/^# Progress: (.+)/m);
    const title = titleMatch?.[1] ?? file;

    console.log(`### ${title}`);
    console.log(`_Source: ${file}_\n`);

    // Extract summary table
    const summaryMatch = content.match(/\| Metric[\s\S]*?\n\n/);
    if (summaryMatch) {
      console.log(summaryMatch[0]);
    }
  }
}

main();
```
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
- `.github/workflows/validate-progress.yml`
- [issue template](../../issues/templates/issue-027-enforcement-tools.md)

---

*Task: T-061 | Phase: 5 | Priority: P1*
