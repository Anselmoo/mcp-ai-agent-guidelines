# Persistence Hygiene Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop the server from littering user projects — fix the orphaned `.tmp` leak and make all local session/memory persistence opt-out via an ephemeral mode, without changing default behavior.

**Architecture:** The leak is in `writeTextFileAtomic` (write-temp → rename, no cleanup on failure). The ephemeral mode rides the existing `SessionStateStore` interface seam (today's `SecureFileSessionStore` gets an in-memory sibling) plus the existing `MCP_AI_AGENT_GUIDELINES_STATE_DIR` env-resolution path, gated by a new `MCP_AI_AGENT_GUIDELINES_EPHEMERAL` flag.

**Tech Stack:** TypeScript (ESM, `.js` specifiers, TABS), Node `fs/promises`, vitest 4.

## Global Constraints

- Default behavior is unchanged: with no env flags set, disk persistence works exactly as today.
- `SessionStateStore` interface (`src/contracts/runtime.ts:194`) is the seam — implement against it, do not widen it.
- Touch the existing env-resolution in `src/runtime/session-store-utils.ts` (`SESSION_STATE_DIR_ENV_VAR` at line 40); add the ephemeral flag beside it.
- ESM `.js` imports, TABS. Run `npx biome check --write <files>` before each commit.

---

### Task 1: Fix the orphaned `.tmp` leak

**Files:**
- Modify: `src/runtime/session-store-utils.ts:284-292` (`writeTextFileAtomic`)
- Test: `src/tests/runtime/session-store-utils.test.ts` (add cases)

**Interfaces:**
- Produces: `writeTextFileAtomic` unchanged signature, but guarantees no `.tmp` file survives a failed write/rename.

- [ ] **Step 1: Write the failing regression test**

Add to `src/tests/runtime/session-store-utils.test.ts`:

```typescript
import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeTextFileAtomic } from "../../runtime/session-store-utils.js";

it("leaves no .tmp file behind on a successful write", async () => {
	const dir = await mkdtemp(join(tmpdir(), "atomic-"));
	await writeTextFileAtomic(join(dir, "a.json"), "ok");
	const entries = await readdir(dir);
	expect(entries.filter((e) => e.endsWith(".tmp"))).toHaveLength(0);
	await rm(dir, { recursive: true, force: true });
});

it("removes the temp file when the rename fails", async () => {
	const dir = await mkdtemp(join(tmpdir(), "atomic-"));
	// Force rename to fail by pointing the target at a directory path.
	const target = join(dir, "sub");
	await writeFile(join(dir, "decoy"), "x");
	await expect(
		writeTextFileAtomic(join(target, "nested", "deeper", "..", "..", "..", "..", "x"), "data"),
	).rejects.toBeTruthy();
	const entries = await readdir(dir);
	expect(entries.filter((e) => e.endsWith(".tmp"))).toHaveLength(0);
	await rm(dir, { recursive: true, force: true });
});
```

- [ ] **Step 2: Run, verify the rename-failure case fails (orphan `.tmp` remains)**

Run: `npx vitest run src/tests/runtime/session-store-utils.test.ts`
Expected: the "removes the temp file when the rename fails" test FAILS (a `.tmp` is left behind).

- [ ] **Step 3: Add `try/finally` cleanup**

Replace the body of `writeTextFileAtomic` (`src/runtime/session-store-utils.ts:284`):

```typescript
export async function writeTextFileAtomic(
	targetPath: string,
	contents: string,
): Promise<void> {
	await mkdir(dirname(targetPath), { recursive: true });
	const tempPath = `${targetPath}.${randomUUID()}.tmp`;
	let renamed = false;
	try {
		await writeFile(tempPath, contents, "utf8");
		await rename(tempPath, targetPath);
		renamed = true;
	} finally {
		if (!renamed) {
			await rm(tempPath, { force: true }).catch(() => {});
		}
	}
}
```

Add `rm` to the existing `node:fs/promises` import at the top of the file.

- [ ] **Step 4: Run, verify GREEN**

Run: `npx vitest run src/tests/runtime/session-store-utils.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

Run: `npx tsc --noEmit && npx biome check --write src/runtime/session-store-utils.ts src/tests/runtime/session-store-utils.test.ts`

```bash
git add src/runtime/session-store-utils.ts src/tests/runtime/session-store-utils.test.ts
git commit -m "fix(persistence): clean up temp file on failed atomic write"
```

---

### Task 2: Startup sweep of stale `.tmp` files

**Files:**
- Modify: `src/runtime/session-store-utils.ts` (add `sweepStaleTempFiles`)
- Modify: `src/index.ts` (call it once after the state dir is resolved)
- Test: `src/tests/runtime/session-store-utils.test.ts`

**Interfaces:**
- Produces: `sweepStaleTempFiles(dir: string): Promise<number>` — deletes `*.tmp` files in `dir`, returns the count removed, never throws.

- [ ] **Step 1: Write the failing test**

```typescript
import { sweepStaleTempFiles } from "../../runtime/session-store-utils.js";

it("sweeps stale .tmp files and returns the count", async () => {
	const dir = await mkdtemp(join(tmpdir(), "sweep-"));
	await writeFile(join(dir, "session-a.json.123.tmp"), "");
	await writeFile(join(dir, "session-b.json"), "keep");
	const removed = await sweepStaleTempFiles(dir);
	expect(removed).toBe(1);
	const entries = await readdir(dir);
	expect(entries).toContain("session-b.json");
	expect(entries.some((e) => e.endsWith(".tmp"))).toBe(false);
	await rm(dir, { recursive: true, force: true });
});

it("returns 0 and does not throw when the directory is missing", async () => {
	expect(await sweepStaleTempFiles(join(tmpdir(), "does-not-exist-xyz"))).toBe(0);
});
```

- [ ] **Step 2: Run, verify it fails**

Run: `npx vitest run src/tests/runtime/session-store-utils.test.ts`
Expected: FAIL — `sweepStaleTempFiles` is not exported.

- [ ] **Step 3: Implement**

In `src/runtime/session-store-utils.ts`:

```typescript
export async function sweepStaleTempFiles(dir: string): Promise<number> {
	let removed = 0;
	try {
		const entries = await readdir(dir);
		await Promise.all(
			entries
				.filter((name) => name.endsWith(".tmp"))
				.map(async (name) => {
					await rm(join(dir, name), { force: true }).catch(() => {});
					removed += 1;
				}),
		);
	} catch {
		// missing dir or permission issue — nothing to sweep
	}
	return removed;
}
```

Ensure `readdir` and `join` are imported.

- [ ] **Step 4: Run, verify GREEN; then wire into `main()`**

Run: `npx vitest run src/tests/runtime/session-store-utils.test.ts` → PASS.

In `src/index.ts` `main()`, after `anchorStateToClientRoots`, add a best-effort sweep:

```typescript
	void sweepStaleTempFiles(resolveSessionStateDir()).catch(() => {});
```

Import `sweepStaleTempFiles` and `resolveSessionStateDir` from `./runtime/session-store-utils.js`.

- [ ] **Step 5: Commit**

Run: `npx tsc --noEmit && npx biome check --write src/runtime/session-store-utils.ts src/index.ts`

```bash
git add src/runtime/session-store-utils.ts src/index.ts src/tests/runtime/session-store-utils.test.ts
git commit -m "feat(persistence): sweep stale temp files on startup"
```

---

### Task 3: In-memory `SessionStateStore`

**Files:**
- Create: `src/runtime/memory-session-store.ts`
- Test: `src/tests/runtime/memory-session-store.test.ts`

**Interfaces:**
- Produces: `class MemorySessionStore implements SessionStateStore` — keeps history in a `Map<string, ExecutionProgressRecord[]>`, writes nothing to disk.

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from "vitest";
import { MemorySessionStore } from "../../runtime/memory-session-store.js";

describe("MemorySessionStore", () => {
	it("round-trips appended history without touching disk", async () => {
		const store = new MemorySessionStore();
		await store.appendSessionHistory("session-x", { step: "a" } as never);
		await store.appendSessionHistory("session-x", { step: "b" } as never);
		const history = await store.readSessionHistory("session-x");
		expect(history).toHaveLength(2);
	});

	it("returns an empty array for an unknown session", async () => {
		const store = new MemorySessionStore();
		expect(await store.readSessionHistory("session-none")).toEqual([]);
	});
});
```

- [ ] **Step 2: Run, verify it fails** — `npx vitest run src/tests/runtime/memory-session-store.test.ts` → module missing.

- [ ] **Step 3: Implement**

Create `src/runtime/memory-session-store.ts`:

```typescript
import type {
	ExecutionProgressRecord,
	SessionStateStore,
} from "../contracts/runtime.js";

export class MemorySessionStore implements SessionStateStore {
	private readonly histories = new Map<string, ExecutionProgressRecord[]>();

	async readSessionHistory(
		sessionId: string,
	): Promise<ExecutionProgressRecord[]> {
		return [...(this.histories.get(sessionId) ?? [])];
	}

	async writeSessionHistory(
		sessionId: string,
		records: ExecutionProgressRecord[],
	): Promise<void> {
		this.histories.set(sessionId, [...records]);
	}

	async appendSessionHistory(
		sessionId: string,
		record: ExecutionProgressRecord,
	): Promise<void> {
		const current = this.histories.get(sessionId) ?? [];
		current.push(record);
		this.histories.set(sessionId, current);
	}
}
```

- [ ] **Step 4: Run, verify GREEN; commit**

Run: `npx vitest run src/tests/runtime/memory-session-store.test.ts` → PASS.

```bash
git add src/runtime/memory-session-store.ts src/tests/runtime/memory-session-store.test.ts
git commit -m "feat(persistence): add in-memory SessionStateStore"
```

---

### Task 4: Ephemeral mode selection (env-gated)

**Files:**
- Modify: `src/runtime/session-store-utils.ts` (add `EPHEMERAL_ENV_VAR` + `isEphemeralMode()`)
- Modify: `src/index.ts:146` (`createRuntime` — choose the store)
- Modify: `src/memory/toon-interface.ts:208` (skip disk when ephemeral)
- Test: `src/tests/runtime/ephemeral-mode.test.ts`

**Interfaces:**
- Consumes: `MemorySessionStore` (Task 3).
- Produces: `EPHEMERAL_ENV_VAR = "MCP_AI_AGENT_GUIDELINES_EPHEMERAL"`; `isEphemeralMode(): boolean` (true when the env var is `"true"`/`"1"`).

- [ ] **Step 1: Write the failing test for `isEphemeralMode`**

```typescript
import { afterEach, describe, expect, it } from "vitest";
import {
	EPHEMERAL_ENV_VAR,
	isEphemeralMode,
} from "../../runtime/session-store-utils.js";

afterEach(() => {
	delete process.env[EPHEMERAL_ENV_VAR];
});

describe("isEphemeralMode", () => {
	it("is false by default", () => {
		expect(isEphemeralMode()).toBe(false);
	});
	it("is true when the env flag is set", () => {
		process.env[EPHEMERAL_ENV_VAR] = "true";
		expect(isEphemeralMode()).toBe(true);
	});
});
```

- [ ] **Step 2: Run, verify it fails** — symbols not exported.

- [ ] **Step 3: Implement the flag**

In `src/runtime/session-store-utils.ts`, beside `SESSION_STATE_DIR_ENV_VAR`:

```typescript
export const EPHEMERAL_ENV_VAR = "MCP_AI_AGENT_GUIDELINES_EPHEMERAL";

export function isEphemeralMode(): boolean {
	const raw = process.env[EPHEMERAL_ENV_VAR]?.trim().toLowerCase();
	return raw === "true" || raw === "1";
}
```

- [ ] **Step 4: Run, verify GREEN.**

Run: `npx vitest run src/tests/runtime/ephemeral-mode.test.ts` → PASS.

- [ ] **Step 5: Select the store in `createRuntime`**

In `src/index.ts`, change the `sessionStore` line:

```typescript
		sessionStore: isEphemeralMode()
			? new MemorySessionStore()
			: new SecureFileSessionStore(),
```

Import `MemorySessionStore` from `./runtime/memory-session-store.js` and `isEphemeralMode` from `./runtime/session-store-utils.js`.

- [ ] **Step 6: Skip TOON disk init when ephemeral**

In `src/memory/toon-interface.ts` around line 208, guard the disk base-dir resolution so that when `isEphemeralMode()` is true the interface keeps an in-process base dir under the OS temp dir (or a no-op writer). Add an early branch:

```typescript
		if (isEphemeralMode()) {
			this.baseDir = join(tmpdir(), `mcp-aag-ephemeral-${randomUUID()}`);
			// fallthrough: directories are created lazily and discarded on exit
		}
```

Import `isEphemeralMode` from `../runtime/session-store-utils.js`, `tmpdir` from `node:os`, `randomUUID` from `node:crypto`.

- [ ] **Step 7: Add an end-to-end assertion + commit**

Add to `src/tests/runtime/ephemeral-mode.test.ts`:

```typescript
import { createRuntime } from "../../index.js";
import { MemorySessionStore } from "../../runtime/memory-session-store.js";

it("createRuntime uses the in-memory store in ephemeral mode", () => {
	process.env[EPHEMERAL_ENV_VAR] = "true";
	const runtime = createRuntime();
	expect(runtime.sessionStore).toBeInstanceOf(MemorySessionStore);
});
```

Run: `npx tsc --noEmit && npx vitest run src/tests/runtime/` → PASS.

```bash
git add src/index.ts src/memory/toon-interface.ts src/runtime/session-store-utils.ts src/tests/runtime/ephemeral-mode.test.ts
git commit -m "feat(persistence): MCP_AI_AGENT_GUIDELINES_EPHEMERAL opts out of disk writes"
```

---

### Task 5: Document the footprint + verify

**Files:**
- Modify: `README.md` (env-knob table), `docs/src/content/docs/reference/` (a short persistence note)

- [ ] **Step 1: Document `MCP_AI_AGENT_GUIDELINES_EPHEMERAL` and `MCP_AI_AGENT_GUIDELINES_STATE_DIR`** in the README configuration section with one line each and a note that the state dir is gitignored.

- [ ] **Step 2: Full verification**

Run: `npm run build && npx vitest run src/tests/runtime/ src/tests/memory/ && npx docs:build`
Expected: tests PASS; docs build clean.

- [ ] **Step 3: Manual E2E**

Run the server with `MCP_AI_AGENT_GUIDELINES_EPHEMERAL=true`, call any tool, and confirm no `.mcp-ai-agent-guidelines/` directory appears in the workspace root.

```bash
git add README.md docs/
git commit -m "docs(persistence): document ephemeral mode and state-dir env knobs"
```

## Self-Review

- **Spec coverage:** B1 leak → Task 1; B1 sweep → Task 2; B2 in-memory store → Task 3; B2 env selection + ephemeral TOON → Task 4; B3 docs/footprint → Task 5. Covered.
- **Type consistency:** `MemorySessionStore` implements the unchanged `SessionStateStore`. `isEphemeralMode`/`EPHEMERAL_ENV_VAR`/`sweepStaleTempFiles` defined once in `session-store-utils.ts`, consumed in `index.ts`/`toon-interface.ts`.
- **Default unchanged:** every new path is gated on `isEphemeralMode()` (default false); the leak fix is behavior-preserving on success.
- **Placeholder scan:** the README/docs wording in Task 5 is descriptive prose, not a code placeholder.
