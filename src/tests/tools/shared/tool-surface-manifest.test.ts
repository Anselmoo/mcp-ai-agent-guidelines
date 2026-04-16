import { afterEach, describe, expect, it } from "vitest";
import {
	computeEffectiveHiddenTools,
	filterHiddenTools,
	getHiddenToolNames,
	isToolHidden,
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
