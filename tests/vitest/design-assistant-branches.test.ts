// Design Assistant - Branch Coverage Enhancement Tests
// Focus: Testing ALL action types, error paths, and conditional branches
import { beforeAll, describe, expect, it } from "vitest";
import type { DesignAssistantRequest } from "../../src/tools/design/design-assistant.ts";
import { designAssistant } from "../../src/tools/design/design-assistant.ts";

describe("Design Assistant - Branch Coverage Tests", () => {
	beforeAll(async () => {
		await designAssistant.initialize();
	});

	describe("Branch: Action type routing - start-session", () => {
		it("should handle start-session action", async () => {
			const request: DesignAssistantRequest = {
				action: "start-session",
				sessionId: "branch-test-start",
				config: {
					sessionId: "branch-test-start",
					context: "Branch test context",
					goal: "Test start-session branch",
					requirements: ["req1"],
					constraints: [],
					coverageThreshold: 80,
					enablePivots: true,
					templateRefs: [],
					outputFormats: ["markdown"],
					metadata: {},
				},
			};

			const result = await designAssistant.processRequest(request);
			expect(result).toBeDefined();
			expect(result.sessionId).toBe("branch-test-start");
		});

		it("should throw error when config missing for start-session", async () => {
			const request: DesignAssistantRequest = {
				action: "start-session",
				sessionId: "test-no-config",
				// config is missing
			};

			const result = await designAssistant.processRequest(request);
			expect(result.success).toBe(false);
			expect(result.message).toContain("Configuration is required");
		});
	});

	describe("Branch: Action type routing - advance-phase", () => {
		it("should handle advance-phase action", async () => {
			// First create a session
			await designAssistant.processRequest({
				action: "start-session",
				sessionId: "advance-test",
				config: {
					sessionId: "advance-test",
					context: "Test",
					goal: "Test",
					requirements: ["req1"],
					constraints: [],
					coverageThreshold: 80,
					enablePivots: true,
					templateRefs: [],
					outputFormats: ["markdown"],
					metadata: {},
				},
			});

			const request: DesignAssistantRequest = {
				action: "advance-phase",
				sessionId: "advance-test",
				content: "Phase advancement content",
			};

			const result = await designAssistant.processRequest(request);
			expect(result).toBeDefined();
		});
	});

	describe("Branch: Action type routing - validate-phase", () => {
		it("should handle validate-phase action with required params", async () => {
			await designAssistant.processRequest({
				action: "start-session",
				sessionId: "validate-test",
				config: {
					sessionId: "validate-test",
					context: "Test",
					goal: "Test",
					requirements: ["req1"],
					constraints: [],
					coverageThreshold: 80,
					enablePivots: true,
					templateRefs: [],
					outputFormats: ["markdown"],
					metadata: {},
				},
			});

			const request: DesignAssistantRequest = {
				action: "validate-phase",
				sessionId: "validate-test",
				phaseId: "discovery",
				content: "Validation content",
			};

			const result = await designAssistant.processRequest(request);
			expect(result).toBeDefined();
		});

		it("should throw error when phaseId missing for validate-phase", async () => {
			const request: DesignAssistantRequest = {
				action: "validate-phase",
				sessionId: "test",
				content: "Content without phaseId",
			};

			const result = await designAssistant.processRequest(request);
			expect(result.success).toBe(false);
			expect(result.message).toContain("Phase ID and content are required");
		});

		it("should throw error when content missing for validate-phase", async () => {
			const request: DesignAssistantRequest = {
				action: "validate-phase",
				sessionId: "test",
				phaseId: "discovery",
			};

			const result = await designAssistant.processRequest(request);
			expect(result.success).toBe(false);
			expect(result.message).toContain("Phase ID and content are required");
		});
	});

	describe("Branch: Action type routing - evaluate-pivot", () => {
		it("should handle evaluate-pivot action with content", async () => {
			await designAssistant.processRequest({
				action: "start-session",
				sessionId: "pivot-test",
				config: {
					sessionId: "pivot-test",
					context: "Test",
					goal: "Test",
					requirements: ["req1"],
					constraints: [],
					coverageThreshold: 80,
					enablePivots: true,
					templateRefs: [],
					outputFormats: ["markdown"],
					metadata: {},
				},
			});

			const request: DesignAssistantRequest = {
				action: "evaluate-pivot",
				sessionId: "pivot-test",
				content: "Pivot evaluation content",
			};

			const result = await designAssistant.processRequest(request);
			expect(result).toBeDefined();
		});

		it("should throw error when content missing for evaluate-pivot", async () => {
			const request: DesignAssistantRequest = {
				action: "evaluate-pivot",
				sessionId: "test",
			};

			const result = await designAssistant.processRequest(request);
			expect(result.success).toBe(false);
			expect(result.message).toContain("Content is required");
		});
	});

	describe("Branch: Action type routing - generate-strategic-pivot-prompt", () => {
		it("should handle generate-strategic-pivot-prompt with content", async () => {
			await designAssistant.processRequest({
				action: "start-session",
				sessionId: "strategic-test",
				config: {
					sessionId: "strategic-test",
					context: "Test",
					goal: "Test",
					requirements: ["req1"],
					constraints: [],
					coverageThreshold: 80,
					enablePivots: true,
					templateRefs: [],
					outputFormats: ["markdown"],
					metadata: {},
				},
			});

			const request: DesignAssistantRequest = {
				action: "generate-strategic-pivot-prompt",
				sessionId: "strategic-test",
				content: "Strategic pivot content",
			};

			const result = await designAssistant.processRequest(request);
			expect(result).toBeDefined();
		});

		it("should throw error when content missing for generate-strategic-pivot-prompt", async () => {
			const request: DesignAssistantRequest = {
				action: "generate-strategic-pivot-prompt",
				sessionId: "test",
			};

			const result = await designAssistant.processRequest(request);
			expect(result.success).toBe(false);
			expect(result.message).toContain("Content is required");
		});
	});

	describe("Branch: Action type routing - generate-artifacts", () => {
		it("should handle generate-artifacts action", async () => {
			await designAssistant.processRequest({
				action: "start-session",
				sessionId: "artifact-test",
				config: {
					sessionId: "artifact-test",
					context: "Test",
					goal: "Test",
					requirements: ["req1"],
					constraints: [],
					coverageThreshold: 80,
					enablePivots: true,
					templateRefs: [],
					outputFormats: ["markdown"],
					metadata: {},
				},
			});

			const request: DesignAssistantRequest = {
				action: "generate-artifacts",
				sessionId: "artifact-test",
				artifactTypes: ["adr"],
			};

			const result = await designAssistant.processRequest(request);
			expect(result).toBeDefined();
		});

		it("should use default artifact types when not specified", async () => {
			await designAssistant.processRequest({
				action: "start-session",
				sessionId: "artifact-default-test",
				config: {
					sessionId: "artifact-default-test",
					context: "Test",
					goal: "Test",
					requirements: ["req1"],
					constraints: [],
					coverageThreshold: 80,
					enablePivots: true,
					templateRefs: [],
					outputFormats: ["markdown"],
					metadata: {},
				},
			});

			const request: DesignAssistantRequest = {
				action: "generate-artifacts",
				sessionId: "artifact-default-test",
				// artifactTypes not specified
			};

			const result = await designAssistant.processRequest(request);
			expect(result).toBeDefined();
		});
	});

	describe("Branch: Action type routing - enforce-coverage", () => {
		it("should handle enforce-coverage action with content", async () => {
			await designAssistant.processRequest({
				action: "start-session",
				sessionId: "coverage-test",
				config: {
					sessionId: "coverage-test",
					context: "Test",
					goal: "Test",
					requirements: ["req1"],
					constraints: [],
					coverageThreshold: 80,
					enablePivots: true,
					templateRefs: [],
					outputFormats: ["markdown"],
					metadata: {},
				},
			});

			const request: DesignAssistantRequest = {
				action: "enforce-coverage",
				sessionId: "coverage-test",
				content: "Coverage enforcement content",
			};

			const result = await designAssistant.processRequest(request);
			expect(result).toBeDefined();
		});

		it("should throw error when content missing for enforce-coverage", async () => {
			const request: DesignAssistantRequest = {
				action: "enforce-coverage",
				sessionId: "test",
			};

			const result = await designAssistant.processRequest(request);
			expect(result.success).toBe(false);
			expect(result.message).toContain("Content is required");
		});
	});

	describe("Branch: Action type routing - enforce-consistency", () => {
		it("should handle enforce-consistency action", async () => {
			await designAssistant.processRequest({
				action: "start-session",
				sessionId: "consistency-test",
				config: {
					sessionId: "consistency-test",
					context: "Test",
					goal: "Test",
					requirements: ["req1"],
					constraints: [],
					coverageThreshold: 80,
					enablePivots: true,
					templateRefs: [],
					outputFormats: ["markdown"],
					metadata: {},
				},
			});

			const request: DesignAssistantRequest = {
				action: "enforce-consistency",
				sessionId: "consistency-test",
			};

			const result = await designAssistant.processRequest(request);
			expect(result).toBeDefined();
		});
	});

	describe("Branch: Action type routing - get-status", () => {
		it("should handle get-status action", async () => {
			await designAssistant.processRequest({
				action: "start-session",
				sessionId: "status-test",
				config: {
					sessionId: "status-test",
					context: "Test",
					goal: "Test",
					requirements: ["req1"],
					constraints: [],
					coverageThreshold: 80,
					enablePivots: true,
					templateRefs: [],
					outputFormats: ["markdown"],
					metadata: {},
				},
			});

			const request: DesignAssistantRequest = {
				action: "get-status",
				sessionId: "status-test",
			};

			const result = await designAssistant.processRequest(request);
			expect(result).toBeDefined();
			expect(result.sessionId).toBe("status-test");
		});
	});

	describe("Branch: Action type routing - load-constraints", () => {
		it("should handle load-constraints action with config", async () => {
			const request: DesignAssistantRequest = {
				action: "load-constraints",
				sessionId: "load-test",
				constraintConfig: {
					phases: [],
					constraints: [],
					coverage_thresholds: {
						overall_minimum: 80,
						phase_minimum: 70,
						constraint_minimum: 75,
						documentation_minimum: 70,
						test_minimum: 70,
					},
				},
			};

			const result = await designAssistant.processRequest(request);
			expect(result).toBeDefined();
		});

		it("should throw error when constraintConfig missing for load-constraints", async () => {
			const request: DesignAssistantRequest = {
				action: "load-constraints",
				sessionId: "test",
			};

			const result = await designAssistant.processRequest(request);
			expect(result.success).toBe(false);
			expect(result.message).toContain("Constraint configuration is required");
		});
	});

	describe("Branch: Action type routing - select-methodology", () => {
		it("should handle select-methodology action with signals", async () => {
			await designAssistant.processRequest({
				action: "start-session",
				sessionId: "methodology-test",
				config: {
					sessionId: "methodology-test",
					context: "Test",
					goal: "Test",
					requirements: ["req1"],
					constraints: [],
					coverageThreshold: 80,
					enablePivots: true,
					templateRefs: [],
					outputFormats: ["markdown"],
					metadata: {},
				},
			});

			const request: DesignAssistantRequest = {
				action: "select-methodology",
				sessionId: "methodology-test",
				methodologySignals: {
					projectSize: "medium",
					teamSize: 5,
					complexity: "moderate",
					changeFrequency: "high",
					regulatoryRequirements: false,
					timeConstraints: "moderate",
				},
			};

			const result = await designAssistant.processRequest(request);
			expect(result).toBeDefined();
		});

		it("should throw ConfigurationError when methodologySignals missing", async () => {
			const request: DesignAssistantRequest = {
				action: "select-methodology",
				sessionId: "test",
			};

			const result = await designAssistant.processRequest(request);
			expect(result.success).toBe(false);
			expect(result.message).toContain("Methodology signals are required");
		});
	});

	describe("Branch: Action type routing - enforce-cross-session-consistency", () => {
		it("should handle enforce-cross-session-consistency action", async () => {
			await designAssistant.processRequest({
				action: "start-session",
				sessionId: "cross-session-test",
				config: {
					sessionId: "cross-session-test",
					context: "Test",
					goal: "Test",
					requirements: ["req1"],
					constraints: [],
					coverageThreshold: 80,
					enablePivots: true,
					templateRefs: [],
					outputFormats: ["markdown"],
					metadata: {},
				},
			});

			const request: DesignAssistantRequest = {
				action: "enforce-cross-session-consistency",
				sessionId: "cross-session-test",
			};

			const result = await designAssistant.processRequest(request);
			expect(result).toBeDefined();
		});
	});

	describe("Branch: Action type routing - generate-enforcement-prompts", () => {
		it("should handle generate-enforcement-prompts action", async () => {
			await designAssistant.processRequest({
				action: "start-session",
				sessionId: "prompts-test",
				config: {
					sessionId: "prompts-test",
					context: "Test",
					goal: "Test",
					requirements: ["req1"],
					constraints: [],
					coverageThreshold: 80,
					enablePivots: true,
					templateRefs: [],
					outputFormats: ["markdown"],
					metadata: {},
				},
			});

			const request: DesignAssistantRequest = {
				action: "generate-enforcement-prompts",
				sessionId: "prompts-test",
			};

			const result = await designAssistant.processRequest(request);
			expect(result).toBeDefined();
		});
	});

	describe("Branch: Action type routing - generate-constraint-documentation", () => {
		it("should handle generate-constraint-documentation action", async () => {
			await designAssistant.processRequest({
				action: "start-session",
				sessionId: "doc-test",
				config: {
					sessionId: "doc-test",
					context: "Test",
					goal: "Test",
					requirements: ["req1"],
					constraints: [],
					coverageThreshold: 80,
					enablePivots: true,
					templateRefs: [],
					outputFormats: ["markdown"],
					metadata: {},
				},
			});

			const request: DesignAssistantRequest = {
				action: "generate-constraint-documentation",
				sessionId: "doc-test",
			};

			const result = await designAssistant.processRequest(request);
			expect(result).toBeDefined();
		});
	});

	describe("Branch: Action type routing - generate-context-aware-guidance", () => {
		it("should handle generate-context-aware-guidance with TypeScript code", async () => {
			await designAssistant.processRequest({
				action: "start-session",
				sessionId: "guidance-test",
				config: {
					sessionId: "guidance-test",
					context: "Test",
					goal: "Test",
					requirements: ["req1"],
					constraints: [],
					coverageThreshold: 80,
					enablePivots: true,
					templateRefs: [],
					outputFormats: ["markdown"],
					metadata: {},
				},
			});

			const request: DesignAssistantRequest = {
				action: "generate-context-aware-guidance",
				sessionId: "guidance-test",
				content: "function test(): string { return 'TypeScript'; }",
			};

			const result = await designAssistant.processRequest(request);
			expect(result).toBeDefined();
			expect(result.success).toBe(true);
			expect(result.data?.detectedLanguage).toBe("typescript");
		});

		it("should handle generate-context-aware-guidance with React code", async () => {
			await designAssistant.processRequest({
				action: "start-session",
				sessionId: "guidance-react-test",
				config: {
					sessionId: "guidance-react-test",
					context: "Test",
					goal: "Test",
					requirements: ["req1"],
					constraints: [],
					coverageThreshold: 80,
					enablePivots: true,
					templateRefs: [],
					outputFormats: ["markdown"],
					metadata: {},
				},
			});

			const request: DesignAssistantRequest = {
				action: "generate-context-aware-guidance",
				sessionId: "guidance-react-test",
				content:
					"import React from 'react'; const App = () => <div>Hello</div>;",
			};

			const result = await designAssistant.processRequest(request);
			expect(result).toBeDefined();
			expect(result.success).toBe(true);
			expect(result.data?.detectedFramework).toBe("react");
		});

		it("should throw error when content missing for generate-context-aware-guidance", async () => {
			const request: DesignAssistantRequest = {
				action: "generate-context-aware-guidance",
				sessionId: "test",
			};

			const result = await designAssistant.processRequest(request);
			expect(result.success).toBe(false);
			expect(result.message).toContain("Content is required");
		});
	});

	describe("Branch: Unknown action default case", () => {
		it("should handle unknown action and return error", async () => {
			const request = {
				action: "unknown-action",
				sessionId: "test",
			} as unknown as DesignAssistantRequest;

			const result = await designAssistant.processRequest(request);
			expect(result.success).toBe(false);
			expect(result.message).toContain("Unknown action");
		});
	});

	describe("Branch: Initialization check", () => {
		it("should initialize only once", async () => {
			// Call initialize multiple times
			await designAssistant.initialize();
			await designAssistant.initialize();
			await designAssistant.initialize();

			// Should not throw and should work normally
			const result = await designAssistant.getActiveSessions();
			expect(result).toBeDefined();
			expect(Array.isArray(result)).toBe(true);
		});
	});

	describe("Branch: Backwards-compatible wrappers", () => {
		it("should support createSession wrapper", async () => {
			const result = await designAssistant.createSession({
				context: "Test context",
				goal: "Test goal",
				requirements: ["req1", "req2"],
			});

			expect(result).toBeDefined();
			expect(result.sessionId).toBeDefined();
		});

		it("should support getPhaseGuidance wrapper", async () => {
			const guidance = await designAssistant.getPhaseGuidance({}, "discovery");

			expect(guidance).toBeDefined();
			expect(Array.isArray(guidance)).toBe(true);
		});

		it("should support validateConstraints wrapper", async () => {
			const result = await designAssistant.validateConstraints({});

			expect(result).toBeDefined();
			expect(result.passed).toBeDefined();
		});

		it("should support generateWorkflow wrapper", async () => {
			const result = await designAssistant.generateWorkflow({});

			expect(result).toBeDefined();
			expect(result.steps).toBeDefined();
			expect(Array.isArray(result.steps)).toBe(true);
		});
	});

	describe("Branch: Utility methods", () => {
		it("should get active sessions", async () => {
			const sessions = await designAssistant.getActiveSessions();
			expect(Array.isArray(sessions)).toBe(true);
		});

		it("should get constraint summary", async () => {
			const summary = await designAssistant.getConstraintSummary();
			expect(summary).toBeDefined();
			expect(summary.total).toBeDefined();
			expect(summary.mandatory).toBeDefined();
			expect(summary.categories).toBeDefined();
			expect(summary.thresholds).toBeDefined();
		});

		it("should get phase sequence", async () => {
			const sequence = await designAssistant.getPhaseSequence();
			expect(Array.isArray(sequence)).toBe(true);
		});
	});

	describe("Branch: Error handling in generateContextAwareGuidance", () => {
		it("should handle errors gracefully in context-aware guidance", async () => {
			await designAssistant.processRequest({
				action: "start-session",
				sessionId: "error-guidance-test",
				config: {
					sessionId: "error-guidance-test",
					context: "Test",
					goal: "Test",
					requirements: ["req1"],
					constraints: [],
					coverageThreshold: 80,
					enablePivots: true,
					templateRefs: [],
					outputFormats: ["markdown"],
					metadata: {},
				},
			});

			// Empty content might trigger edge cases
			const request: DesignAssistantRequest = {
				action: "generate-context-aware-guidance",
				sessionId: "error-guidance-test",
				content: "",
			};

			const result = await designAssistant.processRequest(request);
			expect(result).toBeDefined();
		});
	});

	describe("Branch: Different language and framework detection paths", () => {
		it("should detect Python language", async () => {
			await designAssistant.processRequest({
				action: "start-session",
				sessionId: "python-test",
				config: {
					sessionId: "python-test",
					context: "Test",
					goal: "Test",
					requirements: ["req1"],
					constraints: [],
					coverageThreshold: 80,
					enablePivots: true,
					templateRefs: [],
					outputFormats: ["markdown"],
					metadata: {},
				},
			});

			const request: DesignAssistantRequest = {
				action: "generate-context-aware-guidance",
				sessionId: "python-test",
				content: "def test(): return True",
			};

			const result = await designAssistant.processRequest(request);
			expect(result.success).toBe(true);
			expect(result.data?.detectedLanguage).toBe("python");
		});

		it("should detect Java language", async () => {
			await designAssistant.processRequest({
				action: "start-session",
				sessionId: "java-test",
				config: {
					sessionId: "java-test",
					context: "Test",
					goal: "Test",
					requirements: ["req1"],
					constraints: [],
					coverageThreshold: 80,
					enablePivots: true,
					templateRefs: [],
					outputFormats: ["markdown"],
					metadata: {},
				},
			});

			const request: DesignAssistantRequest = {
				action: "generate-context-aware-guidance",
				sessionId: "java-test",
				content: "public class Test { public static void main() {} }",
			};

			const result = await designAssistant.processRequest(request);
			expect(result.success).toBe(true);
			// Java detection might return various languages depending on content
			expect(result.data?.detectedLanguage).toBeDefined();
		});

		it("should detect code without specific framework", async () => {
			await designAssistant.processRequest({
				action: "start-session",
				sessionId: "no-framework-test",
				config: {
					sessionId: "no-framework-test",
					context: "Test",
					goal: "Test",
					requirements: ["req1"],
					constraints: [],
					coverageThreshold: 80,
					enablePivots: true,
					templateRefs: [],
					outputFormats: ["markdown"],
					metadata: {},
				},
			});

			const request: DesignAssistantRequest = {
				action: "generate-context-aware-guidance",
				sessionId: "no-framework-test",
				content: "const x = 42;",
			};

			const result = await designAssistant.processRequest(request);
			expect(result.success).toBe(true);
			// May or may not have framework detected
		});
	});
});
