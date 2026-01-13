/**
 * Tests for Workflow Registry
 *
 * @module tests/agents/workflows/index
 */

import { describe, expect, it } from "vitest";
import {
	codeReviewChainWorkflow,
	designToSpecWorkflow,
	getWorkflow,
	listWorkflows,
	workflows,
} from "../../../../src/agents/workflows/index.js";

describe("Workflow Registry", () => {
	describe("workflows map", () => {
		it("should export a Map with registered workflows", () => {
			expect(workflows).toBeInstanceOf(Map);
			expect(workflows.size).toBeGreaterThanOrEqual(2);
		});

		it("should contain code-review-chain workflow", () => {
			expect(workflows.has("code-review-chain")).toBe(true);
			expect(workflows.get("code-review-chain")).toBe(codeReviewChainWorkflow);
		});

		it("should contain design-to-spec workflow", () => {
			expect(workflows.has("design-to-spec")).toBe(true);
			expect(workflows.get("design-to-spec")).toBe(designToSpecWorkflow);
		});
	});

	describe("getWorkflow", () => {
		it("should return workflow for valid name", () => {
			const workflow = getWorkflow("code-review-chain");
			expect(workflow).toBeDefined();
			expect(workflow?.name).toBe("code-review-chain");
		});

		it("should return undefined for non-existent workflow", () => {
			const workflow = getWorkflow("non-existent-workflow");
			expect(workflow).toBeUndefined();
		});

		it("should return design-to-spec workflow", () => {
			const workflow = getWorkflow("design-to-spec");
			expect(workflow).toBeDefined();
			expect(workflow?.name).toBe("design-to-spec");
		});

		it("should be case-sensitive", () => {
			const workflow = getWorkflow("CODE-REVIEW-CHAIN");
			expect(workflow).toBeUndefined();
		});
	});

	describe("listWorkflows", () => {
		it("should return array of workflow names", () => {
			const names = listWorkflows();
			expect(Array.isArray(names)).toBe(true);
			expect(names.length).toBeGreaterThanOrEqual(2);
		});

		it("should include code-review-chain", () => {
			const names = listWorkflows();
			expect(names).toContain("code-review-chain");
		});

		it("should include design-to-spec", () => {
			const names = listWorkflows();
			expect(names).toContain("design-to-spec");
		});

		it("should return unique names", () => {
			const names = listWorkflows();
			const uniqueNames = [...new Set(names)];
			expect(names).toEqual(uniqueNames);
		});
	});

	describe("exported workflow definitions", () => {
		it("should export codeReviewChainWorkflow", () => {
			expect(codeReviewChainWorkflow).toBeDefined();
			expect(codeReviewChainWorkflow.name).toBe("code-review-chain");
			expect(codeReviewChainWorkflow.steps).toHaveLength(3);
		});

		it("should export designToSpecWorkflow", () => {
			expect(designToSpecWorkflow).toBeDefined();
			expect(designToSpecWorkflow.name).toBe("design-to-spec");
			expect(designToSpecWorkflow.steps).toHaveLength(3);
		});
	});
});
