import { describe, expect, it } from "vitest";
import { modelCompatibilityChecker } from "../../src/tools/model-compatibility-checker";

describe("model-compatibility-checker", () => {
	it("returns ranked recommendations and includes code examples when requested", async () => {
		const res = await modelCompatibilityChecker({
			taskDescription:
				"Analyze large documents, need large context and complex reasoning",
			requirements: ["large", "analysis"],
			budget: "high",
			language: "typescript",
			includeCodeExamples: true,
		});

		const text = res.content[0].text;
		expect(text).toContain("AI Model Compatibility Analysis");
		// Should include code examples section when requested
		expect(text).toContain("### Code Examples");
		// Top recommendations table present
		expect(text).toMatch(/Top Recommendations/);
		expect(text).toMatch(/Selection Snapshot/);
	});

	it("favors large-context models when requirement keywords match", async () => {
		const res = await modelCompatibilityChecker({
			taskDescription: "Process a 2M token document for research and summary",
			requirements: ["2m", "document"],
			budget: "low",
		});

		const text = res.content[0].text.toLowerCase();
		// Gemini 2.5 Pro should be in recommendations for large-context
		expect(text).toContain("gemini 2.5 pro".toLowerCase());
		// Low budget should still surface budget-friendly options in table
		expect(text).toContain("o4-mini".toLowerCase());
	});

	it("produces a qualitative analysis with selection snapshot and TS examples", async () => {
		const res = await modelCompatibilityChecker({
			taskDescription: "Analyze long documents and generate code",
			requirements: ["large context", "code generation", "analysis"],
			budget: "medium",
			language: "typescript",
			includeCodeExamples: true,
			linkFiles: true,
		});
		const text = res.content[0].text;
		expect(text).toMatch(/AI Model Compatibility Analysis/);
		expect(text).toMatch(/Top Recommendations/);
		expect(text).toMatch(/Selection Snapshot/);
		expect(text).toMatch(/TypeScript \(pattern\)/);
		expect(text).toMatch(/Configuration & Files/);
	});

	it("can emit python examples and omit extras when toggled off", async () => {
		const res = await modelCompatibilityChecker({
			taskDescription: "Long docs, code tasks",
			requirements: ["large context"],
			language: "python",
			includeCodeExamples: true,
			linkFiles: false,
			includeReferences: false,
		});
		const text = res.content[0].text;
		expect(text).toMatch(/Python \(pseudo-usage\)/);
		expect(text).not.toMatch(/Configuration & Files/);
	});
});
