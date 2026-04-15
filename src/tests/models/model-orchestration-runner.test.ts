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

	it("maps physics skills to adversarial critique in auto mode", async () => {
		const { runner } = createRunner();

		const result = await runner.run("explain the coupling", {
			patternName: "auto",
			skillId: "qm-entanglement-mapper",
		});

		expect(result.patternName).toBe("adversarialCritique");
		expect(result.lanes).toHaveLength(3);
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
});
