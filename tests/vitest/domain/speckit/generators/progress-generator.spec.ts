import { describe, expect, it } from "vitest";
import { generateProgress } from "../../../../../src/domain/speckit/generators/progress-generator.js";
import { createInitialSessionState } from "../../../../../src/domain/speckit/types.js";

describe("generateProgress", () => {
	it("should generate progress summary and checklist", () => {
		const state = createInitialSessionState({
			title: "Progress Test",
			overview: "Overview",
			objectives: [{ description: "Obj", priority: "high" }],
			requirements: [
				{ description: "Req", type: "functional", priority: "high" },
			],
			acceptanceCriteria: [],
			outOfScope: [],
			validateAgainstConstitution: false,
		});

		const result = generateProgress(state);
		expect(result.title).toBe("progress.md");
		expect(result.content).toContain("Total tasks: 1");
		expect(result.content).toContain("- [ ] Req");
	});
});
