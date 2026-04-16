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
});
