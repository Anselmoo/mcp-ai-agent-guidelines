/**
 * Integration test for SpecValidator with real CONSTITUTION.md
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseConstitution } from "../../../../src/strategies/speckit/constitution-parser.js";
import { createSpecValidator } from "../../../../src/strategies/speckit/spec-validator.js";
import type { SpecContent } from "../../../../src/strategies/speckit/types.js";

describe("SpecValidator integration with real CONSTITUTION.md", () => {
	it("should validate with real constitution file", () => {
		// Read the actual CONSTITUTION.md file
		const constitutionPath = join(
			process.cwd(),
			"plan-v0.13.x",
			"CONSTITUTION.md",
		);
		const constitutionContent = readFileSync(constitutionPath, "utf-8");

		// Parse the constitution
		const constitution = parseConstitution(constitutionContent);

		// Create validator
		const validator = createSpecValidator(constitution);

		// Test with a valid spec
		const validSpec: SpecContent = {
			title: "Test Specification",
			overview: "A well-structured specification following all principles",
			objectives: [
				{
					description: "Implement domain-driven design",
					priority: "high",
				},
			],
			requirements: [
				{
					description: "Use TypeScript strict mode with explicit types",
					type: "technical",
				},
				{
					description: "Follow ESM module system with .js extensions",
					type: "technical",
				},
			],
			acceptanceCriteria: ["All tests pass", "Coverage meets 90% threshold"],
			rawMarkdown: `# Test Specification

A clean, focused specification that respects constitutional principles.

## Technical Details
- Uses strict TypeScript
- ESM imports with .js extensions
- Single responsibility principle`,
		};

		const result = validator.validate(validSpec);

		expect(result).toBeDefined();
		expect(result.checkedConstraints).toBeGreaterThan(0);
		expect(result.score).toBeGreaterThanOrEqual(0);
		expect(result.score).toBeLessThanOrEqual(100);
		expect(typeof result.valid).toBe("boolean");
	});

	it("should detect violations in problematic spec", () => {
		const constitutionPath = join(
			process.cwd(),
			"plan-v0.13.x",
			"CONSTITUTION.md",
		);
		const constitutionContent = readFileSync(constitutionPath, "utf-8");
		const constitution = parseConstitution(constitutionContent);
		const validator = createSpecValidator(constitution);

		const problematicSpec: SpecContent = {
			title: "Problematic Specification",
			rawMarkdown: `# Problematic Spec

This spec uses any type everywhere for flexibility.

Also, we'll use require() to import modules because it's easier.

The architecture will be: domain → presentation → gateway (wrong order).

This tool does everything: validation, formatting, parsing, and also rendering, in addition to caching, plus logging.`,
		};

		const result = validator.validate(problematicSpec);

		// Should have some issues detected
		expect(result.issues.length).toBeGreaterThan(0);

		// Check for specific violations
		const hasTypeViolation = result.issues.some((i) =>
			i.code.includes("C1-VIOLATION"),
		);
		const hasModuleViolation = result.issues.some((i) =>
			i.code.includes("C2-VIOLATION"),
		);
		const hasArchViolation = result.issues.some((i) =>
			i.code.includes("AR1-VIOLATION"),
		);

		// At least one of these should be detected
		expect(hasTypeViolation || hasModuleViolation || hasArchViolation).toBe(
			true,
		);
	});

	it("should parse all sections from real constitution", () => {
		const constitutionPath = join(
			process.cwd(),
			"plan-v0.13.x",
			"CONSTITUTION.md",
		);
		const constitutionContent = readFileSync(constitutionPath, "utf-8");
		const constitution = parseConstitution(constitutionContent);

		// Real constitution should have content in each section
		expect(constitution.principles).toBeDefined();
		expect(constitution.constraints).toBeDefined();
		expect(constitution.architectureRules).toBeDefined();
		expect(constitution.designPrinciples).toBeDefined();

		// Verify metadata was extracted
		expect(constitution.metadata).toBeDefined();
		if (constitution.metadata) {
			expect(constitution.metadata.title).toBeDefined();
		}

		// Verify total constraint count matches what validator will check
		const totalConstraints =
			(constitution.principles?.length ?? 0) +
			(constitution.constraints?.length ?? 0) +
			(constitution.architectureRules?.length ?? 0) +
			(constitution.designPrinciples?.length ?? 0);

		expect(totalConstraints).toBeGreaterThan(0);

		// Create validator and verify it uses all parsed items
		const validator = createSpecValidator(constitution);
		const result = validator.validate({});

		expect(result.checkedConstraints).toBe(totalConstraints);
	});
});
