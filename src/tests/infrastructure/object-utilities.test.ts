import { describe, expect, it } from "vitest";
import {
	queryFirst,
	queryPath,
	stableSerialize,
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
});
