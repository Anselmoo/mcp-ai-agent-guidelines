import { describe, expect, it, vi } from "vitest";

vi.mock(
	"../../../../src/tools/prompt/architecture-design-prompt-builder.js",
	() => ({
		architectureDesignPromptBuilder: vi
			.fn()
			.mockResolvedValue({ content: [{ type: "text", text: "ok" }] }),
	}),
);
vi.mock(
	"../../../../src/tools/prompt/l9-distinguished-engineer-prompt-builder.js",
	() => ({
		l9DistinguishedEngineerPromptBuilder: vi
			.fn()
			.mockResolvedValue({ content: [{ type: "text", text: "ok" }] }),
	}),
);
vi.mock(
	"../../../../src/tools/prompt/enterprise-architect-prompt-builder.js",
	() => ({
		enterpriseArchitectPromptBuilder: vi
			.fn()
			.mockResolvedValue({ content: [{ type: "text", text: "ok" }] }),
	}),
);
vi.mock("../../../../src/tools/design/design-assistant.js", () => ({
	designAssistant: {
		processRequest: vi.fn().mockResolvedValue({ status: "ok" }),
	},
}));

import { routeDesignArchitectureAction } from "../../../../src/frameworks/design-architecture/router.js";

describe("routeDesignArchitectureAction", () => {
	it("handles 'architecture' action", async () => {
		const result = await routeDesignArchitectureAction({
			action: "architecture",
		});
		expect(result).toBeDefined();
	});

	it("handles 'design-session' action", async () => {
		const result = await routeDesignArchitectureAction({
			action: "design-session",
		});
		expect(result).toBeDefined();
	});

	it("throws for unknown action", async () => {
		await expect(
			routeDesignArchitectureAction({ action: "unknown" as any }),
		).rejects.toThrow();
	});
});
