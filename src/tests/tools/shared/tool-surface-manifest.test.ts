import { afterEach, describe, expect, it } from "vitest";
import {
	computeEffectiveHiddenTools,
	computeExternalToolDiagnostics,
	filterHiddenTools,
	getHiddenToolNames,
	isToolHidden,
	validateExternalToolSurface,
} from "../../../tools/shared/tool-surface-manifest.js";

const TOOLS = [
	{ name: "bootstrap" },
	{ name: "physics-analysis" },
	{ name: "enterprise" },
	{ name: "govern" },
] as const;

// Use explicit env overrides throughout to avoid leaking process.env.HIDDEN_TOOLS
describe("filterHiddenTools", () => {
	it("returns all tools when env is empty string", () => {
		expect(filterHiddenTools([...TOOLS], "")).toHaveLength(4);
	});

	it("removes a single named tool", () => {
		const result = filterHiddenTools([...TOOLS], "enterprise");
		expect(result.map((t) => t.name)).not.toContain("enterprise");
		expect(result).toHaveLength(3);
	});

	it("removes multiple comma-separated tools", () => {
		const result = filterHiddenTools([...TOOLS], "physics-analysis,govern");
		expect(result.map((t) => t.name)).toEqual(["bootstrap", "enterprise"]);
	});

	it("comparison is case-insensitive", () => {
		const result = filterHiddenTools([...TOOLS], "BOOTSTRAP,ENTERPRISE");
		expect(result.map((t) => t.name)).toEqual(["physics-analysis", "govern"]);
	});

	it("trims whitespace around tool names", () => {
		const result = filterHiddenTools([...TOOLS], " enterprise , govern ");
		expect(result.map((t) => t.name)).toEqual([
			"bootstrap",
			"physics-analysis",
		]);
	});

	it("returns an empty array when every tool is hidden", () => {
		const env = [...TOOLS].map((t) => t.name).join(",");
		expect(filterHiddenTools([...TOOLS], env)).toHaveLength(0);
	});

	it("preserves extra properties on rich tool objects", () => {
		const rich = [
			{ name: "bootstrap", description: "Bootstrap session", version: 2 },
		];
		const result = filterHiddenTools(rich, "enterprise");
		expect(result[0]?.description).toBe("Bootstrap session");
		expect(result[0]?.version).toBe(2);
	});
});

describe("isToolHidden", () => {
	it("returns true when the tool name appears in the hidden list", () => {
		expect(isToolHidden("enterprise", "bootstrap,enterprise")).toBe(true);
	});

	it("returns false when the tool name is absent from the hidden list", () => {
		expect(isToolHidden("bootstrap", "enterprise")).toBe(false);
	});

	it("is case-insensitive", () => {
		expect(isToolHidden("BOOTSTRAP", "bootstrap")).toBe(true);
	});

	it("returns false when env is an empty string", () => {
		expect(isToolHidden("bootstrap", "")).toBe(false);
	});
});

describe("getHiddenToolNames", () => {
	it("returns an empty set for an empty env string", () => {
		expect(getHiddenToolNames("").size).toBe(0);
	});

	it("returns lower-cased normalised tool names", () => {
		const names = getHiddenToolNames("BOOTSTRAP,Enterprise");
		expect(names.has("bootstrap")).toBe(true);
		expect(names.has("enterprise")).toBe(true);
		expect(names.size).toBe(2);
	});

	it("filters out empty entries produced by extra commas", () => {
		const names = getHiddenToolNames(",bootstrap,,govern,");
		expect(names.has("bootstrap")).toBe(true);
		expect(names.has("govern")).toBe(true);
		expect(names.size).toBe(2);
	});
});

