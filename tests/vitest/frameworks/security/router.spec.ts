import { describe, expect, it, vi } from "vitest";

vi.mock(
	"../../../../src/tools/prompt/security-hardening-prompt-builder.js",
	() => ({
		securityHardeningPromptBuilder: vi
			.fn()
			.mockResolvedValue({ content: [{ type: "text", text: "ok" }] }),
	}),
);

import { routeSecurityAction } from "../../../../src/frameworks/security/router.js";

describe("routeSecurityAction", () => {
	it("handles 'assess' action", async () => {
		const result = await routeSecurityAction({
			action: "assess",
			codeContext: "const x = 1",
		});
		expect(result).toBeDefined();
	});

	it("handles 'audit' action", async () => {
		const result = await routeSecurityAction({ action: "audit" });
		expect(result).toBeDefined();
	});

	it("throws for unknown action", async () => {
		await expect(
			routeSecurityAction({ action: "unknown" as any }),
		).rejects.toThrow();
	});
});
