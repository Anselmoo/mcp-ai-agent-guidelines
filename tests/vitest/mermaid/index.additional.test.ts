import { afterEach, describe, expect, it, vi } from "vitest";
import { FlowchartHandler } from "../../../src/tools/mermaid/handlers/index.js";
import {
	generateDiagram,
	mermaidDiagramGenerator,
	normalizeLegacyTypes,
} from "../../../src/tools/mermaid/index.js";
import * as accessibility from "../../../src/tools/mermaid/utils/accessibility.utils.js";
import * as repairUtils from "../../../src/tools/mermaid/utils/repair.utils.js";
import * as validator from "../../../src/tools/mermaid/validator.js";
import { __setMermaidModuleProvider } from "../../../src/tools/mermaid/validator.js";

describe("mermaid index additional", () => {
	afterEach(() => {
		__setMermaidModuleProvider(null);
		vi.restoreAllMocks();
	});

	it("normalizes legacy types correctly", () => {
		expect(normalizeLegacyTypes({ diagramType: "erDiagram" }) as any).toEqual({
			diagramType: "er",
		});
		expect(normalizeLegacyTypes({ diagramType: "graph" }) as any).toEqual({
			diagramType: "flowchart",
		});
		expect(normalizeLegacyTypes({ diagramType: "userJourney" }) as any).toEqual(
			{ diagramType: "journey" },
		);
		expect(normalizeLegacyTypes({ diagramType: "gitgraph" }) as any).toEqual({
			diagramType: "git-graph",
		});
		expect(normalizeLegacyTypes({ diagramType: "gitGraph" }) as any).toEqual({
			diagramType: "git-graph",
		});

		// no-op cases
		expect(normalizeLegacyTypes(null)).toBeNull();
		expect(normalizeLegacyTypes({})).toEqual({});
	});

	it("generateDiagram throws for unknown types", () => {
		expect(() =>
			generateDiagram({
				diagramType: "nope" as any,
				description: "",
				theme: "",
				strict: false,
				repair: false,
			}),
		).toThrow(/Unknown diagram type/);
	});

	it("passes direction into advancedFeatures for flowchart handler", () => {
		// Spy on Flowchart handler generate
		const spy = vi
			.spyOn(FlowchartHandler.prototype, "generate")
			.mockImplementation(() => "graph TD\nA-->B");

		const out = generateDiagram({
			diagramType: "flowchart",
			description: "A-->B",
			theme: "",
			strict: false,
			repair: false,
			direction: "LR",
		});

		expect(spy).toHaveBeenCalled();
		// Check advancedFeatures argument included direction
		const args = spy.mock.calls[0];
		expect(args[2]).toMatchObject({ direction: "LR" });
		expect(out).toContain("A-->B");
	});

	it("mermaidDiagramGenerator uses repair when initial validation fails and repair succeeds", async () => {
		// Use a simple provider so handlers generate without hitting real mermaid
		__setMermaidModuleProvider(() => (code: string) => true);

		const validateSpy = vi
			.spyOn(validator, "validateDiagram")
			.mockResolvedValueOnce({ valid: false })
			.mockResolvedValueOnce({ valid: true });
		const repairSpy = vi
			.spyOn(repairUtils, "repairDiagram")
			.mockReturnValue("repaired-diagram");

		const input = {
			diagramType: "flowchart",
			description: "A-->B",
			theme: "",
			strict: false,
			repair: true,
			accTitle: undefined,
			accDescr: undefined,
			direction: undefined,
		};

		const res = await mermaidDiagramGenerator(input as any);
		expect(repairSpy).toHaveBeenCalled();
		expect(validateSpy).toHaveBeenCalledTimes(2);
		expect(res.content[0].text).toContain("(after auto-repair)");
	});

	it("mermaidDiagramGenerator falls back to minimal diagram when strict and invalid", async () => {
		__setMermaidModuleProvider(() => (code: string) => true);

		vi.spyOn(validator, "validateDiagram").mockResolvedValue({ valid: false });
		const fallbackSpy = vi
			.spyOn(repairUtils, "fallbackDiagram")
			.mockReturnValue("fallback-diagram");
		vi.spyOn(validator, "validateDiagram")
			.mockResolvedValueOnce({ valid: false })
			.mockResolvedValueOnce({ valid: true });

		const input = {
			diagramType: "flowchart",
			description: "A-->B",
			theme: "",
			strict: true,
			repair: false,
		};

		const res = await mermaidDiagramGenerator(input as any);
		expect(fallbackSpy).toHaveBeenCalled();
		expect(res.content[0].text).toContain("fallback-diagram");
	});

	it("includes accessibility comments when provided", async () => {
		__setMermaidModuleProvider(() => (code: string) => true);
		vi.spyOn(validator, "validateDiagram").mockResolvedValue({ valid: true });
		vi.spyOn(accessibility, "prepareAccessibilityComments").mockReturnValue(
			"%% ACC COMMENTS %%",
		);

		const input = {
			diagramType: "flowchart",
			description: "A-->B",
			theme: "",
			strict: false,
			repair: false,
			accTitle: "Title",
			accDescr: "Desc",
		};

		const res = await mermaidDiagramGenerator(input as any);
		expect(res.content[0].text).toContain("%% ACC COMMENTS %%");
	});

	it("reports skipped validation when validator indicates skipped", async () => {
		__setMermaidModuleProvider(() => (code: string) => true);
		vi.spyOn(validator, "validateDiagram").mockResolvedValue({
			valid: true,
			skipped: true,
		});

		const input = {
			diagramType: "flowchart",
			description: "A-->B",
			theme: "",
			strict: false,
			repair: false,
		};

		const res = await mermaidDiagramGenerator(input as any);
		expect(res.content[0].text).toContain(
			"Validation skipped (mermaid not available)",
		);
	});

	it("returns feedback when invalid even after repair attempt", async () => {
		__setMermaidModuleProvider(() => (code: string) => true);
		vi.spyOn(validator, "validateDiagram")
			.mockResolvedValueOnce({ valid: false, error: "parse error" })
			.mockResolvedValueOnce({ valid: false, error: "parse error" });
		vi.spyOn(repairUtils, "repairDiagram").mockReturnValue("same-diagram");

		const input = {
			diagramType: "flowchart",
			description: "A-->B",
			theme: "",
			strict: false,
			repair: true,
		};

		const res = await mermaidDiagramGenerator(input as any);
		expect(res.content[0].text).toContain(
			"❌ Diagram invalid even after attempts: parse error",
		);
		expect(res.content[0].text).toContain("### Feedback Loop");
	});

	it("does not show repaired note when validation succeeds without repair", async () => {
		__setMermaidModuleProvider(() => (code: string) => true);
		vi.spyOn(validator, "validateDiagram").mockResolvedValue({ valid: true });

		const input = {
			diagramType: "flowchart",
			description: "A-->B",
			theme: "",
			strict: false,
			repair: false,
		};

		const res = await mermaidDiagramGenerator(input as any);
		expect(res.content[0].text).toContain("✅ Diagram validated successfully");
		expect(res.content[0].text).not.toContain("after auto-repair");
	});

	it("includes only title in accessibility block when accTitle provided", async () => {
		__setMermaidModuleProvider(() => (code: string) => true);
		vi.spyOn(validator, "validateDiagram").mockResolvedValue({ valid: true });

		const input = {
			diagramType: "flowchart",
			description: "A-->B",
			theme: "",
			strict: false,
			repair: false,
			accTitle: "OnlyTitle",
		};

		const res = await mermaidDiagramGenerator(input as any);
		expect(res.content[0].text).toContain("- Title: OnlyTitle");
		expect(res.content[0].text).not.toContain("- Description:");
	});

	it("includes only description in accessibility block when accDescr provided", async () => {
		__setMermaidModuleProvider(() => (code: string) => true);
		vi.spyOn(validator, "validateDiagram").mockResolvedValue({ valid: true });

		const input = {
			diagramType: "flowchart",
			description: "A-->B",
			theme: "",
			strict: false,
			repair: false,
			accDescr: "OnlyDesc",
		};

		const res = await mermaidDiagramGenerator(input as any);
		expect(res.content[0].text).toContain("- Description: OnlyDesc");
		expect(res.content[0].text).not.toContain("- Title:");
	});

	it("shows strict and repair flags in generation settings", async () => {
		__setMermaidModuleProvider(() => (code: string) => true);
		vi.spyOn(validator, "validateDiagram").mockResolvedValue({ valid: true });

		const input = {
			diagramType: "flowchart",
			description: "A-->B",
			theme: "",
			strict: true,
			repair: true,
		};

		const res = await mermaidDiagramGenerator(input as any);
		expect(res.content[0].text).toContain("Strict: true");
		expect(res.content[0].text).toContain("Repair: true");
	});
});
