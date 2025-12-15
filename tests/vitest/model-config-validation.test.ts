/**
 * Tests for the DEFAULT_MODEL_SLUG validation error path in model-config.ts
 * This file must be isolated because the validation happens at module load time.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("model-config.ts DEFAULT_MODEL_SLUG validation error path", () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it("should throw an error when defaultSlug is not a valid Provider", async () => {
		// First, mock the model-loader module to return an invalid slug
		vi.doMock("../../src/tools/config/model-loader.js", async () => {
			// Get the actual implementation to preserve other exports
			const actual = await vi.importActual<
				typeof import("../../src/tools/config/model-loader.js")
			>("../../src/tools/config/model-loader.js");
			return {
				...actual,
				// Override getDefaultModelSlug to return an invalid value
				getDefaultModelSlug: () => "invalid-model-slug-not-in-enum",
			};
		});

		// Now import model-config.ts which will trigger the validation
		// The validation at lines 38-42 should throw an error
		await expect(
			import("../../src/tools/config/model-config.js"),
		).rejects.toThrow(
			/Invalid default model slug "invalid-model-slug-not-in-enum"/,
		);

		vi.doUnmock("../../src/tools/config/model-loader.js");
	});

	it("should successfully export DEFAULT_MODEL_SLUG when slug is valid", async () => {
		// Import model-config without any mocking - should succeed
		const { DEFAULT_MODEL_SLUG } = await import(
			"../../src/tools/config/model-config.js"
		);

		// Verify it is a valid slug
		expect(typeof DEFAULT_MODEL_SLUG).toBe("string");
		expect(DEFAULT_MODEL_SLUG.length).toBeGreaterThan(0);
		expect(DEFAULT_MODEL_SLUG).toBe("gpt-5-codex");
	});
});
