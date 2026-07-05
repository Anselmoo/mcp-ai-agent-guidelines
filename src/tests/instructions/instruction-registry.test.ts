import { describe, expect, it } from "vitest";
import { InstructionRegistry } from "../../instructions/instruction-registry.js";
import { getInstructionSpec } from "../../instructions/instruction-specs.js";

// Regression lock for issue #1445 (auto/black-box mode invariants).
// These tests characterise already-shipped behaviour and must PASS immediately.
// If any assertion fails, an invariant has regressed — do NOT weaken the test.
describe("issue-1445 regression: meta-routing reactivationPolicy", () => {
	it("meta-routing spec has reactivationPolicy === 'session-start'", () => {
		const spec = getInstructionSpec("meta-routing");
		expect(spec).toBeDefined();
		expect(spec?.reactivationPolicy).toBe("session-start");
	});

	it("meta-routing is on the 'discovery' surface", () => {
		const spec = getInstructionSpec("meta-routing");
		expect(spec?.surface).toBe("discovery");
	});

	it("meta-routing is public", () => {
		const spec = getInstructionSpec("meta-routing");
		expect(spec?.public).toBe(true);
	});
});

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
