import { describe, expect, it } from "vitest";
import type { SerenaClient, SerenaResult } from "../../../serena/client.js";
import { resolveSymbolGrounding } from "../../../skills/shared/workspace-grounding.js";
import {
	createMockSkillExecutionContext,
	createMockSkillRuntime,
} from "../test-helpers.js";

function mockSerenaClient(): SerenaClient {
	return {
		async query(): Promise<SerenaResult> {
			return {
				kind: "advisory",
				suggestedTool: "mcp__serena__find_symbol",
				suggestedArgs: { name_path: "SkillExecutionRuntime" },
				rationale: "mock advisory",
			};
		},
		async close(): Promise<void> {
			// no-op
		},
	};
}

describe("serena grounding seam", () => {
	it("createMockSkillRuntime propagates serena when provided", () => {
		const serena = mockSerenaClient();
		const runtime = createMockSkillRuntime({ serena });
		expect(runtime.serena).toBe(serena);
	});

	it("createMockSkillRuntime leaves serena undefined when not provided", () => {
		const runtime = createMockSkillRuntime();
		expect(runtime.serena).toBeUndefined();
	});

	it("skill handler can read context.runtime.serena", async () => {
		const serena = mockSerenaClient();
		const context = createMockSkillExecutionContext({
			runtime: createMockSkillRuntime({ serena }),
		});
		const result = await context.runtime.serena?.query({
			kind: "find_symbol",
			namePath: "SkillExecutionRuntime",
		});
		expect(result?.kind).toBe("advisory");
	});
});

// ─── resolveSymbolGrounding ───────────────────────────────────────────────────

describe("resolveSymbolGrounding", () => {
	it("returns [] when context.runtime.serena is undefined", async () => {
		const context = createMockSkillExecutionContext({
			runtime: createMockSkillRuntime(),
		});
		const result = await resolveSymbolGrounding(context);
		expect(result).toEqual([]);
	});

	it("returns a RecommendationItem citing the symbol when serena returns DATA", async () => {
		const dataClient: SerenaClient = {
			async query(): Promise<SerenaResult> {
				return {
					kind: "data",
					tool: "find_symbol",
					data: {
						name: "resolveSerenaClient",
						relativePath: "src/serena/client.ts",
						kind: "function",
					},
				};
			},
			async close(): Promise<void> {
				// no-op
			},
		};
		const context = createMockSkillExecutionContext({
			input: { request: "debug the timeout in the scheduler module" },
			runtime: createMockSkillRuntime({ serena: dataClient }),
		});
		const result = await resolveSymbolGrounding(context);
		expect(result.length).toBeGreaterThan(0);
		const item = result[0];
		expect(item.groundingScope).toBe("workspace");
		expect(Array.isArray(item.evidenceAnchors)).toBe(true);
		expect(item.evidenceAnchors!.length).toBeGreaterThan(0);
		expect(item.title.length).toBeGreaterThan(0);
		expect(item.detail.length).toBeGreaterThan(0);
		expect(item.modelClass).toBeDefined();
	});

	it("returns a finding carrying the advisory hint when serena returns ADVISORY", async () => {
		const advisoryClient: SerenaClient = {
			async query(): Promise<SerenaResult> {
				return {
					kind: "advisory",
					suggestedTool: "mcp__serena__find_symbol",
					suggestedArgs: { name_path: "SkillExecutionRuntime" },
					rationale:
						"Resolve symbol via Serena LSP for accurate location data.",
				};
			},
			async close(): Promise<void> {
				// no-op
			},
		};
		const context = createMockSkillExecutionContext({
			input: { request: "find all uses of SkillExecutionRuntime" },
			runtime: createMockSkillRuntime({ serena: advisoryClient }),
		});
		const result = await resolveSymbolGrounding(context);
		expect(result.length).toBeGreaterThan(0);
		const item = result[0];
		expect(item.groundingScope).toBe("workspace");
		// Advisory items carry the rationale in detail
		expect(item.detail).toContain("Resolve symbol via Serena LSP");
	});

	it("returns [] and never throws when the mock serena query throws", async () => {
		const throwingClient: SerenaClient = {
			async query(): Promise<SerenaResult> {
				throw new Error("Serena connection refused");
			},
			async close(): Promise<void> {
				// no-op
			},
		};
		const context = createMockSkillExecutionContext({
			input: { request: "fix the crash in parseSkillInput" },
			runtime: createMockSkillRuntime({ serena: throwingClient }),
		});
		// Must never propagate — must return []
		await expect(resolveSymbolGrounding(context)).resolves.toEqual([]);
	});

	it("caps results at maxSymbols (default 3)", async () => {
		let callCount = 0;
		const multiDataClient: SerenaClient = {
			async query(): Promise<SerenaResult> {
				callCount++;
				return {
					kind: "data",
					tool: "find_symbol",
					data: {
						name: `symbol${callCount}`,
						relativePath: `src/x${callCount}.ts`,
					},
				};
			},
			async close(): Promise<void> {
				// no-op
			},
		};
		// Request with 5 CamelCase identifiers → seed extraction may find multiple
		const context = createMockSkillExecutionContext({
			input: {
				request:
					"investigate SkillHandler SkillModule SkillExecutionContext SkillResolver SkillRegistry",
			},
			runtime: createMockSkillRuntime({ serena: multiDataClient }),
		});
		const result = await resolveSymbolGrounding(context);
		expect(result.length).toBeLessThanOrEqual(3);
	});
});
