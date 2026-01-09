import { describe, expect, it } from "vitest";
import { projectOnboarding } from "../../../src/tools/project-onboarding.js";

describe("project-onboarding integration tests", () => {
	it("should scan and document the actual repository", async () => {
		const result = await projectOnboarding({
			projectPath:
				"/home/runner/work/mcp-ai-agent-guidelines/mcp-ai-agent-guidelines",
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
			projectPath:
				"/home/runner/work/mcp-ai-agent-guidelines/mcp-ai-agent-guidelines",
			focusAreas: ["frameworks"],
		});

		const text = result.content[0].text;

		// Should detect Vitest framework
		expect(text).toContain("Frameworks Detected");
	});

	it("should include dependencies when requested", async () => {
		const result = await projectOnboarding({
			projectPath:
				"/home/runner/work/mcp-ai-agent-guidelines/mcp-ai-agent-guidelines",
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
			projectPath:
				"/home/runner/work/mcp-ai-agent-guidelines/mcp-ai-agent-guidelines",
			focusAreas: ["scripts"],
		});

		const text = result.content[0].text;

		expect(text).toContain("Available Scripts");
		expect(text).toContain("npm run");
	});

	it("should include detailed directory structure when requested", async () => {
		const result = await projectOnboarding({
			projectPath:
				"/home/runner/work/mcp-ai-agent-guidelines/mcp-ai-agent-guidelines",
			includeDetailedStructure: true,
		});

		const text = result.content[0].text;

		expect(text).toContain("Directory Structure");
		expect(text).toContain("```");
	});

	it("should include metadata when requested", async () => {
		const result = await projectOnboarding({
			projectPath:
				"/home/runner/work/mcp-ai-agent-guidelines/mcp-ai-agent-guidelines",
			includeMetadata: true,
		});

		const text = result.content[0].text;

		expect(text).toContain("Metadata");
	});

	it("should include references when requested", async () => {
		const result = await projectOnboarding({
			projectPath:
				"/home/runner/work/mcp-ai-agent-guidelines/mcp-ai-agent-guidelines",
			includeReferences: true,
		});

		const text = result.content[0].text;

		expect(text).toContain("Further Reading");
		expect(text).toContain("Atlassian");
	});

	it("should handle multiple focus areas", async () => {
		const result = await projectOnboarding({
			projectPath:
				"/home/runner/work/mcp-ai-agent-guidelines/mcp-ai-agent-guidelines",
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
		const tempDir = "/tmp/minimal-project-test";
		await import("node:fs/promises").then((fs) =>
			fs.mkdir(tempDir, { recursive: true }),
		);

		const result = await projectOnboarding({
			projectPath: tempDir,
		});

		const text = result.content[0].text;

		expect(text).toContain("Project Onboarding:");
		expect(text).toContain("Type");
	});
});
