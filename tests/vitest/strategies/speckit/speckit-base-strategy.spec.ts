import { beforeEach, describe, expect, it } from "vitest";
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
});
