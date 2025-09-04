import { describe, expect, it } from "vitest";
import { strategyFrameworksBuilder } from "../../src/tools/analysis/strategy-frameworks-builder";

describe("strategy-frameworks-builder diagrams & aliases", () => {
	it("emits Mermaid for SWOT and BCG when includeDiagrams=true", async () => {
		const res = await strategyFrameworksBuilder({
			frameworks: ["swot", "bcgMatrix"],
			context: "Demo",
			includeDiagrams: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text = res.content[0].type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/```mermaid[\s\S]*flowchart TB/);
		expect(text).toMatch(/```mermaid[\s\S]*quadrantChart/);
	});

	it("uses alias labels for 7S and MQ", async () => {
		const res = await strategyFrameworksBuilder({
			frameworks: ["mckinsey7S", "gartnerQuadrant"],
			context: "Demo",
			includeDiagrams: true,
			includeReferences: true,
			includeMetadata: true,
			inputFile: "demo.md",
		});
		const text = res.content[0].type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/7S Organizational Alignment \(consulting-7s\)/);
		expect(text).toMatch(/Market Position Snapshot/);
		expect(text).toMatch(/Metadata/);
		expect(text).toMatch(/Input file: demo.md/);
		expect(text).toMatch(/References/);
	});
});
