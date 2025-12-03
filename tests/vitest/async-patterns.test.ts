import { beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import {
	type A2AContext,
	createA2AContext,
} from "../../src/tools/shared/a2a-context.js";
import { reducers } from "../../src/tools/shared/async-patterns.js";
import { toolRegistry } from "../../src/tools/shared/tool-registry.js";

describe("Async Patterns", () => {
	let context: A2AContext;
	let toolSuffix: string;

	beforeEach(() => {
		context = createA2AContext();
		toolSuffix = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
	});

	describe("Reducers", () => {
		it("collectSuccessful should filter successful results", () => {
			const results = [
				{ success: true, data: 1 },
				{ success: false, error: "failed" },
				{ success: true, data: 2 },
			];

			const reduced = reducers.collectSuccessful(results);

			expect(reduced).toHaveLength(2);
			expect(reduced).toEqual([1, 2]);
		});

		it("countSuccessful should count successful results", () => {
			const results = [
				{ success: true, data: 1 },
				{ success: false, error: "failed" },
				{ success: true, data: 2 },
			];

			const count = reducers.countSuccessful(results);

			expect(count).toBe(2);
		});

		it("allSucceeded should check if all succeeded", () => {
			const allSuccess = [
				{ success: true, data: 1 },
				{ success: true, data: 2 },
			];

			const someFailure = [
				{ success: true, data: 1 },
				{ success: false, error: "failed" },
			];

			expect(reducers.allSucceeded(allSuccess)).toBe(true);
			expect(reducers.allSucceeded(someFailure)).toBe(false);
		});

		it("anySucceeded should check if any succeeded", () => {
			const someSuccess = [
				{ success: true, data: 1 },
				{ success: false, error: "failed" },
			];

			const allFailure = [
				{ success: false, error: "failed1" },
				{ success: false, error: "failed2" },
			];

			expect(reducers.anySucceeded(someSuccess)).toBe(true);
			expect(reducers.anySucceeded(allFailure)).toBe(false);
		});

		it("mergeResults should merge all result data", () => {
			const results = [
				{ success: true, data: { a: 1 } },
				{ success: true, data: { b: 2 } },
				{ success: true, data: { c: 3 } },
			];

			const merged = reducers.mergeResults(results);

			expect(merged).toEqual({ a: 1, b: 2, c: 3 });
		});
	});

	describe("Module exports", () => {
		it("should export mapReduceTools", async () => {
			const { mapReduceTools } = await import(
				"../../src/tools/shared/async-patterns.js"
			);
			expect(typeof mapReduceTools).toBe("function");
		});

		it("should export pipelineTools", async () => {
			const { pipelineTools } = await import(
				"../../src/tools/shared/async-patterns.js"
			);
			expect(typeof pipelineTools).toBe("function");
		});

		it("should export scatterGatherTools", async () => {
			const { scatterGatherTools } = await import(
				"../../src/tools/shared/async-patterns.js"
			);
			expect(typeof scatterGatherTools).toBe("function");
		});

		it("should export waterfallTools", async () => {
			const { waterfallTools } = await import(
				"../../src/tools/shared/async-patterns.js"
			);
			expect(typeof waterfallTools).toBe("function");
		});

		it("should export raceTools", async () => {
			const { raceTools } = await import(
				"../../src/tools/shared/async-patterns.js"
			);
			expect(typeof raceTools).toBe("function");
		});

		it("should export retryTool", async () => {
			const { retryTool } = await import(
				"../../src/tools/shared/async-patterns.js"
			);
			expect(typeof retryTool).toBe("function");
		});

		it("should export fallbackTool", async () => {
			const { fallbackTool } = await import(
				"../../src/tools/shared/async-patterns.js"
			);
			expect(typeof fallbackTool).toBe("function");
		});

		it("should export branchOnCondition", async () => {
			const { branchOnCondition } = await import(
				"../../src/tools/shared/async-patterns.js"
			);
			expect(typeof branchOnCondition).toBe("function");
		});

		it("should export fanOut", async () => {
			const { fanOut } = await import(
				"../../src/tools/shared/async-patterns.js"
			);
			expect(typeof fanOut).toBe("function");
		});
	});
});
