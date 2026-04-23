---
name: fix-codecov-gaps
description: "Fix Codecov patch coverage gaps reported on a pull request. Use when Codecov bot flags missing or partial lines in a PR comment, when patch coverage is below the project threshold (≥87.55%), or when coverage regresses after new code is merged. Covers reading the Codecov report, identifying uncovered lines per file, writing targeted Vitest tests, verifying improvement, and optionally posting a confirmation reply."
argument-hint: "PR number or Codecov comment URL"
---

# Fix Codecov Coverage Gaps

Restores or improves patch coverage after Codecov flags missing/partial lines in a pull request.

## When to Use

- Codecov bot posts a report showing patch coverage below the project baseline
- A PR introduces new lines without accompanying tests
- Coverage regresses (Misses or Partials increase vs. base)

## Procedure

### 1. Fetch the Codecov Report

Use `mcp_github_pull_request_read` with `method: get_comments` to read PR comments, then locate the comment from `codecov[bot]`. Extract:

- **Patch coverage %** (overall for this PR's changed lines)
- **Files with missing lines** — collect the file path, patch %, missing count, and partial count for each row in the table
- **Coverage diff summary** — Hits Δ, Misses Δ, Partials Δ vs. base

```
Example output to parse:
| src/cli.ts          | 80.30% | 12 Missing + 1 partial |
| src/onboarding/wizard.ts | 83.33% | 0 Missing + 5 partials |
```

### 2. Identify Uncovered Lines Per File

For each file listed in the Codecov report:

1. Open the file and read its contents
2. Cross-reference the diff (`mcp_github_pull_request_read` with `method: get_diff`) to pinpoint which new/changed lines are uncovered
3. Classify each gap:
   - **Missing line** — the line was never executed in any test
   - **Partial branch** — the line ran but not all branches (e.g. both sides of a ternary or `??`)

Priority order: tackle files with the most missing lines first. Partials are secondary.

### 3. Write Targeted Tests

For each uncovered line or partial branch, add or extend a test in `src/tests/<mirrored-path>/<module>.test.ts`:

- **Missing line (error path / guard clause)**: Write a test that triggers the error condition or the early-return branch
- **Missing line (happy path)**: Write a test that calls the function with valid input that exercises that code path
- **Partial branch (ternary / `??` / `&&`)**: Add a test case that exercises the *other* side of the branch

Rules:
- Mirror the source tree: `src/cli.ts` → `src/tests/cli/cli.test.ts`
- Use `vi.fn()` / `vi.spyOn()` for side effects; never mutate module state across tests
- Each new `it()` block must contain at least one `expect()`
- Do **not** use `/* c8 ignore */` to hide the gap — fix the root cause

### 4. Verify Coverage Improvement

```sh
npm run test:coverage
```

Check the text-summary output. Confirm:
- Project coverage does not decrease vs. the pre-PR baseline (≥ 87.55%)
- The files that were flagged show improved patch % in the local report

If thresholds still fail, go back to step 3 and cover the remaining lines.

### 5. Reply to the PR (optional)

After pushing the fixes, use `mcp_github_add_issue_comment` to reply to the Codecov comment thread confirming which gaps were addressed:

```
Coverage gaps addressed:
- src/cli.ts: added tests for <describe branches covered>
- src/onboarding/wizard.ts: added tests for <describe branches covered>
...
Re-run CI to see the updated Codecov report.
```

## Quality Criteria

| Criterion | Pass |
|---|---|
| Patch coverage ≥ project baseline | No new regressions |
| No uncovered lines in changed files remain (or explicit justification) | All rows resolved |
| `npm run test:coverage` exits 0 | Thresholds met |
| Each added test has at least one assertion | No empty stubs |
| Push-ready gate passes | `.github/hooks/push-ready.json` allows the push silently |

> **Auto-enforced**: The `push-ready` hook runs biome, generated-file drift, and changelog checks automatically before any `git push`.

## Reference: Project Coverage Thresholds

From `vitest.config.ts`:

```
statements: 90%, lines: 90%, functions: 90%, branches: 85%
perFile: false  (aggregate only)
```

Codecov project baseline (from PR #1461): **87.55%**

## Anti-Patterns

- Adding `/* c8 ignore next */` to skip coverage on real logic
- Writing tests that mock away the exact code path being measured
- Widening `vitest.config.ts → coverage.exclude` to drop a file from reporting
- Counting integration tests in unrelated files as coverage for the new module
