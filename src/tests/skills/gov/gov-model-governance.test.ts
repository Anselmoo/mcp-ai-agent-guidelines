import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/gov/gov-model-governance.js";
import {
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("gov-model-governance", () => {
	it("frames lifecycle governance controls", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"pin model versions and control rollout approvals with canary rollback",
				context: "maintain a registry, approval flow, and audit trail",
			},
			{
				summaryIncludes: ["Model Governance produced", "governance guideline"],
				detailIncludes: ["model registry", "audit trail"],
				recommendationCountAtLeast: 2,
			},
		);
	});

	it("returns the full 5-artifact set for a governance request", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"pin model versions and control rollout approvals with canary rollback",
				context: "maintain a registry, approval flow, and audit trail",
				options: {
					lifecycleStage: "pinning",
					deploymentEnvironment: "production",
					versionStrategy: "exact-pin",
				},
			},
			{
				summaryIncludes: ["Model Governance produced"],
				detailIncludes: ["model registry"],
			},
		);

		expect(result.artifacts?.map((a) => a.kind)).toEqual([
			"comparison-matrix",
			"worked-example",
			"output-template",
			"tool-chain",
			"eval-criteria",
		]);
		expect(result.artifacts?.[0]).toMatchObject({
			kind: "comparison-matrix",
			title: "Model Version Pinning Strategies",
		});
		expect(result.artifacts?.[2]).toMatchObject({
			kind: "output-template",
			title: "Model governance policy template",
		});
		expect(result.artifacts?.[3]).toMatchObject({
			kind: "tool-chain",
			title: "Model governance lifecycle",
		});
		expect(result.artifacts?.[4]).toMatchObject({
			kind: "eval-criteria",
			title: "Model governance acceptance criteria",
		});
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});

	it("produces named recommendation titles derived from governance domain concepts", async () => {
		// Verifies that buildNamedRecommendations is used and govGuidanceTitle
		// extracts the concept-level label rather than producing opaque ordinals
		// like "Model governance guidance 1".
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"pin model versions and control rollout approvals with canary rollback",
				context: "maintain a registry, approval flow, and audit trail",
				options: {
					lifecycleStage: "pinning",
					deploymentEnvironment: "production",
					versionStrategy: "exact-pin",
				},
			},
			{
				summaryIncludes: ["Model Governance produced"],
				detailIncludes: ["model registry"],
				recommendationCountAtLeast: 2,
			},
		);

		const titles = result.recommendations?.map((r) => r.title) ?? [];

		// None of the titles should be an opaque ordinal suffix pattern
		for (const title of titles) {
			expect(title).not.toMatch(/^Model governance guidance \d+$/);
		}

		// Lifecycle stage "pinning" injects the VERSION_STRATEGY_GUIDANCE block
		// whose detail starts with "Version pinning governance: ..."
		expect(titles).toContain("Version pinning governance");

		// versionStrategy "exact-pin" injects its guidance starting with "Exact-pin strategy: ..."
		expect(titles).toContain("Exact-pin strategy");

		// deploymentEnvironment "production" injects guidance starting with "Production environment: ..."
		expect(titles).toContain("Production environment");

		// Advisory disclaimer is always last with a fixed label
		expect(titles.at(-1)).toBe("Advisory scope");
	});
});
