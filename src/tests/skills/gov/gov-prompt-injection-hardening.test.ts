import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/gov/gov-prompt-injection-hardening.js";
import {
	createMockSkillRuntime,
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

	it("asks for more detail when a low-signal simple request has no injection vocabulary", async () => {
		const result = await skillModule.run(
			{
				request: "improve my weather widget please",
				context: "just a small hobby project",
			},
			createMockSkillRuntime(),
		);

		expect(result.executionMode).toBe("capability");
		expect(result.recommendations[0]).toMatchObject({
			title: "Provide more detail",
		});
	});

	it("ignores options that fail schema validation (parsed.ok === false)", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "harden our pipeline against prompt injection attacks",
				options: {
					injectionVector: "not-a-real-vector",
				},
			},
			{
				summaryIncludes: ["Prompt Injection Hardening produced"],
			},
		);

		// None of the vector-specific guidance strings should appear because the
		// invalid enum value fails schema parsing and opts becomes undefined.
		const detailText = result.recommendations.map((r) => r.detail).join("\n");
		expect(detailText).not.toContain("Direct injection hardening:");
	});

	it("applies injectionVector, defenseDepth, and trustBoundary guidance when all options are valid", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "harden our pipeline against prompt injection attacks",
				options: {
					injectionVector: "rag-context",
					defenseDepth: "sandboxing",
					trustBoundary: "semi-trusted",
				},
			},
			{
				summaryIncludes: ["Prompt Injection Hardening produced"],
			},
		);

		const detailText = result.recommendations.map((r) => r.detail).join("\n");
		expect(detailText).toContain("RAG-context injection hardening:");
		expect(detailText).toContain("Sandboxing defence:");
		expect(detailText).toContain("Semi-trusted input trust boundary:");
	});

	it("covers every injectionVector, defenseDepth, and trustBoundary enum value", async () => {
		const injectionVectors = [
			"direct",
			"indirect",
			"rag-context",
			"tool-response",
			"user-input",
		] as const;
		const defenseDepths = [
			"input-validation",
			"prompt-structure",
			"output-filtering",
			"sandboxing",
			"layered",
		] as const;
		const trustBoundaries = [
			"untrusted-input",
			"semi-trusted",
			"system-only",
		] as const;

		for (const injectionVector of injectionVectors) {
			const result = await skillModule.run(
				{
					request: "harden our pipeline against prompt injection attacks",
					options: { injectionVector },
				},
				createMockSkillRuntime(),
			);
			expect(result.executionMode).toBe("capability");
		}

		for (const defenseDepth of defenseDepths) {
			const result = await skillModule.run(
				{
					request: "harden our pipeline against prompt injection attacks",
					options: { defenseDepth },
				},
				createMockSkillRuntime(),
			);
			expect(result.executionMode).toBe("capability");
		}

		for (const trustBoundary of trustBoundaries) {
			const result = await skillModule.run(
				{
					request: "harden our pipeline against prompt injection attacks",
					options: { trustBoundary },
				},
				createMockSkillRuntime(),
			);
			expect(result.executionMode).toBe("capability");
		}
	});

	it("falls back to generic hardening guidance when no rule pattern matches and no options are set", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"design a robust scalable resilient distributed AI pipeline architecture for our new product platform integration",
			},
			{
				summaryIncludes: ["Prompt Injection Hardening produced"],
			},
		);

		const detailText = result.recommendations.map((r) => r.detail).join("\n");
		expect(detailText).toContain(
			"To harden an AI pipeline against prompt injection:",
		);
		expect(detailText).toContain(
			"Prompt injection is an active threat that evolves",
		);
	});

	it("appends a constraints guideline when constraints are supplied", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "harden our pipeline against prompt injection attacks",
				constraints: ["must run under 50ms", "no new dependencies"],
			},
			{
				summaryIncludes: ["Prompt Injection Hardening produced"],
			},
		);

		const detailText = result.recommendations.map((r) => r.detail).join("\n");
		expect(detailText).toContain(
			"Apply injection hardening under the following constraints:",
		);
		expect(detailText).toContain("must run under 50ms");
	});

	it("uses singular 'guideline' wording when exactly one guideline is produced", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "Add red-team exercises for prompt injection testing",
			},
			{
				summaryIncludes: [
					"Prompt Injection Hardening produced 1 defence guideline for",
				],
			},
		);

		expect(result.summary).not.toContain("1 defence guidelines");
	});
});
