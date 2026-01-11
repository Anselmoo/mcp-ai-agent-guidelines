/**
 * Coverage boost tests for speckit-generator tool
 * Tests edge cases and error paths for improved code coverage
 */

import { describe, expect, it } from "vitest";
import type { SpecKitGeneratorRequest } from "../../../src/tools/speckit-generator.js";
import { specKitGenerator } from "../../../src/tools/speckit-generator.js";

describe("specKitGenerator - Coverage Boost", () => {
	it("should handle minimal request with no optional fields", async () => {
		const request: SpecKitGeneratorRequest = {
			title: "Minimal Spec",
			overview: "Basic overview",
			objectives: [{ description: "Single objective" }],
			requirements: [{ description: "Single requirement" }],
		};

		const result = await specKitGenerator(request);

		expect(result).toBeDefined();
		expect(result.content).toBeDefined();
		expect(result.content[0].text).toContain("Spec-Kit Generated");
		expect(result.content[0].text).toContain("Minimal Spec");
		expect(result.content[0].text).not.toContain(
			"Validated against CONSTITUTION.md",
		);
	});

	it("should handle requirements without type specified", async () => {
		const request: SpecKitGeneratorRequest = {
			title: "Mixed Requirements",
			overview: "Requirements with and without types",
			objectives: [{ description: "Test objective" }],
			requirements: [
				{ description: "Req with no type" },
				{ description: "Functional req", type: "functional" },
				{ description: "Non-functional req", type: "non-functional" },
			],
		};

		const result = await specKitGenerator(request);

		expect(result.content[0].text).toContain("Req with no type");
		expect(result.content[0].text).toContain("Functional req");
		expect(result.content[0].text).toContain("Non-functional req");
	});

	it("should handle objectives without priority specified", async () => {
		const request: SpecKitGeneratorRequest = {
			title: "Mixed Priorities",
			overview: "Objectives with and without priorities",
			objectives: [
				{ description: "Objective without priority" },
				{ description: "High priority objective", priority: "high" },
				{ description: "Medium priority objective", priority: "medium" },
			],
			requirements: [{ description: "Test requirement" }],
		};

		const result = await specKitGenerator(request);

		expect(result.content[0].text).toContain("Objective without priority");
		expect(result.content[0].text).toContain("High priority objective");
		expect(result.content[0].text).toContain("Medium priority objective");
	});

	it("should handle requirements without priority specified", async () => {
		const request: SpecKitGeneratorRequest = {
			title: "Requirements No Priority",
			overview: "Requirements with and without priorities",
			objectives: [{ description: "Test objective" }],
			requirements: [
				{ description: "Req without priority", type: "functional" },
				{
					description: "High priority req",
					type: "functional",
					priority: "high",
				},
				{
					description: "Low priority req",
					type: "non-functional",
					priority: "low",
				},
			],
		};

		const result = await specKitGenerator(request);

		expect(result.content[0].text).toContain("Req without priority");
		expect(result.content[0].text).toContain("High priority req");
		expect(result.content[0].text).toContain("Low priority req");
	});

	it("should handle empty arrays for optional fields", async () => {
		const request: SpecKitGeneratorRequest = {
			title: "Empty Optional Fields",
			overview: "Test with empty optional arrays",
			objectives: [{ description: "Test objective" }],
			requirements: [{ description: "Test requirement" }],
			acceptanceCriteria: [],
			outOfScope: [],
		};

		const result = await specKitGenerator(request);

		expect(result).toBeDefined();
		expect(result.content[0].text).toContain("Empty Optional Fields");
	});

	it("should generate all 7 expected documents", async () => {
		const request: SpecKitGeneratorRequest = {
			title: "Complete Spec-Kit",
			overview: "Verify all documents are generated",
			objectives: [{ description: "Generate all docs" }],
			requirements: [{ description: "Complete requirement set" }],
		};

		const result = await specKitGenerator(request);
		const text = result.content[0].text;

		// Check for all 7 documents
		expect(text).toContain("README.md");
		expect(text).toContain("spec.md");
		expect(text).toContain("plan.md");
		expect(text).toContain("tasks.md");
		expect(text).toContain("progress.md");
		expect(text).toContain("adr.md");
		expect(text).toContain("roadmap.md");
	});

	it("should include timestamp in output", async () => {
		const beforeTime = new Date();

		const request: SpecKitGeneratorRequest = {
			title: "Timestamp Test",
			overview: "Verify timestamp generation",
			objectives: [{ description: "Test timestamp" }],
			requirements: [{ description: "Test requirement" }],
		};

		const result = await specKitGenerator(request);

		const afterTime = new Date();

		// Check that output contains "Generated" followed by an ISO timestamp
		expect(result.content[0].text).toMatch(/Generated \d{4}-\d{2}-\d{2}/);

		// Extract and verify timestamp is within test execution window
		const timestampMatch = result.content[0].text.match(
			/Generated (\d{4}-\d{2}-\d{2}T[\d:.]+Z)/,
		);
		expect(timestampMatch).toBeTruthy();

		if (timestampMatch) {
			const timestamp = new Date(timestampMatch[1]);
			expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
			expect(timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
		}
	});

	it("should handle validateAgainstConstitution flag without constitution path", async () => {
		// This tests the edge case where validation flag is set but no path is provided
		const request: SpecKitGeneratorRequest = {
			title: "Validation Without Path",
			overview: "Test validation flag without constitution",
			objectives: [{ description: "Test objective" }],
			requirements: [{ description: "Test requirement" }],
			validateAgainstConstitution: true, // Flag set but no path
		};

		const result = await specKitGenerator(request);

		expect(result).toBeDefined();
		expect(result.content[0].text).toContain("Validation Without Path");
		expect(result.content[0].text).not.toContain(
			"Validated against CONSTITUTION.md",
		);
	});
});
