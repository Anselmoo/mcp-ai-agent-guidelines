---
name: pr-quality-cycle
description: "Combined PR quality workflow: address inline review comments AND fix Codecov patch coverage gaps in one end-to-end cycle. Use when a PR has both review feedback and coverage regression, or when you want a single checklist that covers triage, code fixes, test additions, verification, and push-gate validation before merging."
argument-hint: "PR number or review URL (e.g. 1461 or https://github.com/…/pull/1461#pullrequestreview-…)"
---

# PR Quality Cycle

End-to-end workflow that combines inline review triage **and** Codecov patch coverage repair into a single linear cycle. Eliminates the context-switch between "fix what reviewers flagged" and "fix what CI flagged", so both land in the same commit batch.

## When to Use

- A PR is in `CHANGES_REQUESTED` or `COMMENTED` state **and** Codecov reports patch coverage below baseline
- You want a single checklist for a complete PR quality pass without toggling between two separate skills
- A bot review (Copilot, human reviewer) and the Codecov bot have both left comments on the same PR

This skill supersedes running `address-pr-review-locally` + `fix-codecov-gaps` separately. Use those individual skills when you need only one of the two passes.

---

## Procedure

### Phase 1 — Fetch All Feedback in Parallel

Run two GitHub reads simultaneously:

```
mcp_github_pull_request_read  method: get_review_comments   → inline review threads
mcp_github_pull_request_read  method: get_comments          → PR-level comments (Codecov bot lives here)
```

From **review threads**: collect every thread where `is_resolved: false` and `is_outdated: false`.

From **PR-level comments**: locate the `codecov[bot]` comment. Extract:
- **Patch coverage %** (e.g. `85.79%`)
- **Files table** — each row has file path, patch %, missing count, partial count

> **PR #1461 reference** — review: [`#pullrequestreview-4157854720`](https://github.com/Anselmoo/mcp-ai-agent-guidelines/pull/1461#pullrequestreview-4157854720) | Codecov: [`#issuecomment-4299851177`](https://github.com/Anselmoo/mcp-ai-agent-guidelines/pull/1461#issuecomment-4299851177)

---

### Phase 2 — Triage Review Comments (P1 → P2 → P3)

Group unresolved threads before writing any code:

| Priority | Trigger | Fix order |
|---|---|---|
| **P1 — Safety/Correctness** | Destructive overwrite, data-loss risk, security guard missing | First |
| **P2 — Accuracy** | Misleading docs, wrong label, logic gap, unquoted YAML | Second |
| **P3 — Style** | Docblock wording, minor naming, refactoring suggestion | Last / defer |

Common fix patterns for this project:

| Symptom | Fix |
|---|---|
| Overwrites config without merge | Read → deep-merge JSON → write |
| `--yes` bypasses destructive guard | Keep guard; require `--force` instead |
| Hardcoded `"/"` as FS root | Use `path.parse(current).root` |
| Unquoted YAML `name:` with `: ` | Wrap in quotes: `` `name: "${spec.toolName}"` `` |
| Non-monotonic progress counter | `let completed = 0;` outside `.map`; use `completed++` |
| TTY fallback never triggers | Check `process.stdout.isTTY` explicitly |
| Docs pointing to paths not in npm | Add `[!NOTE]` explaining availability; link README instead |
| Slim-mode docblock on wrong fn | Move docblock to the correct function |

Apply fixes P1 first, noting each thread's `html_url` for the reply step.

---

### Phase 3 — Fix Codecov Coverage Gaps

For each file in the Codecov table, sorted by missing-line count descending:

1. Open the file and read the diff (`mcp_github_pull_request_read method: get_diff`) to identify which new/changed lines are uncovered.
2. Classify each gap:
   - **Missing line** — line never executed in any test
   - **Partial branch** — line ran but not all branches (ternary, `??`, `&&`)
3. Add or extend a test in `src/tests/<mirrored-path>/<module>.test.ts`:
   - Mirror the source tree: `src/cli.ts` → `src/tests/cli/cli.test.ts`
   - Use `vi.fn()` / `vi.spyOn()` for side effects; never mutate module state across tests
   - Each `it()` block must have at least one `expect()`
   - **Do not** use `/* c8 ignore */` to hide the gap — fix the root cause

> **PR #1461 Codecov snapshot** (patch was 85.79%, 26 lines missing):
>
> | File | Patch % | Gaps |
> |---|---|---|
> | `src/cli.ts` | 80.30% | 12 Missing + 1 partial |
> | `src/onboarding/wizard.ts` | 83.33% | 0 Missing + 5 partials |
> | `src/memory/toon-interface.ts` | 76.47% | 3 Missing + 1 partial |
> | `src/cli/script-runner.ts` | 85.71% | 1 Missing + 1 partial |
> | `src/runtime/session-store-utils.ts` | 94.11% | 0 Missing + 2 partials |

---

### Phase 4 — Verify Everything

```sh
npm run build           # no compile errors
npm run test            # no regressions
npm run check           # biome lint/format clean
npm run test:coverage   # patch ≥ project baseline (87.55%); thresholds ≥ 90/90/90/85
```

If changes touch skill/instruction specs or workflows, also regenerate derived files:

```sh
python3 scripts/generate-tool-definitions.py
npm run check:generated
git add src/generated/ docs/architecture/
```

If any check fails: fix the source or test — do not widen exclusions or thresholds.

---

### Phase 5 — Reply to Threads (optional)

Post a single PR-level comment summarising both passes:

```
Review feedback addressed:
- [file.ts#L128](url): <one-line fix description>
- [file.ts#L381](url): <one-line fix description>
...

Coverage gaps closed:
- src/cli.ts: added tests for <describe branches covered>
- src/memory/toon-interface.ts: added tests for <describe branches covered>
...

Re-run CI to see updated Codecov report.
```

Use `mcp_github_add_issue_comment` for the PR-level summary, or `mcp_github_add_reply_to_pull_request_comment` for inline thread replies.

---

## Quality Criteria

| Check | Pass condition |
|---|---|
| All P1 review threads addressed | No destructive-without-guard paths remain |
| All P2 review threads addressed | No misleading docs, wrong labels, unguarded logic |
| Patch coverage ≥ project baseline | No new Codecov regressions (≥ 87.55%) |
| Each new test has ≥ 1 assertion | No empty stubs |
| `npm run build` exits 0 | No compile errors |
| `npm run test` exits 0 | No test regressions |
| `npm run check` exits 0 | Biome lint/format clean |
| `npm run check:generated` exits 0 | Generated files match canonical specs |
| Outdated threads reviewed | Confirm or dismiss — do not silently ignore |
| Push-ready gate passes | `.github/hooks/push-ready.json` allows the push silently |

> **Auto-enforced**: The `push-ready` hook (`node .github/hooks/scripts/push-ready.js`) runs biome, generated-file drift, skills freshness, and changelog checks automatically before any `git push` or `merge_pull_request` tool call. Set `PUSH_READY_DISABLE=true` to bypass in CI.

---

## Reference: PR #1461 Triage Log (fully resolved)

All 12 Copilot review comments from [`#pullrequestreview-4157854720`](https://github.com/Anselmoo/mcp-ai-agent-guidelines/pull/1461#pullrequestreview-4157854720) and all 26 Codecov missing lines from [`#issuecomment-4299851177`](https://github.com/Anselmoo/mcp-ai-agent-guidelines/pull/1461#issuecomment-4299851177) were resolved in this cycle.

| File | Line | Priority | Issue | Resolution |
|---|---|---|---|---|
| `src/cli.ts` | 381 | P1 | `hooks setup` overwrites `~/.claude/settings.json` without merge | ✅ Write to `mcp-ai-agent-guidelines-hooks.json` |
| `src/cli.ts` | 128 | P1 | `--yes` bypasses existing-config guard | ✅ Added `--force` flag; guard kept |
| `src/runtime/session-store-utils.ts` | 106 | P1 | Hardcoded `"/"` as FS root (Windows breakage) | ✅ `parse(current).root` |
| `src/memory/coherence-scanner.ts` | 224 | P2 | Non-monotonic progress counter in `Promise.all` | ✅ Shared `completed++` counter |
| `src/onboarding/wizard.ts` | 710 | P2 | Unquoted YAML `name:` field | ✅ `name: "${spec.toolName}"` |
| `src/runtime/session-store-utils.ts` | 267 | P2 | JSDoc implies guard that doesn't exist | ✅ Reworded to "Callers that perform filesystem mutations can use this to gate writes" |
| `src/cli/script-runner.ts` | 78 | P2 | TTY fallback never triggers | ✅ Explicit `process.stdout.isTTY === true` check |
| `src/cli.ts` | 499 | P2 | Reminder points to `.agent/rules/` (not in npm pkg) | ✅ Now points to `README.md or https://github.com/Anselmoo/mcp-ai-agent-guidelines` |
| `docs/…/env-variables.mdx` | 49 | P2 | Docs implied flag is required to *use* adaptive routing | ✅ "…remain available **unless** this flag is set" |
| `README.md` | 425 | P2 | `.agent/rules/` described as auto-picked-up | ✅ Added `[!NOTE]` block |
| `src/tools/shared/tool-surface-manifest.ts` | 80 | P3 | Slim-mode docblock on wrong function | ✅ Removed misplaced bullet |
| `src/tests/…/tool-surface-manifest.test.ts` | 119 | P3 | Test name said "opt-in" | ✅ Renamed to "opt-out model" |

Coverage fixes: added tests for `withSpinner`, `withProgressSpinner`, `onboard --force`, and `toon-interface refresh+onProgress`.

---

## Coverage Thresholds (from `vitest.config.ts`)

```
statements: 90%   lines: 90%   functions: 90%   branches: 85%
perFile: false  (aggregate only)
```

Codecov project baseline: **87.55%**

---

## Anti-Patterns

- Accepting a suggestion block verbatim without verifying it compiles
- Marking a thread "resolved" before making the code change
- Widening `vitest.config.ts → coverage.exclude` to hide a coverage gap
- Using `/* c8 ignore next */` on real logic instead of adding a test
- Addressing P3 style comments before P1 safety issues
- Pushing before the push-ready gate returns `{"continue":true}`
