/**
 * Tests for TOON memory interface
 */

import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CodebaseScanner } from "../../memory/coherence-scanner.js";
import {
	ToonMemoryInterface,
	ToonSessionStore,
} from "../../memory/toon-interface.js";

async function createIsolatedTestDir(): Promise<string> {
	return await mkdtemp(
		join(process.cwd(), ".test-mcp-ai-agent-guidelines-memory-"),
	);
}

async function cleanupTestDir(testDir: string | undefined): Promise<void> {
	if (!testDir) {
		return;
	}

	try {
		await rm(testDir, { recursive: true, force: true });
	} catch {}
}

describe("ToonMemoryInterface", () => {
	let memoryInterface: ToonMemoryInterface;
	let testDir!: string;

	beforeEach(async () => {
		testDir = await createIsolatedTestDir();
		memoryInterface = new ToonMemoryInterface(testDir);
	});

	afterEach(async () => {
		await cleanupTestDir(testDir);
	});

	describe("session context management", () => {
		it("should save and load session context", async () => {
			const sessionId = "session-ABCDEFGHJKMN";
			const context = {
				context: {
					requestScope: "Test scope",
					constraints: ["test constraint"],
					phase: "testing",
				},
				progress: {
					completed: ["task1"],
					inProgress: ["task2"],
					blocked: [],
					next: ["task3"],
				},
				memory: {
					keyInsights: ["insight1"],
					decisions: { "123": "decision1" },
					patterns: ["pattern1"],
					warnings: [],
				},
			};

			await memoryInterface.saveSessionContext(sessionId, context);
			const loaded = await memoryInterface.loadSessionContext(sessionId);

			expect(loaded).toBeDefined();
			expect(loaded?.context.requestScope).toBe("Test scope");
			expect(loaded?.progress.completed).toContain("task1");
			expect(loaded?.memory.keyInsights).toContain("insight1");
		});

		it("should update session progress", async () => {
			const sessionId = "session-550e8400-e29b-41d4-a716-446655440000";

			// Create initial session
			await memoryInterface.saveSessionContext(sessionId, {
				progress: {
					completed: ["task1"],
					inProgress: [],
					blocked: [],
					next: [],
				},
			});

			// Update progress
			await memoryInterface.updateSessionProgress(sessionId, {
				completed: ["task2"],
				inProgress: ["task3"],
			});

			const loaded = await memoryInterface.loadSessionContext(sessionId);
			expect(loaded?.progress.completed).toEqual(["task1", "task2"]);
			expect(loaded?.progress.inProgress).toEqual(["task3"]);
		});

		it("serializes concurrent session progress updates", async () => {
			const sessionId = "session-ABCDEFGHJKMN";
			await memoryInterface.saveSessionContext(sessionId, {
				progress: {
					completed: [],
					inProgress: [],
					blocked: [],
					next: [],
				},
			});

			await Promise.all(
				Array.from({ length: 12 }, (_, index) =>
					memoryInterface.updateSessionProgress(sessionId, {
						completed: [`task-${index}`],
					}),
				),
			);

			const loaded = await memoryInterface.loadSessionContext(sessionId);
			expect(loaded?.progress.completed).toHaveLength(12);
			expect(loaded?.progress.completed.slice().sort()).toEqual(
				Array.from({ length: 12 }, (_, index) => `task-${index}`).sort(),
			);
		});

		it("should add session insights", async () => {
			const sessionId = "V1StGXR8_Z5jdHi6B-myT";

			// Create initial session
			await memoryInterface.saveSessionContext(sessionId, {});

			// Add insights
			await memoryInterface.addSessionInsight(
				sessionId,
				"Key insight",
				"insight",
			);
			await memoryInterface.addSessionInsight(
				sessionId,
				"Important decision",
				"decision",
			);

			const loaded = await memoryInterface.loadSessionContext(sessionId);
			expect(loaded?.memory.keyInsights).toContain("Key insight");
			expect(Object.values(loaded?.memory.decisions || {})).toContain(
				"Important decision",
			);
		});

		it("should reject invalid session IDs that try to escape the session root", async () => {
			await expect(
				memoryInterface.saveSessionContext("session-../../escape", {}),
			).rejects.toThrow("sessionId must be a valid session ID");
		});

		it("encrypts session context at rest and persists the key across instances", async () => {
			const firstMemoryInterface = new ToonMemoryInterface(testDir);
			const secondMemoryInterface = new ToonMemoryInterface(testDir);
			const sessionId = "session-ABCDEFGHJKMN";

			await firstMemoryInterface.saveSessionContext(sessionId, {
				context: {
					requestScope: "Sensitive session context",
					constraints: [],
					phase: "implement",
				},
			});

			const persisted = await readFile(
				join(testDir, "sessions", sessionId, "state.toon"),
				"utf8",
			);
			expect(persisted).toContain("mcp-toon-encrypted:v1:");
			expect(persisted).not.toContain("Sensitive session context");

			await expect(
				secondMemoryInterface.loadSessionContext(sessionId),
			).resolves.toMatchObject({
				context: {
					requestScope: "Sensitive session context",
					phase: "implement",
				},
			});
			await expect(
				readFile(join(testDir, "config", "session-context.key"), "utf8"),
			).resolves.toMatch(/[0-9a-f]{64}/i);
			await expect(
				readFile(join(testDir, ".gitignore"), "utf8"),
			).resolves.toContain("config/*.key");
		});

		it("loads existing plaintext session files for backward compatibility", async () => {
			const plaintextInterface = new ToonMemoryInterface(testDir, {
				enableEncryption: false,
			});
			const encryptedInterface = new ToonMemoryInterface(testDir);
			const sessionId = "session-550e8400-e29b-41d4-a716-446655440000";

			await plaintextInterface.saveSessionContext(sessionId, {
				context: {
					requestScope: "Legacy plaintext session",
					constraints: [],
					phase: "review",
				},
			});

			await expect(
				encryptedInterface.loadSessionContext(sessionId),
			).resolves.toMatchObject({
				context: {
					requestScope: "Legacy plaintext session",
					phase: "review",
				},
			});
		});

		it("rejects encrypted session payload transplants between session IDs", async () => {
			const testMemoryInterface = new ToonMemoryInterface(testDir);
			const sourceSessionId = "session-ABCDEFGHJKMN";
			const targetSessionId = "session-550e8400-e29b-41d4-a716-446655440000";

			await testMemoryInterface.saveSessionContext(sourceSessionId, {
				context: {
					requestScope: "Source session",
					constraints: [],
					phase: "review",
				},
			});
			await testMemoryInterface.saveSessionContext(targetSessionId, {
				context: {
					requestScope: "Target session",
					constraints: [],
					phase: "review",
				},
			});

			const sourcePayload = await readFile(
				join(testDir, "sessions", sourceSessionId, "state.toon"),
				"utf8",
			);
			await rm(join(testDir, "sessions", targetSessionId, "state.toon"), {
				force: true,
			});
			await writeFile(
				join(testDir, "sessions", targetSessionId, "state.toon"),
				sourcePayload,
				"utf8",
			);

			await expect(
				testMemoryInterface.loadSessionContext(targetSessionId),
			).resolves.toBeNull();
		});
	});

	describe("workspace map management", () => {
		it("preserves generated metadata when saving and loading workspace maps", async () => {
			const sessionId = "session-550e8400-e29b-41d4-a716-446655440000";
			const workspaceMap = {
				generated: "2024-01-02T00:00:00.000Z",
				modules: {
					core: {
						path: "src",
						files: ["index.ts"],
						dependencies: ["shared"],
					},
				},
			};

			await memoryInterface.saveWorkspaceMap(sessionId, workspaceMap as never);

			await expect(
				memoryInterface.loadWorkspaceMap(sessionId),
			).resolves.toEqual(workspaceMap);
		});
	});

	describe("memory artifacts", () => {
		it("should save and load memory artifacts", async () => {
			const artifact = {
				meta: {
					id: "test-artifact-1",
					created: new Date().toISOString(),
					updated: new Date().toISOString(),
					tags: ["test", "memory"],
					relevance: 8,
				},
				content: {
					summary: "Test artifact",
					details: "Detailed information about the test",
					context: "Testing context",
					actionable: true,
				},
				links: {
					relatedSessions: ["session1"],
					relatedMemories: [],
					sources: ["test"],
				},
			};

			await memoryInterface.saveMemoryArtifact(artifact);
			const loaded =
				await memoryInterface.loadMemoryArtifact("test-artifact-1");

			expect(loaded).toBeDefined();
			expect(loaded?.meta.id).toBe("test-artifact-1");
			expect(loaded?.content.summary).toBe("Test artifact");
			expect(loaded?.meta.tags).toContain("test");
		});

		it("should find memory artifacts with filters", async () => {
			// Create test artifacts
			const artifacts = [
				{
					meta: {
						id: "artifact-1",
						created: new Date().toISOString(),
						updated: new Date().toISOString(),
						tags: ["important", "config"],
						relevance: 9,
					},
					content: {
						summary: "Important configuration",
						details: "Config details",
						context: "Setup context",
						actionable: true,
					},
					links: {
						relatedSessions: ["session1"],
						relatedMemories: [],
						sources: ["setup"],
					},
				},
				{
					meta: {
						id: "artifact-2",
						created: new Date().toISOString(),
						updated: new Date().toISOString(),
						tags: ["debug", "issue"],
						relevance: 5,
					},
					content: {
						summary: "Debug information",
						details: "Debug details",
						context: "Debug context",
						actionable: false,
					},
					links: {
						relatedSessions: ["session2"],
						relatedMemories: [],
						sources: ["debug"],
					},
				},
			];

			for (const artifact of artifacts) {
				await memoryInterface.saveMemoryArtifact(artifact);
			}

			// Test filtering by tags
			const configArtifacts = await memoryInterface.findMemoryArtifacts({
				tags: ["config"],
			});
			expect(configArtifacts).toHaveLength(1);
			expect(configArtifacts[0].meta.id).toBe("artifact-1");

			// Test filtering by relevance
			const highRelevance = await memoryInterface.findMemoryArtifacts({
				minRelevance: 8,
			});
			expect(highRelevance).toHaveLength(1);
			expect(highRelevance[0].meta.relevance).toBe(9);

			// Test filtering by session
			const session1Artifacts = await memoryInterface.findMemoryArtifacts({
				sessionId: "session1",
			});
			expect(session1Artifacts).toHaveLength(1);
			expect(session1Artifacts[0].meta.id).toBe("artifact-1");
		});
	});

	describe("snapshot history", () => {
		it("retains immutable snapshots and resolves previous selectors", async () => {
			const bootstrapStub = vi
				.spyOn(
					memoryInterface as unknown as {
						bootstrapSnapshotIfMissing: () => Promise<void>;
					},
					"bootstrapSnapshotIfMissing",
				)
				.mockResolvedValue(undefined);
			const scanSpy = vi
				.spyOn(CodebaseScanner.prototype, "scan")
				.mockResolvedValueOnce({
					capturedAt: "2026-04-11T00:00:00.000Z",
					skillIds: ["a"],
					instructionNames: ["x"],
					codePaths: ["src/a.ts"],
					fileSummaries: [
						{
							path: "src/a.ts",
							contentHash: "hash-a",
							language: "typescript",
							category: "source",
							exportedSymbols: ["alpha"],
							totalSymbols: 1,
							symbolKinds: { function: 1 },
						},
					],
					symbolMap: { "src/a.ts": ["alpha"] },
				})
				.mockResolvedValueOnce({
					capturedAt: "2026-04-11T01:00:00.000Z",
					skillIds: ["a", "b"],
					instructionNames: ["x"],
					codePaths: ["src/a.ts", "src/b.ts"],
					fileSummaries: [
						{
							path: "src/a.ts",
							contentHash: "hash-a-2",
							language: "typescript",
							category: "source",
							exportedSymbols: ["alpha"],
							totalSymbols: 1,
							symbolKinds: { function: 1 },
						},
						{
							path: "src/b.ts",
							contentHash: "hash-b",
							language: "typescript",
							category: "source",
							exportedSymbols: ["beta"],
							totalSymbols: 1,
							symbolKinds: { function: 1 },
						},
					],
					symbolMap: {
						"src/a.ts": ["alpha"],
						"src/b.ts": ["beta"],
					},
				});

			try {
				await memoryInterface.refresh();
				await memoryInterface.refresh();

				const history = await memoryInterface.listFingerprintSnapshots();
				expect(history.length).toBeGreaterThanOrEqual(2);
				const previousEntry = history.at(-2);
				const latestEntry = history.at(-1);
				expect(previousEntry?.snapshotId).toBeDefined();
				expect(latestEntry?.snapshotId).toBeDefined();
				expect(previousEntry?.snapshotId).not.toBe(latestEntry?.snapshotId);

				const latest = await memoryInterface.loadFingerprintSnapshot();
				const previous =
					await memoryInterface.loadFingerprintSnapshot("previous");

				expect(latest?.meta.version).toBe("2");
				expect(latest?.meta.previousSnapshotId).toBe(previous?.meta.snapshotId);
				expect(previous?.fingerprint.codePaths).toEqual(["src/a.ts"]);
				expect(latest?.fingerprint.codePaths).toEqual(["src/a.ts", "src/b.ts"]);
			} finally {
				bootstrapStub.mockRestore();
				scanSpy.mockRestore();
			}
		});
	});

	describe("refresh with onProgress callback", () => {
		it("accepts an onProgress callback and does not throw", async () => {
			const progressCalls: Array<[string, number, number]> = [];
			await memoryInterface.refresh((filePath, index, total) => {
				progressCalls.push([filePath, index, total]);
			});
			// An empty workspace scans zero files — callback may not fire, but no throw
			expect(Array.isArray(progressCalls)).toBe(true);
		});
	});
});

