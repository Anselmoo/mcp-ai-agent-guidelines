import { describe, it, expect } from "vitest";
import { gapFrameworksAnalyzers } from "../../src/tools/analysis/gap-frameworks-analyzers.js";

describe("gap-frameworks-analyzers negative cases", () => {
	it("should throw error for invalid framework type", async () => {
		await expect(
			gapFrameworksAnalyzers({
				frameworks: ["invalid-framework"],
				currentState: "Current state",
				desiredState: "Desired state",
				context: "Test context",
			})
		).rejects.toThrow();
	});

	it("should throw error for missing required fields", async () => {
		await expect(
			gapFrameworksAnalyzers({
				frameworks: ["capability"],
				// Missing currentState, desiredState, context
			})
		).rejects.toThrow();
	});

	it("should throw error for empty frameworks array", async () => {
		await expect(
			gapFrameworksAnalyzers({
				frameworks: [],
				currentState: "Current state",
				desiredState: "Desired state",
				context: "Test context",
			})
		).rejects.toThrow();
	});

	it("should throw error for non-string current state", async () => {
		await expect(
			gapFrameworksAnalyzers({
				frameworks: ["capability"],
				currentState: 123,
				desiredState: "Desired state",
				context: "Test context",
			})
		).rejects.toThrow();
	});

	it("should throw error for non-array objectives", async () => {
		await expect(
			gapFrameworksAnalyzers({
				frameworks: ["capability"],
				currentState: "Current state",
				desiredState: "Desired state",
				context: "Test context",
				objectives: "Should be array",
			})
		).rejects.toThrow();
	});

	it("should handle empty optional arrays gracefully", async () => {
		const result = await gapFrameworksAnalyzers({
			frameworks: ["capability"],
			currentState: "Current state",
			desiredState: "Desired state",
			context: "Test context",
			objectives: [],
			stakeholders: [],
			constraints: [],
		});

		const text = result.content[0].text;
		expect(text).toContain("Capability Gap Analysis");
		expect(text).not.toContain("Objectives:");
		expect(text).not.toContain("Stakeholders:");
		expect(text).not.toContain("Constraints:");
	});
});