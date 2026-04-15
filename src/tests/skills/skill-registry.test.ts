import { describe, expect, it, vi } from "vitest";
import { createSkillModule } from "../../skills/create-skill-module.js";
import { SkillRegistry } from "../../skills/skill-registry.js";
import {
	createMockManifest,
	createMockSkillResult,
	createMockWorkflowRuntime,
	createWorkspaceReaderStub,
} from "./test-helpers.js";

describe("skill-registry", () => {
	it("indexes supplied modules by skill ID", () => {
		const first = createSkillModule(createMockManifest({ id: "skill-a" }), {
			execute: async (_input, context) => createMockSkillResult(context),
		});
		const second = createSkillModule(createMockManifest({ id: "skill-b" }), {
			execute: async (_input, context) => createMockSkillResult(context),
		});

		const registry = new SkillRegistry({ modules: [first, second] });

		expect(registry.getAll().map((module) => module.manifest.id)).toEqual([
			"skill-a",
			"skill-b",
		]);
		expect(registry.getById("skill-b")).toBe(second);
	});

	it("injects the configured resolver and workspace into skill execution", async () => {
		const manifest = createMockManifest({ id: "registry-skill" });
		const handler = {
			execute: vi.fn(async (_input, context) =>
				createMockSkillResult(context, {
					summary: String(
						await context.runtime.workspace?.readFile("README.md"),
					),
				}),
			),
		};
		const resolver = { resolve: vi.fn(() => handler) };
		const workspace = createWorkspaceReaderStub();
		const registry = new SkillRegistry({
			modules: [createSkillModule(manifest)],
			resolver,
			workspace,
		});

		const result = await registry.execute(
			manifest.id,
			{ request: "inspect workspace" },
			createMockWorkflowRuntime(),
		);

		expect(resolver.resolve).toHaveBeenCalledWith(manifest);
		expect(handler.execute).toHaveBeenCalledOnce();
		expect(result.summary).toBe("stub content");
	});

	it("allows workspace access to be disabled explicitly", async () => {
		const manifest = createMockManifest({ id: "no-workspace-skill" });
		const handler = {
			execute: vi.fn(async (_input, context) =>
				createMockSkillResult(context, {
					summary: String(context.runtime.workspace),
				}),
			),
		};
		const registry = new SkillRegistry({
			modules: [createSkillModule(manifest)],
			resolver: { resolve: () => handler },
			workspace: null,
		});

		const result = await registry.execute(
			manifest.id,
			{ request: "run without workspace" },
			createMockWorkflowRuntime(),
		);

		expect(result.summary).toBe("undefined");
	});

	it("throws for unknown skill IDs", async () => {
		const registry = new SkillRegistry({ modules: [] });

		await expect(
			registry.execute(
				"missing-skill",
				{ request: "unknown skill" },
				createMockWorkflowRuntime(),
			),
		).rejects.toThrow("Unknown hidden skill: missing-skill");
	});
});
