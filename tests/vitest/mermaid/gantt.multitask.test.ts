import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GanttHandler } from "../../../src/tools/mermaid/handlers/gantt.handler.js";

const handler = new GanttHandler();

describe("GanttHandler multi-task branches", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2025-01-01T00:00:00Z"));
		vi.spyOn(Math, "random").mockReturnValue(0); // deterministic durations
	});
	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it("generates different status tokens for first, second and later tasks", () => {
		const desc = "Task one. Task two. Task three.";
		const out = handler.generate(desc);
		// first task should have :done,
		expect(out).toMatch(/:done, task0/);
		// second should include active
		expect(out).toMatch(/:active, task1/);
		// third should be a task line without done/active prefix
		expect(out).toMatch(/task2, /);
	});
});
