import { describe, expect, it } from "vitest";
import { ModelRouter } from "../../models/model-router.js";
import { OrchestrationPatterns } from "../../models/orchestration-patterns.js";

describe("orchestration-patterns", () => {
	it("assigns strong plan/synthesis and independent critique models for pattern 1", () => {
		const patterns = new OrchestrationPatterns(new ModelRouter());
		const roles = patterns.pattern1Roles();

		expect(roles.planModel.id).toBe("strong_primary");
		expect(roles.critiqueModel.id).toBe("strong_primary");
		expect(roles.synthesisModel.id).toBe("strong_primary");
	});

	it("uses a free draft lane and strong review for pattern 2", () => {
		const patterns = new OrchestrationPatterns(new ModelRouter());
		const roles = patterns.pattern2Roles();

		expect(roles.draftModel.id).toBe("free_primary");
		expect(roles.reviewModel.id).toBe("strong_primary");
	});

	it("returns the expected voting and synthesis lane layouts", () => {
		const patterns = new OrchestrationPatterns(new ModelRouter());
		const voteRoles = patterns.pattern3Roles();
		const triple = patterns.pattern5Roles();

		expect(voteRoles.voters.map((model) => model.id)).toEqual([
			"free_primary",
			"free_primary",
			"free_primary",
		]);
		expect(voteRoles.tiebreak1.id).toBe("strong_primary");
		expect(voteRoles.tiebreak2.id).toBe("strong_primary");
		expect(triple.freeModels.map((model) => model.id)).toEqual([
			"free_primary",
			"free_primary",
			"free_primary",
		]);
		expect(triple.synthesisModel.id).toBe("strong_primary");
	});
});
