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
		expect(result.data.artifacts.readme).toBeTruthy();
		expect(result.data.artifacts.spec).toBeTruthy();
		expect(result.data.artifacts.plan).toBeTruthy();
		expect(result.data.artifacts.tasks).toBeTruthy();
		expect(result.data.artifacts.progress).toBeTruthy();
		expect(result.data.artifacts.adr).toBeTruthy();
		expect(result.data.artifacts.roadmap).toBeTruthy();
		expect(result.data.stats.documentsGenerated).toBe(7);
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
			expect(result.data.validation).toBeNull();
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
			expect(result.data.validation).not.toBeNull();
			expect(result.data.validation?.score).toBeGreaterThanOrEqual(0);
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
			expect(result.data.validation).toBeNull();
		});
	});

	it("should reset validatedInput state between runs", async () => {
		const first = await strategy.run(validInput);
		const second = await strategy.run({ ...validInput, title: "Second Run" });

		expect(first.success).toBe(true);
		expect(second.success).toBe(true);
		if (!second.success) return;
		expect(second.data.artifacts.spec).toContain("Second Run");
	});
});
