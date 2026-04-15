/**
 * Tests for the infrastructure and tools support modules.
 *
 * Covers:
 *   - src/tools/shared/annotation-presets.ts
 *   - src/tools/shared/error-handler.ts
 *   - src/tools/shared/tool-surface-manifest.ts
 *   - src/tools/skill-handler.ts
 *   - src/infrastructure/graph-analysis.ts
 *   - src/infrastructure/retry-utilities.ts
 *   - src/infrastructure/object-utilities.ts
 *   - src/validation/schema-utilities.ts
 */

import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

// ---------------------------------------------------------------------------
// annotation-presets
// ---------------------------------------------------------------------------
import {
	ANNOTATION_ADVANCED,
	ANNOTATION_CORE,
	ANNOTATION_GOVERNANCE,
	ANNOTATION_PHYSICS,
	annotationsForTool,
} from "../tools/shared/annotation-presets.js";

describe("annotation-presets", () => {
	it("returns ANNOTATION_PHYSICS for qm- prefix", () => {
		expect(annotationsForTool("qm-entanglement-mapper")).toEqual(
			ANNOTATION_PHYSICS,
		);
	});

	it("returns ANNOTATION_PHYSICS for gr- prefix", () => {
		expect(annotationsForTool("gr-geodesic-refactor")).toEqual(
			ANNOTATION_PHYSICS,
		);
	});

	it("returns ANNOTATION_GOVERNANCE for gov- prefix", () => {
		expect(annotationsForTool("gov-data-guardrails")).toEqual(
			ANNOTATION_GOVERNANCE,
		);
	});

	it("returns ANNOTATION_ADVANCED for adv- prefix", () => {
		expect(annotationsForTool("adv-aco-router")).toEqual(ANNOTATION_ADVANCED);
	});

	it("falls back to ANNOTATION_CORE for unknown prefix", () => {
		expect(annotationsForTool("req-analysis")).toEqual(ANNOTATION_CORE);
		expect(annotationsForTool("eval-design")).toEqual(ANNOTATION_CORE);
	});

	it("all annotation presets have readOnlyHint=true and destructiveHint=false", () => {
		for (const preset of [
			ANNOTATION_CORE,
			ANNOTATION_PHYSICS,
			ANNOTATION_GOVERNANCE,
			ANNOTATION_ADVANCED,
		]) {
			expect(preset.readOnlyHint).toBe(true);
			expect(preset.destructiveHint).toBe(false);
		}
	});
});

// ---------------------------------------------------------------------------
// error-handler
// ---------------------------------------------------------------------------
import {
	buildMcpErrorContent,
	classifyError,
	formatMcpError,
	mcpErr,
	mcpOk,
	tryCatchMcp,
} from "../tools/shared/error-handler.js";

describe("error-handler", () => {
	describe("classifyError", () => {
		it("classifies a plain Error as execution category", () => {
			const payload = classifyError(new Error("boom"));
			expect(payload.category).toBe("execution");
			expect(payload.message).toBe("boom");
			expect(payload.recoverable).toBe(false);
		});

		it("classifies a ZodError as validation category with readable message", () => {
			const schema = z.object({ name: z.string() });
			const result = schema.safeParse({ name: 42 });
			if (result.success) throw new Error("expected failure");
			const payload = classifyError(result.error);
			expect(payload.category).toBe("validation");
			expect(payload.message).toMatch(/name/i);
			expect(payload.recoverable).toBe(true);
		});

		it("classifies an AbortError as timeout", () => {
			const abortError = new Error("aborted");
			abortError.name = "AbortError";
			const payload = classifyError(abortError);
			expect(payload.category).toBe("timeout");
		});

		it("classifies unknown values as internal", () => {
			const payload = classifyError("something weird");
			expect(payload.category).toBe("internal");
		});
	});

	describe("formatMcpError", () => {
		it("produces a human-readable string for all categories", () => {
			const categories = [
				"validation",
				"execution",
				"timeout",
				"model",
				"network",
				"authorization",
				"rate_limit",
				"not_found",
				"internal",
			] as const;

			for (const category of categories) {
				const text = formatMcpError({
					category,
					code: "TEST",
					message: "test message",
					recoverable: false,
				});
				expect(typeof text).toBe("string");
				expect(text.length).toBeGreaterThan(0);
				expect(text).toContain("TEST");
			}
		});

		it("includes suggestion when provided", () => {
			const text = formatMcpError({
				category: "validation",
				code: "V1",
				message: "bad input",
				recoverable: true,
				suggestedAction: "Fix the field",
			});
			expect(text).toContain("Fix the field");
		});
	});

	describe("buildMcpErrorContent", () => {
		it("returns isError=true and text content", () => {
			const content = buildMcpErrorContent({
				category: "internal",
				code: "ERR",
				message: "internal error",
				recoverable: false,
			});
			expect(content.isError).toBe(true);
			expect(content.content[0].type).toBe("text");
			expect(content.content[0].text).toContain("internal error");
		});
	});

	describe("mcpOk / mcpErr", () => {
		it("mcpOk wraps a value successfully", () => {
			const result = mcpOk(42);
			expect(result.isOk()).toBe(true);
			expect(result._unsafeUnwrap()).toBe(42);
		});

		it("mcpErr wraps an error payload", () => {
			const result = mcpErr({
				category: "not_found",
				code: "NF",
				message: "not found",
				recoverable: false,
			});
			expect(result.isErr()).toBe(true);
			expect(result._unsafeUnwrapErr().category).toBe("not_found");
		});
	});

	describe("tryCatchMcp", () => {
		it("returns Ok when fn resolves", async () => {
			const result = await tryCatchMcp(async () => "hello");
			expect(result.isOk()).toBe(true);
			expect(result._unsafeUnwrap()).toBe("hello");
		});

		it("returns Err when fn throws", async () => {
			const result = await tryCatchMcp(async () => {
				throw new Error("kaboom");
			});
			expect(result.isErr()).toBe(true);
			expect(result._unsafeUnwrapErr().category).toBe("execution");
		});
	});
});

