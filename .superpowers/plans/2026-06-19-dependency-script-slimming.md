# Dependency & Script Slimming Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove dependencies and scripts the codebase does not actually use — a dead second test runner, an unused interactive-prompt stack, and "reserved-for-future" packages — and triage the script block into CI-backed vs orphaned, without breaking any green check.

**Architecture:** Verify-then-remove. Each removal is gated on a grep proving zero usage across `src/`, `scripts/`, and skill/docs references, plus a green `npm run build && npx vitest run` and a passing `npm run audit:deps:check`. The project's own `scripts/audit-dependency-usage.py` carries a "reserved" allowlist that must be updated in lockstep so the audit stays green.

**Tech Stack:** npm, vitest 4, biome, the repo's Python audit scripts.

## Global Constraints

- **Verify before removing.** No dependency is removed without a grep across `src/` AND `scripts/` showing zero importers. Reserved-list notes in `scripts/audit-dependency-usage.py` are not proof of use.
- The Vercel AI SDK trio (`@ai-sdk/anthropic`, `@ai-sdk/openai`, `ai`) is removed by the **Sampler Seam plan, Task 0** (`2026-06-19-sampler-seam.md`). Do that first; this plan does not duplicate it.
- Conservative on scripts: delete only scripts with zero callers AND no standalone manual value. Keep manual diagnostics (`test:coverage`, `test:mcp:smoke`); document rather than delete when in doubt.
- After every removal: `npm run build && npx vitest run` green, and `npm run audit:deps:check` exits 0 (or only the intended reserved-list delta).
- After dependency edits, regenerate the lockfile (`npm install`) and commit `package-lock.json` alongside `package.json`.

---

### Task 1: Remove the dead jest second test runner

**Files:**
- Modify: `package.json` (remove `test:jest` script line 14, `jest` devDep line 112)
- Delete: `jest.config.mjs`

- [ ] **Step 1: Confirm jest is unused**

Run:
```bash
grep -rEn "@jest/globals|from \"jest\"|jest\.(fn|mock|spyOn)" src/ ; echo "---"
grep -rn "test:jest\|jest" .github/workflows/ lefthook.yml 2>/dev/null
```
Expected: no jest-style test imports in `src/`; no CI/lefthook reference to jest. (All tests are vitest.)

- [ ] **Step 2: Remove the script, the devDep, and the config**

Delete the `"test:jest": ...` line from `package.json` scripts. Then:
```bash
npm uninstall jest
git rm jest.config.mjs
```

- [ ] **Step 3: Verify + commit**

Run: `npm run build && npx vitest run`
Expected: full suite green (vitest unaffected).

```bash
git add package.json package-lock.json jest.config.mjs
git commit -m "chore(deps): remove unused jest test runner (all tests are vitest)"
```

---

### Task 2: Remove the unused interactive-prompt stack

**Files:**
- Modify: `package.json` (`@inquirer/prompts` dep:125, `inquirer` devDep:111, `@types/inquirer` devDep:103)
- Modify: `scripts/audit-dependency-usage.py` (drop `@inquirer/prompts` from the reserved allowlist)

- [ ] **Step 1: Confirm zero usage**

Run:
```bash
grep -rEn "from \"@?inquirer|require\(['\"]@?inquirer" src/ scripts/
```
Expected: no results. (`@inquirer/prompts` is RESERVED per the audit; `inquirer`/`@types/inquirer` have no importers.)

- [ ] **Step 2: Remove the packages**

```bash
npm uninstall @inquirer/prompts inquirer @types/inquirer
```

- [ ] **Step 3: Drop `@inquirer/prompts` from the audit's reserved allowlist**

In `scripts/audit-dependency-usage.py`, find the reserved/allowlist entry for `@inquirer/prompts` (its note is "Reserved for interactive CLI prompt components") and delete that entry so the audit does not expect the package to exist.

- [ ] **Step 4: Verify + commit**

Run: `npm run build && npx vitest run && python3 scripts/audit-dependency-usage.py`
Expected: suite green; audit reports no missing/extra package.

```bash
git add package.json package-lock.json scripts/audit-dependency-usage.py
git commit -m "chore(deps): remove unused inquirer prompt stack"
```

---

### Task 3: Prune the remaining RESERVED dependencies (one verified removal at a time)

**Files:**
- Modify: `package.json`, `scripts/audit-dependency-usage.py`

RESERVED per the audit and never imported in `src/`: `@noble/hashes`, `devalue`, `execa`, `fflate`, `ora`, `uint8array-extras`, `zx`. (Session HMAC uses `node:crypto`, not `@noble/hashes`.)

