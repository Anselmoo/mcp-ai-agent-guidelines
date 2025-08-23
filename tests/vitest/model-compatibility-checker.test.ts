import { describe, expect, it } from "vitest";
import { modelCompatibilityChecker } from "../../src/tools/model-compatibility-checker";

describe("model-compatibility-checker", () => {
	it("produces a qualitative analysis with selection snapshot (TS examples)", async () => {
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
