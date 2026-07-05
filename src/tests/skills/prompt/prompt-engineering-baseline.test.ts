import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/prompt/prompt-engineering.js";
import { createMockSkillRuntime } from "../test-helpers.js";

describe("prompt-engineering baseline (pre-selector)", () => {
	it("emits the current artifact-kind order for a plain request", async () => {
		const result = await skillModule.run(
			{ request: "Write a summarization prompt" },
			createMockSkillRuntime(),
		);
		expect(result.artifacts?.map((a) => a.kind)).toEqual([
			"comparison-matrix",
			"output-template",
			"worked-example",
			"tool-chain",
		]);
	});
});
