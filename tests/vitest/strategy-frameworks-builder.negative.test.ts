import { describe, expect, it } from "vitest";
import { strategyFrameworksBuilder } from "../../src/tools/analysis/strategy-frameworks-builder";

describe("strategy-frameworks-builder (negative and toggles)", () => {
	it("throws on missing context", async () => {
		// deliberately omit context
		const invalidArgs = { frameworks: ["swot"] } as unknown;
		await expect(strategyFrameworksBuilder(invalidArgs)).rejects.toThrow(
			/context/i,
		);
	});

	it("throws on invalid framework id", async () => {
		const invalidArgs = {
			frameworks: ["swot", "notAFramework"],
			context: "Test",
		} as unknown;
		await expect(strategyFrameworksBuilder(invalidArgs)).rejects.toThrow(
			/Invalid enum value|frameworks/i,
		);
	});

	it("includes diagrams when includeDiagrams=true", async () => {
		const res = await strategyFrameworksBuilder({
			frameworks: [
				"swot",
				"ansoffMatrix",
				"bcgMatrix",
				"pest",
				"strategyMap",
				"gartnerQuadrant",
			],
			context: "Test",
			includeDiagrams: true,
			includeMetadata: false,
			includeReferences: false,
		});
		const text = res.content[0]?.type === "text" ? res.content[0].text : "";
		expect(text).toContain("```mermaid");
		// Spot check a couple of diagram types
		expect(text).toMatch(/quadrantChart/);
		expect(text).toMatch(/mindmap|flowchart/);
	});
});
