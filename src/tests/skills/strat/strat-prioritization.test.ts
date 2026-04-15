import { describe, it } from "vitest";
import { skillModule } from "../../../skills/strat/strat-prioritization.js";
import {
	expectEmptyRequestHandling,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("strat-prioritization", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});
});
