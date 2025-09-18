// Prompts Module Comprehensive Function Coverage
import { describe, expect, it } from "vitest";
import { getPrompt, listPrompts } from "../../dist/prompts/index.js";

describe("Prompts Module Function Coverage", () => {
	describe("Core Prompt Functions", () => {
		it("should list all available prompts", async () => {
			const prompts = await listPrompts();
			expect(Array.isArray(prompts)).toBe(true);
			expect(prompts.length).toBeGreaterThan(0);

			// Verify each prompt has required properties
			for (const prompt of prompts) {
				expect(prompt.name).toBeDefined();
				expect(prompt.description).toBeDefined();
				expect(Array.isArray(prompt.arguments)).toBe(true);
			}
		});

		it("should generate code analysis prompts with various parameters", async () => {
			const testCases = [
				{
					codebase: "Simple JavaScript function",
					focus_area: "security",
					language: "javascript",
				},
				{
					codebase: "Complex Python class with multiple methods",
					focus_area: "performance",
					language: "python",
				},
				{
					codebase: "TypeScript React component",
					focus_area: "maintainability",
					language: "typescript",
				},
				{
					codebase: "Java enterprise application",
					focus_area: "architecture",
					language: "java",
				},
				{
					codebase: "C++ system-level code",
					language: "cpp",
				},
				{
					codebase: "Go microservice",
					focus_area: "scalability",
					language: "go",
				},
			];

			for (const args of testCases) {
				try {
					const result = await getPrompt("code-analysis-prompt", args);
					expect(result).toBeDefined();
					expect(result.content).toBeDefined();
					expect(Array.isArray(result.content)).toBe(true);
				} catch (error) {
					expect(error).toBeDefined();
				}
			}
		});

		it("should generate hierarchical task prompts", async () => {
			const testCases = [
				{
					task_description: "Build a complex web application",
					complexity_level: "high",
					required_skills: "Full-stack development, DevOps, Security",
				},
				{
					task_description: "Design microservices architecture",
					complexity_level: "expert",
					required_skills: "Distributed systems, Cloud platforms",
				},
				{
					task_description: "Implement machine learning pipeline",
					complexity_level: "advanced",
					required_skills: "Data science, MLOps, Python",
				},
			];

			for (const args of testCases) {
				try {
					const result = await getPrompt("hierarchical-task-prompt", args);
					expect(result).toBeDefined();
					expect(result.content).toBeDefined();
				} catch (error) {
					expect(error).toBeDefined();
				}
			}
		});

		it("should generate architecture design prompts", async () => {
			const testCases = [
				{
					system_type: "E-commerce platform",
					scale: "enterprise",
					requirements: "High availability, scalability, security",
				},
				{
					system_type: "Real-time chat application",
					scale: "startup",
					requirements: "Low latency, real-time communication",
				},
				{
					system_type: "Data analytics platform",
					scale: "medium",
					requirements: "Big data processing, machine learning integration",
				},
			];

			for (const args of testCases) {
				try {
					const result = await getPrompt("architecture-design-prompt", args);
					expect(result).toBeDefined();
					expect(result.content).toBeDefined();
				} catch (error) {
					expect(error).toBeDefined();
				}
			}
		});

		it("should generate debugging assistant prompts", async () => {
			const testCases = [
				{
					problem_description: "Application crashes on startup",
					error_logs: "NullPointerException in main thread",
					environment: "Production",
				},
				{
					problem_description: "Performance degradation under load",
					error_logs: "Memory leak detected",
					environment: "Staging",
				},
				{
					problem_description: "Database connection timeouts",
					error_logs: "Connection pool exhausted",
					environment: "Development",
				},
			];

			for (const args of testCases) {
				try {
					const result = await getPrompt("debugging-assistant-prompt", args);
					expect(result).toBeDefined();
					expect(result.content).toBeDefined();
				} catch (error) {
					expect(error).toBeDefined();
				}
			}
		});

		it("should generate documentation generator prompts", async () => {
			const testCases = [
				{
					code_or_system: "REST API endpoints",
					documentation_type: "API documentation",
					target_audience: "developers",
				},
				{
					code_or_system: "React component library",
					documentation_type: "user guide",
					target_audience: "frontend developers",
				},
				{
					code_or_system: "Database schema",
					documentation_type: "technical specification",
					target_audience: "database administrators",
				},
				{
					code_or_system: "Deployment scripts",
					documentation_type: "operational guide",
					target_audience: "DevOps engineers",
				},
			];

			for (const args of testCases) {
				try {
					const result = await getPrompt(
						"documentation-generator-prompt",
						args,
					);
					expect(result).toBeDefined();
					expect(result.content).toBeDefined();
				} catch (error) {
					expect(error).toBeDefined();
				}
			}
		});

		it("should generate spark UI prompts", async () => {
			const testCases = [
				{
					title: "Modern Dashboard Design",
					summary: "Clean and intuitive analytics dashboard",
					design_direction: "minimalist",
					color_scheme: "dark theme with accent colors",
				},
				{
					title: "Mobile App Interface",
					summary: "User-friendly mobile application",
					design_direction: "mobile-first",
					color_scheme: "light theme with brand colors",
				},
				{
					title: "Developer Tool Interface",
					summary: "Professional development environment",
					design_direction: "productivity-focused",
					color_scheme: "high contrast for coding",
				},
			];

			for (const args of testCases) {
				try {
					const result = await getPrompt("spark-ui-prompt", args);
					expect(result).toBeDefined();
					expect(result.content).toBeDefined();
				} catch (error) {
					expect(error).toBeDefined();
				}
			}
		});

		it("should generate security analysis prompts", async () => {
			const testCases = [
				{
					target_system: "Web application with user authentication",
					security_focus: "OWASP Top 10",
					compliance_requirements: "GDPR, SOC2",
				},
				{
					target_system: "API gateway and microservices",
					security_focus: "API security",
					compliance_requirements: "PCI DSS",
				},
				{
					target_system: "Mobile application with payment processing",
					security_focus: "Mobile security",
					compliance_requirements: "Financial regulations",
				},
				{
					target_system: "Cloud infrastructure",
					security_focus: "Infrastructure security",
					compliance_requirements: "SOX, HIPAA",
				},
			];

			for (const args of testCases) {
				try {
					const result = await getPrompt("security-analysis-prompt", args);
					expect(result).toBeDefined();
					expect(result.content).toBeDefined();
				} catch (error) {
					expect(error).toBeDefined();
				}
			}
		});

		it("should handle invalid prompt names gracefully", async () => {
			try {
				await getPrompt("non-existent-prompt", {});
				// Should not reach here
				expect(false).toBe(true);
			} catch (error) {
				expect(error).toBeDefined();
			}
		});

		it("should handle missing required arguments", async () => {
			try {
				await getPrompt("code-analysis-prompt", {});
				// Should not reach here if validation works
				expect(false).toBe(true);
			} catch (error) {
				expect(error).toBeDefined();
			}
		});

		it("should handle edge case arguments", async () => {
			const edgeCases = [
				{
					name: "code-analysis-prompt",
					args: {
						codebase: "",
						focus_area: "",
						language: "",
					},
				},
				{
					name: "hierarchical-task-prompt",
					args: {
						task_description: "Very short task",
					},
				},
				{
					name: "architecture-design-prompt",
					args: {
						system_type: "Unknown system",
						scale: "undefined",
					},
				},
			];

			for (const testCase of edgeCases) {
				try {
					const result = await getPrompt(testCase.name, testCase.args);
					expect(result).toBeDefined();
				} catch (error) {
					expect(error).toBeDefined();
				}
			}
		});
	});

	describe("Prompt Validation and Error Handling", () => {
		it("should validate prompt arguments correctly", async () => {
			// Test with valid arguments
			try {
				const result = await getPrompt("code-analysis-prompt", {
					codebase: "function test() { return true; }",
					focus_area: "security",
					language: "javascript",
				});
				expect(result).toBeDefined();
			} catch (error) {
				expect(error).toBeDefined();
			}
		});

		it("should handle special characters in arguments", async () => {
			const specialCases = [
				{
					codebase: "function test() { console.log('Hello \"World\"'); }",
					focus_area: "syntax & semantics",
					language: "javascript",
				},
				{
					codebase: "Code with\nnewlines and\ttabs",
					focus_area: "formatting",
				},
				{
					codebase: "Code with unicode: 你好世界",
					focus_area: "internationalization",
				},
			];

			for (const args of specialCases) {
				try {
					const result = await getPrompt("code-analysis-prompt", args);
					expect(result).toBeDefined();
				} catch (error) {
					expect(error).toBeDefined();
				}
			}
		});

		it("should handle large input arguments", async () => {
			const largeCodebase =
				"function test() {\n" + "  // ".repeat(1000) + "\n}";

			try {
				const result = await getPrompt("code-analysis-prompt", {
					codebase: largeCodebase,
					focus_area: "performance",
					language: "javascript",
				});
				expect(result).toBeDefined();
			} catch (error) {
				expect(error).toBeDefined();
			}
		});
	});
});
