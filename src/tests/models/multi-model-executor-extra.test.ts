import { describe, expect, it, vi } from "vitest";
import * as executor from "../../models/multi-model-executor.js";

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

describe("multi-model-executor extra branches", () => {
	const echo: executor.LaneExecutor = async (modelId, prompt) =>
		`response from ${modelId} for "${prompt.slice(0, 20)}"`;

	// ── majorityVote ──────────────────────────────────────────────────────────

	it("majorityVote resolves with clear majority (no tie)", async () => {
		// Two voters say "yes", one says "no"
		let call = 0;
		const votingExecutor: executor.LaneExecutor = async (modelId) => {
			call++;
			if (call <= 2) return "yes and details";
			return "no and reasoning";
		};

		const res = await executor.majorityVote("vote-test", votingExecutor, 3, {
			modelIds: ["m1", "m2", "m3"],
			tiebreakerModelId: "tiebreaker",
		});
		expect(res.pattern).toBe("majorityVote");
		expect(res.finalOutput).toBe("yes");
		expect(res.lanes.length).toBe(3); // no tiebreaker needed
	});

	it("majorityVote calls tiebreaker on tie", async () => {
		// Split 1-1 (2 voters)
		let call = 0;
		const tiedExecutor: executor.LaneExecutor = async (modelId) => {
			call++;
			if (call === 1) return "yes";
			if (call === 2) return "no";
			return "tiebreak-yes";
		};

		const res = await executor.majorityVote("vote-test", tiedExecutor, 2, {
			modelIds: ["m1", "m2"],
			tiebreakerModelId: "tiebreaker",
		});
		expect(res.pattern).toBe("majorityVote");
		expect(res.finalOutput).toBe("tiebreak-yes");
		expect(res.lanes.length).toBe(3); // 2 votes + tiebreaker
	});

	it("majorityVote defaults to 3 voters from synth-research when no options", async () => {
		const res = await executor.majorityVote("my prompt", echo, 3);
		expect(res.pattern).toBe("majorityVote");
		// 3 vote lanes only (clear majority since all use same model and return same prefix)
		expect(res.lanes.length).toBeGreaterThanOrEqual(3);
	});

	// ── cascadeFallback ───────────────────────────────────────────────────────

	it("cascadeFallback stops at first model that passes qualityCheck", async () => {
		const callLog: string[] = [];
		const testExecutor: executor.LaneExecutor = async (modelId) => {
			callLog.push(modelId);
			if (modelId === "m2") return "good-output";
			return "bad";
		};

		const res = await executor.cascadeFallback(
			"test-prompt",
			testExecutor,
			(out) => out.startsWith("good"),
			{ modelIds: ["m1", "m2", "m3"] },
		);
		expect(res.pattern).toBe("cascadeFallback");
		expect(res.finalOutput).toBe("good-output");
		// Should have stopped after m2
		expect(callLog).toEqual(["m1", "m2"]);
		expect(res.lanes.length).toBe(2);
	});

	it("cascadeFallback falls through all models when quality never passes", async () => {
		const res = await executor.cascadeFallback(
			"test",
			echo,
			() => false,
			{ modelIds: ["m1", "m2", "m3"] },
		);
		expect(res.pattern).toBe("cascadeFallback");
		// Should return last lane's output
		expect(res.finalOutput).toContain("response from m3");
		expect(res.lanes.length).toBe(3);
	});

	it("cascadeFallback with empty modelIds returns empty finalOutput", async () => {
		const res = await executor.cascadeFallback(
			"test",
			echo,
			() => true,
			{ modelIds: [] },
		);
		expect(res.finalOutput).toBe("");
		expect(res.lanes.length).toBe(0);
	});

	// ── tripleParallelSynthesis default resolution ────────────────────────────

	it("tripleParallelSynthesis uses defaults from resolveForSkill when no options", async () => {
		const res = await executor.tripleParallelSynthesis("hello", echo);
		expect(res.pattern).toBe("tripleParallelSynthesis");
		// 3 draft lanes (default-draft) + 1 synthesis
		expect(res.lanes.length).toBe(4);
		expect(res.lanes[0]?.modelId).toBe("default-draft");
	});

	// ── adversarialCritique default resolution ────────────────────────────────

	it("adversarialCritique uses defaults when no options", async () => {
		const res = await executor.adversarialCritique("hello", echo);
		expect(res.pattern).toBe("adversarialCritique");
		expect(res.lanes[0]?.modelId).toBe("default-plan");
		expect(res.lanes[1]?.modelId).toBe("default-critique");
	});

	// ── draftReviewChain default resolution ───────────────────────────────────

	it("draftReviewChain uses defaults when no options", async () => {
		const res = await executor.draftReviewChain("hello", echo);
		expect(res.pattern).toBe("draftReviewChain");
		expect(res.lanes[0]?.modelId).toBe("default-draft");
		expect(res.lanes[1]?.modelId).toBe("default-review");
	});
});
