import { describe, expect, it } from "vitest";
import type { SkillHandler } from "../../../skills/runtime/contracts.js";
import { DefaultSkillResolver } from "../../../skills/runtime/default-skill-resolver.js";
import { metadataSkillHandler } from "../../../skills/runtime/metadata-skill-handler.js";
import {
	createMockManifest,
	createMockSkillExecutionContext,
	createMockSkillResult,
} from "../test-helpers.js";

describe("default-skill-resolver", () => {
	it("resolves exact ID registrations before fallback", () => {
		const exactHandler: SkillHandler = {
			execute: async (_input, context) =>
				createMockSkillResult(context, { summary: "exact match" }),
		};
		const resolver = new DefaultSkillResolver();
		resolver.register("target-skill", exactHandler);

		expect(resolver.resolve(createMockManifest({ id: "target-skill" }))).toBe(
			exactHandler,
		);
	});

	it("supports predicate registrations in insertion order", async () => {
		const firstHandler: SkillHandler = {
			execute: async (_input, context) =>
				createMockSkillResult(context, { summary: "first" }),
		};
		const secondHandler: SkillHandler = {
			execute: async (_input, context) =>
				createMockSkillResult(context, { summary: "second" }),
		};
		const resolver = new DefaultSkillResolver();
		resolver.register((manifest) => manifest.domain === "gov", firstHandler);
		resolver.register((manifest) => manifest.domain === "gov", secondHandler);

		const resolved = resolver.resolve(createMockManifest({ domain: "gov" }));
		const result = await resolved.execute(
			{ request: "governance review" },
			createMockSkillExecutionContext(),
		);

		expect(resolved).toBe(firstHandler);
		expect(result.summary).toBe("first");
	});

	it("returns the fallback handler when nothing matches", () => {
		const resolver = new DefaultSkillResolver();

		expect(resolver.resolve(createMockManifest({ id: "missing" }))).toBe(
			metadataSkillHandler,
		);
	});
});
