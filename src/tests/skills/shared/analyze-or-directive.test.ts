import { describe, expect, it, vi } from "vitest";
import type { Sampler } from "../../../contracts/runtime.js";
import {
	type AnalyzeDeps,
	analyzeOrDirective,
} from "../../../skills/shared/analyze-or-directive.js";

const spec = {
	domain: "evaluation design",
	criteria: ["Define the dataset slices."],
	input: { request: "evaluate our RAG pipeline" },
	outputContract: "a table",
	candidateNextTools: ["evidence-research", "quality-evaluate"],
};

function deps(sampler?: Sampler): AnalyzeDeps {
	return { modelClass: "strong", sampler };
}

describe("analyzeOrDirective", () => {
	it("returns the directive when no sampler is present", async () => {
		const { recommendation, mode } = await analyzeOrDirective(
			deps(undefined),
			spec,
		);
		expect(mode).toBe("directive");
		expect(recommendation.detail.toLowerCase()).toContain("analysis task");
		// The directive carries the next-action half of the contract through.
		expect(recommendation.detail).toContain("evidence-research");
	});

	it("samples when a sampler is present and returns its findings", async () => {
		const sampler: Sampler = vi.fn().mockResolvedValue({
			text: "Slice coverage is thin in tests/golden.jsonl.",
		});
		const { recommendation, mode } = await analyzeOrDirective(
			deps(sampler),
			spec,
		);
		expect(mode).toBe("sampled");
		expect(recommendation.detail).toContain("Slice coverage is thin");
		expect(recommendation.title.toLowerCase()).toMatch(/^analysis of your/);
	});

	it("passes the requested model class through to the sampler", async () => {
		const sampler: Sampler = vi
			.fn()
			.mockResolvedValue({ text: "findings + workflow" });
		await analyzeOrDirective({ modelClass: "cheap", sampler }, spec);
		expect(sampler).toHaveBeenCalledWith(
			expect.objectContaining({ modelClass: "cheap" }),
		);
	});

	it("falls back to the directive when sampling throws", async () => {
		const sampler: Sampler = vi.fn().mockRejectedValue(new Error("no model"));
		const { recommendation, mode } = await analyzeOrDirective(
			deps(sampler),
			spec,
		);
		expect(mode).toBe("directive");
		expect(recommendation.detail.toLowerCase()).toContain("analysis task");
	});

	it("falls back to the directive when the model returns empty text", async () => {
		const sampler: Sampler = vi.fn().mockResolvedValue({ text: "   " });
		const { recommendation, mode } = await analyzeOrDirective(
			deps(sampler),
			spec,
		);
		expect(mode).toBe("directive");
		expect(recommendation.detail.toLowerCase()).toContain("analysis task");
	});
});
