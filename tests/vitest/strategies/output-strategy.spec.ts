/**
 * Tests for OutputStrategy interfaces and types
 *
 * @module tests/strategies/output-strategy
 */

import { describe, expect, it } from "vitest";
import {
	type CrossCuttingArtifact,
	CrossCuttingCapability,
	OutputApproach,
	type OutputArtifacts,
	type OutputDocument,
	type OutputStrategy,
	type RenderOptions,
} from "../../../src/strategies/index.js";

describe("OutputApproach enum", () => {
	it("should have exactly 7 approach values", () => {
		const values = Object.values(OutputApproach);
		expect(values).toHaveLength(7);
	});

	it("should contain all required approach types", () => {
		expect(OutputApproach.CHAT).toBe("chat");
		expect(OutputApproach.RFC).toBe("rfc");
		expect(OutputApproach.ADR).toBe("adr");
		expect(OutputApproach.SDD).toBe("sdd");
		expect(OutputApproach.TOGAF).toBe("togaf");
		expect(OutputApproach.ENTERPRISE).toBe("enterprise");
		expect(OutputApproach.SPECKIT).toBe("speckit");
	});

	it("should use lowercase string values", () => {
		const values = Object.values(OutputApproach);
		for (const value of values) {
			expect(value).toBe(value.toLowerCase());
		}
	});
});

describe("CrossCuttingCapability enum", () => {
	it("should have exactly 6 capability values", () => {
		const values = Object.values(CrossCuttingCapability);
		expect(values).toHaveLength(6);
	});

	it("should contain all required capability types", () => {
		expect(CrossCuttingCapability.WORKFLOW).toBe("workflow");
		expect(CrossCuttingCapability.SHELL_SCRIPT).toBe("shell-script");
		expect(CrossCuttingCapability.DIAGRAM).toBe("diagram");
		expect(CrossCuttingCapability.CONFIG).toBe("config");
		expect(CrossCuttingCapability.ISSUES).toBe("issues");
		expect(CrossCuttingCapability.PR_TEMPLATE).toBe("pr-template");
	});

	it("should use kebab-case for multi-word values", () => {
		expect(CrossCuttingCapability.SHELL_SCRIPT).toContain("-");
		expect(CrossCuttingCapability.PR_TEMPLATE).toContain("-");
	});
});

describe("OutputDocument interface", () => {
	it("should accept valid markdown document", () => {
		const doc: OutputDocument = {
			name: "spec.md",
			content: "# Specification\n\nContent here",
			format: "markdown",
		};

		expect(doc.name).toBe("spec.md");
		expect(doc.content).toContain("Specification");
		expect(doc.format).toBe("markdown");
	});

	it("should accept all supported formats", () => {
		const formats: Array<"markdown" | "yaml" | "json" | "shell"> = [
			"markdown",
			"yaml",
			"json",
			"shell",
		];

		for (const format of formats) {
			const doc: OutputDocument = {
				name: `test.${format}`,
				content: "test content",
				format,
			};
			expect(doc.format).toBe(format);
		}
	});
});

describe("CrossCuttingArtifact interface", () => {
	it("should create workflow artifact", () => {
		const artifact: CrossCuttingArtifact = {
			type: CrossCuttingCapability.WORKFLOW,
			name: "ci.yml",
			content: "name: CI\non: push",
		};

		expect(artifact.type).toBe(CrossCuttingCapability.WORKFLOW);
		expect(artifact.name).toBe("ci.yml");
		expect(artifact.content).toContain("CI");
	});

	it("should create diagram artifact", () => {
		const artifact: CrossCuttingArtifact = {
			type: CrossCuttingCapability.DIAGRAM,
			name: "architecture.mmd",
			content: "graph TD; A-->B",
		};

		expect(artifact.type).toBe(CrossCuttingCapability.DIAGRAM);
		expect(artifact.content).toContain("graph");
	});

	it("should create shell script artifact", () => {
		const artifact: CrossCuttingArtifact = {
			type: CrossCuttingCapability.SHELL_SCRIPT,
			name: "deploy.sh",
			content: "#!/bin/bash\necho 'Deploying...'",
		};

		expect(artifact.type).toBe(CrossCuttingCapability.SHELL_SCRIPT);
		expect(artifact.content).toContain("#!/bin/bash");
	});
});

