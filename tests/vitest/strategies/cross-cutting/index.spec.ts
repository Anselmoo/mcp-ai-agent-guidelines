/**
 * Tests for cross-cutting barrel exports
 *
 * Verifies that all cross-cutting types and handlers are properly exported.
 */

import { describe, expect, it } from "vitest";
import {
	type CapabilityContext,
	type CapabilityHandler,
	DiagramCapabilityHandler,
} from "../../../../src/strategies/cross-cutting/index.js";
import { CrossCuttingCapability } from "../../../../src/strategies/output-strategy.js";

describe("cross-cutting index exports", () => {
	it("should export DiagramCapabilityHandler", () => {
		expect(DiagramCapabilityHandler).toBeDefined();
		expect(typeof DiagramCapabilityHandler).toBe("function");

		const handler = new DiagramCapabilityHandler();
		expect(handler).toBeInstanceOf(DiagramCapabilityHandler);
		expect(handler.capability).toBe(CrossCuttingCapability.DIAGRAM);
	});

	it("should export CapabilityContext type", () => {
		// Type check - if this compiles, the type is exported
		const context: CapabilityContext = {
			domainResult: { test: "data" },
			primaryDocument: "# Document",
			metadata: { key: "value" },
		};

		expect(context).toBeDefined();
		expect(context.domainResult).toEqual({ test: "data" });
	});

	it("should export CapabilityHandler type", () => {
		// Type check - if this compiles, the type is exported
		const mockHandler: CapabilityHandler = {
			capability: CrossCuttingCapability.WORKFLOW,
			generate: () => null,
			supports: () => false,
		};

		expect(mockHandler).toBeDefined();
		expect(mockHandler.capability).toBe(CrossCuttingCapability.WORKFLOW);
	});

	it("should allow creating handler instances from exports", () => {
		const handler = new DiagramCapabilityHandler();

		expect(handler.capability).toBe(CrossCuttingCapability.DIAGRAM);
		expect(typeof handler.generate).toBe("function");
		expect(typeof handler.supports).toBe("function");
	});
});
