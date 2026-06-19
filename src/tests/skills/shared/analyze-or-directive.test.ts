import { describe, expect, it, vi } from "vitest";
import type { Sampler } from "../../../contracts/runtime.js";
import { analyzeOrDirective } from "../../../skills/shared/analyze-or-directive.js";
import {
	createMockSkillExecutionContext,
	createMockSkillRuntime,
} from "../test-helpers.js";

const spec = {
	domain: "evaluation design",
	criteria: ["Define the dataset slices."],
	input: { request: "evaluate our RAG pipeline" },
	outputContract: "a table",
};

function contextWithSampler(sampler?: Sampler) {
	return createMockSkillExecutionContext({
		runtime: {
			...createMockSkillRuntime(),
			sampler,
			clientSupportsSampling: sampler !== undefined,
		},
	});
}

describe("analyzeOrDirective", () => {
	it("returns the directive when no sampler is present", async () => {
		const { recommendation, mode } = await analyzeOrDirective(
			contextWithSampler(undefined),
			spec,
		);
		expect(mode).toBe("directive");
		expect(recommendation.detail.toLowerCase()).toContain("analysis task");
	});

	it("samples when a sampler is present and returns its findings", async () => {
		const sampler: Sampler = vi.fn().mockResolvedValue({
			text: "Slice coverage is thin in tests/golden.jsonl.",
		});
		const { recommendation, mode } = await analyzeOrDirective(
			contextWithSampler(sampler),
			spec,
		);
		expect(mode).toBe("sampled");
		expect(recommendation.detail).toContain("Slice coverage is thin");
		expect(recommendation.title.toLowerCase()).toMatch(/^analysis of your/);
	});

	it("falls back to the directive when sampling throws", async () => {
		const sampler: Sampler = vi.fn().mockRejectedValue(new Error("no model"));
		const { recommendation, mode } = await analyzeOrDirective(
			contextWithSampler(sampler),
			spec,
		);
		expect(mode).toBe("directive");
		expect(recommendation.detail.toLowerCase()).toContain("analysis task");
	});

	it("falls back to the directive when the model returns empty text", async () => {
		const sampler: Sampler = vi.fn().mockResolvedValue({ text: "   " });
		const { recommendation, mode } = await analyzeOrDirective(
			contextWithSampler(sampler),
			spec,
		);
		expect(mode).toBe("directive");
		expect(recommendation.detail.toLowerCase()).toContain("analysis task");
	});
});
