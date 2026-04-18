import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/orch/orch-result-synthesis.js";
import {
	createMockSkillRuntime,
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("orch-result-synthesis-extra", () => {
	it("returns insufficient signal for an empty request (line 85-87)", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});

	it("uses escalate conflict resolution when explicitly set (line 89 escalate branch)", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"merge agent outputs with source attribution and rank the most important claims",
				options: {
					conflictResolution: "escalate",
					deduplicationStrategy: "semantic",
					includeConfidenceScoring: true,
				},
			},
			{
				summaryIncludes: [
					"Result Synthesis planned",
					"conflict: escalate",
					"dedup: semantic",
				],
				detailIncludes: ["Escalate"],
			},
		);
	});

	it("uses priority conflict resolution when explicitly set (line 123 priority branch)", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"synthesise agent outputs and deduplicate overlapping recommendations",
				options: {
					conflictResolution: "priority",
					deduplicationStrategy: "exact",
					includeConfidenceScoring: true,
				},
			},
			{
				summaryIncludes: [
					"Result Synthesis planned",
					"conflict: priority",
					"dedup: exact",
				],
				detailIncludes: ["Priority"],
			},
		);
	});

	it("uses consensus conflict resolution inferred from request text (line 123 consensus branch)", async () => {
		// No explicit conflictResolution → infers "consensus" (default fallback)
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"merge agent outputs into one recommendation with conflicts and format the output",
				options: {
					deduplicationStrategy: "exact",
				},
			},
			{
				summaryIncludes: [
					"Result Synthesis planned",
					"conflict: merge",
					"dedup: exact",
				],
			},
		);
	});

	it("infers consensus when no conflict keyword is present (line 123 default)", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"synthesise the agent outputs preserving source attribution and gaps",
				options: {
					deduplicationStrategy: "none",
				},
			},
			{
				summaryIncludes: ["conflict: consensus", "dedup: none"],
			},
		);
	});

	it("infers escalate conflict resolution from request text (line 125 escalate infer)", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"escalate conflicting agent outputs to a human reviewer for manual approval",
				options: {
					deduplicationStrategy: "none",
				},
			},
			{
				summaryIncludes: ["conflict: escalate"],
			},
		);
	});

	it("infers priority conflict resolution from request text (line 125 priority infer)", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"prioritise the most authoritative agent output and weight it higher when conflicts arise",
				options: {
					deduplicationStrategy: "exact",
				},
			},
			{
				summaryIncludes: ["conflict: priority"],
			},
		);
	});

	it("uses none deduplication strategy and emits correct branch detail (line 135 none branch)", async () => {
		const result = await skillModule.run(
			{
				request:
					"merge conflicting agent outputs preserving source attribution and rank confidence",
				options: {
					conflictResolution: "merge",
					deduplicationStrategy: "none",
					includeConfidenceScoring: true,
				},
			},
			createMockSkillRuntime(),
		);
		const detailText = result.recommendations.map((r) => r.detail).join("\n");
		// "none" deduplication branch emits a marker detail
		expect(detailText).toContain("Deduplication is disabled");
	});

	it("uses exact deduplication strategy and emits correct branch detail (line 135 exact branch)", async () => {
		const result = await skillModule.run(
			{
				request:
					"merge conflicting agent outputs preserving source attribution and rank confidence",
				options: {
					conflictResolution: "merge",
					deduplicationStrategy: "exact",
					includeConfidenceScoring: true,
				},
			},
			createMockSkillRuntime(),
		);
		const detailText = result.recommendations.map((r) => r.detail).join("\n");
		expect(detailText).toContain("exact deduplication only when claim wording");
	});

	it("disables confidence scoring when includeConfidenceScoring is false (line 167 false branch)", async () => {
		const result = await skillModule.run(
			{
				request:
					"merge agent outputs into one recommendation with conflicts and evidence",
				options: {
					conflictResolution: "merge",
					deduplicationStrategy: "semantic",
					includeConfidenceScoring: false,
				},
			},
			createMockSkillRuntime(),
		);
		expect(result.summary).toContain("confidence: disabled");
		const detailText = result.recommendations.map((r) => r.detail).join("\n");
		// Confidence scoring detail should NOT be present when disabled
		expect(detailText).not.toContain(
			"Attach a confidence score to every synthesised claim",
		);
	});

	it("includes confidence scoring detail when enabled (line 167 true branch)", async () => {
		const result = await skillModule.run(
			{
				request:
					"merge agent outputs into one recommendation with conflicts and evidence",
				options: {
					conflictResolution: "merge",
					deduplicationStrategy: "semantic",
					includeConfidenceScoring: true,
				},
			},
			createMockSkillRuntime(),
		);
		expect(result.summary).toContain("confidence: enabled");
		const detailText = result.recommendations.map((r) => r.detail).join("\n");
		expect(detailText).toContain(
			"Attach a confidence score to every synthesised claim",
		);
	});

	it("infers semantic deduplication from request text (line 181 semantic infer)", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"synthesise outputs detecting semantic similarity and near-duplicate claims",
			},
			{
				summaryIncludes: ["dedup: semantic"],
			},
		);
	});

	it("emits hasDeliverable detail when deliverable is set (line 188 branch)", async () => {
		const result = await skillModule.run(
			{
				request:
					"merge agent outputs with conflict resolution into a prioritised ranking",
				deliverable: "executive briefing packet",
				options: {
					conflictResolution: "merge",
					deduplicationStrategy: "semantic",
				},
			},
			createMockSkillRuntime(),
		);
		const detailText = result.recommendations.map((r) => r.detail).join("\n");
		expect(detailText).toContain("executive briefing packet");
	});

	it("emits hasSuccessCriteria detail when successCriteria is set (line 208 branch)", async () => {
		const result = await skillModule.run(
			{
				request:
					"merge agent outputs with source attribution and rank important claims",
				successCriteria: "all canonical claims must include source attribution",
				options: {
					conflictResolution: "consensus",
				},
			},
			createMockSkillRuntime(),
		);
		const detailText = result.recommendations.map((r) => r.detail).join("\n");
		expect(detailText).toContain("all canonical claims must include source");
	});

	it("emits hasConstraints detail when constraints are provided (line 224 branch)", async () => {
		const result = await skillModule.run(
			{
				request:
					"synthesise agent outputs and deduplicate overlapping findings",
				constraints: ["output must be under 500 tokens", "no prose summaries"],
				options: {
					conflictResolution: "consensus",
					deduplicationStrategy: "exact",
				},
			},
			createMockSkillRuntime(),
		);
		const detailText = result.recommendations.map((r) => r.detail).join("\n");
		expect(detailText).toContain("Apply the stated constraints");
	});

	it("emits hasContext cross-reference detail when context is provided (line 230 branch)", async () => {
		const result = await skillModule.run(
			{
				request:
					"merge conflicting agent outputs and surface any gaps in the analysis",
				context: "Previous analysis established that module A was critical.",
				options: {
					conflictResolution: "merge",
					deduplicationStrategy: "exact",
				},
			},
			createMockSkillRuntime(),
		);
		const detailText = result.recommendations.map((r) => r.detail).join("\n");
		expect(detailText).toContain("Cross-reference the synthesised claims");
	});

	it("builds escalate synthesis packet with held-for-review disposition (line 236 branch)", async () => {
		const result = await skillModule.run(
			{
				request:
					"escalate agent output conflicts to human reviewer for manual approval",
				deliverable: "escalation packet",
				options: {
					conflictResolution: "escalate",
					deduplicationStrategy: "exact",
					includeConfidenceScoring: true,
				},
			},
			createMockSkillRuntime(),
		);
		const example = result.artifacts?.find(
			(a) => a.kind === "worked-example",
		) as
			| {
					expectedOutput?: {
						outputSchema?: { claims?: Array<Record<string, unknown>> };
					};
			  }
			| undefined;
		const firstClaim = example?.expectedOutput?.outputSchema?.claims?.[0];
		expect(firstClaim?.disposition).toContain("held for human review");
	});

	it("builds priority synthesis packet with dissent retention note (line 251 branch)", async () => {
		const result = await skillModule.run(
			{
				request:
					"prioritise authoritative agent output and rank by domain authority",
				deliverable: "priority synthesis",
				options: {
					conflictResolution: "priority",
					deduplicationStrategy: "exact",
					includeConfidenceScoring: false,
				},
			},
			createMockSkillRuntime(),
		);
		const example = result.artifacts?.find(
			(a) => a.kind === "worked-example",
		) as
			| {
					expectedOutput?: {
						outputSchema?: {
							dissentingClaims?: Array<Record<string, unknown>>;
						};
					};
			  }
			| undefined;
		const firstDissent =
			example?.expectedOutput?.outputSchema?.dissentingClaims?.[0];
		expect(firstDissent?.resolution).toContain("retained as dissent");
	});
});
