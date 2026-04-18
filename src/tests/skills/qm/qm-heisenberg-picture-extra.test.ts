import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/qm/qm-heisenberg-picture.js";
import {
	createMockSkillRuntime,
	expectInsufficientSignalHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("qm-heisenberg-picture-extra", () => {
	it("satisfies the skill module contract", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns insufficient signal for an empty request (line 68-70)", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});

	it("returns insufficient signal when no domain signal is present (line 101-103)", async () => {
		// Request has keywords but no qm/drift/metric domain signal
		const result = await skillModule.run(
			{ request: "help me improve the codebase" },
			createMockSkillRuntime(),
		);
		// Should return an insufficient signal result
		expect(result.recommendations[0]?.title).toContain("Provide more detail");
	});

	it("uses drift analysis mode when specified (line 108 analysisMode branch)", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"How are our metrics drifting over time? Analyse trends and snapshots.",
				options: {
					analysisMode: "drift",
					snapshots: [
						{ complexity: 0.2, coverage: 0.9, coupling: 0.1 },
						{ complexity: 0.4, coverage: 0.8, coupling: 0.2 },
						{ complexity: 0.6, coverage: 0.7, coupling: 0.3 },
					],
				},
			},
			{
				summaryIncludes: ["mode: drift"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("uses commutation analysis mode when specified (line 108 commutation branch)", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"Are our metrics commuting? Analyse correlation and compatibility over time.",
				options: {
					analysisMode: "commutation",
					snapshots: [
						{ complexity: 0.3, coverage: 0.8, coupling: 0.2 },
						{ complexity: 0.5, coverage: 0.6, coupling: 0.4 },
						{ complexity: 0.7, coverage: 0.4, coupling: 0.6 },
					],
				},
			},
			{
				summaryIncludes: ["mode: commutation"],
			},
		);
	});

	it("uses balanced analysis mode by default when not specified (line 110 default)", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"How are our metrics changing over time and which ones are in conflict?",
				options: {
					snapshots: [
						{ complexity: 0.3, coverage: 0.8, coupling: 0.2 },
						{ complexity: 0.5, coverage: 0.7, coupling: 0.4 },
						{ complexity: 0.7, coverage: 0.6, coupling: 0.6 },
					],
				},
			},
			{
				summaryIncludes: ["mode: balanced"],
			},
		);
	});

	it("produces numeric detail when snapshots option is provided (line 124-136)", async () => {
		const result = await skillModule.run(
			{
				request:
					"Show metric drift across snapshots and identify the dominant operator",
				options: {
					snapshots: [
						{ complexity: 0.1, coverage: 0.9 },
						{ complexity: 0.3, coverage: 0.7 },
						{ complexity: 0.5, coverage: 0.5 },
					],
				},
			},
			createMockSkillRuntime(),
		);
		const detailText = result.recommendations.map((r) => r.detail).join("\n");
		// Numeric snapshot analysis should mention "Illustrative Heisenberg reading"
		expect(detailText).toContain("Illustrative Heisenberg reading");
	});

	it("omits numeric detail when no snapshots are provided (line 124 no snapshots branch)", async () => {
		const result = await skillModule.run(
			{
				request:
					"How do metric snapshots trend over time in our codebase history?",
				options: {
					analysisMode: "drift",
				},
			},
			createMockSkillRuntime(),
		);
		const detailText = result.recommendations.map((r) => r.detail).join("\n");
		// No snapshots → no "Illustrative Heisenberg reading" from numeric branch
		expect(detailText).not.toContain("Illustrative Heisenberg reading");
	});

	it("includes fallback static details when no domain rules fire (line 156-162)", async () => {
		// Request uses "metric" and "time" as domain signals but no HEISENBERG_RULES keywords
		// (no drift/trend/correl/commut/conflict/anti-correl/snapshot/history/missing/rename/sparse)
		const result = await skillModule.run(
			{
				request:
					"How do our code quality metrics compare across time in the project?",
				options: { analysisMode: "balanced" },
			},
			createMockSkillRuntime(),
		);
		const detailText = result.recommendations.map((r) => r.detail).join("\n");
		// When no HEISENBERG_RULES fire, static fallback details are added
		expect(detailText).toContain("Collect at least three consistent snapshots");
	});

	it("includes correlation detail when correl keyword is in request (line 108 correl pattern)", async () => {
		const result = await skillModule.run(
			{
				request:
					"Which metrics correlate together and which ones are commuting across snapshots?",
				options: {
					snapshots: [
						{ complexity: 0.3, coverage: 0.8, coupling: 0.2 },
						{ complexity: 0.4, coverage: 0.75, coupling: 0.3 },
						{ complexity: 0.5, coverage: 0.7, coupling: 0.4 },
					],
				},
			},
			createMockSkillRuntime(),
		);
		const detailText = result.recommendations.map((r) => r.detail).join("\n");
		expect(detailText).toContain("strongly positive correlation");
	});

	it("includes conflict detail when trade-off keyword is present (line 110 conflict pattern)", async () => {
		// Use "conflict" and "trade-off" which have word boundaries matching the regex \b(conflict|...|trade.off|...)\b
		const result = await skillModule.run(
			{
				request:
					"Identify metric conflict and trade-off relationships across our time series snapshots",
				options: {
					snapshots: [
						{ complexity: 0.2, coverage: 0.9 },
						{ complexity: 0.5, coverage: 0.6 },
						{ complexity: 0.8, coverage: 0.3 },
					],
				},
			},
			createMockSkillRuntime(),
		);
		const detailText = result.recommendations.map((r) => r.detail).join("\n");
		expect(detailText).toContain("Negative correlation is a trade-off warning");
	});

	it("includes snapshot advisory when sparse/rename keyword is present (line 110 snapshot pattern)", async () => {
		const result = await skillModule.run(
			{
				request:
					"Our snapshot history is missing values and we renamed some metrics — is the drift still valid?",
				options: {
					snapshots: [
						{ complexity: 0.3, coverage: 0.8, coupling: 0.2 },
						{ complexity: 0.5, coverage: 0.7, coupling: 0.4 },
						{ complexity: 0.7, coverage: 0.6, coupling: 0.6 },
					],
				},
			},
			createMockSkillRuntime(),
		);
		const detailText = result.recommendations.map((r) => r.detail).join("\n");
		expect(detailText).toContain("conservative with sparse history");
	});

	it("emits worked example with sample snapshots when no snapshots provided (line 183-185)", async () => {
		const result = await skillModule.run(
			{
				request: "Analyse how metric drift evolves over our snapshot history",
				options: { analysisMode: "balanced" },
			},
			createMockSkillRuntime(),
		);
		const workedExample = result.artifacts?.find(
			(a) => a.kind === "worked-example",
		);
		expect(workedExample).toBeDefined();
		// Should use default sample snapshots when none are provided
		expect(workedExample?.title).toContain("Heisenberg drift worked example");
	});

	it("emits all three artifact types regardless of input", async () => {
		const result = await skillModule.run(
			{
				request:
					"Analyse metric drift across snapshots and identify commuting and non-commuting pairs",
				options: {
					snapshots: [
						{ complexity: 0.1, coverage: 0.9, coupling: 0.1 },
						{ complexity: 0.3, coverage: 0.7, coupling: 0.3 },
						{ complexity: 0.5, coverage: 0.5, coupling: 0.5 },
					],
				},
			},
			createMockSkillRuntime(),
		);
		const kinds = result.artifacts?.map((a) => a.kind) ?? [];
		expect(kinds).toContain("worked-example");
		expect(kinds).toContain("comparison-matrix");
		expect(kinds).toContain("tool-chain");
	});

	it("handles single-metric snapshots without crashing (line 124 single metric)", async () => {
		const result = await skillModule.run(
			{
				request:
					"How is the complexity metric drifting across our snapshots over time?",
				options: {
					snapshots: [
						{ complexity: 0.2 },
						{ complexity: 0.5 },
						{ complexity: 0.8 },
					],
				},
			},
			createMockSkillRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		const detailText = result.recommendations.map((r) => r.detail).join("\n");
		expect(detailText).toContain("Illustrative Heisenberg reading");
	});
});
