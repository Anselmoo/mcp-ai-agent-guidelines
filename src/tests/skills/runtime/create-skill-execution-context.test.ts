import { describe, expect, it, vi } from "vitest";
import type { ModelProfile } from "../../../contracts/runtime.js";
import { createSkillExecutionContext } from "../../../skills/runtime/create-skill-execution-context.js";
import {
	createMockManifest,
	createMockSkillRuntime,
	createWorkspaceReaderStub,
	mockModelProfile,
} from "../test-helpers.js";

describe("create-skill-execution-context", () => {
	it("derives the skill ID and model from the manifest and runtime", () => {
		const manifest = createMockManifest({ id: "context-skill" });
		const input = { request: "analyze this skill" };
		const chosenModel = {
			...mockModelProfile,
			id: "chosen-model",
			label: "Chosen Model",
			modelClass: "strong",
			costTier: "strong",
		} satisfies ModelProfile;
		const chooseSkillModel = vi.fn(() => chosenModel);
		const runtime = createMockSkillRuntime({
			modelRouter: { chooseSkillModel },
			workspace: createWorkspaceReaderStub(),
		});

		const context = createSkillExecutionContext(manifest, input, runtime);

		expect(chooseSkillModel).toHaveBeenCalledWith(manifest, input);
		expect(context).toMatchObject({
			skillId: manifest.id,
			manifest,
			input,
			runtime,
		});
		expect(context.model.id).toBe("chosen-model");
	});
});
