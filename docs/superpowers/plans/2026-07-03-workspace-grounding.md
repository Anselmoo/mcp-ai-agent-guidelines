# Workspace Grounding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Make no-sampler tool output problem-specific by reading the actual files a request references and matching skill catalogs against real file content instead of the request sentence.

**Architecture:** A shared, additive `workspace-grounding` helper reads named files via the already-injected `WorkspaceReader` (bounded by the adapter's `guardRelativePath`); four high-value skills (`debug-root-cause`, `qual-code-analysis`, `arch-system`, `req-scope`) emit grounded findings with `groundingScope: "workspace"` citing the exact file; `directive-first` suppresses the "⚠️ Directive mode" banner when grounding occurred. Grounding never throws and degrades to today's behaviour when nothing is named or the workspace is absent.

**Tech Stack:** TypeScript ESM (`.js` imports), vitest, biome.

## Global Constraints
- ESM imports use `.js`; no `any`; handlers never throw on missing/unreadable workspace.
- Grounding is additive only; reuse `extractContextFiles`/`unique`/`cap` (all in `recommendations.ts`).
- `npx tsc --noEmit` + targeted vitest after each task; `test:coverage` ≥ 80%; no codegen; commit per task.

## Tasks
1. `extractReferencedPaths(input)` in `recommendations.ts` (+ `recommendations-paths.test.ts`).
2. `src/skills/shared/workspace-grounding.ts`: `readReferencedFiles`/`matchProbes`/`buildWorkspaceEvidence` (+ test).
3. `debug-root-cause`: FLAKE_PROBES against real content, `groundingScope:"workspace"` recs (+ grounding + no-workspace tests).
4. `qual-code-analysis`: reuse `CODE_ANALYSIS_RULES` against content (+ test).
5. `arch-system`: read named files beyond topology, reuse `ARCH_CONCERN_RULES` (+ test).
6. `req-scope`: grounded scope-boundary rec naming referenced modules (+ test).
7. `directive-first.toSituationResult`: banner only when `mode==="directive" && !grounded` (+ test).
8. Fix `contracts.ts:31` comment, CHANGELOG, full `tsc`/`vitest`/coverage/biome + live JSON-RPC proof.

Full step-by-step code lives in this session's transcript; each task is red→green→commit.
