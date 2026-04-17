import { describe, expect, it } from "vitest";
import {
	appendSessionProgress,
	applySessionInsight,
	batchBuildSessionContexts,
	buildSessionContext,
	computeArtifactContentHash,
	computeSessionStats,
	deduplicateSessionProgress,
	diffFingerprints,
	enhanceMemoryArtifact,
	enrichArtifactLinks,
	exportSessionToRecord,
	importSessionFromExport,
	markInProgressAsBlocked,
	matchesMemoryArtifactFilter,
	mergeSessionContexts,
	readProgressHistory,
	replaceSessionProgress,
	scoreArtifactRelevance,
	searchArtifactsByContent,
	splitProgressRecords,
	validateMemoryArtifact,
	validateSessionContext,
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

	it("validateSessionContext returns invalid for non-object", () => {
		const result = validateSessionContext(null);
		expect(result.valid).toBe(false);
	});

	it("validateSessionContext returns valid for well-formed context", () => {
		const now = new Date().toISOString();
		const ctx = buildSessionContext("1", "sess-1", {}, now);
		const result = validateSessionContext(ctx);
		expect(result.valid).toBe(true);
	});

	it("validateMemoryArtifact returns invalid for non-object", () => {
		const result = validateMemoryArtifact("not-an-object");
		expect(result.valid).toBe(false);
	});

	it("validateMemoryArtifact returns invalid when relevance out of range", () => {
		const artifact = {
			meta: {
				id: "a1",
				created: new Date().toISOString(),
				updated: new Date().toISOString(),
				tags: [],
				relevance: 5,
			},
			content: { summary: "s", details: "d", context: "c", actionable: false },
			links: { relatedSessions: [], relatedMemories: [], sources: [] },
		};
		const result = validateMemoryArtifact(artifact);
		expect(result.valid).toBe(false);
	});

	it("validateMemoryArtifact returns valid for well-formed artifact", () => {
		const now = new Date().toISOString();
		const artifact = {
			meta: {
				id: "a1",
				created: now,
				updated: now,
				tags: ["test"],
				relevance: 0.8,
			},
			content: { summary: "s", details: "d", context: "c", actionable: false },
			links: { relatedSessions: [], relatedMemories: [], sources: [] },
		};
		const result = validateMemoryArtifact(artifact);
		expect(result.valid).toBe(true);
	});

	it("searchArtifactsByContent finds by summary", () => {
		const now = new Date().toISOString();
		const artifact = {
			meta: {
				id: "a1",
				created: now,
				updated: now,
				tags: ["x"],
				relevance: 0.8,
			},
			content: {
				summary: "hello world",
				details: "detail text",
				context: "ctx",
				actionable: false,
			},
			links: { relatedSessions: [], relatedMemories: [], sources: [] },
		};
		const results = searchArtifactsByContent([artifact], { query: "hello" });
		expect(results.length).toBe(1);
		expect(results[0]?.matchedFields).toContain("summary");
	});

	it("searchArtifactsByContent filters by minRelevance", () => {
		const now = new Date().toISOString();
		const artifact = {
			meta: { id: "a1", created: now, updated: now, tags: [], relevance: 0.1 },
			content: {
				summary: "hello",
				details: "d",
				context: "c",
				actionable: false,
			},
			links: { relatedSessions: [], relatedMemories: [], sources: [] },
		};
		const results = searchArtifactsByContent([artifact], {
			query: "hello",
			minRelevance: 0.5,
		});
		expect(results.length).toBe(0);
	});

	it("searchArtifactsByContent filters by tag", () => {
		const now = new Date().toISOString();
		const artifact = {
			meta: {
				id: "a1",
				created: now,
				updated: now,
				tags: ["foo"],
				relevance: 0.8,
			},
			content: {
				summary: "hello",
				details: "d",
				context: "c",
				actionable: false,
			},
			links: { relatedSessions: [], relatedMemories: [], sources: [] },
		};
		const results = searchArtifactsByContent([artifact], {
			query: "hello",
			tags: ["bar"],
		});
		expect(results.length).toBe(0);
	});

	it("searchArtifactsByContent applies limit", () => {
		const now = new Date().toISOString();
		const makeArtifact = (id: string) => ({
			meta: { id, created: now, updated: now, tags: [], relevance: 0.8 },
			content: {
				summary: "hello",
				details: "d",
				context: "c",
				actionable: false,
			},
			links: { relatedSessions: [], relatedMemories: [], sources: [] },
		});
		const results = searchArtifactsByContent(
			[makeArtifact("a1"), makeArtifact("a2"), makeArtifact("a3")],
			{ query: "hello", limit: 2 },
		);
		expect(results.length).toBe(2);
	});

	it("computeSessionStats returns correct counts and completion ratio", () => {
		const now = new Date().toISOString();
		const ctx = buildSessionContext("1", "sess-1", {}, now);
		const withProgress = appendSessionProgress(ctx, {
			completed: ["task-1", "task-2"],
		});
		const stats = computeSessionStats(withProgress);
		expect(stats.totalCompleted).toBe(2);
		expect(stats.completionRatio).toBe(1);
	});

	it("computeSessionStats returns completionRatio 1 when no steps", () => {
		const now = new Date().toISOString();
		const ctx = buildSessionContext("1", "sess-1", {}, now);
		const stats = computeSessionStats(ctx);
		expect(stats.completionRatio).toBe(1);
	});

	it("mergeSessionContexts merges progress lists", () => {
		const now = new Date().toISOString();
		const base = buildSessionContext("1", "sess-1", {}, now);
		const overlay = buildSessionContext("1", "sess-2", {}, now);
		const baseProg = appendSessionProgress(base, { completed: ["task-1"] });
		const overlayProg = appendSessionProgress(overlay, {
			completed: ["task-2"],
		});
		const merged = mergeSessionContexts(baseProg, overlayProg, now);
		expect(merged.progress.completed).toContain("task-1");
		expect(merged.progress.completed).toContain("task-2");
	});

	it("deduplicateSessionProgress removes duplicates", () => {
		const now = new Date().toISOString();
		const ctx = buildSessionContext("1", "sess-1", {}, now);
		const withDups = appendSessionProgress(
			appendSessionProgress(ctx, { completed: ["task-1"] }),
			{ completed: ["task-1"] },
		);
		const deduped = deduplicateSessionProgress(withDups);
		expect(
			deduped.progress.completed.filter((x) => x === "task-1").length,
		).toBe(1);
	});

	it("markInProgressAsBlocked moves in-progress to blocked", () => {
		const now = new Date().toISOString();
		const ctx = buildSessionContext("1", "sess-1", {}, now);
		const withInProg = appendSessionProgress(ctx, { inProgress: ["task-a"] });
		const blocked = markInProgressAsBlocked(withInProg, now);
		expect(blocked.progress.inProgress).toHaveLength(0);
		expect(blocked.progress.blocked).toContain("task-a");
	});

	it("scoreArtifactRelevance returns value between 0 and 1", () => {
		const now = new Date().toISOString();
		const artifact = {
			meta: {
				id: "a1",
				created: now,
				updated: now,
				tags: ["important"],
				relevance: 0.8,
			},
			content: { summary: "s", details: "d", context: "c", actionable: false },
			links: { relatedSessions: [], relatedMemories: [], sources: [] },
		};
		const score = scoreArtifactRelevance(artifact, ["important"]);
		expect(score).toBeGreaterThanOrEqual(0);
		expect(score).toBeLessThanOrEqual(1);
	});

	it("scoreArtifactRelevance applies decay for old artifacts", () => {
		const oldDate = new Date(
			Date.now() - 100 * 24 * 60 * 60 * 1000,
		).toISOString();
		const artifact = {
			meta: {
				id: "a1",
				created: oldDate,
				updated: oldDate,
				tags: [],
				relevance: 0.9,
			},
			content: { summary: "s", details: "d", context: "c", actionable: false },
			links: { relatedSessions: [], relatedMemories: [], sources: [] },
		};
		const score = scoreArtifactRelevance(artifact, [], 7 * 24 * 60 * 60 * 1000);
		expect(score).toBeLessThan(0.9);
	});

	it("computeArtifactContentHash returns hex string", () => {
		const now = new Date().toISOString();
		const artifact = {
			meta: {
				id: "a1",
				created: now,
				updated: now,
				tags: ["tag"],
				relevance: 0.7,
			},
			content: { summary: "s", details: "d", context: "c", actionable: false },
			links: { relatedSessions: [], relatedMemories: [], sources: [] },
		};
		const hash = computeArtifactContentHash(artifact);
		expect(typeof hash).toBe("string");
		expect(hash.length).toBeGreaterThan(0);
	});

	it("exportSessionToRecord and importSessionFromExport round-trip", () => {
		const now = new Date().toISOString();
		const ctx = buildSessionContext("1", "sess-1", {}, now);
		const exported = exportSessionToRecord(ctx, []);
		const imported = importSessionFromExport(exported);
		expect(imported).not.toBeNull();
		expect(imported?.sessionId).toBe("sess-1");
	});

	it("importSessionFromExport returns null for invalid input", () => {
		expect(importSessionFromExport(null)).toBeNull();
		expect(
			importSessionFromExport({ version: "2", sessionId: "x" }),
		).toBeNull();
		expect(importSessionFromExport("string")).toBeNull();
	});

	it("enrichArtifactLinks deduplicates links", () => {
		const now = new Date().toISOString();
		const artifact = {
			meta: { id: "a1", created: now, updated: now, tags: [], relevance: 0.5 },
			content: { summary: "s", details: "d", context: "c", actionable: false },
			links: { relatedSessions: ["sess-1"], relatedMemories: [], sources: [] },
		};
		const enriched = enrichArtifactLinks(
			artifact,
			["sess-1", "sess-2"],
			[],
			[],
		);
		expect(enriched.links.relatedSessions).toEqual(["sess-1", "sess-2"]);
	});

	it("batchBuildSessionContexts builds multiple contexts", () => {
		const now = new Date().toISOString();
		const contexts = batchBuildSessionContexts(
			"1",
			[
				{ sessionId: "s1", context: {} },
				{ sessionId: "s2", context: {} },
			],
			now,
		);
		expect(contexts).toHaveLength(2);
		expect(contexts[0]?.meta.sessionId).toBe("s1");
		expect(contexts[1]?.meta.sessionId).toBe("s2");
	});

	it("replaceSessionProgress overwrites progress lists", () => {
		const now = new Date().toISOString();
		const ctx = buildSessionContext("1", "sess-1", {}, now);
		const withProgress = appendSessionProgress(ctx, { completed: ["task-1"] });
		const replaced = replaceSessionProgress(withProgress, {
			completed: ["task-2"],
			inProgress: [],
			blocked: [],
			next: [],
		});
		expect(replaced.progress?.completed).toEqual(["task-2"]);
		expect(replaced.progress?.completed).not.toContain("task-1");
	});

	it("replaceSessionProgress with null context returns bare progress", () => {
		const replaced = replaceSessionProgress(null, {
			completed: ["task-1"],
			inProgress: [],
			blocked: [],
			next: [],
		});
		expect(replaced.progress?.completed).toEqual(["task-1"]);
	});

	it("diffFingerprints covers removed skills, added/removed instructions, and removed code files", () => {
		const baseline = {
			capturedAt: "baseline",
			skillIds: ["a", "b"],
			instructionNames: ["x"],
			codePaths: ["src/a.ts", "src/b.ts"],
			fileSummaries: [
				{
					path: "src/a.ts",
					contentHash: "h1",
					language: "typescript",
					category: "source",
					exportedSymbols: ["alpha"],
					totalSymbols: 1,
					symbolKinds: { function: 1 },
				},
				{
					path: "src/b.ts",
					contentHash: "h2",
					language: "typescript",
					category: "source",
					exportedSymbols: ["beta"],
					totalSymbols: 1,
					symbolKinds: { function: 1 },
				},
			],
		};
		const current = {
			capturedAt: "current",
			skillIds: ["a"],
			instructionNames: ["x", "y"],
			codePaths: ["src/a.ts"],
			fileSummaries: [
				{
					path: "src/a.ts",
					contentHash: "h1",
					language: "typescript",
					category: "source",
					exportedSymbols: ["alpha"],
					totalSymbols: 1,
					symbolKinds: { function: 1 },
				},
			],
		};
		const drift = diffFingerprints(baseline, current);
		expect(drift.clean).toBe(false);
		// removed skill "b"
		expect(
			drift.entries.some(
				(e) =>
					e.dimension === "skill" && e.change === "removed" && e.id === "b",
			),
		).toBe(true);
		// added instruction "y"
		expect(
			drift.entries.some(
				(e) =>
					e.dimension === "instruction" && e.change === "added" && e.id === "y",
			),
		).toBe(true);
		// removed instruction: none, since "x" stays
		// removed code file "src/b.ts"
		expect(
			drift.entries.some(
				(e) =>
					e.dimension === "codefile" &&
					e.change === "removed" &&
					e.id === "src/b.ts",
			),
		).toBe(true);
	});

	it("diffFingerprints with symbolMap uses symbolMap directly", () => {
		const baseline = {
			capturedAt: "baseline",
			skillIds: [],
			instructionNames: [],
			codePaths: ["src/a.ts"],
			fileSummaries: [],
			symbolMap: { "src/a.ts": ["alpha", "beta"] },
		};
		const current = {
			capturedAt: "current",
			skillIds: [],
			instructionNames: [],
			codePaths: ["src/a.ts"],
			fileSummaries: [],
			symbolMap: { "src/a.ts": ["alpha"] },
		};
		const drift = diffFingerprints(baseline, current);
		// removed symbol "beta"
		expect(
			drift.entries.some(
				(e) => e.dimension === "symbol" && e.change === "removed",
			),
		).toBe(true);
	});

	it("matchesMemoryArtifactFilter returns true when no filter is provided", () => {
		const artifact = {
			meta: {
				id: "a1",
				created: "t",
				updated: "t",
				tags: ["x"],
				relevance: 0.5,
			},
			content: { summary: "s", details: "d", context: "c", actionable: false },
			links: { relatedSessions: [], relatedMemories: [], sources: [] },
		};
		// biome-ignore lint/suspicious/noExplicitAny: testing no-filter path
		expect(matchesMemoryArtifactFilter(artifact as any)).toBe(true);
	});

	it("validateSessionContext returns errors for missing/invalid sub-fields", () => {
		// missing meta
		expect(
			validateSessionContext({ context: {}, progress: {}, memory: {} }).errors,
		).toContain("meta is required and must be an object");
		// meta present but version wrong
		const r2 = validateSessionContext({
			meta: { version: 42, sessionId: "x", created: "t", updated: "t" },
			context: { requestScope: "", constraints: [], phase: "" },
			progress: { completed: [], inProgress: [], blocked: [], next: [] },
			memory: { keyInsights: [], decisions: {}, patterns: [], warnings: [] },
		});
		expect(r2.errors).toContain("meta.version must be a string");
		// meta present but sessionId wrong
		const r3 = validateSessionContext({
			meta: { version: "1", sessionId: 99, created: "t", updated: "t" },
			context: { requestScope: "", constraints: [], phase: "" },
			progress: { completed: [], inProgress: [], blocked: [], next: [] },
			memory: { keyInsights: [], decisions: {}, patterns: [], warnings: [] },
		});
		expect(r3.errors).toContain("meta.sessionId must be a string");
	});

	it("validateSessionContext errors on missing inner context, progress, and memory", () => {
		// missing context.context
		const r1 = validateSessionContext({
			meta: { version: "1", sessionId: "s", created: "t", updated: "t" },
			progress: { completed: [], inProgress: [], blocked: [], next: [] },
			memory: { keyInsights: [], decisions: {}, patterns: [], warnings: [] },
		});
		expect(r1.errors).toContain(
			"context.context is required and must be an object",
		);
		// missing progress
		const r2 = validateSessionContext({
			meta: { version: "1", sessionId: "s", created: "t", updated: "t" },
			context: { requestScope: "", constraints: [], phase: "" },
			memory: { keyInsights: [], decisions: {}, patterns: [], warnings: [] },
		});
		expect(r2.errors).toContain("progress is required and must be an object");
		// missing memory
		const r3 = validateSessionContext({
			meta: { version: "1", sessionId: "s", created: "t", updated: "t" },
			context: { requestScope: "", constraints: [], phase: "" },
			progress: { completed: [], inProgress: [], blocked: [], next: [] },
		});
		expect(r3.errors).toContain("memory is required and must be an object");
	});

	it("validateSessionContext errors on invalid context/progress/memory sub-fields", () => {
		// invalid context.requestScope
		const r1 = validateSessionContext({
			meta: { version: "1", sessionId: "s", created: "t", updated: "t" },
			context: { requestScope: 99, constraints: [], phase: "" },
			progress: { completed: [], inProgress: [], blocked: [], next: [] },
			memory: { keyInsights: [], decisions: {}, patterns: [], warnings: [] },
		});
		expect(r1.errors).toContain("context.requestScope must be a string");
		// invalid progress.completed (not array)
		const r2 = validateSessionContext({
			meta: { version: "1", sessionId: "s", created: "t", updated: "t" },
			context: { requestScope: "", constraints: [], phase: "" },
			progress: { completed: "nope", inProgress: [], blocked: [], next: [] },
			memory: { keyInsights: [], decisions: {}, patterns: [], warnings: [] },
		});
		expect(r2.errors).toContain("progress.completed must be an array");
		// invalid memory.keyInsights
		const r3 = validateSessionContext({
			meta: { version: "1", sessionId: "s", created: "t", updated: "t" },
			context: { requestScope: "", constraints: [], phase: "" },
			progress: { completed: [], inProgress: [], blocked: [], next: [] },
			memory: {
				keyInsights: "nope",
				decisions: {},
				patterns: [],
				warnings: [],
			},
		});
		expect(r3.errors).toContain("memory.keyInsights must be an array");
	});

	it("validateMemoryArtifact errors on missing/invalid meta and content fields", () => {
		// missing meta
		const r1 = validateMemoryArtifact({ content: {}, links: {} });
		expect(r1.errors).toContain("meta is required and must be an object");
		// meta present but id wrong
		const r2 = validateMemoryArtifact({
			meta: { id: 1, created: "t", updated: "t", tags: [], relevance: 0.5 },
			content: { summary: "s", details: "d", context: "c", actionable: false },
			links: { relatedSessions: [], relatedMemories: [], sources: [] },
		});
		expect(r2.errors).toContain("meta.id must be a string");
		// missing content
		const r3 = validateMemoryArtifact({
			meta: { id: "a", created: "t", updated: "t", tags: [], relevance: 0.5 },
			links: { relatedSessions: [], relatedMemories: [], sources: [] },
		});
		expect(r3.errors).toContain("content is required and must be an object");
		// missing links
		const r4 = validateMemoryArtifact({
			meta: { id: "a", created: "t", updated: "t", tags: [], relevance: 0.5 },
			content: { summary: "s", details: "d", context: "c", actionable: false },
		});
		expect(r4.errors).toContain("links is required and must be an object");
	});

	it("validateMemoryArtifact errors on invalid content and link sub-fields", () => {
		// invalid content.summary
		const r1 = validateMemoryArtifact({
			meta: { id: "a", created: "t", updated: "t", tags: [], relevance: 0.5 },
			content: { summary: 99, details: "d", context: "c", actionable: false },
			links: { relatedSessions: [], relatedMemories: [], sources: [] },
		});
		expect(r1.errors).toContain("content.summary must be a string");
		// invalid content.actionable
		const r2 = validateMemoryArtifact({
			meta: { id: "a", created: "t", updated: "t", tags: [], relevance: 0.5 },
			content: { summary: "s", details: "d", context: "c", actionable: "yes" },
			links: { relatedSessions: [], relatedMemories: [], sources: [] },
		});
		expect(r2.errors).toContain("content.actionable must be a boolean");
		// invalid links.relatedSessions
		const r3 = validateMemoryArtifact({
			meta: { id: "a", created: "t", updated: "t", tags: [], relevance: 0.5 },
			content: { summary: "s", details: "d", context: "c", actionable: false },
			links: { relatedSessions: "nope", relatedMemories: [], sources: [] },
		});
		expect(r3.errors).toContain("links.relatedSessions must be an array");
	});

	it("searchArtifactsByContent matches on details and context fields", () => {
		const now = new Date().toISOString();
		const artifact = {
			meta: { id: "a1", created: now, updated: now, tags: [], relevance: 0.8 },
			content: {
				summary: "unrelated",
				details: "find-me-details",
				context: "find-me-context",
				actionable: false,
			},
			links: { relatedSessions: [], relatedMemories: [], sources: [] },
		};
		const detailsResults = searchArtifactsByContent([artifact], {
			query: "find-me-details",
		});
		expect(detailsResults.length).toBe(1);
		expect(detailsResults[0]?.matchedFields).toContain("details");

		const contextResults = searchArtifactsByContent([artifact], {
			query: "find-me-context",
		});
		expect(contextResults.length).toBe(1);
		expect(contextResults[0]?.matchedFields).toContain("context");
	});

	it("readProgressHistory returns records for all progress buckets", () => {
		const now = new Date().toISOString();
		const ctx = buildSessionContext("1", "sess-1", {}, now);
		const withAll = appendSessionProgress(ctx, {
			completed: ["done-1"],
			inProgress: ["doing-1"],
			blocked: ["blocked-1"],
			next: ["next-1"],
		});
		const records = readProgressHistory(withAll);
		expect(
			records.some((r) => r.kind === "completed" && r.stepLabel === "done-1"),
		).toBe(true);
		expect(
			records.some(
				(r) => r.kind === "in_progress" && r.stepLabel === "doing-1",
			),
		).toBe(true);
		expect(
			records.some((r) => r.kind === "blocked" && r.stepLabel === "blocked-1"),
		).toBe(true);
		expect(
			records.some((r) => r.kind === "next" && r.stepLabel === "next-1"),
		).toBe(true);
	});

	it("replaceSessionProgress with null context returns bare progress", () => {
		const replaced = replaceSessionProgress(null, {
			completed: ["task-1"],
			inProgress: [],
			blocked: [],
			next: [],
		});
		expect(replaced.progress?.completed).toEqual(["task-1"]);
	});

	it("diffFingerprints covers removed skills, added/removed instructions, and removed code files", () => {
		const baseline = {
			capturedAt: "baseline",
			skillIds: ["a", "b"],
			instructionNames: ["x"],
			codePaths: ["src/a.ts", "src/b.ts"],
			fileSummaries: [
				{
					path: "src/a.ts",
					contentHash: "h1",
					language: "typescript",
					category: "source" as const,
					exportedSymbols: ["alpha"],
					totalSymbols: 1,
					symbolKinds: { function: 1 },
				},
				{
					path: "src/b.ts",
					contentHash: "h2",
					language: "typescript",
					category: "source" as const,
					exportedSymbols: ["beta"],
					totalSymbols: 1,
					symbolKinds: { function: 1 },
				},
			],
		};
		const current = {
			capturedAt: "current",
			skillIds: ["a"],
			instructionNames: ["x", "y"],
			codePaths: ["src/a.ts"],
			fileSummaries: [
				{
					path: "src/a.ts",
					contentHash: "h1",
					language: "typescript",
					category: "source" as const,
					exportedSymbols: ["alpha"],
					totalSymbols: 1,
					symbolKinds: { function: 1 },
				},
			],
		};
		const drift = diffFingerprints(baseline, current);
		expect(drift.clean).toBe(false);
		// removed skill "b"
		expect(
			drift.entries.some(
				(e) =>
					e.dimension === "skill" && e.change === "removed" && e.id === "b",
			),
		).toBe(true);
		// added instruction "y"
		expect(
			drift.entries.some(
				(e) =>
					e.dimension === "instruction" && e.change === "added" && e.id === "y",
			),
		).toBe(true);
		// removed instruction: none, since "x" stays
		// removed code file "src/b.ts"
		expect(
			drift.entries.some(
				(e) =>
					e.dimension === "codefile" &&
					e.change === "removed" &&
					e.id === "src/b.ts",
			),
		).toBe(true);
	});

	it("diffFingerprints with symbolMap uses symbolMap directly", () => {
		const baseline = {
			capturedAt: "baseline",
			skillIds: [] as string[],
			instructionNames: [] as string[],
			codePaths: ["src/a.ts"],
			fileSummaries: [] as [],
			symbolMap: { "src/a.ts": ["alpha", "beta"] },
		};
		const current = {
			capturedAt: "current",
			skillIds: [] as string[],
			instructionNames: [] as string[],
			codePaths: ["src/a.ts"],
			fileSummaries: [] as [],
			symbolMap: { "src/a.ts": ["alpha"] },
		};
		const drift = diffFingerprints(baseline, current);
		// removed symbol "beta"
		expect(
			drift.entries.some(
				(e) => e.dimension === "symbol" && e.change === "removed",
			),
		).toBe(true);
	});

	it("matchesMemoryArtifactFilter returns true when no filter is provided", () => {
		const artifact = {
			meta: {
				id: "a1",
				created: "t",
				updated: "t",
				tags: ["x"],
				relevance: 0.5,
			},
			content: { summary: "s", details: "d", context: "c", actionable: false },
			links: { relatedSessions: [], relatedMemories: [], sources: [] },
		};
		// biome-ignore lint/suspicious/noExplicitAny: testing no-filter path
		expect(matchesMemoryArtifactFilter(artifact as any)).toBe(true);
	});

	it("validateSessionContext returns errors for missing/invalid sub-fields", () => {
		// missing meta
		expect(
			validateSessionContext({ context: {}, progress: {}, memory: {} }).errors,
		).toContain("meta is required and must be an object");
		// meta present but version wrong
		const r2 = validateSessionContext({
			meta: { version: 42, sessionId: "x", created: "t", updated: "t" },
			context: { requestScope: "", constraints: [], phase: "" },
			progress: { completed: [], inProgress: [], blocked: [], next: [] },
			memory: { keyInsights: [], decisions: {}, patterns: [], warnings: [] },
		});
		expect(r2.errors).toContain("meta.version must be a string");
		// meta present but sessionId wrong
		const r3 = validateSessionContext({
			meta: { version: "1", sessionId: 99, created: "t", updated: "t" },
			context: { requestScope: "", constraints: [], phase: "" },
			progress: { completed: [], inProgress: [], blocked: [], next: [] },
			memory: { keyInsights: [], decisions: {}, patterns: [], warnings: [] },
		});
		expect(r3.errors).toContain("meta.sessionId must be a string");
	});

	it("validateSessionContext errors on missing inner context, progress, and memory", () => {
		// missing context.context
		const r1 = validateSessionContext({
			meta: { version: "1", sessionId: "s", created: "t", updated: "t" },
			progress: { completed: [], inProgress: [], blocked: [], next: [] },
			memory: { keyInsights: [], decisions: {}, patterns: [], warnings: [] },
		});
		expect(r1.errors).toContain(
			"context.context is required and must be an object",
		);
		// missing progress
		const r2 = validateSessionContext({
			meta: { version: "1", sessionId: "s", created: "t", updated: "t" },
			context: { requestScope: "", constraints: [], phase: "" },
			memory: { keyInsights: [], decisions: {}, patterns: [], warnings: [] },
		});
		expect(r2.errors).toContain("progress is required and must be an object");
		// missing memory
		const r3 = validateSessionContext({
			meta: { version: "1", sessionId: "s", created: "t", updated: "t" },
			context: { requestScope: "", constraints: [], phase: "" },
			progress: { completed: [], inProgress: [], blocked: [], next: [] },
		});
		expect(r3.errors).toContain("memory is required and must be an object");
	});

	it("validateSessionContext errors on invalid context/progress/memory sub-fields", () => {
		// invalid context.requestScope
		const r1 = validateSessionContext({
			meta: { version: "1", sessionId: "s", created: "t", updated: "t" },
			context: { requestScope: 99, constraints: [], phase: "" },
			progress: { completed: [], inProgress: [], blocked: [], next: [] },
			memory: { keyInsights: [], decisions: {}, patterns: [], warnings: [] },
		});
		expect(r1.errors).toContain("context.requestScope must be a string");
		// invalid progress.completed (not array)
		const r2 = validateSessionContext({
			meta: { version: "1", sessionId: "s", created: "t", updated: "t" },
			context: { requestScope: "", constraints: [], phase: "" },
			progress: { completed: "nope", inProgress: [], blocked: [], next: [] },
			memory: { keyInsights: [], decisions: {}, patterns: [], warnings: [] },
		});
		expect(r2.errors).toContain("progress.completed must be an array");
		// invalid memory.keyInsights
		const r3 = validateSessionContext({
			meta: { version: "1", sessionId: "s", created: "t", updated: "t" },
			context: { requestScope: "", constraints: [], phase: "" },
			progress: { completed: [], inProgress: [], blocked: [], next: [] },
			memory: {
				keyInsights: "nope",
				decisions: {},
				patterns: [],
				warnings: [],
			},
		});
		expect(r3.errors).toContain("memory.keyInsights must be an array");
	});

	it("validateMemoryArtifact errors on missing/invalid meta and content fields", () => {
		// missing meta
		const r1 = validateMemoryArtifact({ content: {}, links: {} });
		expect(r1.errors).toContain("meta is required and must be an object");
		// meta present but id wrong
		const r2 = validateMemoryArtifact({
			meta: { id: 1, created: "t", updated: "t", tags: [], relevance: 0.5 },
			content: { summary: "s", details: "d", context: "c", actionable: false },
			links: { relatedSessions: [], relatedMemories: [], sources: [] },
		});
		expect(r2.errors).toContain("meta.id must be a string");
		// missing content
		const r3 = validateMemoryArtifact({
			meta: { id: "a", created: "t", updated: "t", tags: [], relevance: 0.5 },
			links: { relatedSessions: [], relatedMemories: [], sources: [] },
		});
		expect(r3.errors).toContain("content is required and must be an object");
		// missing links
		const r4 = validateMemoryArtifact({
			meta: { id: "a", created: "t", updated: "t", tags: [], relevance: 0.5 },
			content: { summary: "s", details: "d", context: "c", actionable: false },
		});
		expect(r4.errors).toContain("links is required and must be an object");
	});

	it("validateMemoryArtifact errors on invalid content and link sub-fields", () => {
		// invalid content.summary
		const r1 = validateMemoryArtifact({
			meta: { id: "a", created: "t", updated: "t", tags: [], relevance: 0.5 },
			content: { summary: 99, details: "d", context: "c", actionable: false },
			links: { relatedSessions: [], relatedMemories: [], sources: [] },
		});
		expect(r1.errors).toContain("content.summary must be a string");
		// invalid content.actionable
		const r2 = validateMemoryArtifact({
			meta: { id: "a", created: "t", updated: "t", tags: [], relevance: 0.5 },
			content: { summary: "s", details: "d", context: "c", actionable: "yes" },
			links: { relatedSessions: [], relatedMemories: [], sources: [] },
		});
		expect(r2.errors).toContain("content.actionable must be a boolean");
		// invalid links.relatedSessions
		const r3 = validateMemoryArtifact({
			meta: { id: "a", created: "t", updated: "t", tags: [], relevance: 0.5 },
			content: { summary: "s", details: "d", context: "c", actionable: false },
			links: { relatedSessions: "nope", relatedMemories: [], sources: [] },
		});
		expect(r3.errors).toContain("links.relatedSessions must be an array");
	});

	it("searchArtifactsByContent matches on details and context fields", () => {
		const now = new Date().toISOString();
		const artifact = {
			meta: { id: "a1", created: now, updated: now, tags: [], relevance: 0.8 },
			content: {
				summary: "unrelated",
				details: "find-me-details",
				context: "find-me-context",
				actionable: false,
			},
			links: { relatedSessions: [], relatedMemories: [], sources: [] },
		};
		const detailsResults = searchArtifactsByContent([artifact], {
			query: "find-me-details",
		});
		expect(detailsResults.length).toBe(1);
		expect(detailsResults[0]?.matchedFields).toContain("details");

		const contextResults = searchArtifactsByContent([artifact], {
			query: "find-me-context",
		});
		expect(contextResults.length).toBe(1);
		expect(contextResults[0]?.matchedFields).toContain("context");
	});

	it("readProgressHistory returns records for all progress buckets", () => {
		const now = new Date().toISOString();
		const ctx = buildSessionContext("1", "sess-1", {}, now);
		const withAll = appendSessionProgress(ctx, {
			completed: ["done-1"],
			inProgress: ["doing-1"],
			blocked: ["blocked-1"],
			next: ["next-1"],
		});
		const records = readProgressHistory(withAll);
		expect(
			records.some((r) => r.kind === "completed" && r.stepLabel === "done-1"),
		).toBe(true);
		expect(
			records.some(
				(r) => r.kind === "in_progress" && r.stepLabel === "doing-1",
			),
		).toBe(true);
		expect(
			records.some((r) => r.kind === "blocked" && r.stepLabel === "blocked-1"),
		).toBe(true);
		expect(
			records.some((r) => r.kind === "next" && r.stepLabel === "next-1"),
		).toBe(true);
	});
});
