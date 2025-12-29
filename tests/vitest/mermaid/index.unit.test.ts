import { afterEach, describe, expect, it, vi } from "vitest";
import {
	formatResponse,
	generateDiagram,
	mermaidDiagramGenerator,
	normalizeLegacyTypes,
} from "../../../src/tools/mermaid/index.js";
import type { MermaidDiagramInput } from "../../../src/tools/mermaid/types.js";
import * as repairUtils from "../../../src/tools/mermaid/utils/repair.utils.js";
import * as validator from "../../../src/tools/mermaid/validator.js";

describe("mermaid/index - orchestrator", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("normalizes legacy diagram type names", async () => {
		const cases: Array<[string, string]> = [
			["erDiagram", "er"],
			["graph", "flowchart"],
			["userJourney", "journey"],
			["gitgraph", "git-graph"],
			["gitGraph", "git-graph"],
		];

		for (const [legacy, expected] of cases) {
			const res = await mermaidDiagramGenerator({
				description: "X",
				diagramType: legacy,
			});
			expect(res.content[0].text).toContain(`Type: ${expected}`);
		}
	});

	it("prepends accessibility comments when provided", async () => {
		const res = await mermaidDiagramGenerator({
			description: "A -> B",
			diagramType: "flowchart",
			accTitle: "My Title",
			accDescr: "My description",
		});
		const text = res.content[0].text;
		expect(text).toContain("%% AccTitle: My Title");
		expect(text).toContain("%% AccDescr: My description");
		expect(text).toContain("Title: My Title");
		expect(text).toContain("Description: My description");
	});

	it("honors direction provided and passes it to the handler via advancedFeatures", async () => {
		const res = await mermaidDiagramGenerator({
			description: "A->B",
			diagramType: "flowchart",
			direction: "LR",
		});
		const text = res.content[0].text;
		expect(text).toContain("flowchart LR");
	});

	it("attempts auto-repair when validation fails and reports it", async () => {
		vi.spyOn(validator, "validateDiagram")
			.mockResolvedValueOnce({ valid: false, error: "bad" })
			.mockResolvedValueOnce({ valid: true });

		// Ensure the repair actually modifies the diagram so the repaired flag is set
		vi.spyOn(repairUtils, "repairDiagram").mockImplementation(
			(d: string) => `${d}\n%% repaired`,
		);

		const res = await mermaidDiagramGenerator({
			description: "x",
			diagramType: "flowchart",
			repair: true,
		});
		expect(res.content[0].text).toContain("(after auto-repair)");
	});

	it("falls back to minimal diagram when repair fails and strict is true", async () => {
		vi.spyOn(validator, "validateDiagram")
			.mockResolvedValueOnce({ valid: false, error: "bad" })
			.mockResolvedValueOnce({ valid: false, error: "still bad" })
			.mockResolvedValueOnce({ valid: true });

		const res = await mermaidDiagramGenerator({
			description: "x",
			diagramType: "flowchart",
			repair: true,
			strict: true,
		});
		expect(res.content[0].text).toContain("Fallback Diagram");
	});

	it("returns feedback when invalid and strict=false and repair=false", async () => {
		vi.spyOn(validator, "validateDiagram").mockResolvedValue({
			valid: false,
			error: "parse error",
		});

		const res = await mermaidDiagramGenerator({
			description: "x",
			diagramType: "flowchart",
			repair: false,
			strict: false,
		});
		const text = res.content[0].text;
		expect(text).toContain("❌ Diagram invalid even after attempts");
		expect(text).toContain("### Feedback Loop");
	});

	it("reports skipped validation when mermaid is not available", async () => {
		vi.spyOn(validator, "validateDiagram").mockResolvedValue({
			valid: true,
			skipped: true,
		});

		const res = await mermaidDiagramGenerator({
			description: "x",
			diagramType: "flowchart",
		});
		const text = res.content[0].text;
		expect(text).toContain("Validation skipped");
	});

	it("throws if handler is unknown (internal generateDiagram)", () => {
		const bogus = {
			description: "x",
			diagramType: "bogus",
		} as unknown as MermaidDiagramInput;
		expect(() => generateDiagram(bogus)).toThrow(/Unknown diagram type/);
	});

	it("normalizeLegacyTypes returns original for non-object and handles empty object", () => {
		expect(normalizeLegacyTypes(null)).toBeNull();
		const empty = {} as unknown;
		expect(normalizeLegacyTypes(empty)).toEqual(empty);
		const notLegacy = { diagramType: "flowchart" } as unknown;
		expect(normalizeLegacyTypes(notLegacy)).toEqual(notLegacy);
	});

	it("formatResponse handles skipped, repaired, and invalid cases", () => {
		const baseInput = {
			description: "x",
			diagramType: "flowchart",
			strict: false,
			repair: false,
		} as unknown as MermaidDiagramInput;

		const skipped = formatResponse(
			baseInput,
			"code",
			{ valid: true, skipped: true },
			false,
		);
		expect(skipped.content[0].text).toContain("Validation skipped");
		expect(skipped.content[0].text).not.toContain("### Feedback Loop");

		const repaired = formatResponse(baseInput, "code", { valid: true }, true);
		expect(repaired.content[0].text).toContain("(after auto-repair)");

		const invalid = formatResponse(
			baseInput,
			"code",
			{ valid: false, error: "bad" },
			false,
		);
		expect(invalid.content[0].text).toContain(
			"❌ Diagram invalid even after attempts",
		);
		expect(invalid.content[0].text).toContain("### Feedback Loop");
	});

	it("includes Title only when accTitle provided and not accDescr", () => {
		const input = {
			description: "x",
			diagramType: "flowchart",
			strict: false,
			repair: false,
			accTitle: "OnlyTitle",
		} as unknown as MermaidDiagramInput;
		const out = formatResponse(input, "code", { valid: true }, false);
		const t = out.content[0].text;
		expect(t).toContain("- Title: OnlyTitle");
		expect(t).not.toContain("- Description:");
	});

	it("includes Description only when accDescr provided and not accTitle", () => {
		const input = {
			description: "x",
			diagramType: "flowchart",
			strict: false,
			repair: false,
			accDescr: "OnlyDescr",
		} as unknown as MermaidDiagramInput;
		const out = formatResponse(input, "code", { valid: true }, false);
		const t = out.content[0].text;
		expect(t).toContain("- Description: OnlyDescr");
		expect(t).not.toContain("- Title:");
	});

	it("uses fallback accessibility text when none provided", () => {
		const input = {
			description: "x",
			diagramType: "flowchart",
			strict: false,
			repair: false,
		} as unknown as MermaidDiagramInput;
		const out = formatResponse(input, "code", { valid: true }, false);
		const t = out.content[0].text;
		expect(t).toContain(
			"- You can provide accTitle and accDescr to improve screen reader context.",
		);
	});
});