- [ ] **Step 1: Build the proof table**

For each candidate, run:
```bash
for p in @noble/hashes devalue execa fflate ora uint8array-extras zx; do
  echo "== $p =="; grep -rEn "from \"$p|require\(['\"]$p" src/ scripts/ || echo "  (no importers)";
done
```
Record which truly have zero importers.

- [ ] **Step 2: Remove only the zero-importer packages**

For each confirmed-unused package: `npm uninstall <pkg>` and delete its entry from the reserved allowlist in `scripts/audit-dependency-usage.py`. Keep any package that Step 1 showed an importer for (and report the surprise).

- [ ] **Step 3: Verify after each removal**

Run: `npm run build && npx vitest run && python3 scripts/audit-dependency-usage.py`
Expected: green after each. If a removal breaks the build, restore that one package and note it as genuinely used.

- [ ] **Step 4: Commit the pruned set**

```bash
git add package.json package-lock.json scripts/audit-dependency-usage.py
git commit -m "chore(deps): drop reserved-but-unused runtime dependencies"
```

---

### Task 4: Triage the npm script block

**Files:**
- Modify: `package.json` (scripts)
- Modify: `CONTRIBUTING.md` (document the script taxonomy)

CI invokes: `build`, `docs:build`, `generate:skill-docs`, `generate:skill-graph`, `quality` (which chains `verify_matrix.py`, `test_generate_tool_definitions`, `check:workflow-docs`, `check`, `audit-dependency-usage.py`). Lefthook invokes `check`. The vitest test jobs run `test`/`test:coverage`.

- [ ] **Step 1: Classify every script**

For each script in `package.json`, label it CI-gated, manual-diagnostic (keep, document), or orphaned (no caller, no standalone value). Use:
```bash
grep -rhoE "npm run [a-z:]+" .github/workflows/ ; grep -rn "run:" lefthook.yml
```

- [ ] **Step 2: Delete only clearly-orphaned scripts**

Remove scripts that are both uncalled and redundant. Candidates to evaluate (do NOT blanket-delete — confirm each has no manual value): `test:mcp:py:inspector` + `pretest:mcp:py:inspector` (niche inspector variant), `toon:markdown` (one-off converter). Keep `test:coverage`, `test:mcp:smoke`, and the `audit:*`/`generate:*` diagnostics — they have manual value even when not CI-gated.

- [ ] **Step 3: Document the surviving scripts**

Add a short "npm scripts" table to `CONTRIBUTING.md` grouping them: build/dev, test (vitest lanes), MCP smoke, lint/format, audits, codegen, docs — with a one-line purpose each and a "CI-gated?" column. This is the durable fix for the "which scripts matter" confusion.

- [ ] **Step 4: Verify + commit**

Run: `npm run build && npm run quality`
Expected: green (the quality chain still resolves every script it calls).

```bash
git add package.json CONTRIBUTING.md
git commit -m "chore(scripts): remove orphaned scripts and document the script taxonomy"
```

---

### Task 5: Final whole-package verification

- [ ] **Step 1: Mirror the CI gates locally**

Run:
```bash
npm install            # regenerate a clean lockfile
npm run build
npx tsc --noEmit
npx vitest run
npm run quality
python3 scripts/audit-dependency-usage.py
```
Expected: all green; the audit's USED/RESERVED summary reflects the pruned set with no "missing package" errors.

- [ ] **Step 2: Confirm the published surface is intact**

Run: `npm pack --dry-run` and confirm `dist/`, `README.md`, `CHANGELOG.md`, `LICENSE` are present and no removed dependency is referenced by `dist/`.

```bash
git add -A
git commit -m "chore(deps): finalize dependency and script slimming" || echo "nothing to finalize"
```

## Self-Review

- **Spec coverage:** jest stack → Task 1; inquirer stack → Task 2; reserved deps → Task 3; script triage + docs → Task 4; whole-package verify → Task 5. AI-SDK trio → cross-referenced to Sampler Seam Task 0 (not duplicated).
- **Safety:** every removal is grep-gated and followed by a green-suite + audit check; Task 3 removes one package at a time with rollback guidance. Script deletion is explicitly conservative.
- **Type consistency:** no production types are introduced; the only code edits are deletions and the audit allowlist updates that must accompany each dependency removal.
- **Placeholder scan:** Task 3/4 leave the exact final set to per-candidate grep results because "unused" must be proven at execution, not assumed — the verification procedure is concrete, not deferred.