// ---------------------------------------------------------------------------
// tool-surface-manifest
// ---------------------------------------------------------------------------
import {
	filterHiddenTools,
	getHiddenToolNames,
	isToolHidden,
} from "../tools/shared/tool-surface-manifest.js";

describe("tool-surface-manifest", () => {
	const tools = [
		{ name: "req-analysis" },
		{ name: "physics-analysis" },
		{ name: "govern" },
	];

	it("returns all tools when HIDDEN_TOOLS is not set", () => {
		expect(filterHiddenTools(tools, undefined)).toHaveLength(3);
	});

	it("returns all tools when env is empty string", () => {
		expect(filterHiddenTools(tools, "")).toHaveLength(3);
	});

	it("hides matched tools (case-insensitive)", () => {
		const result = filterHiddenTools(tools, "PHYSICS-ANALYSIS, GOVERN");
		expect(result).toHaveLength(1);
		expect(result[0].name).toBe("req-analysis");
	});

	it("isToolHidden returns true for hidden tool", () => {
		expect(isToolHidden("physics-analysis", "physics-analysis,govern")).toBe(
			true,
		);
	});

	it("isToolHidden returns false for visible tool", () => {
		expect(isToolHidden("req-analysis", "physics-analysis")).toBe(false);
	});

	it("getHiddenToolNames returns normalised set", () => {
		const names = getHiddenToolNames("Physics-Analysis, Govern");
		expect(names.has("physics-analysis")).toBe(true);
		expect(names.has("govern")).toBe(true);
	});
});

import type { SkillTier } from "../tools/skill-handler.js";
// ---------------------------------------------------------------------------
// skill-handler
// ---------------------------------------------------------------------------
import { SkillHandler, tierForSkill } from "../tools/skill-handler.js";

describe("skill-handler", () => {
	describe("tierForSkill", () => {
		const cases: [string, SkillTier][] = [
			["qm-entanglement-mapper", "physics"],
			["gr-geodesic-refactor", "physics"],
			["gov-data-guardrails", "governance"],
			["adv-aco-router", "advanced"],
			["req-analysis", "core"],
			["eval-design", "core"],
			["synth-research", "core"],
		];

		for (const [skillName, expected] of cases) {
			it(`"${skillName}" → "${expected}"`, () => {
				expect(tierForSkill(skillName)).toBe(expected);
			});
		}
	});

	describe("SkillHandler dispatch", () => {
		it("dispatches to registered handler and returns correct tier", async () => {
			const handler = new SkillHandler();
			const fn = vi.fn().mockResolvedValue({
				skillId: "req-analysis",
				displayName: "Req Analysis",
				model: { id: "gpt-5.1-mini" } as never,
				summary: "done",
				recommendations: [],
				relatedSkills: [],
			});
			handler.register("core", fn);

			const result = await handler.dispatch({ id: "req-analysis" } as never, {
				request: "hello",
			});

			expect(result.tier).toBe("core");
			expect(result.skillId).toBe("req-analysis");
			expect(fn).toHaveBeenCalledOnce();
		});

		it("throws when no handler registered for tier", async () => {
			const handler = new SkillHandler();
			await expect(
				handler.dispatch({ id: "qm-test" } as never, { request: "x" }),
			).rejects.toThrow(/No handler registered/);
		});

		it("registeredTiers returns the correct set", () => {
			const handler = new SkillHandler();
			handler.register("core", vi.fn() as never);
			handler.register("governance", vi.fn() as never);
			expect(handler.registeredTiers().sort()).toEqual(
				["core", "governance"].sort(),
			);
		});
	});
});

