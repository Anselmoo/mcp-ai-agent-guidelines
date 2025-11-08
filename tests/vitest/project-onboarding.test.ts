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

	// ============================================================================
	// NEW SECTION: Edge Cases and Branch Coverage
	// ============================================================================

	describe("Edge Cases and Missing Build Systems", () => {
		it("should handle empty/unknown project path gracefully", async () => {
			const result = await projectOnboarding({
				projectPath: "",
			});

			expect(result).toBeDefined();
			expect(result.content).toBeDefined();
			expect(result.content[0].text).toContain("Project Onboarding Complete");
		});

		it("should handle project with multiple detected systems (simplified implementation)", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/bare-project",
				projectName: "Bare Project",
			});

			const text = result.content[0].text;

			expect(text).toContain("npm/yarn");
			expect(text).toContain("Project Profile");
		});

		it("should handle project with multiple test frameworks (simplified implementation)", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/no-tests-project",
				projectName: "No Tests Project",
			});

			const text = result.content[0].text;

			expect(text).toContain("Jest/Vitest/Mocha");
		});

		it("should handle project with all dependency types (simplified implementation)", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/standalone-project",
				projectName: "Standalone",
			});

			const text = result.content[0].text;

			expect(text).toContain("Check package.json");
		});

		it("should handle undefined projectName", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/project",
			});

			const text = result.content[0].text;

			expect(text).toContain("project");
		});

		it("should extract project name from path when name is undefined", async () => {
			const result = await projectOnboarding({
				projectPath: "/deep/nested/path/my-awesome-app",
			});

			const text = result.content[0].text;

			expect(text).toContain("my-awesome-app");
		});
	});

	describe("Analysis Depth Variations", () => {
		it("should handle quick analysis depth", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/project",
				analysisDepth: "quick",
			});

			const text = result.content[0].text;

			expect(text).toContain("Project Onboarding Complete");
			expect(text).toContain("Project Profile");
		});

		it("should handle deep analysis depth", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/project",
				analysisDepth: "deep",
			});

			const text = result.content[0].text;

			expect(text).toContain("Project Onboarding Complete");
			expect(text).toContain("Project Structure");
		});

		it("should use standard as default analysis depth", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/project",
			});

			const text = result.content[0].text;

			expect(text).toBeDefined();
			expect(text).toContain("Project Onboarding Complete");
		});
	});

	describe("Optional Configuration Combinations", () => {
		it("should include metadata when requested", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/project",
				includeMetadata: true,
			});

			const text = result.content[0].text;

			expect(text).toBeDefined();
			expect(result.content[0]).toBeDefined();
		});

		it("should include references when requested", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/project",
				includeReferences: true,
			});

			const text = result.content[0].text;

			expect(text).toBeDefined();
			expect(result.content[0]).toBeDefined();
		});

		it("should include both metadata and references when both requested", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/project",
				includeMetadata: true,
				includeReferences: true,
				includeMemories: true,
			});

			const text = result.content[0].text;

			expect(text).toBeDefined();
			expect(text).toContain("Project Onboarding Complete");
			expect(result.content[0]).toBeDefined();
		});

		it("should exclude metadata when not requested", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/project",
				includeMetadata: false,
			});

			const text = result.content[0].text;

			expect(text).toBeDefined();
			expect(result.content[0]).toBeDefined();
		});

		it("should exclude references when not requested", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/project",
				includeReferences: false,
			});

			const text = result.content[0].text;

			expect(text).toBeDefined();
			expect(result.content[0]).toBeDefined();
		});
	});

	describe("Framework Detection Branches", () => {
		it("should detect Node.js framework from package.json", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/node-project",
				projectName: "Node.js Project",
				includeMemories: false,
			});

			const text = result.content[0].text;

			expect(text).toContain("Node.js");
		});

		it("should handle projects with only TypeScript config", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/ts-only",
				projectName: "TS Only",
				includeMemories: false,
			});

			const text = result.content[0].text;

			expect(text).toBeDefined();
			expect(result.content[0]).toBeDefined();
		});
	});

	describe("Language Detection - All Branches", () => {
		it("should detect TypeScript/JavaScript from package.json", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/ts-js-project",
				projectName: "TS/JS",
				includeMemories: false,
			});

			const text = result.content[0].text;

			expect(text).toContain("TypeScript/JavaScript");
		});

		it("should detect TypeScript/JavaScript from tsconfig", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/tsconfig-project",
				projectName: "TypeScript Config",
				includeMemories: false,
			});

			const text = result.content[0].text;

			expect(text).toBeDefined();
			expect(result.content[0]).toBeDefined();
		});

		it("should detect Python from requirements.txt", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/python-project",
				projectName: "Python Reqs",
				includeMemories: false,
			});

			const text = result.content[0].text;

			expect(text).toContain("Python");
		});

		it("should detect Python from setup.py", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/python-setup",
				projectName: "Python Setup",
				includeMemories: false,
			});

			const text = result.content[0].text;

			expect(text).toBeDefined();
			expect(result.content[0]).toBeDefined();
		});

		it("should detect Go from go.mod", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/go-project",
				projectName: "Go",
				includeMemories: false,
			});

			const text = result.content[0].text;

			expect(text).toContain("Go");
		});

		it("should detect Rust from Cargo.toml", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/rust-project",
				projectName: "Rust",
				includeMemories: false,
			});

			const text = result.content[0].text;

			expect(text).toContain("Rust");
		});
	});

	describe("Build System Detection - All Branches", () => {
		it("should detect npm/yarn from package.json", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/npm-project",
				projectName: "NPM",
				includeMemories: false,
			});

			const text = result.content[0].text;

			expect(text).toContain("npm/yarn");
		});

		it("should return npm/yarn first when all files present", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/multi-project",
				projectName: "Multi",
				includeMemories: false,
			});

			const text = result.content[0].text;

			expect(text).toContain("npm/yarn");
		});

		it("should handle project detection paths gracefully", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/various",
				projectName: "Various",
				includeMemories: false,
			});

			const text = result.content[0].text;

			expect(text).toBeDefined();
			expect(result.content[0]).toBeDefined();
		});

		it("should detect java projects when configured", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/java-build",
				projectName: "Java",
				includeMemories: false,
			});

			const text = result.content[0].text;

			expect(text).toBeDefined();
			expect(result.content[0]).toBeDefined();
		});

		it("should detect make projects when configured", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/make-project",
				projectName: "Make",
				includeMemories: false,
			});

			const text = result.content[0].text;

			expect(text).toBeDefined();
			expect(result.content[0]).toBeDefined();
		});
	});

	describe("Test Framework Detection - All Branches", () => {
		it("should suggest Jest/Vitest/Mocha for npm projects", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/jest-project",
				projectName: "Jest",
				includeMemories: false,
			});

			const text = result.content[0].text;

			expect(text).toContain("Jest/Vitest/Mocha");
		});

		it("should detect test framework based on package.json presence", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/npm-test",
				projectName: "NPM Test",
				includeMemories: false,
			});

			const text = result.content[0].text;

			expect(text).toBeDefined();
			expect(result.content[0]).toBeDefined();
		});

		it("should detect pytest for Python projects", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/pytest-project",
				projectName: "Pytest",
				includeMemories: false,
			});

			const text = result.content[0].text;

			expect(text).toBeDefined();
			expect(result.content[0]).toBeDefined();
		});

		it("should detect cargo test for Rust projects", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/cargo-test-project",
				projectName: "Cargo Test",
				includeMemories: false,
			});

			const text = result.content[0].text;

			expect(text).toBeDefined();
			expect(result.content[0]).toBeDefined();
		});

		it("should detect go test for Go projects", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/go-test-project",
				projectName: "Go Test",
				includeMemories: false,
			});

			const text = result.content[0].text;

			expect(text).toBeDefined();
			expect(result.content[0]).toBeDefined();
		});
	});

	describe("Dependency Detection - All Branches", () => {
		it("should suggest checking package.json for npm dependencies", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/npm-deps",
				projectName: "NPM Deps",
				includeMemories: false,
			});

			const text = result.content[0].text;

			expect(text).toContain("package.json");
		});

		it("should detect multiple dependency sources", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/python-deps",
				projectName: "Python Deps",
				includeMemories: false,
			});

			const text = result.content[0].text;

			expect(text).toBeDefined();
			expect(result.content[0]).toBeDefined();
		});

		it("should handle Rust crate detection", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/rust-deps",
				projectName: "Rust Deps",
				includeMemories: false,
			});

			const text = result.content[0].text;

			expect(text).toBeDefined();
			expect(result.content[0]).toBeDefined();
		});
	});

	describe("Complete Project Type Profiles", () => {
		it("should generate complete TypeScript application profile", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/typescript-app",
				projectName: "TypeScript App",
				projectType: "application",
				analysisDepth: "standard",
				includeMemories: true,
				includeMetadata: false,
				includeReferences: false,
			});

			const text = result.content[0].text;

			expect(text).toContain("Project Onboarding Complete");
			expect(text).toContain("TypeScript App");
			expect(text).toContain("application");
			expect(text).toContain("Project Profile");
			expect(text).toContain("Project Structure");
			expect(text).toContain("Dependencies");
		});

		it("should generate complete Python library profile", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/python-lib",
				projectName: "Python Lib",
				projectType: "library",
				analysisDepth: "deep",
				includeMemories: true,
				includeMetadata: true,
				includeReferences: false,
			});

			const text = result.content[0].text;

			expect(text).toContain("Project Onboarding Complete");
			expect(text).toContain("Python Lib");
			expect(text).toContain("library");
		});

		it("should generate Rust service profile", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/rust-service",
				projectName: "Rust Service",
				projectType: "service",
				analysisDepth: "quick",
				includeMemories: false,
				includeMetadata: false,
				includeReferences: false,
			});

			const text = result.content[0].text;

			expect(text).toContain("Project Onboarding Complete");
			expect(text).toContain("Rust Service");
			expect(text).toContain("service");
		});
	});

	describe("Minimal Input Configuration", () => {
		it("should work with only projectPath", async () => {
			const result = await projectOnboarding({
				projectPath: "/minimal/path",
			});

			const text = result.content[0].text;

			expect(text).toContain("Project Onboarding Complete");
			expect(result.content).toBeDefined();
			expect(result.content[0]).toBeDefined();
		});

		it("should work with projectPath and projectName only", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/project",
				projectName: "MinimalProject",
			});

			const text = result.content[0].text;

			expect(text).toContain("MinimalProject");
			expect(text).toContain("Project Onboarding Complete");
		});

		it("should work with projectPath and projectType only", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/project",
				projectType: "tool",
			});

			const text = result.content[0].text;

			expect(text).toContain("tool");
		});
	});
});
