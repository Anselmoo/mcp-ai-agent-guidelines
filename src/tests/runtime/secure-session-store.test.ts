import { mkdtempSync } from "node:fs";
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
import { SESSION_MAC_KEY_ENV_VAR } from "../../runtime/session-crypto.js";

const ORIGINAL_STATE_DIR = process.env.MCP_AI_AGENT_GUIDELINES_STATE_DIR;
const ORIGINAL_MAC_KEY = process.env[SESSION_MAC_KEY_ENV_VAR];

function restoreEnvVar(name: string, value: string | undefined): void {
	if (value === undefined) {
		delete process.env[name];
		return;
	}

	process.env[name] = value;
}

afterEach(() => {
	restoreEnvVar("MCP_AI_AGENT_GUIDELINES_STATE_DIR", ORIGINAL_STATE_DIR);
	restoreEnvVar(SESSION_MAC_KEY_ENV_VAR, ORIGINAL_MAC_KEY);
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

	it("accepts a valid MAC", async () => {
		createStateDir();
		const store = new SecureFileSessionStore({
			compressionThreshold: 1,
		});
		const sessionId = createSessionId();
		const records = [
			{ stepLabel: "VALIDATE", kind: "completed", summary: "ok" },
		];

		await store.writeSessionHistory(sessionId, records);

		await expect(store.readSessionHistory(sessionId)).resolves.toEqual(records);
		await expect(store.getSessionIntegrity(sessionId)).resolves.toMatchObject({
			exists: true,
			hasValidMac: true,
			isCompressed: true,
			version: 1,
		});
	});

	it("rejects an invalid MAC", async () => {
		const stateDir = createStateDir();
		const logSpy = vi
			.spyOn(ObservabilityOrchestrator.prototype, "log")
			.mockImplementation(() => {});
		const store = new SecureFileSessionStore();
		const sessionId = createSessionId();
		const records = [
			{ stepLabel: "VALIDATE", kind: "completed", summary: "ok" },
		];

		await store.writeSessionHistory(sessionId, records);
		await updateStoredSession(stateDir, sessionId, (sessionData) => {
			const originalMac = String(sessionData.mac);
			sessionData.mac = `${originalMac[0] === "0" ? "1" : "0"}${originalMac.slice(1)}`;
		});

		await expect(store.getSessionIntegrity(sessionId)).resolves.toMatchObject({
			exists: true,
			hasValidMac: false,
		});
		await expect(store.readSessionHistory(sessionId)).resolves.toEqual([]);
		expect(logSpy).toHaveBeenCalledOnce();
	});

	it("rejects a mismatched-length MAC safely", async () => {
		const stateDir = createStateDir();
		const logSpy = vi
			.spyOn(ObservabilityOrchestrator.prototype, "log")
			.mockImplementation(() => {});
		const store = new SecureFileSessionStore();
		const sessionId = createSessionId();
		const records = [
			{ stepLabel: "VALIDATE", kind: "completed", summary: "ok" },
		];

		await store.writeSessionHistory(sessionId, records);
		await updateStoredSession(stateDir, sessionId, (sessionData) => {
			sessionData.mac = "00";
		});

		await expect(store.getSessionIntegrity(sessionId)).resolves.toMatchObject({
			exists: true,
			hasValidMac: false,
		});
		await expect(store.readSessionHistory(sessionId)).resolves.toEqual([]);
		expect(logSpy).toHaveBeenCalledOnce();
	});

	it("rejects non-hex MAC values safely", async () => {
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
			sessionData.mac = "zzzz";
		});

		await expect(store.getSessionIntegrity(sessionId)).resolves.toMatchObject({
			exists: true,
			hasValidMac: false,
		});
		await expect(store.readSessionHistory(sessionId)).resolves.toEqual([]);
		expect(logSpy).toHaveBeenCalledOnce();
	});

	it("rejects a missing MAC when MAC validation is enabled", async () => {
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
			delete sessionData.mac;
		});

		await expect(store.getSessionIntegrity(sessionId)).resolves.toMatchObject({
			exists: true,
			hasValidMac: false,
		});
		await expect(store.readSessionHistory(sessionId)).resolves.toEqual([]);
		expect(logSpy).toHaveBeenCalledOnce();
	});

	it("warns once when MAC validation is disabled", async () => {
		createStateDir();
		const logSpy = vi
			.spyOn(ObservabilityOrchestrator.prototype, "log")
			.mockImplementation(() => {});
		const store = new SecureFileSessionStore({
			enableMac: false,
		});
		const sessionId = createSessionId();
		const records = [
			{ stepLabel: "VALIDATE", kind: "completed", summary: "ok" },
		];

		await store.writeSessionHistory(sessionId, records);
		await expect(store.readSessionHistory(sessionId)).resolves.toEqual(records);
		await expect(store.getSessionIntegrity(sessionId)).resolves.toMatchObject({
			exists: true,
			hasValidMac: true,
		});
		expect(logSpy).toHaveBeenCalledTimes(1);
		expect(logSpy).toHaveBeenCalledWith(
			"warn",
			"SecureFileSessionStore MAC validation is disabled; session integrity protection is reduced.",
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
		await expect(store.getSessionIntegrity(sessionId)).resolves.toMatchObject({
			exists: false,
			hasValidMac: false,
		});
		expect(logSpy).toHaveBeenCalledOnce();
	});

	it("rejects malformed decompressed record arrays", async () => {
		const stateDir = createStateDir();
		const logSpy = vi
			.spyOn(ObservabilityOrchestrator.prototype, "log")
			.mockImplementation(() => {});
		const store = new SecureFileSessionStore({
			enableMac: false,
			compressionThreshold: 1,
		});
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

	it("reports MAC integrity failures explicitly", async () => {
		const stateDir = createStateDir();
		const store = new SecureFileSessionStore();
		const sessionId = createSessionId();

		await store.writeSessionHistory(sessionId, [
			{ stepLabel: "VALIDATE", kind: "completed", summary: "ok" },
		]);
		await updateStoredSession(stateDir, sessionId, (sessionData) => {
			const originalMac = String(sessionData.mac);
			sessionData.mac = `${originalMac[0] === "0" ? "1" : "0"}${originalMac.slice(1)}`;
		});

		await expect(
			store.readSessionHistoryResult(sessionId),
		).resolves.toMatchObject({
			records: [],
			missing: false,
			integrityFailure: true,
			error: expect.stringContaining("Session integrity check failed"),
		});
	});

	it("reports missing MAC integrity failures explicitly", async () => {
		const stateDir = createStateDir();
		const store = new SecureFileSessionStore();
		const sessionId = createSessionId();

		await store.writeSessionHistory(sessionId, [
			{ stepLabel: "VALIDATE", kind: "completed", summary: "ok" },
		]);
		await updateStoredSession(stateDir, sessionId, (sessionData) => {
			delete sessionData.mac;
		});

		await expect(
			store.readSessionHistoryResult(sessionId),
		).resolves.toMatchObject({
			records: [],
			missing: false,
			integrityFailure: true,
			error: expect.stringContaining("missing MAC"),
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
		const store = new SecureFileSessionStore({ enableMac: false });
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
		const store = new SecureFileSessionStore({
			enableCompression: false,
			enableMac: false,
		});
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
		const store = new SecureFileSessionStore({
			enableCompression: false,
			enableMac: false,
		});
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

	it("persists the MAC key across store instances in the same state directory", async () => {
		const stateDir = createStateDir();
		delete process.env[SESSION_MAC_KEY_ENV_VAR];
		const sessionId = createSessionId();
		const records = [
			{ stepLabel: "PERSIST", kind: "completed", summary: "key persisted" },
		];
		const firstStore = new SecureFileSessionStore();

		await firstStore.writeSessionHistory(sessionId, records);

		const secondStore = new SecureFileSessionStore();
		await expect(secondStore.readSessionHistory(sessionId)).resolves.toEqual(
			records,
		);
		await expect(
			secondStore.getSessionIntegrity(sessionId),
		).resolves.toMatchObject({
			exists: true,
			hasValidMac: true,
		});
		await expect(
			readFile(join(stateDir, "config", "session-integrity.key"), "utf8"),
		).resolves.toMatch(/[0-9a-f]{64}/i);
		await expect(
			readFile(join(stateDir, ".gitignore"), "utf8"),
		).resolves.toContain("config/*.key");
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
		// Exercise the `id === ""` branch (line 448-450) — a "session-" prefix
		// followed by nothing should be rejected.
		expect(isValidSessionId("session-")).toBe(false);
	});

	describe("getSessionIntegrity", () => {
		it("reports exists: false for a missing session", async () => {
			createStateDir();
			const store = new SecureFileSessionStore();
			const info = await store.getSessionIntegrity("session-missing-12ab");
			expect(info).toEqual({
				exists: false,
				hasValidMac: false,
				isCompressed: false,
				version: 0,
			});
		});

		it("reports exists: true and isCompressed/version flags for a real session", async () => {
			const stateDir = createStateDir();
			const store = new SecureFileSessionStore({ enableMac: false });
			const sessionId = createSessionId();
			await store.writeSessionHistory(sessionId, [
				{ stepLabel: "a", kind: "note", summary: "x" },
			]);

			const info = await store.getSessionIntegrity(sessionId);
			expect(info.exists).toBe(true);
			expect(info.hasValidMac).toBe(true); // MAC disabled → trivially valid
			expect(info.isCompressed).toBe(false);
			expect(info.version).toBe(1);
			expect(typeof info.timestamp).toBe("number");
			// stateDir is the workspace we wrote into.
			expect(stateDir).toContain("secure-session-store-");
		});
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