describe("OutputArtifacts interface", () => {
	it("should create artifacts with primary document only", () => {
		const artifacts: OutputArtifacts = {
			primary: {
				name: "rfc.md",
				content: "# RFC",
				format: "markdown",
			},
		};

		expect(artifacts.primary).toBeDefined();
		expect(artifacts.secondary).toBeUndefined();
		expect(artifacts.crossCutting).toBeUndefined();
	});

	it("should create artifacts with secondary documents", () => {
		const artifacts: OutputArtifacts = {
			primary: {
				name: "spec.md",
				content: "# Spec",
				format: "markdown",
			},
			secondary: [
				{
					name: "plan.md",
					content: "# Plan",
					format: "markdown",
				},
				{
					name: "tasks.md",
					content: "# Tasks",
					format: "markdown",
				},
			],
		};

		expect(artifacts.primary.name).toBe("spec.md");
		expect(artifacts.secondary).toHaveLength(2);
		expect(artifacts.secondary?.[0].name).toBe("plan.md");
		expect(artifacts.secondary?.[1].name).toBe("tasks.md");
	});

	it("should create artifacts with cross-cutting capabilities", () => {
		const artifacts: OutputArtifacts = {
			primary: {
				name: "adr.md",
				content: "# ADR",
				format: "markdown",
			},
			crossCutting: [
				{
					type: CrossCuttingCapability.WORKFLOW,
					name: "ci.yml",
					content: "name: CI",
				},
				{
					type: CrossCuttingCapability.DIAGRAM,
					name: "diagram.mmd",
					content: "graph TD",
				},
			],
		};

		expect(artifacts.crossCutting).toHaveLength(2);
		expect(artifacts.crossCutting?.[0].type).toBe(
			CrossCuttingCapability.WORKFLOW,
		);
		expect(artifacts.crossCutting?.[1].type).toBe(
			CrossCuttingCapability.DIAGRAM,
		);
	});
});

describe("RenderOptions interface", () => {
	it("should create options with approach only", () => {
		const options: RenderOptions = {
			approach: OutputApproach.RFC,
		};

		expect(options.approach).toBe(OutputApproach.RFC);
		expect(options.crossCutting).toBeUndefined();
		expect(options.includeMetadata).toBeUndefined();
		expect(options.verbosity).toBeUndefined();
	});

	it("should create options with all properties", () => {
		const options: RenderOptions = {
			approach: OutputApproach.ADR,
			crossCutting: [
				CrossCuttingCapability.WORKFLOW,
				CrossCuttingCapability.DIAGRAM,
			],
			includeMetadata: true,
			verbosity: "verbose",
		};

		expect(options.approach).toBe(OutputApproach.ADR);
		expect(options.crossCutting).toHaveLength(2);
		expect(options.includeMetadata).toBe(true);
		expect(options.verbosity).toBe("verbose");
	});

	it("should accept all verbosity levels", () => {
		const levels: Array<"minimal" | "standard" | "verbose"> = [
			"minimal",
			"standard",
			"verbose",
		];

		for (const verbosity of levels) {
			const options: RenderOptions = {
				approach: OutputApproach.CHAT,
				verbosity,
			};
			expect(options.verbosity).toBe(verbosity);
		}
	});
});

