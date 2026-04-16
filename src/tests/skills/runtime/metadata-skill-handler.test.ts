import { describe, expect, it } from "vitest";
import {
	executeMetadataBackedSkill,
	metadataSkillHandler,
} from "../../../skills/runtime/metadata-skill-handler.js";
import {
	createMockManifest,
	createMockSkillExecutionContext,
} from "../test-helpers.js";

describe("metadata-skill-handler", () => {
	it("builds fallback recommendations from manifest metadata", async () => {
		const manifest = createMockManifest({
			displayName: "Metadata Skill",
			purpose: "Summarize the purpose.",
			usageSteps: ["Step 1", "Step 2", "Step 3", "Step 4"],
			recommendationHints: ["Hint 1", "Hint 2", "Hint 3", "Hint 4"],
		});
		const context = createMockSkillExecutionContext({ manifest });

		const result = await executeMetadataBackedSkill(context.input, context);

		expect(result.executionMode).toBe("fallback");
		expect(result.summary).toContain(
			"Metadata Skill generated 2 recommendation(s).",
		);
		expect(result.groundingSummary).toContain("request-grounded");
		expect(result.recommendations.map((item) => item.title)).toEqual([
			"Translate Metadata Skill into concrete next steps",
			"Address the requested outcome",
		]);
		expect(result.artifacts).toBeDefined();
		expect(result.artifacts?.[0]).toMatchObject({
			kind: "tool-chain",
			title: "Metadata Skill usage steps",
		});
	});

	it("falls back to a generic recommendation when manifest metadata is sparse", async () => {
		const manifest = createMockManifest({
			purpose: "",
			usageSteps: [],
			recommendationHints: [],
		});
		const context = createMockSkillExecutionContext({ manifest });

		const result = await metadataSkillHandler.execute(context.input, context);

		expect(result.recommendations).toEqual([
			{
				title: "Address the requested outcome",
				detail:
					"Work from the concrete request `review the architecture plan` instead of restating the skill description. Keep the response tight around `review`, `architecture`, `plan`.",
				modelClass: context.model.modelClass,
				groundingScope: "request",
				problem:
					"The answer may drift away from the user’s actual problem if it ignores `review`, `architecture`, `plan`.",
				suggestedAction:
					"Lead with the concrete problem and walk toward an implementation answer instead of repeating generic capability text.",
			},
		]);
		expect(result.artifacts?.[0]).toMatchObject({
			kind: "tool-chain",
			title: "Test Skill usage steps",
		});
	});
});