describe("computeEffectiveHiddenTools", () => {
	const savedHidden = process.env.HIDDEN_TOOLS;
	const savedAdaptive = process.env.ENABLE_ADAPTIVE_ROUTING;

	afterEach(() => {
		if (savedHidden === undefined) delete process.env.HIDDEN_TOOLS;
		else process.env.HIDDEN_TOOLS = savedHidden;
		if (savedAdaptive === undefined) delete process.env.ENABLE_ADAPTIVE_ROUTING;
		else process.env.ENABLE_ADAPTIVE_ROUTING = savedAdaptive;
	});

	it("includes adapt when ENABLE_ADAPTIVE_ROUTING is not set", () => {
		delete process.env.HIDDEN_TOOLS;
		delete process.env.ENABLE_ADAPTIVE_ROUTING;
		const result = computeEffectiveHiddenTools();
		expect(result).toBe("routing-adapt");
	});

	it("excludes adapt when ENABLE_ADAPTIVE_ROUTING is true", () => {
		delete process.env.HIDDEN_TOOLS;
		process.env.ENABLE_ADAPTIVE_ROUTING = "true";
		const result = computeEffectiveHiddenTools();
		expect(result).toBe("");
	});

	it("combines HIDDEN_TOOLS with adapt when routing is disabled", () => {
		process.env.HIDDEN_TOOLS = "enterprise,govern";
		delete process.env.ENABLE_ADAPTIVE_ROUTING;
		const result = computeEffectiveHiddenTools();
		expect(result).toBe("enterprise,govern,routing-adapt");
	});

	it("returns only HIDDEN_TOOLS when routing is enabled", () => {
		process.env.HIDDEN_TOOLS = "enterprise";
		process.env.ENABLE_ADAPTIVE_ROUTING = "true";
		const result = computeEffectiveHiddenTools();
		expect(result).toBe("enterprise");
	});
});

describe("validateExternalToolSurface", () => {
	it("returns empty array when no allowlist is configured", () => {
		const result = validateExternalToolSurface(["unknown-tool"], {});
		expect(result).toEqual([]);
	});

	it("returns empty array when all tools match the allowlist", () => {
		const result = validateExternalToolSurface(
			["github-pull-request_create", "memory_read"],
			{ EXPECTED_EXTERNAL_TOOLS: "github-pull-request_,memory_" },
		);
		expect(result).toEqual([]);
	});

	it("returns warnings for unrecognised tools", () => {
		const result = validateExternalToolSurface(
			["unknown-tool", "github-pull-request_create"],
			{
				EXPECTED_EXTERNAL_TOOLS: "github-pull-request_",
			},
		);
		expect(result).toHaveLength(1);
		expect(result[0]).toContain("unknown-tool");
	});

	it("matches exact names as well as prefixes", () => {
		const result = validateExternalToolSurface(["memory"], {
			EXPECTED_EXTERNAL_TOOLS: "memory",
		});
		expect(result).toEqual([]);
	});

	it("throws on first warning when STRICT_TOOL_SURFACE is true", () => {
		expect(() =>
			validateExternalToolSurface(["rogue-tool"], {
				EXPECTED_EXTERNAL_TOOLS: "github-pull-request_",
				STRICT_TOOL_SURFACE: "true",
			}),
		).toThrow("rogue-tool");
	});
});

describe("computeExternalToolDiagnostics", () => {
	it("reports allowlistConfigured=false when no EXPECTED_EXTERNAL_TOOLS env", () => {
		const diag = computeExternalToolDiagnostics(["tool-a"], {});
		expect(diag.allowlistConfigured).toBe(false);
		expect(diag.unrecognised).toEqual([]);
		expect(diag.totalExternal).toBe(1);
		expect(diag.strictMode).toBe(false);
	});

	it("reports unrecognised tools when allowlist is set", () => {
		const diag = computeExternalToolDiagnostics(
			["rogue", "github-pull-request_foo"],
			{
				EXPECTED_EXTERNAL_TOOLS: "github-pull-request_",
			},
		);
		expect(diag.allowlistConfigured).toBe(true);
		expect(diag.unrecognised).toContain("rogue");
		expect(diag.unrecognised).not.toContain("github-pull-request_foo");
	});

	it("reports strictMode=true when STRICT_TOOL_SURFACE is set", () => {
		const diag = computeExternalToolDiagnostics([], {
			EXPECTED_EXTERNAL_TOOLS: "foo_",
			STRICT_TOOL_SURFACE: "true",
		});
		expect(diag.strictMode).toBe(true);
	});
});
