import { afterEach, beforeEach, describe, expect, it, test, vi } from "vitest";
import { GanttHandler } from "../../../src/tools/mermaid/handlers/gantt.handler.js";
import {
	stubMathRandom,
	withFixedDate,
} from "../helpers/mermaid-test-utils.js";

const handler = new GanttHandler();

beforeEach(() => {
	vi.useFakeTimers();
	// deterministic Math.random by default
	vi.spyOn(Math, "random").mockReturnValue(0);
});

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

describe("GanttHandler combined branches", () => {
	it("parses title and sections and truncates long task names", () => {
		const desc =
			"Project: Apollo. Phase Research: Do extensive investigation that is long and verbose and should be truncated at some point because it is >50 chars. Next task.";
		const out = handler.generate(desc);
		expect(out).toMatch(/title Apollo/);
		expect(out).toMatch(/section Research/);
		// long task should be truncated (either include ellipsis OR the original long phrase should not appear verbatim)
		const longMarker = "Do extensive investigation that is long and verbose";
		expect(/\.\.\./.test(out) || !out.includes(longMarker)).toBe(true);
	});

	it("fallback template uses dynamic dates and includes Research task", () => {
		const out = handler.generate("");
		expect(out).toMatch(/Research :done, research/);
	});

	test("extracts title and multiple sections from description", () => {
		const desc = `Project: Apollo. Phase Research: Collect data and analyze. We will synthesize findings next. Stage Implementation - Build core features. Then implement integration and tests.`;
		const out = handler.generate(desc);
		expect(out).toContain("title Apollo");
		expect(out).toMatch(/section Research/);
		expect(out).toMatch(/section Implementation/);
	});

	test("truncates long task names with ellipsis", () => {
		const long =
			"This is a very long task name that should be truncated at fifty characters for the gantt handler's output";
		const out = handler.generate(long);
		expect(out).toMatch(/\.\.\./);
	});

	test("uses deterministic durations when Math.random stubbed and fixed date", () => {
		withFixedDate("2025-01-01T00:00:00Z", () => {
			// stub Math.random to 0 -> duration = 3 days
			const restore = stubMathRandom(0);
			const outMin = handler.generate("Task A.");
			restore();

			expect(outMin).toContain("2025-01-01");
			expect(outMin).toContain("2025-01-04");

			// stub Math.random to near 1 -> duration = 7 days
			const restore2 = stubMathRandom(0.999);
			const outMax = handler.generate("Task B.");
			restore2();

			expect(outMax).toContain("2025-01-01");
			expect(outMax).toContain("2025-01-08");
		});
	});
});

beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(new Date("2025-01-01T00:00:00Z"));
	vi.spyOn(Math, "random").mockReturnValue(0.5);
});

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

describe("GanttHandler additional branches", () => {
	it("parses 'stage' keyword without colon and attaches subsequent tasks to that section", () => {
		const desc = "Stage Alpha - Initial setup. Next do the first task.";
		const out = handler.generate(desc);
		// section name should include 'Alpha - Initial setup' (trimmed)
		expect(out).toMatch(/section Alpha - Initial setup/);
		// the generated tasks should contain a task line under that section
		expect(out).toMatch(/Next do the first task/);
	});
});
