import { describe, expect, it } from "vitest";
import { modelCompatibilityChecker } from "../../src/tools/utility/model-compatibility-checker.js";

describe("model-compatibility-checker edge cases and branches", () => {
	it("handles empty requirements array", async () => {
		const res = await modelCompatibilityChecker({
			taskDescription: "Simple task with no specific requirements",
			requirements: [],
			budget: "low",
		});
		const text = res.content[0]?.type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/Requirements.*None specified/);
		expect(text).toMatch(/AI Model Compatibility Analysis/);
	});

	it("handles missing requirements (undefined)", async () => {
		const res = await modelCompatibilityChecker({
			taskDescription: "Simple task",
			budget: "high",
		});
		const text = res.content[0]?.type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/Requirements.*None specified/);
		expect(text).toMatch(/Budget.*high/);
	});

	it("handles missing budget (undefined)", async () => {
		const res = await modelCompatibilityChecker({
			taskDescription: "Task without budget specified",
			requirements: ["fast responses"],
		});
		const text = res.content[0]?.type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/Budget.*Not specified/);
	});

	it("exercises all budget adjustment paths - low budget", async () => {
		const res = await modelCompatibilityChecker({
			taskDescription: "Cost-sensitive task",
			requirements: ["cost", "cheap"],
			budget: "low",
		});
		const text = res.content[0]?.type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/AI Model Compatibility Analysis/);
		// Low budget should favor budget/mid-tier models and penalize premium
	});

	it("exercises all budget adjustment paths - high budget", async () => {
		const res = await modelCompatibilityChecker({
			taskDescription: "Premium task requiring best quality",
			requirements: ["reasoning", "advanced"],
			budget: "high",
		});
		const text = res.content[0]?.type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/AI Model Compatibility Analysis/);
		// High budget should favor premium models without penalties
	});

	it("exercises medium budget (no bonuses or penalties)", async () => {
		const res = await modelCompatibilityChecker({
			taskDescription: "Balanced task",
			requirements: ["analysis"],
			budget: "medium",
		});
		const text = res.content[0]?.type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/Budget.*medium/);
	});

	it("handles python language code examples", async () => {
		const res = await modelCompatibilityChecker({
			taskDescription: "Python development task",
			language: "python",
			includeCodeExamples: true,
		});
		const text = res.content[0]?.type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/Python \(pseudo-usage\)/);
		expect(text).toMatch(/def pick_model/);
	});

	it("handles mixed case and complex language detection", async () => {
		const res = await modelCompatibilityChecker({
			taskDescription: "Development task",
			language: "PYTHON", // Test case insensitive
			includeCodeExamples: true,
		});
		const text = res.content[0]?.type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/Python \(pseudo-usage\)/);
	});

	it("handles partial python language match", async () => {
		const res = await modelCompatibilityChecker({
			taskDescription: "Development task",
			language: "python3", // Contains 'python'
			includeCodeExamples: true,
		});
		const text = res.content[0]?.type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/Python \(pseudo-usage\)/);
	});

	it("disables all optional sections", async () => {
		const res = await modelCompatibilityChecker({
			taskDescription: "Minimal analysis task",
			includeCodeExamples: false,
			includeReferences: false,
			linkFiles: false,
			includeMetadata: false,
		});
		const text = res.content[0]?.type === "text" ? res.content[0].text : "";
		expect(text).not.toMatch(/### Code Examples/);
		expect(text).not.toMatch(/### Configuration & Files/);
		expect(text).not.toMatch(/### References/);
		expect(text).not.toMatch(/### Metadata/);
		// But should still have the core analysis
		expect(text).toMatch(/AI Model Compatibility Analysis/);
		expect(text).toMatch(/Top Recommendations/);
	});

	it("includes input file in metadata when provided", async () => {
		const res = await modelCompatibilityChecker({
			taskDescription: "File-based analysis",
			inputFile: "my-project.json",
			includeMetadata: true,
		});
		const text = res.content[0]?.type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/Input file: my-project\.json/);
	});

	it("exercises maximum capability scoring", async () => {
		const res = await modelCompatibilityChecker({
			taskDescription:
				"Complex reasoning code generation with large context, multimodal, safety-critical, cost-sensitive",
			requirements: [
				"reasoning",
				"code",
				"large context",
				"speed",
				"multimodal",
				"safety",
				"cost",
				"visual",
				"production",
				"cheap",
			],
			budget: "low",
		});
		const text = res.content[0]?.type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/AI Model Compatibility Analysis/);
		// This should hit multiple capability weights and budget adjustments
	});

	it("handles edge case with no matching capabilities", async () => {
		const res = await modelCompatibilityChecker({
			taskDescription: "Very specific niche task",
			requirements: ["very-specific-unmatched-requirement"],
		});
		const text = res.content[0]?.type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/AI Model Compatibility Analysis/);
		// Should still work with base scores only
	});

	it("exercises score clamping (max 100)", async () => {
		const res = await modelCompatibilityChecker({
			taskDescription: "Task that should generate very high scores",
			requirements: [
				"reasoning",
				"code",
				"large context",
				"speed",
				"multimodal",
				"safety",
				"cost",
				"analysis",
				"large-context",
				"fast",
			],
			budget: "high",
		});
		const text = res.content[0]?.type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/AI Model Compatibility Analysis/);
		// Scores should be clamped to 100 max
	});
});
