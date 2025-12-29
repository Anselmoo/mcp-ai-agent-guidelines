import { describe, expect, it } from "vitest";
import {
	fallbackDiagram,
	needsRepair,
	repairDiagram,
} from "../../../src/tools/mermaid/utils/repair.utils.js";

describe("repair.utils", () => {
	it("repairs classDef with = to use : and keeps classDef format", () => {
		const src = "classDef MyClass fill=blue,stroke=black;";
		const out = repairDiagram(src);
		expect(out).toContain("classDef MyClass fill:blue,stroke:black;");
	});

	it("adds flowchart header when flowchart keyword present but header missing", () => {
		const src = "A --> B\nflowchart";
		const out = repairDiagram(src);
		expect(out.startsWith("flowchart TD")).toBe(true);
	});

	it("fallbackDiagram returns a minimal flowchart with Fallback text", () => {
		const out = fallbackDiagram();
		expect(out).toContain("Fallback Diagram");
		expect(out).toContain("flowchart");
	});

	it("needsRepair detects classDef with = or missing header", () => {
		expect(needsRepair("classDef X fill=red")).toBe(true);
		expect(needsRepair("A --> B\nflowchart")).toBe(true);
		expect(needsRepair("flowchart TD\nA-->B")).toBe(false);
	});
});
