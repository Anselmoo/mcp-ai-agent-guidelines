import { afterEach, describe, expect, it, vi } from "vitest";
import type {
	DataTransformation,
	ValidationRule,
} from "../../contracts/graph-types.js";
import {
	DataUtilities,
	DataUtilitiesFactory,
} from "../../infrastructure/data-utilities.js";

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

describe("data-utilities advanced", () => {
	it("covers collection helpers and factory creation", () => {
		const merged = DataUtilities.merge(
			{ retries: 1, mode: "safe" },
			{ retries: 2 },
			{ mode: "strict" },
		);
		const picked = DataUtilities.pick(
			{ id: "skill", domain: "debug", ignored: true },
			["id", "domain"] as const,
		);
		const unique = DataUtilities.unique(["a", "b", "a", "c"]);
		const flattened = DataUtilities.flatten([1, [2, 3], 4]);
		const grouped = DataUtilities.groupByMultipleCriteria(
			[
				{ domain: "debug", tier: "core" },
				{ domain: "debug", tier: "core" },
				{ domain: "review", tier: "adv" },
				{ domain: "review" },
			],
			["domain", "tier"],
		);

		expect(merged).toEqual({ retries: 2, mode: "strict" });
		expect(picked).toEqual({ id: "skill", domain: "debug" });
		expect(unique).toEqual(["a", "b", "c"]);
		expect(flattened).toEqual([1, 2, 3, 4]);
		expect(grouped["debug|core"]).toHaveLength(2);
		expect(grouped["review|undefined"]).toHaveLength(1);
		expect(DataUtilitiesFactory.create()).toBe(DataUtilities);
	});

	it("validates data with error, warning, and thrown-rule paths", () => {
		const rules: ValidationRule[] = [
			{
				name: "missing-name",
				validator: () => ({ isValid: false }),
				severity: "warning",
				message: "missing optional name",
			},
			{
				name: "count-range",
				validator: () => ({ isValid: false }),
				severity: "error",
				message: "count must be positive",
			},
			{
				name: "exploding-validator",
				validator: () => {
					throw new Error("validator blew up");
				},
				severity: "error",
				message: "ignored when throw happens",
			},
		];

		expect(DataUtilities.validateData({ name: "", count: -1 }, rules)).toEqual({
			isValid: false,
			errors: ["count must be positive", "Validation error: validator blew up"],
			warnings: ["missing optional name"],
		});
	});

	it("fails fast on required transformations and preserves applied history", () => {
		const transformations: DataTransformation<number, number>[] = [
			{
				name: "double",
				transform: (value) => value * 2,
				optional: false,
			},
			{
				name: "required-failure",
				transform: () => {
					throw new Error("hard stop");
				},
				optional: false,
			},
			{
				name: "never-runs",
				transform: (value) => value + 1,
				optional: false,
			},
		];

		expect(DataUtilities.transformData(2, transformations)).toEqual({
			success: false,
			data: undefined,
			appliedTransformations: ["double"],
			errors: ["required-failure: hard stop"],
		});
	});

	it("debounces and throttles calls with timer control", async () => {
		vi.useFakeTimers();
		const debouncedSpy = vi.fn();
		const throttledSpy = vi.fn();
		const debounced = DataUtilities.debounce(debouncedSpy, 10);
		const throttled = DataUtilities.throttle(throttledSpy, 10);

		debounced("a");
		debounced("b");
		throttled("first");
		throttled("second");

		expect(debouncedSpy).not.toHaveBeenCalled();
		expect(throttledSpy).toHaveBeenCalledTimes(1);
		expect(throttledSpy).toHaveBeenCalledWith("first");

		await vi.advanceTimersByTimeAsync(10);

		expect(debouncedSpy).toHaveBeenCalledTimes(1);
		expect(debouncedSpy).toHaveBeenCalledWith("b");

		throttled("third");
		expect(throttledSpy).toHaveBeenCalledTimes(2);
		expect(throttledSpy).toHaveBeenLastCalledWith("third");
	});

	it("measures execution, batches async work, transforms datasets, and memoizes results", async () => {
		const measured = await DataUtilities.measureExecution(() => "done");
		const processed = await DataUtilities.batchProcess(
			["a", "b", "c", "d", "e"],
			async (item, index) => `${index}:${item}`,
			2,
		);
		const transformed = await DataUtilities.transformDataset(
			[1, 2, 3],
			async (value) => value * 3,
		);
		const expensive = vi.fn((value: number) => value * 10);
		const memoized = DataUtilities.createMemoizedFunction(expensive);

		expect(measured.result).toBe("done");
		expect(measured.executionTimeMs).toBeGreaterThanOrEqual(0);
		expect(processed).toEqual(["0:a", "1:b", "2:c", "3:d", "4:e"]);
		expect(transformed).toEqual([3, 6, 9]);

		expect(memoized(2)).toBe(20);
		expect(memoized(2)).toBe(20);
		expect(memoized(3)).toBe(30);
		expect(expensive).toHaveBeenCalledTimes(2);
	});

	it("merges nested configs, replaces arrays, and supports all filter operators", () => {
		type Config = {
			retries: number;
			labels: string[];
			nested: Record<string, unknown>;
		};
		const baseConfig: Config = {
			retries: 1,
			labels: ["base"],
			nested: { mode: "safe", timeout: 30 },
		};

		const merged = DataUtilities.mergeConfigurations<Config>(baseConfig, {
			labels: ["override"],
			nested: { timeout: 60 },
		});
		const items = [
			{ name: "alpha", count: 1, enabled: true },
			{ name: "beta", count: 2, enabled: false },
			{ name: "alphabet", count: 3, enabled: true },
		];

		expect(merged).toEqual({
			retries: 1,
			labels: ["override"],
			nested: { mode: "safe", timeout: 60 },
		});
		expect(
			DataUtilities.filterByConditions(items, [
				{ field: "name", operator: "eq", value: "beta" },
			]),
		).toEqual([{ name: "beta", count: 2, enabled: false }]);
		expect(
			DataUtilities.filterByConditions(items, [
				{ field: "count", operator: "gt", value: 1 },
			]),
		).toHaveLength(2);
		expect(
			DataUtilities.filterByConditions(items, [
				{ field: "count", operator: "lt", value: 3 },
			]),
		).toHaveLength(2);
		expect(
			DataUtilities.filterByConditions(items, [
				{ field: "count", operator: "gte", value: 2 },
			]),
		).toHaveLength(2);
		expect(
			DataUtilities.filterByConditions(items, [
				{ field: "count", operator: "lte", value: 2 },
			]),
		).toHaveLength(2);
		expect(
			DataUtilities.filterByConditions(items, [
				{ field: "name", operator: "contains", value: "alpha" },
				{ field: "enabled", operator: "eq", value: true },
			]),
		).toEqual([
			{ name: "alpha", count: 1, enabled: true },
			{ name: "alphabet", count: 3, enabled: true },
		]);
	});
});
