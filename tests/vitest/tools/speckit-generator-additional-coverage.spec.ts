/**
 * Additional coverage tests for speckit-generator tool
 * Targets remaining uncovered branches and error paths
 *
 * @module tests/tools/speckit-generator-additional-coverage
 */

import { promises as fs } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SpecKitGeneratorRequest } from "../../../src/tools/speckit-generator.js";
import { specKitGenerator } from "../../../src/tools/speckit-generator.js";

describe("specKitGenerator - Additional Coverage", () => {
	describe("constitution file loading", () => {
		it("should throw error when constitution file does not exist", async () => {
			const request: SpecKitGeneratorRequest = {
				title: "Test Spec",
				overview: "Test overview",
				objectives: [{ description: "Test objective" }],
				requirements: [{ description: "Test requirement" }],
				constitutionPath: "/nonexistent/path/CONSTITUTION.md",
			};

			await expect(specKitGenerator(request)).rejects.toThrow(
				/Failed to load constitution/,
			);
		});

		it("should throw error when constitution file cannot be read", async () => {
			// Mock fs.readFile to throw an error
			const readFileSpy = vi.spyOn(fs, "readFile");
			readFileSpy.mockRejectedValueOnce(new Error("Permission denied"));

			const request: SpecKitGeneratorRequest = {
				title: "Test Spec",
				overview: "Test overview",
				objectives: [{ description: "Test objective" }],
				requirements: [{ description: "Test requirement" }],
				constitutionPath: "./test-constitution.md",
			};

			await expect(specKitGenerator(request)).rejects.toThrow(
				/Failed to load constitution.*Permission denied/,
			);

			readFileSpy.mockRestore();
		});

		it("should handle non-Error objects when file reading fails", async () => {
			// Mock fs.readFile to throw a non-Error object
			const readFileSpy = vi.spyOn(fs, "readFile");
			readFileSpy.mockRejectedValueOnce("String error");

			const request: SpecKitGeneratorRequest = {
				title: "Test Spec",
				overview: "Test overview",
				objectives: [{ description: "Test objective" }],
				requirements: [{ description: "Test requirement" }],
				constitutionPath: "./test-constitution.md",
			};

			await expect(specKitGenerator(request)).rejects.toThrow(
				/Failed to load constitution.*String error/,
			);

			readFileSpy.mockRestore();
		});
	});

	describe("constitution validation message", () => {
		let readFileSpy: ReturnType<typeof vi.spyOn>;

		beforeEach(() => {
			// Mock fs.readFile to return a valid constitution
			readFileSpy = vi.spyOn(fs, "readFile");
			readFileSpy.mockResolvedValue(`# Constitution

## Principles

- P1: Test Principle

## Constraints

- C1: Test Constraint

## Architecture Rules

- AR1: Test Architecture Rule

## Design Principles

- DP1: Test Design Principle
`);
		});

		afterEach(() => {
			readFileSpy.mockRestore();
		});

		it("should include validation message when constitution is provided", async () => {
			const request: SpecKitGeneratorRequest = {
				title: "Test Spec",
				overview: "Test overview",
				objectives: [{ description: "Test objective" }],
				requirements: [{ description: "Test requirement" }],
				constitutionPath: "./CONSTITUTION.md",
			};

			const result = await specKitGenerator(request);

			expect(result.content[0].text).toContain(
				"*Validated against CONSTITUTION.md*",
			);
		});

		it("should not include validation message when constitution is not provided", async () => {
			const request: SpecKitGeneratorRequest = {
				title: "Test Spec",
				overview: "Test overview",
				objectives: [{ description: "Test objective" }],
				requirements: [{ description: "Test requirement" }],
			};

			const result = await specKitGenerator(request);

			expect(result.content[0].text).not.toContain(
				"*Validated against CONSTITUTION.md*",
			);
		});
	});

	describe("validateAgainstConstitution option", () => {
		let readFileSpy: ReturnType<typeof vi.spyOn>;

		beforeEach(() => {
			readFileSpy = vi.spyOn(fs, "readFile");
			readFileSpy.mockResolvedValue(`# Constitution

## Principles

- P1: Clear Requirements

## Constraints

- C1: TypeScript Strict Mode

## Architecture Rules

## Design Principles
`);
		});

		afterEach(() => {
			readFileSpy.mockRestore();
		});

		it("should pass validateAgainstConstitution option to gateway", async () => {
			const request: SpecKitGeneratorRequest = {
				title: "Test Spec",
				overview: "Test overview",
				objectives: [{ description: "Test objective" }],
				requirements: [{ description: "Test requirement" }],
				constitutionPath: "./CONSTITUTION.md",
				validateAgainstConstitution: true,
			};

			// This should not throw even with validation enabled
			const result = await specKitGenerator(request);
			expect(result).toBeDefined();
			expect(result.content[0].text).toContain("Spec-Kit Generated");
		});

		it("should handle validation without failOnValidationErrors", async () => {
			const request: SpecKitGeneratorRequest = {
				title: "Incomplete Spec",
				overview: "Missing requirements",
				objectives: [], // Empty to potentially trigger validation warnings
				requirements: [{ description: "Single requirement" }],
				constitutionPath: "./CONSTITUTION.md",
				validateAgainstConstitution: true,
			};

			// Should complete successfully even with validation warnings
			const result = await specKitGenerator(request);
			expect(result).toBeDefined();
		});
	});

	describe("requirement type handling", () => {
		it("should handle requirements with explicit functional type", async () => {
			const request: SpecKitGeneratorRequest = {
				title: "Typed Requirements",
				overview: "Test typed requirements",
				objectives: [{ description: "Test objective" }],
				requirements: [
					{ description: "Functional req 1", type: "functional" },
					{ description: "Functional req 2", type: "functional" },
				],
			};

			const result = await specKitGenerator(request);
			expect(result.content[0].text).toContain("Functional req 1");
			expect(result.content[0].text).toContain("Functional req 2");
		});

		it("should handle requirements with explicit non-functional type", async () => {
			const request: SpecKitGeneratorRequest = {
				title: "Non-Functional Requirements",
				overview: "Test non-functional requirements",
				objectives: [{ description: "Test objective" }],
				requirements: [
					{
						description: "Performance requirement",
						type: "non-functional",
					},
					{ description: "Scalability requirement", type: "non-functional" },
				],
			};

			const result = await specKitGenerator(request);
			expect(result.content[0].text).toContain("Performance requirement");
			expect(result.content[0].text).toContain("Scalability requirement");
		});

		it("should handle mixed requirement types", async () => {
			const request: SpecKitGeneratorRequest = {
				title: "Mixed Requirements",
				overview: "Test mixed requirement types",
				objectives: [{ description: "Test objective" }],
				requirements: [
					{ description: "Untyped requirement" }, // No type
					{ description: "Functional requirement", type: "functional" },
					{ description: "Performance requirement", type: "non-functional" },
				],
			};

			const result = await specKitGenerator(request);
			expect(result.content[0].text).toContain("Untyped requirement");
			expect(result.content[0].text).toContain("Functional requirement");
			expect(result.content[0].text).toContain("Performance requirement");
		});
	});

	describe("priority handling", () => {
		it("should handle objectives with different priorities", async () => {
			const request: SpecKitGeneratorRequest = {
				title: "Prioritized Objectives",
				overview: "Test objective priorities",
				objectives: [
					{ description: "High priority objective", priority: "high" },
					{ description: "Medium priority objective", priority: "medium" },
					{ description: "Low priority objective", priority: "low" },
					{ description: "Unspecified priority" }, // No priority
				],
				requirements: [{ description: "Test requirement" }],
			};

			const result = await specKitGenerator(request);
			expect(result.content[0].text).toContain("High priority objective");
			expect(result.content[0].text).toContain("Medium priority objective");
			expect(result.content[0].text).toContain("Low priority objective");
			expect(result.content[0].text).toContain("Unspecified priority");
		});

		it("should handle requirements with different priorities", async () => {
			const request: SpecKitGeneratorRequest = {
				title: "Prioritized Requirements",
				overview: "Test requirement priorities",
				objectives: [{ description: "Test objective" }],
				requirements: [
					{
						description: "Critical requirement",
						type: "functional",
						priority: "critical",
					},
					{
						description: "High priority requirement",
						type: "functional",
						priority: "high",
					},
					{
						description: "Normal requirement",
						type: "functional",
						priority: "normal",
					},
					{ description: "No priority requirement", type: "functional" }, // No priority
				],
			};

			const result = await specKitGenerator(request);
			expect(result.content[0].text).toContain("Critical requirement");
			expect(result.content[0].text).toContain("High priority requirement");
			expect(result.content[0].text).toContain("Normal requirement");
			expect(result.content[0].text).toContain("No priority requirement");
		});
	});

	describe("edge cases for optional fields", () => {
		it("should handle undefined acceptanceCriteria", async () => {
			const request: SpecKitGeneratorRequest = {
				title: "No Acceptance Criteria",
				overview: "Test without acceptance criteria",
				objectives: [{ description: "Test objective" }],
				requirements: [{ description: "Test requirement" }],
				// acceptanceCriteria is undefined (not provided)
			};

			const result = await specKitGenerator(request);
			expect(result).toBeDefined();
			expect(result.content[0].text).toContain("Spec-Kit Generated");
		});

		it("should handle undefined outOfScope", async () => {
			const request: SpecKitGeneratorRequest = {
				title: "No Out of Scope",
				overview: "Test without out of scope items",
				objectives: [{ description: "Test objective" }],
				requirements: [{ description: "Test requirement" }],
				// outOfScope is undefined (not provided)
			};

			const result = await specKitGenerator(request);
			expect(result).toBeDefined();
			expect(result.content[0].text).toContain("Spec-Kit Generated");
		});

		it("should handle all optional fields undefined", async () => {
			const request: SpecKitGeneratorRequest = {
				title: "Minimal Spec",
				overview: "Minimal test spec",
				objectives: [{ description: "Single objective" }],
				requirements: [{ description: "Single requirement" }],
				// All optional fields undefined
			};

			const result = await specKitGenerator(request);
			expect(result).toBeDefined();
			expect(result.content[0].text).toContain("Spec-Kit Generated");
			expect(result.content[0].text).toContain("Minimal Spec");
		});
	});
});
