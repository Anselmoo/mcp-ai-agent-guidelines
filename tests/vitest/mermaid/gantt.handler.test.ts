import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GanttHandler } from "../../../src/tools/mermaid/handlers/gantt.handler.js";

describe("GanttHandler", () => {
	const fixedDate = new Date("2023-01-01T00:00:00.000Z");
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(fixedDate);
		vi.spyOn(Math, "random").mockReturnValue(0.5); // deterministic duration
	});
	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it("parses project title and creates tasks with statuses", () => {
		const h = new GanttHandler();
		const desc =
			"Project: Alpha. Start research. Continue design. Finalize implementation.";
		const out = h.generate(desc);
		expect(out).toContain("title Alpha");
		expect(out).toContain("Start research");
		expect(out).toContain("task0");
		expect(out).toContain("task1");
		expect(out).toContain("done");
		expect(out).toContain("active");
	});

	it("falls back to template when no tasks parsed", () => {
		const h = new GanttHandler();
		const out = h.generate("");
		expect(out).toContain("section Planning");
		expect(out).toContain("Research :done");
	});
});
