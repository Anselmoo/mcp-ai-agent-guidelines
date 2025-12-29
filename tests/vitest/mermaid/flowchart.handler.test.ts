import { describe, expect, it } from "vitest";
import { BaseDiagramHandler } from "../../../src/tools/mermaid/handlers/base.handler.js";
import { FlowchartHandler } from "../../../src/tools/mermaid/handlers/flowchart.handler.js";

describe("FlowchartHandler", () => {
	const h = new FlowchartHandler();

	it("returns default simple pipeline when description has no steps", () => {
		const out = h.generate("");
		expect(out).toContain("U([User])");
		expect(out).toContain("R --> P[Filter active users with permissions]");
	});

	it("creates decision nodes for filter steps and connects yes/no branches", () => {
		const desc = "Read users. Filter active users. Append to results.";
		const out = h.generate(desc);
		// The filter step should become a decision node with Yes/No branches
		expect(out).toMatch(/\{Filter active users\?\}/i);
		expect(out).toMatch(/-->\|Yes\| .*\[Append to result\]/i);
		expect(out).toMatch(/-->\|No\| .*\[Skip\]/i);
	});

	it("adds risk nodes for secrets, sql and deprecated keywords and includes classDef", () => {
		const desc = "Start -> use api key -> execute raw SQL -> old method used";
		const out = h.generate(desc);
		// Expect at least one of the risk labels to be present
		expect(out).toContain("Hardcoded Secret");
		expect(out).toContain("Raw SQL Query Risk");
		expect(out).toContain("Deprecated Method");
		// classDef risk styling should be added
		expect(out).toContain("classDef risk");
	});

	it("honors direction provided in advancedFeatures and theme param", () => {
		const out = h.generate("A->B", "dark", { direction: "LR" });
		expect(out.startsWith("%%{init")).toBe(true);
		expect(out).toContain("flowchart LR");
	});
});
