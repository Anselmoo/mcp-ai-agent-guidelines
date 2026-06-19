# Complete TOON Removal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Delete the residual local TOON long-term-memory subsystem and both crypto keys that #1517 left behind, leaving Serena as the memory backend and a keyless file session store.

**Architecture:** Compiler-driven deletion (the #1517 method): remove the TOON modules + the MAC, then fix every `tsc` error by deleting the now-dead consumer. The session store stays for workflow continuity but becomes keyless — reads validate via the existing Zod `sessionDataSchema`; corruption → treated as missing → fresh session.

**Tech Stack:** TypeScript (ESM, `.js` specifiers, TABS), vitest 4, biome, Python codegen.

## Global Constraints

- **Branch:** execute on a fresh branch off `main` (`ad5247c8`), NOT on `feat/sampler-real-analysis`. Create it via superpowers:using-git-worktrees at execution start.
- Serena seam (`src/serena/client.ts`) is the memory backend — do not change it.
- Keep the session store (`SecureFileSessionStore`, `session-*.json`) for workflow continuity; make it keyless. Keep the name this pass (revisit naming separately).
- The `mac` field stays `z.string().optional()` in `sessionDataSchema` so existing session files still parse; new writes omit it.
- ESM `.js` imports, TABS. Run `npx biome check --write <files>` before each commit. The lefthook pre-commit runs `biome check` — keep it green.
- After dependency removal, run `python3 scripts/audit-dependency-usage.py` and update its reserved allowlist in lockstep.
- Run a single `npm install` after package.json edits to resync the lockfile.

---

### Task 1: Make `SecureFileSessionStore` keyless (deletes the unhandled-rejection bug)

**Files:**
- Modify: `src/runtime/secure-session-store.ts`
- Modify: `src/config/runtime-defaults.ts` (drop `enableMac`)
- Test: `src/tests/runtime/secure-session-store.test.ts`

**Interfaces:**
- Produces: `SecureFileSessionStore` with no MAC — `readSessionHistoryResult` returns `{records, missing, integrityFailure: false, error?}`; a garbled file → `missing: true`.

- [ ] **Step 1: Write the failing keyless test**

Add to `src/tests/runtime/secure-session-store.test.ts`:

```typescript
it("treats a garbled session file as missing without any MAC key", async () => {
	const dir = mkdtempSync(join(tmpdir(), "keyless-"));
	const prev = process.env.MCP_AI_AGENT_GUIDELINES_STATE_DIR;
	process.env.MCP_AI_AGENT_GUIDELINES_STATE_DIR = dir;
	try {
		const store = new SecureFileSessionStore();
		await writeFile(join(dir, "session-keyless01.json"), "{ not valid json");
		const result = await store.readSessionHistoryResult("session-keyless01");
		expect(result.missing).toBe(true);
		expect(result.integrityFailure).toBe(false);
		// No key file was created.
		expect(existsSync(join(dir, "config", "session-integrity.key"))).toBe(false);
	} finally {
		if (prev === undefined) delete process.env.MCP_AI_AGENT_GUIDELINES_STATE_DIR;
		else process.env.MCP_AI_AGENT_GUIDELINES_STATE_DIR = prev;
		rmSync(dir, { recursive: true, force: true });
	}
});
```

Ensure `existsSync` (node:fs) and `writeFile` (node:fs/promises) are imported in the test.

- [ ] **Step 2: Run it, expect failure**

Run: `npx vitest run src/tests/runtime/secure-session-store.test.ts -t "garbled session file"`
Expected: FAIL — a `config/session-integrity.key` is created (MAC still active).

- [ ] **Step 3: Strip the MAC from the store**

In `src/runtime/secure-session-store.ts`: delete `secretKeyPromise`, `resolveSecretKey`, `generateMac`, `verifyMac`, `getMacValidationError`, and the `enableMac` option. Remove the imports `signSessionData`, `resolveOrCreatePersistentSecret`, `SESSION_MAC_KEY_ENV_VAR`, `SESSION_MAC_KEY_FILE` (from `./session-crypto.js`) and `timingSafeEqual` (from `node:crypto`). In write paths, stop setting `mac`; in `readSessionHistoryResult`, delete the `getMacValidationError` call and the `integrityFailure: true` branch (always `false`). Keep `mac?` optional in the Zod schema and `SessionData` interface.

In `src/config/runtime-defaults.ts`, delete the `enableMac: true` line from `DEFAULT_SESSION_INTEGRITY_OPTIONS_VALUES`. Remove `enableMac` from the `SessionIntegrityOptions` interface in the store.

- [ ] **Step 4: Run the suite, expect pass**

Run: `npx vitest run src/tests/runtime/secure-session-store.test.ts`
Expected: PASS (delete or update any test asserting MAC/`integrityFailure: true` behavior).

- [ ] **Step 5: Typecheck + commit**

Run: `npx tsc --noEmit && npx biome check --write src/runtime/secure-session-store.ts src/config/runtime-defaults.ts src/tests/runtime/secure-session-store.test.ts`

```bash
git add src/runtime/secure-session-store.ts src/config/runtime-defaults.ts src/tests/runtime/secure-session-store.test.ts
git commit -m "refactor(session): make the session store keyless (drop the MAC)"
```

---

### Task 2: Delete the TOON memory modules

**Files:**
- Delete: `src/memory/toon-interface.ts`, `src/memory/shared-memory.ts`, `src/memory/toon-memory-helpers.ts`, `src/snapshots/toon_markdown.ts`
- Delete: their test mirrors under `src/tests/`
- Modify: every consumer surfaced by `tsc` (`src/index.ts`, `src/tools/tool-call-handler.ts`, `src/resources/resource-surface.ts`)

**Interfaces:**
- Consumes: nothing new.
- Produces: no `sharedToonMemoryInterface`, no `ToonMemoryInterface`, no local memory persistence.

- [ ] **Step 1: Delete the modules and their tests**

```bash
git rm src/memory/toon-interface.ts src/memory/shared-memory.ts src/memory/toon-memory-helpers.ts src/snapshots/toon_markdown.ts
git rm $(git ls-files 'src/tests/**' | grep -Ei 'toon-interface|toon-memory|shared-memory|toon_markdown')
```

- [ ] **Step 2: Let the compiler enumerate the breakage**

Run: `npx tsc --noEmit 2>&1 | head -40`
Expected: errors in `src/index.ts`, `src/tools/tool-call-handler.ts`, `src/resources/resource-surface.ts`. Record each.

- [ ] **Step 3: Remove the TOON anchoring in `src/index.ts`**

Delete the `sharedToonMemoryInterface` import. In `anchorStateToClientRoots`, drop the `memoryInterface` parameter and every `setBaseDir(...)` call (including the ephemeral redirect added on the sampler branch — it has no target once TOON is gone). Delete the "skills, sessions, model mode" memory line from the startup orientation log if it references the memory interface.

- [ ] **Step 4: Remove the `MCP_LOCAL_MEMORY` path in `src/tools/tool-call-handler.ts`**

Delete the `memoryInterface` import (`../memory/shared-memory.js`), the `MCP_LOCAL_MEMORY` env check (around line 63-65), and the gated write/read enrichment branch it guards. Keep the Serena enrichment footer untouched.

- [ ] **Step 5: Remove memory resources in `src/resources/resource-surface.ts`**

Delete the `ToonMemoryInterface` / `ToonMemoryArtifact` imports, the `@toon-format/toon` `toonEncode` import, the `splitProgressRecords` import, `buildMemoryArtifactIndex`, the `memoryInterface` parameter/overloads, and the memory-artifact resource entries. Keep the non-memory public resources (session list, workspace) intact.

- [ ] **Step 6: Typecheck clean**

Run: `npx tsc --noEmit`
Expected: clean. If a remaining file still imports a deleted symbol, delete that consumer code too.

- [ ] **Step 7: Run the resource + server + tool-handler suites**

Run: `npx vitest run src/tests/resources/ src/tests/runtime/mcp-server.test.ts src/tests/tools/ src/tests/mcp/tool-coverage-matrix.test.ts`
Expected: PASS (remove any memory-resource assertions that referenced the deleted artifacts).

- [ ] **Step 8: Commit**

Run: `npx biome check --write src/`

```bash
git add -A
git commit -m "refactor(memory): delete residual TOON memory modules and consumers"
```

---

### Task 3: Strip the now-dead crypto + drop the `@toon-format/toon` dependency

**Files:**
- Modify/trim: `src/runtime/session-crypto.ts`
- Modify: `src/memory/*` consumers of encryption (none should remain after Task 2 — verify)
- Modify: `package.json`, `scripts/audit-dependency-usage.py`

**Interfaces:**
- Produces: a session-crypto module containing only what still has consumers (likely empty → delete the file).

- [ ] **Step 1: Find remaining `session-crypto` + `@toon-format/toon` consumers**

Run:
```bash
grep -rn "session-crypto" src/ | grep -v "\.test\."
grep -rn "@toon-format/toon" src/ | grep -v "\.test\."
```
Expected after Task 2: only `lead-software-evangelist.ts` mentions `@toon-format/toon` in advisory prose (a string, not an import) — edit that string to drop the package name. `session-crypto` should have no non-test importers.

- [ ] **Step 2: Delete the orphaned crypto**

If `session-crypto.ts` has no remaining importers: `git rm src/runtime/session-crypto.ts` and its test. If `resolveOrCreatePersistentSecret` or the encryption fns still have a consumer you missed, delete that consumer first (it is TOON residue). Re-run `npx tsc --noEmit` until clean.

- [ ] **Step 3: Drop the dependency**

Edit `package.json` to remove `"@toon-format/toon": "^2.1.0",`. Remove any `@toon-format/toon` entry from the reserved allowlist in `scripts/audit-dependency-usage.py` (if present).

- [ ] **Step 4: Resync + audit**

Run:
```bash
npm install
npx tsc --noEmit
python3 scripts/audit-dependency-usage.py
```
Expected: tsc clean; audit reports no missing/extra package.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor(crypto): remove dead session-crypto and the @toon-format/toon dependency"
```

---

### Task 4: Regenerate, full verification, and footprint check

**Files:** generated artifacts under `src/generated/`, docs.

- [ ] **Step 1: Regenerate generated files**

Run: `python3 scripts/generate-tool-definitions.py && npm run generate:skill-graph && npm run generate:skill-docs`
Then: `git diff --exit-code src/generated/ docs/architecture/03-skill-graph.md`
Expected: no drift (commit any legitimate regeneration).

- [ ] **Step 2: Full suite — confirm unhandled rejections are gone**

Run: `npm run build && npx vitest run`
Expected: green; the **Errors (unhandled rejections) count is 0** (the session-crypto secret path is deleted); test count falls by the removed TOON/MAC suites.

- [ ] **Step 3: Footprint check (the #1517 success criterion)**

Run the built server against a scratch workspace and confirm a clean run writes **no** `config/*.key` and **no** `memory/` directory:
```bash
ls -la <scratch>/.mcp-ai-agent-guidelines/ 2>/dev/null
```
Expected: no `config/session-integrity.key`, no `config/session-context.key`, no `memory/`.

- [ ] **Step 4: Targeted no-legacy + coverage-matrix suites**

Run: `npx vitest run src/tests/mcp/tool-coverage-matrix.test.ts src/tests/runtime/mcp-server.test.ts src/tests/tools/`
Expected: PASS.

- [ ] **Step 5: Final commit + open PR off main**

```bash
git add -A && git commit -m "chore: regenerate after TOON removal" || echo "no drift"
git push -u origin HEAD
gh pr create --base main --title "refactor: complete TOON removal (finish #1517)" --body "Removes the residual TOON memory modules, both crypto keys, and the @toon-format/toon dependency that #1517 left behind. Serena remains the memory backend; the session store is now keyless. Eliminates the session-crypto unhandled-rejection bug at its source."
```

## Self-Review

- **Spec coverage:** keyless session store + delete-the-bug → Task 1; delete TOON modules + consumers (index/tool-handler/resource) → Task 2; strip crypto + drop `@toon-format/toon` → Task 3; regenerate + verify + footprint → Task 4. Both keys removed (MAC in Task 1, context-encryption with session-crypto in Task 3). Covered.
- **Type consistency:** `mac?` stays optional across Task 1 (schema/interface). `SecureFileSessionStore` name preserved per the spec's naming decision. No new types introduced.
- **Placeholder scan:** Task 2/3 deliberately let `tsc` enumerate consumers rather than pre-listing every line — this is the #1517 method, with concrete delete instructions per surfaced file, not a deferred decision.
- **Compiler-driven safety:** every deletion task ends at `tsc --noEmit` clean + a passing targeted suite before commit.