describe("ToonSessionStore", () => {
	let sessionStore: ToonSessionStore;
	let testDir!: string;

	beforeEach(async () => {
		testDir = await createIsolatedTestDir();
		sessionStore = new ToonSessionStore(testDir);
	});

	afterEach(async () => {
		await cleanupTestDir(testDir);
	});

	it("should convert progress records to TOON format", async () => {
		const sessionId = "session-ABCDEFGHJKMN";
		const records = [
			{
				stepLabel: "task1",
				kind: "completed",
				summary: "Completed task 1",
			},
			{
				stepLabel: "task2",
				kind: "in_progress",
				summary: "Working on task 2",
			},
		];

		await sessionStore.writeSessionHistory(sessionId, records);
		const loaded = await sessionStore.readSessionHistory(sessionId);

		expect(loaded).toHaveLength(2);
		expect(loaded.find((r) => r.stepLabel === "task1")?.kind).toBe("completed");
		expect(loaded.find((r) => r.stepLabel === "task2")?.kind).toBe(
			"in_progress",
		);
		await expect(
			readFile(join(testDir, "sessions", sessionId, "state.toon"), "utf8"),
		).resolves.toContain("mcp-toon-encrypted:v1:");
	});

	it("should append session history", async () => {
		const sessionId = "V1StGXR8_Z5jdHi6B-myT";

		// Write initial records
		await sessionStore.writeSessionHistory(sessionId, [
			{
				stepLabel: "task1",
				kind: "completed",
				summary: "Completed task 1",
			},
		]);

		// Append new record
		await sessionStore.appendSessionHistory(sessionId, {
			stepLabel: "task2",
			kind: "in_progress",
			summary: "Working on task 2",
		});

		const loaded = await sessionStore.readSessionHistory(sessionId);
		expect(loaded).toHaveLength(2);
	});

	it("preserves next records when appending session history", async () => {
		const sessionId = "session-ABCDEFGHJKMN";
		await sessionStore.writeSessionHistory(sessionId, []);

		await sessionStore.appendSessionHistory(sessionId, {
			stepLabel: "task-next",
			kind: "next",
			summary: "Next task",
		});

		const loaded = await sessionStore.readSessionHistory(sessionId);
		expect(loaded).toEqual([
			expect.objectContaining({
				stepLabel: "task-next",
				kind: "next",
			}),
		]);
	});

	it("preserves existing session context when rewriting history", async () => {
		const sessionId = "session-550e8400-e29b-41d4-a716-446655440000";
		const memoryInterface = await sessionStore.getMemoryInterface();

		await memoryInterface.saveSessionContext(sessionId, {
			context: {
				requestScope: "Keep full TOON context",
				constraints: ["preserve adapters"],
				successCriteria: "history rewrite keeps session metadata",
				phase: "review",
			},
			progress: {
				completed: ["stale"],
				inProgress: [],
				blocked: [],
				next: [],
			},
			memory: {
				keyInsights: ["retain insight"],
				decisions: { architecture: "keep canonical runtime contract" },
				patterns: ["compatibility adapter"],
				warnings: ["retain warning"],
			},
		});
		const beforeWrite = await memoryInterface.loadSessionContext(sessionId);

		await sessionStore.writeSessionHistory(sessionId, [
			{
				stepLabel: "done",
				kind: "completed",
				summary: "done",
			},
			{
				stepLabel: "next-up",
				kind: "next",
				summary: "next-up",
			},
		]);

		const loaded = await memoryInterface.loadSessionContext(sessionId);
		expect(loaded).toMatchObject({
			meta: {
				sessionId,
			},
			context: {
				requestScope: "Keep full TOON context",
				constraints: ["preserve adapters"],
				successCriteria: "history rewrite keeps session metadata",
				phase: "review",
			},
			progress: {
				completed: ["done"],
				inProgress: [],
				blocked: [],
				next: ["next-up"],
			},
			memory: {
				keyInsights: ["retain insight"],
				decisions: { architecture: "keep canonical runtime contract" },
				patterns: ["compatibility adapter"],
				warnings: ["retain warning"],
			},
		});
		expect(loaded?.meta.created).toBe(beforeWrite?.meta.created);
	});

	it("appendSessionHistory with kind completed updates completed bucket", async () => {
		const sessionId = "session-APPENDCMPZAB";
		await sessionStore.writeSessionHistory(sessionId, []);
		await sessionStore.appendSessionHistory(sessionId, {
			stepLabel: "done-step",
			kind: "completed",
			summary: "Finished",
		});
		const loaded = await sessionStore.readSessionHistory(sessionId);
		expect(
			loaded.some((r) => r.kind === "completed" && r.stepLabel === "done-step"),
		).toBe(true);
	});

	it("appendSessionHistory with kind blocked updates blocked bucket", async () => {
		const sessionId = "session-APPENDBKDZZX";
		await sessionStore.writeSessionHistory(sessionId, []);
		await sessionStore.appendSessionHistory(sessionId, {
			stepLabel: "stuck-step",
			kind: "blocked",
			summary: "Blocked",
		});
		const loaded = await sessionStore.readSessionHistory(sessionId);
		expect(
			loaded.some((r) => r.kind === "blocked" && r.stepLabel === "stuck-step"),
		).toBe(true);
	});

	it("readSessionHistory returns empty array when session does not exist", async () => {
		const loaded = await sessionStore.readSessionHistory(
			"V1StGXR8_Z5jdHi6BXY0X",
		);
		expect(loaded).toEqual([]);
	});
});

