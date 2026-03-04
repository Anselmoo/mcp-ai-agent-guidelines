import { describe, expect, it } from "vitest";
import { generateSpec } from "../../../../../src/domain/speckit/generators/spec-generator.js";
import { createInitialSessionState } from "../../../../../src/domain/speckit/types.js";

const base = {
	overview: "Overview",
	acceptanceCriteria: [] as string[],
	outOfScope: [] as string[],
	validateAgainstConstitution: false as const,
};

describe("generateSpec", () => {
	it("should generate spec with title and overview", () => {
		const state = createInitialSessionState({
			...base,
			title: "My Spec",
			objectives: [{ description: "Obj", priority: "high" as const }],
			requirements: [
				{
					description: "Req",
					type: "functional" as const,
					priority: "high" as const,
				},
			],
		});

		const result = generateSpec(state);
		expect(result.title).toBe("spec.md");
		expect(result.content).toContain("# My Spec - Specification");
		expect(result.content).toContain("Overview");
	});

	it("should group objectives by priority", () => {
		const state = createInitialSessionState({
			...base,
			title: "Priority Spec",
			objectives: [
				{ description: "High goal", priority: "high" as const },
				{ description: "Medium goal", priority: "medium" as const },
				{ description: "Low goal", priority: "low" as const },
			],
			requirements: [
				{
					description: "Req",
					type: "functional" as const,
					priority: "medium" as const,
				},
			],
		});

		const result = generateSpec(state);
		expect(result.content).toContain("### Priority: High");
		expect(result.content).toContain("### Priority: Medium");
		expect(result.content).toContain("### Priority: Low");
	});

	it("should show _No requirements specified._ when no functional requirements", () => {
		const state = createInitialSessionState({
			...base,
			title: "NFR Only",
			objectives: [{ description: "Obj", priority: "high" as const }],
			requirements: [
				{
					description: "Perf req",
					type: "non-functional" as const,
					priority: "high" as const,
				},
			],
		});

		const result = generateSpec(state);
		expect(result.content).toContain("_No requirements specified._");
	});

	it("should include Acceptance Criteria section when provided", () => {
		const state = createInitialSessionState({
			...base,
			title: "AC Spec",
			objectives: [{ description: "Obj", priority: "high" as const }],
			requirements: [
				{
					description: "Req",
					type: "functional" as const,
					priority: "high" as const,
				},
			],
			acceptanceCriteria: ["User can log in", "Session persists for 24h"],
		});

		const result = generateSpec(state);
		expect(result.content).toContain("## Acceptance Criteria");
		expect(result.content).toContain("AC-1");
		expect(result.content).toContain("User can log in");
	});

	it("should include Out of Scope section when provided", () => {
		const state = createInitialSessionState({
			...base,
			title: "OOS Spec",
			objectives: [{ description: "Obj", priority: "high" as const }],
			requirements: [
				{
					description: "Req",
					type: "functional" as const,
					priority: "high" as const,
				},
			],
			outOfScope: ["Mobile app", "Internationalization"],
		});

		const result = generateSpec(state);
		expect(result.content).toContain("## Out of Scope");
		expect(result.content).toContain("Mobile app");
	});

	it("should not include Acceptance Criteria when empty", () => {
		const state = createInitialSessionState({
			...base,
			title: "No AC",
			objectives: [{ description: "Obj", priority: "high" as const }],
			requirements: [
				{
					description: "Req",
					type: "functional" as const,
					priority: "high" as const,
				},
			],
		});

		const result = generateSpec(state);
		expect(result.content).not.toContain("## Acceptance Criteria");
	});

	it("should have positive token estimate", () => {
		const state = createInitialSessionState({
			...base,
			title: "Token Spec",
			objectives: [{ description: "Obj", priority: "medium" as const }],
			requirements: [
				{
					description: "Req",
					type: "functional" as const,
					priority: "medium" as const,
				},
			],
		});

		const result = generateSpec(state);
		expect(result.tokenEstimate).toBeGreaterThan(0);
	});
});
