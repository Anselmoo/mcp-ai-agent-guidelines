import { describe, expect, it } from "vitest";
import { modelCompatibilityChecker } from "../../src/tools/utility/model-compatibility-checker.js";

describe("model-compatibility-checker (examples and links)", () => {
	it("omits code examples when includeCodeExamples=false", async () => {
		const res = await modelCompatibilityChecker({
			taskDescription: "Summarize long technical text",
			requirements: ["long context"],
			includeCodeExamples: false,
			includeReferences: false,
		});
		const text = res.content[0]?.type === "text" ? res.content[0].text : "";
		expect(text).not.toMatch(/### Code Examples/);
	});

	it("includes code examples when includeCodeExamples=true", async () => {
		const res = await modelCompatibilityChecker({
			taskDescription: "Summarize long technical text",
			requirements: ["long context"],
			includeCodeExamples: true,
			language: "typescript",
			includeReferences: false,
		});
		const text = res.content[0]?.type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/### Code Examples/);
		expect(text).toMatch(/typescript/i);
	});
});
