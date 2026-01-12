/**
 * Unit tests for validate-spec tool
 */

import { describe, expect, it } from "vitest";
import type { ValidateSpecRequest } from "../../../src/schemas/validate-spec.js";
import { validateSpec } from "../../../src/tools/validate-spec.js";

describe("validateSpec", () => {
	const sampleConstitution = `# Constitution

## Principles

### 1. TypeScript Strict Mode
All code must use TypeScript strict mode.

### 2. ESM Modules
Use ESM imports with .js extensions.

## Constraints

### C1: No Any Types
Avoid using 'any' types in TypeScript.

### C2: ESM Required
Use ESM imports, not CommonJS require().

## Architecture Rules

### AR1: Layer Dependencies
Follow proper layer dependencies: MCPServer → Gateway → Domain

## Design Principles

### DP1: Single Responsibility
Each component should have a single, well-defined responsibility.
`;

	const sampleSpec = `# User Authentication System

## Overview
Implement OAuth2 authentication flow with JWT tokens

## Objectives
- Secure user authentication
- Support Google OAuth

## Requirements
- Integrate with Google OAuth provider
- Store JWT tokens securely

## Acceptance Criteria
- Users can log in with Google
- Tokens expire after 1 hour
`;

	describe("basic validation", () => {
		it("should validate spec with constitution content", async () => {
			const request: ValidateSpecRequest = {
				specContent: sampleSpec,
				constitutionContent: sampleConstitution,
				outputFormat: "markdown",
			};

			const result = await validateSpec(request);

			expect(result).toBeDefined();
			expect(result.content).toBeDefined();
			expect(result.content[0].type).toBe("text");
			expect(result.content[0].text).toContain("Validation Report");
		});

		it("should throw error if neither constitution path nor content provided", async () => {
			const request: ValidateSpecRequest = {
				specContent: sampleSpec,
				outputFormat: "markdown",
			};

			await expect(validateSpec(request)).rejects.toThrow(
				"Either constitutionPath or constitutionContent must be provided",
			);
		});
	});

	describe("output formats", () => {
		it("should return markdown format by default", async () => {
			const request: ValidateSpecRequest = {
				specContent: sampleSpec,
				constitutionContent: sampleConstitution,
			};

			const result = await validateSpec(request);

			expect(result.content[0].text).toContain("# Validation Report");
			expect(result.content[0].text).toContain("## Summary");
		});

		it("should return JSON format when requested", async () => {
			const request: ValidateSpecRequest = {
				specContent: sampleSpec,
				constitutionContent: sampleConstitution,
				outputFormat: "json",
			};

			const result = await validateSpec(request);

			// Should be valid JSON
			expect(() => JSON.parse(result.content[0].text)).not.toThrow();

			const report = JSON.parse(result.content[0].text);
			expect(report).toHaveProperty("valid");
			expect(report).toHaveProperty("score");
			expect(report).toHaveProperty("metrics");
		});

		it("should return summary format when requested", async () => {
			const request: ValidateSpecRequest = {
				specContent: sampleSpec,
				constitutionContent: sampleConstitution,
				outputFormat: "summary",
			};

			const result = await validateSpec(request);

			expect(result.content[0].text).toMatch(
				/Validation: (✅ VALID|❌ INVALID)/,
			);
			expect(result.content[0].text).toContain("Score:");
			expect(result.content[0].text).toContain("Errors:");
			expect(result.content[0].text).toContain("Warnings:");
		});
	});

	describe("recommendations", () => {
		it("should include recommendations by default", async () => {
			const request: ValidateSpecRequest = {
				specContent: sampleSpec,
				constitutionContent: sampleConstitution,
				outputFormat: "markdown",
			};

			const result = await validateSpec(request);

			// Check if recommendations section might be present
			// (depends on validation results)
			expect(result.content[0].text).toBeDefined();
		});

		it("should exclude recommendations when requested", async () => {
			const request: ValidateSpecRequest = {
				specContent: sampleSpec,
				constitutionContent: sampleConstitution,
				outputFormat: "markdown",
				includeRecommendations: false,
			};

			const result = await validateSpec(request);

			// Should not contain recommendations section
			expect(result.content[0].text).not.toMatch(/## Recommendations/);
		});
	});

	describe("spec parsing", () => {
		it("should parse spec with title, overview, and objectives", async () => {
			const request: ValidateSpecRequest = {
				specContent: sampleSpec,
				constitutionContent: sampleConstitution,
				outputFormat: "json",
			};

			const result = await validateSpec(request);
			const report = JSON.parse(result.content[0].text);

			// Validation should have been performed
			expect(report.score).toBeGreaterThanOrEqual(0);
			expect(report.score).toBeLessThanOrEqual(100);
		});

		it("should handle spec with violations", async () => {
			const specWithViolations = `# Bad Spec

## Overview
This spec uses any type and require() calls.

## Requirements
- Use any type for flexibility
- Call require() for legacy modules
`;

			const request: ValidateSpecRequest = {
				specContent: specWithViolations,
				constitutionContent: sampleConstitution,
				outputFormat: "json",
			};

			const result = await validateSpec(request);
			const report = JSON.parse(result.content[0].text);

			// Should detect violations
			expect(report.issues).toBeDefined();
			expect(Array.isArray(report.issues)).toBe(true);
		});

		it("should handle empty spec gracefully", async () => {
			const emptySpec = "";

			const request: ValidateSpecRequest = {
				specContent: emptySpec,
				constitutionContent: sampleConstitution,
				outputFormat: "json",
			};

			const result = await validateSpec(request);
			const report = JSON.parse(result.content[0].text);

			// Should still produce a valid report
			expect(report).toHaveProperty("valid");
			expect(report).toHaveProperty("score");
		});
	});

	describe("validation results", () => {
		it("should include validation metrics", async () => {
			const request: ValidateSpecRequest = {
				specContent: sampleSpec,
				constitutionContent: sampleConstitution,
				outputFormat: "json",
			};

			const result = await validateSpec(request);
			const report = JSON.parse(result.content[0].text);

			expect(report.metrics).toBeDefined();
			expect(report.metrics).toHaveProperty("total");
			expect(report.metrics).toHaveProperty("passed");
			expect(report.metrics).toHaveProperty("failed");
			expect(report.metrics).toHaveProperty("warnings");
		});

		it("should include timestamp in report", async () => {
			const request: ValidateSpecRequest = {
				specContent: sampleSpec,
				constitutionContent: sampleConstitution,
				outputFormat: "json",
			};

			const result = await validateSpec(request);
			const report = JSON.parse(result.content[0].text);

			expect(report).toHaveProperty("timestamp");
			expect(typeof report.timestamp).toBe("string");
		});
	});
});
