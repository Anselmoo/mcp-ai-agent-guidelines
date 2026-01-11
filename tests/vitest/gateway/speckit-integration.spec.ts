/**
 * Integration tests for SpecKitStrategy with PolyglotGateway
 *
 * Verifies that the SpecKitStrategy is properly wired to the gateway
 * and can render SessionState domain results into Spec-Kit format.
 *
 * @module tests/gateway/speckit-integration
 */

import { describe, expect, it } from "vitest";
import type { SessionState } from "../../../src/domain/design/types.js";
import {
	type GatewayRequest,
	PolyglotGateway,
	polyglotGateway,
} from "../../../src/gateway/polyglot-gateway.js";
import { OutputApproach } from "../../../src/strategies/output-strategy.js";

describe("SpecKitStrategy Gateway Integration", () => {
	describe("strategy registration", () => {
		it("should have SpecKitStrategy registered in gateway", () => {
			const gateway = new PolyglotGateway();

			// Verify SPECKIT approach is supported for SessionState
			const supportedApproaches =
				gateway.getSupportedApproaches("SessionState");

			expect(supportedApproaches).toContain(OutputApproach.SPECKIT);
		});

		it("should use singleton gateway instance", () => {
			expect(polyglotGateway).toBeInstanceOf(PolyglotGateway);

			const supportedApproaches =
				polyglotGateway.getSupportedApproaches("SessionState");
			expect(supportedApproaches).toContain(OutputApproach.SPECKIT);
		});
	});

	describe("render SessionState with SPECKIT approach", () => {
		it("should render minimal SessionState to Spec-Kit format", () => {
			const gateway = new PolyglotGateway();

			const sessionState: SessionState = {
				id: "test-session-001",
				phase: "discovery",
				context: {
					goal: "Implement feature X",
					overview: "This feature will provide functionality Y",
				},
				history: [],
			};

			const request: GatewayRequest = {
				domainResult: sessionState,
				domainType: "SessionState",
				approach: OutputApproach.SPECKIT,
			};

			const artifacts = gateway.render(request);

			// Verify primary document (README.md)
			expect(artifacts.primary).toBeDefined();
			expect(artifacts.primary.name).toMatch(/README\.md$/);
			expect(artifacts.primary.content).toContain("Spec Kit:");
			// SpecKitStrategy uses context.overview for overview, not goal
			expect(artifacts.primary.content).toContain("functionality Y");
			expect(artifacts.primary.format).toBe("markdown");

			// Verify secondary documents exist
			expect(artifacts.secondary).toBeDefined();
			expect(artifacts.secondary).toHaveLength(6);

			// Verify expected secondary document names
			const secondaryNames = artifacts.secondary?.map((doc) => doc.name) ?? [];
			expect(secondaryNames).toEqual(
				expect.arrayContaining([
					expect.stringMatching(/spec\.md$/),
					expect.stringMatching(/plan\.md$/),
					expect.stringMatching(/tasks\.md$/),
					expect.stringMatching(/progress\.md$/),
					expect.stringMatching(/adr\.md$/),
					expect.stringMatching(/roadmap\.md$/),
				]),
			);
		});

		it("should render SessionState with requirements to Spec-Kit format", () => {
			const gateway = new PolyglotGateway();

			const sessionState: SessionState = {
				id: "test-session-002",
				phase: "requirements",
				context: {
					goal: "User authentication system",
					overview: "Implement secure user authentication",
					requirements: [
						"Support email/password login",
						"Implement JWT tokens",
						"Add password reset functionality",
					],
					acceptanceCriteria: [
						"Users can log in with credentials",
						"JWT tokens expire after 1 hour",
						"Password reset emails are sent",
					],
				},
				config: {
					goal: "User authentication system",
					requirements: [
						"Support email/password login",
						"Implement JWT tokens",
						"Add password reset functionality",
					],
				},
				history: [],
			};

			const request: GatewayRequest = {
				domainResult: sessionState,
				domainType: "SessionState",
				approach: OutputApproach.SPECKIT,
			};

			const artifacts = gateway.render(request);

			// Verify README
			expect(artifacts.primary.content).toContain("User authentication system");

			// Verify spec.md contains requirements
			const specDoc = artifacts.secondary?.find((doc) =>
				doc.name.endsWith("spec.md"),
			);
			expect(specDoc).toBeDefined();
			expect(specDoc?.content).toContain("Support email/password login");
			expect(specDoc?.content).toContain("Implement JWT tokens");
			expect(specDoc?.content).toContain("Add password reset functionality");

			// Verify tasks.md exists
			const tasksDoc = artifacts.secondary?.find((doc) =>
				doc.name.endsWith("tasks.md"),
			);
			expect(tasksDoc).toBeDefined();
			expect(tasksDoc?.content).toContain("Tasks");
		});

		it("should render SessionState with phases to Spec-Kit format", () => {
			const gateway = new PolyglotGateway();

			const sessionState: SessionState = {
				id: "test-session-003",
				phase: "architecture",
				context: {
					goal: "Microservices architecture",
					overview: "Design scalable microservices system",
				},
				phases: {
					discovery: {
						description: "Initial discovery phase",
						deliverables: ["Requirements document"],
						duration: "1 week",
					},
					architecture: {
						description: "Architecture design phase",
						deliverables: ["Architecture diagrams", "Technical specs"],
						duration: "2 weeks",
					},
					implementation: {
						description: "Development phase",
						deliverables: ["Working code", "Unit tests"],
						duration: "4 weeks",
					},
				},
				history: [],
			};

			const request: GatewayRequest = {
				domainResult: sessionState,
				domainType: "SessionState",
				approach: OutputApproach.SPECKIT,
			};

			const artifacts = gateway.render(request);

			// Verify plan.md contains phases
			const planDoc = artifacts.secondary?.find((doc) =>
				doc.name.endsWith("plan.md"),
			);
			expect(planDoc).toBeDefined();
			expect(planDoc?.content).toContain("discovery");
			expect(planDoc?.content).toContain("architecture");
			expect(planDoc?.content).toContain("implementation");
			expect(planDoc?.content).toContain("Architecture diagrams");
		});

		it("should handle rendering errors gracefully", () => {
			const gateway = new PolyglotGateway();

			// Invalid domain result (not a SessionState)
			const invalidResult = {
				id: "invalid",
				// Missing required SessionState fields
			};

			const request: GatewayRequest = {
				domainResult: invalidResult,
				domainType: "SessionState",
				approach: OutputApproach.SPECKIT,
			};

			// Should throw error because result is not a valid SessionState
			expect(() => gateway.render(request)).toThrow(
				"SpecKitStrategy only supports SessionState",
			);
		});
	});

	describe("approach selection via gateway", () => {
		it("should select SPECKIT approach when specified", () => {
			const gateway = new PolyglotGateway();

			const sessionState: SessionState = {
				id: "test-session-004",
				phase: "discovery",
				context: { goal: "Test feature" },
				history: [],
			};

			const request: GatewayRequest = {
				domainResult: sessionState,
				domainType: "SessionState",
				approach: OutputApproach.SPECKIT,
			};

			const artifacts = gateway.render(request);

			// Verify it used SpecKitStrategy (README.md is primary)
			expect(artifacts.primary.name).toMatch(/README\.md$/);
			expect(artifacts.secondary).toHaveLength(6);
		});

		it("should throw error if SPECKIT approach used with unsupported domain type", () => {
			const gateway = new PolyglotGateway();

			// PromptResult is not supported by SpecKitStrategy
			const promptResult = {
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
				approach: OutputApproach.SPECKIT,
			};

			expect(() => gateway.render(request)).toThrow(
				"Strategy speckit does not support PromptResult",
			);
		});
	});

	describe("document structure validation", () => {
		it("should generate all 7 documents (README + 6 secondary)", () => {
			const gateway = new PolyglotGateway();

			const sessionState: SessionState = {
				id: "test-session-005",
				phase: "discovery",
				context: {
					goal: "Complete feature",
					overview: "Full featured implementation",
				},
				history: [],
			};

			const request: GatewayRequest = {
				domainResult: sessionState,
				domainType: "SessionState",
				approach: OutputApproach.SPECKIT,
			};

			const artifacts = gateway.render(request);

			// 1 primary + 6 secondary = 7 total documents
			expect(artifacts.primary).toBeDefined();
			expect(artifacts.secondary).toBeDefined();
			expect(artifacts.secondary).toHaveLength(6);

			// Verify document formats
			expect(artifacts.primary.format).toBe("markdown");
			artifacts.secondary?.forEach((doc) => {
				expect(doc.format).toBe("markdown");
			});
		});

		it("should use consistent folder structure (slug-based)", () => {
			const gateway = new PolyglotGateway();

			const sessionState: SessionState = {
				id: "test-session-006",
				phase: "discovery",
				context: {
					goal: "User Profile Management",
				},
				config: {
					goal: "User Profile Management",
				},
				history: [],
			};

			const request: GatewayRequest = {
				domainResult: sessionState,
				domainType: "SessionState",
				approach: OutputApproach.SPECKIT,
			};

			const artifacts = gateway.render(request);

			// All documents should be in the same folder (slug)
			const folderName = artifacts.primary.name.split("/")[0];
			// SpecKitStrategy extracts title from config.goal or context.title
			expect(folderName).toBe("user-profile-management");

			artifacts.secondary?.forEach((doc) => {
				expect(doc.name).toMatch(new RegExp(`^${folderName}/`));
			});
		});
	});

	describe("render options support", () => {
		it("should forward render options to SpecKitStrategy", () => {
			const gateway = new PolyglotGateway();

			const sessionState: SessionState = {
				id: "test-session-007",
				phase: "discovery",
				context: {
					goal: "Test with options",
					constraintReferences: [
						{
							constitutionId: "CONSTRAINT-001",
							notes: "Test constraint",
						},
					],
				},
				history: [],
			};

			const request: GatewayRequest = {
				domainResult: sessionState,
				domainType: "SessionState",
				approach: OutputApproach.SPECKIT,
				options: {
					includeConstitutionalConstraints: true,
					constitution: {
						principles: [],
						constraints: [
							{
								id: "CONSTRAINT-001",
								title: "Test Constraint",
								description: "This is a test constraint",
								rationale: "Testing purposes",
								scope: "test",
							},
						],
						architectureRules: [],
						designPrinciples: [],
					},
				},
			};

			const artifacts = gateway.render(request);

			// Options should be passed to strategy
			const specDoc = artifacts.secondary?.find((doc) =>
				doc.name.endsWith("spec.md"),
			);
			expect(specDoc).toBeDefined();
			// Constitutional constraints should be rendered if options were passed
			expect(specDoc?.content).toContain("CONSTRAINT-001");
		});
	});
});
