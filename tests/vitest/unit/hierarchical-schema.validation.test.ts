import { describe, expect, it } from "vitest";
import {
	_buildHierarchicalFrontmatter,
	_normalizeOutputFormat,
	hierarchicalPromptBuilder,
} from "../../../src/tools/prompt/hierarchical-prompt-builder";

type ErrorResponse = { isError?: boolean; content: { text: string }[] };

describe("hierarchical-schema.validation - Schema Validation and Canonicalization", () => {
	describe("Required fields validation", () => {
		it("should return error when context is missing", async () => {
			const result = (await hierarchicalPromptBuilder({
				goal: "Build a feature",
				requirements: ["requirement 1"],
			})) as ErrorResponse;
			expect(result.isError).toBe(true);
		});

		it("should return error when goal is missing", async () => {
			const result = (await hierarchicalPromptBuilder({
				context: "Microservices architecture",
				requirements: ["requirement 1"],
			})) as ErrorResponse;
			expect(result.isError).toBe(true);
		});

		it("should return error when both context and goal are missing", async () => {
			const result = (await hierarchicalPromptBuilder({
				requirements: ["requirement 1"],
			})) as ErrorResponse;
			expect(result.isError).toBe(true);
		});
	});

	describe("Type validation - Wrong types should be rejected", () => {
		it("should return error when context is a number", async () => {
			const result = (await hierarchicalPromptBuilder({
				context: 123,
				goal: "Build a feature",
			})) as ErrorResponse;
			expect(result.isError).toBe(true);
		});

		it("should return error when goal is a number", async () => {
			const result = (await hierarchicalPromptBuilder({
				context: "Microservices architecture",
				goal: 456,
			})) as ErrorResponse;
			expect(result.isError).toBe(true);
		});

		it("should return error when context is an object", async () => {
			const result = (await hierarchicalPromptBuilder({
				context: { text: "some context" },
				goal: "Build a feature",
			})) as ErrorResponse;
			expect(result.isError).toBe(true);
		});

		it("should return error when goal is an array", async () => {
			const result = (await hierarchicalPromptBuilder({
				context: "Microservices architecture",
				goal: ["goal1", "goal2"],
			})) as ErrorResponse;
			expect(result.isError).toBe(true);
		});

		it("should return error when requirements is not an array", async () => {
			const result = (await hierarchicalPromptBuilder({
				context: "Microservices architecture",
				goal: "Build a feature",
				requirements: "single requirement",
			})) as ErrorResponse;
			expect(result.isError).toBe(true);
		});

		it("should return error when requirements contains non-strings", async () => {
			const result = (await hierarchicalPromptBuilder({
				context: "Microservices architecture",
				goal: "Build a feature",
				requirements: ["req1", 123, "req3"],
			})) as ErrorResponse;
			expect(result.isError).toBe(true);
		});
	});

	describe("Techniques field - String and array coercion", () => {
		it("should accept techniques as a single string and coerce to array", async () => {
			const result = await hierarchicalPromptBuilder({
				context: "Microservices architecture",
				goal: "Build a feature",
				techniques: "chain-of-thought",
			});
			expect(result.content[0].type).toBe("text");
			// Should generate actionable instructions based on chain-of-thought
			expect(result.content[0].text).toContain("Approach");
		});

		it("should accept techniques as an array of strings", async () => {
			const result = await hierarchicalPromptBuilder({
				context: "Microservices architecture",
				goal: "Build a feature",
				techniques: ["chain-of-thought", "few-shot"],
			});
			expect(result.content[0].type).toBe("text");
			// Should generate actionable instructions for both techniques
			expect(result.content[0].text).toContain("Approach"); // chain-of-thought
			expect(result.content[0].text).toContain("Examples"); // few-shot
		});

		it("should return error for invalid technique values", async () => {
			const result = (await hierarchicalPromptBuilder({
				context: "Microservices architecture",
				goal: "Build a feature",
				techniques: ["invalid-technique"],
			})) as ErrorResponse;
			expect(result.isError).toBe(true);
		});

		it("should return error for invalid technique in coerced string", async () => {
			const result = (await hierarchicalPromptBuilder({
				context: "Microservices architecture",
				goal: "Build a feature",
				techniques: "not-a-valid-technique",
			})) as ErrorResponse;
			expect(result.isError).toBe(true);
		});

		it("should handle empty array of techniques", async () => {
			const result = await hierarchicalPromptBuilder({
				context: "Microservices architecture",
				goal: "Build a feature",
				techniques: [],
			});
			expect(result.content[0].type).toBe("text");
		});
	});

	describe("Provider field validation", () => {
		it("should accept valid provider values", async () => {
			const result = await hierarchicalPromptBuilder({
				context: "Microservices architecture",
				goal: "Build a feature",
				provider: "claude-opus-4.1",
			});
			expect(result.content[0].type).toBe("text");
		});

		it("should accept 'other' as a valid provider", async () => {
			const result = await hierarchicalPromptBuilder({
				context: "Microservices architecture",
				goal: "Build a feature",
				provider: "other",
			});
			expect(result.content[0].type).toBe("text");
		});

		it("should return error for invalid provider values", async () => {
			const result = (await hierarchicalPromptBuilder({
				context: "Microservices architecture",
				goal: "Build a feature",
				provider: "invalid-provider",
			})) as ErrorResponse;
			expect(result.isError).toBe(true);
		});

		it("should use default provider when not specified", async () => {
			const result = await hierarchicalPromptBuilder({
				context: "Microservices architecture",
				goal: "Build a feature",
			});
			expect(result.content[0].type).toBe("text");
			// Default should be GPT-5
		});
	});

	describe("Mode field validation", () => {
		it("should accept valid mode values - agent", async () => {
			const result = await hierarchicalPromptBuilder({
				context: "Microservices architecture",
				goal: "Build a feature",
				mode: "agent",
			});
			expect(result.content[0].type).toBe("text");
		});

		it("should accept valid mode values - tool", async () => {
			const result = await hierarchicalPromptBuilder({
				context: "Microservices architecture",
				goal: "Build a feature",
				mode: "tool",
			});
			expect(result.content[0].type).toBe("text");
		});

		it("should accept valid mode values - workflow", async () => {
			const result = await hierarchicalPromptBuilder({
				context: "Microservices architecture",
				goal: "Build a feature",
				mode: "workflow",
			});
			expect(result.content[0].type).toBe("text");
		});

		it("should return error for invalid mode values", async () => {
			const result = (await hierarchicalPromptBuilder({
				context: "Microservices architecture",
				goal: "Build a feature",
				mode: "invalid-mode",
			})) as ErrorResponse;
			expect(result.isError).toBe(true);
		});

		it("should use default mode when not specified", async () => {
			const result = await hierarchicalPromptBuilder({
				context: "Microservices architecture",
				goal: "Build a feature",
			});
			expect(result.content[0].type).toBe("text");
			// Default should be "agent"
		});
	});

	describe("Style field validation", () => {
		it("should accept markdown style", async () => {
			const result = await hierarchicalPromptBuilder({
				context: "Microservices architecture",
				goal: "Build a feature",
				style: "markdown",
			});
			expect(result.content[0].type).toBe("text");
		});

		it("should accept xml style", async () => {
			const result = await hierarchicalPromptBuilder({
				context: "Microservices architecture",
				goal: "Build a feature",
				style: "xml",
			});
			expect(result.content[0].type).toBe("text");
		});

		it("should return error for invalid style values", async () => {
			const result = (await hierarchicalPromptBuilder({
				context: "Microservices architecture",
				goal: "Build a feature",
				style: "invalid-style",
			})) as ErrorResponse;
			expect(result.isError).toBe(true);
		});
	});

	describe("OutputFormat field validation and edge cases", () => {
		it("should accept outputFormat as a string", async () => {
			const result = await hierarchicalPromptBuilder({
				context: "Microservices architecture",
				goal: "Build a feature",
				outputFormat: "JSON with error handling",
			});
			expect(result.content[0].type).toBe("text");
			expect(result.content[0].text).toContain("JSON with error handling");
		});

		it("should handle outputFormat with special characters", async () => {
			const result = await hierarchicalPromptBuilder({
				context: "Microservices architecture",
				goal: "Build a feature",
				outputFormat: "Format: 1) Item A, 2) Item B, 3) Item C",
			});
			expect(result.content[0].type).toBe("text");
		});

		it("should handle outputFormat with newlines", async () => {
			const result = await hierarchicalPromptBuilder({
				context: "Microservices architecture",
				goal: "Build a feature",
				outputFormat: "Line 1\nLine 2\nLine 3",
			});
			expect(result.content[0].type).toBe("text");
		});

		it("should handle empty outputFormat string", async () => {
			const result = await hierarchicalPromptBuilder({
				context: "Microservices architecture",
				goal: "Build a feature",
				outputFormat: "",
			});
			expect(result.content[0].type).toBe("text");
		});

		it("should handle missing outputFormat (optional field)", async () => {
			const result = await hierarchicalPromptBuilder({
				context: "Microservices architecture",
				goal: "Build a feature",
			});
			expect(result.content[0].type).toBe("text");
		});
	});

	describe("Complex validation scenarios", () => {
		it("should accept all valid fields together", async () => {
			const result = await hierarchicalPromptBuilder({
				context: "Microservices architecture with event-driven design",
				goal: "Build a scalable payment processing system",
				requirements: [
					"Handle 10k requests per second",
					"Support multiple payment providers",
					"Ensure PCI compliance",
				],
				outputFormat: "Detailed technical specification with diagrams",
				audience: "Senior software engineers and architects",
				mode: "agent",
				model: "GPT-5",
				tools: ["githubRepo", "codebase", "editFiles"],
				description: "Payment system design",
				includeFrontmatter: true,
				includeDisclaimer: true,
				includeReferences: true,
				issues: ["High latency", "Poor error handling"],
				includeExplanation: true,
				includeMetadata: true,
				inputFile: "payment-spec.md",
				forcePromptMdStyle: true,
				techniques: ["chain-of-thought", "few-shot"],
				includeTechniqueHints: true,
				includePitfalls: true,
				autoSelectTechniques: false,
				provider: "gpt-5",
				style: "markdown",
			});
			expect(result.content[0].type).toBe("text");
			expect(result.content[0].text).toContain("Context");
			expect(result.content[0].text).toContain("Goal");
			expect(result.content[0].text).toContain("Requirements");
		});

		it("should handle minimal valid input", async () => {
			const result = await hierarchicalPromptBuilder({
				context: "Simple app",
				goal: "Add feature",
			});
			expect(result.content[0].type).toBe("text");
			expect(result.content[0].text).toContain("Context");
			expect(result.content[0].text).toContain("Goal");
		});
	});

	describe("Boolean field validation", () => {
		it("should reject non-boolean values for includeFrontmatter", async () => {
			const result = await hierarchicalPromptBuilder({
				context: "Microservices architecture",
				goal: "Build a feature",
				includeFrontmatter: "yes",
			});
			expect((result as { isError?: boolean }).isError).toBe(true);
			expect(result.content[0].text).toContain("validation");
		});

		it("should reject non-boolean values for includeDisclaimer", async () => {
			const result = await hierarchicalPromptBuilder({
				context: "Microservices architecture",
				goal: "Build a feature",
				includeDisclaimer: 1,
			});
			expect((result as { isError?: boolean }).isError).toBe(true);
			expect(result.content[0].text).toContain("validation");
		});

		it("should accept boolean true/false for all boolean fields", async () => {
			const result = await hierarchicalPromptBuilder({
				context: "Microservices architecture",
				goal: "Build a feature",
				includeFrontmatter: false,
				includeDisclaimer: false,
				includeReferences: true,
				includeExplanation: true,
				includeMetadata: false,
				forcePromptMdStyle: false,
				includeTechniqueHints: false,
				includePitfalls: false,
				autoSelectTechniques: true,
			});
			expect(result.content[0].type).toBe("text");
		});
	});

	describe("Helper functions - normalizeOutputFormat", () => {
		it("should convert '1) Item' to '1. Item'", () => {
			const input = "1) First item 2) Second item";
			const result = _normalizeOutputFormat(input);
			expect(result).toContain("1. First item");
			expect(result).toContain("2. Second item");
		});

		it("should split inline enumerated lists with commas", () => {
			const input = "1. First, 2. Second, 3. Third";
			const result = _normalizeOutputFormat(input);
			// Should be on separate lines
			expect(result).toContain("1. First");
			expect(result).toContain("2. Second");
			expect(result).toContain("3. Third");
		});

		it("should preserve existing line breaks", () => {
			const input = "1) First\n2) Second\n3) Third";
			const result = _normalizeOutputFormat(input);
			expect(result).toContain("1. First");
			expect(result).toContain("2. Second");
			expect(result).toContain("3. Third");
		});

		it("should handle empty string", () => {
			const result = _normalizeOutputFormat("");
			expect(result).toBe("");
		});

		it("should handle text without list markers", () => {
			const input = "Just plain text without any markers";
			const result = _normalizeOutputFormat(input);
			expect(result).toBe(input);
		});
	});

	describe("Helper functions - buildHierarchicalFrontmatter", () => {
		it("should build frontmatter with basic input", () => {
			const result = _buildHierarchicalFrontmatter({
				context: "Test context",
				goal: "Test goal",
				mode: "agent",
				model: "GPT-5",
				tools: ["githubRepo", "codebase"],
			});
			expect(result).toContain("---");
			expect(result).toContain("mode: 'agent'");
			expect(result).toContain("model: GPT-5");
		});

		it("should use goal as description fallback", () => {
			const result = _buildHierarchicalFrontmatter({
				context: "Test context",
				goal: "Test goal",
				mode: "agent",
				model: "GPT-5",
			});
			expect(result).toContain("description: 'Test goal'");
		});

		it("should use description if provided", () => {
			const result = _buildHierarchicalFrontmatter({
				context: "Test context",
				goal: "Test goal",
				description: "Custom description",
				mode: "agent",
				model: "GPT-5",
			});
			expect(result).toContain("description: 'Custom description'");
		});
	});

	describe("Array field validation", () => {
		it("should accept tools as array of strings", async () => {
			const result = await hierarchicalPromptBuilder({
				context: "Microservices architecture",
				goal: "Build a feature",
				tools: ["tool1", "tool2", "tool3"],
			});
			expect(result.content[0].type).toBe("text");
		});

		it("should reject tools as non-array", async () => {
			const result = await hierarchicalPromptBuilder({
				context: "Microservices architecture",
				goal: "Build a feature",
				tools: "single-tool",
			});
			expect((result as { isError?: boolean }).isError).toBe(true);
			expect(result.content[0].text).toContain("validation");
		});

		it("should reject tools array with non-string elements", async () => {
			const result = await hierarchicalPromptBuilder({
				context: "Microservices architecture",
				goal: "Build a feature",
				tools: ["tool1", 123, "tool3"],
			});
			expect((result as { isError?: boolean }).isError).toBe(true);
			expect(result.content[0].text).toContain("validation");
		});

		it("should accept issues as array of strings", async () => {
			const result = await hierarchicalPromptBuilder({
				context: "Microservices architecture",
				goal: "Build a feature",
				issues: ["Issue 1", "Issue 2"],
			});
			expect(result.content[0].type).toBe("text");
			expect(result.content[0].text).toContain("Problem Indicators");
		});

		it("should reject issues as non-array", async () => {
			const result = await hierarchicalPromptBuilder({
				context: "Microservices architecture",
				goal: "Build a feature",
				issues: "single-issue",
			});
			expect((result as { isError?: boolean }).isError).toBe(true);
			expect(result.content[0].text).toContain("validation");
		});
	});
});
