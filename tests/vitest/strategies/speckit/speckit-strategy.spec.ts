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

		expect(result.data.stats.documentsGenerated).toBe(7);
		expect(result.data.artifacts.readme).toBeTruthy();
		expect(result.data.artifacts.spec).toBeTruthy();
		expect(result.data.artifacts.plan).toBeTruthy();
		expect(result.data.artifacts.tasks).toBeTruthy();
		expect(result.data.artifacts.progress).toBeTruthy();
		expect(result.data.artifacts.adr).toBeTruthy();
		expect(result.data.artifacts.roadmap).toBeTruthy();
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
		expect(result.data.validation).not.toBeNull();
		expect(result.data.validation?.isValid).toBe(true);
		expect(result.data.validation?.warnings.length).toBeGreaterThan(0);
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
		expect(result.data.validation).toBeNull();
	});
});
