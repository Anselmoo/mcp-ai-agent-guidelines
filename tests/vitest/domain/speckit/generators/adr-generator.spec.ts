import { describe, expect, it } from "vitest";
import { generateAdr } from "../../../../../src/domain/speckit/generators/adr-generator.js";
import { createInitialSessionState } from "../../../../../src/domain/speckit/types.js";

describe("generateAdr", () => {
	it("should generate ADR document", () => {
		const state = createInitialSessionState({
			title: "ADR Test",
			overview: "Overview",
			objectives: [{ description: "Obj", priority: "high" }],
			requirements: [
				{ description: "Req", type: "functional", priority: "high" },
			],
			acceptanceCriteria: [],
			outOfScope: [],
			validateAgainstConstitution: false,
		});

		const result = generateAdr(state);
		expect(result.title).toBe("adr.md");
		expect(result.content).toContain("## Decision");
	});
});
