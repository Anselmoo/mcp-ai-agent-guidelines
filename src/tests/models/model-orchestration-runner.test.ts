import { describe, expect, it, vi } from "vitest";
import type { ModelProfile } from "../../contracts/runtime.js";
import { ModelOrchestrationRunner } from "../../models/model-orchestration-runner.js";

const freeModel: ModelProfile = {
	id: "gpt-4.1",
	label: "GPT-4.1",
	modelClass: "free",
	costTier: "free",
	strengths: ["drafting"],
	maxContextWindow: "large",
};

const secondFreeModel: ModelProfile = {
	...freeModel,
	id: "gpt-5-mini",
	label: "GPT-5 mini",
};

const strongModel: ModelProfile = {
	id: "claude-sonnet-4.6",
	label: "Claude Sonnet 4.6",
	modelClass: "strong",
	costTier: "strong",
	strengths: ["synthesis"],
	maxContextWindow: "large",
};

function createRunner() {
	const executeLane = vi.fn(
		async (modelId: string, prompt: string) => `${modelId}:${prompt}`,
	);
	const router = {
		getFanOut: (skillId: string) => (skillId === "synth-research" ? 3 : 1),
		chooseFreeParallelLanes: () =>
			[freeModel, secondFreeModel, secondFreeModel] as [
				ModelProfile,
				ModelProfile,
				ModelProfile,
			],
		chooseSynthesisModel: () => strongModel,
		chooseCritiqueModel: () => strongModel,
	} as never;
	return {
		runner: new ModelOrchestrationRunner({ router, executeLane }),
		executeLane,
	};
}

describe("ModelOrchestrationRunner", () => {
	it("uses configured fan-out to pick triple synthesis in auto mode", async () => {
		const { runner, executeLane } = createRunner();

		const result = await runner.run("investigate architecture", {
			patternName: "auto",
			skillId: "synth-research",
		});

		expect(result.patternName).toBe("tripleParallelSynthesis");
		expect(result.lanes).toHaveLength(4);
		expect(executeLane).toHaveBeenCalled();
	});

	it("defaults auto mode without a skill id to triple synthesis", async () => {
		const { runner } = createRunner();

		const result = await runner.run("investigate architecture", {
			patternName: "auto",
		});

		expect(result.patternName).toBe("tripleParallelSynthesis");
	});

	it("maps physics skills to adversarial critique in auto mode", async () => {
		const { runner } = createRunner();

		const result = await runner.run("explain the coupling", {
			patternName: "auto",
			skillId: "qm-entanglement-mapper",
		});

		expect(result.patternName).toBe("adversarialCritique");
		expect(result.lanes).toHaveLength(3);
	});

	it("maps eval and bench skills to majority vote in auto mode", async () => {
		const { runner } = createRunner();

		const result = await runner.run("compare the outputs", {
			patternName: "auto",
			skillId: "bench-eval-suite",
		});

		expect(result.patternName).toBe("majorityVote");
	});

	it("falls back to draft review chain for single-fanout non-physics skills", async () => {
		const { runner } = createRunner();

		const result = await runner.run("draft the guide", {
			patternName: "auto",
			skillId: "doc-generator",
		});

		expect(result.patternName).toBe("draftReviewChain");
	});

	it("supports explicit majority-vote execution", async () => {
		const { runner } = createRunner();

		const result = await runner.run("approve", {
			patternName: "majorityVote",
			skillId: "eval-variance",
			voteCount: 3,
		});

		expect(result.patternName).toBe("majorityVote");
		expect(result.finalOutput).toContain("approve");
	});

	it("supports explicit cascade fallback execution", async () => {
		const { runner } = createRunner();

		const result = await runner.run("produce a resilient answer", {
			patternName: "cascadeFallback",
			minCascadeOutputLength: 5,
		});

		expect(result.patternName).toBe("cascadeFallback");
		expect(result.finalOutput).toContain("produce a resilient answer");
	});
});
