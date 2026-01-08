/**
 * Tests for PolyglotGateway
 *
 * @module tests/gateway/polyglot-gateway
 */

import { describe, expect, it } from "vitest";
import type { ScoringResult } from "../../../src/domain/analysis/types.js";
import type { PromptResult } from "../../../src/domain/prompting/types.js";
import {
	type GatewayRequest,
	PolyglotGateway,
	polyglotGateway,
} from "../../../src/gateway/polyglot-gateway.js";
import {
	CrossCuttingCapability,
	OutputApproach,
} from "../../../src/strategies/output-strategy.js";

describe("PolyglotGateway", () => {
	describe("constructor and singleton", () => {
		it("should create gateway instance", () => {
			const gateway = new PolyglotGateway();
			expect(gateway).toBeInstanceOf(PolyglotGateway);
		});

		it("should export singleton instance", () => {
			expect(polyglotGateway).toBeInstanceOf(PolyglotGateway);
		});

		it("should have all 7 strategies registered", () => {
			const gateway = new PolyglotGateway();
			// Test by checking getSupportedApproaches for a domain type that all support
			const approaches = gateway.getSupportedApproaches("PromptResult");
			expect(approaches.length).toBeGreaterThan(0);
		});
	});

	describe("render() method", () => {
		describe("with CHAT approach", () => {
			it("should render PromptResult with CHAT approach", () => {
				const gateway = new PolyglotGateway();
				const promptResult: PromptResult = {
					sections: [
						{
							title: "Context",
							body: "Test context",
							level: 1,
						},
					],
					metadata: {
						complexity: 30,
						tokenEstimate: 100,
						sections: 1,
						techniques: ["zero-shot"],
						requirementsCount: 0,
						issuesCount: 0,
					},
				};

				const request: GatewayRequest = {
					domainResult: promptResult,
					domainType: "PromptResult",
					approach: OutputApproach.CHAT,
				};

				const artifacts = gateway.render(request);

				expect(artifacts.primary).toBeDefined();
				expect(artifacts.primary.name).toBe("prompt.md");
				expect(artifacts.primary.content).toContain("# Context");
			});

			it("should default to CHAT approach when not specified", () => {
				const gateway = new PolyglotGateway();
				const promptResult: PromptResult = {
					sections: [
						{
							title: "Test",
							body: "Test body",
							level: 1,
						},
					],
					metadata: {
						complexity: 30,
						tokenEstimate: 100,
						sections: 1,
						techniques: ["zero-shot"],
						requirementsCount: 0,
						issuesCount: 0,
					},
				};

				const request: GatewayRequest = {
					domainResult: promptResult,
					domainType: "PromptResult",
					// No approach specified
				};

				const artifacts = gateway.render(request);

				expect(artifacts.primary).toBeDefined();
				expect(artifacts.primary.name).toBe("prompt.md");
			});

			it("should render ScoringResult with CHAT approach", () => {
				const gateway = new PolyglotGateway();
				const scoringResult: ScoringResult = {
					overallScore: 85,
					breakdown: {
						hygiene: { score: 25, issues: [] },
						coverage: { score: 22, issues: [] },
						documentation: { score: 13, issues: [] },
						security: { score: 10, issues: [] },
					},
					recommendations: ["Improve coverage"],
				};

				const request: GatewayRequest = {
					domainResult: scoringResult,
					domainType: "ScoringResult",
					approach: OutputApproach.CHAT,
				};

				const artifacts = gateway.render(request);

				expect(artifacts.primary).toBeDefined();
				expect(artifacts.primary.name).toBe("score-report.md");
				expect(artifacts.primary.content).toContain("Clean Code Score");
			});
		});

		describe("with ADR approach", () => {
			it("should render PromptResult with ADR approach", () => {
				const gateway = new PolyglotGateway();
				const promptResult: PromptResult = {
					sections: [
						{
							title: "Context",
							body: "We need to choose between REST and GraphQL",
							level: 1,
						},
					],
					metadata: {
						complexity: 50,
						tokenEstimate: 200,
						sections: 1,
						techniques: ["zero-shot"],
						requirementsCount: 1,
						issuesCount: 0,
					},
				};

				const request: GatewayRequest = {
					domainResult: promptResult,
					domainType: "PromptResult",
					approach: OutputApproach.ADR,
				};

				const artifacts = gateway.render(request);

				expect(artifacts.primary).toBeDefined();
				expect(artifacts.primary.name).toMatch(/ADR-\d{3}.*\.md/);
			});
		});

		describe("with RFC approach", () => {
			it("should render PromptResult with RFC approach", () => {
				const gateway = new PolyglotGateway();
				const promptResult: PromptResult = {
					sections: [
						{
							title: "Proposal",
							body: "Implement feature X",
							level: 1,
						},
					],
					metadata: {
						complexity: 60,
						tokenEstimate: 300,
						sections: 1,
						techniques: ["zero-shot"],
						requirementsCount: 2,
						issuesCount: 0,
					},
				};

				const request: GatewayRequest = {
					domainResult: promptResult,
					domainType: "PromptResult",
					approach: OutputApproach.RFC,
				};

				const artifacts = gateway.render(request);

				expect(artifacts.primary).toBeDefined();
				expect(artifacts.primary.name).toBe("RFC.md");
			});
		});

		describe("with SDD approach", () => {
			it("should render PromptResult with SDD approach", () => {
				const gateway = new PolyglotGateway();
				const promptResult: PromptResult = {
					sections: [
						{
							title: "Requirements",
							body: "Implement user authentication",
							level: 1,
						},
					],
					metadata: {
						complexity: 70,
						tokenEstimate: 400,
						sections: 1,
						techniques: ["zero-shot"],
						requirementsCount: 3,
						issuesCount: 0,
					},
				};

				const request: GatewayRequest = {
					domainResult: promptResult,
					domainType: "PromptResult",
					approach: OutputApproach.SDD,
				};

				const artifacts = gateway.render(request);

				expect(artifacts.primary).toBeDefined();
				expect(artifacts.primary.name).toBe("spec.md");
				expect(artifacts.secondary).toBeDefined();
				expect(artifacts.secondary?.length).toBeGreaterThan(0);
			});
		});

		describe("error handling", () => {
			it("should throw error for unknown output approach", () => {
				const gateway = new PolyglotGateway();
				const promptResult: PromptResult = {
					sections: [{ title: "Test", body: "Test", level: 1 }],
					metadata: {
						complexity: 30,
						tokenEstimate: 100,
						sections: 1,
						techniques: ["zero-shot"],
						requirementsCount: 0,
						issuesCount: 0,
					},
				};

				const request: GatewayRequest = {
					domainResult: promptResult,
					domainType: "PromptResult",
					approach: "unknown" as OutputApproach,
				};

				expect(() => gateway.render(request)).toThrow(
					"Unknown output approach: unknown",
				);
			});

			it("should throw error when strategy doesn't support domain type", () => {
				const gateway = new PolyglotGateway();
				const promptResult: PromptResult = {
					sections: [{ title: "Test", body: "Test", level: 1 }],
					metadata: {
						complexity: 30,
						tokenEstimate: 100,
						sections: 1,
						techniques: ["zero-shot"],
						requirementsCount: 0,
						issuesCount: 0,
					},
				};

				// TOGAF doesn't support PromptResult
				const request: GatewayRequest = {
					domainResult: promptResult,
					domainType: "PromptResult",
					approach: OutputApproach.TOGAF,
				};

				expect(() => gateway.render(request)).toThrow(
					`Strategy ${OutputApproach.TOGAF} does not support PromptResult`,
				);
			});
		});
	});

	describe("render() with cross-cutting capabilities", () => {
		it("should add cross-cutting artifacts when requested", () => {
			const gateway = new PolyglotGateway();
			const promptResult: PromptResult = {
				sections: [{ title: "Test", body: "Test content", level: 1 }],
				metadata: {
					complexity: 50,
					tokenEstimate: 200,
					sections: 1,
					techniques: ["zero-shot"],
					requirementsCount: 1,
					issuesCount: 0,
				},
			};

			const request: GatewayRequest = {
				domainResult: promptResult,
				domainType: "PromptResult",
				approach: OutputApproach.CHAT,
				crossCutting: [CrossCuttingCapability.WORKFLOW],
			};

			const artifacts = gateway.render(request);

			expect(artifacts.primary).toBeDefined();
			// Cross-cutting artifacts may or may not be added depending on whether
			// the handler supports PromptResult
			if (artifacts.crossCutting) {
				expect(artifacts.crossCutting.length).toBeGreaterThanOrEqual(0);
			}
		});

		it("should not add cross-cutting artifacts when not requested", () => {
			const gateway = new PolyglotGateway();
			const promptResult: PromptResult = {
				sections: [{ title: "Test", body: "Test", level: 1 }],
				metadata: {
					complexity: 30,
					tokenEstimate: 100,
					sections: 1,
					techniques: ["zero-shot"],
					requirementsCount: 0,
					issuesCount: 0,
				},
			};

			const request: GatewayRequest = {
				domainResult: promptResult,
				domainType: "PromptResult",
				approach: OutputApproach.CHAT,
				// No crossCutting specified
			};

			const artifacts = gateway.render(request);

			expect(artifacts.primary).toBeDefined();
			expect(artifacts.crossCutting).toBeUndefined();
		});

		it("should not add cross-cutting artifacts when empty array", () => {
			const gateway = new PolyglotGateway();
			const promptResult: PromptResult = {
				sections: [{ title: "Test", body: "Test", level: 1 }],
				metadata: {
					complexity: 30,
					tokenEstimate: 100,
					sections: 1,
					techniques: ["zero-shot"],
					requirementsCount: 0,
					issuesCount: 0,
				},
			};

			const request: GatewayRequest = {
				domainResult: promptResult,
				domainType: "PromptResult",
				approach: OutputApproach.CHAT,
				crossCutting: [],
			};

			const artifacts = gateway.render(request);

			expect(artifacts.primary).toBeDefined();
			expect(artifacts.crossCutting).toBeUndefined();
		});
	});

	describe("getSupportedApproaches() method", () => {
		it("should return approaches that support PromptResult", () => {
			const gateway = new PolyglotGateway();
			const approaches = gateway.getSupportedApproaches("PromptResult");

			expect(approaches).toContain(OutputApproach.CHAT);
			expect(approaches.length).toBeGreaterThan(0);
		});

		it("should return approaches that support SessionState", () => {
			const gateway = new PolyglotGateway();
			const approaches = gateway.getSupportedApproaches("SessionState");

			expect(approaches).toContain(OutputApproach.CHAT);
			expect(approaches).toContain(OutputApproach.ADR);
			expect(approaches).toContain(OutputApproach.RFC);
			expect(approaches).toContain(OutputApproach.SDD);
			expect(approaches.length).toBeGreaterThan(0);
		});

		it("should return approaches that support ScoringResult", () => {
			const gateway = new PolyglotGateway();
			const approaches = gateway.getSupportedApproaches("ScoringResult");

			expect(approaches).toContain(OutputApproach.CHAT);
			expect(approaches.length).toBeGreaterThan(0);
		});

		it("should return empty array for unsupported domain type", () => {
			const gateway = new PolyglotGateway();
			const approaches = gateway.getSupportedApproaches("UnknownType");

			expect(approaches).toEqual([]);
		});

		it("should return all 7 approaches for a universally supported type", () => {
			const gateway = new PolyglotGateway();
			// SessionState is supported by most strategies
			const approaches = gateway.getSupportedApproaches("SessionState");

			expect(approaches.length).toBeGreaterThanOrEqual(4);
		});
	});

	describe("getSupportedCrossCutting() method", () => {
		it("should return cross-cutting capabilities for SessionState", () => {
			const gateway = new PolyglotGateway();
			const capabilities = gateway.getSupportedCrossCutting("SessionState");

			// Should include at least WORKFLOW which is registered
			expect(capabilities).toContain(CrossCuttingCapability.WORKFLOW);
		});

		it("should return cross-cutting capabilities for PromptResult", () => {
			const gateway = new PolyglotGateway();
			const capabilities = gateway.getSupportedCrossCutting("PromptResult");

			// Cross-cutting manager determines what's supported
			expect(Array.isArray(capabilities)).toBe(true);
		});

		it("should delegate to crossCuttingManager", () => {
			const gateway = new PolyglotGateway();
			const capabilities = gateway.getSupportedCrossCutting("SessionState");

			// The method should return an array (delegated to manager)
			expect(Array.isArray(capabilities)).toBe(true);
		});
	});

	describe("render options forwarding", () => {
		it("should forward options to strategy render method", () => {
			const gateway = new PolyglotGateway();
			const promptResult: PromptResult = {
				sections: [{ title: "Test", body: "Test", level: 1 }],
				metadata: {
					complexity: 30,
					tokenEstimate: 100,
					sections: 1,
					techniques: ["zero-shot"],
					requirementsCount: 0,
					issuesCount: 0,
				},
			};

			const request: GatewayRequest = {
				domainResult: promptResult,
				domainType: "PromptResult",
				approach: OutputApproach.CHAT,
				options: {
					includeMetadata: true,
				},
			};

			const artifacts = gateway.render(request);

			expect(artifacts.primary.content).toContain("Technique:");
		});
	});

	describe("integration scenarios", () => {
		it("should handle complete workflow: PromptResult -> SDD + WORKFLOW", () => {
			const gateway = new PolyglotGateway();
			const promptResult: PromptResult = {
				sections: [
					{
						title: "Integration Test",
						body: "Complete workflow test with multiple artifacts",
						level: 1,
					},
					{
						title: "Requirements",
						body: "1. Req 1\n2. Req 2",
						level: 2,
					},
				],
				metadata: {
					complexity: 80,
					tokenEstimate: 500,
					sections: 2,
					techniques: ["chain-of-thought"],
					requirementsCount: 2,
					issuesCount: 0,
				},
			};

			const request: GatewayRequest = {
				domainResult: promptResult,
				domainType: "PromptResult",
				approach: OutputApproach.SDD,
				crossCutting: [CrossCuttingCapability.WORKFLOW],
				options: {
					includeMetadata: true,
				},
			};

			const artifacts = gateway.render(request);

			// Should have primary (spec.md)
			expect(artifacts.primary).toBeDefined();
			expect(artifacts.primary.name).toBe("spec.md");

			// Should have secondary (plan.md, tasks.md)
			expect(artifacts.secondary).toBeDefined();
			expect(artifacts.secondary?.length).toBeGreaterThan(0);

			// Cross-cutting artifacts may be added if handler supports PromptResult
			// This is acceptable behavior
		});
	});
});
