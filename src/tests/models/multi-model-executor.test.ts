import { describe, expect, it, vi } from "vitest";
import * as executor from "../../models/multi-model-executor.js";

// Mock resolveForSkill to return deterministic string model IDs
vi.mock("../../config/orchestration-config.js", () => ({
	resolveForSkill: (skill: string) => {
		const map: Record<string, string> = {
			"synth-research": "default-draft",
			"lead-exec-briefing": "default-synth",
			"arch-system": "default-plan",
			"gov-policy-validation": "default-critique",
			"doc-generator": "default-draft",
			"qual-review": "default-review",
			"synth-engine": "default-tiebreaker",
			"req-analysis": "default-cheap",
			"eval-design": "default-mid",
			"arch-system-cascade": "default-strong",
			"lead-exec-briefing-cascade": "default-enterprise",
		};
		return map[skill] ?? skill;
	},
}));

describe("multi-model-executor", () => {
	const mockExecutor: executor.LaneExecutor = async (modelId, prompt) => {
		if (prompt.startsWith("vote-test")) {
			if (modelId === "draft1" || modelId === "draft2")
				return `yes from ${modelId}`;
			if (modelId === "draft3") return `no from ${modelId}`;
			if (modelId === "tiebreaker") return "no tiebreak";
		}
		if (prompt === "cascade-test") {
			if (modelId === "cheap") return "fail";
			if (modelId === "mid") return "pass";
			return "pass-other";
		}
		return `response from ${modelId}`;
	};

	it("tripleParallelSynthesis runs 3 drafts in parallel and synthesizes", async () => {
		const res = await executor.tripleParallelSynthesis(
			"test-prompt",
			mockExecutor,
			{
				draftModelIds: ["draft1", "draft2", "draft3"],
				synthesisModelId: "synth",
			},
		);
		expect(res.pattern).toBe("tripleParallelSynthesis");
		expect(res.lanes.length).toBe(4); // 3 drafts + 1 synth
		expect(res.lanes[0].modelId).toBe("draft1");
		expect(res.lanes[1].modelId).toBe("draft2");
		expect(res.lanes[2].modelId).toBe("draft3");
		expect(res.lanes[3].modelId).toBe("synth");
		expect(res.finalOutput).toMatch(/response from synth/);
	});

	it("adversarialCritique runs plan, critique, and synthesis", async () => {
		const res = await executor.adversarialCritique(
			"test-prompt",
			mockExecutor,
			{
				planModelId: "plan",
				critiqueModelId: "critique",
				synthesisModelId: "synth",
			},
		);
		expect(res.pattern).toBe("adversarialCritique");
		expect(res.lanes.length).toBe(3);
		expect(res.lanes[0].modelId).toBe("plan");
		expect(res.lanes[1].modelId).toBe("critique");
		expect(res.lanes[2].modelId).toBe("synth");
		expect(res.finalOutput).toMatch(/response from synth/);
	});

	it("draftReviewChain runs draft, review, finalize", async () => {
		const res = await executor.draftReviewChain("test-prompt", mockExecutor, {
			draftModelId: "draft",
			reviewModelId: "review",
		});
		expect(res.pattern).toBe("draftReviewChain");
		expect(res.lanes.length).toBe(3);
		expect(res.lanes[0].modelId).toBe("draft");
		expect(res.lanes[1].modelId).toBe("review");
		expect(res.lanes[2].modelId).toBe("draft");
		expect(res.finalOutput).toMatch(/response from draft/);
	});

	it("majorityVote returns majority (2:1) with no tiebreaker", async () => {
		const res = await executor.majorityVote("vote-test", mockExecutor, 3, {
			modelIds: ["draft1", "draft2", "draft3"],
			tiebreakerModelId: "tiebreaker",
		});
		expect(res.pattern).toBe("majorityVote");
		expect(res.lanes.length).toBe(3); // no tiebreaker needed
		expect(res.finalOutput).toBe("yes");
	});

	it("majorityVote invokes tiebreaker when tied", async () => {
		const tieExecutor: executor.LaneExecutor = async (modelId) => {
			if (modelId === "draft1") return "yes";
			if (modelId === "draft2") return "no";
			if (modelId === "draft3") return "yes";
			if (modelId === "tiebreaker") return "no tiebreak";
			return "unknown";
		};
		const res = await executor.majorityVote("tied-test", tieExecutor, 3, {
			modelIds: ["draft1", "draft2", "draft3"],
			tiebreakerModelId: "tiebreaker",
		});
		// 2 yes, 1 no → majority is yes, no tiebreaker needed
		expect(res.lanes.length).toBe(3);
		expect(res.finalOutput).toBe("yes");
	});

	it("majorityVote invokes tiebreaker on exact tie", async () => {
		const tieExecutor: executor.LaneExecutor = async (modelId) => {
			if (modelId === "draft1") return "yes";
			if (modelId === "draft2") return "no";
			if (modelId === "tiebreaker") return "no final";
			return "unknown";
		};
		const res = await executor.majorityVote("tied-test", tieExecutor, 2, {
			modelIds: ["draft1", "draft2"],
			tiebreakerModelId: "tiebreaker",
		});
		expect(res.lanes.length).toBe(3); // 2 votes + 1 tiebreaker
		expect(res.finalOutput).toBe("no");
	});

	it("cascadeFallback stops at first passing quality check", async () => {
		const qualityCheck = (output: string) => output.startsWith("pass");
		const res = await executor.cascadeFallback(
			"cascade-test",
			mockExecutor,
			qualityCheck,
			{
				modelIds: ["cheap", "mid", "strong", "enterprise"],
			},
		);
		expect(res.pattern).toBe("cascadeFallback");
		expect(res.lanes.length).toBe(2); // cheap fails, mid passes
		expect(res.finalOutput).toBe("pass");
	});

	it("cascadeFallback returns last output if all fail", async () => {
		const alwaysFail = async (modelId: string) => `fail-${modelId}`;
		const res = await executor.cascadeFallback("x", alwaysFail, () => false, {
			modelIds: ["m1", "m2"],
		});
		expect(res.lanes.length).toBe(2);
		expect(res.finalOutput).toBe("fail-m2");
	});
});
