import { describe, expect, it } from "vitest";
import { sprintTimelineCalculator } from "../../src/tools/sprint-timeline-calculator";

describe("sprint-timeline-calculator", () => {
	it("calculates sprints and outputs tables and gantt", async () => {
		const res = await sprintTimelineCalculator({
			tasks: [
				{ name: "A", estimate: 5, priority: "high" },
				{ name: "B", estimate: 8, priority: "medium" },
				{ name: "C", estimate: 3, priority: "low", dependencies: ["A"] },
			],
			teamSize: 3,
			sprintLength: 14,
		});
		const text = res.content[0].text;
		expect(text).toMatch(/Sprint Timeline Calculation/);
		expect(text).toMatch(/Sprint Summary/);
		expect(text).toMatch(/Gantt Chart.*Sprint Timeline/);
		expect(text).toMatch(/section Sprint/);
	});
});
