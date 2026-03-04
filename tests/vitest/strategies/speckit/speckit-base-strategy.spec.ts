import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SpecKitStrategy } from "../../../../src/strategies/speckit/speckit-strategy.js";

describe("SpecKitStrategy (BaseStrategy)", () => {
	let strategy: SpecKitStrategy;

	const validInput = {
		title: "Test Project",
		overview: "A test project",
		objectives: [{ description: "Build feature", priority: "high" as const }],
		requirements: [{ description: "Must work", type: "functional" as const }],
	};

	beforeEach(() => {
		strategy = new SpecKitStrategy();
	});

	it("should generate all artifacts", async () => {
		const result = await strategy.run(validInput);

		expect(result.success).toBe(true);
		if (!result.success) {
			return;
		}
		expect(result.data.primary.content).toBeTruthy();
		expect(result.data.secondary).toHaveLength(6);
		const names = result.data.secondary?.map((d) => d.name) ?? [];
		expect(names.some((n) => n.endsWith("spec.md"))).toBe(true);
		expect(names.some((n) => n.endsWith("plan.md"))).toBe(true);
		expect(names.some((n) => n.endsWith("tasks.md"))).toBe(true);
		expect(names.some((n) => n.endsWith("progress.md"))).toBe(true);
		expect(names.some((n) => n.endsWith("adr.md"))).toBe(true);
		expect(names.some((n) => n.endsWith("roadmap.md"))).toBe(true);
	});

	it("should include execution trace", async () => {
		const result = await strategy.run(validInput);

		expect(result.trace).toBeDefined();
		expect(result.trace.entries.length).toBeGreaterThan(0);
	});

	it("should reject invalid input", async () => {
		const result = await strategy.run({ ...validInput, title: "" });

		expect(result.success).toBe(false);
		if (result.success) {
			return;
		}
		expect(result.errors[0]?.code).toBe("VALIDATION_ERROR");
	});

	describe("constitution loading", () => {
		let constitutionPath: string;

		beforeEach(async () => {
			constitutionPath = join(tmpdir(), `test-constitution-${Date.now()}.md`);
		});

		afterEach(async () => {
			await fs.unlink(constitutionPath).catch(() => undefined);
		});

		it("should load constitution from file and record trace decision", async () => {
			await fs.writeFile(
				constitutionPath,
				"- All documents must have a title\n- Must include overview\n",
			);

			const result = await strategy.run({
				...validInput,
				constitutionPath,
			});

			expect(result.success).toBe(true);
			if (!result.success) return;
			const loadDecision = result.trace.entries.find(
				(e) => e.type === "decision" && e.message.includes("load-constitution"),
			);
			expect(loadDecision).toBeDefined();
		});

		it("should succeed and return null constitution when file does not exist", async () => {
			const result = await strategy.run({
				...validInput,
				constitutionPath: "/nonexistent/path/CONSTITUTION.md",
			});

			expect(result.success).toBe(true);
			if (!result.success) return;
			// No validation_score metric in trace when constitution fails to load
			const hasValidation = result.trace.entries.some(
				(e) =>
					e.type === "metric" &&
					(e as { data?: { name?: string } }).data?.name === "validation_score",
			);
			expect(hasValidation).toBe(false);
		});

		it("should validate artifacts against constitution when validateAgainstConstitution is true", async () => {
			await fs.writeFile(constitutionPath, "- Must include overview\n");

			const result = await strategy.run({
				...validInput,
				constitutionPath,
				validateAgainstConstitution: true,
			});

			expect(result.success).toBe(true);
			if (!result.success) return;
			// validation_score metric should be present in trace
			const validationEntry = result.trace.entries.find(
				(e) =>
					e.type === "metric" &&
					(e as { data?: { name?: string } }).data?.name === "validation_score",
			);
			expect(validationEntry).toBeDefined();
		});

		it("should not validate when validateAgainstConstitution is false even with constitutionPath", async () => {
			await fs.writeFile(constitutionPath, "- Some rule\n");

			const result = await strategy.run({
				...validInput,
				constitutionPath,
				validateAgainstConstitution: false,
			});

			expect(result.success).toBe(true);
			if (!result.success) return;
			// No validation_score metric when validateAgainstConstitution is false
			const hasValidation = result.trace.entries.some(
				(e) =>
					e.type === "metric" &&
					(e as { data?: { name?: string } }).data?.name === "validation_score",
			);
			expect(hasValidation).toBe(false);
		});
	});

	it("should reset validatedInput state between runs", async () => {
		const first = await strategy.run(validInput);
		const second = await strategy.run({ ...validInput, title: "Second Run" });

		expect(first.success).toBe(true);
		expect(second.success).toBe(true);
		if (!second.success) return;
		const specDoc = second.data.secondary?.find((d) =>
			d.name.endsWith("spec.md"),
		);
		expect(specDoc?.content).toContain("Second Run");
	});
});
