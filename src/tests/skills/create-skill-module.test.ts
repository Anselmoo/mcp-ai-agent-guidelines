import { describe, expect, it, vi } from "vitest";
import { createSkillModule } from "../../skills/create-skill-module.js";
import { defaultSkillResolver } from "../../skills/runtime/default-skill-resolver.js";
import {
	createMockManifest,
	createMockSkillExecutionContext,
	createMockSkillResult,
	createMockSkillRuntime,
} from "./test-helpers.js";

describe("create-skill-module", () => {
	it("uses the explicit handler when one is provided", async () => {
		const manifest = createMockManifest({ id: "explicit-skill" });
		const handler = {
			execute: vi.fn(async (input, context) =>
				createMockSkillResult(context, {
					summary: `Handled ${input.request}`,
				}),
			),
		};

		const module = createSkillModule(manifest, handler);
		const input = { request: "inspect the request" };
		const runtime = createMockSkillRuntime();
		const result = await module.run(input, runtime);

		expect(handler.execute).toHaveBeenCalledOnce();
		const [receivedInput, context] = handler.execute.mock.calls[0];
		expect(receivedInput).toEqual(input);
		expect(context).toMatchObject({
			skillId: manifest.id,
			manifest,
			input,
			runtime,
		});
		expect(result.summary).toBe("Handled inspect the request");
	});

	it("uses a runtime-provided resolver when no explicit handler is baked in", async () => {
		const manifest = createMockManifest({ id: "runtime-resolved-skill" });
		const expectedContext = createMockSkillExecutionContext({ manifest });
		const resolvedHandler = {
			execute: vi.fn(async (_input, context) =>
				createMockSkillResult(context, {
					summary: "Resolved at runtime",
				}),
			),
		};
		const resolveSkillHandler = vi.fn(() => resolvedHandler);
		const module = createSkillModule(manifest);
		const runtime = {
			...createMockSkillRuntime(),
			resolveSkillHandler,
		};

		const result = await module.run(expectedContext.input, runtime);

		expect(resolveSkillHandler).toHaveBeenCalledWith(manifest);
		expect(resolvedHandler.execute).toHaveBeenCalledOnce();
		expect(result.summary).toBe("Resolved at runtime");
	});

	it("falls back to the default resolver when no explicit or runtime handler exists", async () => {
		const manifest = createMockManifest({ id: "default-resolved-skill" });
		const fallbackHandler = {
			execute: vi.fn(async (_input, context) =>
				createMockSkillResult(context, {
					summary: "Resolved by default resolver",
				}),
			),
		};
		const resolveSpy = vi
			.spyOn(defaultSkillResolver, "resolve")
			.mockReturnValue(fallbackHandler);

		try {
			const module = createSkillModule(manifest);
			const result = await module.run(
				{ request: "use fallback" },
				createMockSkillRuntime(),
			);

			expect(resolveSpy).toHaveBeenCalledWith(manifest);
			expect(result.summary).toBe("Resolved by default resolver");
		} finally {
			resolveSpy.mockRestore();
		}
	});
});
