import { describe, expect, it } from "vitest";
import {
	applyTechniques,
	type TechniqueContext,
} from "../../src/tools/prompt/technique-applicator.js";

describe("TechniqueApplicator", () => {
	const baseContext: TechniqueContext = {
		context: "Node.js microservices architecture",
		goal: "Implement authentication service",
		requirements: ["Use JWT tokens", "Add rate limiting", "Implement OAuth"],
		outputFormat: "TypeScript code with tests",
		issues: ["Current auth is insecure", "No rate limiting"],
	};

	describe("applyTechniques", () => {
		it("should return empty string when no techniques are selected", () => {
			const result = applyTechniques({
				context: baseContext,
				techniques: [],
				autoSelectTechniques: false,
			});

			expect(result).toBe("");
		});

		it("should apply Chain-of-Thought technique with context-specific instructions", () => {
			const result = applyTechniques({
				context: baseContext,
				techniques: ["chain-of-thought"],
			});

			// Should include context-specific approach section
			expect(result).toContain("# Approach");
			expect(result).toContain("Think through this problem step-by-step:");

			// Should reference the actual context
			expect(result).toContain("Node.js microservices architecture");

			// Should reference the actual goal
			expect(result).toContain("Implement authentication service");

			// Should reference specific requirements
			expect(result).toContain("Use JWT tokens");
			expect(result).toContain("Add rate limiting");
			expect(result).toContain("Implement OAuth");

			// Should reference the problems
			expect(result).toContain("Current auth is insecure");
			expect(result).toContain("No rate limiting");

			// Should reference output format
			expect(result).toContain("TypeScript code with tests");

			// Should NOT contain generic advice
			expect(result).not.toContain(
				"Ask for step-by-step reasoning on complex problems",
			);
		});

		it("should apply Few-Shot technique with task-specific examples", () => {
			const codeContext: TechniqueContext = {
				context: "Legacy codebase",
				goal: "Refactor authentication module",
			};

			const result = applyTechniques({
				context: codeContext,
				techniques: ["few-shot"],
			});

			// Should include examples section
			expect(result).toContain("# Examples");
			expect(result).toContain(
				"Here are examples of how to approach similar tasks",
			);

			// Should detect code task and generate relevant example
			expect(result).toContain("Code Refactoring");
			expect(result).toContain("authentication");
		});

		it("should apply Few-Shot technique with analysis-specific examples", () => {
			const analysisContext: TechniqueContext = {
				context: "Microservices system",
				goal: "Analyze dependency structure",
			};

			const result = applyTechniques({
				context: analysisContext,
				techniques: ["few-shot"],
			});

			// Should detect analysis task and generate relevant example
			expect(result).toContain("# Examples");
			expect(result).toContain("Analysis");
		});

		it("should apply Few-Shot technique with documentation-specific examples", () => {
			const docContext: TechniqueContext = {
				context: "API codebase",
				goal: "Document API endpoints for the REST service",
			};

			const result = applyTechniques({
				context: docContext,
				techniques: ["few-shot"],
			});

			// Should detect documentation task and generate relevant example
			expect(result).toContain("# Examples");
			expect(result).toContain("Documentation");
			expect(result).toContain("API endpoints");
		});

		it("should apply Few-Shot technique with security-specific examples", () => {
			const securityContext: TechniqueContext = {
				context: "Web application",
				goal: "Analyze authentication security vulnerabilities",
			};

			const result = applyTechniques({
				context: securityContext,
				techniques: ["few-shot"],
			});

			// Should detect security task and generate relevant example
			expect(result).toContain("# Examples");
			expect(result).toContain("Security Analysis");
			expect(result).toContain("authentication");
		});

		it("should apply RAG technique with document handling instructions", () => {
			const result = applyTechniques({
				context: {
					context: "Technical documentation repository",
					goal: "Create API documentation from source code",
				},
				techniques: ["rag"],
			});

			// Should include document handling section
			expect(result).toContain("# Document Handling");
			expect(result).toContain(
				"When working with documents or external knowledge sources",
			);
			expect(result).toContain("Retrieve Relevant Information");
			expect(result).toContain("Quote and Cite");
			expect(result).toContain("Synthesize Information");

			// Should reference the actual goal
			expect(result).toContain("Create API documentation from source code");
		});

		it("should apply Prompt Chaining technique with specific workflow steps", () => {
			const result = applyTechniques({
				context: baseContext,
				techniques: ["prompt-chaining"],
			});

			// Should include workflow section
			expect(result).toContain("# Step-by-Step Workflow");
			expect(result).toContain("Break this task into sequential steps");

			// Should reference actual context and goal
			expect(result).toContain("Node.js microservices architecture");
			expect(result).toContain("Implement authentication service");

			// Should include specific requirements in the workflow
			expect(result).toContain("Use JWT tokens");
			expect(result).toContain("Add rate limiting");
			expect(result).toContain("Implement OAuth");
		});

		it("should apply Prompt Chaining without requirements", () => {
			const result = applyTechniques({
				context: {
					context: "Web application",
					goal: "Implement new feature",
				},
				techniques: ["prompt-chaining"],
			});

			// Should include workflow section even without requirements
			expect(result).toContain("# Step-by-Step Workflow");
			expect(result).toContain("Execute the planned changes");
		});

		it("should apply Tree of Thoughts technique with exploration framework", () => {
			const result = applyTechniques({
				context: {
					context: "Scalability challenges",
					goal: "Design caching strategy",
				},
				techniques: ["tree-of-thoughts"],
			});

			// Should include alternatives exploration section
			expect(result).toContain("# Explore Alternative Approaches");
			expect(result).toContain("Generate Alternatives");
			expect(result).toContain("Evaluate Each Path");
			expect(result).toContain("Select Best Path");

			// Should reference the actual goal
			expect(result).toContain("Design caching strategy");
		});

		it("should apply Generate Knowledge technique with knowledge gathering framework", () => {
			const result = applyTechniques({
				context: {
					context: "New technology stack",
					goal: "Migrate from REST to GraphQL",
				},
				techniques: ["generate-knowledge"],
			});

			// Should include knowledge gathering section
			expect(result).toContain("# Knowledge Gathering");
			expect(result).toContain(
				"Before solving the task, gather and document relevant knowledge",
			);
			expect(result).toContain("List Key Facts");
			expect(result).toContain("Identify Assumptions");
			expect(result).toContain("Apply Knowledge");

			// Should reference the actual context
			expect(result).toContain("New technology stack");
		});

		it("should apply Self-Consistency technique with verification steps", () => {
			const result = applyTechniques({
				context: baseContext,
				techniques: ["self-consistency"],
			});

			// Should include verification section
			expect(result).toContain("# Verification and Consistency");
			expect(result).toContain("Ensure accuracy through multiple approaches");
			expect(result).toContain("Generate Multiple Solutions");
			expect(result).toContain("Compare Results");
			expect(result).toContain("Select Consensus");
		});

		it("should apply ReAct technique with tool use pattern", () => {
			const result = applyTechniques({
				context: baseContext,
				techniques: ["react"],
			});

			// Should include reasoning and tool use section
			expect(result).toContain("# Reasoning and Tool Use");
			expect(result).toContain(
				"Interleave thinking and action when tools are available",
			);
			expect(result).toContain("Thought");
			expect(result).toContain("Action");
			expect(result).toContain("Observation");

			// Should reference the actual goal
			expect(result).toContain("Implement authentication service");
		});

		it("should apply Zero-Shot technique with direct instructions", () => {
			const result = applyTechniques({
				context: baseContext,
				techniques: ["zero-shot"],
			});

			// Should include direct instructions
			expect(result).toContain("# Direct Instructions");
			expect(result).toContain("Implement authentication service");
			expect(result).toContain("Use JWT tokens");
		});

		it("should apply In-Context Learning technique", () => {
			const result = applyTechniques({
				context: baseContext,
				techniques: ["in-context-learning"],
			});

			// Should include pattern recognition section
			expect(result).toContain("# Pattern Recognition");
			expect(result).toContain("Identify and apply patterns");
			expect(result).toContain("Node.js microservices architecture");
		});

		it("should apply Meta-Prompting technique", () => {
			const result = applyTechniques({
				context: baseContext,
				techniques: ["meta-prompting"],
			});

			// Should include meta-analysis section
			expect(result).toContain("# Meta-Analysis");
			expect(result).toContain("optimize the approach");
			expect(result).toContain("Implement authentication service");
		});

		it("should apply ART technique", () => {
			const result = applyTechniques({
				context: baseContext,
				techniques: ["art"],
			});

			// Should include automatic tool selection section
			expect(result).toContain("# Automatic Tool Selection");
			expect(result).toContain("Identify Required Tools");
			expect(result).toContain("Implement authentication service");
		});

		it("should combine multiple techniques in proper order", () => {
			const result = applyTechniques({
				context: baseContext,
				techniques: ["chain-of-thought", "few-shot", "prompt-chaining"],
			});

			// Should include all technique-specific sections
			expect(result).toContain("# Approach"); // chain-of-thought
			expect(result).toContain("# Examples"); // few-shot
			expect(result).toContain("# Step-by-Step Workflow"); // prompt-chaining

			// All should reference the actual context and requirements
			expect(result).toContain("Node.js microservices architecture");
			expect(result).toContain("Implement authentication service");
		});

		it("should auto-select techniques based on context text", () => {
			const ragContext: TechniqueContext = {
				context: "Large documentation repository with PDFs and manuals",
				goal: "Extract and cite relevant information about deployment",
			};

			const result = applyTechniques({
				context: ragContext,
				autoSelectTechniques: true,
			});

			// Should auto-detect RAG from context
			expect(result).toContain("Document Handling");
		});

		it("should auto-select chain-of-thought for reasoning tasks", () => {
			const reasoningContext: TechniqueContext = {
				context: "Complex algorithm",
				goal: "Explain why this sorting algorithm works step by step",
			};

			const result = applyTechniques({
				context: reasoningContext,
				autoSelectTechniques: true,
			});

			// Should auto-detect chain-of-thought from context
			expect(result).toContain("# Approach");
		});

		it("should auto-select prompt-chaining for multi-step workflows", () => {
			const workflowContext: TechniqueContext = {
				context: "CI/CD pipeline",
				goal: "Analyze the pipeline and then recommend improvements",
			};

			const result = applyTechniques({
				context: workflowContext,
				autoSelectTechniques: true,
			});

			// Should auto-detect prompt-chaining from context
			expect(result).toContain("# Step-by-Step Workflow");
		});

		it("should handle context with minimal information", () => {
			const minimalContext: TechniqueContext = {
				context: "A project",
				goal: "Do something",
			};

			const result = applyTechniques({
				context: minimalContext,
				techniques: ["chain-of-thought"],
			});

			// Should still generate instructions even with minimal context
			expect(result).toContain("# Approach");
			expect(result).toContain("A project");
			expect(result).toContain("Do something");
		});

		it("should apply techniques in optimal order", () => {
			const result = applyTechniques({
				context: baseContext,
				techniques: [
					"react",
					"generate-knowledge",
					"chain-of-thought",
					"few-shot",
				],
			});

			const knowledgeIndex = result.indexOf("# Knowledge Gathering");
			const approachIndex = result.indexOf("# Approach");
			const examplesIndex = result.indexOf("# Examples");
			const reactIndex = result.indexOf("# Reasoning and Tool Use");

			// Knowledge should come first, then chain-of-thought, then few-shot, then react
			expect(knowledgeIndex).toBeGreaterThan(-1);
			expect(approachIndex).toBeGreaterThan(knowledgeIndex);
			expect(examplesIndex).toBeGreaterThan(approachIndex);
			expect(reactIndex).toBeGreaterThan(examplesIndex);
		});
	});
});