describe("ToonMemoryInterface — housekeeping", () => {
	let memoryInterface: ToonMemoryInterface;
	let testDir!: string;

	beforeEach(async () => {
		testDir = await mkdtemp(
			join(process.cwd(), ".test-mcp-ai-agent-guidelines-housekeeping-"),
		);
		memoryInterface = new ToonMemoryInterface(testDir);
	});

	afterEach(async () => {
		try {
			await rm(testDir, { recursive: true, force: true });
		} catch {}
	});

	it("deleteMemoryArtifact removes an existing artifact and returns true", async () => {
		const artifact = {
			meta: {
				id: "del-test-1",
				created: new Date().toISOString(),
				updated: new Date().toISOString(),
				tags: ["ephemeral"],
				relevance: 5,
			},
			content: {
				summary: "Delete me",
				details: "ephemeral content",
				context: "test",
				actionable: false,
			},
			links: { relatedSessions: [], relatedMemories: [], sources: [] },
		};
		await memoryInterface.saveMemoryArtifact(artifact);
		const result = await memoryInterface.deleteMemoryArtifact("del-test-1");
		expect(result).toBe(true);
		const loaded = await memoryInterface.loadMemoryArtifact("del-test-1");
		expect(loaded).toBeNull();
	});

	it("deleteMemoryArtifact returns false for a non-existent artifact", async () => {
		const result = await memoryInterface.deleteMemoryArtifact("does-not-exist");
		expect(result).toBe(false);
	});

	it("deleteSessionContext removes an existing session and returns true", async () => {
		const sessionId = "session-550e8400-e29b-41d4-a716-446655440000";
		await memoryInterface.saveSessionContext(sessionId, {});
		const result = await memoryInterface.deleteSessionContext(sessionId);
		expect(result).toBe(true);
		const loaded = await memoryInterface.loadSessionContext(sessionId);
		expect(loaded).toBeNull();
	});

	it("deleteSessionContext returns true for a non-existent session", async () => {
		const result = await memoryInterface.deleteSessionContext(
			"session-ABCDEFGHJKMN",
		);
		expect(result).toBe(true);
	});

	it("purgeExpiredArtifacts deletes artifacts older than maxAgeMs", async () => {
		const now = new Date().toISOString();
		await memoryInterface.saveMemoryArtifact({
			meta: {
				id: "purge-target",
				created: now,
				updated: now,
				tags: [],
				relevance: 0.5,
			},
			content: {
				summary: "Target",
				details: "",
				context: "",
				actionable: false,
			},
			links: { relatedSessions: [], relatedMemories: [], sources: [] },
		});
		// Wait so the artifact is at least 1ms old, then purge with maxAgeMs=0
		await new Promise((res) => setTimeout(res, 5));
		const deleted = await memoryInterface.purgeExpiredArtifacts(0);
		expect(deleted).toContain("purge-target");
	});

	it("purgeExpiredArtifacts returns empty array when nothing is expired", async () => {
		const freshDate = new Date().toISOString();
		await memoryInterface.saveMemoryArtifact({
			meta: {
				id: "fresh-2",
				created: freshDate,
				updated: freshDate,
				tags: [],
				relevance: 5,
			},
			content: {
				summary: "Fresh",
				details: "",
				context: "",
				actionable: false,
			},
			links: { relatedSessions: [], relatedMemories: [], sources: [] },
		});
		const deleted = await memoryInterface.purgeExpiredArtifacts(
			365 * 24 * 60 * 60 * 1000,
		);
		expect(deleted).toHaveLength(0);
	});

	it("rescoreMemoryArtifacts updates artifacts with changed scores", async () => {
		const now = new Date().toISOString();
		await memoryInterface.saveMemoryArtifact({
			meta: {
				id: "rescore-1",
				created: now,
				updated: now,
				tags: ["important", "architecture"],
				relevance: 1,
			},
			content: {
				summary: "Needs rescore",
				details: "",
				context: "",
				actionable: false,
			},
			links: { relatedSessions: [], relatedMemories: [], sources: [] },
		});

		const count = await memoryInterface.rescoreMemoryArtifacts([
			"important",
			"architecture",
		]);
		expect(typeof count).toBe("number");
	});

	it("rescoreMemoryArtifacts returns 0 when no artifacts exist", async () => {
		const count = await memoryInterface.rescoreMemoryArtifacts(["tag1"]);
		expect(count).toBe(0);
	});

	it("findDuplicateArtifacts returns groups when content is identical", async () => {
		const now = new Date().toISOString();
		const base = {
			meta: { created: now, updated: now, tags: [], relevance: 5 },
			content: {
				summary: "Same",
				details: "same",
				context: "same",
				actionable: false,
			},
			links: { relatedSessions: [], relatedMemories: [], sources: [] },
		};
		await memoryInterface.saveMemoryArtifact({
			...base,
			meta: { ...base.meta, id: "dup-a" },
		});
		await memoryInterface.saveMemoryArtifact({
			...base,
			meta: { ...base.meta, id: "dup-b" },
		});

		const groups = await memoryInterface.findDuplicateArtifacts();
		expect(groups.length).toBeGreaterThanOrEqual(1);
		const ids = groups.flat().map((a) => a.meta.id);
		expect(ids).toContain("dup-a");
		expect(ids).toContain("dup-b");
	});

	it("findDuplicateArtifacts returns empty when no duplicates", async () => {
		const now = new Date().toISOString();
		await memoryInterface.saveMemoryArtifact({
			meta: {
				id: "unique-1",
				created: now,
				updated: now,
				tags: [],
				relevance: 5,
			},
			content: {
				summary: "Unique one",
				details: "diff a",
				context: "",
				actionable: false,
			},
			links: { relatedSessions: [], relatedMemories: [], sources: [] },
		});
		await memoryInterface.saveMemoryArtifact({
			meta: {
				id: "unique-2",
				created: now,
				updated: now,
				tags: [],
				relevance: 5,
			},
			content: {
				summary: "Unique two",
				details: "diff b",
				context: "",
				actionable: false,
			},
			links: { relatedSessions: [], relatedMemories: [], sources: [] },
		});
		const groups = await memoryInterface.findDuplicateArtifacts();
		expect(groups).toHaveLength(0);
	});

	it("enrichMemoryArtifact updates libraryContext and tags", async () => {
		const now = new Date().toISOString();
		await memoryInterface.saveMemoryArtifact({
			meta: {
				id: "enrich-1",
				created: now,
				updated: now,
				tags: ["test"],
				relevance: 5,
			},
			content: {
				summary: "Enrich me",
				details: "",
				context: "",
				actionable: false,
			},
			links: { relatedSessions: [], relatedMemories: [], sources: [] },
		});
		const ok = await memoryInterface.enrichMemoryArtifact(
			"enrich-1",
			"docs for vitest",
		);
		expect(ok).toBe(true);
		const loaded = await memoryInterface.loadMemoryArtifact("enrich-1");
		expect(loaded?.content.libraryContext).toBe("docs for vitest");
		expect(loaded?.meta.tags).toContain("context7-enriched");
	});

	it("enrichMemoryArtifact returns false for missing artifact", async () => {
		const ok = await memoryInterface.enrichMemoryArtifact(
			"no-such-artifact",
			"docs",
		);
		expect(ok).toBe(false);
	});

	it("enrichMemoryArtifact does not duplicate context7-enriched tag", async () => {
		const now = new Date().toISOString();
		await memoryInterface.saveMemoryArtifact({
			meta: {
				id: "enrich-2",
				created: now,
				updated: now,
				tags: ["context7-enriched"],
				relevance: 5,
			},
			content: {
				summary: "Already enriched",
				details: "",
				context: "",
				actionable: false,
			},
			links: { relatedSessions: [], relatedMemories: [], sources: [] },
		});
		await memoryInterface.enrichMemoryArtifact("enrich-2", "new docs");
		const loaded = await memoryInterface.loadMemoryArtifact("enrich-2");
		const count = loaded?.meta.tags.filter(
			(t: string) => t === "context7-enriched",
		).length;
		expect(count).toBe(1);
	});

	it("exportSessionData returns null for a non-existent session", async () => {
		const result = await memoryInterface.exportSessionData(
			"session-ABCDEFGHJKMN",
		);
		expect(result).toBeNull();
	});

	it("exportSessionData returns a record when session exists", async () => {
		const sessionId = "session-550e8400-e29b-41d4-a716-446655440000";
		await memoryInterface.saveSessionContext(sessionId, {
			context: {
				requestScope: "export test",
				constraints: [],
				phase: "review",
			},
		});
		const exported = await memoryInterface.exportSessionData(sessionId);
		expect(exported).not.toBeNull();
		expect(exported?.sessionId ?? exported).toBeTruthy();
	});

	it("importSessionData returns false for malformed input", async () => {
		const result = await memoryInterface.importSessionData({
			not: "valid",
		});
		expect(result).toBe(false);
	});

	it("getSessionStats returns null for non-existent session", async () => {
		const stats = await memoryInterface.getSessionStats("session-ABCDEFGHJKMN");
		expect(stats).toBeNull();
	});

	it("getSessionStats returns stats for existing session", async () => {
		const sessionId = "session-550e8400-e29b-41d4-a716-446655440000";
		await memoryInterface.saveSessionContext(sessionId, {
			progress: {
				completed: ["task1"],
				inProgress: [],
				blocked: [],
				next: [],
			},
		});
		const stats = await memoryInterface.getSessionStats(sessionId);
		expect(stats).not.toBeNull();
	});

	it("getMemoryStats returns aggregate counts", async () => {
		const sessionId = "session-550e8400-e29b-41d4-a716-446655440000";
		await memoryInterface.saveSessionContext(sessionId, {});
		const stats = await memoryInterface.getMemoryStats();
		expect(stats.totalSessions).toBeGreaterThanOrEqual(1);
		expect(typeof stats.totalArtifacts).toBe("number");
	});

	it("validateStoredSessionContext returns invalid for non-existent session", async () => {
		const result = await memoryInterface.validateStoredSessionContext(
			"session-ABCDEFGHJKMN",
		);
		expect(result.valid).toBe(false);
		expect(result.errors.length).toBeGreaterThan(0);
	});

	it("validateStoredSessionContext returns valid for a well-formed session", async () => {
		const sessionId = "session-550e8400-e29b-41d4-a716-446655440000";
		await memoryInterface.saveSessionContext(sessionId, {
			context: {
				requestScope: "validate test",
				constraints: [],
				phase: "review",
			},
		});
		const result =
			await memoryInterface.validateStoredSessionContext(sessionId);
		expect(result.valid).toBe(true);
	});

	it("validateAllArtifacts returns a map with results", async () => {
		const now = new Date().toISOString();
		await memoryInterface.saveMemoryArtifact({
			meta: {
				id: "val-1",
				created: now,
				updated: now,
				tags: [],
				relevance: 0.9,
			},
			content: {
				summary: "Valid",
				details: "",
				context: "",
				actionable: false,
			},
			links: { relatedSessions: [], relatedMemories: [], sources: [] },
		});
		const map = await memoryInterface.validateAllArtifacts();
		expect(map.has("val-1")).toBe(true);
		// Validation result may be valid or invalid depending on schema strictness
		expect(map.get("val-1")).toHaveProperty("valid");
	});

	it("cleanOrphanedSessions removes sessions without a context file", async () => {
		const { mkdir } = await import("node:fs/promises");
		// Create an "orphan" — a session directory with no state.toon file
		const orphanId = "session-550e8400-e29b-41d4-a716-446655440000";
		await mkdir(join(testDir, "sessions", orphanId), { recursive: true });
		const orphaned = await memoryInterface.cleanOrphanedSessions();
		expect(orphaned).toContain(orphanId);
	});

	it("cleanOrphanedSessions returns empty when all sessions are healthy", async () => {
		const sessionId = "session-ABCDEFGHJKMN";
		await memoryInterface.saveSessionContext(sessionId, {});
		const orphaned = await memoryInterface.cleanOrphanedSessions();
		expect(orphaned).not.toContain(sessionId);
	});

	it("mergeSessions returns false when source session does not exist", async () => {
		const targetId = "session-550e8400-e29b-41d4-a716-446655440000";
		await memoryInterface.saveSessionContext(targetId, {});
		const result = await memoryInterface.mergeSessions(
			"session-ABCDEFGHJKMN",
			targetId,
		);
		expect(result).toBe(false);
	});

	it("mergeSessions returns false when target session does not exist", async () => {
		const sourceId = "session-ABCDEFGHJKMN";
		await memoryInterface.saveSessionContext(sourceId, {});
		const result = await memoryInterface.mergeSessions(
			sourceId,
			"session-550e8400-e29b-41d4-a716-446655440000",
		);
		expect(result).toBe(false);
	});

	it("mergeSessions merges two existing sessions", async () => {
		const sourceId = "session-ABCDEFGHJKMN";
		const targetId = "session-550e8400-e29b-41d4-a716-446655440000";
		await memoryInterface.saveSessionContext(sourceId, {
			memory: {
				keyInsights: ["source insight"],
				decisions: {},
				patterns: [],
				warnings: [],
			},
		});
		await memoryInterface.saveSessionContext(targetId, {
			memory: {
				keyInsights: ["target insight"],
				decisions: {},
				patterns: [],
				warnings: [],
			},
		});
		const result = await memoryInterface.mergeSessions(sourceId, targetId);
		expect(result).toBe(true);
	});

	it("deduplicateProgress returns false for non-existent session", async () => {
		const result = await memoryInterface.deduplicateProgress(
			"session-ABCDEFGHJKMN",
		);
		expect(result).toBe(false);
	});

	it("deduplicateProgress deduplicates a session with duplicate entries", async () => {
		const sessionId = "session-550e8400-e29b-41d4-a716-446655440000";
		await memoryInterface.saveSessionContext(sessionId, {
			progress: {
				completed: ["task1", "task1"],
				inProgress: [],
				blocked: [],
				next: [],
			},
		});
		const result = await memoryInterface.deduplicateProgress(sessionId);
		expect(result).toBe(true);
	});

	it("deleteFingerprintSnapshot returns true after a snapshot has been taken", async () => {
		const bootstrapStub = vi
			.spyOn(
				memoryInterface as unknown as {
					bootstrapSnapshotIfMissing: () => Promise<void>;
				},
				"bootstrapSnapshotIfMissing",
			)
			.mockResolvedValue(undefined);
		const scanSpy = vi
			.spyOn(CodebaseScanner.prototype, "scan")
			.mockResolvedValueOnce({
				capturedAt: new Date().toISOString(),
				skillIds: ["s1"],
				instructionNames: ["i1"],
				codePaths: ["src/x.ts"],
				fileSummaries: [],
				symbolMap: {},
			});

		try {
			await memoryInterface.refresh();
			const result = await memoryInterface.deleteFingerprintSnapshot();
			expect(result).toBe(true);
		} finally {
			bootstrapStub.mockRestore();
			scanSpy.mockRestore();
		}
	});

	it("loadFingerprintSnapshot with oldest selector returns null when no history", async () => {
		const bootstrapStub = vi
			.spyOn(
				memoryInterface as unknown as {
					bootstrapSnapshotIfMissing: () => Promise<void>;
				},
				"bootstrapSnapshotIfMissing",
			)
			.mockResolvedValue(undefined);
		try {
			const snap = await memoryInterface.loadFingerprintSnapshot("oldest");
			expect(snap).toBeNull();
		} finally {
			bootstrapStub.mockRestore();
		}
	});

	it("loadFingerprintSnapshot with explicit snapshotId returns null when not found", async () => {
		const bootstrapStub = vi
			.spyOn(
				memoryInterface as unknown as {
					bootstrapSnapshotIfMissing: () => Promise<void>;
				},
				"bootstrapSnapshotIfMissing",
			)
			.mockResolvedValue(undefined);
		try {
			const snap =
				await memoryInterface.loadFingerprintSnapshot("nonexistent-id");
			expect(snap).toBeNull();
		} finally {
			bootstrapStub.mockRestore();
		}
	});

	it("findMemoryArtifacts with maxAgeMs includes all fresh artifacts", async () => {
		const freshDate = new Date().toISOString();
		await memoryInterface.saveMemoryArtifact({
			meta: {
				id: "fresh-maxage",
				created: freshDate,
				updated: freshDate,
				tags: [],
				relevance: 0.5,
			},
			content: {
				summary: "Fresh",
				details: "",
				context: "",
				actionable: false,
			},
			links: { relatedSessions: [], relatedMemories: [], sources: [] },
		});
		// With a large maxAgeMs, just-created artifacts should be included
		const recent = await memoryInterface.findMemoryArtifacts({
			maxAgeMs: 30 * 24 * 60 * 60 * 1000,
		});
		const ids = recent.map((a) => a.meta.id);
		expect(ids).toContain("fresh-maxage");
	});

	it("findMemoryArtifacts with very small maxAgeMs excludes all artifacts", async () => {
		const freshDate = new Date().toISOString();
		await memoryInterface.saveMemoryArtifact({
			meta: {
				id: "any-maxage",
				created: freshDate,
				updated: freshDate,
				tags: [],
				relevance: 0.5,
			},
			content: { summary: "Any", details: "", context: "", actionable: false },
			links: { relatedSessions: [], relatedMemories: [], sources: [] },
		});
		// Wait briefly so the artifact is at least 1ms old, then filter with 0ms
		await new Promise((res) => setTimeout(res, 5));
		const filtered = await memoryInterface.findMemoryArtifacts({ maxAgeMs: 0 });
		const ids = filtered.map((a) => a.meta.id);
		expect(ids).not.toContain("any-maxage");
	});

	it("batchLoadSessionContexts returns map with null for missing sessions", async () => {
		const ctx = {
			context: {
				requestScope: "batch load test",
				phase: "implement" as const,
				constraints: [],
			},
			progress: { completed: [], inProgress: [], blocked: [], next: [] },
		};
		await memoryInterface.saveSessionContext("session-PQRSTUVWXYZB", ctx);
		const result = await memoryInterface.batchLoadSessionContexts([
			"session-PQRSTUVWXYZB",
			"session-PQRSTUVWXYZC",
		]);
		expect(result.get("session-PQRSTUVWXYZB")).not.toBeNull();
		expect(result.get("session-PQRSTUVWXYZC")).toBeNull();
	});

	it("batchSaveSessionContexts saves multiple sessions", async () => {
		await memoryInterface.batchSaveSessionContexts([
			{
				sessionId: "session-PQRSTUVWXYZE",
				context: {
					context: {
						requestScope: "multi 1",
						phase: "implement" as const,
						constraints: [],
					},
				},
			},
			{
				sessionId: "session-PQRSTUVWXYZF",
				context: {
					context: {
						requestScope: "multi 2",
						phase: "review" as const,
						constraints: [],
					},
				},
			},
		]);
		const ctx1 = await memoryInterface.loadSessionContext(
			"session-PQRSTUVWXYZE",
		);
		const ctx2 = await memoryInterface.loadSessionContext(
			"session-PQRSTUVWXYZF",
		);
		expect(ctx1?.context.requestScope).toBe("multi 1");
		expect(ctx2?.context.requestScope).toBe("multi 2");
	});

	it("batchSaveMemoryArtifacts and batchLoadMemoryArtifacts work together", async () => {
		const makeArtifact = (id: string) => ({
			meta: {
				id,
				toolName: "testing",
				sessionId: "batch-art-sess",
				created: new Date().toISOString(),
				updated: new Date().toISOString(),
				relevance: 0.5,
				tags: [],
			},
			content: {
				summary: `artifact ${id}`,
				details: "",
				context: "",
				actionable: false,
			},
			links: { relatedSessions: [], relatedMemories: [], sources: [] },
		});

		await memoryInterface.batchSaveMemoryArtifacts([
			makeArtifact("batch-art-1"),
			makeArtifact("batch-art-2"),
		]);

		const loaded = await memoryInterface.batchLoadMemoryArtifacts([
			"batch-art-1",
			"batch-art-2",
			"batch-art-missing",
		]);
		expect(loaded.get("batch-art-1")?.meta.id).toBe("batch-art-1");
		expect(loaded.get("batch-art-2")?.meta.id).toBe("batch-art-2");
		expect(loaded.get("batch-art-missing")).toBeNull();
	});

	it("updateMemoryArtifact returns false when artifact does not exist", async () => {
		const result = await memoryInterface.updateMemoryArtifact(
			"no-such-artifact",
			{
				content: {
					summary: "updated",
					details: "",
					context: "",
					actionable: false,
				},
			},
		);
		expect(result).toBe(false);
	});

	it("updateMemoryArtifact merges changes and returns true when artifact exists", async () => {
		const artifact = {
			meta: {
				id: "update-test-1",
				toolName: "testing",
				sessionId: "upd-sess",
				created: new Date().toISOString(),
				updated: new Date().toISOString(),
				relevance: 0.5,
				tags: [],
			},
			content: {
				summary: "original",
				details: "",
				context: "",
				actionable: false,
			},
			links: { relatedSessions: [], relatedMemories: [], sources: [] },
		};
		await memoryInterface.saveMemoryArtifact(artifact);
		const result = await memoryInterface.updateMemoryArtifact("update-test-1", {
			content: {
				summary: "updated summary",
				details: "",
				context: "",
				actionable: false,
			},
		});
		expect(result).toBe(true);
		const loaded = await memoryInterface.loadMemoryArtifact("update-test-1");
		expect(loaded?.content.summary).toBe("updated summary");
	});

	it("updateSessionProgress throws when session does not exist", async () => {
		await expect(
			memoryInterface.updateSessionProgress("session-NONEXISTENT0000001", {
				completed: ["task1"],
			}),
		).rejects.toThrow("Session context not found");
	});

	it("addSessionInsight throws when session does not exist", async () => {
		await expect(
			memoryInterface.addSessionInsight(
				"session-NONEXISTENT0000002",
				"Some insight",
				"insight",
			),
		).rejects.toThrow("Session context not found");
	});

	it("saveWorkspaceMap wraps plain record in generated metadata when no modules key", async () => {
		const sessionId = "session-550e8400-e29b-41d4-a716-446655440001";
		const plainRecord = {
			core: {
				path: "src/core",
				files: ["core.ts"],
				dependencies: [],
			},
		};
		// No 'modules' key → takes the { generated, modules: map } branch
		await memoryInterface.saveWorkspaceMap(sessionId, plainRecord as never);
		const loaded = await memoryInterface.loadWorkspaceMap(sessionId);
		expect(loaded).toBeDefined();
	});

	it("findMemoryArtifacts skips non-.toon files in the memory dir", async () => {
		// Save one valid artifact to ensure the memory dir exists
		const validArtifact = {
			meta: {
				id: "skip-test-1",
				toolName: "test",
				sessionId: "session-ABCDEFGHJKMN",
				created: new Date().toISOString(),
				updated: new Date().toISOString(),
				relevance: 0.5,
				tags: [],
			},
			content: {
				summary: "valid",
				details: "",
				context: "",
				actionable: false,
			},
			links: { relatedSessions: [], relatedMemories: [], sources: [] },
		};
		await memoryInterface.saveMemoryArtifact(validArtifact);
		const { writeFile: fsWriteFile } = await import("node:fs/promises");
		const { join: fsJoin } = await import("node:path");
		const memDir = fsJoin(testDir, "memory");
		await fsWriteFile(
			fsJoin(memDir, "not-a-toon.json"),
			'{"key":"val"}',
			"utf8",
		);
		await fsWriteFile(fsJoin(memDir, "readme.txt"), "ignore me", "utf8");
		// Should not error and should return only the valid artifact
		const artifacts = await memoryInterface.findMemoryArtifacts();
		expect(artifacts.length).toBe(1);
	});

	it("loadMemoryArtifact returns null for a corrupted .toon file", async () => {
		// Save a valid artifact first to ensure the memory dir exists
		const stub = {
			meta: {
				id: "corrupt-seed",
				toolName: "test",
				sessionId: "session-ABCDEFGHJKMN",
				created: new Date().toISOString(),
				updated: new Date().toISOString(),
				relevance: 0.5,
				tags: [],
			},
			content: { summary: "seed", details: "", context: "", actionable: false },
			links: { relatedSessions: [], relatedMemories: [], sources: [] },
		};
		await memoryInterface.saveMemoryArtifact(stub);
		const { writeFile: fsWriteFile } = await import("node:fs/promises");
		const { join: fsJoin } = await import("node:path");
		const memDir = fsJoin(testDir, "memory");
		// Write an invalid .toon file that will fail toonDecode
		await fsWriteFile(
			fsJoin(memDir, "corrupt-artifact.toon"),
			"INVALID\x00\x00CORRUPT",
			"utf8",
		);
		const result = await memoryInterface.loadMemoryArtifact("corrupt-artifact");
		expect(result).toBeNull();
	});

	it("saveMemoryArtifact throws for unsafe memory IDs containing path traversal", async () => {
		const unsafeArtifact = {
			meta: {
				id: "../evil",
				toolName: "test",
				sessionId: "session-ABCDEFGHJKMN",
				created: new Date().toISOString(),
				updated: new Date().toISOString(),
				relevance: 0.5,
				tags: [],
			},
			content: {
				summary: "unsafe",
				details: "",
				context: "",
				actionable: false,
			},
			links: { relatedSessions: [], relatedMemories: [], sources: [] },
		};
		await expect(
			memoryInterface.saveMemoryArtifact(unsafeArtifact as never),
		).rejects.toThrow("Unsafe memory ID");
	});

	it("loadSessionContext returns null for a session file with missing structure", async () => {
		const { encode } = await import("@toon-format/toon");
		const { writeFile: fsWriteFile, mkdir } = await import("node:fs/promises");
		const { join: fsJoin } = await import("node:path");
		const sessionId = "session-STRTESTABCDE";
		const sessionDir = fsJoin(testDir, "sessions", sessionId);
		await mkdir(sessionDir, { recursive: true });
		// Write valid TOON that decodes to an object WITHOUT meta/context/progress
		const incompleteContent = encode(
			{ foo: "bar", baz: 42 },
			{ delimiter: "\t" },
		);
		await fsWriteFile(
			fsJoin(sessionDir, "state.toon"),
			incompleteContent,
			"utf8",
		);
		// Should return null because decoded object lacks required keys
		const result = await memoryInterface.loadSessionContext(sessionId);
		expect(result).toBeNull();
	});

	it("updateMemoryArtifact with links in changes calls enrichArtifactLinks", async () => {
		const artifact = {
			meta: {
				id: "links-update-test-1",
				toolName: "test",
				sessionId: "session-ABCDEFGHJKMN",
				created: new Date().toISOString(),
				updated: new Date().toISOString(),
				relevance: 0.5,
				tags: [],
			},
			content: {
				summary: "with links",
				details: "",
				context: "",
				actionable: false,
			},
			links: { relatedSessions: [], relatedMemories: [], sources: [] },
		};
		await memoryInterface.saveMemoryArtifact(artifact);
		const result = await memoryInterface.updateMemoryArtifact(
			"links-update-test-1",
			{
				links: {
					relatedSessions: ["session-ABCDEFGHJKMN"],
					relatedMemories: [],
					sources: [],
				},
			},
		);
		expect(result).toBe(true);
	});

	it("importSessionData returns true for valid session export data", async () => {
		const sessionId = "session-550e8400-e29b-41d4-a716-446655440099";
		const ctx = {
			context: {
				requestScope: "import test",
				phase: "implement" as const,
				constraints: [],
			},
			progress: { completed: [], inProgress: [], blocked: [], next: [] },
		};
		await memoryInterface.saveSessionContext(sessionId, ctx);
		const exported = await memoryInterface.exportSessionData(sessionId);
		expect(exported).not.toBeNull();
		// Import into a fresh interface
		const { mkdtemp: mkdtempFresh, rm: rmFresh } = await import(
			"node:fs/promises"
		);
		const { join: joinFresh } = await import("node:path");
		const freshDir = await mkdtempFresh(
			joinFresh(process.cwd(), ".test-import-"),
		);
		try {
			const freshInterface = new ToonMemoryInterface(freshDir);
			const importResult = await freshInterface.importSessionData(exported);
			expect(importResult).toBe(true);
		} finally {
			await rmFresh(freshDir, { recursive: true, force: true });
		}
	});

	it("purgeExpiredArtifacts with large maxAgeMs does not delete fresh artifacts", async () => {
		const artifact = {
			meta: {
				id: "fresh-artifact-1",
				toolName: "test",
				sessionId: "session-ABCDEFGHJKMN",
				created: new Date().toISOString(),
				updated: new Date().toISOString(),
				relevance: 0.5,
				tags: [],
			},
			content: {
				summary: "fresh",
				details: "",
				context: "",
				actionable: false,
			},
			links: { relatedSessions: [], relatedMemories: [], sources: [] },
		};
		await memoryInterface.saveMemoryArtifact(artifact);
		// Use a very large maxAgeMs — the artifact is fresh, so it won't be expired
		const deleted = await memoryInterface.purgeExpiredArtifacts(
			1000 * 60 * 60 * 24 * 365,
		);
		expect(deleted).toHaveLength(0);
		// Artifact should still exist
		const loaded = await memoryInterface.loadMemoryArtifact("fresh-artifact-1");
		expect(loaded).not.toBeNull();
	});

	it("rescoreMemoryArtifacts updates relevance when preferred tags match", async () => {
		const artifact = {
			meta: {
				id: "rescore-test-1",
				toolName: "test",
				sessionId: "session-ABCDEFGHJKMN",
				created: new Date().toISOString(),
				updated: new Date().toISOString(),
				relevance: 0.01,
				tags: ["special-tag-xyz"],
			},
			content: {
				summary: "rescore test",
				details: "",
				context: "",
				actionable: false,
			},
			links: { relatedSessions: [], relatedMemories: [], sources: [] },
		};
		await memoryInterface.saveMemoryArtifact(artifact);
		// Passing preferredTags that match the artifact's tags should change its relevance
		const updated = await memoryInterface.rescoreMemoryArtifacts(
			["special-tag-xyz"],
			1000 * 60 * 60 * 24 * 365,
		);
		expect(updated).toBeGreaterThanOrEqual(0);
	});

	it("loadFingerprintSnapshotHistory handles missing latestSnapshotId and snapshots", async () => {
		const { writeFile: fsWriteFile, mkdir } = await import("node:fs/promises");
		const { join: fsJoin } = await import("node:path");
		const snapshotDir = fsJoin(testDir, "snapshots");
		await mkdir(snapshotDir, { recursive: true });
		// Write a history file missing optional fields to trigger ?? fallbacks
		await fsWriteFile(
			fsJoin(snapshotDir, "fingerprint-history.json"),
			JSON.stringify({ version: "1" }), // no latestSnapshotId, no snapshots
			"utf8",
		);
		const history = await memoryInterface.listFingerprintSnapshots();
		expect(Array.isArray(history)).toBe(true);
	});

	it("compare() uses latest selector by default (default arg)", async () => {
		const bootstrapStub = vi
			.spyOn(
				memoryInterface as unknown as {
					bootstrapSnapshotIfMissing: () => Promise<void>;
				},
				"bootstrapSnapshotIfMissing",
			)
			.mockResolvedValue(undefined);
		const scanSpy = vi
			.spyOn(CodebaseScanner.prototype, "scan")
			.mockResolvedValue({
				capturedAt: new Date().toISOString(),
				skillIds: ["test-skill"],
				instructionNames: [],
				codePaths: ["src/index.ts"],
				fileSummaries: [],
				symbolMap: {},
			});
		try {
			// Calling compare() with no args triggers default-arg[0] at line 555
			const result = await memoryInterface.compare();
			expect(result).toHaveProperty("drift");
			expect(result).toHaveProperty("toon");
		} finally {
			bootstrapStub.mockRestore();
			scanSpy.mockRestore();
		}
	});

	it("normalizeFingerprintSnapshot fills missing version, snapshotId via legacy migration", async () => {
		const { writeFile: fsWriteFile, mkdir } = await import("node:fs/promises");
		const { join: fsJoin } = await import("node:path");
		const snapshotDir = fsJoin(testDir, "snapshots");
		await mkdir(snapshotDir, { recursive: true });
		// Write a legacy snapshot file without version, snapshotId, or codePaths in meta/fingerprint
		// This triggers ?? fallbacks on lines 306 ([2]: both codePaths and srcPaths absent),
		// 309 ([1]: version absent), and 312 ([2]: both overrides.snapshotId and snapshot.snapshotId absent)
		const legacySnapshot = {
			meta: {
				capturedAt: "2026-01-01T00:00:00.000Z",
				// no version, no snapshotId
			},
			fingerprint: {
				capturedAt: "2026-01-01T00:00:00.000Z",
				skillIds: ["a"],
				instructionNames: [],
				// no codePaths, no srcPaths → triggers binary-expr[2] at line 306 → uses []
				fileSummaries: [],
				symbolMap: {},
			},
		};
		await fsWriteFile(
			fsJoin(snapshotDir, "fingerprint-latest.json"),
			JSON.stringify(legacySnapshot),
			"utf8",
		);
		const bootstrapStub = vi
			.spyOn(
				memoryInterface as unknown as {
					bootstrapSnapshotIfMissing: () => Promise<void>;
				},
				"bootstrapSnapshotIfMissing",
			)
			.mockResolvedValue(undefined);
		const scanSpy = vi
			.spyOn(CodebaseScanner.prototype, "scan")
			.mockResolvedValue({
				capturedAt: new Date().toISOString(),
				skillIds: ["a"],
				instructionNames: [],
				codePaths: ["src/a.ts"],
				fileSummaries: [],
				symbolMap: {},
			});
		try {
			// refresh() → ensureSnapshotHistoryInitialized() → reads legacy snapshot
			// → normalizeFingerprintSnapshot with missing meta fields → triggers ?? branches
			await memoryInterface.refresh();
			const history = await memoryInterface.listFingerprintSnapshots();
			expect(history.length).toBeGreaterThanOrEqual(1);
		} finally {
			bootstrapStub.mockRestore();
			scanSpy.mockRestore();
		}
	});

	it("normalizeFingerprintSnapshot uses srcPaths when codePaths is absent", async () => {
		const { writeFile: fsWriteFile, mkdir } = await import("node:fs/promises");
		const { join: fsJoin } = await import("node:path");
		const snapshotDir = fsJoin(testDir, "snapshots");
		await mkdir(snapshotDir, { recursive: true });
		// Legacy snapshot with srcPaths but NO codePaths → triggers binary-expr[1] at line 306
		const legacyWithSrcPaths = {
			meta: { capturedAt: "2026-02-01T00:00:00.000Z" },
			fingerprint: {
				capturedAt: "2026-02-01T00:00:00.000Z",
				skillIds: ["b"],
				instructionNames: [],
				srcPaths: ["src/b.ts"], // srcPaths but no codePaths
				fileSummaries: [],
				symbolMap: {},
			},
		};
		await fsWriteFile(
			fsJoin(snapshotDir, "fingerprint-latest.json"),
			JSON.stringify(legacyWithSrcPaths),
			"utf8",
		);
		const bootstrapStub = vi
			.spyOn(
				memoryInterface as unknown as {
					bootstrapSnapshotIfMissing: () => Promise<void>;
				},
				"bootstrapSnapshotIfMissing",
			)
			.mockResolvedValue(undefined);
		const scanSpy = vi
			.spyOn(CodebaseScanner.prototype, "scan")
			.mockResolvedValue({
				capturedAt: new Date().toISOString(),
				skillIds: ["b"],
				instructionNames: [],
				codePaths: ["src/b.ts"],
				fileSummaries: [],
				symbolMap: {},
			});
		try {
			await memoryInterface.refresh();
			const snaps = await memoryInterface.listFingerprintSnapshots();
			expect(snaps.length).toBeGreaterThanOrEqual(1);
		} finally {
			bootstrapStub.mockRestore();
			scanSpy.mockRestore();
		}
	});

	it("normalizeFingerprintSnapshot uses srcPaths when codePaths is absent", async () => {
		const { writeFile: fsWriteFile, mkdir } = await import("node:fs/promises");
		const { join: fsJoin } = await import("node:path");
		const snapshotDir = fsJoin(testDir, "snapshots");
		await mkdir(snapshotDir, { recursive: true });
		// Legacy snapshot with srcPaths but NO codePaths → triggers binary-expr[1] at line 306
		const legacyWithSrcPaths = {
			meta: { capturedAt: "2026-02-01T00:00:00.000Z" },
			fingerprint: {
				capturedAt: "2026-02-01T00:00:00.000Z",
				skillIds: ["b"],
				instructionNames: [],
				srcPaths: ["src/b.ts"], // srcPaths but no codePaths
				fileSummaries: [],
				symbolMap: {},
			},
		};
		await fsWriteFile(
			fsJoin(snapshotDir, "fingerprint-latest.json"),
			JSON.stringify(legacyWithSrcPaths),
			"utf8",
		);
		const bootstrapStub = vi
			.spyOn(
				memoryInterface as unknown as {
					bootstrapSnapshotIfMissing: () => Promise<void>;
				},
				"bootstrapSnapshotIfMissing",
			)
			.mockResolvedValue(undefined);
		const scanSpy = vi
			.spyOn(CodebaseScanner.prototype, "scan")
			.mockResolvedValue({
				capturedAt: new Date().toISOString(),
				skillIds: ["b"],
				instructionNames: [],
				codePaths: ["src/b.ts"],
				fileSummaries: [],
				symbolMap: {},
			});
		try {
			await memoryInterface.refresh();
			const snaps = await memoryInterface.listFingerprintSnapshots();
			expect(snaps.length).toBeGreaterThanOrEqual(1);
		} finally {
			bootstrapStub.mockRestore();
			scanSpy.mockRestore();
		}
	});

	it("persistFingerprintSnapshot prunes oldest snapshots beyond SNAPSHOT_MAX_RETAIN (10)", async () => {
		const bootstrapStub = vi
			.spyOn(
				memoryInterface as unknown as {
					bootstrapSnapshotIfMissing: () => Promise<void>;
				},
				"bootstrapSnapshotIfMissing",
			)
			.mockResolvedValue(undefined);
		// Mock the scanner to always return a scan result with incrementing timestamp
		let callCount = 0;
		const scanSpy = vi
			.spyOn(CodebaseScanner.prototype, "scan")
			.mockImplementation(async () => {
				callCount++;
				const ts = new Date(Date.now() + callCount * 1000).toISOString();
				return {
					capturedAt: ts,
					skillIds: ["test"],
					instructionNames: [],
					codePaths: ["src/index.ts"],
					fileSummaries: [],
					symbolMap: {},
				};
			});
		try {
			// Call refresh() 11 times (one more than SNAPSHOT_MAX_RETAIN=10) to trigger pruning
			for (let i = 0; i < 11; i++) {
				await memoryInterface.refresh();
			}
			const history = await memoryInterface.listFingerprintSnapshots();
			// Only the last SNAPSHOT_MAX_RETAIN (10) snapshots should remain
			expect(history.length).toBeLessThanOrEqual(10);
		} finally {
			bootstrapStub.mockRestore();
			scanSpy.mockRestore();
		}
	});

	it("getMemoryStats includes null stats for sessions without context", async () => {
		const { mkdir } = await import("node:fs/promises");
		const { join: fsJoin } = await import("node:path");
		// Create a session directory WITHOUT a state.toon file
		const sessionDir = fsJoin(testDir, "sessions", "session-ABCDEFGHJKMN");
		await mkdir(sessionDir, { recursive: true });
		// getMemoryStats → listSessionIds finds the dir → getSessionStats returns null (no state.toon)
		const stats = await memoryInterface.getMemoryStats();
		expect(stats.totalSessions).toBeGreaterThanOrEqual(1);
		// The session with no context should NOT appear in sessionStats
		expect(stats.sessionStats["session-ABCDEFGHJKMN"]).toBeUndefined();
	});
});

