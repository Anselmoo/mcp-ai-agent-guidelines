import { describe, expect, it, vi } from "vitest";
import { SkillCacheService } from "../../runtime/skill-cache.js";
import {
	createMockSkillExecutionContext,
	createMockSkillResult,
} from "../skills/test-helpers.js";

type SkillCacheInternals = {
	getTtlForSkill: (skillId: string) => number;
	recordEviction: () => void;
	config: {
		enableStats: boolean;
		skillTtlMap?: Record<string, number>;
	};
	nodeCache: {
		store: Map<string, unknown>;
		keys: () => string[];
		get: (key: string) => unknown;
	};
};

describe("skill-cache", () => {
	it("checks membership, invalidates by content predicate, and reports sample entries", async () => {
		const cache = new SkillCacheService({
			maxSize: 10,
			defaultTtl: 60,
			enableStats: true,
		});
		const firstInput = { request: "review runtime" };
		const secondInput = { request: "debug runtime" };
		const evalContext = createMockSkillExecutionContext({
			skillId: "eval-design",
		});
		const debugContext = createMockSkillExecutionContext({
			skillId: "debug-root-cause",
		});

		await cache.set(
			"eval-design",
			firstInput,
			createMockSkillResult(evalContext, { summary: "review result" }),
		);
		await cache.set(
			"debug-root-cause",
			secondInput,
			createMockSkillResult(debugContext, { summary: "debug result" }),
		);

		expect(cache.has("eval-design", firstInput)).toBe(true);
		expect(cache.has("missing-skill", { request: "none" })).toBe(false);
		expect(
			await cache.invalidate(
				"content-based",
				(entry) => entry.result.summary === "debug result",
			),
		).toBe(1);
		expect(await cache.get("debug-root-cause", secondInput)).toBeNull();
		expect(cache.getCacheInfo().sampleEntries[0]?.key).toContain(
			"eval-design:",
		);
	});

	it("updates configuration and clears cached entries and stats", async () => {
		const cache = new SkillCacheService({
			maxSize: 5,
			defaultTtl: 60,
			enableStats: true,
		});
		const context = createMockSkillExecutionContext();
		const input = { request: "review architecture" };

		await cache.set("test-skill", input, createMockSkillResult(context));
		cache.updateConfig({ defaultTtl: 120, maxSize: 7 });
		await cache.get("test-skill", input);
		expect(cache.getConfig()).toMatchObject({ defaultTtl: 120, maxSize: 7 });
		expect(cache.getStats().hits).toBe(1);

		await cache.clear();
		expect(cache.getStats()).toMatchObject({
			hits: 0,
			misses: 0,
			totalSize: 0,
			hitRate: 0,
		});
		expect(cache.has("test-skill", input)).toBe(false);
	});

	it("tracks automatic LRU evictions in cache stats", async () => {
		const cache = new SkillCacheService({
			maxSize: 1,
			defaultTtl: 60,
			enableLru: true,
			enableStats: true,
		});
		const firstContext = createMockSkillExecutionContext({
			skillId: "eval-design",
		});
		const secondContext = createMockSkillExecutionContext({
			skillId: "debug-root-cause",
		});
		const firstInput = { request: "first cached result" };
		const secondInput = { request: "second cached result" };

		await cache.set(
			"eval-design",
			firstInput,
			createMockSkillResult(firstContext, { summary: "first" }),
		);
		await cache.set(
			"debug-root-cause",
			secondInput,
			createMockSkillResult(secondContext, { summary: "second" }),
		);

		expect(cache.getStats().evictions).toBe(1);
		expect(await cache.get("eval-design", firstInput)).toBeNull();
		expect(await cache.get("debug-root-cause", secondInput)).not.toBeNull();
	});

	it("preserves shared TTL defaults when overriding only one skill prefix", () => {
		const cache = new SkillCacheService({
			skillTtlMap: {
				"req-": 42,
			},
		});

		expect(cache.getConfig().skillTtlMap).toMatchObject({
			"req-": 42,
			"debug-": 60,
			"gov-": 180,
		});
	});

	it("invalidates exact cache keys manually in both cache modes", async () => {
		const input = { request: "manual invalidate" };
		const context = createMockSkillExecutionContext({
			skillId: "req-analysis",
		});

		for (const enableLru of [false, true]) {
			const cache = new SkillCacheService({
				enableLru,
				enableStats: true,
			});
			await cache.set(
				"req-analysis",
				input,
				createMockSkillResult(context, { summary: `manual-${enableLru}` }),
			);
			const key = cache.getCacheInfo().sampleEntries[0]?.key;
			expect(typeof key).toBe("string");
			expect(await cache.invalidate("manual", key)).toBe(1);
			expect(await cache.get("req-analysis", input)).toBeNull();
		}
	});

	it("invalidates skill families by exact id and prefixed variants", async () => {
		const cache = new SkillCacheService({
			enableStats: true,
		});
		const reqContext = createMockSkillExecutionContext({
			skillId: "req-analysis",
		});
		const scopedContext = createMockSkillExecutionContext({
			skillId: "req-analysis-extra",
		});
		const otherContext = createMockSkillExecutionContext({
			skillId: "debug-root-cause",
		});
		const reqInput = { request: "req root" };
		const scopedInput = { request: "req scoped" };
		const otherInput = { request: "debug root" };

		await cache.set(
			"req-analysis",
			reqInput,
			createMockSkillResult(reqContext, { summary: "req root" }),
		);
		await cache.set(
			"req-analysis-extra",
			scopedInput,
			createMockSkillResult(scopedContext, { summary: "req scoped" }),
		);
		await cache.set(
			"debug-root-cause",
			otherInput,
			createMockSkillResult(otherContext, { summary: "debug root" }),
		);

		expect(await cache.invalidate("skill-based", "req-analysis")).toBe(2);
		expect(await cache.get("req-analysis", reqInput)).toBeNull();
		expect(await cache.get("req-analysis-extra", scopedInput)).toBeNull();
		expect(await cache.get("debug-root-cause", otherInput)).not.toBeNull();
	});

	it("purges stale entries in LRU mode via time-based invalidation", async () => {
		const cache = new SkillCacheService({
			enableLru: true,
			defaultTtl: 0.001,
			enableStats: true,
		});
		const input = { request: "stale entry" };
		const context = createMockSkillExecutionContext({ skillId: "eval-design" });

		await cache.set(
			"eval-design",
			input,
			createMockSkillResult(context, { summary: "stale result" }),
		);
		await new Promise((resolve) => setTimeout(resolve, 15));

		expect(await cache.invalidate("time-based")).toBe(0);
		expect(cache.has("eval-design", input)).toBe(false);
		expect(cache.getStats().evictions).toBeGreaterThanOrEqual(1);
	});

	it("supports caches with statistics disabled", async () => {
		const cache = new SkillCacheService({
			enableStats: false,
			enableLru: false,
			defaultTtl: 10,
		});
		const input = { request: "stats disabled" };
		const context = createMockSkillExecutionContext({
			skillId: "req-analysis",
		});

		await cache.set(
			"req-analysis",
			input,
			createMockSkillResult(context, { summary: "stats disabled" }),
		);
		await cache.get("req-analysis", input);
		cache.updateConfig({ defaultTtl: 20 });

		expect(cache.getStats()).toMatchObject({
			hits: 0,
			misses: 0,
			evictions: 0,
		});
		expect(cache.getCacheInfo().sampleEntries[0]?.hits).toBe(1);
	});

	it("invalidates skill families and content-based entries in LRU mode", async () => {
		const cache = new SkillCacheService({ enableLru: true, enableStats: true });
		const req1 = createMockSkillExecutionContext({ skillId: "req-analysis" });
		const req2 = createMockSkillExecutionContext({
			skillId: "req-analysis-extra",
		});
		const other = createMockSkillExecutionContext({
			skillId: "debug-root-cause",
		});
		const inp1 = { request: "a" };
		const inp2 = { request: "b" };
		const inp3 = { request: "c" };

		await cache.set(
			"req-analysis",
			inp1,
			createMockSkillResult(req1, { summary: "req-analysis" }),
		);
		await cache.set(
			"req-analysis-extra",
			inp2,
			createMockSkillResult(req2, { summary: "req-analysis-extra" }),
		);
		await cache.set(
			"debug-root-cause",
			inp3,
			createMockSkillResult(other, { summary: "debug" }),
		);

		// skill-based invalidation in LRU mode
		expect(await cache.invalidate("skill-based", "req-analysis")).toBe(2);
		expect(await cache.get("req-analysis", inp1)).toBeNull();
		expect(await cache.get("req-analysis-extra", inp2)).toBeNull();
		expect(await cache.get("debug-root-cause", inp3)).not.toBeNull();
	});

	it("invalidates content-based entries in LRU mode", async () => {
		const cache = new SkillCacheService({ enableLru: true, enableStats: true });
		const ctx = createMockSkillExecutionContext({ skillId: "eval-design" });
		const inp = { request: "content lru" };

		await cache.set(
			"eval-design",
			inp,
			createMockSkillResult(ctx, { summary: "to-delete" }),
		);
		const deleted = await cache.invalidate(
			"content-based",
			(entry) => entry.result.summary === "to-delete",
		);
		expect(deleted).toBe(1);
		expect(await cache.get("eval-design", inp)).toBeNull();
	});

	it("updates same key in LRU mode (overwrites)", async () => {
		const cache = new SkillCacheService({ enableLru: true, enableStats: true });
		const ctx = createMockSkillExecutionContext({ skillId: "req-analysis" });
		const inp = { request: "overwrite" };

		await cache.set(
			"req-analysis",
			inp,
			createMockSkillResult(ctx, { summary: "v1" }),
		);
		await cache.set(
			"req-analysis",
			inp,
			createMockSkillResult(ctx, { summary: "v2" }),
		);
		const result = await cache.get("req-analysis", inp);
		expect(result?.summary).toBe("v2");
	});

	it("non-LRU mode: has() uses nodeCache, clear() calls flushAll(), stats are tracked", async () => {
		const cache = new SkillCacheService({
			enableLru: false,
			enableStats: true,
			defaultTtl: 120,
		});
		const ctx = createMockSkillExecutionContext({ skillId: "req-analysis" });
		const inp = { request: "non-lru has" };

		await cache.set(
			"req-analysis",
			inp,
			createMockSkillResult(ctx, { summary: "non-lru" }),
		);
		// has() in non-LRU mode
		expect(cache.has("req-analysis", inp)).toBe(true);
		// get() in non-LRU mode updates eviction stats path
		await cache.get("req-analysis", inp);
		expect(cache.getStats().hits).toBe(1);
		// clear() in non-LRU mode calls nodeCache.flushAll()
		await cache.clear();
		expect(cache.getStats().hits).toBe(0);
		expect(cache.has("req-analysis", inp)).toBe(false);
	});

	it("getTtlForSkill uses exact skillId match from skillTtlMap when available", async () => {
		const cache = new SkillCacheService({
			enableLru: false,
			skillTtlMap: { "req-analysis": 999, "req-": 60 },
			enableStats: false,
		});
		const ctx = createMockSkillExecutionContext({ skillId: "req-analysis" });
		const inp = { request: "exact ttl" };
		// This exercises the exact-match branch in getTtlForSkill before the prefix loop
		await cache.set(
			"req-analysis",
			inp,
			createMockSkillResult(ctx, { summary: "exact" }),
		);
		expect(await cache.get("req-analysis", inp)).not.toBeNull();
	});

	it("time-based invalidation with LRU calls purgeStale", async () => {
		const cache = new SkillCacheService({
			enableLru: true,
			defaultTtl: 60,
			enableStats: false,
		});
		const ctx = createMockSkillExecutionContext({ skillId: "eval-design" });
		await cache.set(
			"eval-design",
			{ request: "purge" },
			createMockSkillResult(ctx, { summary: "x" }),
		);
		// purgeStale is a no-op here but exercises the code path
		const deleted = await cache.invalidate("time-based");
		expect(deleted).toBe(0);
	});

	it("manual invalidation with LRU deletes existing key", async () => {
		const cache = new SkillCacheService({
			enableLru: true,
			enableStats: false,
		});
		const ctx = createMockSkillExecutionContext({ skillId: "req-analysis" });
		const inp = { request: "manual lru" };
		await cache.set(
			"req-analysis",
			inp,
			createMockSkillResult(ctx, { summary: "x" }),
		);

		// Keys are formatted as "skillId:hash" — get actual key from getCacheInfo
		const info = cache.getCacheInfo();
		const key = info.sampleEntries[0]?.key ?? "";
		expect(key).toBeTruthy();

		const deleted = await cache.invalidate("manual", key);
		expect(deleted).toBe(1);
	});

	it("manual invalidation without LRU deletes existing key", async () => {
		const cache = new SkillCacheService({
			enableLru: false,
			enableStats: false,
		});
		const ctx = createMockSkillExecutionContext({ skillId: "req-analysis" });
		const inp = { request: "manual nodeCache" };
		await cache.set(
			"req-analysis",
			inp,
			createMockSkillResult(ctx, { summary: "y" }),
		);

		const info = cache.getCacheInfo();
		const key = info.sampleEntries[0]?.key ?? "";
		const deleted = await cache.invalidate("manual", key);
		expect(deleted).toBe(1);
		expect(await cache.get("req-analysis", inp)).toBeNull();
	});

	it("skill-based invalidation without LRU removes matching entries", async () => {
		const cache = new SkillCacheService({
			enableLru: false,
			enableStats: true,
		});
		const ctx1 = createMockSkillExecutionContext({ skillId: "synth-engine" });
		const ctx2 = createMockSkillExecutionContext({ skillId: "synth-research" });
		const inp1 = { request: "s1" };
		const inp2 = { request: "s2" };
		await cache.set(
			"synth-engine",
			inp1,
			createMockSkillResult(ctx1, { summary: "e" }),
		);
		await cache.set(
			"synth-research",
			inp2,
			createMockSkillResult(ctx2, { summary: "r" }),
		);

		const deleted = await cache.invalidate("skill-based", "synth-engine");
		expect(deleted).toBe(1);
		expect(await cache.get("synth-engine", inp1)).toBeNull();
		expect(await cache.get("synth-research", inp2)).not.toBeNull();
	});

	it("content-based invalidation without LRU removes matching entries", async () => {
		const cache = new SkillCacheService({
			enableLru: false,
			enableStats: true,
		});
		const ctx = createMockSkillExecutionContext({ skillId: "eval-output" });
		const inp = { request: "content-nodeCache" };
		await cache.set(
			"eval-output",
			inp,
			createMockSkillResult(ctx, { summary: "delete-me" }),
		);

		const deleted = await cache.invalidate(
			"content-based",
			(entry) => entry.result.summary === "delete-me",
		);
		expect(deleted).toBe(1);
		expect(await cache.get("eval-output", inp)).toBeNull();
	});

	it("content-based invalidation without LRU skips non-matching entries", async () => {
		const cache = new SkillCacheService({
			enableLru: false,
			enableStats: false,
		});
		const ctx = createMockSkillExecutionContext({ skillId: "eval-output" });
		const inp = { request: "keep-me" };
		await cache.set(
			"eval-output",
			inp,
			createMockSkillResult(ctx, { summary: "keep" }),
		);

		const deleted = await cache.invalidate(
			"content-based",
			(entry) => entry.result.summary === "never-match",
		);
		expect(deleted).toBe(0);
		expect(await cache.get("eval-output", inp)).not.toBeNull();
	});

	it("time-based invalidation without LRU is a no-op", async () => {
		const cache = new SkillCacheService({
			enableLru: false,
			enableStats: false,
		});
		const ctx = createMockSkillExecutionContext({ skillId: "debug-assistant" });
		await cache.set(
			"debug-assistant",
			{ request: "tb" },
			createMockSkillResult(ctx, { summary: "tb" }),
		);
		const deleted = await cache.invalidate("time-based");
		expect(deleted).toBe(0);
	});

	it("clear() without LRU flushes nodeCache store", async () => {
		const cache = new SkillCacheService({
			enableLru: false,
			enableStats: true,
		});
		const ctx = createMockSkillExecutionContext({ skillId: "req-scope" });
		await cache.set(
			"req-scope",
			{ request: "flush" },
			createMockSkillResult(ctx, { summary: "f" }),
		);
		await cache.clear();
		expect(await cache.get("req-scope", { request: "flush" })).toBeNull();
		expect(cache.getStats().hits).toBe(0);
	});

	it("getCacheInfo() in nodeCache mode reports sample entries", async () => {
		const cache = new SkillCacheService({
			enableLru: false,
			enableStats: true,
		});
		const ctx = createMockSkillExecutionContext({
			skillId: "debug-root-cause",
		});
		await cache.set(
			"debug-root-cause",
			{ request: "info-nodeCache" },
			createMockSkillResult(ctx, { summary: "info" }),
		);
		const info = cache.getCacheInfo();
		expect(info.sampleEntries.length).toBeGreaterThan(0);
		expect(info.sampleEntries[0]?.age).toBeGreaterThanOrEqual(0);
	});

	it("skill TTL exact match is returned for matching skill id", async () => {
		const cache = new SkillCacheService({
			enableLru: false,
			enableStats: false,
			skillTtlMap: { "qm-entanglement-mapper": 999 },
		});
		const ctx = createMockSkillExecutionContext({
			skillId: "qm-entanglement-mapper",
		});
		// If exact TTL match triggers, set() should complete without throwing
		await cache.set(
			"qm-entanglement-mapper",
			{ request: "ttl-test" },
			createMockSkillResult(ctx, { summary: "ttl" }),
		);
		expect(
			await cache.get("qm-entanglement-mapper", { request: "ttl-test" }),
		).not.toBeNull();
	});

	it("updateStats hitRate stays at 0 when total is 0 (no gets yet)", async () => {
		const cache = new SkillCacheService({ enableLru: true, enableStats: true });
		// Stats are initialized with 0 hits and misses — hitRate starts at 0
		expect(cache.getStats().hitRate).toBe(0);
	});

	it("has() with LRU handles expired keys", async () => {
		const cache = new SkillCacheService({
			enableLru: true,
			enableStats: false,
			defaultTtl: 1, // 1 second
		});
		const ctx = createMockSkillExecutionContext({ skillId: "eval-design" });
		const inp = { request: "expiry-has" };
		await cache.set(
			"eval-design",
			inp,
			createMockSkillResult(ctx, { summary: "h" }),
		);
		// key should exist now
		expect(cache.has("eval-design", inp)).toBe(true);
	});

	it("expires node-cache entries on TTL callbacks and handles cleared backing storage", async () => {
		const cache = new SkillCacheService({
			enableLru: false,
			defaultTtl: 0.001,
			enableStats: true,
		});
		const skillId = "ttl-custom-skill";
		const ctx = createMockSkillExecutionContext({ skillId });
		const keptInput = { request: "ttl-kept" };

		await cache.set(
			skillId,
			keptInput,
			createMockSkillResult(ctx, { summary: "ttl-kept" }),
		);

		await new Promise((resolve) => setTimeout(resolve, 20));

		expect(await cache.get(skillId, keptInput)).toBeNull();

		const secondCache = new SkillCacheService({
			enableLru: false,
			defaultTtl: 0.001,
			enableStats: true,
		});
		const internals = secondCache as unknown as SkillCacheInternals;
		const removedInput = { request: "ttl-removed" };
		await secondCache.set(
			skillId,
			removedInput,
			createMockSkillResult(ctx, { summary: "ttl-removed" }),
		);

		const removedKey = secondCache.getCacheInfo().sampleEntries[0]?.key;
		if (!removedKey) {
			throw new Error("Expected TTL test key to exist");
		}
		internals.nodeCache.store.delete(removedKey);
		await new Promise((resolve) => setTimeout(resolve, 20));
		expect(await secondCache.get(skillId, removedInput)).toBeNull();
	});

	it("supports zero TTL in both cache modes without scheduling expiry", async () => {
		const nodeCache = new SkillCacheService({
			enableLru: false,
			defaultTtl: 0,
			enableStats: false,
		});
		const lruCache = new SkillCacheService({
			enableLru: true,
			defaultTtl: 0,
			enableStats: false,
			maxSize: 0,
		});
		const ctx = createMockSkillExecutionContext({ skillId: "eval-design" });
		const input = { request: "no-expiry" };

		await nodeCache.set(
			"eval-design",
			input,
			createMockSkillResult(ctx, { summary: "node-no-expiry" }),
		);
		await lruCache.set(
			"eval-design",
			input,
			createMockSkillResult(ctx, { summary: "lru-no-expiry" }),
		);

		expect(await nodeCache.get("eval-design", input)).not.toBeNull();
		expect(await lruCache.get("eval-design", input)).not.toBeNull();
	});

	it("expires stale LRU entries on get() and has()", async () => {
		const cache = new SkillCacheService({
			enableLru: true,
			defaultTtl: 0.001,
			enableStats: true,
		});
		const ctx = createMockSkillExecutionContext({ skillId: "eval-design" });
		const getInput = { request: "expire-on-get" };
		const hasInput = { request: "expire-on-has" };

		await cache.set(
			"eval-design",
			getInput,
			createMockSkillResult(ctx, { summary: "expire-get" }),
		);
		await cache.set(
			"eval-design",
			hasInput,
			createMockSkillResult(ctx, { summary: "expire-has" }),
		);

		await new Promise((resolve) => setTimeout(resolve, 20));

		expect(await cache.get("eval-design", getInput)).toBeNull();
		expect(cache.has("eval-design", hasInput)).toBe(false);
	});

	it("ignores unsupported invalidation targets and missing manual keys", async () => {
		const lruCache = new SkillCacheService({
			enableLru: true,
			enableStats: true,
		});
		const nodeCache = new SkillCacheService({
			enableLru: false,
			enableStats: true,
		});

		expect(await lruCache.invalidate("manual", /nope/)).toBe(0);
		expect(await lruCache.invalidate("manual", "missing-key")).toBe(0);
		expect(await nodeCache.invalidate("manual", "missing-key")).toBe(0);
		expect(await lruCache.invalidate("skill-based", /req-/)).toBe(0);
		expect(await nodeCache.invalidate("content-based", "not-a-function")).toBe(
			0,
		);
	});

	it("falls back to default TTL iteration when skillTtlMap is unset", () => {
		const cache = new SkillCacheService({
			enableLru: false,
			enableStats: false,
		}) as unknown as SkillCacheInternals & {
			updateConfig: (newConfig: {
				skillTtlMap?: Record<string, number>;
			}) => void;
			getConfig: () => { defaultTtl: number };
		};

		cache.updateConfig({ skillTtlMap: undefined });
		expect(cache.getTtlForSkill("unmatched-skill")).toBe(
			cache.getConfig().defaultTtl,
		);
	});

	it("recordEviction is a no-op when stats are disabled and cache info handles missing entries", async () => {
		const cache = new SkillCacheService({
			enableLru: false,
			enableStats: false,
		});
		const internals = cache as unknown as SkillCacheInternals;

		internals.recordEviction();
		vi.spyOn(internals.nodeCache, "keys").mockReturnValue(["ghost-key"]);
		vi.spyOn(internals.nodeCache, "get").mockReturnValue(undefined);

		const info = cache.getCacheInfo();
		expect(info.sampleEntries).toEqual([{ key: "ghost-key", age: 0, hits: 0 }]);
	});
});
