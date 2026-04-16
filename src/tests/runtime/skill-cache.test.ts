import { describe, expect, it } from "vitest";
import { SkillCacheService } from "../../runtime/skill-cache.js";
import {
	createMockSkillExecutionContext,
	createMockSkillResult,
} from "../skills/test-helpers.js";

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
});