describe("OutputStrategy interface", () => {
	// Mock domain result type
	interface MockDomainResult {
		title: string;
		content: string;
	}

	// Test implementation
	class TestRFCStrategy implements OutputStrategy<MockDomainResult> {
		readonly approach = OutputApproach.RFC;

		render(
			result: MockDomainResult,
			options?: Partial<RenderOptions>,
		): OutputArtifacts {
			return {
				primary: {
					name: "rfc.md",
					content: `# RFC: ${result.title}\n\n${result.content}`,
					format: "markdown",
				},
				crossCutting: options?.crossCutting?.includes(
					CrossCuttingCapability.WORKFLOW,
				)
					? [
							{
								type: CrossCuttingCapability.WORKFLOW,
								name: "ci.yml",
								content: "name: RFC CI",
							},
						]
					: undefined,
			};
		}

		supports(domainType: string): boolean {
			return domainType === "MockDomainResult";
		}
	}

	it("should implement basic render functionality", () => {
		const strategy = new TestRFCStrategy();
		const result = strategy.render({
			title: "Test RFC",
			content: "This is a test",
		});

		expect(result.primary.name).toBe("rfc.md");
		expect(result.primary.content).toContain("Test RFC");
		expect(result.primary.format).toBe("markdown");
	});

	it("should have readonly approach property", () => {
		const strategy = new TestRFCStrategy();
		expect(strategy.approach).toBe(OutputApproach.RFC);
	});

	it("should support domain type checking", () => {
		const strategy = new TestRFCStrategy();
		expect(strategy.supports("MockDomainResult")).toBe(true);
		expect(strategy.supports("OtherResult")).toBe(false);
	});

	it("should handle partial render options", () => {
		const strategy = new TestRFCStrategy();
		const result = strategy.render(
			{ title: "Test", content: "Content" },
			{
				crossCutting: [CrossCuttingCapability.WORKFLOW],
			},
		);

		expect(result.crossCutting).toBeDefined();
		expect(result.crossCutting).toHaveLength(1);
		expect(result.crossCutting?.[0].type).toBe(CrossCuttingCapability.WORKFLOW);
	});

	it("should preserve compatibility with render-only strategies", () => {
		const strategy = new TestRFCStrategy();
		expect(strategy.validate).toBeUndefined();
		expect(strategy.execute).toBeUndefined();
		expect(strategy.run).toBeUndefined();
	});

	it("should work with different domain result types", () => {
		interface AnalysisResult {
			score: number;
			recommendations: string[];
		}

		class AnalysisStrategy implements OutputStrategy<AnalysisResult> {
			readonly approach = OutputApproach.CHAT;

			render(result: AnalysisResult): OutputArtifacts {
				return {
					primary: {
						name: "analysis.md",
						content: `Score: ${result.score}\nRecommendations: ${result.recommendations.join(", ")}`,
						format: "markdown",
					},
				};
			}

			supports(domainType: string): boolean {
				return domainType === "AnalysisResult";
			}
		}

		const strategy = new AnalysisStrategy();
		const result = strategy.render({
			score: 85,
			recommendations: ["Improve tests", "Add docs"],
		});

		expect(result.primary.content).toContain("85");
		expect(result.primary.content).toContain("Improve tests");
	});

	it("should allow BaseStrategy-compatible lifecycle methods", async () => {
		class LifecycleStrategy implements OutputStrategy<MockDomainResult> {
			readonly approach = OutputApproach.CHAT;

			render(result: MockDomainResult): OutputArtifacts {
				return {
					primary: {
						name: "output.md",
						content: result.content,
						format: "markdown",
					},
				};
			}

			supports(domainType: string): boolean {
				return domainType === "MockDomainResult";
			}

			validate(_result: MockDomainResult) {
				return { valid: true, errors: [], warnings: [] };
			}

			async execute(result: MockDomainResult): Promise<OutputArtifacts> {
				return this.render(result);
			}

			async run(result: MockDomainResult) {
				return {
					success: true as const,
					data: await this.execute(result),
					trace: {
						traceId: "trace-1",
						startTime: new Date(0).toISOString(),
						endTime: new Date(0).toISOString(),
						entries: [],
						summary: {
							totalDecisions: 0,
							totalErrors: 0,
							totalWarnings: 0,
							durationMs: 0,
						},
					},
					durationMs: 0,
				};
			}
		}

		const strategy = new LifecycleStrategy();
		const result = await strategy.run({
			title: "Lifecycle",
			content: "Lifecycle output",
		});

		expect(result?.success).toBe(true);
		expect(result && "data" in result ? result.data.primary.name : "").toBe(
			"output.md",
		);
	});
});
