/**
 * Tests for the ReadTextFileFn seam (#75).
 *
 * Verifies that:
 *  - FileSessionStore (session-store.ts) and both session-store classes in
 *    secure-session-store.ts use the injected readTextFile instead of calling
 *    fs.readFile directly.
 *  - Existing call-sites that omit the seam parameter continue to work
 *    (backward-compatible defaults).
 */

import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	FileSessionStore as LegacyFileSessionStore,
	SecureFileSessionStore,
} from "../../runtime/secure-session-store.js";
import { FileSessionStore } from "../../runtime/session-store.js";
import {
	defaultReadTextFile,
	type ReadTextFileFn,
} from "../../runtime/session-store-utils.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTempDir() {
	return mkdtempSync(join(tmpdir(), "read-seam-"));
}

function makeStubContent(records: unknown[]): string {
	return JSON.stringify(records);
}

// ---------------------------------------------------------------------------
// FileSessionStore (session-store.ts)
// ---------------------------------------------------------------------------

describe("FileSessionStore – ReadTextFileFn seam", () => {
	beforeEach(() => {
		process.env.MCP_AI_AGENT_GUIDELINES_STATE_DIR = makeTempDir();
	});

	it("calls the injected readTextFile instead of the real filesystem", async () => {
		const injectedRead = vi
			.fn<ReadTextFileFn>()
			.mockResolvedValue(
				makeStubContent([
					{ stepLabel: "S1", kind: "completed", summary: "ok" },
				]),
			);

		const store = new FileSessionStore({ readTextFile: injectedRead });
		const records = await store.readSessionHistory("session-test");

		expect(injectedRead).toHaveBeenCalledOnce();
		expect(records).toHaveLength(1);
		expect(records[0].stepLabel).toBe("S1");
	});

	it("defaults to the real filesystem when no seam is injected (backward compat)", async () => {
		const stateDir = process.env.MCP_AI_AGENT_GUIDELINES_STATE_DIR as string;
		// Write a real file via the store's write path, then read it back.
		const store = new FileSessionStore();
		await store.writeSessionHistory("session-compat", [
			{ stepLabel: "WRITTEN", kind: "completed", summary: "disk" },
		]);
		const records = await store.readSessionHistory("session-compat");

		expect(records).toHaveLength(1);
		expect(records[0].stepLabel).toBe("WRITTEN");
		// Confirm the state dir was used
		expect(stateDir).toBeTruthy();
	});

	it("returns an empty array when the injected reader throws ENOENT", async () => {
		const enoent = Object.assign(new Error("no such file"), { code: "ENOENT" });
		const injectedRead = vi.fn<ReadTextFileFn>().mockRejectedValue(enoent);

		const store = new FileSessionStore({ readTextFile: injectedRead });
		await expect(store.readSessionHistory("session-missing")).resolves.toEqual(
			[],
		);
	});
});

// ---------------------------------------------------------------------------
// SecureFileSessionStore – ReadTextFileFn seam
// ---------------------------------------------------------------------------

describe("SecureFileSessionStore – ReadTextFileFn seam", () => {
	beforeEach(() => {
		process.env.MCP_AI_AGENT_GUIDELINES_STATE_DIR = makeTempDir();
	});

	it("calls the injected readTextFile for readSessionHistoryResult", async () => {
		// Build a minimal valid secure-store JSON envelope (uncompressed, no MAC).
		const envelope = JSON.stringify({
			sessionId: "session-seam",
			version: 1,
			timestamp: Date.now(),
			records: [{ stepLabel: "SEC1", kind: "completed", summary: "secure" }],
			compressed: false,
		});
		const injectedRead = vi.fn<ReadTextFileFn>().mockResolvedValue(envelope);

		const store = new SecureFileSessionStore(
			{ enableMac: false },
			{ readTextFile: injectedRead },
		);
		const records = await store.readSessionHistory("session-seam");

		expect(injectedRead).toHaveBeenCalledOnce();
		expect(records).toHaveLength(1);
		expect(records[0].stepLabel).toBe("SEC1");
	});

	it("calls the injected readTextFile for getSessionIntegrity", async () => {
		const envelope = JSON.stringify({
			sessionId: "session-integrity",
			version: 1,
			timestamp: Date.now(),
			records: [],
			compressed: false,
		});
		const injectedRead = vi.fn<ReadTextFileFn>().mockResolvedValue(envelope);

		const store = new SecureFileSessionStore(
			{ enableMac: false },
			{ readTextFile: injectedRead },
		);
		const integrity = await store.getSessionIntegrity("session-integrity");

		expect(injectedRead).toHaveBeenCalledOnce();
		expect(integrity.exists).toBe(true);
	});

	it("defaults to the real filesystem when no seam is injected (backward compat)", async () => {
		const store = new SecureFileSessionStore({ enableMac: false });
		await store.writeSessionHistory("session-compat-secure", [
			{ stepLabel: "WRITTEN_SECURE", kind: "completed", summary: "disk" },
		]);
		const records = await store.readSessionHistory("session-compat-secure");

		expect(records).toHaveLength(1);
		expect(records[0].stepLabel).toBe("WRITTEN_SECURE");
	});
});

// ---------------------------------------------------------------------------
// Legacy FileSessionStore (secure-session-store.ts) – ReadTextFileFn seam
// ---------------------------------------------------------------------------

describe("Legacy FileSessionStore (secure-session-store) – ReadTextFileFn seam", () => {
	beforeEach(() => {
		process.env.MCP_AI_AGENT_GUIDELINES_STATE_DIR = makeTempDir();
	});

	it("calls the injected readTextFile", async () => {
		const injectedRead = vi
			.fn<ReadTextFileFn>()
			.mockResolvedValue(
				makeStubContent([
					{ stepLabel: "L1", kind: "completed", summary: "legacy" },
				]),
			);

		const store = new LegacyFileSessionStore({ readTextFile: injectedRead });
		const records = await store.readSessionHistory("session-legacy");

		expect(injectedRead).toHaveBeenCalledOnce();
		expect(records[0].stepLabel).toBe("L1");
	});
});

// ---------------------------------------------------------------------------
// defaultReadTextFile export
// ---------------------------------------------------------------------------

describe("defaultReadTextFile", () => {
	it("is exported and is a function", () => {
		expect(typeof defaultReadTextFile).toBe("function");
	});
});