// ---------------------------------------------------------------------------
// graph-analysis
// ---------------------------------------------------------------------------
import {
	analyzeGraph,
	bfsTraversal,
	buildDirectedGraph,
	dfsTraversal,
	wouldCreateCycle,
} from "../infrastructure/graph-analysis.js";

describe("graph-analysis", () => {
	it("buildDirectedGraph creates a graph with expected nodes and edges", () => {
		const g = buildDirectedGraph(
			["a", "b", "c"],
			[
				{ from: "a", to: "b" },
				{ from: "b", to: "c" },
			],
		);
		expect(g.order).toBe(3); // 3 nodes
		expect(g.size).toBe(2); // 2 edges
	});

	it("analyzeGraph detects acyclic graph correctly", () => {
		const g = buildDirectedGraph(
			["a", "b", "c"],
			[
				{ from: "a", to: "b" },
				{ from: "b", to: "c" },
			],
		);
		const result = analyzeGraph(g);
		expect(result.hasCycles).toBe(false);
		expect(result.topologicalOrder).toEqual(["a", "b", "c"]);
		expect(result.sources).toContain("a");
		expect(result.sinks).toContain("c");
	});

	it("analyzeGraph detects cycles", () => {
		const g = buildDirectedGraph(
			["a", "b"],
			[
				{ from: "a", to: "b" },
				{ from: "b", to: "a" },
			],
		);
		const result = analyzeGraph(g);
		expect(result.hasCycles).toBe(true);
		expect(result.topologicalOrder).toHaveLength(0);
	});

	it("bfsTraversal visits all reachable nodes", () => {
		const g = buildDirectedGraph(
			["a", "b", "c"],
			[
				{ from: "a", to: "b" },
				{ from: "a", to: "c" },
			],
		);
		const visited = bfsTraversal(g, "a");
		const ids = visited.map((n) => n.id);
		expect(ids).toContain("b");
		expect(ids).toContain("c");
	});

	it("dfsTraversal visits all reachable nodes", () => {
		const g = buildDirectedGraph(
			["a", "b", "c"],
			[
				{ from: "a", to: "b" },
				{ from: "b", to: "c" },
			],
		);
		const visited = dfsTraversal(g, "a");
		const ids = visited.map((n) => n.id);
		expect(ids).toContain("b");
		expect(ids).toContain("c");
	});

	it("wouldCreateCycle returns true when adding edge would create cycle", () => {
		const g = buildDirectedGraph(["a", "b"], [{ from: "a", to: "b" }]);
		expect(wouldCreateCycle(g, "b", "a")).toBe(true);
	});

	it("wouldCreateCycle returns false when edge is safe", () => {
		const g = buildDirectedGraph(["a", "b", "c"], [{ from: "a", to: "b" }]);
		expect(wouldCreateCycle(g, "b", "c")).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// retry-utilities
// ---------------------------------------------------------------------------
import { AbortError, withRetries } from "../infrastructure/retry-utilities.js";

describe("retry-utilities", () => {
	it("resolves immediately on first success", async () => {
		const result = await withRetries(async () => "ok", { retries: 3 });
		expect(result).toBe("ok");
	});

	it("retries and eventually resolves", async () => {
		let attempts = 0;
		const result = await withRetries(
			async () => {
				attempts++;
				if (attempts < 3) throw new Error("temporary failure");
				return "success";
			},
			{ retries: 5, minTimeout: 0 },
		);
		expect(result).toBe("success");
		expect(attempts).toBe(3);
	});

	it("throws after exhausting all retries", async () => {
		await expect(
			withRetries(
				async () => {
					throw new Error("always fails");
				},
				{ retries: 2, minTimeout: 0 },
			),
		).rejects.toThrow("always fails");
	});

	it("stops immediately on AbortError", async () => {
		let attempts = 0;
		await expect(
			withRetries(
				async () => {
					attempts++;
					throw new AbortError("stop now");
				},
				{ retries: 10, minTimeout: 0 },
			),
		).rejects.toThrow();
		expect(attempts).toBe(1);
	});
});

// ---------------------------------------------------------------------------
// object-utilities
// ---------------------------------------------------------------------------
import {
	compact,
	contentHash,
	filterMap,
	groupByKey,
	hasPath,
	objectHashKey,
	queryFirst,
	queryPath,
	sortAscBy,
	uniqueBy,
} from "../infrastructure/object-utilities.js";

describe("object-utilities", () => {
	describe("ohash helpers", () => {
		it("contentHash produces deterministic hashes", () => {
			expect(contentHash({ a: 1 })).toBe(contentHash({ a: 1 }));
		});

		it("contentHash differs for different inputs", () => {
			expect(contentHash({ a: 1 })).not.toBe(contentHash({ a: 2 }));
		});

		it("objectHashKey produces a string", () => {
			expect(typeof objectHashKey({ key: "value" })).toBe("string");
		});
	});

	describe("jsonpath-plus helpers", () => {
		const data = {
			skills: [
				{ id: "qm-test", domain: "qm" },
				{ id: "gr-test", domain: "gr" },
			],
		};

		it("queryPath extracts matching values", () => {
			const ids = queryPath(data, "$.skills[*].id");
			expect(ids).toEqual(["qm-test", "gr-test"]);
		});

		it("queryFirst returns first match", () => {
			expect(queryFirst(data, "$.skills[*].id")).toBe("qm-test");
		});

		it("queryFirst returns undefined when nothing matches", () => {
			expect(queryFirst(data, "$.skills[*].missing")).toBeUndefined();
		});

		it("hasPath returns true when path exists", () => {
			expect(hasPath(data, "$.skills")).toBe(true);
		});

		it("hasPath returns false when path does not exist", () => {
			expect(hasPath(data, "$.missing")).toBe(false);
		});
	});

	describe("remeda helpers", () => {
		it("compact removes null and undefined", () => {
			expect(compact([1, null, 2, undefined, 3])).toEqual([1, 2, 3]);
		});

		it("filterMap maps and removes nulls", () => {
			const result = filterMap([1, 2, 3, 4], (n) =>
				n % 2 === 0 ? n * 10 : null,
			);
			expect(result).toEqual([20, 40]);
		});

		it("groupByKey groups correctly", () => {
			const items = [
				{ id: "a", domain: "qm" },
				{ id: "b", domain: "gr" },
				{ id: "c", domain: "qm" },
			];
			const groups = groupByKey(items, (i) => i.domain);
			expect(groups.qm).toHaveLength(2);
			expect(groups.gr).toHaveLength(1);
		});

		it("sortAscBy sorts by string key", () => {
			const items = [{ id: "c" }, { id: "a" }, { id: "b" }];
			expect(sortAscBy(items, (i) => i.id).map((i) => i.id)).toEqual([
				"a",
				"b",
				"c",
			]);
		});

		it("uniqueBy deduplicates by key", () => {
			const items = [{ id: "a" }, { id: "b" }, { id: "a" }];
			expect(uniqueBy(items, (i) => i.id)).toHaveLength(2);
		});
	});
});

// ---------------------------------------------------------------------------
// schema-utilities
// ---------------------------------------------------------------------------
import {
	extractFieldDescriptions,
	parseOrThrow,
	safeParse,
	toJsonSchema,
} from "../validation/schema-utilities.js";

describe("schema-utilities", () => {
	const schema = z.object({
		name: z.string().describe("The full name"),
		age: z.number().int().positive().describe("Age in years"),
	});

	describe("toJsonSchema", () => {
		it("converts a Zod schema to a JSON Schema object without name", () => {
			const json = toJsonSchema(schema);
			expect(json).toHaveProperty("properties");
			expect(
				(json as { properties: Record<string, unknown> }).properties,
			).toHaveProperty("name");
		});

		it("wraps in definitions when a name is provided", () => {
			const json = toJsonSchema(schema, "Person");
			expect(json).toHaveProperty("$ref");
			expect(json).toHaveProperty("definitions");
			const defs = (
				json as {
					definitions: Record<string, { properties: Record<string, unknown> }>;
				}
			).definitions;
			expect(defs.Person).toHaveProperty("properties");
		});
	});

	describe("safeParse", () => {
		it("returns success for valid input", () => {
			const result = safeParse(schema, { name: "Alice", age: 30 });
			expect(result.success).toBe(true);
			if (result.success) expect(result.data.name).toBe("Alice");
		});

		it("returns failure with readable message for invalid input", () => {
			const result = safeParse(schema, { name: "Alice", age: -1 });
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.message).toBeTruthy();
				expect(result.issues.length).toBeGreaterThan(0);
			}
		});
	});

	describe("parseOrThrow", () => {
		it("returns data for valid input", () => {
			const data = parseOrThrow(schema, { name: "Bob", age: 25 });
			expect(data.name).toBe("Bob");
		});

		it("throws a ZodValidationError for invalid input", () => {
			expect(() => parseOrThrow(schema, { name: 42, age: 25 })).toThrow();
		});
	});

	describe("extractFieldDescriptions", () => {
		it("extracts descriptions from a Zod object schema", () => {
			const descriptions = extractFieldDescriptions(schema);
			expect(descriptions).toHaveProperty("name", "The full name");
			expect(descriptions).toHaveProperty("age", "Age in years");
		});
	});
});
