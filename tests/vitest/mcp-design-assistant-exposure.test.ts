import { describe, expect, it } from "vitest";

describe("MCP Design Assistant Exposure", () => {
	it("should expose generate-context-aware-guidance action in MCP schema", async () => {
		// We'll test by inspecting the source file to ensure the enum is correct
		// since we can't easily instantiate the full MCP server in tests
		const fs = await import("node:fs/promises");
		const indexContent = await fs.readFile("src/index.ts", "utf-8");

		// Check that the action is in the enum
		expect(indexContent).toContain("generate-context-aware-guidance");
		expect(indexContent).toContain("select-methodology");
		expect(indexContent).toContain("enforce-cross-session-consistency");
		expect(indexContent).toContain("generate-enforcement-prompts");
		expect(indexContent).toContain("generate-constraint-documentation");
		expect(indexContent).toContain("generate-strategic-pivot-prompt");
	});

	it("should have methodologySignals parameter in schema", async () => {
		const fs = await import("node:fs/promises");
		const indexContent = await fs.readFile("src/index.ts", "utf-8");

		// Check for the methodologySignals parameter
		expect(indexContent).toContain("methodologySignals");
		expect(indexContent).toContain(
			"Methodology signals for select-methodology action",
		);
	});

	it("should have includeTemplates parameter in schema", async () => {
		const fs = await import("node:fs/promises");
		const indexContent = await fs.readFile("src/index.ts", "utf-8");

		// Check for the includeTemplates parameter
		expect(indexContent).toContain("includeTemplates");
		expect(indexContent).toContain("Include templates in generated prompts");
	});

	it("should have updated description mentioning context-aware capabilities", async () => {
		const fs = await import("node:fs/promises");
		const indexContent = await fs.readFile("src/index.ts", "utf-8");

		// Check that the description mentions context-aware capabilities
		expect(indexContent).toContain("context-aware design recommendations");
		expect(indexContent).toContain("SOLID principles");
		expect(indexContent).toContain("framework-specific best practices");
	});
});
