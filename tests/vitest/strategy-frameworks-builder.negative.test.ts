import { describe, expect, it } from "vitest";
import { strategyFrameworksBuilder } from "../../src/tools/analysis/strategy-frameworks-builder";

type ErrorResponse = { isError?: boolean; content: { text: string }[] };

describe("strategy-frameworks-builder (negative and toggles)", () => {
	it("returns error on missing context", async () => {
		// deliberately omit context
		const invalidArgs = { frameworks: ["swot"] } as unknown;
		const result = (await strategyFrameworksBuilder(
			invalidArgs,
		)) as ErrorResponse;
		expect(result.isError).toBe(true);
		expect(result.content[0].text).toMatch(/context/i);
	});

	it("returns error on invalid framework id", async () => {
		const invalidArgs = {
			frameworks: ["swot", "notAFramework"],
			context: "Test",
		} as unknown;
		const result = (await strategyFrameworksBuilder(
			invalidArgs,
		)) as ErrorResponse;
		expect(result.isError).toBe(true);
		expect(result.content[0].text).toMatch(/Invalid enum value|frameworks/i);
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
