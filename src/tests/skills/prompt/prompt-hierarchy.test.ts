import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/prompt/prompt-hierarchy.js";
import {
	createMockSkillRuntime,
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("prompt-hierarchy", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("calibrates autonomy with comparison, workflow, and rubric artifacts", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"Set up bounded autonomy with approval gates for tool execution, escalation on ambiguity, and audit logging",
				context:
					"The agent can draft vendor responses but must never send them without human review.",
				options: {
					autonomyLevel: "bounded",
					includeApprovalGates: true,
					includeFallbacks: true,
				},
			},
			{
				summaryIncludes: ["Prompt Hierarchy produced"],
				detailIncludes: ["approval", "fallback", "audit"],
			},
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"comparison-matrix",
			"output-template",
			"tool-chain",
			"worked-example",
			"eval-criteria",
		]);
		expect(result.artifacts?.[1]).toMatchObject({
			kind: "output-template",
			title: "Hierarchy memo template",
		});
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("returns insufficient-signal guidance for a non-empty request with no keywords or context", async () => {
		// "is it" contains only stop/short words, so keywords.length === 0, and
		// no context is supplied, so !signals.hasContext is true: this exercises
		// the guard's true branch, distinct from the schema-validation failure
		// path used by expectEmptyRequestHandling (which sends an empty string).
		const result = await skillModule.run(
			{ request: "is it" },
			createMockSkillRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.summary.length).toBeGreaterThan(0);
		expect(result.recommendations[0]).toMatchObject({
			title: "Provide more detail",
		});
	});

	it("treats context-only input (no keywords) as sufficient signal", async () => {
		// rawRequest is empty (no keywords), but hasContext is true, so the
		// insufficient-signal guard's `!signals.hasContext` branch must be false.
		await expectSkillGuidance(
			skillModule,
			{
				request: "is it",
				context:
					"The agent operates inside a customer support workflow with defined escalation paths.",
			},
			{
				summaryIncludes: ["Prompt Hierarchy produced"],
				detailIncludes: ["operating context"],
			},
		);
	});

	it("infers autonomous autonomy from hands-off phrasing with no explicit option", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"We want full autonomy for this agent to operate hands-off with strict audit logging",
			},
			{
				summaryIncludes: ["autonomous operation"],
			},
		);
		expect(result.summary).toContain("autonomous operation");
	});

	it("infers delegated autonomy from ownership phrasing with no explicit option", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"The agent should delegate and own the task independently across the workflow",
			},
			{
				summaryIncludes: ["delegated operation"],
			},
		);
		expect(result.summary).toContain("delegated operation");
	});

	it("infers bounded autonomy from guardrail phrasing with no explicit option", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"Apply guardrail and review policy before letting the agent act",
			},
			{
				summaryIncludes: ["bounded operation"],
			},
		);
		expect(result.summary).toContain("bounded operation");
	});

	it("falls back to guided autonomy when no phrasing or option matches", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "Summarize the quarterly report for the leadership team",
			},
			{
				summaryIncludes: ["guided operation"],
			},
		);
		expect(result.summary).toContain("approval gates: omitted");
	});

	it("includes deliverable and constraint guidance and omits fallbacks when disabled", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "Plan the autonomy hierarchy for the deployment agent",
				deliverable: "a signed-off control matrix",
				constraints: [
					"Never bypass the approval gate",
					"Keep audit logs for 90 days",
				],
				successCriteria: "Every escalation path has a named approver",
				options: {
					autonomyLevel: "delegated",
					includeFallbacks: false,
				},
			},
			{
				summaryIncludes: ["approval gates: included", "fallbacks: omitted"],
				detailIncludes: [
					"a signed-off control matrix",
					"Never bypass the approval gate",
					"Every escalation path has a named approver",
				],
			},
		);

		const evalArtifact = result.artifacts?.find(
			(artifact) => artifact.kind === "eval-criteria",
		);
		expect(JSON.stringify(evalArtifact)).toContain(
			"Every escalation path has a named approver",
		);
	});

	it("uses the singular 'guardrail' wording when exactly one detail is produced", async () => {
		// No HIERARCHY_RULES keyword matches, no context, no deliverable,
		// success criteria, or constraints, guided autonomy (approval gates
		// default off), and fallbacks explicitly disabled: only the intro
		// detail line remains, so details.length === 1 (singular wording).
		const result = await skillModule.run(
			{
				request: "Summarize the quarterly numbers for the team",
				options: { includeFallbacks: false },
			},
			createMockSkillRuntime(),
		);
		expect(result.summary).toContain("produced 1 autonomy guardrail for");
		expect(result.summary).not.toContain("guardrails");
	});
});
