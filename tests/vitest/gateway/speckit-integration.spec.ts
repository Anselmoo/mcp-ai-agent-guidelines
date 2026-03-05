/**
 * Integration tests for SpecKitStrategy with PolyglotGateway
 *
 * Verifies that the SpecKitStrategy is properly wired to the gateway
 * and can render SpecKitInput domain results into Spec-Kit format.
 *
 * @module tests/gateway/speckit-integration
 */

import { describe, expect, it } from "vitest";
import {
	type GatewayRequest,
	PolyglotGateway,
	polyglotGateway,
} from "../../../src/gateway/polyglot-gateway.js";
import { OutputApproach } from "../../../src/strategies/output-strategy.js";

const validSpecKitInput = {
	title: "Implement Feature X",
	overview: "This feature will provide functionality Y",
	objectives: [
		{ description: "Provide functionality Y", priority: "high" as const },
	],
	requirements: [
		{ description: "Feature must work correctly", type: "functional" as const },
	],
};

describe("SpecKitStrategy Gateway Integration", () => {
	describe("strategy registration", () => {
		it("should have SpecKitStrategy registered in gateway", () => {
			const gateway = new PolyglotGateway();

			// Verify SPECKIT approach is supported for SpecKitInput
			const supportedApproaches =
				gateway.getSupportedApproaches("SpecKitInput");

			expect(supportedApproaches).toContain(OutputApproach.SPECKIT);
		});

		it("should use singleton gateway instance", () => {
			expect(polyglotGateway).toBeInstanceOf(PolyglotGateway);

			const supportedApproaches =
				polyglotGateway.getSupportedApproaches("SpecKitInput");
			expect(supportedApproaches).toContain(OutputApproach.SPECKIT);
		});
	});

	describe("render SpecKitInput with SPECKIT approach", () => {
		it("should render minimal SpecKitInput to Spec-Kit format", async () => {
			const gateway = new PolyglotGateway();

			const request: GatewayRequest = {
				domainResult: validSpecKitInput,
				domainType: "SpecKitInput",
				approach: OutputApproach.SPECKIT,
			};

			const artifacts = await gateway.render(request);

			// Verify primary document (README.md)
			expect(artifacts.primary).toBeDefined();
			expect(artifacts.primary.name).toMatch(/README\.md$/);
			expect(artifacts.primary.content).toBeTruthy();
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

		it("should render SpecKitInput with requirements to Spec-Kit format", async () => {
			const gateway = new PolyglotGateway();

			const input = {
				title: "User Authentication System",
				overview: "Implement secure user authentication",
				objectives: [
					{ description: "Secure authentication", priority: "high" as const },
				],
				requirements: [
					{
						description: "Support email/password login",
						type: "functional" as const,
					},
					{ description: "Implement JWT tokens", type: "functional" as const },
					{
						description: "Add password reset functionality",
						type: "functional" as const,
					},
				],
			};

			const request: GatewayRequest = {
				domainResult: input,
				domainType: "SpecKitInput",
				approach: OutputApproach.SPECKIT,
			};

			const artifacts = await gateway.render(request);

			// Verify README
			expect(artifacts.primary.content).toContain("User Authentication System");

			// Verify spec.md contains requirements
			const specDoc = artifacts.secondary?.find((doc) =>
				doc.name.endsWith("spec.md"),
			);
			expect(specDoc).toBeDefined();
			expect(specDoc?.content).toBeTruthy();

			// Verify tasks.md exists
			const tasksDoc = artifacts.secondary?.find((doc) =>
				doc.name.endsWith("tasks.md"),
			);
			expect(tasksDoc).toBeDefined();
			expect(tasksDoc?.content).toContain("Tasks");
		});

		it("should render SpecKitInput with multiple objectives", async () => {
			const gateway = new PolyglotGateway();

			const input = {
				title: "Microservices Architecture",
				overview: "Design scalable microservices system",
				objectives: [
					{ description: "Initial discovery phase", priority: "high" as const },
					{
						description: "Architecture design phase",
						priority: "high" as const,
					},
					{ description: "Development phase", priority: "medium" as const },
				],
				requirements: [
					{ description: "Must be scalable", type: "non-functional" as const },
				],
			};

			const request: GatewayRequest = {
				domainResult: input,
				domainType: "SpecKitInput",
				approach: OutputApproach.SPECKIT,
			};

			const artifacts = await gateway.render(request);

			// Verify plan.md exists
			const planDoc = artifacts.secondary?.find((doc) =>
				doc.name.endsWith("plan.md"),
			);
			expect(planDoc).toBeDefined();
			expect(planDoc?.content).toBeTruthy();
		});

		it("should throw for invalid SpecKitInput (missing required fields)", async () => {
			const gateway = new PolyglotGateway();

			const invalidResult = {
				title: "Test",
				// Missing overview, objectives, requirements
			};

			const request: GatewayRequest = {
				domainResult: invalidResult,
				domainType: "SpecKitInput",
				approach: OutputApproach.SPECKIT,
			};

			await expect(gateway.render(request)).rejects.toThrow();
		});
	});

	describe("approach selection via gateway", () => {
		it("should select SPECKIT approach when specified", async () => {
			const gateway = new PolyglotGateway();

			const request: GatewayRequest = {
				domainResult: validSpecKitInput,
				domainType: "SpecKitInput",
				approach: OutputApproach.SPECKIT,
			};

			const artifacts = await gateway.render(request);

			// Verify it used SpecKitStrategy (README.md is primary)
			expect(artifacts.primary.name).toMatch(/README\.md$/);
			expect(artifacts.secondary).toHaveLength(6);
		});

		it("should throw error if SPECKIT approach used with unsupported domain type", async () => {
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

			await expect(gateway.render(request)).rejects.toThrow();
		});
	});

	describe("document structure validation", () => {
		it("should generate all 7 documents (README + 6 secondary)", async () => {
			const gateway = new PolyglotGateway();

			const request: GatewayRequest = {
				domainResult: {
					title: "Complete Feature",
					overview: "Full featured implementation",
					objectives: [
						{ description: "Complete the feature", priority: "high" as const },
					],
					requirements: [
						{
							description: "Must work end-to-end",
							type: "functional" as const,
						},
					],
				},
				domainType: "SpecKitInput",
				approach: OutputApproach.SPECKIT,
			};

			const artifacts = await gateway.render(request);

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

		it("should use consistent folder structure (slug-based)", async () => {
			const gateway = new PolyglotGateway();

			const request: GatewayRequest = {
				domainResult: {
					title: "User Profile Management",
					overview: "Manage user profiles",
					objectives: [
						{ description: "Manage user profiles", priority: "high" as const },
					],
					requirements: [
						{
							description: "CRUD operations for profiles",
							type: "functional" as const,
						},
					],
				},
				domainType: "SpecKitInput",
				approach: OutputApproach.SPECKIT,
			};

			const artifacts = await gateway.render(request);

			// All documents should be in the same folder (slug)
			const folderName = artifacts.primary.name.split("/")[0];
			expect(folderName).toBe("user-profile-management");

			artifacts.secondary?.forEach((doc) => {
				expect(doc.name).toMatch(new RegExp(`^${folderName}/`));
			});
		});
	});

	describe("render options support", () => {
		it("should forward render options to SpecKitStrategy", async () => {
			const gateway = new PolyglotGateway();

			const request: GatewayRequest = {
				domainResult: validSpecKitInput,
				domainType: "SpecKitInput",
				approach: OutputApproach.SPECKIT,
				options: {
					includeMetadata: false,
				},
			};

			const artifacts = await gateway.render(request);

			// Options should be passed to strategy; verify basic output
			const specDoc = artifacts.secondary?.find((doc) =>
				doc.name.endsWith("spec.md"),
			);
			expect(specDoc).toBeDefined();
		});
	});
});