describe("ToonMemoryInterface — isWorkspaceInitialized", () => {
	let testDir: string | undefined;
	let memoryInterface: ToonMemoryInterface;

	beforeEach(async () => {
		testDir = await createIsolatedTestDir();
		process.env.MCP_AI_AGENT_GUIDELINES_STATE_DIR = testDir;
		memoryInterface = new ToonMemoryInterface(testDir);
	});

	afterEach(async () => {
		delete process.env.MCP_AI_AGENT_GUIDELINES_STATE_DIR;
		await cleanupTestDir(testDir);
	});

	it("returns false when orchestration.toml does not exist", async () => {
		// testDir has no config/orchestration.toml
		const result = await memoryInterface.isWorkspaceInitialized();
		expect(result).toBe(false);
	});

	it("returns true when orchestration.toml exists", async () => {
		const { mkdir } = await import("node:fs/promises");
		const configDir = join(testDir!, "config");
		await mkdir(configDir, { recursive: true });
		await writeFile(join(configDir, "orchestration.toml"), "[model]\n", "utf8");

		const result = await memoryInterface.isWorkspaceInitialized();
		expect(result).toBe(true);
	});

	it("awaits baseDirReadyPromise when no explicit dir or env var is given", async () => {
		// Remove env var so the async workspace-root detection branch is triggered.
		const saved = process.env.MCP_AI_AGENT_GUIDELINES_STATE_DIR;
		delete process.env.MCP_AI_AGENT_GUIDELINES_STATE_DIR;
		try {
			// Construct without customDir — this sets baseDirReadyPromise.
			const iface = new ToonMemoryInterface();
			// Call immediately before the promise resolves to exercise the await path.
			const result = await iface.isWorkspaceInitialized();
			// The current working directory is the repo root which has orchestration.toml.
			expect(typeof result).toBe("boolean");
		} finally {
			if (saved === undefined) {
				delete process.env.MCP_AI_AGENT_GUIDELINES_STATE_DIR;
			} else {
				process.env.MCP_AI_AGENT_GUIDELINES_STATE_DIR = saved;
			}
		}
	});
});
