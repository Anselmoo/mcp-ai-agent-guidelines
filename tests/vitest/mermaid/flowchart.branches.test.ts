import { afterEach, describe, expect, it } from "vitest";
import {
	__setMermaidModuleProvider,
	mermaidDiagramGenerator,
} from "../../../src/tools/mermaid-diagram-generator.js";

describe("mermaid flowchart generation branches", () => {
	afterEach(() => {
		__setMermaidModuleProvider(null);
	});

	it("creates filter decision nodes with Yes/No branches", async () => {
		const res = await mermaidDiagramGenerator({
			description: "Filter active users",
			diagramType: "flowchart",
		});
		const code = (res as unknown as { content: { text: string }[] }).content[0]
			.text;
		expect(code).toContain("Filter active users?");
		expect(code).toContain("|Yes|");
		expect(code).toContain("|No|");
	});

	it("adds risk nodes and classDef when keywords present", async () => {
		const res = await mermaidDiagramGenerator({
			description: "This flow contains an API key and SQL query",
			diagramType: "flowchart",
		});
		const code = (res as unknown as { content: { text: string }[] }).content[0]
			.text;
		expect(code).toContain("Hardcoded Secret");
		expect(code).toContain("Raw SQL Query Risk");
		expect(code).toContain("classDef risk");
	});

	it("adds autonumber when advancedFeatures.autonumber is true for sequence diagrams", async () => {
		const res = await mermaidDiagramGenerator({
			description: "User sends message to system",
			diagramType: "sequence",
			advancedFeatures: { autonumber: true },
		});
		const code = (res as unknown as { content: { text: string }[] }).content[0]
			.text;
		expect(code).toContain("autonumber");
	});

	it("falls back to default class template when no classes detected", async () => {
		const res = await mermaidDiagramGenerator({
			description: "no classes here",
			diagramType: "class",
		});
		const code = (res as unknown as { content: { text: string }[] }).content[0]
			.text;
		expect(code).toContain("class User");
		expect(code).toContain("User --> System : uses");
	});
});
