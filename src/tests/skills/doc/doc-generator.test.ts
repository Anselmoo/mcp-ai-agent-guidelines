import { describe, it } from "vitest";
import { skillModule } from "../../../skills/doc/doc-generator.js";
import {
	expectEmptyRequestHandling,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("doc-generator", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});
});
