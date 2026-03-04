import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../src/tools/iterative-coverage-enhancer.js", () => ({
	iterativeCoverageEnhancer: vi
		.fn()
		.mockResolvedValue({ content: [{ type: "text", text: "ok" }] }),
}));

import { routeTestingAction } from "../../../../src/frameworks/testing/router.js";

describe("routeTestingAction", () => {
	it("handles 'suggest' action", async () => {
		const result = await routeTestingAction({ action: "suggest" });
		expect(result).toBeDefined();
	});

	it("handles 'workflow' action", async () => {
		const result = await routeTestingAction({ action: "workflow" });
		expect(result).toBeDefined();
	});

	it("throws for unknown action", async () => {
		await expect(
			routeTestingAction({ action: "unknown" as any }),
		).rejects.toThrow();
	});
});
