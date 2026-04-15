/**
 * Tests for toon-memory-helpers enhanced functions.
 */

import { describe, expect, it } from "vitest";
import type {
	ToonMemoryArtifact,
	ToonSessionContext,
} from "../../memory/toon-interface.js";
import {
	type ArtifactSearchOptions,
	batchBuildSessionContexts,
	buildSessionContext,
	computeArtifactContentHash,
	computeSessionStats,
	deduplicateSessionProgress,
	enrichArtifactLinks,
	exportSessionToRecord,
	importSessionFromExport,
	markInProgressAsBlocked,
	mergeSessionContexts,
	scoreArtifactRelevance,
	searchArtifactsByContent,
	validateMemoryArtifact,
	validateSessionContext,
} from "../../memory/toon-memory-helpers.js";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeContext(
	overrides: Partial<ToonSessionContext> = {},
): ToonSessionContext {
	const now = "2025-01-01T00:00:00.000Z";
	return buildSessionContext("1.0.0", "session-1", overrides, now);
}

function makeArtifact(
	id: string,
	summary = "Test summary",
	tags: string[] = [],
	relevance = 0.8,
): ToonMemoryArtifact {
	return {
		meta: {
			id,
			created: "2025-01-01T00:00:00.000Z",
			updated: new Date().toISOString(),
			tags,
			relevance,
		},
		content: {
			summary,
			details: `Details for ${id}`,
			context: `Context for ${id}`,
			actionable: true,
		},
		links: {
			relatedSessions: ["session-1"],
			relatedMemories: [],
			sources: [],
		},
	};
}

// ─── validateSessionContext ───────────────────────────────────────────────────

describe("validateSessionContext", () => {
	it("returns valid for a well-formed context", () => {
		const result = validateSessionContext(makeContext());
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it("returns errors for null input", () => {
		const result = validateSessionContext(null);
		expect(result.valid).toBe(false);
		expect(result.errors).toContain("context must be a non-null object");
	});

	it("detects missing meta.version", () => {
		const ctx = makeContext();
		const bad = { ...ctx, meta: { ...ctx.meta, version: 42 } };
		const result = validateSessionContext(bad);
		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.includes("meta.version"))).toBe(true);
	});

	it("detects non-array progress.completed", () => {
		const ctx = makeContext();
		const bad = {
			...ctx,
			progress: { ...ctx.progress, completed: "not-an-array" },
		};
		const result = validateSessionContext(bad);
		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.includes("progress.completed"))).toBe(
			true,
		);
	});
});

// ─── validateMemoryArtifact ───────────────────────────────────────────────────

describe("validateMemoryArtifact", () => {
	it("returns valid for a well-formed artifact", () => {
		const result = validateMemoryArtifact(makeArtifact("mem-1"));
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it("returns error for non-object", () => {
		const result = validateMemoryArtifact("string");
		expect(result.valid).toBe(false);
	});

	it("detects out-of-range relevance", () => {
		const art = makeArtifact("mem-1");
		const bad = { ...art, meta: { ...art.meta, relevance: 1.5 } };
		const result = validateMemoryArtifact(bad);
		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.includes("relevance"))).toBe(true);
	});

	it("detects non-array tags", () => {
		const art = makeArtifact("mem-1");
		const bad = { ...art, meta: { ...art.meta, tags: "not-an-array" } };
		const result = validateMemoryArtifact(bad);
		expect(result.valid).toBe(false);
	});
});

// ─── searchArtifactsByContent ─────────────────────────────────────────────────

describe("searchArtifactsByContent", () => {
	const artifacts = [
		makeArtifact("a1", "Fix performance issue in auth module", [
			"perf",
			"auth",
		]),
		makeArtifact("a2", "Add retry logic to API calls", ["retry", "api"]),
		makeArtifact("a3", "Performance: optimize database queries", [
			"perf",
			"db",
		]),
	];

	it("finds artifacts matching query in summary", () => {
		const opts: ArtifactSearchOptions = { query: "performance" };
		const results = searchArtifactsByContent(artifacts, opts);
		expect(results.length).toBe(2);
		expect(results.every((r) => r.matchedFields.includes("summary"))).toBe(
			true,
		);
	});

	it("ranks by score descending", () => {
		const opts: ArtifactSearchOptions = { query: "performance" };
		const results = searchArtifactsByContent(artifacts, opts);
		expect(results[0].score).toBeGreaterThanOrEqual(results[1]?.score ?? 0);
	});

	it("filters by tags", () => {
		const opts: ArtifactSearchOptions = { query: "performance", tags: ["db"] };
		const results = searchArtifactsByContent(artifacts, opts);
		expect(results).toHaveLength(1);
		expect(results[0].artifact.meta.id).toBe("a3");
	});

	it("limits results", () => {
		const opts: ArtifactSearchOptions = { query: "a", limit: 1 };
		const results = searchArtifactsByContent(artifacts, opts);
		expect(results).toHaveLength(1);
	});

	it("returns empty when query has no match", () => {
		const opts: ArtifactSearchOptions = { query: "zzznomatch" };
		const results = searchArtifactsByContent(artifacts, opts);
		expect(results).toHaveLength(0);
	});
});

