import { describe, expect, it } from "vitest";
import type { InstructionModule } from "../../contracts/runtime.js";
import { InstructionRegistry } from "../../instructions/instruction-registry.js";
import { buildPublicToolSurface } from "../../tools/tool-surface.js";

function makeModule(
	overrides: Partial<InstructionModule["manifest"]> = {},
): InstructionModule {
	return {
		manifest: {
			id: "fixture-instruction",
			toolName: "fixture-instruction",
			displayName: "Fixture Instruction",
			description: "A fixture instruction for branch coverage.",
			sourcePath: "fixture.ts",
			mission: "Cover the fixture branch.",
			inputSchema: { type: "object", properties: {} },
			workflow: { kind: "serial", label: "fixture", steps: [] },
			chainTo: [],
			preferredModelClass: "cheap",
			...overrides,
		},
		execute: async () => {
			throw new Error("not implemented in fixture");
		},
	} as InstructionModule;
}

function fakeRegistry(
	workflowModules: InstructionModule[],
	discoveryModules: InstructionModule[] = [],
): InstructionRegistry {
	return {
		getWorkflowFirst: () => workflowModules,
		getBoundedDiscovery: () => discoveryModules,
	} as unknown as InstructionRegistry;
}

describe("tool-surface", () => {
	it("builds public tools directly from the instruction registry", () => {
		const tools = buildPublicToolSurface(new InstructionRegistry());

		expect(tools.length).toBeGreaterThan(0);
		expect(tools.every((tool) => tool.inputSchema.type === "object")).toBe(
			true,
		);
		expect(tools.every((tool) => tool.annotations?.readOnlyHint === true)).toBe(
			true,
		);
		expect(tools.some((tool) => tool.name === "feature-implement")).toBe(true);
		expect(tools.some((tool) => tool.description.includes("Focus:"))).toBe(
			true,
		);
	});

	it("exposes preferredModelClass on every tool annotation", () => {
		const tools = buildPublicToolSurface(new InstructionRegistry());
		const validModelClasses = new Set(["free", "cheap", "strong", "reviewer"]);

		for (const tool of tools) {
			expect(
				tool.annotations,
				`Tool ${tool.name} should have annotations`,
			).toBeDefined();
			expect(
				tool.annotations?.preferredModelClass,
				`Tool ${tool.name} should have preferredModelClass annotation`,
			).toBeDefined();
			expect(
				validModelClasses.has(tool.annotations?.preferredModelClass as string),
				`Tool ${tool.name} preferredModelClass "${tool.annotations?.preferredModelClass}" is not a valid ModelClass`,
			).toBe(true);
		}
	});

	it("workflow tools carry surfaceCategory workflow and discovery tools carry surfaceCategory discovery", () => {
		const tools = buildPublicToolSurface(new InstructionRegistry());

		const workflowTools = tools.filter(
			(t) => t.annotations?.surfaceCategory === "workflow",
		);
		const discoveryTools = tools.filter(
			(t) => t.annotations?.surfaceCategory === "discovery",
		);

		// Both categories must be present
		expect(workflowTools.length).toBeGreaterThan(0);
		expect(discoveryTools.length).toBeGreaterThan(0);

		// Every tool must be in exactly one category
		expect(workflowTools.length + discoveryTools.length).toBe(tools.length);
	});

	it("omits the Focus segment when mission is blank or whitespace-only", () => {
		const module = makeModule({ mission: "   " });
		const [tool] = buildPublicToolSurface(fakeRegistry([module]));

		expect(tool.description).not.toContain("Focus:");
	});

	it("omits the Related lanes segment when chainTo is empty", () => {
		const module = makeModule({ chainTo: [] });
		const [tool] = buildPublicToolSurface(fakeRegistry([module]));

		expect(tool.description).not.toContain("Related lanes:");
	});

	it("includes the Preconditions segment when requiredPreconditions is non-empty", () => {
		// Note: buildToolDescription re-reads `requiredPreconditions ?? []` inside
		// this branch (tool-surface.ts line 31) purely defensively — by the time
		// we're here the outer guard already proved the array is defined and
		// non-empty, so that inner `?? []` fallback is unreachable and cannot be
		// exercised by any input.
		const module = makeModule({
			requiredPreconditions: ["task-bootstrap", "meta-routing"],
		});
		const [tool] = buildPublicToolSurface(fakeRegistry([module]));

		expect(tool.description).toContain(
			"Preconditions: `task-bootstrap`, `meta-routing`",
		);
	});

	it("omits the Preconditions segment when requiredPreconditions is undefined or empty", () => {
		const undefinedModule = makeModule({ requiredPreconditions: undefined });
		const emptyModule = makeModule({ requiredPreconditions: [] });
		const [undefinedTool, emptyTool] = buildPublicToolSurface(
			fakeRegistry([undefinedModule, emptyModule]),
		);

		expect(undefinedTool.description).not.toContain("Preconditions:");
		expect(emptyTool.description).not.toContain("Preconditions:");
	});

	it("omits the Reactivation segment when reactivationPolicy is undefined", () => {
		const module = makeModule({ reactivationPolicy: undefined });
		const [tool] = buildPublicToolSurface(fakeRegistry([module]));

		expect(tool.description).not.toContain("Reactivation:");
	});

	it("includes the Reactivation segment when reactivationPolicy is set", () => {
		const module = makeModule({ reactivationPolicy: "once" });
		const [tool] = buildPublicToolSurface(fakeRegistry([module]));

		expect(tool.description).toContain("Reactivation: `once`");
	});

	it("omits the Auto-chain segment when autoChainOnCompletion is falsy", () => {
		const module = makeModule({ autoChainOnCompletion: false });
		const [tool] = buildPublicToolSurface(fakeRegistry([module]));

		expect(tool.description).not.toContain("Auto-chain:");
	});

	it("includes the Auto-chain segment when autoChainOnCompletion is true", () => {
		const module = makeModule({ autoChainOnCompletion: true });
		const [tool] = buildPublicToolSurface(fakeRegistry([module]));

		expect(tool.description).toContain(
			"Auto-chain: invokes the highest-confidence downstream lane on completion.",
		);
	});

	it("truncates Related lanes to the first three chainTo entries", () => {
		const module = makeModule({
			chainTo: ["alpha", "beta", "gamma", "delta"],
		});
		const [tool] = buildPublicToolSurface(fakeRegistry([module]));

		expect(tool.description).toContain(
			"Related lanes: `alpha`, `beta`, `gamma`",
		);
		expect(tool.description).not.toContain("`delta`");
	});

	it("assembles all description segments together when every optional field is present", () => {
		const module = makeModule({
			mission: "Ship the fixture safely.",
			chainTo: ["next-lane"],
			requiredPreconditions: ["task-bootstrap"],
			reactivationPolicy: "periodic",
			autoChainOnCompletion: true,
		});
		const [tool] = buildPublicToolSurface(fakeRegistry([module]));

		expect(tool.description).toContain("Focus: Ship the fixture safely.");
		expect(tool.description).toContain("Related lanes: `next-lane`");
		expect(tool.description).toContain("Preconditions: `task-bootstrap`");
		expect(tool.description).toContain("Reactivation: `periodic`");
		expect(tool.description).toContain("Auto-chain:");
	});
});
