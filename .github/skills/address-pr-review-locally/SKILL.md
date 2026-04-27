---
name: address-pr-review-locally
description: "Evaluate and address a GitHub pull request review locally. Use when a PR review contains inline comments, suggestions, or requested changes that need to be implemented in the local workspace. Covers fetching review threads, triaging by severity, applying code fixes, running tests, and optionally replying to or resolving review threads."
argument-hint: "PR number (e.g. 1461) or review URL"
---

# Address PR Review Locally

End-to-end workflow for reading a GitHub pull request review, triaging its inline comments, implementing fixes locally, and verifying correctness — without switching to the browser.

## When to Use

- A Copilot, human, or bot reviewer has left inline comments on a PR
- You want to address review feedback without leaving the editor
- A review is in `COMMENTED` or `CHANGES_REQUESTED` state with unresolved threads

## Procedure

### 1. Fetch the Review

Use `mcp_github_pull_request_read` twice in parallel:

```
method: get_reviews       → list all review objects; note state + review ID
method: get_review_comments → full list of review threads with is_resolved/is_outdated
```

Focus on threads where `is_resolved: false` and `is_outdated: false`. Skip `is_outdated: true` unless the underlying concern still applies to the current HEAD.

### 2. Triage Comments

Group unresolved threads into three buckets before writing any code:

| Priority | Trigger | Action |
|---|---|---|
| **P1 — Correctness/Safety** | Bug, data loss, security, destructive overwrite without guard | Fix first |
| **P2 — Correctness/Accuracy** | Misleading docs, wrong test label, logic gap | Fix second |
| **P3 — Style/Improvement** | Refactoring suggestion, docblock wording, minor naming | Fix last or defer |

If a comment includes a `suggestion` block (GitHub's diff suggestion format), use it as the basis for the fix — but verify it compiles and passes tests before accepting verbatim.

### 3. Apply Fixes Locally

For each P1 → P2 → P3 comment:

1. **Open the file** at the line referenced in `comment.path` + `comment.line`
2. **Read surrounding context** (±20 lines) to understand the full function/block
3. **Apply the fix** — prefer the smallest change that addresses the reviewer's concern
4. **Note the discussion thread ID** (`comment.html_url`) for later reply

Common fix patterns from this project:
- Misleading doc comment → update the comment only, not the implementation
- YAML frontmatter without quoting → wrap the interpolated value in YAML-safe quotes
- Hardcoded platform path (e.g. `"/"`) → use `path.parse(current).root` instead
- Overwrite-without-merge → read existing JSON, deep-merge, then write back
- Guard-bypass with `--yes` flag → keep the existing guard, require `--force` for destructive overwrite
- Non-monotonic progress counter → use a shared atomic counter incremented after each task resolves
- TTY check via exception → check `process.stdout.isTTY` or `spinner.isEnabled` explicitly
- Docs referencing files not in the npm package → add a `[!NOTE]` block explaining availability

### 4. Verify

After all fixes are applied:

```sh
npm run build
npm run test
npm run check
```

For changes that touch coverage-relevant files, also run:

```sh
npm run test:coverage
```

Check that thresholds still pass (≥ 90% statements/lines/functions, ≥ 85% branches).

If any test fails, fix the test or the source — do not widen exclusions.

If changes affect skill/instruction specs or workflows, regenerate derived files:

```sh
python3 scripts/generate-tool-definitions.py
npm run check:generated
git add src/generated/ docs/architecture/
```

### 5. Reply to Resolved Threads (optional)

For each thread addressed, use `mcp_github_add_issue_comment` on the PR to post a summary of what was changed:

```
Addressed review feedback:
- [file.ts#L128](url): <one-line description of the fix applied>
- [file.ts#L381](url): <one-line description>
...
```

Or, if responding inline to a specific thread, use `mcp_github_add_reply_to_pull_request_comment` with the thread's `comment.id`.

## Comment Triage Reference (PR #1461 — all resolved)

| File | Line | Priority | Issue | Status |
|---|---|---|---|---|
| `src/cli.ts` | 381 | P1 | `hooks setup` overwrites `~/.claude/settings.json` without merge | ✅ Fixed |
| `src/cli.ts` | 128 | P1 | `--yes` bypasses existing-config guard (destructive without `--force`) | ✅ Fixed |
| `src/runtime/session-store-utils.ts` | 106 | P1 | Hardcoded `"/"` as FS root breaks Windows | ✅ Fixed |
| `src/memory/coherence-scanner.ts` | 224 | P2 | Non-monotonic progress counter in `Promise.all` | ✅ Fixed |
| `src/onboarding/wizard.ts` | 710 | P2 | Unquoted YAML `name:` field may break frontmatter parser | ✅ Fixed |
| `src/runtime/session-store-utils.ts` | 267 | P2 | JSDoc claims snapshot refresh is guarded — it isn't | ✅ Fixed |
| `src/cli/script-runner.ts` | 78 | P2 | TTY non-fallback: `ora` doesn't throw on non-TTY, so fallback never runs | ✅ Fixed |
| `src/cli.ts` | 499 | P2 | Hook reminder points to `.agent/rules/` which isn't in npm package | ✅ Fixed |
| `docs/src/content/docs/reference/env-variables.mdx` | 49 | P2 | Docs imply `DISABLE_ADAPTIVE_ROUTING` is required to use adaptive routing | ✅ Fixed |
| `README.md` | 425 | P2 | `.agent/rules/` described as auto-picked-up but not shipped in npm package | ✅ Fixed |
| `src/tools/shared/tool-surface-manifest.ts` | 80 | P3 | Slim-mode docblock on wrong function | ✅ Fixed |
| `src/tests/tools/shared/tool-surface-manifest.test.ts` | 119 | P3 | Test name says "opt-in" but behavior is now opt-out | ✅ Fixed |

## Quality Criteria

| Check | Pass condition |
|---|---|
| All P1 threads addressed | No destructive-without-guard paths remain |
| All P2 threads addressed | No misleading docs, wrong labels, unguarded logic |
| `npm run build` exits 0 | No compile errors introduced |
| `npm run test` exits 0 | No regressions |
| `npm run check` exits 0 | No lint/format errors (biome) |
| `npm run check:generated` exits 0 | Generated files match canonical specs |
| Outdated threads reviewed | Confirm or dismiss — do not silently ignore |
| Push-ready gate passes | `.github/hooks/push-ready.json` allows the push silently |

> **Auto-enforced**: The `push-ready` hook runs all of the above checks automatically before any `git push` or `merge_pull_request` tool call.

## Anti-Patterns

- Accepting a suggestion block verbatim without verifying it compiles
- Marking a thread "resolved" without making the corresponding code change
- Widening test exclusions or coverage excludes to hide a regression
- Addressing P3 style comments before P1 safety issues
- Replying to review threads before local tests pass
