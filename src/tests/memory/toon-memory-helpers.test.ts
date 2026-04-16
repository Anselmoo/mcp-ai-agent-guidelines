import { describe, expect, it } from "vitest";
import {
	appendSessionProgress,
	applySessionInsight,
	buildSessionContext,
	diffFingerprints,
	enhanceMemoryArtifact,
	matchesMemoryArtifactFilter,
	readProgressHistory,
	splitProgressRecords,
} from "../../memory/toon-memory-helpers.js";

describe("memory/toon-memory-helpers", () => {
	it("diffs fingerprints and artifact filters without session-path logic", () => {
		const drift = diffFingerprints(
			{
				capturedAt: "baseline",
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
			},
			{
				capturedAt: "current",
				skillIds: ["a", "b"],
				instructionNames: ["x"],
				codePaths: ["src/a.ts", "src/b.ts"],
				fileSummaries: [
					{
						path: "src/a.ts",
						contentHash: "hash-a-modified",
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
			},
		);

		expect(drift.clean).toBe(false);
		expect(drift.entries).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ dimension: "skill", id: "b" }),
				expect.objectContaining({ dimension: "codefile", id: "src/b.ts" }),
				expect.objectContaining({
					dimension: "codefile",
					change: "modified",
					id: "src/a.ts",
				}),
			]),
		);

		expect(
			matchesMemoryArtifactFilter(
				{
					meta: {
						id: "artifact",
						created: "now",
						updated: "now",
						tags: ["important", "debug"],
						relevance: 9,
					},
					content: {
						summary: "summary",
						details: "details",
						context: "context",
						actionable: true,
					},
					links: {
						relatedSessions: ["session-1"],
						relatedMemories: [],
						sources: ["test"],
					},
				},
				{ tags: ["debug"], minRelevance: 8, sessionId: "session-1" },
			),
		).toBe(true);
	});

	it("handles empty baselines and rejecting artifact filters", () => {
		expect(
			diffFingerprints(null, {
				capturedAt: "current",
				skillIds: [],
				instructionNames: [],
				codePaths: [],
				fileSummaries: [],
			}),
		).toEqual({
			baseline: "none",
			current: "current",
			clean: true,
			entries: [],
			orphanedArtifacts: [],
		});

		const artifact = {
			meta: {
				id: "artifact",
				created: "then",
				updated: "then",
				tags: ["important"],
				relevance: 5,
			},
			content: {
				summary: "summary",
				details: "details",
				context: "context",
				actionable: true,
			},
			links: {
				relatedSessions: ["session-1"],
				relatedMemories: [],
				sources: ["test"],
			},
		};

		expect(matchesMemoryArtifactFilter(artifact, { minRelevance: 6 })).toBe(
			false,
		);
		expect(matchesMemoryArtifactFilter(artifact, { tags: ["debug"] })).toBe(
			false,
		);
		expect(
			matchesMemoryArtifactFilter(artifact, { sessionId: "session-2" }),
		).toBe(false);
	});

	it("builds and mutates session context and progress history", () => {
		const context = buildSessionContext(
			"1.0.0",
			"session-1",
			{},
			"2025-01-01T00:00:00.000Z",
		);

		const updatedContext = appendSessionProgress(context, {
			completed: ["done"],
			inProgress: ["doing"],
			next: ["next-up"],
		});
		applySessionInsight(
			updatedContext,
			"decide this",
			"decision",
			"decision-1",
		);

		expect(context.progress.completed).toEqual([]);
		expect(updatedContext.progress.completed).toEqual(["done"]);
		expect(updatedContext.memory.decisions["decision-1"]).toBe("decide this");
		expect(readProgressHistory(updatedContext)).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ stepLabel: "done", kind: "completed" }),
				expect.objectContaining({ stepLabel: "doing", kind: "in_progress" }),
				expect.objectContaining({ stepLabel: "next-up", kind: "next" }),
			]),
		);
	});

	it("records every insight type and backfills artifact timestamps", () => {
		const context = buildSessionContext(
			"1.0.0",
			"session-1",
			{},
			"2025-01-01T00:00:00.000Z",
		);
		applySessionInsight(context, "notice this", "insight", "unused");
		applySessionInsight(context, "watch for it", "warning", "unused");
		applySessionInsight(context, "repeatable", "pattern", "unused");

		expect(context.memory.keyInsights).toEqual(["notice this"]);
		expect(context.memory.warnings).toEqual(["watch for it"]);
		expect(context.memory.patterns).toEqual(["repeatable"]);

		expect(
			enhanceMemoryArtifact(
				{
					meta: {
						id: "artifact",
						created: "",
						updated: "older",
						tags: [],
						relevance: 1,
					},
					content: {
						summary: "summary",
						details: "details",
						context: "context",
						actionable: false,
					},
					links: {
						relatedSessions: [],
						relatedMemories: [],
						sources: [],
					},
				},
				"2025-01-02T00:00:00.000Z",
			),
		).toMatchObject({
			meta: {
				created: "2025-01-02T00:00:00.000Z",
				updated: "2025-01-02T00:00:00.000Z",
			},
		});
	});

	it("splits execution progress records back into TOON progress buckets", () => {
		const progress = splitProgressRecords([
			{ stepLabel: "done", kind: "completed", summary: "done" },
			{ stepLabel: "doing", kind: "in_progress", summary: "doing" },
			{ stepLabel: "blocked", kind: "blocked", summary: "blocked" },
			{ stepLabel: "next-up", kind: "next", summary: "next" },
		]);

		expect(progress).toEqual({
			completed: ["done"],
			inProgress: ["doing"],
			blocked: ["blocked"],
			next: ["next-up"],
		});
	});
});
