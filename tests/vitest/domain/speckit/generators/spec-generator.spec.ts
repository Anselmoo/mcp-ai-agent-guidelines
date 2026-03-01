import { describe, expect, it } from "vitest";
import { generateSpec } from "../../../../../src/domain/speckit/generators/spec-generator.js";
import { createInitialSessionState } from "../../../../../src/domain/speckit/types.js";

describe("generateSpec", () => {
	const baseInput = {
		title: "Test Project",
		overview: "A test project for unit testing",
		objectives: [
			{ description: "Build feature A", priority: "high" as const },
			{ description: "Build feature B", priority: "medium" as const },
		],
		requirements: [
			{
				description: "Must do X",
				type: "functional" as const,
				priority: "high" as const,
			},
			{
				description: "Performance < 100ms",
				type: "non-functional" as const,
				priority: "medium" as const,
			},
		],
		acceptanceCriteria: ["System boots in < 5s", "All tests pass"],
		outOfScope: ["Mobile support", "i18n"],
	};

	it("should generate spec with all sections", () => {
		const state = createInitialSessionState(baseInput);
		const result = generateSpec(state);

		expect(result.title).toBe("spec.md");
		expect(result.content).toContain("# Test Project - Specification");
		expect(result.content).toContain("## Overview");
		expect(result.content).toContain("## Objectives");
		expect(result.content).toContain("## Requirements");
		expect(result.content).toContain("### Functional Requirements");
		expect(result.content).toContain("### Non-Functional Requirements");
		expect(result.content).toContain("## Acceptance Criteria");
		expect(result.content).toContain("## Out of Scope");
	});

	it("should estimate tokens", () => {
		const state = createInitialSessionState(baseInput);
		const result = generateSpec(state);

		expect(result.tokenEstimate).toBeGreaterThan(0);
		expect(result.tokenEstimate).toBe(Math.ceil(result.content.length / 4));
	});

	it("should skip optional sections if empty", () => {
		const state = createInitialSessionState({
			...baseInput,
			acceptanceCriteria: [],
			outOfScope: [],
		});
		const result = generateSpec(state);

		expect(result.content).not.toContain("## Acceptance Criteria");
		expect(result.content).not.toContain("## Out of Scope");
	});
});
