/**
 * Tests for cross-cutting types
 *
 * Verifies type definitions and interfaces for capability handlers.
 */

import { describe, expect, it } from "vitest";
import type {
	CapabilityContext,
	CapabilityHandler,
} from "../../../../src/strategies/cross-cutting/types.js";
import {
	type CrossCuttingArtifact,
	CrossCuttingCapability,
} from "../../../../src/strategies/output-strategy.js";

describe("cross-cutting types", () => {
	describe("CapabilityContext", () => {
		it("should accept valid context with all properties", () => {
			const context: CapabilityContext = {
				domainResult: { test: "data" },
				primaryDocument: "# Document",
				metadata: { key: "value" },
			};

			expect(context.domainResult).toEqual({ test: "data" });
			expect(context.primaryDocument).toBe("# Document");
			expect(context.metadata).toEqual({ key: "value" });
		});

		it("should accept context without metadata", () => {
			const context: CapabilityContext = {
				domainResult: { test: "data" },
				primaryDocument: "# Document",
			};

			expect(context.metadata).toBeUndefined();
		});

		it("should accept unknown domain result type", () => {
			const contexts: CapabilityContext[] = [
				{
					domainResult: "string",
					primaryDocument: "# Doc",
				},
				{
					domainResult: 123,
					primaryDocument: "# Doc",
				},
				{
					domainResult: null,
					primaryDocument: "# Doc",
				},
				{
					domainResult: { complex: { nested: { data: true } } },
					primaryDocument: "# Doc",
				},
			];

			for (const context of contexts) {
				expect(context).toBeDefined();
			}
		});
	});

	describe("CapabilityHandler", () => {
		it("should define required interface methods", () => {
			// Create a mock implementation to verify interface
			class MockHandler implements CapabilityHandler {
				readonly capability = CrossCuttingCapability.WORKFLOW;

				generate(_context: CapabilityContext): CrossCuttingArtifact | null {
					return {
						type: this.capability,
						name: "test.yml",
						content: "test content",
					};
				}

				supports(_domainType: string): boolean {
					return true;
				}
			}

			const handler = new MockHandler();

			expect(handler.capability).toBe(CrossCuttingCapability.WORKFLOW);
			expect(typeof handler.generate).toBe("function");
			expect(typeof handler.supports).toBe("function");
		});

		it("should allow generate to return null", () => {
			class NullHandler implements CapabilityHandler {
				readonly capability = CrossCuttingCapability.CONFIG;

				generate(_context: CapabilityContext): CrossCuttingArtifact | null {
					return null;
				}

				supports(_domainType: string): boolean {
					return false;
				}
			}

			const handler = new NullHandler();
			const result = handler.generate({
				domainResult: {},
				primaryDocument: "",
			});

			expect(result).toBeNull();
		});

		it("should work with different capability types", () => {
			const capabilities = [
				CrossCuttingCapability.WORKFLOW,
				CrossCuttingCapability.SHELL_SCRIPT,
				CrossCuttingCapability.DIAGRAM,
				CrossCuttingCapability.CONFIG,
				CrossCuttingCapability.ISSUES,
				CrossCuttingCapability.PR_TEMPLATE,
			];

			for (const capability of capabilities) {
				class TestHandler implements CapabilityHandler {
					readonly capability = capability;

					generate(_context: CapabilityContext): CrossCuttingArtifact | null {
						return {
							type: this.capability,
							name: "test",
							content: "content",
						};
					}

					supports(_domainType: string): boolean {
						return true;
					}
				}

				const handler = new TestHandler();
				expect(handler.capability).toBe(capability);
			}
		});
	});
});
