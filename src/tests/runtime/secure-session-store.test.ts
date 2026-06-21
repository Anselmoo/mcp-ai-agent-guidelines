import { existsSync, mkdtempSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { deflateSync } from "node:zlib";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ObservabilityOrchestrator } from "../../infrastructure/observability.js";
import {
	assertValidSessionId,
	createSessionId,
	createUuidSessionId,
	FileSessionStore,
	isValidSessionId,
	SecureFileSessionStore,
} from "../../runtime/secure-session-store.js";

const ORIGINAL_STATE_DIR = process.env.MCP_AI_AGENT_GUIDELINES_STATE_DIR;

function restoreEnvVar(name: string, value: string | undefined): void {
	if (value === undefined) {
		delete process.env[name];
		return;
	}

	process.env[name] = value;
}

afterEach(() => {
	restoreEnvVar("MCP_AI_AGENT_GUIDELINES_STATE_DIR", ORIGINAL_STATE_DIR);
	vi.restoreAllMocks();
});

describe("runtime/secure-session-store", () => {
	function createStateDir() {
		const stateDir = mkdtempSync(join(tmpdir(), "secure-session-store-"));
		process.env.MCP_AI_AGENT_GUIDELINES_STATE_DIR = stateDir;
		return stateDir;
	}

	async function updateStoredSession(
		stateDir: string,
		sessionId: string,
		updateSessionData: (sessionData: Record<string, unknown>) => void,
	) {
		const sessionFile = join(stateDir, `${sessionId}.json`);
		const sessionData = JSON.parse(
			await readFile(sessionFile, "utf8"),
		) as Record<string, unknown>;
		updateSessionData(sessionData);
		await writeFile(
			sessionFile,
			`${JSON.stringify(sessionData, null, "\t")}\n`,
			"utf8",
		);
	}

	it("round-trips records and writes no integrity key file", async () => {
		const stateDir = createStateDir();
		const store = new SecureFileSessionStore({ compressionThreshold: 1 });
		const sessionId = createSessionId();
		const records = [
			{ stepLabel: "VALIDATE", kind: "completed", summary: "ok" },
		];

		await store.writeSessionHistory(sessionId, records);

		await expect(store.readSessionHistory(sessionId)).resolves.toEqual(records);
		// Keyless store: no secret key is ever created.
		expect(existsSync(join(stateDir, "config", "session-integrity.key"))).toBe(
			false,
		);
	});

	it("treats a garbled session file as empty without any key", async () => {
		const stateDir = createStateDir();
		const store = new SecureFileSessionStore();
		const sessionId = createSessionId();
		await writeFile(join(stateDir, `${sessionId}.json`), "{ not valid json");

		const result = await store.readSessionHistoryResult(sessionId);
		expect(result.records).toEqual([]);
		expect(result.integrityFailure).toBe(false);
		expect(existsSync(join(stateDir, "config", "session-integrity.key"))).toBe(
			false,
		);
	});

	it("rejects malformed session envelopes even when the JSON parses", async () => {
		const stateDir = createStateDir();
		const logSpy = vi
			.spyOn(ObservabilityOrchestrator.prototype, "log")
			.mockImplementation(() => {});
		const store = new SecureFileSessionStore();
		const sessionId = createSessionId();

		await store.writeSessionHistory(sessionId, [
			{ stepLabel: "VALIDATE", kind: "completed", summary: "ok" },
		]);
		await updateStoredSession(stateDir, sessionId, (sessionData) => {
			sessionData.timestamp = "not-a-number";
		});

		await expect(store.readSessionHistory(sessionId)).resolves.toEqual([]);
		expect(logSpy).toHaveBeenCalledOnce();
	});

	it("rejects malformed decompressed record arrays", async () => {
		const stateDir = createStateDir();
		const logSpy = vi
			.spyOn(ObservabilityOrchestrator.prototype, "log")
			.mockImplementation(() => {});
		const store = new SecureFileSessionStore({ compressionThreshold: 1 });
		const sessionId = createSessionId();

		await store.writeSessionHistory(sessionId, [
			{ stepLabel: "VALIDATE", kind: "completed", summary: "ok" },
		]);
		await updateStoredSession(stateDir, sessionId, (sessionData) => {
			sessionData.records = deflateSync(
				Buffer.from(
					JSON.stringify([{ stepLabel: "VALIDATE", kind: "completed" }]),
					"utf8",
				),
			).toString("base64");
		});

		await expect(store.readSessionHistory(sessionId)).resolves.toEqual([]);
		expect(logSpy).toHaveBeenCalled();
	});

	it("reports missing session history explicitly", async () => {
		createStateDir();
		const store = new SecureFileSessionStore();

		await expect(
			store.readSessionHistoryResult("session-ABCDEFGHJKMN"),
		).resolves.toEqual({
			records: [],
			missing: true,
			integrityFailure: false,
		});
	});

	it("rejects traversal in the configured session state directory", async () => {
		process.env.MCP_AI_AGENT_GUIDELINES_STATE_DIR = "../escape";
		expect(() => new SecureFileSessionStore()).toThrow(
			/cannot contain '\.\.'/i,
		);
	});

	it("serializes concurrent appends per session", async () => {
		createStateDir();
		const store = new SecureFileSessionStore();
		const sessionId = createSessionId();

		await Promise.all(
			Array.from({ length: 20 }, (_, index) =>
				store.appendSessionHistory(sessionId, {
					stepLabel: `step-${index}`,
					kind: "completed",
					summary: `summary-${index}`,
				}),
			),
		);

		await expect(store.readSessionHistory(sessionId)).resolves.toHaveLength(20);
	});

	it("stores record arrays inline when compression is disabled", async () => {
		const stateDir = createStateDir();
		const store = new SecureFileSessionStore({ enableCompression: false });
		const sessionId = createSessionId();
		const records = [
			{ stepLabel: "INLINE", kind: "completed", summary: "stored inline" },
		];

		await store.writeSessionHistory(sessionId, records);

		const sessionData = JSON.parse(
			await readFile(join(stateDir, `${sessionId}.json`), "utf8"),
		) as { compressed: boolean; records: unknown };
		expect(sessionData.compressed).toBe(false);
		expect(sessionData.records).toEqual(records);
	});

	it("accepts base64 payloads when compressed data was stored without deflation", async () => {
		const stateDir = createStateDir();
		const store = new SecureFileSessionStore({ enableCompression: false });
		const sessionId = createSessionId();
		const records = [
			{ stepLabel: "FALLBACK", kind: "completed", summary: "inflate fallback" },
		];

		await store.writeSessionHistory(sessionId, records);
		await updateStoredSession(stateDir, sessionId, (sessionData) => {
			sessionData.compressed = true;
			sessionData.records = Buffer.from(
				JSON.stringify(records),
				"utf8",
			).toString("base64");
		});

		await expect(store.readSessionHistory(sessionId)).resolves.toEqual(records);
	});

	it("creates valid session ids for both compact and uuid-style formats", () => {
		expect(isValidSessionId(createSessionId())).toBe(true);
		expect(isValidSessionId(createUuidSessionId())).toBe(true);
		expect(isValidSessionId("session-1234567890ab")).toBe(true);
		expect(isValidSessionId("session-abcdefghijklmnopqrstuvwx")).toBe(true);
		expect(
			isValidSessionId("session-550e8400-e29b-41d4-a716-446655440000"),
		).toBe(true);
		expect(isValidSessionId("V1StGXR8_Z5jdHi6B-myT")).toBe(true);
		expect(isValidSessionId("invalid")).toBe(false);
		expect(isValidSessionId("")).toBe(false);
		expect(isValidSessionId(" session-1234567890ab")).toBe(false);
		expect(isValidSessionId("session-1234567890ab ")).toBe(false);
		expect(isValidSessionId("/tmp/session-1234567890ab")).toBe(false);
		expect(isValidSessionId("session-/tmp")).toBe(false);
		expect(isValidSessionId("session-..\\escape")).toBe(false);
		expect(isValidSessionId("../escape")).toBe(false);
		expect(isValidSessionId("session-../../escape")).toBe(false);
	});

	it("rejects the empty-id-after-prefix branch in isValidSessionId", () => {
		expect(isValidSessionId("session-")).toBe(false);
	});
});

