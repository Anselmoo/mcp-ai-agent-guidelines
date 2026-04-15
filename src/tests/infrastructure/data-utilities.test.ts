import { describe, expect, it, vi } from "vitest";
import type { DataTransformation } from "../../contracts/graph-types.js";
import { DataUtilities } from "../../infrastructure/data-utilities.js";

describe("data-utilities", () => {
	it("deep clones data and groups records by derived keys", () => {
		const original = { nested: { count: 1 } };
		const cloned = DataUtilities.deepClone(original);
		const grouped = DataUtilities.groupBy(
			[
				{ id: "a", domain: "debug" },
				{ id: "b", domain: "debug" },
				{ id: "c", domain: "review" },
			],
			(item) => item.domain,
		);

		cloned.nested.count = 2;
		expect(original.nested.count).toBe(1);
		expect(grouped.debug).toHaveLength(2);
	});

	it("applies required and optional transformations in order", () => {
		const transformations: DataTransformation<number, number>[] = [
			{
				name: "double",
				transform: (value) => value * 2,
				optional: false,
			},
			{
				name: "optional-failure",
				transform: () => {
					throw new Error("skip me");
				},
				optional: true,
			},
			{
				name: "increment",
				transform: (value) => value + 1,
				optional: false,
			},
		];
		const result = DataUtilities.transformData(2, transformations);
		const fn = vi.fn();
		const debounced = DataUtilities.debounce(fn, 5);

		debounced("a");
		debounced("b");

		expect(result).toMatchObject({
			success: true,
			data: 5,
			appliedTransformations: ["double", "increment"],
		});
		expect(result.errors[0]).toContain("optional-failure");
	});
});
