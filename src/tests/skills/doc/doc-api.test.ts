import { describe, it } from "vitest";
import { skillModule } from "../../../skills/doc/doc-api.js";
import {
	expectEmptyRequestHandling,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("doc-api", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});
});
