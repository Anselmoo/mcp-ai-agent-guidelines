import { describe, expect, it } from "vitest";
import { projectOnboarding } from "../../../src/tools/project-onboarding.js";

describe("project-onboarding integration tests", () => {
	it("should scan and document the actual repository", async () => {
		const result = await projectOnboarding({
			projectPath: process.cwd(),
		});

		expect(result).toHaveProperty("content");
		expect(result.content).toHaveLength(1);
		expect(result.content[0].type).toBe("text");

		const text = result.content[0].text;

		// Should include project name
		expect(text).toContain("Project Onboarding:");
		expect(text).toContain("mcp-ai-agent-guidelines");

		// Should detect TypeScript
		expect(text).toContain("typescript");

		// Should find entry points
		expect(text).toContain("Entry Points");

		// Should list dependencies
		expect(text).toContain("Dependencies");
	});

	it("should include frameworks when detected", async () => {
		const result = await projectOnboarding({
			projectPath: process.cwd(),
			focusAreas: ["frameworks"],
		});

		const text = result.content[0].text;

		// Should detect Vitest framework
		expect(text).toContain("Frameworks Detected");
	});

	it("should include dependencies when requested", async () => {
		const result = await projectOnboarding({
			projectPath: process.cwd(),
			focusAreas: ["dependencies"],
		});

		const text = result.content[0].text;

		expect(text).toContain("Dependencies");
		// Should show production and/or dev dependencies
		expect(
			text.includes("Production Dependencies") ||
				text.includes("Development Dependencies"),
		).toBe(true);
	});

	it("should include scripts when requested", async () => {
		const result = await projectOnboarding({
			projectPath: process.cwd(),
			focusAreas: ["scripts"],
		});

		const text = result.content[0].text;

		expect(text).toContain("Available Scripts");
		expect(text).toContain("npm run");
	});

	it("should include detailed directory structure when requested", async () => {
		const result = await projectOnboarding({
			projectPath: process.cwd(),
			includeDetailedStructure: true,
		});

		const text = result.content[0].text;

		expect(text).toContain("Directory Structure");
		expect(text).toContain("```");
	});

	it("should include metadata when requested", async () => {
		const result = await projectOnboarding({
			projectPath: process.cwd(),
			includeMetadata: true,
		});

		const text = result.content[0].text;

		expect(text).toContain("Metadata");
	});

	it("should include references when requested", async () => {
		const result = await projectOnboarding({
			projectPath: process.cwd(),
			includeReferences: true,
		});

		const text = result.content[0].text;

		expect(text).toContain("Further Reading");
		expect(text).toContain("Atlassian");
	});

	it("should handle multiple focus areas", async () => {
		const result = await projectOnboarding({
			projectPath: process.cwd(),
			focusAreas: ["dependencies", "scripts", "frameworks"],
		});

		const text = result.content[0].text;

		expect(text).toContain("Dependencies");
		expect(text).toContain("Available Scripts");
	});

	it("should throw error for non-existent path", async () => {
		await expect(
			projectOnboarding({
				projectPath: "/nonexistent/path",
			}),
		).rejects.toThrow();
	});

	it("should handle minimal project without package.json", async () => {
		// Create a temporary directory for testing
		const fs = await import("node:fs/promises");
		const path = await import("node:path");
		const tempDir = path.join(
			process.cwd(),
			".tmp-test",
			"minimal-project-test",
		);

		await fs.mkdir(tempDir, { recursive: true });

		try {
			const result = await projectOnboarding({
				projectPath: tempDir,
			});

			const text = result.content[0].text;

			expect(text).toContain("Project Onboarding:");
			expect(text).toContain("Type");
		} finally {
			// Cleanup
			await fs.rm(tempDir, { recursive: true, force: true });
		}
	});

	it("should format npm scripts for Node.js projects", async () => {
		const result = await projectOnboarding({
			projectPath: process.cwd(),
			focusAreas: ["scripts"],
		});

		const text = result.content[0].text;

		// Should use "npm run" for Node.js projects
		expect(text).toContain("npm run");
		expect(text).toContain("Available Scripts");
	});

	it("should handle non-Node.js project scripts appropriately", async () => {
		const fs = await import("node:fs/promises");
		const path = await import("node:path");
		const tempDir = path.join(
			process.cwd(),
			".tmp-test",
			"test-python-project",
		);

		try {
			await fs.mkdir(tempDir, { recursive: true });

			// Create a fake Python project (non-Node.js)
			// ProjectScanner will detect it as non-Node if there's no package.json
			await fs.writeFile(path.join(tempDir, "setup.py"), "# Python setup");

			const result = await projectOnboarding({
				projectPath: tempDir,
				focusAreas: ["scripts"],
			});

			const text = result.content[0].text;

			// Since it's not a Node.js project, scripts should show raw commands
			// (though this project won't have scripts in package.json)
			expect(text).toContain("Project Onboarding:");
		} finally {
			// Cleanup
			await fs.rm(tempDir, { recursive: true, force: true });
		}
	});
});
