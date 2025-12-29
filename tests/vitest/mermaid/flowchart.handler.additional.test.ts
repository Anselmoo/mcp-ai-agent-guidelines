import { describe, expect, it } from "vitest";
import { FlowchartHandler } from "../../../src/tools/mermaid/handlers/flowchart.handler.js";

describe("FlowchartHandler - additional behavior", () => {
	const h = new FlowchartHandler();

	it("honors provided direction via advancedFeatures", () => {
		const out = h.generate("A->B", undefined, { direction: "LR" });
		expect(out).toContain("flowchart LR");
	});

	it("falls back to minimal pipeline when no steps are present", () => {
		const out = h.generate("", undefined, {});
		expect(out).toContain("Read users.json");
		expect(out).toContain("Summary Output");
	});

	it("creates a decision node with yes/no branches for filter step", () => {
		const desc = `Read file\nFilter active users by permission\nWrite output`;
		const out = h.generate(desc);
		// Decision node for filter with a question mark
		expect(out).toMatch(/\{Filter active users by permission\?/i);
		// Yes/No branches created
		expect(out).toContain("|Yes|");
		expect(out).toContain("|No|");
	});

	it("adds risk nodes and classDef when keywords present", () => {
		const desc = `Read file\nUse API key in code\nRun raw SQL query`;
		const out = h.generate(desc);
		expect(out).toContain("Hardcoded Secret");
		expect(out).toContain("Raw SQL Query Risk");
		expect(out).toContain("classDef risk");
		expect(out).toContain("class ");
	});

	it("prepends theme init when theme provided", () => {
		const out = h.generate("A->B", "dark");
		expect(out).toMatch(/%%\{init:/);
		expect(out).toContain("dark");
	});
});
