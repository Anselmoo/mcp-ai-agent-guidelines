import { describe, expect, it } from "vitest";
import { hierarchicalPromptBuilder } from "../../src/tools/prompt/hierarchical-prompt-builder";

describe("hierarchical-prompt-builder actionable instructions", () => {
	it("should generate context-specific chain-of-thought instructions", async () => {
		const result = await hierarchicalPromptBuilder({
			context: "A Node.js service using Passport.js",
			goal: "Refactor the authentication logic",
			requirements: ["Improve security", "Separate concerns", "Add tests"],
			issues: ["Hardcoded secrets"],
			techniques: ["chain-of-thought"],
			includeTechniqueHints: true,
		});

		const text = result.content[0].text;

		// Should include context-specific approach section
		expect(text).toContain("# Approach");
		expect(text).toContain("Think through this problem step-by-step:");

		// Should reference the actual context in the instructions
		expect(text).toContain("A Node.js service using Passport.js");

		// Should reference the actual goal
		expect(text).toContain("Refactor the authentication logic");

		// Should reference the specific requirements
		expect(text).toContain("Improve security");
		expect(text).toContain("Separate concerns");
		expect(text).toContain("Add tests");

		// Should reference the problems
		expect(text).toContain("Hardcoded secrets");

		// Should NOT contain generic advice
		expect(text).not.toContain(
			"Ask for step-by-step reasoning on complex problems",
		);
	});

	it("should generate task-specific few-shot examples for code tasks", async () => {
		const result = await hierarchicalPromptBuilder({
			context: "Legacy codebase",
			goal: "Refactor authentication module",
			techniques: ["few-shot"],
			includeTechniqueHints: true,
		});

		const text = result.content[0].text;

		// Should include unified Approach section (technique guidance consolidated from previous examples/technique sections in domain refactor)
		expect(text).toContain("# Approach");
		expect(text).toContain(
			"Here are examples of how to approach similar tasks",
		);

		// Should detect code task and generate relevant example
		expect(text).toContain("Code Refactoring");
		expect(text).toContain("authentication");
	});

	it("should generate task-specific few-shot examples for analysis tasks", async () => {
		const result = await hierarchicalPromptBuilder({
			context: "Microservices system",
			goal: "Analyze dependency structure",
			techniques: ["few-shot"],
			includeTechniqueHints: true,
		});

		const text = result.content[0].text;

		// Should detect analysis task and generate relevant example (using Approach section)
		expect(text).toContain("# Approach");
		expect(text).toContain("Analysis");
	});

	it("should generate RAG-specific document handling instructions", async () => {
		const result = await hierarchicalPromptBuilder({
			context: "Technical documentation repository",
			goal: "Create API documentation from source code",
			techniques: ["rag"],
			includeTechniqueHints: true,
		});

		const text = result.content[0].text;

		// Should include approach section with document handling instructions
		expect(text).toContain("# Approach");
		expect(text).toContain(
			"When working with documents or external knowledge sources",
		);
		expect(text).toContain("Retrieve Relevant Information");
		expect(text).toContain("Quote and Cite");
		expect(text).toContain("Synthesize Information");

		// Should reference the actual goal
		expect(text).toContain("Create API documentation from source code");
	});

	it("should generate prompt-chaining workflow with specific steps", async () => {
		const result = await hierarchicalPromptBuilder({
			context: "E-commerce platform",
			goal: "Implement payment processing",
			requirements: [
				"Integrate payment gateway",
				"Add fraud detection",
				"Create transaction logs",
			],
			techniques: ["prompt-chaining"],
			includeTechniqueHints: true,
		});

		const text = result.content[0].text;

		// Should include approach section with workflow
		expect(text).toContain("# Approach");
		expect(text).toContain("Break this task into sequential steps");

		// Should reference actual context and goal
		expect(text).toContain("E-commerce platform");
		expect(text).toContain("Implement payment processing");

		// Should include specific requirements in the workflow
		expect(text).toContain("Integrate payment gateway");
		expect(text).toContain("Add fraud detection");
		expect(text).toContain("Create transaction logs");
	});

	it("should generate tree-of-thoughts exploration framework", async () => {
		const result = await hierarchicalPromptBuilder({
			context: "Scalability challenges",
			goal: "Design caching strategy",
			techniques: ["tree-of-thoughts"],
			includeTechniqueHints: true,
		});

		const text = result.content[0].text;

		// Should include approach section with alternatives exploration
		expect(text).toContain("# Approach");
		expect(text).toContain("Generate Alternatives");
		expect(text).toContain("Evaluate Each Path");
		expect(text).toContain("Select Best Path");

		// Should reference the actual goal
		expect(text).toContain("Design caching strategy");
	});

	it("should generate knowledge gathering framework", async () => {
		const result = await hierarchicalPromptBuilder({
			context: "New technology stack",
			goal: "Migrate from REST to GraphQL",
			techniques: ["generate-knowledge"],
			includeTechniqueHints: true,
		});

		const text = result.content[0].text;

		// Should include approach section with knowledge gathering
		expect(text).toContain("# Approach");
		expect(text).toContain(
			"Before solving the task, gather and document relevant knowledge",
		);
		expect(text).toContain("List Key Facts");
		expect(text).toContain("Identify Assumptions");
		expect(text).toContain("Apply Knowledge");

		// Should reference the actual context
		expect(text).toContain("New technology stack");
	});

	it("should combine multiple techniques into comprehensive guidance", async () => {
		const result = await hierarchicalPromptBuilder({
			context: "Monolithic application",
			goal: "Migrate to microservices architecture",
			requirements: [
				"Identify service boundaries",
				"Define APIs",
				"Plan migration",
			],
			techniques: ["chain-of-thought", "few-shot", "prompt-chaining"],
			includeTechniqueHints: true,
		});

		const text = result.content[0].text;

		// Should include approach section with combined technique guidance
		expect(text).toContain("# Approach");
		expect(text).toContain("Think through this problem step-by-step"); // chain-of-thought
		expect(text).toContain("examples of how to approach"); // few-shot
		expect(text).toContain("Break this task into sequential steps"); // prompt-chaining

		// All should reference the actual context and requirements
		expect(text).toContain("Monolithic application");
		expect(text).toContain("Migrate to microservices architecture");
	});

	it("should not generate technique sections when disabled", async () => {
		const result = await hierarchicalPromptBuilder({
			context: "Simple task",
			goal: "Fix typo in documentation",
			techniques: ["chain-of-thought"],
			includeTechniqueHints: false, // Disabled
		});

		const text = result.content[0].text;

		// Should NOT include technique sections when disabled
		expect(text).not.toContain("# Approach");
		expect(text).not.toContain("# Examples");
		expect(text).not.toContain("Think through this problem step-by-step");
	});

	it("should generate task-specific few-shot examples for documentation tasks", async () => {
		const result = await hierarchicalPromptBuilder({
			context: "API codebase",
			goal: "Document API endpoints for the REST service",
			techniques: ["few-shot"],
			includeTechniqueHints: true,
		});

		const text = result.content[0].text;

		// Should detect documentation task and generate relevant example in Approach section
		expect(text).toContain("# Approach");
		expect(text).toContain("Documentation");
		expect(text).toContain("API endpoints");
	});

	it("should handle prompt-chaining without requirements", async () => {
		const result = await hierarchicalPromptBuilder({
			context: "Feature implementation needed",
			goal: "Add payment processing",
			techniques: ["prompt-chaining"],
			includeTechniqueHints: true,
		});

		const text = result.content[0].text;

		// Should include approach section with workflow even without requirements
		expect(text).toContain("# Approach");
		expect(text).toContain("Execute the planned changes");
	});
});
