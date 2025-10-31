import { describe, expect, it } from "vitest";
import { designAssistant } from "../../src/tools/design/design-assistant.js";

describe("Design Assistant - Context-Aware Guidance", () => {
	it("should generate context-aware guidance for TypeScript code", async () => {
		const result = await designAssistant.processRequest({
			action: "generate-context-aware-guidance",
			sessionId: "test-session-001",
			content:
				"This is a TypeScript Node.js backend service with Express framework, implementing REST APIs",
		});

		expect(result.success).toBe(true);
		expect(result.status).toBe("guidance-generated");
		expect(result.message).toContain("typescript");
		expect(result.artifacts).toHaveLength(1);
		expect(result.artifacts[0].name).toBe("Context-Aware Design Guidance");
		expect(result.artifacts[0].content).toContain(
			"Typescript-Specific Design Recommendations",
		);
		expect(result.artifacts[0].content).toContain("SOLID Principles");
		expect(result.data?.detectedLanguage).toBe("typescript");
		expect(result.data?.detectedFramework).toBeDefined();
	});

	it("should generate context-aware guidance for React application", async () => {
		const result = await designAssistant.processRequest({
			action: "generate-context-aware-guidance",
			sessionId: "test-session-002",
			content:
				"This is a React application with functional components using hooks like useState and useEffect",
		});

		expect(result.success).toBe(true);
		expect(result.artifacts[0].content).toContain("react Framework");
		expect(result.artifacts[0].content).toContain("Atomic Design");
		expect(result.data?.detectedFramework).toBe("react");
	});

	it("should generate context-aware guidance for Python Django project", async () => {
		const result = await designAssistant.processRequest({
			action: "generate-context-aware-guidance",
			sessionId: "test-session-003",
			content:
				"This is a Python Django REST API with models.Model and view classes",
		});

		expect(result.success).toBe(true);
		expect(result.artifacts[0].content).toContain(
			"Python-Specific Design Recommendations",
		);
		expect(result.artifacts[0].content).toContain("Django");
		expect(result.data?.detectedLanguage).toBe("python");
		expect(result.data?.detectedFramework).toBe("django");
	});

	it("should handle missing content parameter", async () => {
		const result = await designAssistant.processRequest({
			action: "generate-context-aware-guidance",
			sessionId: "test-session-004",
		});

		expect(result.success).toBe(false);
		expect(result.status).toBe("error");
		expect(result.message).toContain("Content is required");
	});

	it("should include recommendations about detected language and framework", async () => {
		const result = await designAssistant.processRequest({
			action: "generate-context-aware-guidance",
			sessionId: "test-session-005",
			content: "This is a Spring Boot Java application with REST controllers",
		});

		expect(result.success).toBe(true);
		expect(result.recommendations).toContain("Detected language: java");
		expect(result.recommendations.some((r) => r.includes("framework"))).toBe(
			true,
		);
	});

	it("should generate guidance for code without specific framework", async () => {
		const result = await designAssistant.processRequest({
			action: "generate-context-aware-guidance",
			sessionId: "test-session-006",
			content: "This is a Go application with func and package definitions",
		});

		expect(result.success).toBe(true);
		expect(result.data?.detectedLanguage).toBe("go");
		expect(result.artifacts[0].content).toContain(
			"Go-Specific Design Recommendations",
		);
	});

	it("should handle minimal content in context-aware guidance generation", async () => {
		// Test with minimal content
		const result = await designAssistant.processRequest({
			action: "generate-context-aware-guidance",
			sessionId: "test-session-007",
			content: "some code", // Minimal content should still work
		});

		expect(result.success).toBe(true);
		expect(result.artifacts).toHaveLength(1);
		expect(result.data?.detectedLanguage).toBe("auto-detect");
	});
});
