import { describe, expect, it } from "vitest";
import { debuggingAssistantPromptBuilder } from "../../src/tools/prompt/debugging-assistant-prompt-builder.js";

describe("debugging-assistant-prompt-builder", () => {
	it("should generate debugging assistant prompt with full context", async () => {
		const result = await debuggingAssistantPromptBuilder({
			errorDescription: "Memory leak in Node.js application causing crashes",
			context: "Express server with MongoDB connections and WebSocket handlers",
			attemptedSolutions:
				"Tried restarting server, checked for event listeners, reviewed connection pooling",
			includeReferences: true,
		});

		const text = result.content[0].text;

		// Check for basic structure
		expect(text).toContain("Debugging Assistant Prompt");
		expect(text).toContain("Debugging Assistant");

		// Check for problem description
		expect(text).toContain("Problem Description");
		expect(text).toContain("Memory leak");

		// Check for context
		expect(text).toContain("Additional Context");
		expect(text).toContain("Express server");
		expect(text).toContain("MongoDB");

		// Check for attempted solutions
		expect(text).toContain("Previously Attempted Solutions");
		expect(text).toContain("restarting server");

		// Check for references
		expect(text).toContain("References");
	});

	it("should handle minimal input with defaults", async () => {
		const result = await debuggingAssistantPromptBuilder({
			errorDescription: "Null pointer exception in payment processing",
		});

		const text = result.content[0].text;

		expect(text).toContain("Null pointer exception");
		expect(text).toContain("No additional context provided");
		expect(text).toContain("none specified");
	});

	it("should include systematic debugging approach", async () => {
		const result = await debuggingAssistantPromptBuilder({
			errorDescription: "API returns 500 error intermittently",
		});

		const text = result.content[0].text;

		// Check for systematic approach sections
		expect(text).toContain("Systematic Debugging Approach");
		expect(text).toContain("Problem Analysis");
		expect(text).toContain("Root Cause Investigation");
		expect(text).toContain("Hypothesis Formation");
		expect(text).toContain("Solution Development");
	});

	it("should include debugging checklist", async () => {
		const result = await debuggingAssistantPromptBuilder({
			errorDescription: "Database connection timeouts",
		});

		const text = result.content[0].text;

		expect(text).toContain("Debugging Checklist");
		expect(text).toContain("Information Gathering");
		expect(text).toContain("Analysis Steps");
		expect(text).toContain("Testing Approach");
	});

	it("should include comprehensive checklist items", async () => {
		const result = await debuggingAssistantPromptBuilder({
			errorDescription: "Performance degradation over time",
		});

		const text = result.content[0].text;

		// Information gathering items
		expect(text).toContain("error messages");
		expect(text).toContain("Environment details");
		expect(text).toContain("Steps to reproduce");

		// Analysis items
		expect(text).toContain("Isolate the problem");
		expect(text).toContain("Verify input data");
		expect(text).toContain("resource constraints");

		// Testing items
		expect(text).toContain("minimal reproduction");
		expect(text).toContain("isolated environment");
		expect(text).toContain("edge cases");
	});

	it("should include output format requirements", async () => {
		const result = await debuggingAssistantPromptBuilder({
			errorDescription: "Race condition in concurrent requests",
		});

		const text = result.content[0].text;

		expect(text).toContain("Output Format");
		expect(text).toContain("Problem Analysis Summary");
		expect(text).toContain("Recommended Solutions");
		expect(text).toContain("Verification Steps");
		expect(text).toContain("Prevention Strategy");
	});

	it("should include follow-up actions", async () => {
		const result = await debuggingAssistantPromptBuilder({
			errorDescription: "Authentication failures",
		});

		const text = result.content[0].text;

		expect(text).toContain("Follow-up Actions");
		expect(text).toContain("Code review");
		expect(text).toContain("Testing improvements");
		expect(text).toContain("Documentation updates");
	});

	it("should respect includeMetadata flag", async () => {
		const result = await debuggingAssistantPromptBuilder({
			errorDescription: "Test error",
			includeMetadata: false,
		});

		const text = result.content[0].text;

		expect(text).not.toMatch(/\*\*Source Tool\*\*/);
	});

	it("should respect includeFrontmatter flag", async () => {
		const result = await debuggingAssistantPromptBuilder({
			errorDescription: "Test error",
			includeFrontmatter: false,
			forcePromptMdStyle: false,
		});

		const text = result.content[0].text;

		expect(text).not.toMatch(/^---/);
	});

	it("should include symptom classification and impact assessment", async () => {
		const result = await debuggingAssistantPromptBuilder({
			errorDescription: "Data corruption in cache layer",
			context: "Redis cluster with multiple writers",
		});

		const text = result.content[0].text;

		expect(text).toContain("Symptom Classification");
		expect(text).toContain("Impact Assessment");
		expect(text).toContain("Environment Factors");
	});
});
