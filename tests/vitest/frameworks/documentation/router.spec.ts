import { describe, expect, it, vi } from "vitest";

vi.mock(
	"../../../../src/tools/prompt/documentation-generator-prompt-builder.js",
	() => ({
		documentationGeneratorPromptBuilder: vi
			.fn()
			.mockResolvedValue({ content: [{ type: "text", text: "ok" }] }),
	}),
);
vi.mock("../../../../src/tools/project-onboarding.js", () => ({
	projectOnboarding: vi
		.fn()
		.mockResolvedValue({ content: [{ type: "text", text: "ok" }] }),
}));

import { routeDocumentationAction } from "../../../../src/frameworks/documentation/router.js";

describe("routeDocumentationAction", () => {
	it("handles 'generate' action", async () => {
		const result = await routeDocumentationAction({ action: "generate" });
		expect(result).toBeDefined();
	});

	it("handles 'onboard' action", async () => {
		const result = await routeDocumentationAction({ action: "onboard" });
		expect(result).toBeDefined();
	});

	it("throws for unknown action", async () => {
		await expect(
			routeDocumentationAction({ action: "unknown" as any }),
		).rejects.toThrow();
	});
});