// ─── computeSessionStats ──────────────────────────────────────────────────────

describe("computeSessionStats", () => {
	it("computes correct stats", () => {
		const ctx = makeContext({
			progress: {
				completed: ["step-a", "step-b"],
				inProgress: ["step-c"],
				blocked: [],
				next: ["step-d", "step-e"],
			},
		});
		const stats = computeSessionStats(ctx);
		expect(stats.totalCompleted).toBe(2);
		expect(stats.totalInProgress).toBe(1);
		expect(stats.totalBlocked).toBe(0);
		expect(stats.totalNext).toBe(2);
		expect(stats.totalSteps).toBe(5);
		// completionRatio = 2 / (2 + 1 + 0) = 0.666...
		expect(stats.completionRatio).toBeCloseTo(2 / 3);
	});

	it("returns completionRatio = 1 when all steps done", () => {
		const ctx = makeContext({
			progress: {
				completed: ["step-a"],
				inProgress: [],
				blocked: [],
				next: [],
			},
		});
		const stats = computeSessionStats(ctx);
		expect(stats.completionRatio).toBe(1);
	});

	it("returns completionRatio = 1 when there are no active steps", () => {
		const ctx = makeContext();
		const stats = computeSessionStats(ctx);
		expect(stats.completionRatio).toBe(1);
	});
});

// ─── mergeSessionContexts ─────────────────────────────────────────────────────

describe("mergeSessionContexts", () => {
	it("merges progress lists without duplicates", () => {
		const base = makeContext({
			progress: {
				completed: ["a", "b"],
				inProgress: ["c"],
				blocked: [],
				next: ["d"],
			},
		});
		const overlay = makeContext({
			progress: {
				completed: ["b", "e"],
				inProgress: [],
				blocked: ["f"],
				next: ["d", "g"],
			},
		});

		const merged = mergeSessionContexts(base, overlay, "2025-02-01T00:00:00Z");

		expect(merged.progress.completed).toEqual(
			expect.arrayContaining(["a", "b", "e"]),
		);
		expect(merged.progress.completed).toHaveLength(3); // no duplicates
		expect(merged.progress.blocked).toEqual(expect.arrayContaining(["f"]));
		expect(merged.progress.next).toHaveLength(2); // d + g, no duplicate d
	});

	it("favours overlay requestScope when non-default", () => {
		const base = makeContext({
			context: {
				requestScope: "base-scope",
				constraints: [],
				phase: "bootstrap",
			},
		});
		const overlay = makeContext({
			context: {
				requestScope: "overlay-scope",
				constraints: [],
				phase: "bootstrap",
			},
		});
		const merged = mergeSessionContexts(base, overlay, "now");
		expect(merged.context.requestScope).toBe("overlay-scope");
	});

	it("merges decisions as object spread (overlay wins)", () => {
		const base = makeContext({
			memory: {
				keyInsights: [],
				decisions: { key1: "base-val" },
				patterns: [],
				warnings: [],
			},
		});
		const overlay = makeContext({
			memory: {
				keyInsights: [],
				decisions: { key1: "overlay-val", key2: "new" },
				patterns: [],
				warnings: [],
			},
		});
		const merged = mergeSessionContexts(base, overlay, "now");
		expect(merged.memory.decisions).toEqual({
			key1: "overlay-val",
			key2: "new",
		});
	});
});

// ─── deduplicateSessionProgress ──────────────────────────────────────────────

describe("deduplicateSessionProgress", () => {
	it("removes duplicate entries in all lists", () => {
		const ctx = makeContext({
			progress: {
				completed: ["a", "a", "b"],
				inProgress: ["c", "c"],
				blocked: [],
				next: ["d", "d", "d"],
			},
		});
		const deduped = deduplicateSessionProgress(ctx);
		expect(deduped.progress.completed).toEqual(["a", "b"]);
		expect(deduped.progress.inProgress).toEqual(["c"]);
		expect(deduped.progress.next).toEqual(["d"]);
	});
});

// ─── markInProgressAsBlocked ─────────────────────────────────────────────────

describe("markInProgressAsBlocked", () => {
	it("moves inProgress to blocked", () => {
		const ctx = makeContext({
			progress: {
				completed: ["step-a"],
				inProgress: ["step-b", "step-c"],
				blocked: ["step-d"],
				next: [],
			},
		});
		const updated = markInProgressAsBlocked(ctx, "2025-02-01T00:00:00Z");
		expect(updated.progress.inProgress).toHaveLength(0);
		expect(updated.progress.blocked).toEqual(
			expect.arrayContaining(["step-b", "step-c", "step-d"]),
		);
	});
});