describe("assertValidSessionId", () => {
	it("returns the sessionId unchanged when valid", () => {
		const id = "session-1234567890ab";
		expect(assertValidSessionId(id)).toBe(id);
	});

	it("throws when sessionId is not a string", () => {
		expect(() => assertValidSessionId(undefined)).toThrow(
			"sessionId must be a non-empty string.",
		);
		expect(() => assertValidSessionId(42)).toThrow(
			"sessionId must be a non-empty string.",
		);
	});

	it("throws when sessionId is empty or whitespace", () => {
		expect(() => assertValidSessionId("")).toThrow(
			"sessionId must be a non-empty string.",
		);
		expect(() => assertValidSessionId("   ")).toThrow(
			"sessionId must be a non-empty string.",
		);
	});

	it("throws when sessionId fails format validation", () => {
		expect(() => assertValidSessionId("session-bogus")).toThrow(
			"must be a valid session ID in a supported format.",
		);
	});

	it("honors the fieldName override in error messages", () => {
		expect(() => assertValidSessionId(undefined, "snapshotId")).toThrow(
			"snapshotId must be a non-empty string.",
		);
	});
});

describe("FileSessionStore (legacy)", () => {
	function createStateDir() {
		const stateDir = mkdtempSync(join(tmpdir(), "file-session-store-"));
		process.env.MCP_AI_AGENT_GUIDELINES_STATE_DIR = stateDir;
		return stateDir;
	}

	it("returns [] for a missing session file", async () => {
		createStateDir();
		const store = new FileSessionStore();
		expect(await store.readSessionHistory("session-1234567890ab")).toEqual([]);
	});

	it("returns [] when the file is not a JSON array", async () => {
		const stateDir = createStateDir();
		const sessionId = "session-1234567890ab";
		await writeFile(
			join(stateDir, `${sessionId}.json`),
			JSON.stringify({ not: "an array" }),
			"utf8",
		);
		const store = new FileSessionStore();
		expect(await store.readSessionHistory(sessionId)).toEqual([]);
	});

	it("writes and reads back a record array", async () => {
		createStateDir();
		const store = new FileSessionStore();
		const sessionId = "session-1234567890ab";
		const records = [{ stepLabel: "a", kind: "note", summary: "hello" }];
		await store.writeSessionHistory(sessionId, records);
		expect(await store.readSessionHistory(sessionId)).toEqual(records);
	});

	it("serializes concurrent appends per session", async () => {
		createStateDir();
		const store = new FileSessionStore();
		const sessionId = "session-1234567890ab";

		await Promise.all([
			store.appendSessionHistory(sessionId, {
				stepLabel: "a",
				kind: "note",
				summary: "1",
			}),
			store.appendSessionHistory(sessionId, {
				stepLabel: "b",
				kind: "note",
				summary: "2",
			}),
			store.appendSessionHistory(sessionId, {
				stepLabel: "c",
				kind: "note",
				summary: "3",
			}),
		]);

		const records = await store.readSessionHistory(sessionId);
		expect(records).toHaveLength(3);
		expect(records.map((r) => r.summary).sort()).toEqual(["1", "2", "3"]);
	});

	it("honors the readTextFile seam for read paths", async () => {
		const store = new FileSessionStore({
			readTextFile: async () =>
				JSON.stringify([{ stepLabel: "x", kind: "note", summary: "seam" }]),
		});
		expect(await store.readSessionHistory("session-1234567890ab")).toEqual([
			{ stepLabel: "x", kind: "note", summary: "seam" },
		]);
	});
});
