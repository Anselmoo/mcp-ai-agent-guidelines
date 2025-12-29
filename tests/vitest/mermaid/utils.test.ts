import { describe, expect, it } from "vitest";
import {
	applyAccessibility,
	extractAccessibility,
	prepareAccessibilityComments,
} from "../../../src/tools/mermaid/utils/accessibility.utils.js";
import {
	getDirection,
	isValidDirection,
} from "../../../src/tools/mermaid/utils/direction.utils.js";
import {
	fallbackDiagram,
	needsRepair,
	repairDiagram,
} from "../../../src/tools/mermaid/utils/repair.utils.js";
import {
	applyTheme,
	isCommonTheme,
} from "../../../src/tools/mermaid/utils/theme.utils.js";

describe("mermaid utils - accessibility", () => {
	it("applyAccessibility adds both title and description when provided", () => {
		const diagram = "flowchart TD\nA-->B";
		const got = applyAccessibility(diagram, "My Title", "A short descr");
		expect(got).toContain("%% AccTitle: My Title %%");
		expect(got).toContain("%% AccDescr: A short descr %%");
		expect(got).toContain("flowchart TD");
	});

	it("applyAccessibility returns original when nothing provided", () => {
		const diagram = "flowchart TD\nA-->B";
		expect(applyAccessibility(diagram)).toBe(diagram);
	});

	it("prepareAccessibilityComments builds correct comment string", () => {
		expect(prepareAccessibilityComments("T", "D")).toBe(
			"%% AccTitle: T %%\n%% AccDescr: D %%",
		);
		expect(prepareAccessibilityComments()).toBe("");
	});

	it("extractAccessibility finds title and descr", () => {
		const diagram = "%% AccTitle: X %%\n%% AccDescr: Y %%\nflowchart TD";
		expect(extractAccessibility(diagram)).toEqual({
			accTitle: "X",
			accDescr: "Y",
		});
	});
});

describe("mermaid utils - repair", () => {
	it("repairDiagram normalizes classDef and inserts header when needed", () => {
		const src = "classDef myClass fill=blue,stroke=black\nmyClass";
		const got = repairDiagram(src);
		expect(got).toContain("classDef myClass fill:blue,stroke:black;");
		// Since 'flowchart' not present we shouldn't add header here
		expect(got).not.toMatch(/^flowchart/);
	});

	it("repairDiagram adds flowchart header when keyword present without header", () => {
		const src = "A-->B\nflowchart";
		const got = repairDiagram(src);
		expect(got.startsWith("flowchart TD")).toBe(true);
	});

	it("fallbackDiagram returns a minimal flowchart", () => {
		expect(fallbackDiagram()).toContain("flowchart TD");
		expect(fallbackDiagram()).toContain("Fallback Diagram");
	});

	it("needsRepair detects '=' in classDef and missing header", () => {
		expect(needsRepair("classDef a fill=red")).toBe(true);
		expect(needsRepair("some flowchart text without header flowchart")).toBe(
			true,
		);
		expect(needsRepair("flowchart TD\nA-->B")).toBe(false);
	});
});

describe("mermaid utils - direction & theme", () => {
	it("getDirection returns valid direction or default", () => {
		expect(getDirection("LR")).toBe("LR");
		expect(getDirection("invalid")).toBe("TD");
		expect(getDirection()).toBe("TD");
	});

	it("isValidDirection correctly validates values", () => {
		expect(isValidDirection("TB")).toBe(true);
		expect(isValidDirection("xy")).toBe(false);
	});

	it("applyTheme inserts init comment when theme provided", () => {
		const d = "flowchart TD\nA-->B";
		expect(applyTheme(d, "dark")).toContain("%%{init");
		expect(applyTheme(d)).toBe(d);
	});

	it("isCommonTheme recognizes known themes", () => {
		expect(isCommonTheme("dark")).toBe(true);
		expect(isCommonTheme("unknown")).toBe(false);
	});
});
