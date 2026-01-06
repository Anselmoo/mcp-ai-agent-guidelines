import { describe, expect, it } from "vitest";
import { gapFrameworksAnalyzers } from "../../src/tools/analysis/gap-frameworks-analyzers.js";

type ErrorResponse = { isError?: boolean; content: { text: string }[] };

describe("gap-frameworks-analyzers negative cases", () => {
	it("should return error for invalid framework type", async () => {
		const result = (await gapFrameworksAnalyzers({
			frameworks: ["invalid-framework"],
			currentState: "Current state",
			desiredState: "Desired state",
			context: "Test context",
		})) as ErrorResponse;
		expect(result.isError).toBe(true);
	});

	it("should return error for missing required fields", async () => {
		const result = (await gapFrameworksAnalyzers({
			frameworks: ["capability"],
			// Missing currentState, desiredState, context
		})) as ErrorResponse;
		expect(result.isError).toBe(true);
	});

	it("should return error for empty frameworks array", async () => {
		const result = (await gapFrameworksAnalyzers({
			frameworks: [],
			currentState: "Current state",
			desiredState: "Desired state",
			context: "Test context",
		})) as ErrorResponse;
		expect(result.isError).toBe(true);
	});

	it("should return error for non-string current state", async () => {
		const result = (await gapFrameworksAnalyzers({
			frameworks: ["capability"],
			currentState: 123,
			desiredState: "Desired state",
			context: "Test context",
		})) as ErrorResponse;
		expect(result.isError).toBe(true);
	});

	it("should return error for non-array objectives", async () => {
		const result = (await gapFrameworksAnalyzers({
			frameworks: ["capability"],
			currentState: "Current state",
			desiredState: "Desired state",
			context: "Test context",
			objectives: "Should be array",
		})) as ErrorResponse;
		expect(result.isError).toBe(true);
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
