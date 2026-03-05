import { promises as fs } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SpecKitStrategy } from "../../../../src/strategies/speckit/speckit-strategy.js";

describe("SpecKitStrategy", () => {
	let strategy: SpecKitStrategy;

	const validInput = {
		title: "Test Project",
		overview: "A test project",
		objectives: [{ description: "Build feature", priority: "high" as const }],
		requirements: [{ description: "Must work", type: "functional" as const }],
	};
	let tempConstitutionPath: string | null = null;

	beforeEach(() => {
		strategy = new SpecKitStrategy();
	});

	afterEach(async () => {
		if (!tempConstitutionPath) {
			return;
		}

		try {
			await fs.unlink(tempConstitutionPath);
		} catch {
			// ignore cleanup failures for already-removed files
		}
		tempConstitutionPath = null;
	});

	it("should generate all artifacts", async () => {
		const result = await strategy.run(validInput);
		expect(result.success).toBe(true);
		if (!result.success) {
			return;
		}

		// primary = README.md; secondary = spec, plan, tasks, progress, adr, roadmap (6)
		expect(result.data.primary.content).toBeTruthy();
		expect(result.data.primary.name).toContain("README.md");
		expect(result.data.secondary?.length).toBe(6);
		const names = result.data.secondary?.map((d) => d.name) ?? [];
		expect(names.some((n) => n.includes("spec"))).toBe(true);
		expect(names.some((n) => n.includes("plan"))).toBe(true);
		expect(names.some((n) => n.includes("tasks"))).toBe(true);
		expect(names.some((n) => n.includes("progress"))).toBe(true);
		expect(names.some((n) => n.includes("adr"))).toBe(true);
		expect(names.some((n) => n.includes("roadmap"))).toBe(true);
	});

	it("should validate against loaded constitution rules", async () => {
		tempConstitutionPath = `/tmp/speckit-constitution-${Date.now()}.md`;
		await fs.writeFile(tempConstitutionPath, "- impossible rule text", "utf-8");

		const result = await strategy.run({
			...validInput,
			constitutionPath: tempConstitutionPath,
			validateAgainstConstitution: true,
		});

		expect(result.success).toBe(true);
		if (!result.success) {
			return;
		}
		// Validation is reflected in trace as a validation_score metric
		const validationEntry = result.trace.entries.find(
			(e) =>
				e.type === "metric" &&
				(e as { data?: { name?: string } }).data?.name === "validation_score",
		);
		expect(validationEntry).toBeDefined();
	});

	it("should handle missing constitution path gracefully", async () => {
		const result = await strategy.run({
			...validInput,
			constitutionPath: "/tmp/does-not-exist-speckit.md",
			validateAgainstConstitution: true,
		});

		expect(result.success).toBe(true);
		if (!result.success) {
			return;
		}
		// When constitution fails to load, no validation_score metric in trace
		const hasValidation = result.trace.entries.some(
			(e) =>
				e.type === "metric" &&
				(e as { data?: { name?: string } }).data?.name === "validation_score",
		);
		expect(hasValidation).toBe(false);
	});

	describe("tryConvertSessionState via validate()", () => {
		it("should convert session-shaped input with config.goal", () => {
			const result = strategy.validate({
				config: {
					goal: "Session Goal",
					requirements: ["req1", "req2"],
					constraints: ["constraint1"],
				},
			});
			expect(result.valid).toBe(true);
		});

		it("should convert session-shaped input with context.goal", () => {
			const result = strategy.validate({
				context: { goal: "Context Goal", overview: "Some overview" },
			});
			expect(result.valid).toBe(true);
		});

		it("should convert session-shaped input with s.id as goal", () => {
			const result = strategy.validate({ id: "session-id-as-goal" });
			expect(result.valid).toBe(true);
		});

		it("should convert session-shaped input with object constraints", () => {
			const result = strategy.validate({
				config: {
					goal: "Goal with Object Constraints",
					constraints: [
						{ description: "constraint-desc" },
						{ description: "" },
					],
				},
			});
			expect(result.valid).toBe(true);
		});

		it("should return invalid when no goal is found", () => {
			const result = strategy.validate({ config: {} });
			expect(result.valid).toBe(false);
		});

		it("should return null for non-object input (null)", () => {
			const result = strategy.validate(null);
			expect(result.valid).toBe(false);
		});

		it("should return null for non-object input (string)", () => {
			const result = strategy.validate("not-an-object");
			expect(result.valid).toBe(false);
		});
	});
});
