/**
 * svg-export.test.ts — SVG export engine tests.
 *
 * Verifies that the SVG helper integrations are exercised without throwing and
 * produce expected output shapes.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import {
	buildArcPath,
	buildD3PathPolyline,
	buildLinePath,
	createRoughLine,
	createSvgDocument,
	generateSvgFromElement,
	NoopSvgExportEngine,
	SvgExportEngine,
	SvgExporter,
} from "../../visualization/svg-export.js";

afterEach(() => {
	vi.restoreAllMocks();
	vi.resetModules();
	vi.doUnmock("roughjs");
	vi.doUnmock("satori");
});

async function importSvgExportWithMocks(options?: {
	roughLineSets?: Array<{ type: string; ops: unknown[] }>;
	roughLineError?: Error;
	roughPath?: string;
	satoriResult?: string;
	satoriError?: Error;
}) {
	vi.resetModules();
	vi.doMock("roughjs", () => ({
		default: {
			generator: () => ({
				line: () => {
					if (options?.roughLineError) {
						throw options.roughLineError;
					}
					return {
						sets: options?.roughLineSets ?? [{ type: "path", ops: [] }],
					};
				},
				opsToPath: () => options?.roughPath ?? "M0 0L10 10",
			}),
		},
	}));
	vi.doMock("satori", () => ({
		default: vi.fn(async () => {
			if (options?.satoriError) {
				throw options.satoriError;
			}
			return options?.satoriResult ?? '<svg data-source="mocked-satori"></svg>';
		}),
	}));
	return await import("../../visualization/svg-export.js");
}

describe("buildLinePath (d3-shape + d3-path)", () => {
	it("returns a non-empty string containing 'M' for two points", () => {
		const result = buildLinePath([
			[0, 0],
			[100, 100],
		]);
		expect(typeof result).toBe("string");
		expect(result.length).toBeGreaterThan(0);
		expect(result).toContain("M");
	});

	it("handles a single point gracefully", () => {
		const result = buildLinePath([[0, 0]]);
		expect(typeof result).toBe("string");
	});

	it("handles three collinear points", () => {
		const result = buildLinePath([
			[0, 0],
			[50, 50],
			[100, 100],
		]);
		expect(result).toContain("M");
	});
});

describe("buildArcPath (d3-shape)", () => {
	it("returns a non-empty string for a semicircle", () => {
		const result = buildArcPath(0, 50, 0, Math.PI);
		expect(typeof result).toBe("string");
		expect(result.length).toBeGreaterThan(0);
	});

	it("returns a non-empty string for a full circle arc", () => {
		const result = buildArcPath(20, 50, 0, 2 * Math.PI);
		expect(result.length).toBeGreaterThan(0);
	});

	it("returns a non-empty string for a donut arc", () => {
		const result = buildArcPath(20, 50, 0, Math.PI / 2);
		expect(result.length).toBeGreaterThan(0);
	});
});

describe("buildD3PathPolyline (d3-path)", () => {
	it("returns a path string starting with M for multiple points", () => {
		const result = buildD3PathPolyline([
			[0, 0],
			[50, 50],
			[100, 0],
		]);
		expect(result).toMatch(/^M/);
		expect(result).toContain("L");
	});

	it("returns empty string for no points", () => {
		const result = buildD3PathPolyline([]);
		expect(result).toBe("");
	});
});

describe("createRoughLine (roughjs)", () => {
	it("returns a string and does not throw", () => {
		const result = createRoughLine(0, 0, 100, 100);
		expect(typeof result).toBe("string");
	});

	it("returns a non-empty path string for a valid line", () => {
		const result = createRoughLine(10, 20, 80, 90);
		// roughjs should produce a non-empty path in Node.js
		expect(result.length).toBeGreaterThan(0);
	});
});

describe("createSvgDocument (@svgdotjs/svg.js)", () => {
	it("returns a string", () => {
		const result = createSvgDocument(200, 100);
		expect(typeof result).toBe("string");
	});

	it("contains 'svg' in the output", () => {
		const result = createSvgDocument(300, 150);
		expect(result.toLowerCase()).toContain("svg");
	});
});

describe("generateSvgFromElement (satori)", () => {
	it("returns a string without throwing", async () => {
		const element = {
			type: "div",
			props: { children: "hello" },
		};
		const result = await generateSvgFromElement(element, 100, 50);
		expect(typeof result).toBe("string");
		expect(result.length).toBeGreaterThan(0);
		expect(result).toContain("hello");
	});

	it("renders text content instead of a placeholder comment", async () => {
		const element = { type: "span", props: { children: "wave10" } };
		const result = await generateSvgFromElement(element);
		expect(result.toLowerCase()).toContain("svg");
		expect(result).toContain("wave10");
		expect(result).not.toContain("satori: no fonts");
	});

	it("extracts nested text content and escapes special characters", async () => {
		const { generateSvgFromElement: generateSvgFromMockedModule } =
			await importSvgExportWithMocks({
				satoriError: new Error("fallback should bypass satori"),
			});
		const result = await generateSvgFromMockedModule(
			{
				type: "div",
				props: {
					children: [
						"top & <",
						{
							type: "span",
							props: { children: ["inner", ['quote"', "'", 7]] },
						},
						null,
					],
				},
			},
			180,
			60,
		);
		expect(result).toContain("top &amp; &lt; inner quote&quot; &#39; 7");
	});

	it("returns mocked satori output when no fallback text is available", async () => {
		const { generateSvgFromElement: generateSvgFromMockedModule } =
			await importSvgExportWithMocks({
				satoriResult: '<svg data-source="satori-success"></svg>',
			});
		const result = await generateSvgFromMockedModule(
			{ type: "div", props: {} },
			120,
			40,
		);
		expect(result).toContain('data-source="satori-success"');
	});

	it("wraps satori failures with a helpful error message", async () => {
		const { generateSvgFromElement: generateSvgFromMockedModule } =
			await importSvgExportWithMocks({
				satoriError: new Error("font registry unavailable"),
			});
		await expect(
			generateSvgFromMockedModule({ type: "div", props: {} }),
		).rejects.toThrow(
			"Unable to render SVG element with satori: font registry unavailable",
		);
	});
});

describe("SvgExporter class", () => {
	const exporter = new SvgExporter();

	it("instantiates without throwing", () => {
		expect(exporter).toBeDefined();
	});

	it("linePath returns a string with M", () => {
		const result = exporter.linePath([
			[0, 0],
			[100, 100],
		]);
		expect(result).toContain("M");
	});

	it("arcPath returns a non-empty string", () => {
		const result = exporter.arcPath(0, 40, 0, Math.PI);
		expect(result.length).toBeGreaterThan(0);
	});

	it("roughLine returns a string", () => {
		const result = exporter.roughLine(0, 0, 50, 50);
		expect(typeof result).toBe("string");
	});

	it("svgDocument returns a string containing svg", () => {
		const result = exporter.svgDocument(100, 100);
		expect(result.toLowerCase()).toContain("svg");
	});

	it("generateFromElement returns a string", async () => {
		const result = await exporter.generateFromElement({
			type: "div",
			props: { children: "x" },
		});
		expect(typeof result).toBe("string");
	});
});

describe("SvgExportEngine class", () => {
	const engine = new SvgExportEngine();

	it("instantiates without throwing", () => {
		expect(engine).toBeDefined();
	});

	it("generateAgentTopologyDiagram returns an SVG string", async () => {
		const result = await engine.generateAgentTopologyDiagram([
			"agent-a",
			"agent-b",
			"agent-c",
		]);
		expect(result.toLowerCase()).toContain("svg");
		expect(result).toContain("agent-a");
	});

	it("generateOrchestrationFlowDiagram renders step labels into the SVG", async () => {
		const result = await engine.generateOrchestrationFlowDiagram([
			"step-1",
			"step-2",
		]);
		expect(result.toLowerCase()).toContain("svg");
		expect(result).toContain("Workflow steps");
		expect(result).toContain("step-1");
		expect(result).not.toBe(
			'<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80"></svg>',
		);
	});

	it("generateSkillCoverageDiagram returns an SVG string", async () => {
		const result = await engine.generateSkillCoverageDiagram(
			Array.from({ length: 30 }, (_, i) => `skill-${i}`),
		);
		expect(result.toLowerCase()).toContain("svg");
		expect(result).toContain("Skill coverage");
		expect(result).toContain("skill-0");
	});

	it("returns an empty-state shell for agent topology with no agents", async () => {
		const result = await engine.generateAgentTopologyDiagram([]);
		expect(result).toContain('viewBox="0 0 260 72"');
		expect(result).toContain('role="img"');
		expect(result).toContain("No agents supplied");
	});

	it("returns an empty-state shell for orchestration flow with no steps", async () => {
		const result = await engine.generateOrchestrationFlowDiagram([]);
		expect(result).toContain('viewBox="0 0 260 72"');
		expect(result).toContain('role="img"');
		expect(result).toContain("No steps supplied");
	});

	it("shows fallback copy for skill coverage with no skills", async () => {
		const result = await engine.generateSkillCoverageDiagram([]);
		expect(result).toContain("Skill coverage");
		expect(result).toContain("No skills supplied");
		expect(result).toContain(">0</text>");
	});
});

describe("NoopSvgExportEngine class", () => {
	const engine = new NoopSvgExportEngine();

	it("returns a minimal topology SVG instead of a placeholder comment", async () => {
		const result = await engine.generateAgentTopologyDiagram(["alpha", "beta"]);
		expect(result.toLowerCase()).toContain("svg");
		expect(result).toContain("Agents (2)");
	});

	it("returns a minimal skill coverage SVG instead of a placeholder comment", async () => {
		const result = await engine.generateSkillCoverageDiagram(["skill-a"]);
		expect(result.toLowerCase()).toContain("svg");
		expect(result).toContain("1 of 102 skills");
	});

	it("renders orchestration flow labels with escaped content", async () => {
		const result = await engine.generateOrchestrationFlowDiagram([
			`plan & align`,
			`ship <review> "now" 'soon'`,
		]);
		expect(result).toContain('width="200"');
		expect(result).toContain("Workflow steps (2)");
		expect(result).toContain("plan &amp; align");
		expect(result).toContain(
			"ship &lt;review&gt; &quot;now&quot; &#39;soon&#39;",
		);
	});
});

describe("mocked svg-export edge cases", () => {
	it("returns an empty string when roughjs yields no path sets", async () => {
		const { createRoughLine: createRoughLineFromMockedModule } =
			await importSvgExportWithMocks({
				roughLineSets: [{ type: "fillSketch", ops: [] }],
			});
		expect(createRoughLineFromMockedModule(0, 0, 10, 10)).toBe("");
	});

	it("returns an empty string when roughjs throws", async () => {
		const { createRoughLine: createRoughLineFromMockedModule } =
			await importSvgExportWithMocks({
				roughLineError: new Error("rough generator failed"),
			});
		expect(createRoughLineFromMockedModule(0, 0, 10, 10)).toBe("");
	});
});
