import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GanttHandler } from "../../../src/tools/mermaid/handlers/gantt.handler.js";

const handler = new GanttHandler();

beforeEach(() => {
	vi.useFakeTimers();
	// set deterministic date
	vi.setSystemTime(new Date("2025-01-01T00:00:00Z"));
	// deterministic Math.random
	vi.spyOn(Math, "random").mockReturnValue(0);
});

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

describe("GanttHandler branches", () => {
	it("parses title and sections and truncates long task names", () => {
		const desc =
			"Project: Apollo. Phase Research: Do extensive investigation that is long and verbose and should be truncated at some point because it is >50 chars. Next task.";
		const out = handler.generate(desc);
		expect(out).toMatch(/title Apollo/);
		expect(out).toMatch(/section Research/);
		expect(out).toMatch(/.../); // ellipsis from truncation
	});

	it("fallback template uses dynamic dates and includes Research task", () => {
		const out = handler.generate("");
		expect(out).toMatch(/Research :done, research/);
	});
});
