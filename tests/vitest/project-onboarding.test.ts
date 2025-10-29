/**
 * Test suite for Project Onboarding
 */

import { describe, expect, it } from "vitest";
import { projectOnboarding } from "../../src/tools/project-onboarding.js";

describe("Project Onboarding", () => {
	describe("Basic Functionality", () => {
		it("should generate project profile and memories", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/my-project",
				projectName: "My Test Project",
				projectType: "application",
				analysisDepth: "standard",
				includeMemories: true,
			});

			const text = result.content[0].text;

			expect(text).toContain("Project Onboarding Complete");
			expect(text).toContain("My Test Project");
			expect(text).toContain("application");
			expect(text).toContain("Project Structure");
			expect(text).toContain("Project Memories Generated");
		});

		it("should work without memories", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/project",
				includeMemories: false,
			});

			const text = result.content[0].text;

			expect(text).toContain("Project Onboarding Complete");
			expect(text).not.toContain("Project Memories Generated");
		});
	});

	describe("Project Type Detection", () => {
		it("should handle library projects", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/my-lib",
				projectType: "library",
			});

			const text = result.content[0].text;

			expect(text).toContain("library");
		});

		it("should handle service projects", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/api-service",
				projectType: "service",
			});

			const text = result.content[0].text;

			expect(text).toContain("service");
		});

		it("should handle tool projects", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/cli-tool",
				projectType: "tool",
			});

			const text = result.content[0].text;

			expect(text).toContain("tool");
		});
	});

	describe("Build System Detection", () => {
		it("should detect npm/yarn build system", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/node-project",
				projectName: "Node Project",
				analysisDepth: "quick",
				includeMemories: false,
			});

			const text = result.content[0].text;

			expect(text).toContain("npm/yarn");
		});

		it("should detect cargo build system", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/rust-project",
				projectName: "Rust Project",
			});

			const text = result.content[0].text;

			expect(text).toContain("Build System");
		});

		it("should detect go build system", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/go-project",
				projectName: "Go Project",
			});

			const text = result.content[0].text;

			expect(text).toContain("Build System");
		});

		it("should detect maven build system", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/java-project",
				projectName: "Java Project",
			});

			const text = result.content[0].text;

			expect(text).toContain("Build System");
		});
	});

	describe("Analysis Depth", () => {
		it("should handle quick analysis", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/project",
				analysisDepth: "quick",
			});

			const text = result.content[0].text;

			expect(text).toContain("Project Onboarding Complete");
		});

		it("should handle standard analysis", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/project",
				analysisDepth: "standard",
			});

			const text = result.content[0].text;

			expect(text).toContain("Project Onboarding Complete");
		});

		it("should handle deep analysis", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/project",
				analysisDepth: "deep",
			});

			const text = result.content[0].text;

			expect(text).toContain("Project Onboarding Complete");
		});
	});

	describe("Memory Generation", () => {
		it("should generate architecture memory", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/project",
				projectName: "Test Project",
				projectType: "application",
				includeMemories: true,
			});

			const text = result.content[0].text;

			expect(text).toContain("Architecture");
			expect(text).toContain("Project Architecture");
		});

		it("should generate workflow memory", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/project",
				projectName: "Test Project",
				includeMemories: true,
			});

			const text = result.content[0].text;

			expect(text).toContain("Workflow");
			expect(text).toContain("Development Workflow");
		});

		it("should generate conventions memory", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/project",
				projectName: "Test Project",
				includeMemories: true,
			});

			const text = result.content[0].text;

			expect(text).toContain("Conventions");
			expect(text).toContain("Code Conventions");
		});

		it("should generate dependencies memory", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/project",
				projectName: "Test Project",
				includeMemories: true,
			});

			const text = result.content[0].text;

			expect(text).toContain("Dependencies");
		});
	});

	describe("Next Steps Guidance", () => {
		it("should provide next steps", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/test-project",
				projectName: "Test Project",
				includeMemories: true,
			});

			const text = result.content[0].text;

			expect(text).toContain("Next Steps");
			expect(text).toContain("Review the project structure");
			expect(text).toContain("Familiarize yourself with entry points");
		});

		it("should include success criteria", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/test-project",
				projectName: "Test Project",
			});

			const text = result.content[0].text;

			expect(text).toContain("Onboarding Success Criteria");
			expect(text).toContain("Project structure analyzed");
			expect(text).toContain("Key files and directories identified");
		});
	});

	describe("Options and Metadata", () => {
		it("should include references when requested", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/project",
				includeReferences: true,
			});

			const text = result.content[0].text;

			expect(text).toContain("Further Reading");
			expect(text).toContain("onboarding");
		});

		it("should include metadata when requested", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/project",
				includeMetadata: true,
			});

			const text = result.content[0].text;

			expect(text).toContain("Metadata");
			expect(text).toContain("project-onboarding");
		});
	});

	describe("Project Structure Detection", () => {
		it("should identify key directories", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/project",
				projectName: "Test Project",
			});

			const text = result.content[0].text;

			expect(text).toContain("Key Directories");
			expect(text).toContain("src");
		});

		it("should identify key files", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/project",
				projectName: "Test Project",
			});

			const text = result.content[0].text;

			expect(text).toContain("Key Files");
			expect(text).toContain("package.json");
		});

		it("should identify entry points", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/project",
				projectName: "Test Project",
			});

			const text = result.content[0].text;

			expect(text).toContain("Entry Points");
		});
	});

	describe("Language Detection", () => {
		it("should detect TypeScript/JavaScript projects", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/ts-project",
				projectName: "TS Project",
			});

			const text = result.content[0].text;

			expect(text).toContain("TypeScript/JavaScript");
		});

		it("should detect Python projects", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/py-project",
				projectName: "Python Project",
			});

			const text = result.content[0].text;

			expect(text).toContain("Python");
		});

		it("should detect Rust projects", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/rust-project",
				projectName: "Rust Project",
			});

			const text = result.content[0].text;

			expect(text).toContain("Rust");
		});

		it("should detect Go projects", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/go-project",
				projectName: "Go Project",
			});

			const text = result.content[0].text;

			expect(text).toContain("Go");
		});

		it("should detect Java projects", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/java-project",
				projectName: "Java Project",
			});

			const text = result.content[0].text;

			expect(text).toContain("Java");
		});

		it("should detect Ruby projects", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/ruby-project",
				projectName: "Ruby Project",
			});

			const text = result.content[0].text;

			expect(text).toContain("Ruby");
		});
	});
});
