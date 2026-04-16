import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/gov/gov-prompt-injection-hardening.js";
import {
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("gov-prompt-injection-hardening", () => {
	it("focuses on retrieval-surface injection hardening", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"harden rag pipeline against indirect prompt injection from untrusted documents",
				options: {
					attackSurface: "retrieval",
					defensePattern: "delimiter-based",
					trustLevel: "untrusted-input",
				},
			},
			{
				summaryIncludes: [
					"Prompt Injection Hardening produced",
					"defence guideline",
				],
				detailIncludes: ["RAG injection prevention"],
				recommendationCountAtLeast: 1,
			},
		);

		expect(result.artifacts?.map((a) => a.kind)).toEqual([
			"comparison-matrix",
			"output-template",
			"tool-chain",
			"worked-example",
			"eval-criteria",
		]);
		expect(result.artifacts?.[0]).toMatchObject({
			kind: "comparison-matrix",
			title: "Injection attack surface and primary defences",
		});
		expect(result.artifacts?.[2]).toMatchObject({
			kind: "tool-chain",
			title: "Injection hardening workflow",
		});
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});
});