// ─── scoreArtifactRelevance ───────────────────────────────────────────────────

describe("scoreArtifactRelevance", () => {
	it("gives higher score for matching preferred tags", () => {
		const artifact = makeArtifact("m1", "test", ["perf"], 0.5);
		const withTag = scoreArtifactRelevance(artifact, ["perf"]);
		const withoutTag = scoreArtifactRelevance(artifact, []);
		expect(withTag).toBeGreaterThan(withoutTag);
	});

	it("clamps to [0, 1]", () => {
		const artifact = makeArtifact("m1", "test", ["a", "b", "c", "d", "e"], 1.0);
		const score = scoreArtifactRelevance(artifact, ["a", "b", "c", "d", "e"]);
		expect(score).toBeLessThanOrEqual(1.0);
		expect(score).toBeGreaterThanOrEqual(0);
	});

	it("returns lower score for very old artifact", () => {
		const old = {
			...makeArtifact("m-old"),
			meta: {
				...makeArtifact("m-old").meta,
				updated: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
			},
		};
		const fresh = makeArtifact("m-fresh");
		const oldScore = scoreArtifactRelevance(old);
		const freshScore = scoreArtifactRelevance(fresh);
		expect(freshScore).toBeGreaterThan(oldScore);
	});
});

// ─── computeArtifactContentHash ──────────────────────────────────────────────

describe("computeArtifactContentHash", () => {
	it("produces the same hash for identical content", () => {
		const a1 = makeArtifact("id-a", "Same summary", ["t1"]);
		// Give a2 the same content fields as a1 (different meta.id only)
		const a2: ToonMemoryArtifact = {
			...a1,
			meta: { ...a1.meta, id: "id-b" },
		};
		expect(computeArtifactContentHash(a1)).toBe(computeArtifactContentHash(a2));
	});

	it("produces different hashes for different content", () => {
		const a1 = makeArtifact("id-a", "Summary A", ["t1"]);
		const a2 = makeArtifact("id-b", "Summary B", ["t1"]);
		expect(computeArtifactContentHash(a1)).not.toBe(
			computeArtifactContentHash(a2),
		);
	});
});

// ─── enrichArtifactLinks ──────────────────────────────────────────────────────

describe("enrichArtifactLinks", () => {
	it("adds new session and memory IDs without duplicates", () => {
		const artifact = makeArtifact("mem-1");
		const enriched = enrichArtifactLinks(
			artifact,
			["session-1", "session-2"],
			["mem-2"],
			["https://source.example.com"],
		);
		expect(enriched.links.relatedSessions).toEqual(
			expect.arrayContaining(["session-1", "session-2"]),
		);
		// session-1 was already in the fixture, should not be duplicated
		const session1Count = enriched.links.relatedSessions.filter(
			(s) => s === "session-1",
		).length;
		expect(session1Count).toBe(1);
	});
});

// ─── Export / Import ──────────────────────────────────────────────────────────

describe("exportSessionToRecord / importSessionFromExport", () => {
	it("round-trips successfully", () => {
		const ctx = makeContext();
		const artifacts = [makeArtifact("mem-1"), makeArtifact("mem-2")];
		const record = exportSessionToRecord(ctx, artifacts);

		expect(record.version).toBe("1");
		expect(record.sessionId).toBe("session-1");
		expect(record.artifacts).toHaveLength(2);

		const imported = importSessionFromExport(record);
		expect(imported).not.toBeNull();
		expect(imported?.sessionId).toBe("session-1");
		expect(imported?.artifacts).toHaveLength(2);
	});

	it("returns null for malformed records", () => {
		expect(importSessionFromExport(null)).toBeNull();
		expect(importSessionFromExport({ version: "2" })).toBeNull();
		expect(importSessionFromExport("not an object")).toBeNull();
	});
});

// ─── batchBuildSessionContexts ────────────────────────────────────────────────

describe("batchBuildSessionContexts", () => {
	it("builds the correct number of contexts", () => {
		const entries = [
			{ sessionId: "s1", context: {} },
			{
				sessionId: "s2",
				context: {
					context: {
						requestScope: "scoped",
						constraints: [],
						phase: "bootstrap" as const,
					},
				},
			},
		];
		const contexts = batchBuildSessionContexts(
			"1.0.0",
			entries,
			"2025-01-01T00:00:00Z",
		);
		expect(contexts).toHaveLength(2);
		expect(contexts[0]?.meta.sessionId).toBe("s1");
		expect(contexts[1]?.meta.sessionId).toBe("s2");
		expect(contexts[1]?.context.requestScope).toBe("scoped");
	});
});
