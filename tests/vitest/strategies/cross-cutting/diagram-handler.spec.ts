/**
 * Tests for DiagramCapabilityHandler
 *
 * Verifies diagram generation, type detection, and domain type support.
 */

import { describe, expect, it } from "vitest";
import { DiagramCapabilityHandler } from "../../../../src/strategies/cross-cutting/diagram-handler.js";
import type { CapabilityContext } from "../../../../src/strategies/cross-cutting/types.js";
import { CrossCuttingCapability } from "../../../../src/strategies/output-strategy.js";

describe("DiagramCapabilityHandler", () => {
	const handler = new DiagramCapabilityHandler();

	describe("capability", () => {
		it("should have DIAGRAM capability", () => {
			expect(handler.capability).toBe(CrossCuttingCapability.DIAGRAM);
		});
	});

	describe("supports()", () => {
		it("should support SessionState domain type", () => {
			expect(handler.supports("SessionState")).toBe(true);
		});

		it("should support ScoringResult domain type", () => {
			expect(handler.supports("ScoringResult")).toBe(true);
		});

		it("should support PromptResult domain type", () => {
			expect(handler.supports("PromptResult")).toBe(true);
		});

		it("should not support unknown domain types", () => {
			expect(handler.supports("UnknownType")).toBe(false);
			expect(handler.supports("RandomDomain")).toBe(false);
		});
	});

	describe("generate()", () => {
		describe("with valid context", () => {
			it("should generate flowchart diagram for session state", () => {
				const context: CapabilityContext = {
					domainResult: {
						phase: "design",
						description: "Design session workflow",
					},
					primaryDocument: "# Design Session\n\nContent...",
				};

				const artifact = handler.generate(context);

				expect(artifact).not.toBeNull();
				expect(artifact?.type).toBe(CrossCuttingCapability.DIAGRAM);
				expect(artifact?.name).toBe("diagrams/flowchart-diagram.md");
				expect(artifact?.content).toContain("# Flowchart Diagram");
				expect(artifact?.content).toContain("```mermaid");
				expect(artifact?.content).toContain("flowchart TD");
			});

			it("should generate sequence diagram for workflow data", () => {
				const context: CapabilityContext = {
					domainResult: {
						steps: ["step1", "step2"],
						description: "API workflow",
					},
					primaryDocument: "# API Documentation",
				};

				const artifact = handler.generate(context);

				expect(artifact).not.toBeNull();
				expect(artifact?.type).toBe(CrossCuttingCapability.DIAGRAM);
				expect(artifact?.name).toBe("diagrams/sequence-diagram.md");
				expect(artifact?.content).toContain("# Sequence Diagram");
				expect(artifact?.content).toContain("sequenceDiagram");
			});

			it("should generate class diagram for component data", () => {
				const context: CapabilityContext = {
					domainResult: {
						components: ["ComponentA", "ComponentB"],
						description: "Architecture overview",
					},
					primaryDocument: "# Architecture",
				};

				const artifact = handler.generate(context);

				expect(artifact).not.toBeNull();
				expect(artifact?.name).toBe("diagrams/class-diagram.md");
				expect(artifact?.content).toContain("# Class Diagram");
				expect(artifact?.content).toContain("classDiagram");
			});

			it("should use metadata diagram type if provided", () => {
				const context: CapabilityContext = {
					domainResult: {
						data: "some data",
					},
					primaryDocument: "# Document",
					metadata: {
						diagramType: "sequence",
						description: "Custom sequence",
					},
				};

				const artifact = handler.generate(context);

				expect(artifact).not.toBeNull();
				expect(artifact?.name).toBe("diagrams/sequence-diagram.md");
				expect(artifact?.content).toContain("sequenceDiagram");
			});

			it("should use metadata description if provided", () => {
				const context: CapabilityContext = {
					domainResult: {},
					primaryDocument: "# Document",
					metadata: {
						description: "Metadata description",
					},
				};

				const artifact = handler.generate(context);

				expect(artifact).not.toBeNull();
				expect(artifact?.content).toContain("```mermaid");
			});

			it("should extract description from domain result fields", () => {
				const testCases = [
					{ description: "From description field" },
					{ title: "From title field" },
					{ summary: "From summary field" },
				];

				for (const domainResult of testCases) {
					const context: CapabilityContext = {
						domainResult,
						primaryDocument: "# Document",
					};

					const artifact = handler.generate(context);
					expect(artifact).not.toBeNull();
				}
			});

			it("should wrap diagram in markdown format", () => {
				const context: CapabilityContext = {
					domainResult: { description: "Test diagram" },
					primaryDocument: "# Test",
				};

				const artifact = handler.generate(context);

				expect(artifact).not.toBeNull();
				expect(artifact?.content).toContain("# Flowchart Diagram");
				expect(artifact?.content).toContain("```mermaid");
				expect(artifact?.content).toContain("---");
				expect(artifact?.content).toContain("*Generated diagram*");
			});
		});

		describe("with invalid context", () => {
			it("should return null when no description is available", () => {
				const context: CapabilityContext = {
					domainResult: { data: "no description" },
					primaryDocument: "# Document",
				};

				const artifact = handler.generate(context);

				expect(artifact).toBeNull();
			});

			it("should return null for empty domain result", () => {
				const context: CapabilityContext = {
					domainResult: {},
					primaryDocument: "# Document",
				};

				const artifact = handler.generate(context);

				expect(artifact).toBeNull();
			});

			it("should return null for null domain result", () => {
				const context: CapabilityContext = {
					domainResult: null,
					primaryDocument: "# Document",
				};

				const artifact = handler.generate(context);

				expect(artifact).toBeNull();
			});

			it("should return null for primitive domain result", () => {
				const context: CapabilityContext = {
					domainResult: "string value",
					primaryDocument: "# Document",
				};

				const artifact = handler.generate(context);

				expect(artifact).toBeNull();
			});
		});

		describe("diagram type detection", () => {
			it("should detect flowchart for phase-related data", () => {
				const testCases = [
					{ phase: "design" },
					{ phases: ["phase1", "phase2"] },
					{ currentPhase: "implementation" },
				];

				for (const domainResult of testCases) {
					const context: CapabilityContext = {
						domainResult: { ...domainResult, description: "test" },
						primaryDocument: "# Test",
					};

					const artifact = handler.generate(context);
					expect(artifact?.name).toBe("diagrams/flowchart-diagram.md");
				}
			});

			it("should detect class diagram for architecture data", () => {
				const testCases = [
					{ components: ["A", "B"] },
					{ classes: ["ClassA", "ClassB"] },
					{ interfaces: ["IA", "IB"] },
				];

				for (const domainResult of testCases) {
					const context: CapabilityContext = {
						domainResult: { ...domainResult, description: "test" },
						primaryDocument: "# Test",
					};

					const artifact = handler.generate(context);
					expect(artifact?.name).toBe("diagrams/class-diagram.md");
				}
			});

			it("should detect sequence diagram for workflow data", () => {
				const testCases = [
					{ steps: ["step1", "step2"] },
					{ workflow: ["action1", "action2"] },
					{ interactions: ["int1", "int2"] },
				];

				for (const domainResult of testCases) {
					const context: CapabilityContext = {
						domainResult: { ...domainResult, description: "test" },
						primaryDocument: "# Test",
					};

					const artifact = handler.generate(context);
					expect(artifact?.name).toBe("diagrams/sequence-diagram.md");
				}
			});

			it("should default to flowchart for unknown structures", () => {
				const context: CapabilityContext = {
					domainResult: {
						unknownField: "value",
						description: "test",
					},
					primaryDocument: "# Test",
				};

				const artifact = handler.generate(context);
				expect(artifact?.name).toBe("diagrams/flowchart-diagram.md");
			});
		});

		describe("diagram content validation", () => {
			it("should generate valid mermaid flowchart syntax", () => {
				const context: CapabilityContext = {
					domainResult: { description: "test" },
					primaryDocument: "# Test",
				};

				const artifact = handler.generate(context);

				expect(artifact?.content).toContain("flowchart TD");
				expect(artifact?.content).toMatch(/A\[Start\]/);
				expect(artifact?.content).toMatch(/B\{Decision\}/);
				expect(artifact?.content).toContain("-->");
			});

			it("should generate valid mermaid sequence syntax", () => {
				const context: CapabilityContext = {
					domainResult: { steps: ["a"], description: "test" },
					primaryDocument: "# Test",
				};

				const artifact = handler.generate(context);

				expect(artifact?.content).toContain("sequenceDiagram");
				expect(artifact?.content).toContain("participant");
				expect(artifact?.content).toMatch(/->>|-->>/);
			});

			it("should generate valid mermaid class diagram syntax", () => {
				const context: CapabilityContext = {
					domainResult: { components: ["A"], description: "test" },
					primaryDocument: "# Test",
				};

				const artifact = handler.generate(context);

				expect(artifact?.content).toContain("classDiagram");
				expect(artifact?.content).toContain("class Component");
				expect(artifact?.content).toMatch(/\+method\(\)/);
			});
		});
	});
});
