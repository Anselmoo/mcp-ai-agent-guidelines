/**
 * Domain Layer Integration Tests
 *
 * Tests the integration between domain layer (pure business logic) and tool layer (MCP handlers).
 * Verifies:
 * - Domain functions work correctly
 * - Tools correctly call domain and format results
 * - Error propagation works through the layers
 * - Type safety is maintained
 */
import { beforeEach, describe, expect, it } from "vitest";
import { calculateCleanCodeScore } from "../../../src/domain/analysis/code-scorer.js";
import {
	clearAllSessions,
	createSession,
	updateSessionPhase,
} from "../../../src/domain/design/session-manager.js";
import { buildHierarchicalPrompt } from "../../../src/domain/prompting/hierarchical-builder.js";
import { cleanCodeScorer } from "../../../src/tools/clean-code-scorer.js";
import { hierarchicalPromptBuilder } from "../../../src/tools/prompt/hierarchical-prompt-builder.js";

describe("Domain Layer Integration", () => {
	describe("Prompting Domain → Tool Flow", () => {
		it("domain function returns structured result", () => {
			const result = buildHierarchicalPrompt({
				goal: "Review code for security issues",
				context: "Node.js authentication module",
				requirements: ["Check for injection", "Verify input validation"],
			});

			expect(result.sections).toBeDefined();
			expect(result.sections.length).toBeGreaterThan(0);
			expect(result.metadata).toBeDefined();
			expect(result.metadata.tokenEstimate).toBeGreaterThan(0);

			// Verify sections include expected content
			const contextSection = result.sections.find((s) => s.title === "Context");
			expect(contextSection).toBeDefined();
			expect(contextSection?.body).toBe("Node.js authentication module");

			const goalSection = result.sections.find((s) => s.title === "Goal");
			expect(goalSection).toBeDefined();
			expect(goalSection?.body).toBe("Review code for security issues");

			const requirementsSection = result.sections.find(
				(s) => s.title === "Requirements",
			);
			expect(requirementsSection).toBeDefined();
			expect(requirementsSection?.body).toContain("Check for injection");
		});

		it("tool returns formatted markdown", async () => {
			const result = await hierarchicalPromptBuilder({
				goal: "Review code",
				context: "Test context",
			});

			expect(result.content).toBeDefined();
			expect(result.content).toHaveLength(1);
			expect(result.content[0].type).toBe("text");
			expect(result.content[0].text).toContain("# Goal");
			expect(result.content[0].text).toContain("# Context");
		});

		it("tool integrates domain metadata into output", async () => {
			const result = await hierarchicalPromptBuilder({
				goal: "Implement feature",
				context: "E-commerce platform",
				requirements: ["Add cart", "Process payment"],
			});

			const outputText = result.content[0].text;

			// Check for domain metadata integration
			expect(outputText).toContain("Complexity score:");
			expect(outputText).toContain("Token estimate:");
			expect(outputText).toContain("Sections:");
		});
	});

	describe("Analysis Domain → Tool Flow", () => {
		it("scoring domain returns numeric result", () => {
			const result = calculateCleanCodeScore({
				coverageMetrics: {
					statements: 80,
					branches: 70,
					functions: 90,
					lines: 85,
				},
			});

			expect(result.overallScore).toBeGreaterThanOrEqual(0);
			expect(result.overallScore).toBeLessThanOrEqual(100);
			expect(result.breakdown).toHaveProperty("coverage");
			expect(result.breakdown).toHaveProperty("hygiene");
			expect(result.breakdown).toHaveProperty("documentation");
			expect(result.breakdown).toHaveProperty("security");
		});

		it("tool formats domain results as markdown report", async () => {
			const result = await cleanCodeScorer({
				coverageMetrics: {
					statements: 85,
					branches: 75,
					functions: 90,
					lines: 87,
				},
				codeContent: "function test() { return true; }",
				language: "javascript",
			});

			expect(result.content).toBeDefined();
			expect(result.content).toHaveLength(1);

			const outputText = result.content[0].text;
			expect(outputText).toContain("Clean Code Score Report");
			expect(outputText).toContain("Overall Score");
			expect(outputText).toContain("Category Breakdown");
			expect(outputText).toContain("Recommendations");
		});

		it("domain detects hygiene issues correctly", () => {
			const result = calculateCleanCodeScore({
				codeContent: "// TODO: fix this\nconsole.log('debug');",
				language: "javascript",
			});

			expect(result.breakdown.hygiene.score).toBeLessThan(100);
			expect(result.breakdown.hygiene.issues.length).toBeGreaterThan(0);
			expect(
				result.breakdown.hygiene.issues.some((issue) =>
					issue.toLowerCase().includes("todo"),
				),
			).toBe(true);
		});
	});

	describe("Design Domain → Tool Flow", () => {
		beforeEach(() => {
			// Clear sessions before each test
			clearAllSessions();
		});

		it("session lifecycle works through domain", () => {
			const session = createSession("test-123", { goal: "Test" });
			expect(session.phase).toBe("discovery");
			expect(session.currentPhase).toBe("discovery");
			expect(session.id).toBe("test-123");
			expect(session.history).toHaveLength(0);

			const updated = updateSessionPhase(
				"test-123",
				"requirements",
				"Gathered requirements",
			);
			expect(updated.phase).toBe("requirements");
			expect(updated.currentPhase).toBe("requirements");
			expect(updated.history).toHaveLength(1);
			expect(updated.history[0].from).toBe("discovery");
			expect(updated.history[0].to).toBe("requirements");
		});

		it("session tracks phase transitions correctly", () => {
			const session = createSession("test-456", {
				goal: "Build authentication",
			});

			updateSessionPhase("test-456", "requirements");
			updateSessionPhase("test-456", "architecture");
			const final = updateSessionPhase("test-456", "implementation");

			expect(final.history).toHaveLength(3);
			expect(final.history[0].to).toBe("requirements");
			expect(final.history[1].to).toBe("architecture");
			expect(final.history[2].to).toBe("implementation");
			expect(final.phase).toBe("implementation");
		});

		it("throws error when session not found", () => {
			expect(() => {
				updateSessionPhase("non-existent", "requirements");
			}).toThrow("Session not found: non-existent");
		});
	});

	describe("Error Propagation", () => {
		it("domain validation errors propagate to tool response", async () => {
			// Missing required fields should trigger validation error
			const result = await hierarchicalPromptBuilder({});

			expect(result.isError).toBe(true);
			expect(result.content).toBeDefined();
			expect(result.content).toHaveLength(1);
			expect(result.content[0].type).toBe("text");

			// Error message should mention validation issue
			const errorText = result.content[0].text;
			expect(
				errorText.includes("Required") ||
					errorText.includes("validation") ||
					errorText.includes("VALIDATION") ||
					errorText.includes("SCHEMA_VIOLATION"),
			).toBe(true);
		});

		it("tool error handler wraps domain errors correctly", async () => {
			// Invalid coverage metrics (outside 0-100 range)
			const result = await cleanCodeScorer({
				coverageMetrics: {
					statements: 150, // Invalid: > 100
					branches: -10, // Invalid: < 0
				},
			});

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("Number must be");
		});

		it("maintains type safety through error boundary", async () => {
			const result = await hierarchicalPromptBuilder({
				goal: "test",
				context: "test",
				techniques: "invalid", // Will be coerced to array or cause error
			});

			// Should either succeed with coercion or return structured error
			expect(result.content).toBeDefined();
			expect(result.content).toHaveLength(1);
			expect(result.content[0]).toHaveProperty("type");
			expect(result.content[0]).toHaveProperty("text");
		});
	});

	describe("Type Safety Verification", () => {
		it("domain functions enforce strict typing", () => {
			// TypeScript compilation ensures this, but we verify runtime behavior
			const result = buildHierarchicalPrompt({
				goal: "test",
				context: "test",
				requirements: ["req1", "req2"],
			});

			// Verify returned types match expectations
			expect(typeof result.metadata.complexity).toBe("number");
			expect(typeof result.metadata.tokenEstimate).toBe("number");
			expect(Array.isArray(result.sections)).toBe(true);
			expect(Array.isArray(result.metadata.techniques)).toBe(true);
		});

		it("tool responses maintain consistent structure", async () => {
			const result = await hierarchicalPromptBuilder({
				goal: "test",
				context: "test",
			});

			// Verify MCP response structure
			expect(result).toHaveProperty("content");
			expect(Array.isArray(result.content)).toBe(true);
			expect(result.content[0]).toHaveProperty("type");
			expect(result.content[0]).toHaveProperty("text");
			expect(result.content[0].type).toBe("text");
			expect(typeof result.content[0].text).toBe("string");
		});

		it("error responses maintain consistent structure", async () => {
			const result = await hierarchicalPromptBuilder({});

			// Even errors should follow MCP response structure
			expect(result).toHaveProperty("content");
			expect(result).toHaveProperty("isError");
			expect(result.isError).toBe(true);
			expect(Array.isArray(result.content)).toBe(true);
			expect(result.content[0]).toHaveProperty("type");
			expect(result.content[0]).toHaveProperty("text");
		});
	});

	describe("Cross-Layer Data Flow", () => {
		it("complex data flows correctly from domain to tool", async () => {
			// Test with comprehensive input
			const result = await hierarchicalPromptBuilder({
				goal: "Refactor authentication system",
				context: "Legacy monolithic application",
				requirements: [
					"Add OAuth 2.0 support",
					"Implement JWT tokens",
					"Add rate limiting",
				],
				constraints: ["Maintain backward compatibility", "Zero downtime"],
				issues: ["Concurrent login issues", "Token expiry edge cases"],
				outputFormat: "Step-by-step migration plan",
				audience: "Senior backend engineers",
			});

			const outputText = result.content[0].text;

			// Verify all input data appears in output
			expect(outputText).toContain("Refactor authentication system");
			expect(outputText).toContain("Legacy monolithic application");
			expect(outputText).toContain("OAuth 2.0");
			expect(outputText).toContain("backward compatibility");
			expect(outputText).toContain("Concurrent login issues");
		});

		it("domain calculations are preserved through tool layer", async () => {
			const result = await cleanCodeScorer({
				codeContent: `
					function calculate() {
						const apiKey = "hardcoded-secret";
						eval("dangerous code");
						// TODO: fix this
						console.log("debug");
					}
				`,
				language: "javascript",
				coverageMetrics: {
					statements: 60,
					branches: 55,
					functions: 65,
					lines: 58,
				},
			});

			const outputText = result.content[0].text;

			// Verify domain-calculated issues appear in tool output
			expect(outputText).toMatch(/\d+\/100/); // Overall score
			expect(
				outputText.toLowerCase().includes("security") ||
					outputText.toLowerCase().includes("hygiene"),
			).toBe(true);
		});
	});
});
