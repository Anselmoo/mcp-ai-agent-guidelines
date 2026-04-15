import { describe, expect, it } from "vitest";
import { InstructionRegistry } from "../../instructions/instruction-registry.js";

describe("instruction-registry", () => {
	it("indexes generated instructions by id and tool name", () => {
		const registry = new InstructionRegistry();
		const reviewById = registry.getById("review");
		const reviewByTool = registry.getByToolName("review");

		expect(registry.getAll().length).toBeGreaterThan(0);
		expect(reviewById).toBeDefined();
		expect(reviewByTool).toBe(reviewById);
	});

	it("throws a descriptive error for unknown instruction executions", async () => {
		const registry = new InstructionRegistry();

		await expect(
			registry.execute("missing-instruction", { request: "test" }, {} as never),
		).rejects.toThrow("Unknown instruction workflow");
	});
});
