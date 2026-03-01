import { describe, expect, it } from "vitest";
import {
	createDefaultOutput,
	createInitialSessionState,
	SpecKitInputSchema,
} from "../../../../src/domain/speckit/types.js";

describe("speckit types factories", () => {
	it("should create initial session state", () => {
		const input = SpecKitInputSchema.parse({
			title: "Type Test",
			overview: "Overview",
			objectives: [{ description: "Objective" }],
			requirements: [{ description: "Requirement" }],
		});
		const state = createInitialSessionState(input);

		expect(state.input.title).toBe("Type Test");
		expect(state.sections.spec).toBeNull();
		expect(state.metadata.warnings).toEqual([]);
	});

	it("should create default output", () => {
		const output = createDefaultOutput();
		expect(output.artifacts.spec).toBe("");
		expect(output.stats.documentsGenerated).toBe(0);
		expect(output.validation).toBeNull();
	});
});
