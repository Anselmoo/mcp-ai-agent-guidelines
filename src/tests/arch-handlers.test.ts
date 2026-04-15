import { describe, expect, it } from "vitest";
import { skillModule as archSecurityModule } from "../skills/arch/arch-security.js";
import { skillModule as archSystemModule } from "../skills/arch/arch-system.js";
import {
	createHandlerRuntime,
	createMockWorkspace,
	recommendationText,
} from "./test-helpers/handler-runtime.js";

describe("arch handlers — additional cases", () => {
	it("arch-security includes stated constraints when no explicit security keywords are present", async () => {
		const result = await archSecurityModule.run(
			{
				request: "Analyze foo bar baz system",
				constraints: ["must not leak secrets"],
			},
			createHandlerRuntime(),
		);

		expect(result.executionMode).toBe("capability");
		const text = recommendationText(result);
		// The handler should include the provided constraint in its recommendations
		expect(text).toContain("must not leak secrets");
		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"comparison-matrix",
			"eval-criteria",
			"worked-example",
		]);
	});

	it("arch-system does not mention workspace topology when workspace.listFiles returns no entries", async () => {
		const runtime = createHandlerRuntime(createMockWorkspace([]));
		const result = await archSystemModule.run(
			{ request: "Design an agent platform for this repo" },
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const text = recommendationText(result);
		// Should not include a workspace topology note when there are no entries
		expect(text).not.toMatch(/workspace topology|director|existing structure/i);
	});

	it("arch-security matches mixed-case signals like 'MCP' and 'Token'", async () => {
		const result = await archSecurityModule.run(
			{
				request: "Review the MCP token usage and tool permissions",
			},
			createHandlerRuntime(),
		);

		expect(result.executionMode).toBe("capability");
		const text = recommendationText(result);
		expect(text).toMatch(/least-privilege|sensitive-data|tool permissions/i);
	});
});
