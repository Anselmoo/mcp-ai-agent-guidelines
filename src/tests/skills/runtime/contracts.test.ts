import { describe, expect, expectTypeOf, it } from "vitest";
import type {
	SkillExecutionContext,
	SkillHandler,
	SkillResolver,
} from "../../../skills/runtime/contracts.js";
import {
	createMockManifest,
	createMockSkillExecutionContext,
	createMockSkillResult,
} from "../test-helpers.js";

describe("contracts", () => {
	it("describes the execution context passed to skill handlers", () => {
		const manifest = createMockManifest({ id: "contract-skill" });
		const context: SkillExecutionContext = createMockSkillExecutionContext({
			manifest,
		});

		expect(context.skillId).toBe(manifest.id);
		expect(context.model.modelClass).toBe(manifest.preferredModelClass);
		expectTypeOf(context.manifest.id).toBeString();
		expectTypeOf(context.input.request).toBeString();
	});

	it("describes handler and resolver interfaces", async () => {
		const handler: SkillHandler = {
			execute: async (_input, context) => createMockSkillResult(context),
		};
		const resolver: SkillResolver = {
			resolve: () => handler,
		};

		expectTypeOf(handler.execute).toBeFunction();
		expectTypeOf(resolver.resolve).toBeFunction();
		expect(
			await resolver
				.resolve(createMockManifest())
				.execute({ request: "run" }, createMockSkillExecutionContext()),
		).toMatchObject({
			executionMode: "capability",
		});
	});
});
