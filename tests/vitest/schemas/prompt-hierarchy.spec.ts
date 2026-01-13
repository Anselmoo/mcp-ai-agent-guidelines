import { describe, expect, it } from "vitest";
import { promptHierarchySchema } from "../../../src/schemas/prompt-hierarchy.js";

describe("prompt-hierarchy schema", () => {
	it("parses a simple 'build' payload for mcp_context7_get-library-docs", () => {
		const input = {
			mode: "build",
			context: "/vercel/next.js", // library id used by mcp_context7_get-library-docs
			goal: "Fetch docs for mcp_ai-agent-guid_architecture-design-prompt-builder",
			requirements: ["include code examples", "focus on architecture section"],
			taskComplexity: "moderate",
			agentCapability: "intermediate",
		};

		const parsed = promptHierarchySchema.parse(input);
		expect(parsed).toEqual(input);
	});

	it("rejects unknown mode values", () => {
		const bad: unknown = { mode: "unknown" };
		const result = promptHierarchySchema.safeParse(bad);
		expect(result.success).toBe(false);
	});
});
