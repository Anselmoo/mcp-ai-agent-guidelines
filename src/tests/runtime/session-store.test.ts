import { mkdtempSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
	createSessionId,
	FileSessionStore,
} from "../../runtime/session-store.js";

const ORIGINAL_STATE_DIR = process.env.MCP_AI_AGENT_GUIDELINES_STATE_DIR;

function restoreStateDirEnvVar(): void {
	if (ORIGINAL_STATE_DIR === undefined) {
		delete process.env.MCP_AI_AGENT_GUIDELINES_STATE_DIR;
		return;
	}

	process.env.MCP_AI_AGENT_GUIDELINES_STATE_DIR = ORIGINAL_STATE_DIR;
}

afterEach(() => {
	restoreStateDirEnvVar();
});

describe("runtime/session-store", () => {
	it("writes, appends, and reads session history from disk", async () => {
		process.env.MCP_AI_AGENT_GUIDELINES_STATE_DIR = mkdtempSync(
			join(tmpdir(), "session-store-"),
		);
		const store = new FileSessionStore();
		const sessionId = "session-test";

		await store.writeSessionHistory(sessionId, [
			{ stepLabel: "VALIDATE", kind: "completed", summary: "ok" },
		]);
		await store.appendSessionHistory(sessionId, {
			stepLabel: "EXECUTE",
			kind: "in_progress",
			summary: "running",
		});

		const stateDir = process.env.MCP_AI_AGENT_GUIDELINES_STATE_DIR;
		expect(stateDir).toBeDefined();
		expect(await store.readSessionHistory(sessionId)).toHaveLength(2);
		await expect(
			readFile(join(stateDir ?? "", ".gitignore"), "utf8"),
		).resolves.toContain("session-*.json");
		expect(createSessionId()).toContain("session-");
	});

	it("rejects traversal in the configured session state directory", async () => {
		process.env.MCP_AI_AGENT_GUIDELINES_STATE_DIR = "../escape";
		const store = new FileSessionStore();

		await expect(store.writeSessionHistory("session-test", [])).rejects.toThrow(
			/cannot contain '\.\.'/i,
		);
	});

	it("serializes concurrent appends per session", async () => {
		process.env.MCP_AI_AGENT_GUIDELINES_STATE_DIR = mkdtempSync(
			join(tmpdir(), "session-store-"),
		);
		const store = new FileSessionStore();
		const sessionId = "session-test";

		await Promise.all(
			Array.from({ length: 20 }, (_, index) =>
				store.appendSessionHistory(sessionId, {
					stepLabel: `step-${index}`,
					kind: "completed",
					summary: `summary-${index}`,
				}),
			),
		);

		const records = await store.readSessionHistory(sessionId);
		expect(records).toHaveLength(20);
		expect(records.map((record) => record.stepLabel).sort()).toEqual(
			Array.from({ length: 20 }, (_, index) => `step-${index}`).sort(),
		);
	});

	it("returns an empty history for non-array session payloads", async () => {
		const stateDir = mkdtempSync(join(tmpdir(), "session-store-"));
		process.env.MCP_AI_AGENT_GUIDELINES_STATE_DIR = stateDir;
		const store = new FileSessionStore();
		const sessionId = "session-test";

		writeFileSync(
			join(stateDir, `${sessionId}.json`),
			JSON.stringify({ unexpected: true }),
			"utf8",
		);

		await expect(store.readSessionHistory(sessionId)).resolves.toEqual([]);
	});
});
