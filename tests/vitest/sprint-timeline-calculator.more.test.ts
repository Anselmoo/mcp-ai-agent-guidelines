import { describe, expect, it } from "vitest";
import { sprintTimelineCalculator } from "../../src/tools/sprint-timeline-calculator";

describe("sprint-timeline-calculator (metadata, risks, refs)", () => {
	it("includes metadata and references and triggers multiple risks", async () => {
		// Small team, long scope, with dependencies to trigger High/Medium risks and recommendations
		const tasks = [
			{ name: "A|Alpha", estimate: 50, priority: "high", dependencies: ["C"] },
			{ name: "B\\Beta", estimate: 40, priority: "medium" },
			{ name: "C Task", estimate: 35, priority: "low" },
			{ name: "D Task", estimate: 30 },
		];
		const res = await sprintTimelineCalculator({
			tasks,
			teamSize: 2, // small team
			sprintLength: 14,
			// leave velocity undefined to exercise calculation branch
			includeMetadata: true,
			inputFile: "demo.json",
		});
		const text = res.content[0].type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/Sprint Timeline Calculation/);
		expect(text).toMatch(/### Metadata/);
		// label may be bolded with colon inside or outside the bold
		expect(text).toMatch(
			/(\*\*Source tool\*\*:\s*|\*\*Source tool:\*\*\s*)mcp_ai-agent-guid_sprint-timeline-calculator/,
		);
		expect(text).toMatch(
			/(\*\*Input file\*\*:\s*|\*\*Input file:\*\*\s*)demo\.json/,
		);
		// Risks
		expect(text).toMatch(/Risk Assessment/);
		expect(text).toMatch(/High|Medium|Low/);
		// Gantt chart present and labels sanitized to dashes
		expect(text).toMatch(/```mermaid[\s\S]*gantt/);
		expect(text).toMatch(/A-Alpha/);
		expect(text).toMatch(/B-Beta/);
		// References footer
		expect(text).toMatch(/ZenHub/);
	});
});
