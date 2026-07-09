import { describe, expect, it } from "vitest";
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
	stableSerialize,
	toErrorMessage,
	uniqueBy,
} from "../../infrastructure/object-utilities.js";

describe("object-utilities", () => {
	it("serializes objects deterministically regardless of key order", () => {
		expect(stableSerialize({ b: 2, a: 1 })).toBe(
			stableSerialize({ a: 1, b: 2 }),
		);
	});

	it("supports path queries and deduplication by derived key", () => {
		const data = {
			skills: [{ id: "debug-root-cause" }, { id: "review" }],
		};

		expect(queryFirst(data, "$.skills[*].id")).toBe("debug-root-cause");
		expect(
			uniqueBy(
				[
					{ id: "a", score: 1 },
					{ id: "a", score: 2 },
					{ id: "b", score: 3 },
				],
				(item) => item.id,
			),
		).toHaveLength(2);
	});

	it("returns an empty result for invalid boundaries instead of throwing", () => {
		expect(queryPath("not-an-object", "$.skills[*].id")).toEqual([]);
		expect(queryPath({ skills: [] }, "")).toEqual([]);
		expect(queryPath({ skills: [] }, "$.skills[")).toEqual([]);
	});

	it("narrows typed path results with an explicit guard", () => {
		const data = {
			skills: [{ id: "debug-root-cause" }, { id: 42 }, { name: "review" }],
		};

		const ids = queryPath(
			data,
			"$.skills[*].id",
			(value): value is string => typeof value === "string",
		);

		expect(ids).toEqual(["debug-root-cause"]);
		expect(
			queryFirst(
				data,
				"$.skills[*].id",
				(value): value is string => typeof value === "string",
			),
		).toBe("debug-root-cause");
	});

	it("returns an empty result for unbalanced brackets/parens (extra closers)", () => {
		// Closing a bracket/paren before it was opened drives depth negative,
		// which is the early-return branch in isBalancedExpression.
		expect(queryPath({ skills: [] }, "$.skills]")).toEqual([]);
		expect(queryPath({ skills: [] }, "$.skills)")).toEqual([]);
	});

	it("evaluates filter expressions containing balanced parentheses", () => {
		// Exercises the "(" increment branch of isBalancedExpression via a
		// JSONPath filter expression, distinct from the plain "]"/")" cases above.
		const data = { skills: [{ id: "a" }, { id: "b" }] };
		expect(queryPath(data, "$.skills[?(@.id)]")).toEqual([
			{ id: "a" },
			{ id: "b" },
		]);
	});

	it("produces content hashes for arbitrary values", () => {
		expect(contentHash({ a: 1 })).toEqual(contentHash({ a: 1 }));
		expect(contentHash({ a: 1 })).not.toEqual(contentHash({ a: 2 }));
	});

	it("produces object-specific hash keys", () => {
		expect(objectHashKey({ a: 1 })).toEqual(objectHashKey({ a: 1 }));
		expect(objectHashKey({ a: 1 })).not.toEqual(objectHashKey({ b: 1 }));
	});

	it("checks path existence with hasPath", () => {
		const data = { skills: [{ id: "a" }] };
		expect(hasPath(data, "$.skills[*].id")).toBe(true);
		expect(hasPath(data, "$.missing[*].id")).toBe(false);
	});

	it("groups items by a derived key", () => {
		const grouped = groupByKey(
			[
				{ domain: "a", id: 1 },
				{ domain: "b", id: 2 },
				{ domain: "a", id: 3 },
			],
			(item) => item.domain,
		);

		expect(grouped.a).toHaveLength(2);
		expect(grouped.b).toHaveLength(1);
	});

	it("sorts items ascending by a numeric key", () => {
		expect(sortAscBy([{ n: 3 }, { n: 1 }, { n: 2 }], (item) => item.n)).toEqual(
			[{ n: 1 }, { n: 2 }, { n: 3 }],
		);
	});

	it("compacts nullish values out of an array", () => {
		expect(compact([1, null, 2, undefined, 3])).toEqual([1, 2, 3]);
	});

	it("maps and filters out nullish results with filterMap", () => {
		expect(
			filterMap([1, 2, 3, 4], (n) => (n % 2 === 0 ? n * 10 : null)),
		).toEqual([20, 40]);
	});

	it("converts Error instances to their message", () => {
		expect(toErrorMessage(new Error("boom"))).toBe("boom");
	});

	it("converts non-Error thrown values to a string", () => {
		expect(toErrorMessage("plain string")).toBe("plain string");
		expect(toErrorMessage(42)).toBe("42");
	});

	// Note: the `!Array.isArray(results)` defensive branch in queryPath (guarding
	// against a non-array return from jsonpath-plus) is unreachable via the public
	// API: with `wrap: true` (always passed here), jsonpath-plus's own
	// implementation guarantees an array result. Covering it would require
	// mocking jsonpath-plus itself, which is disproportionate for a pure
	// defensive guard, so it is intentionally left uncovered.
});
